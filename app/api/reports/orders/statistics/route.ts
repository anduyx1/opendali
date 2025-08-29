import { type NextRequest, NextResponse } from "next/server"
import { getDbConnection } from "@/lib/mysql/client"
import type { RowDataPacket } from "mysql2"

interface OrderStatisticsRow extends RowDataPacket {
  id: number
  date: string
  order_code: string
  status: string
  product_count: number
  expected_revenue: number
  cash_payment: number
  bank_transfer: number
  online_payment: number
  card_payment: number
  cod_payment: number
  other_ratio: number
  points_used: number
  remaining_payment: number
  expected_cost: number
  max_shipping_fee: number
  expected_profit: number
}

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
        o.id,
        DATE_FORMAT(o.created_at, '%d/%m/%Y %H:%i') as date,
        o.order_number as order_code,
        o.order_status as status,
        COUNT(oi.id) as product_count,
        COALESCE(o.total_amount, 0) as expected_revenue,
        CASE WHEN o.payment_method = 'cash' THEN COALESCE(o.total_amount, 0) ELSE 0 END as cash_payment,
        CASE WHEN o.payment_method = 'bank_transfer' THEN COALESCE(o.total_amount, 0) ELSE 0 END as bank_transfer,
        CASE WHEN o.payment_method = 'online' THEN COALESCE(o.total_amount, 0) ELSE 0 END as online_payment,
        CASE WHEN o.payment_method = 'card' THEN COALESCE(o.total_amount, 0) ELSE 0 END as card_payment,
        CASE WHEN o.payment_method = 'cod' THEN COALESCE(o.total_amount, 0) ELSE 0 END as cod_payment,
        0 as other_ratio,
        0 as points_used,
        CASE WHEN o.payment_status = 'completed' THEN 0 ELSE COALESCE(o.total_amount, 0) END as remaining_payment,
        COALESCE(SUM(oi.quantity * COALESCE(pr.cost_price, 0)), 0) as expected_cost,
        0 as max_shipping_fee,
        COALESCE(o.total_amount, 0) - COALESCE(SUM(oi.quantity * COALESCE(pr.cost_price, 0)), 0) as expected_profit
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products pr ON oi.product_id = pr.id
      WHERE ${dateCondition}
      GROUP BY o.id, o.created_at, o.order_number, o.order_status, o.total_amount, o.payment_method, o.payment_status
      ORDER BY o.created_at DESC
      LIMIT 50
    `

    const [rows] = await connection.execute(query)
    connection.release()

    const processedData = (rows as OrderStatisticsRow[]).map((row) => ({
      ...row,
      expected_revenue: Number(row.expected_revenue) || 0,
      cash_payment: Number(row.cash_payment) || 0,
      bank_transfer: Number(row.bank_transfer) || 0,
      online_payment: Number(row.online_payment) || 0,
      card_payment: Number(row.card_payment) || 0,
      cod_payment: Number(row.cod_payment) || 0,
      other_ratio: Number(row.other_ratio) || 0,
      points_used: Number(row.points_used) || 0,
      remaining_payment: Number(row.remaining_payment) || 0,
      expected_cost: Number(row.expected_cost) || 0,
      max_shipping_fee: Number(row.max_shipping_fee) || 0,
      expected_profit: Number(row.expected_profit) || 0,
    }))

    return NextResponse.json({
      success: true,
      data: processedData,
    })
  } catch (error) {
    console.error("Error fetching order statistics:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch order statistics" }, { status: 500 })
  }
}
