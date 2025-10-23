import { unstable_noStore as noStore } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { UserWithRole, Role } from "@/lib/types/database"

export async function getUsersWithRoles(): Promise<UserWithRole[]> {
  noStore()
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("users")
      .select(`
        id,
        user_id,
        username,
        full_name,
        email,
        avatar_url,
        is_active,
        last_login,
        phone,
        role_id,
        roles!inner(
          name,
          display_name,
          permissions
        )
      `)
      .order("full_name", { ascending: true })

    if (error) {
      console.error("Lỗi khi lấy danh sách người dùng với vai trò:", error)
      throw new Error("Không thể lấy danh sách người dùng.")
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      username: row.username,
      full_name: row.full_name,
      email: row.email,
      avatar_url: row.avatar_url,
      is_active: row.is_active,
      last_login: row.last_login,
      phone: row.phone,
      role_id: row.role_id,
      role_name: row.roles.name,
      role_display_name: row.roles.display_name,
      role_permissions: row.roles.permissions,
    })) as UserWithRole[]
  } catch (error) {
    console.error("Lỗi khi lấy danh sách người dùng với vai trò:", error)
    throw new Error("Không thể lấy danh sách người dùng.")
  }
}

export async function getRoles(): Promise<Role[]> {
  noStore()
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("roles")
      .select("id, name, display_name, permissions")
      .order("display_name", { ascending: true })

    if (error) {
      console.error("Lỗi khi lấy danh sách vai trò:", error)
      throw new Error("Không thể lấy danh sách vai trò.")
    }

    return (data || []) as Role[]
  } catch (error) {
    console.error("Lỗi khi lấy danh sách vai trò:", error)
    throw new Error("Không thể lấy danh sách vai trò.")
  }
}

export async function getUserById(id: number): Promise<UserWithRole | null> {
  noStore()
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("users")
      .select(`
        id,
        user_id,
        username,
        full_name,
        email,
        avatar_url,
        is_active,
        last_login,
        phone,
        role_id,
        roles!inner(
          name,
          display_name,
          permissions
        )
      `)
      .eq("id", id)
      .maybeSingle()

    if (error) {
      console.error(`Lỗi khi lấy người dùng với ID ${id}:`, error)
      throw new Error("Không thể lấy thông tin người dùng.")
    }

    if (!data) return null

    return {
      id: data.id,
      user_id: data.user_id,
      username: data.username,
      full_name: data.full_name,
      email: data.email,
      avatar_url: data.avatar_url,
      is_active: data.is_active,
      last_login: data.last_login,
      phone: data.phone,
      role_id: data.role_id,
      role_name: data.roles.name,
      role_display_name: data.roles.display_name,
      role_permissions: data.roles.permissions,
    } as UserWithRole
  } catch (error) {
    console.error(`Lỗi khi lấy người dùng với ID ${id}:`, error)
    throw new Error("Không thể lấy thông tin người dùng.")
  }
}
