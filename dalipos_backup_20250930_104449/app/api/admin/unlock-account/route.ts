import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getUserById } from "@/lib/services/users"
import { unlockAccount } from "@/lib/security/account-lockout"
import { hasPermission } from "@/lib/utils/permissions"
import { PERMISSIONS } from "@/lib/constants/permissions"

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get("user_authenticated")?.value

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const currentUser = await getUserById(Number.parseInt(userId))
    if (!currentUser || !hasPermission(currentUser, PERMISSIONS.USERS_EDIT)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { email } = await request.json()
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    await unlockAccount(email, currentUser.id)

    return NextResponse.json({ success: true, message: "Account unlocked successfully" })
  } catch (error) {
    console.error("Error unlocking account:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
