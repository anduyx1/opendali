import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getUserById } from "@/lib/services/users"
import { hasPermission, hasAnyPermission } from "@/lib/utils/permissions"
import type { Permission } from "@/lib/constants/permissions"

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get("user_authenticated")?.value

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const user = await getUserById(Number.parseInt(userId))
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { permission, permissions, requireAll } = await request.json()

    let hasAccess = false

    if (permission) {
      // Check single permission
      hasAccess = hasPermission(user, permission as Permission)
    } else if (permissions && Array.isArray(permissions)) {
      // Check multiple permissions
      if (requireAll) {
        hasAccess = permissions.every((p) => hasPermission(user, p as Permission))
      } else {
        hasAccess = hasAnyPermission(user, permissions as Permission[])
      }
    }

    return NextResponse.json({
      hasAccess,
      userRole: user.role_display_name,
      userPermissions: user.role_permissions,
    })
  } catch (error) {
    console.error("Error checking permission:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
