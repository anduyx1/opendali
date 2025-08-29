import { type NextRequest, NextResponse } from "next/server"
import { getDbConnection } from "@/lib/mysql/client"
import type { RowDataPacket } from "mysql2"

interface OrderRow extends RowDataPacket {
  id: number
  order_number: string
  customer_name: string
  customer_phone: string
  customer_email: string
  total_amount: number
  order_status: string
  payment_method: string
  payment_status: string
  created_at: string
}

interface OrderItemRow extends RowDataPacket {
  id: number
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const connection = await getDbConnection()

    // Get order details
    const orderQuery = `
      SELECT 
        o.id,
        o.order_number,
        o.customer_name,
        o.customer_phone,
        o.customer_email,
        o.total_amount,
        o.order_status,
        o.payment_method,
        o.payment_status,
        o.created_at
      FROM orders o
      WHERE o.order_number = ? OR o.id = ?
    `

    const [orderRows] = await connection.execute(orderQuery, [id, id])
    const orders = orderRows as OrderRow[]

    if (orders.length === 0) {
      connection.release()
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 })
    }

    const order = orders[0]

    // Get order items
    const itemsQuery = `
      SELECT 
        oi.id,
        oi.product_name,
        oi.quantity,
        oi.unit_price,
        oi.total_price
      FROM order_items oi
      WHERE oi.order_id = ?
      ORDER BY oi.id
    `

    const [itemRows] = await connection.execute(itemsQuery, [order.id])
    order.items = itemRows as OrderItemRow[]

    connection.release()

    return NextResponse.json({
      success: true,
      order: order,
    })
  } catch (error) {
    console.error("Error fetching order detail:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch order detail" }, { status: 500 })
  }
}
