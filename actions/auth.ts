"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import bcrypt from "bcryptjs"
import { getDbConnection } from "@/lib/mysql/client"

export async function loginUser(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "Vui lòng nhập email và mật khẩu." }
  }

  let connection
  try {
    connection = await getDbConnection()
    const [rows]: any = await connection.execute(
      "SELECT id, email, username, full_name, password_hash FROM users WHERE email = ?",
      [email],
    )

    if (rows.length === 0) {
      return { error: "Email hoặc mật khẩu không đúng." }
    }

    const user = rows[0]
    const passwordMatch = await bcrypt.compare(password, user.password_hash)

    if (passwordMatch) {
      const cookieStore = await cookies()
      cookieStore.set("user_authenticated", user.id.toString(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // Đảm bảo cờ secure được đặt đúng
        maxAge: 60 * 60 * 24, // 1 ngày
        path: "/",
      })
      return { success: true, message: "Đăng nhập thành công!" }
    } else {
      return { error: "Email hoặc mật khẩu không đúng." }
    }
  } catch (error) {
    if (error instanceof Error && (error as any).digest?.startsWith("NEXT_REDIRECT")) {
      throw error
    }
    console.error("Lỗi đăng nhập:", error)
    return { error: "Đã xảy ra lỗi trong quá trình đăng nhập. Vui lòng thử lại." }
  } finally {
    if (connection) connection.release()
  }
}

export async function registerUser(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirmPassword") as string
  const fullName = formData.get("name") as string

  if (!email || !password || !confirmPassword || !fullName) {
    return { error: "Vui lòng điền đầy đủ email, tên đầy đủ, mật khẩu và xác nhận mật khẩu." }
  }

  if (password !== confirmPassword) {
    return { error: "Mật khẩu và xác nhận mật khẩu không khớp." }
  }

  if (password.length < 6) {
    return { error: "Mật khẩu phải có ít nhất 6 ký tự." }
  }

  let connection
  try {
    connection = await getDbConnection()

    const username = email.split("@")[0] + Math.floor(Math.random() * 1000)
    const userId = `USR${Date.now()}`

    const [existingUsers]: any = await connection.execute("SELECT id FROM users WHERE email = ? OR username = ?", [
      email,
      username,
    ])
    if (existingUsers.length > 0) {
      // Check if email exists
      const [emailExists]: any = await connection.execute("SELECT id FROM users WHERE email = ?", [email])
      if (emailExists.length > 0) {
        return { error: "Email này đã được đăng ký. Vui lòng sử dụng email khác." }
      }
      // Check if username exists (though we generate it, good to have a fallback)
      const [usernameExists]: any = await connection.execute("SELECT id FROM users WHERE username = ?", [username])
      if (usernameExists.length > 0) {
        return { error: "Tên người dùng này đã được đăng ký. Vui lòng thử lại." }
      }
      // Fallback for general existing user
      return { error: "Tài khoản đã tồn tại với thông tin này. Vui lòng đăng nhập." }
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const defaultRoleId = 4

    await connection.execute(
      "INSERT INTO users (user_id, username, full_name, email, password_hash, role_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())",
      [userId, username, fullName, email, hashedPassword, defaultRoleId],
    )

    const [newUsers]: any = await connection.execute("SELECT id FROM users WHERE email = ?", [email])
    const newUserId = newUsers[0].id

    const cookieStore = await cookies()
    cookieStore.set("user_authenticated", newUserId.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Đảm bảo cờ secure được đặt đúng
      maxAge: 60 * 60 * 24, // 1 ngày
      path: "/",
    })

    return { success: true, message: "Đăng ký tài khoản thành công!" }
  } catch (error) {
    if (error instanceof Error && (error as any).digest?.startsWith("NEXT_REDIRECT")) {
      throw error
    }
    console.error("Lỗi đăng ký:", error)
    return { error: "Đã xảy ra lỗi trong quá trình đăng ký. Vui lòng thử lại." }
  } finally {
    if (connection) connection.release()
  }
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete("user_authenticated")
  redirect("/login")
}

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const userId = cookieStore.get("user_authenticated")?.value

  if (!userId) {
    return null
  }

  let connection
  try {
    connection = await getDbConnection()
    const [rows]: any = await connection.execute(
      "SELECT id, user_id, username, full_name, email, avatar_url, role_id FROM users WHERE id = ?",
      [Number.parseInt(userId)],
    )
    if (rows.length > 0) {
      return rows[0]
    }
    return null
  } catch (error) {
    console.error("Lỗi lấy thông tin người dùng:", error)
    return null
  } finally {
    if (connection) connection.release()
  }
}
