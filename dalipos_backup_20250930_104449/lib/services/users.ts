import { unstable_noStore as noStore } from "next/cache"
import { getDbConnection } from "@/lib/mysql/client"
import type { UserWithRole, Role, UserRow, RoleRow } from "@/lib/types/database"

export async function getUsersWithRoles(): Promise<UserWithRole[]> {
  noStore()
  let connection
  try {
    connection = await getDbConnection()
    const [rows] = await connection.execute<UserRow[]>(
      `SELECT
        u.id,
        u.user_id,
        u.username,
        u.full_name,
        u.email,
        u.avatar_url,
        u.is_active,
        u.last_login,
        u.phone,
        u.role_id,
        r.name AS role_name,
        r.display_name AS role_display_name,
        r.permissions AS role_permissions
      FROM users u
      JOIN roles r ON u.role_id = r.id
      ORDER BY u.full_name ASC`,
    )

    return rows.map((row) => ({
      ...row,
      role_permissions: JSON.parse(row.role_permissions as unknown as string), // Parse JSON string to array
    })) as UserWithRole[]
  } catch (error) {
    console.error("Lỗi khi lấy danh sách người dùng với vai trò:", error)
    throw new Error("Không thể lấy danh sách người dùng.")
  } finally {
    if (connection) connection.release()
  }
}

export async function getRoles(): Promise<Role[]> {
  noStore()
  let connection
  try {
    connection = await getDbConnection()
    const [rows] = await connection.execute<RoleRow[]>(
      "SELECT id, name, display_name, permissions FROM roles ORDER BY display_name ASC",
    )
    return rows.map((row) => ({
      ...row,
      permissions: JSON.parse(row.permissions as unknown as string), // Parse JSON string to array
    })) as Role[]
  } catch (error) {
    console.error("Lỗi khi lấy danh sách vai trò:", error)
    throw new Error("Không thể lấy danh sách vai trò.")
  } finally {
    if (connection) connection.release()
  }
}

export async function getUserById(id: number): Promise<UserWithRole | null> {
  noStore()
  let connection
  try {
    connection = await getDbConnection()
    const [rows] = await connection.execute<UserRow[]>(
      `SELECT
        u.id,
        u.user_id,
        u.username,
        u.full_name,
        u.email,
        u.avatar_url,
        u.is_active,
        u.last_login,
        u.phone,
        u.role_id,
        r.name AS role_name,
        r.display_name AS role_display_name,
        r.permissions AS role_permissions
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = ?`,
      [id],
    )
    if (rows.length > 0) {
      const user = rows[0]
      return {
        ...user,
        role_permissions: JSON.parse(user.role_permissions as unknown as string),
      } as UserWithRole
    }
    return null
  } catch (error) {
    console.error(`Lỗi khi lấy người dùng với ID ${id}:`, error)
    throw new Error("Không thể lấy thông tin người dùng.")
  } finally {
    if (connection) connection.release()
  }
}
