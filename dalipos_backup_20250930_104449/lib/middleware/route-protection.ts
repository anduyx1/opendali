import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getDbConnection } from "@/lib/mysql/client"
import type { RowDataPacket } from "mysql2"

interface UserWithPermissionsRow extends RowDataPacket {
  id: number
  user_id: string
  username: string
  full_name: string
  email: string
  avatar_url: string | null
  is_active: boolean
  role_id: number
  role_name: string
  role_display_name: string
  role_permissions: string
}

/**
 * Get user with permissions from database (server-side only)
 */
export async function getUserWithPermissions(userId: string) {
  let connection
  try {
    connection = await getDbConnection()
    const [rows] = await connection.execute<UserWithPermissionsRow[]>(
      `SELECT
        u.id,
        u.user_id,
        u.username,
        u.full_name,
        u.email,
        u.avatar_url,
        u.is_active,
        u.role_id,
        r.name AS role_name,
        r.display_name AS role_display_name,
        r.permissions AS role_permissions
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = ? AND u.is_active = 1`,
      [Number.parseInt(userId)],
    )

    if (rows.length > 0) {
      const user = rows[0]
      return {
        ...user,
        role_permissions: JSON.parse(user.role_permissions || "[]"),
      }
    }
    return null
  } catch (error) {
    console.error("Error fetching user with permissions:", error)
    return null
  } finally {
    if (connection) connection.release()
  }
}

/**
 * Server-side route protection function
 * Use this in page components to check permissions
 */
export async function protectRoute(requiredPermissions?: string[]) {
  const cookieStore = await cookies()
  const userId = cookieStore.get("user_authenticated")?.value

  if (!userId) {
    redirect("/login?message=login_required")
  }

  const user = await getUserWithPermissions(userId)
  if (!user) {
    redirect("/login?message=user_not_found")
  }

  if (requiredPermissions && requiredPermissions.length > 0) {
    const userPermissions = user.role_permissions || []
    const hasPermission = requiredPermissions.some((permission) => userPermissions.includes(permission))

    if (!hasPermission) {
      redirect("/?message=access_denied")
    }
  }

  return user
}
