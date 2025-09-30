"use server"

import { updateProductStock } from "@/lib/services/products"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { GoodsReceipt, StockAdjustment } from "@/lib/types/database"

export async function updateProductStockAction(productId: number, newQuantity: number, oldQuantity: number) {
  const quantityToAdd = newQuantity - oldQuantity

  try {
    await updateProductStock(productId, quantityToAdd)

    // Record stock movement for manual adjustment
    await createStockMovement(productId, quantityToAdd, "adjustment", "Manual stock adjustment")
    revalidatePath("/inventory/management")
    return { success: true, message: "Cập nhật số lượng tồn kho thành công!" }
  } catch (error) {
    console.error("Error updating product stock:", error)
    return { success: false, message: "Lỗi khi cập nhật số lượng tồn kho." }
  }
}

export async function createStockMovement(
  productId: number,
  quantityChange: number,
  movementType: string,
  reason: string,
) {
  const supabase = createClient()

  try {
    const { error } = await supabase
      .from("stock_movements")
      .insert({
        product_id: productId,
        quantity_change: quantityChange,
        movement_type: movementType,
        reason: reason,
      })

    if (error) {
      console.error("Error recording stock movement:", error)
      return false
    }

    console.log(`Stock movement recorded: Product ID ${productId}, Change ${quantityChange}, Type ${movementType}`)
    return true
  } catch (error) {
    console.error("Error recording stock movement:", error)
    return false
  }
}

export async function createGoodsReceiptAction(goodsReceipt: GoodsReceipt) {
  const supabase = createClient()

  try {
    // Create the goods receipt record
    const { data: receiptData, error: receiptError } = await supabase
      .from("goods_receipts")
      .insert({
        supplier_id: goodsReceipt.supplierId,
        receipt_date: goodsReceipt.receiptDate || new Date().toISOString().split('T')[0],
        total_amount: goodsReceipt.totalAmount || 0,
        notes: goodsReceipt.notes,
        tags: goodsReceipt.tags,
      })
      .select()
      .single()

    if (receiptError) {
      throw receiptError
    }

    // Create goods receipt items and update stock
    for (const item of goodsReceipt.items) {
      // Insert goods receipt item
      const { error: itemError } = await supabase
        .from("goods_receipt_items")
        .insert({
          goods_receipt_id: receiptData.id,
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          discount: item.discount,
        })

      if (itemError) {
        throw itemError
      }

      // Update product stock
      await updateProductStock(item.productId, item.quantity)

      // Record stock movement
      await createStockMovement(
        item.productId,
        item.quantity,
        "import",
        `Goods Receipt #${receiptData.id}`
      )
    }

    revalidatePath("/inventory/goods-receipt")
    return {
      success: true,
      message: "Tạo phiếu nhập hàng thành công!",
      receiptId: receiptData.id,
    }
  } catch (error) {
    console.error("Error creating goods receipt:", error)
    return {
      success: false,
      message: "Lỗi khi tạo phiếu nhập hàng.",
      error: (error as Error).message,
    }
  }
}

export async function createStockAdjustmentAction(adjustments: StockAdjustment[]) {
  const supabase = createClient()

  try {
    for (const adjustment of adjustments) {
      // Update product stock
      const quantityChange = adjustment.adjustmentType === "decrease"
        ? -adjustment.quantityChange
        : adjustment.quantityChange

      await updateProductStock(adjustment.productId, quantityChange)

      // Record stock movement
      await createStockMovement(
        adjustment.productId,
        quantityChange,
        adjustment.adjustmentType === "initial_stock" ? "import" : "adjustment",
        adjustment.reason || `Stock ${adjustment.adjustmentType}`
      )
    }

    revalidatePath("/inventory/stock-adjustments")
    return {
      success: true,
      message: "Điều chỉnh kho thành công!",
    }
  } catch (error) {
    console.error("Error creating stock adjustment:", error)
    return {
      success: false,
      message: "Lỗi khi điều chỉnh kho.",
      error: (error as Error).message,
    }
  }
}

export async function getStockMovements(productId?: number) {
  const supabase = createClient()

  try {
    let query = supabase
      .from("stock_movements")
      .select(`
        *,
        products:products(name)
      `)
      .order("created_at", { ascending: false })

    if (productId) {
      query = query.eq("product_id", productId)
    }

    const { data: movements, error } = await query

    if (error) {
      throw error
    }

    return (movements || []).map((movement: any) => ({
      id: movement.id,
      product_id: movement.product_id,
      quantity_change: movement.quantity_change,
      movement_type: movement.movement_type,
      reason: movement.reason,
      created_by: movement.created_by,
      created_at: new Date(movement.created_at),
      product_name: movement.products?.name,
    }))
  } catch (error) {
    console.error("Error fetching stock movements:", error)
    throw error
  }
}