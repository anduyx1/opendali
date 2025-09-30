"use server"

import { getConnection } from "@/lib/mysql/client"
import type { RowDataPacket, ResultSetHeader, FieldPacket } from "mysql2"

export interface Supplier {
  id: number
  name: string
  phone?: string
  email?: string
  address?: string
  created_at: string
  updated_at: string
}

interface SupplierRow extends RowDataPacket {
  id: number
  name: string
  phone?: string
  email?: string
  address?: string
  created_at: string
  updated_at: string
}

export async function createSupplier(data: {
  name: string
  phone?: string
  email?: string
  address?: string
}) {
  try {
    const connection = await getConnection()

    // Kiểm tra trùng lặp theo tên hoặc số điện thoại
    const [existing] = (await connection.execute(
      "SELECT id FROM suppliers WHERE name = ? OR (phone IS NOT NULL AND phone = ?)",
      [data.name, data.phone || null],
    )) as [SupplierRow[], FieldPacket[]]

    if (existing.length > 0) {
      // Cập nhật thông tin nếu đã tồn tại
      await connection.execute(
        `UPDATE suppliers SET 
         phone = COALESCE(?, phone),
         email = COALESCE(?, email), 
         address = COALESCE(?, address),
         updated_at = NOW()
         WHERE id = ?`,
        [data.phone, data.email, data.address, existing[0].id],
      )

      // Lấy thông tin đã cập nhật
      const [updated] = (await connection.execute("SELECT * FROM suppliers WHERE id = ?", [existing[0].id])) as [
        SupplierRow[],
        FieldPacket[],
      ]

      return {
        success: true,
        data: updated[0],
        message: "Đã cập nhật thông tin nhà cung cấp",
      }
    }

    // Tạo mới nếu chưa tồn tại
    const [result] = (await connection.execute(
      `INSERT INTO suppliers (name, phone, email, address)
       VALUES (?, ?, ?, ?)`,
      [data.name, data.phone, data.email, data.address],
    )) as [ResultSetHeader, FieldPacket[]]

    // Lấy thông tin nhà cung cấp vừa tạo
    const [newSupplier] = (await connection.execute("SELECT * FROM suppliers WHERE id = ?", [result.insertId])) as [
      SupplierRow[],
      FieldPacket[],
    ]

    return {
      success: true,
      data: newSupplier[0],
      message: "Đã tạo nhà cung cấp mới",
    }
  } catch (error) {
    console.error("Error creating supplier:", error)
    return { success: false, error: "Không thể tạo nhà cung cấp" }
  }
}

export async function updateSupplier(
  id: number,
  data: {
    name?: string
    phone?: string
    email?: string
    address?: string
  },
) {
  try {
    const connection = await getConnection()

    // Kiểm tra nhà cung cấp có tồn tại không
    const [existing] = (await connection.execute("SELECT id FROM suppliers WHERE id = ?", [id])) as [
      SupplierRow[],
      FieldPacket[],
    ]

    if (existing.length === 0) {
      return { success: false, error: "Không tìm thấy nhà cung cấp" }
    }

    // Cập nhật thông tin
    await connection.execute(
      `UPDATE suppliers SET 
       name = COALESCE(?, name),
       phone = COALESCE(?, phone),
       email = COALESCE(?, email), 
       address = COALESCE(?, address),
       updated_at = NOW()
       WHERE id = ?`,
      [data.name, data.phone, data.email, data.address, id],
    )

    // Lấy thông tin đã cập nhật
    const [updated] = (await connection.execute("SELECT * FROM suppliers WHERE id = ?", [id])) as [
      SupplierRow[],
      FieldPacket[],
    ]

    return {
      success: true,
      data: updated[0],
      message: "Đã cập nhật thông tin nhà cung cấp",
    }
  } catch (error) {
    console.error("Error updating supplier:", error)
    return { success: false, error: "Không thể cập nhật nhà cung cấp" }
  }
}

export async function searchSuppliers(query: string) {
  try {
    const connection = await getConnection()
    const searchTerm = `%${query}%`

    const [suppliers] = (await connection.execute(
      `SELECT id, name, phone, email, address
       FROM suppliers 
       WHERE name LIKE ? OR 
             phone LIKE ? OR 
             email LIKE ?
       ORDER BY name ASC
       LIMIT 10`,
      [searchTerm, searchTerm, searchTerm],
    )) as [SupplierRow[], FieldPacket[]]

    return { success: true, suppliers }
  } catch (error) {
    console.error("Error searching suppliers:", error)
    return { success: false, suppliers: [] }
  }
}

export async function getSupplierById(id: number) {
  try {
    const connection = await getConnection()

    const [suppliers] = (await connection.execute("SELECT * FROM suppliers WHERE id = ?", [id])) as [
      SupplierRow[],
      FieldPacket[],
    ]

    if (suppliers.length === 0) {
      return { success: false, error: "Không tìm thấy nhà cung cấp" }
    }

    return { success: true, supplier: suppliers[0] }
  } catch (error) {
    console.error("Error getting supplier:", error)
    return { success: false, error: "Không thể lấy thông tin nhà cung cấp" }
  }
}

export async function getSuppliers() {
  try {
    const connection = await getConnection()

    const [suppliers] = (await connection.execute("SELECT * FROM suppliers ORDER BY name ASC")) as [
      SupplierRow[],
      FieldPacket[],
    ]

    return { success: true, data: suppliers }
  } catch (error) {
    console.error("Error getting suppliers:", error)
    return { success: false, error: "Không thể lấy danh sách nhà cung cấp", data: [] }
  }
}

export { getSuppliers as getAllSuppliers }
