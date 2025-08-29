"use server"

import { unstable_noStore as noStore } from "next/cache"
import { dbPool } from "@/lib/mysql/client"
import { updateProductStock } from "./products"
import { createStockMovement } from "@/lib/actions/inventory"
import { updateCustomerStats } from "./customers"
import type { Order, OrderItem, CartItem } from "@/lib/types/database"
import type { ResultSetHeader, RowDataPacket } from "mysql2"
import {
  parseNumber,
  getStartOfDayInAppTimezone,
  getEndOfDayInAppTimezone,
  getStartOfMonth,
  getEndOfMonth,
} from "@/lib/utils"

interface OrderRow extends RowDataPacket {
  id: number
  customer_id: number | null
  order_number: string
  subtotal: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  payment_method: string
  payment_status: string
  order_status: string
  created_at: string
  updated_at: string
  refund_amount: number
  customer_name?: string
  customer_email?: string
  customer_id_from_join?: number
}

interface OrderItemRow extends RowDataPacket {
  id: number
  order_id: number
  product_id: number
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
  returned_quantity: number
  returned_at: string | null
  return_reason: string | null
  cost_price: number
  barcode: string | null
  sku: string | null
  is_service: boolean
}

interface StatsRow extends RowDataPacket {
  revenue: number
  orders_count: number
  gross_profit: number
  total_products_sold: number
  average_order_value: number
}

interface PaymentMethodRow extends RowDataPacket {
  payment_method: string
  total_revenue: number
}

interface CategorySalesRow extends RowDataPacket {
  category_name: string | null
  total_revenue: number
  total_quantity_sold: number
}

interface SalesDataRow extends RowDataPacket {
  created_at: string
  total_amount: number
}

interface GrossProfitOrderRow extends RowDataPacket {
  order_number: string
  total_amount: number
  total_gross_profit: number
}

interface SettingsRow extends RowDataPacket {
  last_order_sequence: number
}

interface ApiOrderResponse {
  id: number
  order_number: string
  customer_id?: number
  customer_name?: string
  status: string
  payment_method: string
  payment_status: string
  created_at: string
  updated_at: string
  subtotal: number | string
  tax_amount: number | string
  discount_amount: number | string
  total_amount: number | string
  refund_amount?: number | string
  order_items?: ApiOrderItem[]
}

interface ApiOrderItem {
  id: number
  product_id: number
  product_name: string
  quantity: number
  unit_price: number | string
  total_price: number | string
}

// Helper to format date for MySQL
const formatToMySQLDateTime = (date: Date | undefined): string | null => {
  if (!date) return null
  return date.toISOString().slice(0, 19).replace("T", " ")
}

export async function getOrders(startDate?: Date, endDate?: Date): Promise<Order[]> {
  noStore()

  if (typeof window !== "undefined" && navigator.onLine) {
    try {
      const response = await fetch("/api/orders")
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.orders) {
          return data.orders.map((order: ApiOrderResponse) => ({
            ...order,
            created_at: new Date(order.created_at).toISOString(),
            updated_at: new Date(order.updated_at).toISOString(),
            subtotal: parseNumber(order.subtotal),
            tax_amount: parseNumber(order.tax_amount),
            discount_amount: parseNumber(order.discount_amount),
            total_amount: parseNumber(order.total_amount),
            refund_amount: parseNumber(order.refund_amount || 0),
            order_items:
              order.order_items?.map((item: ApiOrderItem) => ({
                ...item,
                unit_price: parseNumber(item.unit_price),
                total_price: parseNumber(item.total_price),
              })) || [],
          }))
        }
      }
    } catch (error) {
      console.error("Failed to fetch orders from API, falling back to direct DB query:", error)
    }
  }

  const mysql = dbPool
  try {
    let query = `SELECT
o.id,
o.customer_id,
o.order_number,
o.subtotal,
o.tax_amount,
o.discount_amount,
o.total_amount,
o.payment_method,
o.payment_status,
o.order_status,
o.created_at,
o.updated_at,
o.refund_amount,
c.name AS customer_name,
c.id AS customer_id_from_join,
c.email AS customer_email
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.id`
    const params: (string | null)[] = []
    if (startDate && endDate) {
      query += ` WHERE o.created_at >= ? AND o.created_at <= ?`
      params.push(formatToMySQLDateTime(startDate), formatToMySQLDateTime(endDate))
    }
    query += ` ORDER BY o.created_at DESC`
    const [ordersRows] = await mysql.execute<OrderRow[]>(query, params)
    console.log("[getOrders] Raw orders data from DB:", ordersRows)

    // Fetch order items with product cost_price, barcode, and SKU
    const [orderItemsRows] = await mysql.execute<OrderItemRow[]>(
      `SELECT
oi.id,
oi.order_id,
oi.product_id,
oi.product_name,
oi.quantity,
oi.unit_price,
oi.total_price,
oi.returned_quantity,
oi.returned_at,
oi.return_reason,
p.cost_price,
p.barcode,
p.sku,
oi.is_service
FROM order_items oi
LEFT JOIN products p ON oi.product_id = p.id`,
    )

    const ordersMap = new Map<number, Order>()
    ordersRows.forEach((row) => {
      ordersMap.set(row.id, {
        id: row.id,
        customer_id: row.customer_id,
        order_number: row.order_number,
        subtotal: parseNumber(row.subtotal),
        tax_amount: parseNumber(row.tax_amount),
        discount_amount: parseNumber(row.discount_amount),
        total_amount: parseNumber(row.total_amount),
        payment_method: row.payment_method,
        payment_status: row.payment_status,
        order_status: row.order_status,
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
        refund_amount: parseNumber(row.refund_amount),
        customer: row.customer_id_from_join
          ? {
              id: row.customer_id_from_join,
              name: row.customer_name!,
              email: row.customer_email!,
            }
          : null,
        order_items: [],
      })
    })
    orderItemsRows.forEach((row) => {
      const order = ordersMap.get(row.order_id)
      if (order) {
        order.order_items?.push({
          id: row.id,
          order_id: row.order_id,
          product_id: row.product_id,
          product_name: row.product_name,
          quantity: row.quantity,
          unit_price: parseNumber(row.unit_price),
          total_price: parseNumber(row.total_price),
          returned_quantity: row.returned_quantity,
          returned_at: row.returned_at ? new Date(row.returned_at) : undefined,
          return_reason: row.return_reason,
          cost_price: parseNumber(row.cost_price),
          product: {
            // Populate the product object with barcode and SKU
            id: row.product_id,
            barcode: row.barcode,
            sku: row.sku,
          },
          is_service: row.is_service,
        })
      }
    })
    return Array.from(ordersMap.values())
  } catch (error) {
    console.error("Error fetching orders from MySQL:", error)
    throw error // Re-throw the error to be caught by the caller
  }
}

export async function getOrderById(id: number): Promise<Order | null> {
  noStore()
  const mysql = dbPool
  try {
    const [orderRows] = await mysql.execute<OrderRow[]>(
      `SELECT o.*, c.name as customer_name, c.id as customer_id_from_join, c.email as customer_email
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.id
WHERE o.id = ?`,
      [id],
    )
    const orderRow = orderRows[0]
    if (!orderRow) return null

    // Fetch order items with product cost_price, barcode, and SKU
    const [orderItemsRows] = await mysql.execute<OrderItemRow[]>(
      `SELECT
oi.id,
oi.order_id,
oi.product_id,
oi.product_name,
oi.quantity,
oi.unit_price,
oi.total_price,
oi.returned_quantity,
oi.returned_at,
oi.return_reason,
p.cost_price,
p.barcode,
p.sku,
oi.is_service
FROM order_items oi
LEFT JOIN products p ON oi.product_id = p.id
WHERE oi.order_id = ?`,
      [id],
    )

    return {
      id: orderRow.id,
      customer_id: orderRow.customer_id,
      order_number: orderRow.order_number,
      subtotal: parseNumber(orderRow.subtotal),
      tax_amount: parseNumber(orderRow.tax_amount),
      discount_amount: parseNumber(orderRow.discount_amount),
      total_amount: parseNumber(orderRow.total_amount),
      payment_method: orderRow.payment_method,
      payment_status: orderRow.payment_status,
      order_status: orderRow.order_status,
      created_at: new Date(orderRow.created_at),
      updated_at: new Date(orderRow.updated_at),
      refund_amount: parseNumber(orderRow.refund_amount),
      customer: orderRow.customer_id_from_join
        ? {
            id: orderRow.customer_id_from_join,
            name: orderRow.customer_name!,
            email: orderRow.customer_email!,
          }
        : null,
      order_items: orderItemsRows.map((row) => ({
        id: row.id,
        order_id: row.order_id,
        product_id: row.product_id,
        product_name: row.product_name,
        quantity: row.quantity,
        unit_price: parseNumber(row.unit_price),
        total_price: parseNumber(row.total_price),
        returned_quantity: row.returned_quantity,
        returned_at: row.returned_at ? new Date(row.returned_at).toISOString() : undefined,
        return_reason: row.return_reason,
        cost_price: parseNumber(row.cost_price),
        product: {
          // Populate the product object with barcode and SKU
          id: row.product_id,
          barcode: row.barcode,
          sku: row.sku,
        },
        is_service: row.is_service,
      })) as OrderItem[],
    }
  } catch (error) {
    console.error("Error fetching order from MySQL:", error)
    throw error // Re-throw the error
  }
}

export async function createOrder(
  customerId: number | null,
  cartItems: CartItem[],
  paymentMethod = "cash",
  discountAmount = 0,
  taxRate = 0.1,
): Promise<Order | null> {
  console.log("Server Action: createOrder invoked.")
  console.log("[v0] Cart items received in createOrder:", cartItems)
  cartItems.forEach((item, index) => {
    console.log(`[v0] Cart item ${index}:`, {
      id: item.id,
      name: item.name,
      is_service: item.is_service,
      price: item.price,
      quantity: item.quantity,
    })
  })

  const mysql = dbPool
  const connection = await mysql.getConnection()
  try {
    await connection.beginTransaction()

    // 1. Fetch and increment the last order sequence from pos_app_settings
    const [settingsRows] = await connection.execute<SettingsRow[]>(
      `SELECT last_order_sequence FROM pos_app_settings WHERE id = 'pos_settings' FOR UPDATE`, // Use FOR UPDATE for concurrency safety
    )
    const currentSettings = settingsRows[0]

    if (!currentSettings) {
      throw new Error(
        "POS settings not found. Please ensure default settings are configured with id 'pos_settings' in pos_app_settings table.",
      )
    }

    const newOrderSequence = currentSettings.last_order_sequence + 1
    // Format the order number, e.g., ORD-000001, ORD-000002
    const newOrderNumber = `ORD-${newOrderSequence.toString().padStart(6, "0")}`

    // 2. Update the last order sequence in pos_app_settings
    await connection.execute(`UPDATE pos_app_settings SET last_order_sequence = ? WHERE id = 'pos_settings'`, [
      newOrderSequence,
    ])

    // Calculate totals
    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const taxAmount = subtotal * taxRate
    const totalAmount = subtotal + taxAmount - discountAmount

    // Create order
    const [orderResult] = await connection.execute<ResultSetHeader>(
      `INSERT INTO orders (customer_id, order_number, subtotal, tax_amount, discount_amount, total_amount, payment_method, payment_status, order_status)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        customerId,
        newOrderNumber, // Use the new sequential order number
        subtotal,
        taxAmount,
        discountAmount,
        totalAmount,
        paymentMethod,
        "completed",
        "completed",
      ],
    )
    const orderId = orderResult.insertId

    // Create order items
    const orderItemsData = cartItems.map((item) => {
      // Enhanced validation for product name
      let productName = item.name

      // If name is null, undefined, or empty string, provide fallback
      if (!productName || productName.trim() === "") {
        productName = item.is_service ? "Dịch vụ nhanh" : "Sản phẩm"
        console.log(`[v0] WARNING: Item ${item.id} has no name, using fallback: "${productName}"`)
      }

      console.log(`[v0] Mapping item ${item.id}: name="${item.name}" -> product_name="${productName}"`)

      return [
        orderId,
        item.id,
        productName, // Use validated product name
        item.quantity,
        item.price,
        item.price * item.quantity,
        item.is_service || false, // Ensure boolean value
      ]
    })

    console.log("[v0] Order items data to be inserted:", orderItemsData)

    if (orderItemsData.length > 0) {
      await connection.query(
        `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price, is_service) VALUES ?`,
        [orderItemsData],
      )
    }

    // Update product stock
    for (const item of cartItems) {
      // Only update stock for non-service items
      if (!item.is_service) {
        await updateProductStock(item.id, -item.quantity)
        // Record stock movement for sale
        await createStockMovement(item.id, -item.quantity, "export", `Sale Order #${newOrderNumber}`)
      }
    }
    // Update customer stats if customer exists, passing the current connection
    if (customerId) {
      await updateCustomerStats(customerId, totalAmount, mysql)
    }
    await connection.commit()
    return (await getOrderById(orderId)) || null
  } catch (error) {
    await connection.rollback()
    console.error("Error in createOrder with MySQL:", error)
    throw error // Re-throw the error
  } finally {
    connection.release()
  }
}

interface ItemToReturn {
  orderItemId: number
  productId: number
  quantity: number
  reason: string
  unitPrice: number
}

export async function processReturnAndRefund(
  orderId: number,
  itemsToReturn: ItemToReturn[],
  refundMethod: string,
): Promise<{ success: boolean; message: string; order?: Order }> {
  console.log("[v0] processReturnAndRefund called with:", { orderId, itemsToReturn, refundMethod })

  const mysql = dbPool
  const connection = await mysql.getConnection()
  try {
    await connection.beginTransaction()

    let totalRefundAmount = 0
    const order = await getOrderById(orderId)
    if (!order) {
      await connection.rollback()
      console.log("[v0] Order not found:", orderId)
      return { success: false, message: "Order not found." }
    }

    console.log("[v0] Processing return for order:", order.order_number)

    for (const item of itemsToReturn) {
      console.log("[v0] Processing return item:", item)

      const orderItem = order.order_items?.find((oi) => oi.id === item.orderItemId)
      if (!orderItem) {
        await connection.rollback()
        console.log("[v0] Order item not found:", item.orderItemId)
        return { success: false, message: `Order item with ID ${item.orderItemId} not found.` }
      }

      const availableToReturn = orderItem.quantity - (orderItem.returned_quantity || 0)
      if (item.quantity <= 0 || item.quantity > availableToReturn) {
        await connection.rollback()
        console.log("[v0] Invalid return quantity:", { requested: item.quantity, available: availableToReturn })
        return {
          success: false,
          message: `Invalid return quantity for product ${orderItem.product_name}. Available to return: ${availableToReturn}.`,
        }
      }

      // Update order_items table
      console.log("[v0] Updating order_items table for item:", item.orderItemId)
      await connection.execute(
        `UPDATE order_items
SET returned_quantity = returned_quantity + ?, returned_at = NOW(), return_reason = ?
WHERE id = ?`,
        [item.quantity, item.reason, item.orderItemId],
      )

      // Update product stock (add quantity back) only for non-service items
      if (!orderItem.is_service) {
        console.log("[v0] Updating product stock for non-service item:", item.productId)
        await updateProductStock(item.productId, item.quantity)
        await createStockMovement(
          item.productId,
          item.quantity,
          "sale_return",
          `Return from Order #${order.order_number}`,
        )
      } else {
        console.log("[v0] Skipping stock update for service item:", item.productId)
      }

      // Calculate refund amount for this item
      totalRefundAmount += item.unitPrice * item.quantity
    }

    console.log("[v0] Total refund amount calculated:", totalRefundAmount)

    // Update orders table with refund amount and status
    const newRefundAmount = parseNumber(order.refund_amount || 0) + totalRefundAmount
    let newOrderStatus = order.order_status
    let newPaymentStatus = order.payment_status

    const totalItemsSold = order.order_items?.reduce((sum, oi) => sum + oi.quantity, 0) || 0
    const totalItemsReturned = order.order_items?.reduce((sum, oi) => sum + (oi.returned_quantity || 0), 0) || 0

    if (totalItemsReturned + itemsToReturn.reduce((sum, i) => sum + i.quantity, 0) >= totalItemsSold) {
      newOrderStatus = "returned"
    } else if (totalItemsReturned + itemsToReturn.reduce((sum, i) => sum + i.quantity, 0) > 0) {
      newOrderStatus = "partially_returned"
    }

    if (newRefundAmount >= order.total_amount) {
      newPaymentStatus = "refunded"
    } else if (newRefundAmount > 0) {
      newPaymentStatus = "partially_refunded"
    }

    console.log("[v0] Updating order status:", { newOrderStatus, newPaymentStatus, newRefundAmount })

    await connection.execute(
      `UPDATE orders
SET refund_amount = ?, order_status = ?, payment_status = ?, updated_at = NOW()
WHERE id = ?`,
      [newRefundAmount, newOrderStatus, newPaymentStatus, orderId],
    )

    // Update customer total_spent (subtract refunded amount), passing the current connection
    if (order.customer_id) {
      console.log("[v0] Updating customer stats for refund:", order.customer_id)
      await updateCustomerStats(order.customer_id, -totalRefundAmount, mysql)
    }

    await connection.commit()
    console.log("[v0] Return and refund processed successfully")

    const updatedOrder = await getOrderById(orderId)
    return { success: true, message: "Return and refund processed successfully.", order: updatedOrder || undefined }
  } catch (error: unknown) {
    await connection.rollback()
    console.error("[v0] Error processing return and refund:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return { success: false, message: `Failed to process return and refund: ${errorMessage}` }
  } finally {
    connection.release()
  }
}

export async function getTodayStats() {
  noStore()
  const mysql = dbPool
  try {
    const TARGET_APP_TIMEZONE = "Asia/Ho_Chi_Minh"
    const now = new Date()
    const nowInTargetTimezone = new Date(now.toLocaleString("en-US", { timeZone: TARGET_APP_TIMEZONE }))
    
    const todayYear = nowInTargetTimezone.getFullYear()
    const todayMonth = nowInTargetTimezone.getMonth()
    const todayDay = nowInTargetTimezone.getDate()
    
    const todayDateInTargetTimezone = new Date(todayYear, todayMonth, todayDay)
    const startOfTodayInAppTimezone = getStartOfDayInAppTimezone(todayDateInTargetTimezone)
    const endOfTodayInAppTimezone = getEndOfDayInAppTimezone(todayDateInTargetTimezone)

    const [rows] = await mysql.execute<StatsRow[]>(
      `SELECT
COALESCE(SUM(o.total_amount), 0) AS revenue,
COUNT(o.id) AS orders_count,
COALESCE(SUM((oi.unit_price - p.cost_price) * oi.quantity), 0) AS gross_profit
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN products p ON oi.product_id = p.id
WHERE o.created_at >= ? AND o.created_at <= ? AND o.order_status = 'completed'`,
      [formatToMySQLDateTime(startOfTodayInAppTimezone), formatToMySQLDateTime(endOfTodayInAppTimezone)],
    )
    const stats = rows[0]
    console.log("[getTodayStats] Raw stats from DB:", stats)
    console.log("[getTodayStats] Date range:", {
      start: startOfTodayInAppTimezone.toISOString(),
      end: endOfTodayInAppTimezone.toISOString(),
      startLocal: startOfTodayInAppTimezone.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }),
      endLocal: endOfTodayInAppTimezone.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" })
    })
    console.log("[getTodayStats] Timezone info:", {
      now: now.toISOString(),
      nowInTargetTimezone: nowInTargetTimezone.toString(),
      todayDateInTargetTimezone: todayDateInTargetTimezone.toString()
    })
    console.log("Today Stats from MySQL:", stats)
    return {
      revenue: parseNumber(stats?.revenue),
      orders: Number(stats?.orders_count || 0),
      grossProfit: parseNumber(stats?.gross_profit),
    }
  } catch (error) {
    console.error("Error fetching today stats from MySQL:", error)
    throw error // Re-throw the error
  }
}

export async function getMonthlyTotalStats(startDate?: Date, endDate?: Date) {
  noStore()
  const mysql = dbPool
  try {
    const now = new Date()
    // Ensure startDate and endDate are timezone-aware if not provided
    const start = startDate ? getStartOfDayInAppTimezone(startDate) : getStartOfMonth(now)
    const end = endDate ? getEndOfDayInAppTimezone(endDate) : getEndOfMonth(now)

    const [rows] = await mysql.execute<StatsRow[]>(
      `SELECT
COALESCE(SUM(o.total_amount), 0) AS revenue,
COUNT(o.id) AS orders_count,
COALESCE(SUM((oi.unit_price - p.cost_price) * oi.quantity), 0) AS gross_profit
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN products p ON oi.product_id = p.id
WHERE o.created_at >= ? AND o.created_at <= ? AND o.order_status = 'completed'`,
      [formatToMySQLDateTime(start), formatToMySQLDateTime(end)],
    )
    const stats = rows[0]
    console.log("[getMonthlyTotalStats] Raw stats from DB:", stats)
    return {
      revenue: parseNumber(stats?.revenue),
      orders: Number(stats?.orders_count || 0),
      grossProfit: parseNumber(stats?.gross_profit),
    }
  } catch (error) {
    console.error("Error fetching monthly total stats from MySQL:", error)
    throw error // Re-throw the error
  }
}

export async function getMonthlyStats(startDate?: Date, endDate?: Date) {
  noStore()
  const mysql = dbPool
  try {
    const now = new Date()
    // Ensure startDate and endDate are timezone-aware if not provided
    const start = startDate ? getStartOfDayInAppTimezone(startDate) : getStartOfMonth(now)
    const end = endDate ? getEndOfDayInAppTimezone(endDate) : getEndOfMonth(now)

    const [rows] = await mysql.execute<PaymentMethodRow[]>(
      `SELECT
 payment_method,
 COALESCE(SUM(total_amount), 0) AS total_revenue
FROM orders
WHERE created_at >= ? AND created_at <= ? AND order_status = 'completed'
GROUP BY payment_method
ORDER BY total_revenue DESC`,
      [formatToMySQLDateTime(start), formatToMySQLDateTime(end)],
    )
    return rows.map((row) => ({
      payment_method: row.payment_method,
      total_revenue: parseNumber(row.total_revenue),
    }))
  } catch (error) {
    console.error("Error fetching monthly stats from MySQL:", error)
    throw error // Re-throw the error
  }
}

export async function getProductsSoldCountMonthly(startDate?: Date, endDate?: Date): Promise<number> {
  noStore()
  const mysql = dbPool
  try {
    const now = new Date()
    // Ensure startDate and endDate are timezone-aware if not provided
    const start = startDate ? getStartOfDayInAppTimezone(startDate) : getStartOfMonth(now)
    const end = endDate ? getEndOfDayInAppTimezone(endDate) : getEndOfMonth(now)

    const [rows] = await mysql.execute<StatsRow[]>(
      `SELECT
COALESCE(SUM(oi.quantity), 0) AS total_products_sold
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
WHERE o.created_at >= ? AND o.created_at <= ? AND o.order_status = 'completed'`,
      [formatToMySQLDateTime(start), formatToMySQLDateTime(end)],
    )
    const stats = rows[0]
    return Number(stats?.total_products_sold || 0)
  } catch (error) {
    console.error("Error fetching products sold count from MySQL:", error)
    throw error // Re-throw the error
  }
}

export async function getRecentSales(limit = 5, startDate?: Date, endDate?: Date): Promise<Order[]> {
  noStore()
  const mysql = dbPool
  try {
    let query = `SELECT o.*, c.name as customer_name, c.email as customer_email
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.id`
    const params: (string | number | null)[] = []

    if (startDate && endDate) {
      // Ensure startDate and endDate are timezone-aware
      const start = getStartOfDayInAppTimezone(startDate)
      const end = getEndOfDayInAppTimezone(endDate)
      query += ` WHERE o.created_at >= ? AND o.created_at <= ?`
      params.push(formatToMySQLDateTime(start), formatToMySQLDateTime(end))
    }

    query += ` ORDER BY o.created_at DESC LIMIT ?`
    params.push(limit)

    const [ordersRows] = await mysql.execute<OrderRow[]>(query, params)

    return ordersRows.map((row) => ({
      id: row.id,
      customer_id: row.customer_id,
      order_number: row.order_number,
      subtotal: parseNumber(row.subtotal),
      tax_amount: parseNumber(row.tax_amount),
      discount_amount: parseNumber(row.discount_amount),
      total_amount: parseNumber(row.total_amount),
      payment_method: row.payment_method,
      payment_status: row.payment_status,
      order_status: row.order_status,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
      refund_amount: parseNumber(row.refund_amount),
      customer: row.customer_name ? { name: row.customer_name, email: row.customer_email } : null,
      order_items: [],
    }))
  } catch (error) {
    console.error("Error fetching recent sales from MySQL:", error)
    throw error // Re-throw the error
  }
}

export async function getOrderDetails(orderId: number) {
  try {
    const mysql = dbPool
    const [orderRows] = await mysql.query<OrderRow[]>("SELECT * FROM orders WHERE id = ?", [orderId])
    if (orderRows.length === 0) return null

    const order = orderRows[0]

    // Fetch order items with product cost_price, barcode, and SKU
    const [itemRows] = await mysql.query<OrderItemRow[]>(
      "SELECT oi.product_id as id, p.name as product_name, oi.quantity, oi.unit_price, oi.total_price, oi.returned_quantity, oi.returned_at, oi.return_reason, p.cost_price, p.barcode, p.sku, oi.is_service FROM order_items oi LEFT JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?",
      [orderId],
    )

    // Map itemRows to include the nested product object
    const mappedItemRows = itemRows.map((row) => ({
      ...row,
      product: {
        id: row.id, // This is the product_id from order_items
        barcode: row.barcode,
        sku: row.sku,
      },
      is_service: row.is_service,
    })) as OrderItem[]

    return { ...order, order_items: mappedItemRows }
  } catch (error) {
    console.error("Error fetching order details:", error)
    throw error // Re-throw the error
  }
}

export async function getSalesDataForLast7Days(): Promise<
  { sale_date: string; total_sales: number; day_of_week: string }[]
> {
  noStore()
  const mysql = dbPool

  try {
    const TARGET_APP_TIMEZONE = "Asia/Ho_Chi_Minh"
    const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"] // Sunday to Saturday

    // Get the current date in the target timezone (Asia/Ho_Chi_Minh)
    // This is crucial to determine "today" from the user's perspective.
    const now = new Date() // This is UTC on Vercel
    const nowInTargetTimezone = new Date(now.toLocaleString("en-US", { timeZone: TARGET_APP_TIMEZONE }))

    const todayYear = nowInTargetTimezone.getFullYear()
    const todayMonth = nowInTargetTimezone.getMonth()
    const todayDay = nowInTargetTimezone.getDate()

    const dateRangesToFetch: { start: Date; end: Date; fullDateKey: string; dayOfWeek: string }[] = []

    for (let i = 6; i >= 0; i--) {
      // Calculate the date for each of the last 7 days in the target timezone
      const currentDayInTargetTimezone = new Date(todayYear, todayMonth, todayDay - i)

      // Get the start and end of this specific day in Asia/Ho_Chi_Minh, as UTC Date objects
      const startOfDayUtc = getStartOfDayInAppTimezone(currentDayInTargetTimezone)
      const endOfDayUtc = getEndOfDayInAppTimezone(currentDayInTargetTimezone)

      const formattedDateKey = `${currentDayInTargetTimezone.getFullYear()}-${String(currentDayInTargetTimezone.getMonth() + 1).padStart(2, "0")}-${String(currentDayInTargetTimezone.getDate()).padStart(2, "0")}`

      dateRangesToFetch.push({
        start: startOfDayUtc,
        end: endOfDayUtc,
        fullDateKey: formattedDateKey, // Store YYYY-MM-DD for mapping
        dayOfWeek: dayNames[currentDayInTargetTimezone.getDay()],
      })
    }

    // Determine the overall date range for the SQL query
    const overallStartDate = dateRangesToFetch[0].start
    const overallEndDate = dateRangesToFetch[dateRangesToFetch.length - 1].end

    console.log(
      `[getSalesDataForLast7Days] Overall UTC query range: ${overallStartDate.toISOString()} to ${overallEndDate.toISOString()}`,
    )
    console.log("[getSalesDataForLast7Days] Date ranges for each day:", dateRangesToFetch.map(range => ({
      date: range.fullDateKey,
      start: range.start.toISOString(),
      end: range.end.toISOString(),
      startLocal: range.start.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }),
      endLocal: range.end.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" })
    })))

    const query = `
      SELECT
        created_at,
        total_amount
      FROM orders
      WHERE created_at >= ? AND created_at <= ? AND order_status = 'completed'
      ORDER BY created_at ASC
    `
    const [rows] = await mysql.execute<SalesDataRow[]>(query, [
      formatToMySQLDateTime(overallStartDate),
      formatToMySQLDateTime(overallEndDate),
    ])
    console.log("[getSalesDataForLast7Days] Raw sales data from DB:", rows)

    const salesDataMap = new Map<string, number>() // Key: YYYY-MM-DD (Asia/Ho_Chi_Minh)

    // Initialize map with all 7 days and 0 sales, using the Asia/Ho_Chi_Minh date string
    dateRangesToFetch.forEach((range) => {
      salesDataMap.set(range.fullDateKey, 0) // Initialize with fullDateKey
    })
    rows.forEach((row) => {
      const createdAtUtc = new Date(row.created_at) // This is a Date object in UTC from DB
      // Convert this UTC date to Asia/Ho_Chi_Minh date string for grouping
      const dateInHoChiMinh = new Date(createdAtUtc.toLocaleString("en-US", { timeZone: TARGET_APP_TIMEZONE }))
      const formattedDateKey = `${dateInHoChiMinh.getFullYear()}-${String(dateInHoChiMinh.getMonth() + 1).padStart(2, "0")}-${String(dateInHoChiMinh.getDate()).padStart(2, "0")}`

      const currentSales = salesDataMap.get(formattedDateKey) || 0
      salesDataMap.set(formattedDateKey, currentSales + parseNumber(row.total_amount))
    })

    const salesDataForChart: { sale_date: string; total_sales: number; day_of_week: string }[] = []
    dateRangesToFetch.forEach((range) => {
      salesDataForChart.push({
        sale_date: range.fullDateKey, // Return YYYY-MM-DD here
        total_sales: salesDataMap.get(range.fullDateKey) || 0,
        day_of_week: range.dayOfWeek,
      })
    })

    console.log("[getSalesDataForLast7Days] Processed sales data for chart:", salesDataForChart)

    return salesDataForChart
  } catch (error) {
    console.error("[getSalesDataForLast7Days] Error fetching sales data for last 7 days:", error)
    
    // Log pool status when connection error occurs
    if (error && typeof error === 'object' && 'code' in error) {
      const mysqlError = error as any
      if (mysqlError.code === 'ER_CON_COUNT_ERROR' || mysqlError.code === 'ER_TOO_MANY_CONNECTIONS') {
        console.error("[getSalesDataForLast7Days] MySQL connection pool exhausted!")
        console.error("[getSalesDataForLast7Days] Error details:", {
          code: mysqlError.code,
          errno: mysqlError.errno,
          sqlMessage: mysqlError.sqlMessage
        })
      }
    }
    
    throw error
  }
}

export async function getMonthlyGrossProfit(startDate?: Date, endDate?: Date): Promise<number> {
  noStore()
  const mysql = dbPool
  try {
    const now = new Date()
    // Ensure startDate and endDate are timezone-aware if not provided
    const start = startDate ? getStartOfDayInAppTimezone(startDate) : getStartOfMonth(now)
    const end = endDate ? getEndOfDayInAppTimezone(endDate) : getEndOfMonth(now)

    const [rows] = await mysql.execute<StatsRow[]>(
      `SELECT
COALESCE(SUM((oi.unit_price - p.cost_price) * oi.quantity), 0) AS gross_profit
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
JOIN products p ON oi.product_id = p.id
WHERE o.created_at >= ? AND o.created_at <= ? AND o.order_status = 'completed'`,
      [formatToMySQLDateTime(start), formatToMySQLDateTime(end)],
    )
    const stats = rows[0]
    console.log("[getMonthlyGrossProfit] Raw gross profit from DB:", stats)
    return parseNumber(stats?.gross_profit)
  } catch (error) {
    console.error("Error fetching monthly gross profit from MySQL:", error)
    throw error // Re-throw the error
  }
}

export async function getMonthlySalesByCategory(
  startDate?: Date,
  endDate?: Date,
): Promise<{ category_name: string | null; total_revenue: number; total_quantity_sold: number }[]> {
  noStore()
  const mysql = dbPool
  try {
    const now = new Date()
    // Ensure startDate and endDate are timezone-aware if not provided
    const start = startDate ? getStartOfDayInAppTimezone(startDate) : getStartOfMonth(now)
    const end = endDate ? getEndOfDayInAppTimezone(endDate) : getEndOfMonth(now)

    const [rows] = await mysql.execute<CategorySalesRow[]>(
      `SELECT
COALESCE(c.name, 'Không danh mục') AS category_name,
COALESCE(SUM(oi.total_price), 0) AS total_revenue,
COALESCE(SUM(oi.quantity), 0) AS total_quantity_sold
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
JOIN products p ON oi.product_id = p.id
LEFT JOIN categories c ON p.category_id = c.id
WHERE o.created_at >= ? AND o.created_at <= ? AND o.order_status = 'completed'
GROUP BY c.name
ORDER BY total_revenue DESC`,
      [formatToMySQLDateTime(start), formatToMySQLDateTime(end)],
    )
    return rows.map((row) => ({
      category_name: row.category_name,
      total_revenue: parseNumber(row.total_revenue),
      total_quantity_sold: Number(row.total_quantity_sold),
    }))
  } catch (error) {
    console.error("Error fetching monthly sales by category from MySQL:", error)
    throw error // Re-throw the error
  }
}

export async function getMonthlySalesByPaymentMethod(
  startDate?: Date,
  endDate?: Date,
): Promise<{ payment_method: string; total_revenue: number }[]> {
  noStore()
  const mysql = dbPool
  try {
    const now = new Date()
    // Ensure startDate and endDate are timezone-aware if not provided
    const start = startDate ? getStartOfDayInAppTimezone(startDate) : getStartOfMonth(now)
    const end = endDate ? getEndOfDayInAppTimezone(endDate) : getEndOfMonth(now)

    const [rows] = await mysql.execute<PaymentMethodRow[]>(
      `SELECT
 payment_method,
 COALESCE(SUM(total_amount), 0) AS total_revenue
FROM orders
WHERE created_at >= ? AND created_at <= ? AND order_status = 'completed'
GROUP BY payment_method
ORDER BY total_revenue DESC`,
      [formatToMySQLDateTime(start), formatToMySQLDateTime(end)],
    )
    return rows.map((row) => ({
      payment_method: row.payment_method,
      total_revenue: parseNumber(row.total_revenue),
    }))
  } catch (error) {
    console.error("Error fetching monthly sales by payment method from MySQL:", error)
    throw error // Re-throw the error
  }
}

export async function getAverageOrderValue(startDate?: Date, endDate?: Date): Promise<number> {
  noStore()
  const mysql = dbPool
  try {
    const now = new Date()
    // Ensure startDate and endDate are timezone-aware if not provided
    const start = startDate ? getStartOfDayInAppTimezone(startDate) : getStartOfMonth(now)
    const end = endDate ? getEndOfDayInAppTimezone(endDate) : getEndOfMonth(now)

    let query = `
SELECT
COALESCE(AVG(total_amount), 0) AS average_order_value
FROM orders
WHERE order_status = 'completed'`
    const params: (string | null)[] = []

    if (startDate && endDate) {
      query += ` AND created_at >= ? AND created_at <= ?`
      params.push(formatToMySQLDateTime(start), formatToMySQLDateTime(end))
    }

    const [rows] = await mysql.execute<StatsRow[]>(query, params)
    const stats = rows[0]
    console.log("[getAverageOrderValue] Raw AOV from DB:", stats)
    return parseNumber(stats?.average_order_value)
  } catch (error) {
    console.error("Error fetching average order value from MySQL:", error)
    throw error // Re-throw the error
  }
}

export async function getGrossProfitPerOrder(
  startDate?: Date,
  endDate?: Date,
): Promise<{ order_number: string; total_gross_profit: number; total_amount: number }[]> {
  noStore()
  const mysql = dbPool
  try {
    const now = new Date()
    // Ensure startDate and endDate are timezone-aware if not provided
    const start = startDate ? getStartOfDayInAppTimezone(startDate) : getStartOfMonth(now)
    const end = endDate ? getEndOfDayInAppTimezone(endDate) : getEndOfMonth(now)

    let query = `
SELECT
  o.order_number,
  o.total_amount,
  COALESCE(SUM((oi.unit_price - p.cost_price) * oi.quantity), 0) AS total_gross_profit
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
WHERE o.order_status = 'completed'`
    const params: (string | null)[] = []

    if (startDate && endDate) {
      query += ` AND o.created_at >= ? AND o.created_at <= ?`
      params.push(formatToMySQLDateTime(start), formatToMySQLDateTime(end))
    }

    query += ` GROUP BY o.id, o.order_number, o.total_amount ORDER BY o.created_at DESC`

    const [rows] = await mysql.execute<GrossProfitOrderRow[]>(query, params)
    console.log("[getGrossProfitPerOrder] Raw gross profit per order from DB:", rows)

    return rows.map((row) => ({
      order_number: row.order_number,
      total_gross_profit: parseNumber(row.total_gross_profit),
      total_amount: parseNumber(row.total_amount),
    }))
  } catch (error) {
    console.error("Error fetching gross profit per order from MySQL:", error)
    throw error
  }
}

export const placeCustomerOrder = createOrder
