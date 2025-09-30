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

    const detailQuery = `
      SELECT 
        o.id,
        DATE_FORMAT(o.created_at, '%d/%m/%Y') as date,
        o.payment_method,
        o.order_number as order_code,
        u.full_name as staff_name,
        'Chi nhánh mặc định' as branch_name,
        COALESCE(c.name, 'Khách lẻ') as customer_name,
        o.total_amount as amount
      FROM orders o
      LEFT JOIN users u ON o.created_by = u.id
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE ${dateCondition}
        AND o.payment_status = 'completed'
      ORDER BY o.created_at DESC
      LIMIT 100
    `

    const chartQuery = `
      SELECT 
        DATE_FORMAT(o.created_at, '%d/%m') as date,
        SUM(o.total_amount) as amount
      FROM orders o
      WHERE ${dateCondition}
        AND o.payment_status = 'completed'
      GROUP BY DATE(o.created_at)
      ORDER BY o.created_at
    `

    const [detailRows] = await connection.execute(detailQuery)
    const [chartRows] = await connection.execute(chartQuery)
    connection.release()

    return NextResponse.json({
      success: true,
      data: detailRows,
      chartData: chartRows,
    })
  } catch (error) {
    console.error("Error fetching payment data:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch payment data" }, { status: 500 })
  }
}
