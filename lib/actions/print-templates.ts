"use server" // Đảm bảo dòng này ở đầu file

import { dbPool } from "@/lib/mysql/client"
import type { PrintTemplate } from "@/lib/types/database"
import type { RowDataPacket } from "mysql2"

interface PrintTemplateRow extends RowDataPacket {
  id: string
  name: string
  content: string
  type: "receipt" | "pre_receipt"
  is_default: boolean
  created_at: string
  updated_at: string
}

export async function getAllPrintTemplates(): Promise<PrintTemplate[]> {
  const connection = await dbPool.getConnection()
  try {
    const [rows] = await connection.execute<PrintTemplateRow[]>("SELECT * FROM print_templates ORDER BY created_at DESC")
    return rows.map(row => ({
      ...row,
      id: Number(row.id), // Convert string to number
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    })) as PrintTemplate[]
  } catch (error) {
    console.error("Error fetching print templates:", error)
    return []
  } finally {
    connection.release()
  }
}

export async function getPrintTemplateByType(type: "receipt" | "pre_receipt"): Promise<PrintTemplate | null> {
  const connection = await dbPool.getConnection()
  try {
    const [rows] = await connection.execute<PrintTemplateRow[]>(
      "SELECT * FROM print_templates WHERE type = ? AND is_default = TRUE LIMIT 1",
      [type],
    )
    return rows[0] ? {
      ...rows[0],
      id: Number(rows[0].id), // Convert string to number
      created_at: new Date(rows[0].created_at),
      updated_at: new Date(rows[0].updated_at),
    } as PrintTemplate : null
  } catch (error) {
    console.error(`Error fetching default ${type} template:`, error)
    return null
  } finally {
    connection.release()
  }
}

export async function createPrintTemplate(
  name: string,
  content: string,
  type: "receipt" | "pre_receipt",
  isDefault: boolean,
): Promise<{ success: boolean; error?: string }> {
  const connection = await dbPool.getConnection()
  try {
    if (isDefault) {
      await connection.execute("UPDATE print_templates SET is_default = FALSE WHERE type = ?", [type])
    }
    await connection.execute(
      "INSERT INTO print_templates (name, content, type, is_default, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())",
      [name, content, type, isDefault],
    )
    return { success: true }
  } catch (error: unknown) {
    console.error("Error creating print template:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return { success: false, error: errorMessage }
  } finally {
    connection.release()
  }
}

export async function updatePrintTemplate(
  id: string,
  name: string,
  content: string,
  type: "receipt" | "pre_receipt",
  isDefault: boolean,
): Promise<{ success: boolean; error?: string }> {
  const connection = await dbPool.getConnection()
  try {
    if (isDefault) {
      await connection.execute("UPDATE print_templates SET is_default = FALSE WHERE type = ?", [type])
    }
    await connection.execute(
      "UPDATE print_templates SET name = ?, content = ?, type = ?, is_default = ?, updated_at = NOW() WHERE id = ?",
      [name, content, type, isDefault, id],
    )
    return { success: true }
  } catch (error: unknown) {
    console.error("Error updating print template:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return { success: false, error: errorMessage }
  } finally {
    connection.release()
  }
}

export async function deletePrintTemplate(id: string): Promise<{ success: boolean; error?: string }> {
  const connection = await dbPool.getConnection()
  try {
    await connection.execute("DELETE FROM print_templates WHERE id = ?", [id])
    return { success: true }
  } catch (error: unknown) {
    console.error("Error deleting print template:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return { success: false, error: errorMessage }
  } finally {
    connection.release()
  }
}

export async function setDefaultPrintTemplate(
  id: string,
  type: "receipt" | "pre_receipt",
): Promise<{ success: boolean; error?: string }> {
  const connection = await dbPool.getConnection()
  try {
    await connection.execute("UPDATE print_templates SET is_default = FALSE WHERE type = ?", [type])
    await connection.execute("UPDATE print_templates SET is_default = TRUE WHERE id = ?", [id])
    return { success: true }
  } catch (error: unknown) {
    console.error("Error setting default print template:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return { success: false, error: errorMessage }
  } finally {
    connection.release()
  }
}
