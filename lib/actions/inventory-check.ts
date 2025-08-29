"use server"

import { dbPool } from "@/lib/mysql/client"
import { revalidatePath } from "next/cache"
import type { RowDataPacket, ResultSetHeader } from "mysql2"

interface ProductRow extends RowDataPacket {
  id: number
  name: string
  sku?: string
  barcode?: string
  stock_quantity: number
  image_url?: string
}

interface InventoryCheckItemRow extends RowDataPacket {
  id: number
  session_id: number
  product_id: number
  system_quantity: number
  actual_quantity?: number
  difference: number
  reason?: string
  notes?: string
  status: string
  product_name: string
  product_sku?: string
  product_barcode?: string
  product_image?: string
}

interface SessionRow extends RowDataPacket {
  id: number
  session_code: string
  branch_id?: number
  branch_name?: string
  staff_id?: number
  staff_name?: string
  status: string
  notes?: string
  tags?: string
  created_at: string
  updated_at: string
  balanced_at?: string
  balanced_by?: string
}

export interface InventoryCheckSession {
  id: number
  session_code: string
  branch_id?: number
  branch_name?: string
  staff_id?: number
  staff_name?: string
  status: "draft" | "in_progress" | "completed" | "balanced"
  notes?: string
  tags?: string
  created_at: string
  updated_at: string
  balanced_at?: string
  balanced_by?: string
}

export interface InventoryCheckItem {
  id: number
  session_id: number
  product_id: number
  product_name: string
  product_sku?: string
  product_barcode?: string
  system_quantity: number
  actual_quantity?: number
  difference: number
  reason?: string
  notes?: string
  status: "pending" | "matched" | "discrepancy"
  product_image?: string
}

export async function createInventoryCheckSession(data: {
  branch_name?: string
  staff_name?: string
  notes?: string
  tags?: string
}) {
  try {
    const connection = await dbPool.getConnection()

    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "")
    const timeStr = now.getHours().toString().padStart(2, "0") + now.getMinutes().toString().padStart(2, "0")
    const sessionCode = `IAN${dateStr}${timeStr}`

    // Sử dụng giá trị mặc định nếu không có thông tin
    const branchName = data.branch_name?.trim() || "Chi nhánh mặc định"
    const staffName = data.staff_name?.trim() || "Nhân viên hệ thống"
    const notes = data.notes ? data.notes.trim() : ""
    const tags = data.tags ? data.tags.trim() : ""

    console.log(`🏪 [SERVER] Creating session with:`, { branchName, staffName, sessionCode })

    const [result] = await connection.execute(
      `INSERT INTO inventory_check_sessions 
       (session_code, branch_name, staff_name, status, notes, tags, created_at) 
       VALUES (?, ?, ?, 'draft', ?, ?, NOW())`,
      [sessionCode, branchName, staffName, notes, tags],
    )

    connection.release()

    const insertResult = result as ResultSetHeader
    revalidatePath("/inventory-check")

    console.log(`✅ [SERVER] Session created successfully:`, { sessionId: insertResult.insertId, sessionCode })

    return {
      success: true,
      sessionId: insertResult.insertId,
      sessionCode,
    }
  } catch (error) {
    console.error("❌ [SERVER] Error creating inventory check session:", error)
    return { success: false, error: "Không thể tạo phiếu kiểm hàng" }
  }
}

export async function searchProductsOnly(query: string) {
  try {
    // Validate parameters
    if (!query || query.trim() === "") {
      return { success: true, data: [] }
    }

    const connection = await dbPool.getConnection()
    const searchQuery = query.trim()

    // Tìm sản phẩm theo tên, SKU hoặc barcode
    const [rows] = await connection.execute(
      `
      SELECT p.id, p.name, p.sku, p.barcode, COALESCE(p.stock_quantity, 0) as stock_quantity, p.image_url
      FROM products p
      WHERE (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ? OR p.barcode = ?)
      ORDER BY 
        CASE 
          WHEN p.barcode = ? THEN 1
          WHEN p.sku = ? THEN 2
          WHEN p.name LIKE ? THEN 3
          ELSE 4
        END,
        p.name
      LIMIT 20
    `,
      [
        `%${searchQuery}%`,
        `%${searchQuery}%`,
        `%${searchQuery}%`,
        searchQuery, // Tìm kiếm chính xác barcode
        searchQuery, // Sắp xếp ưu tiên barcode chính xác
        searchQuery, // Sắp xếp ưu tiên SKU chính xác
        `%${searchQuery}%`, // Sắp xếp ưu tiên tên chứa từ khóa
      ],
    )

    connection.release()
    return { success: true, data: rows }
  } catch (error) {
    console.error("Error searching products:", error)
    return { success: false, error: "Không thể tìm kiếm sản phẩm" }
  }
}

export async function addProductToInventoryCheck(sessionId: number, productId: number) {
  try {
    // Validate parameters
    if (!sessionId || isNaN(sessionId)) {
      return { success: false, error: "Session ID không hợp lệ" }
    }

    if (!productId || isNaN(productId)) {
      return { success: false, error: "Product ID không hợp lệ" }
    }

    const connection = await dbPool.getConnection()

    // Lấy thông tin sản phẩm
    const [productRows] = await connection.execute("SELECT stock_quantity FROM products WHERE id = ?", [productId])

    const products = productRows as ProductRow[]
    if (products.length === 0) {
      connection.release()
      return { success: false, error: "Không tìm thấy sản phẩm" }
    }

    const systemQuantity = products[0].stock_quantity || 0

    // Thêm vào phiếu kiểm
    await connection.execute(
      `
      INSERT INTO inventory_check_items 
      (session_id, product_id, system_quantity, status, created_at)
      VALUES (?, ?, ?, 'pending', NOW())
    `,
      [sessionId, productId, systemQuantity],
    )

    connection.release()
    revalidatePath(`/inventory-check/${sessionId}`)

    return { success: true }
  } catch (error) {
    console.error("Error adding product to inventory check:", error)
    return { success: false, error: "Không thể thêm sản phẩm vào phiếu kiểm" }
  }
}

export async function updateInventoryCheckItemByProduct(
  sessionId: number,
  productId: number,
  actualQuantity: number,
  reason?: string,
  notes?: string,
) {
  try {
    console.log(
      `[UPDATE_BY_PRODUCT] Starting update for session ${sessionId}, product ${productId} with quantity ${actualQuantity}`,
    )

    if (!sessionId || isNaN(Number(sessionId))) {
      console.error(`[UPDATE_BY_PRODUCT] Invalid session ID: ${sessionId}`)
      return { success: false, error: "Session ID không hợp lệ" }
    }

    if (!productId || isNaN(Number(productId))) {
      console.error(`[UPDATE_BY_PRODUCT] Invalid product ID: ${productId}`)
      return { success: false, error: "Product ID không hợp lệ" }
    }

    if (actualQuantity === null || actualQuantity === undefined || isNaN(Number(actualQuantity))) {
      console.error(`[UPDATE_BY_PRODUCT] Invalid actual quantity: ${actualQuantity}`)
      return { success: false, error: "Số lượng thực tế không hợp lệ" }
    }

    const validSessionId = Number(sessionId)
    const validProductId = Number(productId)
    const validActualQuantity = Number(actualQuantity)
    const validReason = reason ? reason.trim() : ""
    const validNotes = notes ? notes.trim() : ""

    console.log(`[UPDATE_BY_PRODUCT] Validated params:`, {
      sessionId: validSessionId,
      productId: validProductId,
      actualQuantity: validActualQuantity,
      reason: validReason,
      notes: validNotes,
    })

    const connection = await dbPool.getConnection()

    // Tìm item theo sessionId và productId
    const [itemRows] = await connection.execute(
      "SELECT id, system_quantity FROM inventory_check_items WHERE session_id = ? AND product_id = ?",
      [validSessionId, validProductId],
    )

    const items = itemRows as InventoryCheckItemRow[]
    if (items.length === 0) {
      console.error(`[UPDATE_BY_PRODUCT] Item not found for session ${validSessionId}, product ${validProductId}`)
      connection.release()
      return { success: false, error: "Không tìm thấy item trong phiếu kiểm" }
    }

    const item = items[0]
    const systemQuantity = Number(item.system_quantity) || 0
    const difference = validActualQuantity - systemQuantity
    const status = difference === 0 ? "matched" : "discrepancy"

    console.log(`[UPDATE_BY_PRODUCT] Found item ${item.id}, calculated values:`, {
      systemQuantity,
      difference,
      status,
    })

    const [updateResult] = await connection.execute(
      `
      UPDATE inventory_check_items 
      SET actual_quantity = ?, difference = ?, reason = ?, notes = ?, status = ?, updated_at = NOW()
      WHERE id = ?
    `,
      [validActualQuantity, difference, validReason, validNotes, status, item.id],
    )

    console.log(`[UPDATE_BY_PRODUCT] Update result:`, updateResult)

    connection.release()
    revalidatePath("/inventory-check")

    console.log(`[UPDATE_BY_PRODUCT] Successfully updated item ${item.id}`)
    return { success: true }
  } catch (error) {
    console.error("[UPDATE_BY_PRODUCT] Error updating inventory check item:", error)
    return { success: false, error: "Không thể cập nhật item" }
  }
}

export async function balanceInventoryCheck(sessionId: number, balancedBy: string) {
  try {
    console.log(`🔄 [SERVER] Starting balance inventory for session ${sessionId} by ${balancedBy}`)

    if (!sessionId || isNaN(Number(sessionId))) {
      console.error(`❌ [SERVER] Invalid session ID: ${sessionId}`)
      return { success: false, error: "Session ID không hợp lệ" }
    }

    if (!balancedBy || balancedBy.trim() === "") {
      console.error(`❌ [SERVER] Missing balanced by: ${balancedBy}`)
      return { success: false, error: "Thiếu thông tin người cân bằng" }
    }

    const validSessionId = Number(sessionId)
    const validBalancedBy = balancedBy.trim()

    console.log(`✅ [SERVER] Validated params:`, { sessionId: validSessionId, balancedBy: validBalancedBy })

    const connection = await dbPool.getConnection()

    try {
      await connection.beginTransaction()
      console.log(`🚀 [SERVER] Transaction started for session ${validSessionId}`)

      const [itemRows] = await connection.execute(
        `
        SELECT product_id, actual_quantity, difference, system_quantity
        FROM inventory_check_items 
        WHERE session_id = ? AND actual_quantity IS NOT NULL
      `,
        [validSessionId],
      )

      const items = itemRows as InventoryCheckItemRow[]
      console.log(`📦 [SERVER] Found ${items.length} items to update:`, items)

      if (items.length === 0) {
        console.warn(`⚠️ [SERVER] No items found to update for session ${validSessionId}`)
        await connection.rollback()
        connection.release()
        return { success: false, error: "Không có sản phẩm nào để cân bằng" }
      }

      let updatedCount = 0
      for (const item of items) {
        console.log(
          `🔄 [SERVER] Updating product ${item.product_id}: ${item.system_quantity} -> ${item.actual_quantity}`,
        )

        const [updateResult] = await connection.execute("UPDATE products SET stock_quantity = ? WHERE id = ?", [
          item.actual_quantity,
          item.product_id,
        ])

        console.log(`✅ [SERVER] Product ${item.product_id} update result:`, updateResult)
        updatedCount++
      }

      // Cập nhật trạng thái phiếu kiểm
      const [sessionResult] = await connection.execute(
        `
        UPDATE inventory_check_sessions 
        SET status = 'balanced', balanced_at = NOW(), balanced_by = ?
        WHERE id = ?
      `,
        [validBalancedBy, validSessionId],
      )

      console.log(`📋 [SERVER] Session update result:`, sessionResult)
      console.log(`🎉 [SERVER] Successfully updated ${updatedCount} products`)

      await connection.commit()
      console.log(`✅ [SERVER] Transaction committed successfully`)

      revalidatePath("/inventory-check")
      revalidatePath(`/inventory-check/${validSessionId}`)

      const successMessage = `Đã cân bằng kho thành công cho ${updatedCount} sản phẩm`
      console.log(`🎯 [SERVER] Balance completed: ${successMessage}`)

      return {
        success: true,
        message: successMessage,
      }
    } catch (error) {
      console.error(`💥 [SERVER] Error during transaction:`, error)
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error("💥 [SERVER] Error balancing inventory:", error)
    return {
      success: false,
      error: `Không thể cân bằng kho: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

export async function getInventoryCheckSessions() {
  try {
    const connection = await dbPool.getConnection()

    const [rows] = await connection.execute(`
      SELECT * FROM inventory_check_sessions 
      ORDER BY created_at DESC
    `)

    connection.release()
    return { success: true, data: rows as InventoryCheckSession[] }
  } catch (error) {
    console.error("Error fetching inventory check sessions:", error)
    return { success: false, error: "Không thể tải danh sách phiếu kiểm hàng" }
  }
}

export async function getInventoryCheckDetail(sessionId: number) {
  try {
    if (!sessionId || isNaN(Number(sessionId))) {
      return { success: false, error: "Session ID không hợp lệ" }
    }

    const connection = await dbPool.getConnection()

    // Lấy thông tin session
    const [sessionRows] = await connection.execute(`SELECT * FROM inventory_check_sessions WHERE id = ?`, [sessionId])

    const sessions = sessionRows as SessionRow[]
    if (sessions.length === 0) {
      connection.release()
      return { success: false, error: "Không tìm thấy phiếu kiểm hàng" }
    }

    const session = sessions[0]

    // Lấy danh sách items với thông tin sản phẩm
    const [itemRows] = await connection.execute(
      `
      SELECT 
        ici.id,
        ici.product_id,
        ici.system_quantity,
        ici.actual_quantity,
        ici.difference,
        ici.reason,
        ici.notes,
        ici.status,
        p.name as product_name,
        p.sku as product_sku,
        p.barcode as product_barcode,
        p.image_url as product_image
      FROM inventory_check_items ici
      JOIN products p ON ici.product_id = p.id
      WHERE ici.session_id = ?
      ORDER BY ici.created_at ASC
      `,
      [sessionId],
    )

    connection.release()

    const items = itemRows as InventoryCheckItemRow[]

    return {
      success: true,
      data: {
        session,
        items,
      },
    }
  } catch (error) {
    console.error("Error fetching inventory check detail:", error)
    return { success: false, error: "Không thể tải chi tiết phiếu kiểm hàng" }
  }
}

// Export aliases for compatibility
export const addProductToCheck = addProductToInventoryCheck
export const updateProductActualStock = updateInventoryCheckItemByProduct
export const balanceInventory = balanceInventoryCheck

export async function updateInventoryCheckSession(
  sessionId: number,
  data: {
    status?: string
    notes?: string
    tags?: string
    balanced_by?: string
  },
) {
  try {
    if (!sessionId || isNaN(Number(sessionId))) {
      return { success: false, error: "Session ID không hợp lệ" }
    }

    const connection = await dbPool.getConnection()

    // Tạo câu query động dựa trên dữ liệu được cung cấp
    const updateFields: string[] = []
    const updateValues: (string | number)[] = []

    if (data.status) {
      updateFields.push("status = ?")
      updateValues.push(data.status)
    }

    if (data.notes !== undefined) {
      updateFields.push("notes = ?")
      updateValues.push(data.notes.trim())
    }

    if (data.tags !== undefined) {
      updateFields.push("tags = ?")
      updateValues.push(data.tags.trim())
    }

    if (data.balanced_by) {
      updateFields.push("balanced_by = ?")
      updateValues.push(data.balanced_by.trim())
      updateFields.push("balanced_at = NOW()")
    }

    updateFields.push("updated_at = NOW()")
    updateValues.push(sessionId)

    if (updateFields.length === 1) {
      // Chỉ có updated_at
      connection.release()
      return { success: false, error: "Không có dữ liệu để cập nhật" }
    }

    const query = `UPDATE inventory_check_sessions SET ${updateFields.join(", ")} WHERE id = ?`

    console.log("🔄 Updating session:", { sessionId, query, values: updateValues })

    const [result] = await connection.execute(query, updateValues)

    connection.release()
    revalidatePath("/inventory-check")
    revalidatePath(`/inventory-check/${sessionId}`)

    console.log("✅ Session updated successfully:", result)

    return { success: true }
  } catch (error) {
    console.error("❌ Error updating inventory check session:", error)
    return { success: false, error: "Không thể cập nhật phiếu kiểm hàng" }
  }
}

export async function getProductsWithPagination(page = 1, limit = 20, search?: string) {
  try {
    const offset = (page - 1) * limit
    const connection = await dbPool.getConnection()

    let whereClause = ""
    let queryParams: (string | number)[] = []

    if (search && search.trim()) {
      whereClause = "WHERE (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)"
      const searchTerm = `%${search.trim()}%`
      queryParams = [searchTerm, searchTerm, searchTerm]
    }

    // Lấy tổng số sản phẩm
    const [countRows] = await connection.execute(`SELECT COUNT(*) as total FROM products p ${whereClause}`, queryParams)

    const totalCount = (countRows as RowDataPacket[])[0].total as number
    const totalPages = Math.ceil(totalCount / limit)

    // Lấy danh sách sản phẩm với pagination
    const [productRows] = await connection.execute(
      `
      SELECT p.id, p.name, p.sku, p.barcode, COALESCE(p.stock_quantity, 0) as stock_quantity, p.image_url
      FROM products p
      ${whereClause}
      ORDER BY p.created_at DESC, p.name ASC
      LIMIT ? OFFSET ?
      `,
      [...queryParams, limit, offset],
    )

    connection.release()

    return {
      success: true,
      data: productRows,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    }
  } catch (error) {
    console.error("Error fetching products with pagination:", error)
    return { success: false, error: "Không thể tải danh sách sản phẩm" }
  }
}
