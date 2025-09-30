"use client"

// Import server-side functions directly
import { getOrders, createOrder, getOrderById, getTodayStats, getMonthlyStats } from "@/lib/services/orders"
import type { Order, CartItem } from "@/lib/types/database"
import { offlineSyncService } from "./offline-sync"

interface ProductOrderHistory {
  order_id: string
  order_code: string
  customer_name: string
  quantity: number
  unit_price: number
  total_amount: number
  order_date: string
  order_status: string
}

interface ApiOrderResponse {
  id: number
  order_number: string
  customer_id: number | null
  subtotal: string | number
  tax_amount: string | number
  discount_amount: string | number
  total_amount: string | number
  refund_amount: string | number
  payment_method: string
  payment_status: string
  status: string
  created_at: string
  updated_at: string
  user_id: number | null
  order_items?: ApiOrderItem[]
}

interface ApiOrderItem {
  id: number
  order_id: number
  product_id: number
  product_name: string
  quantity: number
  unit_price: string | number
  total_price: string | number
  cost_price: string | number
  returned_quantity: number
  returned_at: string | null
  return_reason: string | null
  is_service: boolean
  created_at?: string
  updated_at?: string
}

export async function getOrdersFromAPI(): Promise<Order[]> {
  try {
    const response = await fetch("/api/orders")
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    if (data.success && data.orders) {
      return data.orders.map((order: ApiOrderResponse) => ({
        ...order,
        created_at: new Date(order.created_at).toISOString(),
        updated_at: new Date(order.updated_at).toISOString(),
        subtotal: Number.parseFloat(order.subtotal.toString()) || 0,
        tax_amount: Number.parseFloat(order.tax_amount.toString()) || 0,
        discount_amount: Number.parseFloat(order.discount_amount.toString()) || 0,
        total_amount: Number.parseFloat(order.total_amount.toString()) || 0,
        refund_amount: Number.parseFloat(order.refund_amount.toString()) || 0,
        order_items:
          order.order_items?.map((item: ApiOrderItem) => ({
            ...item,
            unit_price: Number.parseFloat(item.unit_price.toString()) || 0,
            total_price: Number.parseFloat(item.total_price.toString()) || 0,
            cost_price: Number.parseFloat(item.cost_price.toString()) || 0,
            created_at: new Date(item.created_at || order.created_at).toISOString(),
            updated_at: new Date(item.updated_at || order.created_at).toISOString(),
          })) || [],
      }))
    }
    return []
  } catch (error) {
    console.error("Error fetching orders from API:", error)
    throw error
  }
}

export async function getOrdersClient(): Promise<Order[]> {
  try {
    const orders = await getOrders()
    return orders
  } catch (error) {
    console.error("Error fetching orders (client):", error)
    return []
  }
}

export async function getOrderByIdClient(id: number): Promise<Order | null> {
  try {
    const order = await getOrderById(id)
    return order
  } catch (error) {
    console.error(`Error fetching order by ID (client) for ID ${id}:`, error)
    return null
  }
}

export async function createOrderClient(
  customerId: number | null,
  cartItems: CartItem[],
  paymentMethod = "cash",
  discountAmount = 0,
  taxRate = 0.1,
  notes = "", // Add notes parameter
): Promise<Order | null> {
  const isOnline = typeof window !== "undefined" && navigator.onLine

  if (!isOnline) {
    // Create offline order directly without trying server first
    try {
      const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
      const taxAmount = subtotal * taxRate
      const totalAmount = subtotal + taxAmount - discountAmount

      const offlineOrderId = await offlineSyncService.createOfflineOrder({
        customer_id: customerId || undefined,
        subtotal,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        payment_method: paymentMethod,
        payment_status: "completed",
        status: "completed",
        items: cartItems.map((item) => ({
          product_id: item.id,
          product_name: item.name,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity,
          is_service: item.is_service,
        })),
      })

      // Create mock order object for offline mode
      const orderNumber = `OFF-${Date.now().toString().slice(-6)}`
      const mockOrder: Order = {
        id: Number.parseInt(offlineOrderId.split("_")[1]) || Date.now(),
        order_number: orderNumber,
        customer_id: customerId,
        subtotal,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        payment_method: paymentMethod,
        payment_status: "completed",
        order_status: "completed",
        refund_amount: null,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: null,
        order_items: cartItems.map((item) => ({
          id: item.id,
          order_id: Number.parseInt(offlineOrderId.split("_")[1]) || Date.now(),
          product_id: item.id,
          product_name: item.name,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity,
          cost_price: 0, // CartItem doesn't have cost_price
          returned_quantity: 0,
          returned_at: null,
          return_reason: null,
          is_service: item.is_service || false,
          created_at: new Date(),
          updated_at: new Date(),
        })),
      }

      console.log("[v0] Created offline order:", orderNumber)
      return mockOrder
    } catch (offlineError) {
      console.error("Error creating offline order:", offlineError)
      return null
    }
  }

  try {
    // Call the server-side createOrder function
    const newOrder = await createOrder(customerId, cartItems, paymentMethod, discountAmount, taxRate)
    console.log("[v0] Created online order:", newOrder?.order_number)
    return newOrder
  } catch (error) {
    console.error("Error creating order (client):", error)

    try {
      const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
      const taxAmount = subtotal * taxRate
      const totalAmount = subtotal + taxAmount - discountAmount

      const offlineOrderId = await offlineSyncService.createOfflineOrder({
        customer_id: customerId || undefined,
        subtotal,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        payment_method: paymentMethod,
        payment_status: "completed",
        status: "completed",
        items: cartItems.map((item) => ({
          product_id: item.id,
          product_name: item.name,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity,
          is_service: item.is_service,
        })),
      })

      const orderNumber = `OFF-${Date.now().toString().slice(-6)}`
      const mockOrder: Order = {
        id: Number.parseInt(offlineOrderId.split("_")[1]) || Date.now(),
        order_number: orderNumber,
        customer_id: customerId,
        subtotal,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        payment_method: paymentMethod,
        payment_status: "completed",
        order_status: "completed",
        refund_amount: null,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: null,
        order_items: cartItems.map((item) => ({
          id: item.id,
          order_id: Number.parseInt(offlineOrderId.split("_")[1]) || Date.now(),
          product_id: item.id,
          product_name: item.name,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity,
          cost_price: 0, // CartItem doesn't have cost_price
          returned_quantity: 0,
          returned_at: null,
          return_reason: null,
          is_service: item.is_service || false,
          created_at: new Date(),
          updated_at: new Date(),
        })),
      }

      console.log("[v0] Fallback to offline order:", orderNumber)
      return mockOrder
    } catch (fallbackError) {
      console.error("Error creating fallback offline order:", fallbackError)
      return null
    }
  }
}

export async function getTodayStatsClient() {
  try {
    const stats = await getTodayStats()
    return stats
  } catch (error) {
    console.error("Error fetching today stats (client):", error)
    return { revenue: 0, orders: 0 }
  }
}

export async function getMonthlyStatsClient() {
  try {
    const stats = await getMonthlyStats()
    return stats
  } catch (error) {
    console.error("Error fetching monthly stats (client):", error)
    return { revenue: 0, orders: 0 }
  }
}

export async function getProductOrderHistory(productId: string): Promise<ProductOrderHistory[]> {
  try {
    const response = await fetch(`/api/products/${productId}/order-history`)
    if (!response.ok) {
      throw new Error("Failed to fetch product order history")
    }
    return await response.json()
  } catch (error) {
    console.error("Error fetching product order history:", error)
    return []
  }
}

export { createOrderClient as createOrder }
