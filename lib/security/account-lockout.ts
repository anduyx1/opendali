import { getDbConnection } from "@/lib/mysql/client"
import type { RowDataPacket, FieldPacket } from "mysql2"

export interface LockoutPolicy {
  maxAttempts: number
  lockoutDuration: number // in minutes
  resetAfter: number // in minutes
}

export const DEFAULT_LOCKOUT_POLICY: LockoutPolicy = {
  maxAttempts: 5,
  lockoutDuration: 30, // 30 minutes
  resetAfter: 60, // 1 hour
}

export interface AccountStatus {
  isLocked: boolean
  attemptsRemaining: number
  lockedUntil?: Date
  nextResetAt?: Date
}

interface UserLockoutRow extends RowDataPacket {
  failed_attempts: number | null
  locked_until: Date | null
  last_attempt: Date | null
}

/**
 * Record failed login attempt
 */
export async function recordFailedAttempt(
  email: string,
  ipAddress?: string,
  policy: LockoutPolicy = DEFAULT_LOCKOUT_POLICY,
): Promise<AccountStatus> {
  let connection
  try {
    connection = await getDbConnection()

    // Get current attempts
    const [rows] = (await connection.execute(
      "SELECT failed_attempts, locked_until, last_attempt FROM users WHERE email = ?",
      [email],
    )) as [UserLockoutRow[], FieldPacket[]]

    if (rows.length === 0) {
      throw new Error("User not found")
    }

    const user = rows[0]
    const now = new Date()
    const lastAttempt = user.last_attempt ? new Date(user.last_attempt) : null
    const lockedUntil = user.locked_until ? new Date(user.locked_until) : null

    // Check if account is currently locked
    if (lockedUntil && lockedUntil > now) {
      return {
        isLocked: true,
        attemptsRemaining: 0,
        lockedUntil,
      }
    }

    // Reset attempts if enough time has passed
    let failedAttempts = user.failed_attempts || 0
    if (lastAttempt && now.getTime() - lastAttempt.getTime() > policy.resetAfter * 60 * 1000) {
      failedAttempts = 0
    }

    failedAttempts += 1

    // Check if account should be locked
    let newLockedUntil = null
    if (failedAttempts >= policy.maxAttempts) {
      newLockedUntil = new Date(now.getTime() + policy.lockoutDuration * 60 * 1000)
    }

    // Update user record
    await connection.execute(
      "UPDATE users SET failed_attempts = ?, locked_until = ?, last_attempt = NOW() WHERE email = ?",
      [failedAttempts, newLockedUntil, email],
    )

    // Log the attempt
    await logSecurityEvent("failed_login", email, ipAddress, {
      attempts: failedAttempts,
      locked: !!newLockedUntil,
    })

    return {
      isLocked: !!newLockedUntil,
      attemptsRemaining: Math.max(0, policy.maxAttempts - failedAttempts),
      lockedUntil: newLockedUntil || undefined,
      nextResetAt: new Date(now.getTime() + policy.resetAfter * 60 * 1000),
    }
  } catch (error) {
    console.error("Error recording failed attempt:", error)
    throw error
  } finally {
    if (connection) connection.release()
  }
}

/**
 * Check if account is locked
 */
export async function checkAccountLockout(email: string): Promise<AccountStatus> {
  let connection
  try {
    connection = await getDbConnection()

    const [rows] = (await connection.execute("SELECT failed_attempts, locked_until FROM users WHERE email = ?", [
      email,
    ])) as [UserLockoutRow[], FieldPacket[]]

    if (rows.length === 0) {
      throw new Error("User not found")
    }

    const user = rows[0]
    const now = new Date()
    const lockedUntil = user.locked_until ? new Date(user.locked_until) : null

    // Check if lock has expired
    if (lockedUntil && lockedUntil <= now) {
      // Reset failed attempts and unlock
      await connection.execute("UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE email = ?", [email])

      return {
        isLocked: false,
        attemptsRemaining: DEFAULT_LOCKOUT_POLICY.maxAttempts,
      }
    }

    return {
      isLocked: !!lockedUntil && lockedUntil > now,
      attemptsRemaining: Math.max(0, DEFAULT_LOCKOUT_POLICY.maxAttempts - (user.failed_attempts || 0)),
      lockedUntil: lockedUntil || undefined,
    }
  } catch (error) {
    console.error("Error checking account lockout:", error)
    throw error
  } finally {
    if (connection) connection.release()
  }
}

/**
 * Reset failed attempts after successful login
 */
export async function resetFailedAttempts(email: string): Promise<void> {
  let connection
  try {
    connection = await getDbConnection()
    await connection.execute("UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE email = ?", [email])
  } catch (error) {
    console.error("Error resetting failed attempts:", error)
  } finally {
    if (connection) connection.release()
  }
}

/**
 * Manually unlock account (admin function)
 */
export async function unlockAccount(email: string, adminUserId: number): Promise<void> {
  let connection
  try {
    connection = await getDbConnection()
    await connection.execute("UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE email = ?", [email])

    await logSecurityEvent("account_unlocked", email, undefined, {
      unlockedBy: adminUserId,
    })
  } catch (error) {
    console.error("Error unlocking account:", error)
    throw error
  } finally {
    if (connection) connection.release()
  }
}

/**
 * Log security events
 */
async function logSecurityEvent(
  eventType: string,
  userEmail: string,
  ipAddress?: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  let connection
  try {
    connection = await getDbConnection()

    // Create audit_logs table if it doesn't exist
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        event_type VARCHAR(50) NOT NULL,
        user_email VARCHAR(255),
        ip_address VARCHAR(45),
        metadata JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_event_type (event_type),
        INDEX idx_user_email (user_email),
        INDEX idx_created_at (created_at)
      )
    `)

    await connection.execute(
      "INSERT INTO audit_logs (event_type, user_email, ip_address, metadata) VALUES (?, ?, ?, ?)",
      [eventType, userEmail, ipAddress, JSON.stringify(metadata || {})],
    )
  } catch (error) {
    console.error("Error logging security event:", error)
  } finally {
    if (connection) connection.release()
  }
}
