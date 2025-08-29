import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getUserById } from "@/lib/services/users"
import type { User } from "@/lib/interfaces/user"

export async function GET() {
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

    // Tạo bản sao user và loại bỏ password_hash
    const userWithoutPassword = { ...user }
    delete (userWithoutPassword as any).password_hash

    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    console.error("Error fetching current user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
