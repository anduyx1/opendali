"use server"

import { unstable_noStore as noStore } from "next/cache"
import { dbPool as mysql } from "@/lib/mysql/client"
import type { Category } from "@/lib/types/database"
import type { ResultSetHeader } from "mysql2"

export type MutationResult<T> = { success: true; data: T } | { success: false; error: string }

interface MySQLError extends Error {
  code?: string
}

export async function getCategories(): Promise<Category[]> {
  noStore()
  try {
    const [rows] = await mysql.execute("SELECT * FROM categories ORDER BY name ASC")
    return rows as Category[]
  } catch (error) {
    console.error("Error fetching categories from MySQL:", error)
    throw error
  }
}

export async function getCategoryById(id: number): Promise<Category | null> {
  noStore()
  try {
    const [rows] = await mysql.execute("SELECT * FROM categories WHERE id = ?", [id])
    return (rows as Category[])[0] || null
  } catch (error) {
    console.error("Error fetching category by ID from MySQL:", error)
    throw error
  }
}

export async function createCategory(name: string): Promise<MutationResult<Category | null>> {
  try {
    const [result] = await mysql.execute("INSERT INTO categories (name) VALUES (?)", [name])
    const newId = (result as ResultSetHeader).insertId
    const newCategory = await getCategoryById(newId)
    return { success: true, data: newCategory }
  } catch (error: unknown) {
    console.error("Error creating category in MySQL:", error)
    const mysqlError = error as MySQLError
    if (mysqlError.code === "ER_DUP_ENTRY") {
      return { success: false, error: "Tên danh mục này đã tồn tại. Vui lòng sử dụng tên khác." }
    }
    return { success: false, error: "Có lỗi xảy ra khi lưu danh mục." }
  }
}

export async function updateCategory(id: number, name: string): Promise<MutationResult<Category | null>> {
  try {
    await mysql.execute("UPDATE categories SET name = ?, updated_at = NOW() WHERE id = ?", [name, id])
    const updatedCategory = await getCategoryById(id)
    return { success: true, data: updatedCategory }
  } catch (error: unknown) {
    console.error("Error updating category in MySQL:", error)
    const mysqlError = error as MySQLError
    if (mysqlError.code === "ER_DUP_ENTRY") {
      return { success: false, error: "Tên danh mục này đã tồn tại. Vui lòng sử dụng tên khác." }
    }
    return { success: false, error: "Có lỗi xảy ra khi cập nhật danh mục." }
  }
}

export async function deleteCategory(id: number): Promise<MutationResult<boolean>> {
  try {
    const [result] = await mysql.execute("DELETE FROM categories WHERE id = ?", [id])
    const success = (result as ResultSetHeader).affectedRows > 0
    return { success: true, data: success }
  } catch (error: unknown) {
    console.error("Error deleting category from MySQL:", error)
    const mysqlError = error as MySQLError
    if (mysqlError.code === "ER_ROW_IS_REFERENCED_2") {
      return {
        success: false,
        error:
          "Không thể xóa danh mục này vì nó đang được sử dụng bởi các sản phẩm. Vui lòng gán lại danh mục cho các sản phẩm liên quan trước khi xóa.",
      }
    }
    return { success: false, error: "Có lỗi xảy ra khi xóa danh mục." }
  }
}

export async function getAllCategoryIds(): Promise<Set<number>> {
  noStore()
  try {
    const [rows] = await mysql.execute("SELECT id FROM categories")
    const ids = (rows as { id: number }[]).map((row) => row.id)
    return new Set(ids)
  } catch (error) {
    console.error("Error fetching all category IDs from MySQL:", error)
    throw error
  }
}

export async function getMonthlyCategoryGrossProfit(
  startDate?: Date,
  endDate?: Date,
): Promise<{ category_name: string; total_gross_profit: number }[]> {
  noStore()
  try {
    let query = `
      SELECT
        c.name AS category_name,
        SUM((oi.unit_price * oi.quantity) - (p.cost_price * oi.quantity)) AS total_gross_profit
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      JOIN orders o ON oi.order_id = o.id
    `
    const params: (string | Date)[] = []

    if (startDate && endDate) {
      query += ` WHERE o.created_at BETWEEN ? AND ?`
      params.push(startDate, endDate)
    } else if (startDate) {
      query += ` WHERE o.created_at >= ?`
      params.push(startDate)
    } else if (endDate) {
      query += ` WHERE o.created_at <= ?`
      params.push(endDate)
    }

    query += ` GROUP BY c.name ORDER BY total_gross_profit DESC`

    const [rows] = await mysql.execute(query, params)
    return rows as { category_name: string; total_gross_profit: number }[]
  } catch (error) {
    console.error("Error fetching monthly category gross profit from MySQL:", error)
    throw error
  }
}
