import { cookies } from "next/headers"
import { getDbConnection } from "@/lib/mysql/client"
import type { RowDataPacket, FieldPacket } from "mysql2"

export interface SessionData {
  id: string
  userId: number
  expiresAt: Date
  ipAddress?: string
  userAgent?: string
  isActive: boolean
}

interface SessionRow extends RowDataPacket {
  id: string
  user_id: number
  expires_at: Date
  session_token: string
}

/**
 * Create a new session for user
 */
export async function createSession(userId: number, ipAddress?: string, userAgent?: string): Promise<SessionData> {
  const sessionId = generateSessionId()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  let connection
  try {
    connection = await getDbConnection()

    // Insert session into database
    await connection.execute(
      "INSERT INTO user_sessions (id, user_id, expires_at, session_token, created_at) VALUES (?, ?, ?, ?, NOW())",
      [sessionId, userId, expiresAt, sessionId],
    )

    // Update user's last login
    await connection.execute("UPDATE users SET last_login = NOW() WHERE id = ?", [userId])

    const cookieStore = await cookies()
    cookieStore.set("user_authenticated", userId.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
      sameSite: "strict",
    })

    cookieStore.set("session_id", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
      sameSite: "strict",
    })

    return {
      id: sessionId,
      userId,
      expiresAt,
      ipAddress,
      userAgent,
      isActive: true,
    }
  } catch (error) {
    console.error("Error creating session:", error)
    throw new Error("Failed to create session")
  } finally {
    if (connection) connection.release()
  }
}

/**
 * Validate and refresh session
 */
export async function validateSession(sessionId: string): Promise<SessionData | null> {
  let connection
  try {
    connection = await getDbConnection()

    const [rows] = (await connection.execute(
      "SELECT id, user_id, expires_at, session_token FROM user_sessions WHERE id = ? AND expires_at > NOW()",
      [sessionId],
    )) as [SessionRow[], FieldPacket[]]

    if (rows.length === 0) {
      return null
    }

    const session = rows[0]

    // Extend session if it's close to expiry (within 2 hours)
    const now = new Date()
    const expiresAt = new Date(session.expires_at)
    const timeUntilExpiry = expiresAt.getTime() - now.getTime()
    const twoHours = 2 * 60 * 60 * 1000

    if (timeUntilExpiry < twoHours) {
      const newExpiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      await connection.execute("UPDATE user_sessions SET expires_at = ? WHERE id = ?", [newExpiresAt, sessionId])

      return {
        id: session.id,
        userId: session.user_id,
        expiresAt: newExpiresAt,
        isActive: true,
      }
    }

    return {
      id: session.id,
      userId: session.user_id,
      expiresAt,
      isActive: true,
    }
  } catch (error) {
    console.error("Error validating session:", error)
    return null
  } finally {
    if (connection) connection.release()
  }
}

/**
 * Destroy session
 */
export async function destroySession(sessionId: string): Promise<void> {
  let connection
  try {
    connection = await getDbConnection()
    await connection.execute("DELETE FROM user_sessions WHERE id = ?", [sessionId])

    const cookieStore = await cookies()
    cookieStore.delete("user_authenticated")
    cookieStore.delete("session_id")
  } catch (error) {
    console.error("Error destroying session:", error)
  } finally {
    if (connection) connection.release()
  }
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions(): Promise<void> {
  let connection
  try {
    connection = await getDbConnection()
    await connection.execute("DELETE FROM user_sessions WHERE expires_at < NOW()")
  } catch (error) {
    console.error("Error cleaning up expired sessions:", error)
  } finally {
    if (connection) connection.release()
  }
}

function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
}
