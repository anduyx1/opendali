import { type NextRequest, NextResponse } from "next/server"
import { getDbConnection } from "@/lib/mysql/client"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const connection = await getDbConnection()

    const [rows] = await connection.execute(
      `
      SELECT 
        o.id as order_id,
        o.order_number as order_code,
        COALESCE(c.name, 'Khách lẻ') as customer_name,
        oi.quantity,
        oi.unit_price,
        oi.total_price as total_amount,
        o.created_at as order_date,
        o.order_status
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE oi.product_id = ?
      ORDER BY o.created_at DESC
      LIMIT 50
    `,
      [id],
    )

    connection.release()

    return NextResponse.json(rows)
  } catch (error) {
    console.error("Error fetching order history:", error)
    return NextResponse.json({ error: "Failed to fetch order history" }, { status: 500 })
  }
}
