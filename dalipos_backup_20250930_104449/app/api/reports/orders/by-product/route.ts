import { type NextRequest, NextResponse } from "next/server"
import { getDbConnection } from "@/lib/mysql/client"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const connection = await getDbConnection()

    let dateCondition = "o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)"
    if (startDate && endDate) {
      dateCondition = `o.created_at >= '${startDate}' AND o.created_at <= '${endDate} 23:59:59'`
    }

    const query = `
      SELECT 
        oi.id,
        DATE_FORMAT(o.created_at, '%d/%m/%Y') as date,
        p.name as product_name,
        p.sku,
        SUM(oi.quantity) as quantity_sold,
        SUM(oi.unit_price * oi.quantity) as revenue,
        ROUND(SUM(oi.unit_price * oi.quantity) * (o.discount_amount / NULLIF(o.total_amount, 0)), 2) as product_discount,
        0 as allocated_discount,
        ROUND(SUM(oi.unit_price * oi.quantity) * (o.tax_amount / NULLIF(o.total_amount, 0)), 2) as tax,
        SUM(oi.total_price) as total_amount
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
      WHERE ${dateCondition}
        AND o.order_status = 'completed'
      GROUP BY p.id, DATE(o.created_at), o.id
      ORDER BY o.created_at DESC, p.name
      LIMIT 100
    `

    const [rows] = await connection.execute(query)
    connection.release()

    return NextResponse.json({
      success: true,
      data: rows,
    })
  } catch (error) {
    console.error("Error fetching product statistics:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch product statistics" }, { status: 500 })
  }
}
