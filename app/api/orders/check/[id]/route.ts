import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    console.log("[Order Check API] Checking order with ID:", id)

    if (!id) {
      console.log("[Order Check API] Missing order ID")
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
    }

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    console.log("[Order Check API] ID format - UUID:", isUUID, "ID:", id)

    const supabase = createClient()

    let query = supabase
      .from('orders')
      .select('id, order_number, order_status, payment_status, total_amount, created_at')

    if (isUUID) {
      // Check if this looks like an offline ID
      query = query.or(`offline_id.eq.${id},id.eq.${id},order_number.eq.${id}`)
    } else {
      // Check by ID or order number
      query = query.or(`id.eq.${id},order_number.eq.${id}`)
    }

    const { data: orders, error } = await query

    if (error) {
      console.error("[Order Check API] Database query failed:", error)
      return NextResponse.json({ error: "Database query failed" }, { status: 500 })
    }

    console.log("[Order Check API] Query result - found orders:", orders?.length || 0)

    if (!orders || orders.length === 0) {
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
  } catch (error) {
    console.error("[Order Check API] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
