"use server"

import { unstable_noStore as noStore } from "next/cache"
import { getMysqlClient } from "@/lib/mysql/client" // Changed to getMysqlClient
import type { StockMovement, StockMovementType } from "@/lib/types/database"
import type { MutationResult } from "@/lib/services/products" // Assuming MutationResult is defined here or in a common type file
import type { ResultSetHeader, RowDataPacket } from "mysql2"

interface StockMovementRow extends RowDataPacket {
  id: number
  product_id: number
  product_name: string
  product_barcode: string | null
  product_sku: string | null
  quantity_change: number
  type: StockMovementType
  reason: string | null
  created_at: Date
}

export async function createStockMovement(
  productId: number,
  quantityChange: number,
  type: StockMovementType,
  reason?: string,
): Promise<MutationResult<StockMovement | null>> {
  const mysql = getMysqlClient() // Use getMysqlClient
  if (!mysql) {
    return { success: false, error: "Database connection not available." }
  }

  try {
    const [result] = await mysql.execute(
      `INSERT INTO stock_movements (product_id, quantity_change, type, reason)
       VALUES (?, ?, ?, ?)`,
      [productId, quantityChange, type, reason || null],
    )
    const newId = (result as ResultSetHeader).insertId
    const [rows] = await mysql.execute(`SELECT * FROM stock_movements WHERE id = ?`, [newId])
    const newMovement = (rows as StockMovementRow[])[0]
    return { success: true, data: {
      id: newMovement.id,
      product_id: newMovement.product_id,
      movement_type: newMovement.type,
      quantity_change: newMovement.quantity_change,
      reason: newMovement.reason,
      created_at: new Date(newMovement.created_at),
      created_by: null,
    } as StockMovement }
  } catch (error: unknown) {
    console.error("Error creating stock movement:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to create stock movement."
    return { success: false, error: errorMessage }
  }
}

export async function getStockMovements(
  productId?: number,
  type?: StockMovementType,
  startDate?: string,
  endDate?: string,
): Promise<StockMovement[]> {
  noStore()
  const mysql = getMysqlClient() // Use getMysqlClient
  if (!mysql) {
    console.warn("MySQL connection pool not available, returning empty stock movements.")
    return []
  }

  let query = `
    SELECT sm.*, p.name as product_name, p.barcode as product_barcode, p.sku as product_sku
    FROM stock_movements sm
    JOIN products p ON sm.product_id = p.id
    WHERE 1=1
  `
  const params: (number | string)[] = []

  if (productId) {
    query += ` AND sm.product_id = ?`
    params.push(productId)
  }
  if (type && type !== "all" as StockMovementType) {
    query += ` AND sm.type = ?`
    params.push(type)
  }
  if (startDate) {
    query += ` AND sm.created_at >= ?`
    params.push(startDate)
  }
  if (endDate) {
    query += ` AND sm.created_at <= ?`
    params.push(endDate)
  }

  query += ` ORDER BY sm.created_at DESC`

  try {
    const [rows] = await mysql.execute(query, params)
    return (rows as StockMovementRow[]).map((row) => ({
      id: row.id,
      product_id: row.product_id,
      movement_type: row.type,
      quantity_change: row.quantity_change,
      reason: row.reason,
      created_at: new Date(row.created_at),
      created_by: null,
    }))
  } catch (error) {
    console.error("Error fetching stock movements:", error)
    return []
  }
}
