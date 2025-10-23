"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import bcrypt from "bcryptjs"


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

  try {
    const supabase = createClient()

    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle()

    if (existingUser) {
      return { success: false, message: "Email này đã được đăng ký. Vui lòng sử dụng email khác." }
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const username = email.split("@")[0] + Date.now().toString().slice(-4)
    const userId = `USR${Date.now()}`

    const { error: insertError } = await supabase
      .from("users")
      .insert({
        user_id: userId,
        username,
        full_name,
        email,
        password_hash: hashedPassword,
        role_id,
        is_active,
        phone,
      })

    if (insertError) {
      console.error("Lỗi khi thêm nhân viên:", insertError)
      return { success: false, message: "Đã xảy ra lỗi khi thêm nhân viên. Vui lòng thử lại." }
    }

    revalidatePath("/settings/staff")
    return { success: true, message: "Thêm nhân viên thành công!" }
  } catch (error) {
    console.error("Lỗi khi thêm nhân viên:", error)
    return { success: false, message: "Đã xảy ra lỗi khi thêm nhân viên. Vui lòng thử lại." }
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

  try {
    const supabase = createClient()
    const updates: Record<string, any> = {}

    if (email !== undefined) {
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .neq("id", id)
        .maybeSingle()

      if (existingUser) {
        return { success: false, message: "Email này đã được đăng ký bởi người dùng khác." }
      }
      updates.email = email
    }

    if (full_name !== undefined) {
      updates.full_name = full_name
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10)
      updates.password_hash = hashedPassword
    }

    if (role_id !== undefined) {
      updates.role_id = role_id
    }

    updates.is_active = is_active

    if (phone !== undefined) {
      updates.phone = phone
    }

    if (Object.keys(updates).length === 0) {
      return { success: false, message: "Không có thông tin nào để cập nhật." }
    }

    const { error: updateError } = await supabase
      .from("users")
      .update(updates)
      .eq("id", id)

    if (updateError) {
      console.error("Lỗi khi cập nhật nhân viên:", updateError)
      return { success: false, message: "Đã xảy ra lỗi khi cập nhật nhân viên. Vui lòng thử lại." }
    }

    revalidatePath("/settings/staff")
    return { success: true, message: "Cập nhật nhân viên thành công!" }
  } catch (error) {
    console.error("Lỗi khi cập nhật nhân viên:", error)
    return { success: false, message: "Đã xảy ra lỗi khi cập nhật nhân viên. Vui lòng thử lại." }
  }
}

export async function deleteUserAction(id: number) {
  if (!id) {
    return { success: false, message: "Không tìm thấy ID người dùng để xóa." }
  }

  try {
    const supabase = createClient()
    const { error: deleteError } = await supabase
      .from("users")
      .delete()
      .eq("id", id)

    if (deleteError) {
      console.error("Lỗi khi xóa nhân viên:", deleteError)
      return { success: false, message: "Đã xảy ra lỗi khi xóa nhân viên. Vui lòng thử lại." }
    }

    revalidatePath("/settings/staff")
    return { success: true, message: "Xóa nhân viên thành công!" }
  } catch (error) {
    console.error("Lỗi khi xóa nhân viên:", error)
    return { success: false, message: "Đã xảy ra lỗi khi xóa nhân viên. Vui lòng thử lại." }
  }
}
