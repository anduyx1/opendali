"use server"

import { revalidatePath } from "next/cache"
import { getDbConnection } from "@/lib/mysql/client"
import bcrypt from "bcryptjs"
import type { RowDataPacket } from "mysql2"

interface UserRow extends RowDataPacket {
  id: number
  user_id: string
  username: string
  full_name: string
  email: string
  password_hash: string
  role_id: number
  is_active: boolean
  phone: string | null
  created_at: string
  updated_at: string
}

export async function createUserAction(formData: FormData) {
  const full_name = formData.get("full_name") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const role_id = Number(formData.get("role_id"))
  const is_active = formData.get("is_active") === "true"
  const phone = formData.get("phone") as string | undefined

  if (!full_name || !email || !password || !role_id) {
    return { success: false, message: "Vui lòng điền đầy đủ các trường bắt buộc." }
  }

  let connection
  try {
    connection = await getDbConnection()

    // Check if email already exists
    const [existingUsers] = await connection.execute<UserRow[]>("SELECT id FROM users WHERE email = ?", [email])
    if (existingUsers.length > 0) {
      return { success: false, message: "Email này đã được đăng ký. Vui lòng sử dụng email khác." }
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const username = email.split("@")[0] + Date.now().toString().slice(-4) // Simple unique username
    const userId = `USR${Date.now()}`

    await connection.execute(
      "INSERT INTO users (user_id, username, full_name, email, password_hash, role_id, is_active, phone, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())",
      [userId, username, full_name, email, hashedPassword, role_id, is_active, phone],
    )

    revalidatePath("/settings/staff")
    return { success: true, message: "Thêm nhân viên thành công!" }
  } catch (error) {
    console.error("Lỗi khi thêm nhân viên:", error)
    return { success: false, message: "Đã xảy ra lỗi khi thêm nhân viên. Vui lòng thử lại." }
  } finally {
    if (connection) connection.release()
  }
}

export async function updateUserAction(formData: FormData) {
  const id = Number(formData.get("id"))
  const full_name = formData.get("full_name") as string | undefined
  const email = formData.get("email") as string | undefined
  const password = formData.get("password") as string | undefined
  const role_id = formData.get("role_id") ? Number(formData.get("role_id")) : undefined
  const is_active = formData.get("is_active") === "true"
  const phone = formData.get("phone") as string | undefined

  if (!id) {
    return { success: false, message: "Không tìm thấy ID người dùng." }
  }

  let connection
  try {
    connection = await getDbConnection()
    const updates: string[] = []
    const values: (string | number | boolean)[] = []

    if (full_name !== undefined) {
      updates.push("full_name = ?")
      values.push(full_name)
    }
    if (email !== undefined) {
      // Check if updated email already exists for another user
      const [existingUsers] = await connection.execute<UserRow[]>("SELECT id FROM users WHERE email = ? AND id != ?", [
        email,
        id,
      ])
      if (existingUsers.length > 0) {
        return { success: false, message: "Email này đã được đăng ký bởi người dùng khác." }
      }
      updates.push("email = ?")
      values.push(email)
    }
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10)
      updates.push("password_hash = ?")
      values.push(hashedPassword)
    }
    if (role_id !== undefined) {
      updates.push("role_id = ?")
      values.push(role_id)
    }
    // is_active is always sent by the form as a string 'true' or 'false'
    updates.push("is_active = ?")
    values.push(is_active)

    if (phone !== undefined) {
      updates.push("phone = ?")
      values.push(phone)
    }

    if (updates.length === 0) {
      return { success: false, message: "Không có thông tin nào để cập nhật." }
    }

    values.push(id)
    await connection.execute(`UPDATE users SET ${updates.join(", ")}, updated_at = NOW() WHERE id = ?`, values)

    revalidatePath("/settings/staff")
    return { success: true, message: "Cập nhật nhân viên thành công!" }
  } catch (error) {
    console.error("Lỗi khi cập nhật nhân viên:", error)
    return { success: false, message: "Đã xảy ra lỗi khi cập nhật nhân viên. Vui lòng thử lại." }
  } finally {
    if (connection) connection.release()
  }
}

export async function deleteUserAction(id: number) {
  if (!id) {
    return { success: false, message: "Không tìm thấy ID người dùng để xóa." }
  }

  let connection
  try {
    connection = await getDbConnection()
    await connection.execute("DELETE FROM users WHERE id = ?", [id])

    revalidatePath("/settings/staff")
    return { success: true, message: "Xóa nhân viên thành công!" }
  } catch (error) {
    console.error("Lỗi khi xóa nhân viên:", error)
    return { success: false, message: "Đã xảy ra lỗi khi xóa nhân viên. Vui lòng thử lại." }
  } finally {
    if (connection) connection.release()
  }
}
