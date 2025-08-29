import { type NextRequest, NextResponse } from "next/server"
import { getDbConnection } from "@/lib/mysql/client"

interface DatabaseConnection {
  execute: (query: string, params?: unknown[]) => Promise<[unknown[], unknown]>
  release: () => void
}

interface OrderRow {
  id: number
  order_number: string
  order_status: string
  payment_status: string
  total_amount: number
  created_at: Date
}

interface ColumnInfo {
  Field: string
  Type: string
  Null: string
  Key: string
  Default: string | null
  Extra: string
}

interface SqlError extends Error {
  code?: string
  errno?: number
  sqlState?: string
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let connection: DatabaseConnection | null = null

  try {
    const { id } = await params
    console.log("[Order Check API] Checking order with ID:", id)

    if (!id) {
      console.log("[Order Check API] Missing order ID")
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
    }

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    console.log("[Order Check API] ID format - UUID:", isUUID, "ID:", id)

    try {
      connection = (await getDbConnection()) as DatabaseConnection
      console.log("[Order Check API] Database connection established")
    } catch (dbError) {
      console.error("[Order Check API] Database connection failed:", dbError)
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
    }

    try {
      console.log("[Order Check API] Executing SQL query with parameters:", [id, id, id])

      let query = `SELECT id, order_number, order_status, payment_status, total_amount, created_at FROM orders WHERE id = ? OR order_number = ?`
      let params = [id, id]

      // Check if offline_id column exists and add it to query if it does
      try {
        const [columns] = await connection.execute(`SHOW COLUMNS FROM orders LIKE 'offline_id'`)
        if ((columns as ColumnInfo[]).length > 0) {
          query = `SELECT id, order_number, order_status, payment_status, total_amount, created_at FROM orders WHERE offline_id = ? OR id = ? OR order_number = ?`
          params = [id, id, id]
          console.log("[Order Check API] Using query with offline_id column")
        } else {
          console.log("[Order Check API] offline_id column not found, using basic query")
        }
      } catch (columnCheckError) {
        console.log("[Order Check API] Column check failed, using basic query:", columnCheckError)
      }

      const [rows] = await connection.execute(query, params)

      const orders = rows as OrderRow[]
      console.log("[Order Check API] Query result - found orders:", orders.length)

      if (orders.length === 0) {
        console.log("[Order Check API] No orders found for ID:", id)
        return NextResponse.json({ error: "Order not found" }, { status: 404 })
      }

      const order = orders[0]
      console.log("[Order Check API] Found order:", order.order_number)

      return NextResponse.json({
        success: true,
        order: {
          id: order.id,
          order_number: order.order_number,
          status: order.order_status,
          payment_status: order.payment_status,
          total_amount: order.total_amount,
          version: 1,
          created_at: order.created_at,
        },
      })
    } catch (sqlError) {
      console.error("[Order Check API] SQL query failed:", sqlError)
      console.error("[Order Check API] SQL Error details:", {
        message: sqlError instanceof Error ? sqlError.message : "Unknown SQL error",
        code: (sqlError as SqlError)?.code,
        errno: (sqlError as SqlError)?.errno,
        sqlState: (sqlError as SqlError)?.sqlState,
      })
      return NextResponse.json({ error: "Database query failed" }, { status: 500 })
    }
  } catch (error) {
    console.error("[Order Check API] Unexpected error:", error)
    console.error("[Order Check API] Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      id: (await params)?.id,
    })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  } finally {
    if (connection) {
      try {
        connection.release()
        console.log("[Order Check API] Database connection released")
      } catch (releaseError) {
        console.error("[Order Check API] Error releasing connection:", releaseError)
      }
    }
  }
}
