"use server"

import { unstable_noStore as noStore } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { Customer } from "@/lib/types/database"
import { parseNumber } from "@/lib/utils"

export type NewCustomer = Omit<
  Customer,
  "id" | "created_at" | "updated_at" | "total_spent" | "total_orders" | "customer_type"
>

export async function getCustomers(): Promise<Customer[]> {
  noStore()
  const supabase = createClient()

  try {
    const { data: customersData, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching customers from Supabase:", error)
      throw error
    }

    return (customersData || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      address: row.address,
      date_of_birth: row.date_of_birth ? new Date(row.date_of_birth) : null,
      total_spent: parseNumber(row.total_spent || 0),
      total_orders: row.total_orders || 0,
      customer_type: row.customer_type || "new",
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    }))
  } catch (error) {
    console.error("Error fetching customers from Supabase:", error)
    throw error
  }
}

export async function getCustomerById(id: number): Promise<Customer | null> {
  noStore()
  const supabase = createClient()

  try {
    const { data: customerData, error } = await supabase
      .from("customers")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // No rows found
      }
      console.error("Error fetching customer from Supabase:", error)
      throw error
    }

    if (!customerData) return null

    return {
      id: customerData.id,
      name: customerData.name,
      email: customerData.email,
      phone: customerData.phone,
      address: customerData.address,
      date_of_birth: customerData.date_of_birth ? new Date(customerData.date_of_birth) : null,
      total_spent: parseNumber(customerData.total_spent || 0),
      total_orders: customerData.total_orders || 0,
      customer_type: customerData.customer_type || "new",
      created_at: new Date(customerData.created_at),
      updated_at: new Date(customerData.updated_at),
    }
  } catch (error) {
    console.error("Error fetching customer from Supabase:", error)
    throw error
  }
}

export async function createCustomer(customerData: NewCustomer): Promise<Customer> {
  const supabase = createClient()

  try {
    const { data: newCustomer, error } = await supabase
      .from("customers")
      .insert({
        name: customerData.name,
        email: customerData.email,
        phone: customerData.phone,
        address: customerData.address,
        date_of_birth: customerData.date_of_birth,
        customer_type: "new",
        total_spent: 0,
        total_orders: 0,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating customer in Supabase:", error)
      throw error
    }

    return {
      id: newCustomer.id,
      name: newCustomer.name,
      email: newCustomer.email,
      phone: newCustomer.phone,
      address: newCustomer.address,
      date_of_birth: newCustomer.date_of_birth ? new Date(newCustomer.date_of_birth) : null,
      total_spent: parseNumber(newCustomer.total_spent || 0),
      total_orders: newCustomer.total_orders || 0,
      customer_type: newCustomer.customer_type || "new",
      created_at: new Date(newCustomer.created_at),
      updated_at: new Date(newCustomer.updated_at),
    }
  } catch (error) {
    console.error("Error creating customer in Supabase:", error)
    throw error
  }
}

export async function updateCustomer(id: number, customerData: Partial<NewCustomer>): Promise<Customer> {
  const supabase = createClient()

  try {
    const { data: updatedCustomer, error } = await supabase
      .from("customers")
      .update({
        ...customerData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating customer in Supabase:", error)
      throw error
    }

    return {
      id: updatedCustomer.id,
      name: updatedCustomer.name,
      email: updatedCustomer.email,
      phone: updatedCustomer.phone,
      address: updatedCustomer.address,
      date_of_birth: updatedCustomer.date_of_birth ? new Date(updatedCustomer.date_of_birth) : null,
      total_spent: parseNumber(updatedCustomer.total_spent || 0),
      total_orders: updatedCustomer.total_orders || 0,
      customer_type: updatedCustomer.customer_type || "new",
      created_at: new Date(updatedCustomer.created_at),
      updated_at: new Date(updatedCustomer.updated_at),
    }
  } catch (error) {
    console.error("Error updating customer in Supabase:", error)
    throw error
  }
}

export async function deleteCustomer(id: number): Promise<void> {
  const supabase = createClient()

  try {
    const { error } = await supabase
      .from("customers")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Error deleting customer in Supabase:", error)
      throw error
    }
  } catch (error) {
    console.error("Error deleting customer in Supabase:", error)
    throw error
  }
}

export async function updateCustomerStats(customerId: number, amountChange: number): Promise<void> {
  const supabase = createClient()

  try {
    // First get current customer stats
    const { data: customer, error: fetchError } = await supabase
      .from("customers")
      .select("total_spent, total_orders")
      .eq("id", customerId)
      .single()

    if (fetchError) {
      throw fetchError
    }

    // Calculate new stats
    const newTotalSpent = parseNumber(customer.total_spent || 0) + amountChange
    let newTotalOrders = customer.total_orders || 0

    // If this is a new order (positive amount), increment order count
    if (amountChange > 0) {
      newTotalOrders += 1
    }

    // Determine customer type based on spending
    let customerType: "new" | "regular" | "vip" = "new"
    if (newTotalSpent >= 10000000) { // 10M VND
      customerType = "vip"
    } else if (newTotalSpent >= 1000000) { // 1M VND
      customerType = "regular"
    }

    // Update customer stats
    const { error: updateError } = await supabase
      .from("customers")
      .update({
        total_spent: newTotalSpent,
        total_orders: newTotalOrders,
        customer_type: customerType,
        updated_at: new Date().toISOString(),
      })
      .eq("id", customerId)

    if (updateError) {
      throw updateError
    }

    console.log(`Updated customer ${customerId} stats: spent=${newTotalSpent}, orders=${newTotalOrders}, type=${customerType}`)
  } catch (error) {
    console.error("Error updating customer stats in Supabase:", error)
    throw error
  }
}

export async function searchCustomers(query: string): Promise<Customer[]> {
  noStore()
  const supabase = createClient()

  try {
    const { data: customersData, error } = await supabase
      .from("customers")
      .select("*")
      .or(`name.ilike.%${query}%, email.ilike.%${query}%, phone.ilike.%${query}%`)
      .order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    return (customersData || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      address: row.address,
      date_of_birth: row.date_of_birth ? new Date(row.date_of_birth) : null,
      total_spent: parseNumber(row.total_spent || 0),
      total_orders: row.total_orders || 0,
      customer_type: row.customer_type || "new",
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    }))
  } catch (error) {
    console.error("Error searching customers in Supabase:", error)
    throw error
  }
}

export async function getNewCustomersCountMonthly(startDate?: Date, endDate?: Date): Promise<number> {
  noStore()
  const supabase = createClient()

  try {
    const now = new Date()
    const start = startDate || getStartOfMonth(now)
    const end = endDate || getEndOfMonth(now)

    const { data: customers, error } = await supabase
      .from("customers")
      .select("id")
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString())

    if (error) {
      throw error
    }

    return customers?.length || 0
  } catch (error) {
    console.error("Error fetching new customers count from Supabase:", error)
    throw error
  }
}

export async function getNewCustomersCountPreviousMonth(): Promise<number> {
  noStore()
  const supabase = createClient()

  try {
    const now = new Date()
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)

    const { data: customers, error } = await supabase
      .from("customers")
      .select("id")
      .gte("created_at", previousMonth.toISOString())
      .lte("created_at", endOfPreviousMonth.toISOString())

    if (error) {
      throw error
    }

    return customers?.length || 0
  } catch (error) {
    console.error("Error fetching previous month customers count from Supabase:", error)
    throw error
  }
}

export async function getTopCustomersBySpendingInPeriod(startDate?: Date, endDate?: Date, limit = 10) {
  noStore()
  const supabase = createClient()

  try {
    const now = new Date()
    const start = startDate || getStartOfMonth(now)
    const end = endDate || getEndOfMonth(now)

    const { data: topCustomers, error } = await supabase
      .from("orders")
      .select(`
        customer_id,
        total_amount,
        customers:customers(id, name, email)
      `)
      .eq("order_status", "completed")
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString())
      .not("customer_id", "is", null)

    if (error) {
      throw error
    }

    // Group by customer and calculate total spending
    const customerSpending = new Map<number, {
      id: number
      name: string
      email: string | null
      total_spent_period: number
    }>()

    topCustomers?.forEach(order => {
      if (order.customers) {
        const existing = customerSpending.get(order.customer_id!) || {
          id: order.customers.id,
          name: order.customers.name,
          email: order.customers.email,
          total_spent_period: 0,
        }

        existing.total_spent_period += parseNumber(order.total_amount)
        customerSpending.set(order.customer_id!, existing)
      }
    })

    return Array.from(customerSpending.values())
      .sort((a, b) => b.total_spent_period - a.total_spent_period)
      .slice(0, limit)
  } catch (error) {
    console.error("Error fetching top customers by spending from Supabase:", error)
    throw error
  }
}

// Helper function imports
function getStartOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function getEndOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
}