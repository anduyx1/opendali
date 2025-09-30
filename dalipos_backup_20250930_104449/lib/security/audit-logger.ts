import { getDbConnection } from "@/lib/mysql/client"
import type { RowDataPacket, FieldPacket } from "mysql2"

export type AuditEventType =
  | "user_login"
  | "user_logout"
  | "user_created"
  | "user_updated"
  | "user_deleted"
  | "role_changed"
  | "password_changed"
  | "failed_login"
  | "account_locked"
  | "account_unlocked"
  | "permission_denied"
  | "data_export"
  | "settings_changed"
  | "system_access"

export interface AuditLogEntry {
  id?: number
  eventType: AuditEventType
  userId?: number
  userEmail?: string
  ipAddress?: string
  userAgent?: string
  resource?: string
  action?: string
  oldValues?: Record<string, unknown>
  newValues?: Record<string, unknown>
  metadata?: Record<string, unknown>
  createdAt?: Date
}

interface AuditLogRow extends RowDataPacket {
  id: number
  event_type: string
  user_id: number | null
  user_email: string | null
  ip_address: string | null
  user_agent: string | null
  resource: string | null
  action: string | null
  old_values: string | null
  new_values: string | null
  metadata: string | null
  created_at: Date
}

/**
 * Log audit event
 */
export async function logAuditEvent(entry: Omit<AuditLogEntry, "id" | "createdAt">): Promise<void> {
  let connection
  try {
    connection = await getDbConnection()

    // Ensure audit_logs table exists
    await ensureAuditTableExists(connection as any)

    await connection.execute(
      `INSERT INTO audit_logs (
        event_type, user_id, user_email, ip_address, user_agent,
        resource, action, old_values, new_values, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entry.eventType,
        entry.userId || null,
        entry.userEmail || null,
        entry.ipAddress || null,
        entry.userAgent || null,
        entry.resource || null,
        entry.action || null,
        entry.oldValues ? JSON.stringify(entry.oldValues) : null,
        entry.newValues ? JSON.stringify(entry.newValues) : null,
        entry.metadata ? JSON.stringify(entry.metadata) : null,
      ],
    )
  } catch (error) {
    console.error("Error logging audit event:", error)
    // Don't throw error to avoid breaking main functionality
  } finally {
    if (connection) connection.release()
  }
}

/**
 * Get audit logs with filtering
 */
export async function getAuditLogs(filters: {
  eventType?: AuditEventType
  userId?: number
  userEmail?: string
  resource?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}): Promise<AuditLogEntry[]> {
  let connection
  try {
    connection = await getDbConnection()

    let query = `
      SELECT 
        id, event_type, user_id, user_email, ip_address, user_agent,
        resource, action, old_values, new_values, metadata, created_at
      FROM audit_logs
      WHERE 1=1
    `
    const params: (string | number | Date)[] = []

    if (filters.eventType) {
      query += " AND event_type = ?"
      params.push(filters.eventType)
    }

    if (filters.userId) {
      query += " AND user_id = ?"
      params.push(filters.userId)
    }

    if (filters.userEmail) {
      query += " AND user_email = ?"
      params.push(filters.userEmail)
    }

    if (filters.resource) {
      query += " AND resource = ?"
      params.push(filters.resource)
    }

    if (filters.startDate) {
      query += " AND created_at >= ?"
      params.push(filters.startDate)
    }

    if (filters.endDate) {
      query += " AND created_at <= ?"
      params.push(filters.endDate)
    }

    query += " ORDER BY created_at DESC"

    if (filters.limit) {
      query += " LIMIT ?"
      params.push(filters.limit)
    }

    if (filters.offset) {
      query += " OFFSET ?"
      params.push(filters.offset)
    }

    const [rows] = (await connection.execute(query, params)) as [AuditLogRow[], FieldPacket[]]

    return rows.map((row: AuditLogRow) => ({
      id: row.id,
      eventType: row.event_type as AuditEventType,
      userId: row.user_id !== null && row.user_id !== undefined ? Number(row.user_id) : undefined,
      userEmail: row.user_email || undefined,
      ipAddress: row.ip_address || undefined,
      userAgent: row.user_agent || undefined,
      resource: row.resource || undefined,
      action: row.action || undefined,
      oldValues: row.old_values ? (JSON.parse(row.old_values) as Record<string, unknown>) : null,
      newValues: row.new_values ? (JSON.parse(row.new_values) as Record<string, unknown>) : null,
      metadata: row.metadata ? (JSON.parse(row.metadata) as Record<string, unknown>) : null,
      createdAt: row.created_at,
    })) as any
  } catch (error) {
    console.error("Error getting audit logs:", error)
    return []
  } finally {
    if (connection) connection.release()
  }
}

/**
 * Ensure audit logs table exists
 */
async function ensureAuditTableExists(connection: import("mysql2").PoolConnection): Promise<void> {
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      event_type VARCHAR(50) NOT NULL,
      user_id INT,
      user_email VARCHAR(255),
      ip_address VARCHAR(45),
      user_agent TEXT,
      resource VARCHAR(100),
      action VARCHAR(50),
      old_values JSON,
      new_values JSON,
      metadata JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_event_type (event_type),
      INDEX idx_user_id (user_id),
      INDEX idx_user_email (user_email),
      INDEX idx_resource (resource),
      INDEX idx_created_at (created_at)
    )
  `)
}

/**
 * Clean up old audit logs (keep last 90 days)
 */
export async function cleanupOldAuditLogs(daysToKeep = 90): Promise<void> {
  let connection
  try {
    connection = await getDbConnection()
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000)

    await connection.execute("DELETE FROM audit_logs WHERE created_at < ?", [cutoffDate])
  } catch (error) {
    console.error("Error cleaning up old audit logs:", error)
  } finally {
    if (connection) connection.release()
  }
}
