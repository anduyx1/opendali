"use server"

import { updateProductStock } from "@/lib/services/products"
import { revalidatePath } from "next/cache"
import { dbPool } from "@/lib/mysql/client"
import type { GoodsReceipt, StockAdjustment } from "@/lib/types/database"
import type { ResultSetHeader, RowDataPacket } from "mysql2"

export async function updateProductStockAction(productId: number, newQuantity: number, oldQuantity: number) {
  const quantityToAdd = newQuantity - oldQuantity
  const success = await updateProductStock(productId, quantityToAdd)

  if (success) {
    // Record stock movement for manual adjustment
    await createStockMovement(productId, quantityToAdd, "adjustment", "Manual stock adjustment")
    revalidatePath("/inventory/management")
    return { success: true, message: "Cập nhật số lượng tồn kho thành công!" }
  } else {
    return { success: false, message: "Lỗi khi cập nhật số lượng tồn kho." }
  }
}

export async function createStockMovement(
  productId: number,
  quantityChange: number,
  movementType: string,
  reason: string,
) {
  const mysql = dbPool
  if (!mysql) {
    console.error("MySQL client not available for stock movement.")
    return false
  }
  try {
    await mysql.execute(
      `INSERT INTO stock_movements (product_id, quantity_change, movement_type, reason)
     VALUES (?, ?, ?, ?)`, // Corrected 'type' to 'movement_type'
      [productId, quantityChange, movementType, reason],
    )
    console.log(`Stock movement recorded: Product ID ${productId}, Change ${quantityChange}, Type ${movementType}`)
    return true
  } catch (error) {
    console.error("Error recording stock movement:", error)
    return false
  }
}

// New action for creating a goods receipt
export async function createGoodsReceiptAction(goodsReceipt: GoodsReceipt) {
  const mysql = dbPool
  try {
    await mysql.beginTransaction()

    // Insert into goods_receipts table
    const [receiptResult] = await mysql.execute<ResultSetHeader>(
      `INSERT INTO goods_receipts (supplier_id, receipt_date, total_amount, notes) VALUES (?, ?, ?, ?)`,
      [goodsReceipt.supplierId, goodsReceipt.receiptDate, goodsReceipt.totalAmount, goodsReceipt.notes],
    )
    const receiptId = receiptResult.insertId

    // Insert into goods_receipt_items and update product stock
    for (const item of goodsReceipt.items) {
      await mysql.execute(
        `INSERT INTO goods_receipt_items (receipt_id, product_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)`,
        [receiptId, item.productId, item.quantity, item.unitPrice, item.quantity * item.unitPrice],
      )

      // Update product stock
      await mysql.execute(`UPDATE products SET stock_quantity = stock_quantity + ? WHERE product_id = ?`, [
        item.quantity,
        item.productId,
      ])
    }

    await mysql.commit()
    return { success: true, message: "Phiếu nhập hàng đã được tạo thành công." }
  } catch (error) {
    await mysql.rollback()
    console.error("Lỗi khi tạo phiếu nhập hàng:", error)
    return { success: false, error: "Không thể tạo phiếu nhập hàng." }
  } finally {
    // Pool doesn't have release method, connection is automatically returned
  }
}

// New action for creating a stock adjustment
export async function createStockAdjustmentAction(adjustment: StockAdjustment) {
  const mysql = dbPool
  try {
    await mysql.beginTransaction()

    // Insert into stock_adjustments table
    await mysql.execute<ResultSetHeader>(
      `INSERT INTO stock_adjustments (product_id, adjustment_type, quantity_change, reason, adjustment_date) VALUES (?, ?, ?, ?, ?)`,
      [
        adjustment.productId,
        adjustment.adjustmentType,
        adjustment.quantityChange,
        adjustment.reason,
        adjustment.adjustmentDate,
      ],
    )

    // Update product stock based on adjustment type
    if (adjustment.adjustmentType === "increase") {
      await mysql.execute(`UPDATE products SET stock_quantity = stock_quantity + ? WHERE product_id = ?`, [
        adjustment.quantityChange,
        adjustment.productId,
      ])
    } else if (adjustment.adjustmentType === "decrease") {
      await mysql.execute(`UPDATE products SET stock_quantity = stock_quantity - ? WHERE product_id = ?`, [
        adjustment.quantityChange,
        adjustment.productId,
      ])
    }

    await mysql.commit()
    return { success: true, message: "Điều chỉnh kho đã được tạo thành công." }
  } catch (error) {
    await mysql.rollback()
    console.error("Lỗi khi tạo điều chỉnh kho:", error)
    return { success: false, error: "Không thể tạo điều chỉnh kho." }
  } finally {
    // Pool doesn't have release method, connection is automatically returned
  }
}

export async function getGoodsReceipts() {
  const mysql = dbPool
  try {
    const [rows] = await mysql.execute<RowDataPacket[]>(`
      SELECT gr.*, s.supplier_name
      FROM goods_receipts gr
      LEFT JOIN suppliers s ON gr.supplier_id = s.supplier_id
      ORDER BY gr.receipt_date DESC
    `)
    return rows as GoodsReceipt[]
  } catch (error) {
    console.error("Lỗi khi lấy danh sách phiếu nhập hàng:", error)
    return []
  } finally {
    // Pool doesn't have release method, connection is automatically returned
  }
}

export async function getStockAdjustments() {
  const mysql = dbPool
  try {
    const [rows] = await mysql.execute<RowDataPacket[]>(`
      SELECT sa.*, p.product_name
      FROM stock_adjustments sa
      LEFT JOIN products p ON sa.product_id = p.product_id
      ORDER BY sa.adjustment_date DESC
    `)
    return rows as StockAdjustment[]
  } catch (error) {
    console.error("Lỗi khi lấy danh sách điều chỉnh kho:", error)
    return []
  } finally {
    // Pool doesn't have release method, connection is automatically returned
  }
}
