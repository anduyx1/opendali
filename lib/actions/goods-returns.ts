"use server"

import { getConnection } from "@/lib/mysql/client"
import { revalidatePath } from "next/cache"
import type { ResultSetHeader, RowDataPacket, FieldPacket } from "mysql2"

export interface GoodsReturnData {
  goodsReceiptId: number
  supplierName: string
  branch: string
  staff: string
  returnReason?: string
  items: {
    productId: number
    quantity: number
    unitPrice: number
    receiptItemId?: number // Added receiptItemId for tracking
  }[]
}

interface GoodsReceiptRow extends RowDataPacket {
  id: number
  receipt_code: string
  supplier_name?: string
  supplier?: string
  supplier_phone?: string
  branch?: string
  staff: string
  status: string
}

interface GoodsReceiptItemRow extends RowDataPacket {
  id: number
  product_id: number
  product_name: string
  sku: string
  image_url: string
  quantity: number
  returned_quantity: number
  unit_price: number
  total_amount: number
}

export async function createGoodsReturn(data: GoodsReturnData) {
  const connection = await getConnection()

  try {
    await connection.beginTransaction()

    // Generate return code
    const returnCode = `RTN${Date.now().toString().slice(-6)}`

    // Calculate totals
    const totalQuantity = data.items.reduce((sum, item) => sum + item.quantity, 0)
    const totalAmount = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)

    // Create goods return record
    const [returnResult] = (await connection.execute(
      `INSERT INTO goods_returns 
       (return_code, goods_receipt_id, supplier_name, branch, staff, return_reason, total_quantity, total_amount, refund_amount, status, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
      [
        returnCode,
        data.goodsReceiptId,
        data.supplierName,
        data.branch,
        data.staff,
        data.returnReason || "",
        totalQuantity,
        totalAmount,
        totalAmount, // refund_amount = total_amount initially
      ],
    )) as [ResultSetHeader, FieldPacket[]]

    const returnId = returnResult.insertId

    // Create return items and update stock
    for (const item of data.items) {
      // Insert return item with receipt_item_id if available
      await connection.execute(
        `INSERT INTO goods_return_items 
         (return_id, product_id, quantity, unit_price, total_amount, receipt_item_id) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          returnId,
          item.productId,
          item.quantity,
          item.unitPrice,
          item.quantity * item.unitPrice,
          item.receiptItemId || null,
        ],
      )

      // Update stock (subtract returned quantity)
      await connection.execute(
        `UPDATE products 
         SET stock_quantity = stock_quantity - ?, updated_at = NOW() 
         WHERE id = ?`,
        [item.quantity, item.productId],
      )

      // Record stock movement
      await connection.execute(
        `INSERT INTO stock_movements 
         (product_id, movement_type, quantity_change, reason, created_at) 
         VALUES (?, 'out', ?, ?, NOW())`,
        [item.productId, item.quantity, `Hoàn trả ${returnCode}`],
      )
    }

    await connection.commit()
    revalidatePath("/inventory/goods-receipt")

    return {
      success: true,
      returnId,
      returnCode,
      message: "Đã tạo phiếu hoàn trả thành công",
    }
  } catch (error) {
    await connection.rollback()
    console.error("Error creating goods return:", error)
    return {
      success: false,
      error: "Không thể tạo phiếu hoàn trả",
    }
  } finally {
    connection.release()
  }
}

export async function getGoodsReceiptForReturn(receiptId: number) {
  const connection = await getConnection()

  try {
    // Get receipt info
    const [receiptRows] = (await connection.execute(
      `SELECT gr.*, s.name as supplier_name, s.phone as supplier_phone
       FROM goods_receipts gr
       LEFT JOIN suppliers s ON gr.supplier_id = s.id
       WHERE gr.id = ?`,
      [receiptId],
    )) as [GoodsReceiptRow[], FieldPacket[]]

    if (receiptRows.length === 0) {
      return { success: false, error: "Không tìm thấy đơn nhập hàng" }
    }

    const receipt = receiptRows[0]

    const [itemRows] = (await connection.execute(
      `SELECT 
         gri.*,
         p.name as product_name, 
         p.sku, 
         p.image_url,
         COALESCE(SUM(grit.quantity), 0) as returned_quantity
       FROM goods_receipt_items gri
       JOIN products p ON gri.product_id = p.id
       LEFT JOIN goods_return_items grit ON grit.product_id = gri.product_id 
         AND grit.return_id IN (
           SELECT id FROM goods_returns WHERE goods_receipt_id = ?
         )
       WHERE gri.receipt_id = ?
       GROUP BY gri.id, p.id
       ORDER BY gri.id`,
      [receiptId, receiptId],
    )) as [GoodsReceiptItemRow[], FieldPacket[]]

    return {
      success: true,
      data: {
        id: Number(receipt.id),
        receiptCode: receipt.receipt_code,
        supplierName: receipt.supplier_name || receipt.supplier,
        supplierPhone: receipt.supplier_phone || "",
        branch: receipt.branch || "Chi nhánh mặc định",
        staff: receipt.staff,
        status: receipt.status,
        items: itemRows.map((item) => ({
          id: Number(item.id),
          productId: Number(item.product_id),
          productName: item.product_name,
          sku: item.sku,
          imageUrl: item.image_url,
          quantity: Number(item.quantity),
          returnedQuantity: Number(item.returned_quantity), // Added returned quantity
          unitPrice: Number(item.unit_price),
          totalAmount: Number(item.total_amount),
        })),
      },
    }
  } catch (error) {
    console.error("Error fetching goods receipt for return:", error)
    return { success: false, error: "Không thể lấy thông tin đơn nhập hàng" }
  } finally {
    connection.release()
  }
}
