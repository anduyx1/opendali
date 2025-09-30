import { type NextRequest, NextResponse } from "next/server"
import { getDbConnection } from "@/lib/mysql/client"
import type { ResultSetHeader } from "mysql2"

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

interface OrderRow {
  id: number
  order_number: string
  customer_id?: number
  subtotal: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  payment_method: string
  payment_status: string
  order_status: string
  created_at: string
  updated_at: string
  customer_name?: string
  customer_phone?: string
  customer_email?: string
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

    const connection = await getDbConnection()

    try {
      await connection.beginTransaction()

      // Set timezone for this session
      await connection.execute("SET time_zone = '+07:00'")

      // Generate order number
      const orderNumber = `ORD-${Date.now().toString().slice(-6)}`

      const orderQuery = `
        INSERT INTO orders (
          order_number,
          customer_id,
          subtotal,
          tax_amount,
          discount_amount,
          total_amount,
          payment_method,
          payment_status,
          order_status,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `

      const [orderResult] = await connection.execute(orderQuery, [
        orderNumber,
        customer_id ?? null, // Use nullish coalescing to ensure null instead of undefined
        subtotal ?? 0,
        tax_amount ?? 0,
        discount_amount ?? 0,
        total_amount ?? 0,
        payment_method ?? "cash",
        payment_status ?? "completed",
        "completed",
      ])

      const orderId = (orderResult as ResultSetHeader).insertId

      // Insert order items
      if (items && items.length > 0) {
        for (const item of items) {
          const itemQuery = `
            INSERT INTO order_items (
              order_id,
              product_id,
              product_name,
              quantity,
              unit_price,
              total_price,
              is_service
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `

          await connection.execute(itemQuery, [
            orderId,
            item.product_id ?? null,
            item.product_name ?? "",
            item.quantity ?? 0,
            item.unit_price ?? 0,
            item.total_price ?? 0,
            item.is_service ?? false,
          ])
        }

        // Update product stock for non-service items
        for (const item of items) {
          if (!item.is_service && item.product_id) {
            await connection.execute(`UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?`, [
              item.quantity ?? 0,
              item.product_id,
            ])
          }
        }
      }

      await connection.commit()
      connection.release()

      if (offline_id) {
        console.log(`[API] Successfully synced offline order ${offline_id} -> ${orderNumber}`)
      } else {
        console.log(`[API] Successfully created online order ${orderNumber}`)
      }

      return NextResponse.json({
        success: true,
        order_id: orderId,
        order_number: orderNumber,
        message: "Order created successfully",
      })
    } catch (error) {
      await connection.rollback()
      connection.release()
      throw error
    }
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
    const connection = await getDbConnection()

    const ordersQuery = `
      SELECT 
        o.*,
        c.name as customer_name,
        c.phone as customer_phone,
        c.email as customer_email
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      ORDER BY o.created_at DESC
    `

    const [ordersResult] = await connection.execute(ordersQuery)
    const orders = ordersResult as OrderRow[]

    console.log(
      `[API] Found ${orders.length} orders in database:`,
      orders.map((o) => ({ id: o.id, order_number: o.order_number, created_at: o.created_at })),
    )

    // Get order items for each order
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const itemsQuery = `
          SELECT * FROM order_items 
          WHERE order_id = ?
          ORDER BY id
        `
        const [itemsResult] = await connection.execute(itemsQuery, [order.id])

        return {
          ...order,
          customer: order.customer_name
            ? {
                id: order.customer_id,
                name: order.customer_name,
                phone: order.customer_phone,
                email: order.customer_email,
              }
            : null,
          order_items: itemsResult,
        }
      }),
    )

    connection.release()

    console.log(`[API] Returning ${ordersWithItems.length} orders with items`)

    return NextResponse.json({
      success: true,
      orders: ordersWithItems,
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
