import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getUserById } from "@/lib/services/users"
import { getAuditLogs } from "@/lib/security/audit-logger"
import { hasPermission } from "@/lib/utils/permissions"
import { PERMISSIONS } from "@/lib/constants/permissions"

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get("user_authenticated")?.value

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const currentUser = await getUserById(Number.parseInt(userId))
    if (!currentUser || !hasPermission(currentUser, PERMISSIONS.AUDIT_LOGS)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const url = new URL(request.url)
    const targetUserId = url.searchParams.get("userId")
    const limit = Number.parseInt(url.searchParams.get("limit") || "50")
    const offset = Number.parseInt(url.searchParams.get("offset") || "0")

    const filters: { limit: number; offset: number; userId?: number } = { limit, offset }
    if (targetUserId) {
      filters.userId = Number.parseInt(targetUserId)
    }

    const logs = await getAuditLogs(filters)

    return NextResponse.json(logs)
  } catch (error) {
    console.error("Error fetching audit logs:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
