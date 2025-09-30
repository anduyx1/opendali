import { type NextRequest, NextResponse } from "next/server"
import { getDbConnection } from "@/lib/mysql/client"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const connection = await getDbConnection()

    const [rows] = await connection.execute(
      `
      SELECT 
        sm.*,
        u.full_name as created_by_name
      FROM stock_movements sm
      LEFT JOIN users u ON sm.created_by = u.id
      WHERE sm.product_id = ?
      ORDER BY sm.created_at DESC
      LIMIT 100
    `,
      [id],
    )

    connection.release()

    return NextResponse.json(rows)
  } catch (error) {
    console.error("Error fetching stock history:", error)
    return NextResponse.json({ error: "Failed to fetch stock history" }, { status: 500 })
  }
}
