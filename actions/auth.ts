"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import bcrypt from "bcryptjs"
import { createClient } from "@/lib/supabase/server"

export async function loginUser(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "Vui lòng nhập email và mật khẩu." }
  }

  try {
    const supabase = createClient()
    const { data: users, error: queryError } = await supabase
      .from("users")
      .select("id, email, username, full_name, password_hash")
      .eq("email", email)
      .maybeSingle()

    if (queryError) {
      console.error("Lỗi truy vấn database:", queryError)
      return { error: "Đã xảy ra lỗi trong quá trình đăng nhập. Vui lòng thử lại." }
    }

    if (!users) {
      return { error: "Email hoặc mật khẩu không đúng." }
    }

    const user = users
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

  try {
    const supabase = createClient()
    const username = email.split("@")[0] + Math.floor(Math.random() * 1000)
    const userId = `USR${Date.now()}`

    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle()

    if (existingUser) {
      return { error: "Email này đã được đăng ký. Vui lòng sử dụng email khác." }
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const defaultRoleId = 4

    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert({
        user_id: userId,
        username,
        full_name: fullName,
        email,
        password_hash: hashedPassword,
        role_id: defaultRoleId,
      })
      .select("id")
      .single()

    if (insertError || !newUser) {
      console.error("Lỗi khi tạo tài khoản:", insertError)
      return { error: "Đã xảy ra lỗi trong quá trình đăng ký. Vui lòng thử lại." }
    }

    const newUserId = newUser.id

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

  try {
    const supabase = createClient()
    const { data: user, error } = await supabase
      .from("users")
      .select("id, user_id, username, full_name, email, avatar_url, role_id")
      .eq("id", Number.parseInt(userId))
      .maybeSingle()

    if (error) {
      console.error("Lỗi lấy thông tin người dùng:", error)
      return null
    }

    return user
  } catch (error) {
    console.error("Lỗi lấy thông tin người dùng:", error)
    return null
  }
}
