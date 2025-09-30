import { type NextRequest, NextResponse } from "next/server"
import { createOrder, getOrders } from "@/lib/services/orders"

interface OrderItem {
  product_id: number
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
  is_service?: boolean
}

interface CreateOrderRequest {
  customer_id?: number
  subtotal: number
  tax_amount?: number
  discount_amount?: number
  total_amount: number
  payment_method: string
  payment_status?: string
  status?: string
  items: OrderItem[]
  offline_id?: string
  created_at?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateOrderRequest = await request.json()
    const {
      customer_id,
      subtotal,
      tax_amount,
      discount_amount,
      total_amount,
      payment_method,
      payment_status,
      items,
      created_at,
      offline_id,
    } = body

    console.log(`[API] Processing order request:`, {
      offline_id,
      customer_id,
      total_amount,
      items_count: items?.length || 0,
      created_at,
    })

    const orderData = {
      customer_id: customer_id || null,
      subtotal: subtotal || 0,
      tax_amount: tax_amount || 0,
      discount_amount: discount_amount || 0,
      total_amount: total_amount || 0,
      payment_method: payment_method || "cash",
      payment_status: payment_status || "completed",
      order_status: "completed",
      order_items: items || [],
    }

    const result = await createOrder(orderData)

    if (offline_id) {
      console.log(`[API] Successfully synced offline order ${offline_id} -> ${result.order_number}`)
    } else {
      console.log(`[API] Successfully created online order ${result.order_number}`)
    }

    return NextResponse.json({
      success: true,
      order_id: result.id,
      order_number: result.order_number,
      message: "Order created successfully",
    })
  } catch (error) {
    console.error("[API] Error creating order:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create order",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    console.log("[API] GET /api/orders - Fetching orders from database")

    const orders = await getOrders()

    console.log(`[API] Found ${orders.length} orders in database`)

    return NextResponse.json({
      success: true,
      orders: orders,
    })
  } catch (error) {
    console.error("[API] Error fetching orders:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch orders",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
