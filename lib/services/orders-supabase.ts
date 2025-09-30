"use server"

import { unstable_noStore as noStore } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { updateProductStock } from "./products"
import { updateCustomerStats } from "./customers"
import type { Order, OrderItem, CartItem } from "@/lib/types/database"
import {
  parseNumber,
  getStartOfDayInAppTimezone,
  getEndOfDayInAppTimezone,
  getStartOfMonth,
  getEndOfMonth,
} from "@/lib/utils"

// Local stock movement function
async function createStockMovement(
  productId: number,
  quantityChange: number,
  movementType: string,
  reason: string,
) {
  const supabase = createClient()

  try {
    const { error } = await supabase
      .from("stock_movements")
      .insert({
        product_id: productId,
        quantity_change: quantityChange,
        movement_type: movementType,
        reason: reason,
      })

    if (error) {
      console.error("Error recording stock movement:", error)
      return false
    }

    console.log(`Stock movement recorded: Product ID ${productId}, Change ${quantityChange}, Type ${movementType}`)
    return true
  } catch (error) {
    console.error("Error recording stock movement:", error)
    return false
  }
}

interface StatsRow {
  revenue: number
  orders_count: number
  gross_profit: number
  total_products_sold: number
  average_order_value: number
}

interface PaymentMethodRow {
  payment_method: string
  total_revenue: number
}

interface CategorySalesRow {
  category_name: string | null
  total_revenue: number
  total_quantity_sold: number
}

interface SalesDataRow {
  created_at: string
  total_amount: number
}

interface GrossProfitOrderRow {
  order_number: string
  total_amount: number
  total_gross_profit: number
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

export async function getOrders(startDate?: Date, endDate?: Date): Promise<Order[]> {
  noStore()
  const supabase = createClient()

  try {
    let query = supabase
      .from("orders")
      .select(`
        id,
        customer_id,
        order_number,
        subtotal,
        tax_amount,
        discount_amount,
        total_amount,
        payment_method,
        payment_status,
        order_status,
        created_at,
        updated_at,
        refund_amount,
        customers:customers(id, name, email),
        order_items(
          id,
          order_id,
          product_id,
          product_name,
          quantity,
          unit_price,
          total_price,
          returned_quantity,
          returned_at,
          return_reason,
          cost_price,
          is_service,
          products:products(id, barcode, sku)
        )
      `)
      .order("created_at", { ascending: false })

    if (startDate && endDate) {
      query = query
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString())
    }

    const { data: ordersData, error } = await query

    if (error) {
      console.error("Error fetching orders from Supabase:", error)
      throw error
    }

    return (ordersData || []).map((row: any) => ({
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
      refund_amount: parseNumber(row.refund_amount || 0),
      customer: row.customers ? {
        id: row.customers.id,
        name: row.customers.name,
        email: row.customers.email,
      } : null,
      order_items: (row.order_items || []).map((item: any) => ({
        id: item.id,
        order_id: item.order_id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: parseNumber(item.unit_price),
        total_price: parseNumber(item.total_price),
        returned_quantity: item.returned_quantity || 0,
        returned_at: item.returned_at ? new Date(item.returned_at) : undefined,
        return_reason: item.return_reason,
        cost_price: parseNumber(item.cost_price),
        product: item.products ? {
          id: item.products.id,
          barcode: item.products.barcode,
          sku: item.products.sku,
        } : null,
        is_service: item.is_service || false,
      })),
    }))
  } catch (error) {
    console.error("Error fetching orders from Supabase:", error)
    throw error
  }
}

export async function getOrderById(id: number): Promise<Order | null> {
  noStore()
  const supabase = createClient()

  try {
    const { data: orderData, error } = await supabase
      .from("orders")
      .select(`
        *,
        customers:customers(id, name, email),
        order_items(
          id,
          order_id,
          product_id,
          product_name,
          quantity,
          unit_price,
          total_price,
          returned_quantity,
          returned_at,
          return_reason,
          cost_price,
          is_service,
          products:products(id, barcode, sku)
        )
      `)
      .eq("id", id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // No rows found
      }
      console.error("Error fetching order from Supabase:", error)
      throw error
    }

    if (!orderData) return null

    return {
      id: orderData.id,
      customer_id: orderData.customer_id,
      order_number: orderData.order_number,
      subtotal: parseNumber(orderData.subtotal),
      tax_amount: parseNumber(orderData.tax_amount),
      discount_amount: parseNumber(orderData.discount_amount),
      total_amount: parseNumber(orderData.total_amount),
      payment_method: orderData.payment_method,
      payment_status: orderData.payment_status,
      order_status: orderData.order_status,
      created_at: new Date(orderData.created_at),
      updated_at: new Date(orderData.updated_at),
      refund_amount: parseNumber(orderData.refund_amount || 0),
      customer: orderData.customers ? {
        id: orderData.customers.id,
        name: orderData.customers.name,
        email: orderData.customers.email,
      } : null,
      order_items: (orderData.order_items || []).map((item: any) => ({
        id: item.id,
        order_id: item.order_id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: parseNumber(item.unit_price),
        total_price: parseNumber(item.total_price),
        returned_quantity: item.returned_quantity || 0,
        returned_at: item.returned_at ? new Date(item.returned_at).toISOString() : undefined,
        return_reason: item.return_reason,
        cost_price: parseNumber(item.cost_price),
        product: item.products ? {
          id: item.products.id,
          barcode: item.products.barcode,
          sku: item.products.sku,
        } : null,
        is_service: item.is_service || false,
      })) as OrderItem[],
    }
  } catch (error) {
    console.error("Error fetching order from Supabase:", error)
    throw error
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

  const supabase = createClient()

  try {
    // Get and increment the last order sequence
    const { data: settingsData, error: settingsError } = await supabase
      .from("pos_app_settings")
      .select("last_order_sequence")
      .eq("id", "pos_settings")
      .single()

    if (settingsError) {
      throw new Error("POS settings not found. Please ensure default settings are configured.")
    }

    const newOrderSequence = (settingsData.last_order_sequence || 0) + 1
    const newOrderNumber = `ORD-${newOrderSequence.toString().padStart(6, "0")}`

    // Update the last order sequence
    await supabase
      .from("pos_app_settings")
      .update({ last_order_sequence: newOrderSequence })
      .eq("id", "pos_settings")

    // Calculate totals
    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const taxAmount = subtotal * taxRate
    const totalAmount = subtotal + taxAmount - discountAmount

    // Create order
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_id: customerId,
        order_number: newOrderNumber,
        subtotal,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        payment_method: paymentMethod,
        payment_status: "completed",
        order_status: "completed",
      })
      .select()
      .single()

    if (orderError) {
      throw orderError
    }

    // Create order items
    const orderItemsData = cartItems.map((item) => {
      let productName = item.name
      if (!productName || productName.trim() === "") {
        productName = item.is_service ? "Dịch vụ nhanh" : "Sản phẩm"
        console.log(`[v0] WARNING: Item ${item.id} has no name, using fallback: "${productName}"`)
      }

      return {
        order_id: orderData.id,
        product_id: item.id,
        product_name: productName,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        is_service: item.is_service || false,
      }
    })

    if (orderItemsData.length > 0) {
      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItemsData)

      if (itemsError) {
        throw itemsError
      }
    }

    // Update product stock and create stock movements
    for (const item of cartItems) {
      if (!item.is_service) {
        await updateProductStock(item.id, -item.quantity)
        await createStockMovement(item.id, -item.quantity, "export", `Sale Order #${newOrderNumber}`)
      }
    }

    // Update customer stats if customer exists
    if (customerId) {
      await updateCustomerStats(customerId, totalAmount)
    }

    return await getOrderById(orderData.id)
  } catch (error) {
    console.error("Error in createOrder with Supabase:", error)
    throw error
  }
}

export async function getRecentSales(limit = 5, startDate?: Date, endDate?: Date): Promise<Order[]> {
  noStore()
  const supabase = createClient()

  try {
    let query = supabase
      .from("orders")
      .select(`
        id,
        customer_id,
        order_number,
        subtotal,
        tax_amount,
        discount_amount,
        total_amount,
        payment_method,
        payment_status,
        order_status,
        created_at,
        updated_at,
        refund_amount,
        customers:customers(name, email)
      `)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (startDate && endDate) {
      const start = getStartOfDayInAppTimezone(startDate)
      const end = getEndOfDayInAppTimezone(endDate)
      query = query
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString())
    }

    const { data: ordersData, error } = await query

    if (error) {
      console.error("Error fetching recent sales from Supabase:", error)
      throw error
    }

    return (ordersData || []).map((row: any) => ({
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
      refund_amount: parseNumber(row.refund_amount || 0),
      customer: row.customers ? {
        name: row.customers.name,
        email: row.customers.email
      } : null,
      order_items: [],
    }))
  } catch (error) {
    console.error("Error fetching recent sales from Supabase:", error)
    throw error
  }
}

export async function getTodayStats() {
  noStore()
  const supabase = createClient()

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

    // Get revenue and orders count
    const { data: ordersData, error: ordersError } = await supabase
      .from("orders")
      .select("total_amount")
      .eq("order_status", "completed")
      .gte("created_at", startOfTodayInAppTimezone.toISOString())
      .lte("created_at", endOfTodayInAppTimezone.toISOString())

    if (ordersError) {
      throw ordersError
    }

    const revenue = (ordersData || []).reduce((sum, order) => sum + parseNumber(order.total_amount), 0)
    const ordersCount = ordersData?.length || 0

    // Calculate gross profit (requires joining with order_items and products)
    const { data: profitData, error: profitError } = await supabase
      .from("order_items")
      .select(`
        unit_price,
        quantity,
        cost_price,
        orders!inner(
          created_at,
          order_status
        )
      `)
      .eq("orders.order_status", "completed")
      .gte("orders.created_at", startOfTodayInAppTimezone.toISOString())
      .lte("orders.created_at", endOfTodayInAppTimezone.toISOString())

    let grossProfit = 0
    if (!profitError && profitData) {
      grossProfit = profitData.reduce((sum, item) => {
        const unitProfit = parseNumber(item.unit_price) - parseNumber(item.cost_price || 0)
        return sum + (unitProfit * item.quantity)
      }, 0)
    }

    console.log("Today Stats from Supabase:", { revenue, ordersCount, grossProfit })
    return {
      revenue,
      orders: ordersCount,
      grossProfit,
    }
  } catch (error) {
    console.error("Error fetching today stats from Supabase:", error)
    throw error
  }
}

export async function getSalesDataForLast7Days(): Promise<
  { sale_date: string; total_sales: number; day_of_week: string }[]
> {
  noStore()
  const supabase = createClient()

  try {
    const TARGET_APP_TIMEZONE = "Asia/Ho_Chi_Minh"
    const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]

    const now = new Date()
    const nowInTargetTimezone = new Date(now.toLocaleString("en-US", { timeZone: TARGET_APP_TIMEZONE }))

    const todayYear = nowInTargetTimezone.getFullYear()
    const todayMonth = nowInTargetTimezone.getMonth()
    const todayDay = nowInTargetTimezone.getDate()

    const dateRangesToFetch: { start: Date; end: Date; fullDateKey: string; dayOfWeek: string }[] = []

    for (let i = 6; i >= 0; i--) {
      const currentDayInTargetTimezone = new Date(todayYear, todayMonth, todayDay - i)
      const startOfDayUtc = getStartOfDayInAppTimezone(currentDayInTargetTimezone)
      const endOfDayUtc = getEndOfDayInAppTimezone(currentDayInTargetTimezone)
      const formattedDateKey = `${currentDayInTargetTimezone.getFullYear()}-${String(currentDayInTargetTimezone.getMonth() + 1).padStart(2, "0")}-${String(currentDayInTargetTimezone.getDate()).padStart(2, "0")}`

      dateRangesToFetch.push({
        start: startOfDayUtc,
        end: endOfDayUtc,
        fullDateKey: formattedDateKey,
        dayOfWeek: dayNames[currentDayInTargetTimezone.getDay()],
      })
    }

    const overallStartDate = dateRangesToFetch[0].start
    const overallEndDate = dateRangesToFetch[dateRangesToFetch.length - 1].end

    const { data: salesData, error } = await supabase
      .from("orders")
      .select("created_at, total_amount")
      .eq("order_status", "completed")
      .gte("created_at", overallStartDate.toISOString())
      .lte("created_at", overallEndDate.toISOString())
      .order("created_at", { ascending: true })

    if (error) {
      throw error
    }

    const salesDataMap = new Map<string, number>()

    // Initialize map with all 7 days
    dateRangesToFetch.forEach((range) => {
      salesDataMap.set(range.fullDateKey, 0)
    })

    // Process sales data
    if (salesData) {
      salesData.forEach((row) => {
        const createdAtUtc = new Date(row.created_at)
        const dateInHoChiMinh = new Date(createdAtUtc.toLocaleString("en-US", { timeZone: TARGET_APP_TIMEZONE }))
        const formattedDateKey = `${dateInHoChiMinh.getFullYear()}-${String(dateInHoChiMinh.getMonth() + 1).padStart(2, "0")}-${String(dateInHoChiMinh.getDate()).padStart(2, "0")}`

        const currentSales = salesDataMap.get(formattedDateKey) || 0
        salesDataMap.set(formattedDateKey, currentSales + parseNumber(row.total_amount))
      })
    }

    const salesDataForChart: { sale_date: string; total_sales: number; day_of_week: string }[] = []
    dateRangesToFetch.forEach((range) => {
      salesDataForChart.push({
        sale_date: range.fullDateKey,
        total_sales: salesDataMap.get(range.fullDateKey) || 0,
        day_of_week: range.dayOfWeek,
      })
    })

    console.log("[getSalesDataForLast7Days] Processed sales data for chart:", salesDataForChart)
    return salesDataForChart
  } catch (error) {
    console.error("[getSalesDataForLast7Days] Error fetching sales data for last 7 days:", error)
    throw error
  }
}

// Additional functions needed by the application
export async function getMonthlyStats(startDate?: Date, endDate?: Date) {
  noStore()
  const supabase = createClient()

  try {
    const now = new Date()
    const start = startDate ? getStartOfDayInAppTimezone(startDate) : getStartOfMonth(now)
    const end = endDate ? getEndOfDayInAppTimezone(endDate) : getEndOfMonth(now)

    const { data: ordersData, error } = await supabase
      .from("orders")
      .select("payment_method, total_amount")
      .eq("order_status", "completed")
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString())

    if (error) {
      throw error
    }

    const paymentMethodStats = new Map<string, number>()

    ordersData?.forEach(order => {
      const current = paymentMethodStats.get(order.payment_method) || 0
      paymentMethodStats.set(order.payment_method, current + parseNumber(order.total_amount))
    })

    return Array.from(paymentMethodStats.entries()).map(([payment_method, total_revenue]) => ({
      payment_method,
      total_revenue
    }))
  } catch (error) {
    console.error("Error fetching monthly stats from Supabase:", error)
    throw error
  }
}

export async function getMonthlyTotalStats(startDate?: Date, endDate?: Date) {
  noStore()
  const supabase = createClient()

  try {
    const now = new Date()
    const start = startDate ? getStartOfDayInAppTimezone(startDate) : getStartOfMonth(now)
    const end = endDate ? getEndOfDayInAppTimezone(endDate) : getEndOfMonth(now)

    // Get revenue and orders count
    const { data: ordersData, error: ordersError } = await supabase
      .from("orders")
      .select("total_amount")
      .eq("order_status", "completed")
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString())

    if (ordersError) {
      throw ordersError
    }

    const revenue = (ordersData || []).reduce((sum, order) => sum + parseNumber(order.total_amount), 0)
    const ordersCount = ordersData?.length || 0

    // Calculate gross profit (requires joining with order_items and products)
    const { data: profitData, error: profitError } = await supabase
      .from("order_items")
      .select(`
        unit_price,
        quantity,
        cost_price,
        orders!inner(
          created_at,
          order_status
        )
      `)
      .eq("orders.order_status", "completed")
      .gte("orders.created_at", start.toISOString())
      .lte("orders.created_at", end.toISOString())

    let grossProfit = 0
    if (!profitError && profitData) {
      grossProfit = profitData.reduce((sum, item) => {
        const unitProfit = parseNumber(item.unit_price) - parseNumber(item.cost_price || 0)
        return sum + (unitProfit * item.quantity)
      }, 0)
    }

    return {
      revenue,
      orders: ordersCount,
      grossProfit,
    }
  } catch (error) {
    console.error("Error fetching monthly total stats from Supabase:", error)
    throw error
  }
}

export async function getProductsSoldCountMonthly(startDate?: Date, endDate?: Date): Promise<number> {
  noStore()
  const supabase = createClient()

  try {
    const now = new Date()
    const start = startDate ? getStartOfDayInAppTimezone(startDate) : getStartOfMonth(now)
    const end = endDate ? getEndOfDayInAppTimezone(endDate) : getEndOfMonth(now)

    const { data: itemsData, error } = await supabase
      .from("order_items")
      .select(`
        quantity,
        orders!inner(
          created_at,
          order_status
        )
      `)
      .eq("orders.order_status", "completed")
      .gte("orders.created_at", start.toISOString())
      .lte("orders.created_at", end.toISOString())

    if (error) {
      throw error
    }

    return (itemsData || []).reduce((total, item) => total + item.quantity, 0)
  } catch (error) {
    console.error("Error fetching products sold count from Supabase:", error)
    throw error
  }
}

export async function getAverageOrderValue(startDate?: Date, endDate?: Date): Promise<number> {
  noStore()
  const supabase = createClient()

  try {
    const now = new Date()
    const start = startDate ? getStartOfDayInAppTimezone(startDate) : getStartOfMonth(now)
    const end = endDate ? getEndOfDayInAppTimezone(endDate) : getEndOfMonth(now)

    const { data: ordersData, error } = await supabase
      .from("orders")
      .select("total_amount")
      .eq("order_status", "completed")
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString())

    if (error) {
      throw error
    }

    if (!ordersData || ordersData.length === 0) return 0

    const totalRevenue = ordersData.reduce((sum, order) => sum + parseNumber(order.total_amount), 0)
    return totalRevenue / ordersData.length
  } catch (error) {
    console.error("Error fetching average order value from Supabase:", error)
    throw error
  }
}

export async function getMonthlyGrossProfit(startDate?: Date, endDate?: Date): Promise<number> {
  noStore()
  const supabase = createClient()

  try {
    const now = new Date()
    const start = startDate ? getStartOfDayInAppTimezone(startDate) : getStartOfMonth(now)
    const end = endDate ? getEndOfDayInAppTimezone(endDate) : getEndOfMonth(now)

    const { data: profitData, error } = await supabase
      .from("order_items")
      .select(`
        unit_price,
        quantity,
        cost_price,
        orders!inner(
          created_at,
          order_status
        )
      `)
      .eq("orders.order_status", "completed")
      .gte("orders.created_at", start.toISOString())
      .lte("orders.created_at", end.toISOString())

    if (error) {
      throw error
    }

    return (profitData || []).reduce((sum, item) => {
      const unitProfit = parseNumber(item.unit_price) - parseNumber(item.cost_price || 0)
      return sum + (unitProfit * item.quantity)
    }, 0)
  } catch (error) {
    console.error("Error fetching monthly gross profit from Supabase:", error)
    throw error
  }
}

export async function getMonthlySalesByPaymentMethod(
  startDate?: Date,
  endDate?: Date,
): Promise<{ payment_method: string; total_revenue: number }[]> {
  noStore()
  const supabase = createClient()

  try {
    const now = new Date()
    const start = startDate ? getStartOfDayInAppTimezone(startDate) : getStartOfMonth(now)
    const end = endDate ? getEndOfDayInAppTimezone(endDate) : getEndOfMonth(now)

    const { data: ordersData, error } = await supabase
      .from("orders")
      .select("payment_method, total_amount")
      .eq("order_status", "completed")
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString())

    if (error) {
      throw error
    }

    const paymentMethodStats = new Map<string, number>()

    ordersData?.forEach(order => {
      const current = paymentMethodStats.get(order.payment_method) || 0
      paymentMethodStats.set(order.payment_method, current + parseNumber(order.total_amount))
    })

    return Array.from(paymentMethodStats.entries())
      .map(([payment_method, total_revenue]) => ({
        payment_method,
        total_revenue
      }))
      .sort((a, b) => b.total_revenue - a.total_revenue)
  } catch (error) {
    console.error("Error fetching monthly sales by payment method from Supabase:", error)
    throw error
  }
}

export async function getGrossProfitPerOrder(
  startDate?: Date,
  endDate?: Date,
): Promise<{ order_number: string; total_gross_profit: number; total_amount: number }[]> {
  noStore()
  const supabase = createClient()

  try {
    const now = new Date()
    const start = startDate ? getStartOfDayInAppTimezone(startDate) : getStartOfMonth(now)
    const end = endDate ? getEndOfDayInAppTimezone(endDate) : getEndOfMonth(now)

    const { data: ordersWithItems, error } = await supabase
      .from("orders")
      .select(`
        order_number,
        total_amount,
        created_at,
        order_items(
          unit_price,
          quantity,
          cost_price
        )
      `)
      .eq("order_status", "completed")
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString())
      .order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    return (ordersWithItems || []).map(order => {
      const totalGrossProfit = (order.order_items || []).reduce((sum: number, item: any) => {
        const unitProfit = parseNumber(item.unit_price) - parseNumber(item.cost_price || 0)
        return sum + (unitProfit * item.quantity)
      }, 0)

      return {
        order_number: order.order_number,
        total_gross_profit: totalGrossProfit,
        total_amount: parseNumber(order.total_amount),
      }
    })
  } catch (error) {
    console.error("Error fetching gross profit per order from Supabase:", error)
    throw error
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

  const supabase = createClient()

  try {
    let totalRefundAmount = 0
    const order = await getOrderById(orderId)
    if (!order) {
      console.log("[v0] Order not found:", orderId)
      return { success: false, message: "Order not found." }
    }

    console.log("[v0] Processing return for order:", order.order_number)

    for (const item of itemsToReturn) {
      console.log("[v0] Processing return item:", item)

      const orderItem = order.order_items?.find((oi) => oi.id === item.orderItemId)
      if (!orderItem) {
        console.log("[v0] Order item not found:", item.orderItemId)
        return { success: false, message: `Order item with ID ${item.orderItemId} not found.` }
      }

      const availableToReturn = orderItem.quantity - (orderItem.returned_quantity || 0)
      if (item.quantity <= 0 || item.quantity > availableToReturn) {
        console.log("[v0] Invalid return quantity:", { requested: item.quantity, available: availableToReturn })
        return {
          success: false,
          message: `Invalid return quantity for product ${orderItem.product_name}. Available to return: ${availableToReturn}.`,
        }
      }

      // Update order_items table
      console.log("[v0] Updating order_items table for item:", item.orderItemId)
      const { error: updateError } = await supabase
        .from("order_items")
        .update({
          returned_quantity: (orderItem.returned_quantity || 0) + item.quantity,
          returned_at: new Date().toISOString(),
          return_reason: item.reason,
        })
        .eq("id", item.orderItemId)

      if (updateError) {
        throw updateError
      }

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

    const { error: orderUpdateError } = await supabase
      .from("orders")
      .update({
        refund_amount: newRefundAmount,
        order_status: newOrderStatus,
        payment_status: newPaymentStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)

    if (orderUpdateError) {
      throw orderUpdateError
    }

    // Update customer total_spent (subtract refunded amount)
    if (order.customer_id) {
      console.log("[v0] Updating customer stats for refund:", order.customer_id)
      await updateCustomerStats(order.customer_id, -totalRefundAmount)
    }

    console.log("[v0] Return and refund processed successfully")

    const updatedOrder = await getOrderById(orderId)
    return { success: true, message: "Return and refund processed successfully.", order: updatedOrder || undefined }
  } catch (error: unknown) {
    console.error("[v0] Error processing return and refund:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return { success: false, message: `Failed to process return and refund: ${errorMessage}` }
  }
}

// Re-export the placeCustomerOrder alias
export const placeCustomerOrder = createOrder