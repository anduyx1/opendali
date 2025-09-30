"use server"

import { unstable_noStore as noStore } from "next/cache"
import { dbPool } from "@/lib/mysql/client"
import type { Customer } from "@/lib/types/database"
import type { ResultSetHeader, RowDataPacket } from "mysql2"
import { parseNumber } from "@/lib/utils" // Import parseNumber

export type NewCustomer = Omit<
  Customer,
  "id" | "created_at" | "updated_at" | "total_spent" | "total_orders" | "customer_type"
>

interface CustomerRow extends RowDataPacket {
  id: number
  name: string
  email: string | null
  phone: string | null
  address: string | null
  total_spent: number
  total_orders: number
  customer_type: "new" | "regular" | "vip" | null
  created_at: string
  updated_at: string
}

interface CustomerStatsRow extends RowDataPacket {
  total_spent: number
  total_orders: number
}

interface CountRow extends RowDataPacket {
  new_customers_count: number
  previous_month_new_customers: number
  count: number
}

interface TopCustomerSpendingRow extends RowDataPacket {
  id: number
  name: string
  email: string | null
  total_spent_period: number
}

interface TopCustomerOrdersRow extends RowDataPacket {
  id: number
  name: string
  email: string | null
  total_orders_period: number
}

interface CustomerTypeRow extends RowDataPacket {
  customer_type: string
  count: number
}

// Helper to format date for MySQL
const formatToMySQLDateTime = (date: Date | undefined): string | null => {
  if (!date) return null
  return date.toISOString().slice(0, 19).replace("T", " ")
}

export async function getCustomers() {
  noStore()
  const mysql = dbPool

  if (!mysql) {
    console.error("Database pool is not initialized. Cannot fetch customers.")
    return []
  }

  try {
    const [rows] = await mysql.query<CustomerRow[]>("SELECT * FROM customers")
    // Ensure total_spent and total_orders are parsed as numbers
    return rows.map((row) => ({
      ...row,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
      total_spent: parseNumber(row.total_spent),
      total_orders: parseNumber(row.total_orders),
    })) as Customer[]
  } catch (error) {
    console.error("Error fetching customers:", error)
    return []
  }
}

export async function getCustomerById(id: number) {
  noStore()
  const mysql = dbPool

  if (!mysql) {
    console.error("Database pool is not initialized. Cannot fetch customer by ID.")
    return null
  }

  try {
    const [rows] = await mysql.query<CustomerRow[]>("SELECT * FROM customers WHERE id = ?", [id])
    if (rows[0]) {
      return {
        ...rows[0],
        created_at: new Date(rows[0].created_at),
        updated_at: new Date(rows[0].updated_at),
        total_spent: parseNumber(rows[0].total_spent),
        total_orders: parseNumber(rows[0].total_orders),
      } as Customer
    }
    return null
  } catch (error) {
    console.error("Error fetching customer by ID:", error)
    return null
  }
}

export async function createCustomer(customerData: Omit<Customer, "id" | "created_at" | "updated_at">) {
  noStore()
  const mysql = dbPool

  if (!mysql) {
    console.error("Database pool is not initialized. Cannot create customer.")
    return { success: false, error: "Database connection error." }
  }

  try {
    const [result] = await mysql.query<ResultSetHeader>(
      "INSERT INTO customers (name, email, phone, address, total_spent, total_orders, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())",
      [
        customerData.name,
        customerData.email,
        customerData.phone,
        customerData.address,
        parseNumber(customerData.total_spent) || 0, // Ensure it's a number
        parseNumber(customerData.total_orders) || 0, // Ensure it's a number
      ],
    )
    return { success: true, id: result.insertId }
  } catch (error) {
    console.error("Error creating customer:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function updateCustomer(id: number, customerData: Partial<Customer>) {
  noStore()
  const mysql = dbPool

  if (!mysql) {
    console.error("Database pool is not initialized. Cannot update customer.")
    return { success: false, error: "Database connection error." }
  }

  try {
    // Ensure total_spent and total_orders are parsed if they are part of the update
    const updatedData = { ...customerData, updated_at: new Date() }
    if (updatedData.total_spent !== undefined) {
      updatedData.total_spent = parseNumber(updatedData.total_spent)
    }
    if (updatedData.total_orders !== undefined) {
      updatedData.total_orders = parseNumber(updatedData.total_orders)
    }

    await mysql.query("UPDATE customers SET ? WHERE id = ?", [updatedData, id])
    return { success: true }
  } catch (error) {
    console.error("Error updating customer:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function deleteCustomer(id: number) {
  noStore()
  const mysql = dbPool

  if (!mysql) {
    console.error("Database pool is not initialized. Cannot delete customer.")
    return { success: false, error: "Database connection error." }
  }

  try {
    await mysql.query("DELETE FROM customers WHERE id = ?", [id])
    return { success: true }
  } catch (error) {
    console.error("Error deleting customer:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function updateCustomerStats(
  customerId: number,
  orderAmount: number,
  connection?: typeof dbPool,
): Promise<boolean> {
  noStore()
  const conn = connection || dbPool // Use provided connection or pool
  if (!conn) {
    console.warn("MySQL connection not available, cannot update customer stats.")
    return true
  }

  try {
    const [rows] = await conn.execute<CustomerStatsRow[]>(
      "SELECT total_spent, total_orders FROM customers WHERE id = ?",
      [customerId],
    )
    const customer = rows[0]

    if (!customer) {
      console.error("Customer not found for stats update:", customerId)
      return false
    }

    // Explicitly parse to number before arithmetic
    const currentTotalSpent = parseNumber(customer.total_spent)
    const currentTotalOrders = parseNumber(customer.total_orders)

    const newTotalSpent = currentTotalSpent + orderAmount
    const newTotalOrders = currentTotalOrders + 1

    let customerType: "new" | "regular" | "vip" = "regular"
    if (newTotalSpent >= 50000000) {
      customerType = "vip"
    } else if (newTotalOrders === 1) {
      customerType = "new"
    }

    await conn.execute(
      // Use conn.execute here
      `UPDATE customers SET total_spent = ?, total_orders = ?, customer_type = ?, updated_at = NOW() WHERE id = ?`,
      [newTotalSpent, newTotalOrders, customerType, customerId],
    )

    return true
  } catch (error) {
    console.error("Error updating customer stats in MySQL:", error)
    return false
  }
}

export async function getNewCustomersCountMonthly(): Promise<number> {
  noStore()

  const pool = dbPool
  if (!pool) {
    console.warn("MySQL connection pool not available, using mock new customers count.")
    return 0
  }

  try {
    const [rows] = await pool.execute<CountRow[]>(
      `SELECT COUNT(id) as new_customers_count
       FROM customers
       WHERE YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())`,
    )
    const stats = rows[0]
    console.log("New Customers Count Current Month from MySQL:", stats.new_customers_count)
    return stats.new_customers_count || 0
  } catch (error) {
    console.error("Error fetching new customers count from MySQL:", error)
    return 0
  }
}

export async function getNewCustomersCountPreviousMonth(): Promise<number> {
  noStore()

  const pool = dbPool
  if (!pool) {
    console.warn("MySQL connection pool not available, using mock previous month new customers count.")
    return 0
  }

  try {
    const [rows] = await pool.execute<CountRow[]>(
      `SELECT COUNT(id) as previous_month_new_customers
       FROM customers
       WHERE YEAR(created_at) = YEAR(CURDATE() - INTERVAL 1 MONTH)
         AND MONTH(created_at) = MONTH(CURDATE() - INTERVAL 1 MONTH)`,
    )
    const stats = rows[0]
    console.log("New Customers Count Previous Month from MySQL:", stats.previous_month_new_customers)
    return stats.previous_month_new_customers || 0
  } catch (error) {
    console.error("Error fetching previous month new customers count from MySQL:", error)
    return 0
  }
}

export async function getTopCustomersBySpendingInPeriod(
  startDate?: Date,
  endDate?: Date,
  limit = 5,
): Promise<{ id: number; name: string; email: string | null; total_spent_period: number }[]> {
  noStore()
  const mysql = dbPool
  if (!mysql) {
    console.warn("MySQL connection pool not available, using mock top customers by spending.")
    return [
      { id: 1, name: "Nguyễn Văn A", email: "a@example.com", total_spent_period: 15000000 },
      { id: 2, name: "Trần Thị B", email: "b@example.com", total_spent_period: 12000000 },
      { id: 3, name: "Lê Văn C", email: "c@example.com", total_spent_period: 10000000 },
    ]
  }

  try {
    let query = `
      SELECT
        c.id,
        c.name,
        c.email,
        COALESCE(SUM(o.total_amount), 0) AS total_spent_period
      FROM customers c
      JOIN orders o ON c.id = o.customer_id
      WHERE o.order_status = 'completed'
    `
    const params: (string | number | null)[] = []

    if (startDate && endDate) {
      query += ` AND o.created_at >= ? AND o.created_at <= ?`
      params.push(formatToMySQLDateTime(startDate), formatToMySQLDateTime(endDate))
    }

    query += `
      GROUP BY c.id, c.name, c.email
      ORDER BY total_spent_period DESC
      LIMIT ?
    `
    params.push(limit)

    const [rows] = await mysql.execute<TopCustomerSpendingRow[]>(query, params)
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      total_spent_period: parseNumber(row.total_spent_period),
    }))
  } catch (error) {
    console.error("Error fetching top customers by spending in period:", error)
    throw error // Re-throw the error
  }
}

export async function getTopCustomersByOrdersInPeriod(
  startDate?: Date,
  endDate?: Date,
  limit = 5,
): Promise<{ id: number; name: string; email: string | null; total_orders_period: number }[]> {
  noStore()
  const mysql = dbPool
  if (!mysql) {
    console.warn("MySQL connection pool not available, using mock top customers by orders.")
    return [
      { id: 1, name: "Nguyễn Văn A", email: "a@example.com", total_orders_period: 10 },
      { id: 4, name: "Phạm Thị D", email: "d@example.com", total_orders_period: 8 },
      { id: 5, name: "Hoàng Văn E", email: "e@example.com", total_orders_period: 7 },
    ]
  }

  try {
    let query = `
      SELECT
        c.id,
        c.name,
        c.email,
        COUNT(o.id) AS total_orders_period
      FROM customers c
      JOIN orders o ON c.id = o.customer_id
      WHERE o.order_status = 'completed'
    `
    const params: (string | number | null)[] = []

    if (startDate && endDate) {
      query += ` AND o.created_at >= ? AND o.created_at <= ?`
      params.push(formatToMySQLDateTime(startDate), formatToMySQLDateTime(endDate))
    }

    query += `
      GROUP BY c.id, c.name, c.email
      ORDER BY total_orders_period DESC
      LIMIT ?
    `
    params.push(limit)

    const [rows] = await mysql.execute<TopCustomerOrdersRow[]>(query, params)
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      total_orders_period: Number(row.total_orders_period),
    }))
  } catch (error) {
    console.error("Error fetching top customers by orders in period:", error)
    throw error // Re-throw the error
  }
}

export async function getCustomerTypeDistribution(): Promise<{ customer_type: string; count: number }[]> {
  noStore()
  const mysql = dbPool
  if (!mysql) {
    console.warn("MySQL connection pool not available, using mock customer type distribution.")
    return [
      { customer_type: "new", count: 20 },
      { customer_type: "regular", count: 70 },
      { customer_type: "vip", count: 10 },
    ]
  }

  try {
    const [rows] = await mysql.execute<CustomerTypeRow[]>(
      `SELECT
        COALESCE(customer_type, 'unknown') AS customer_type,
        COUNT(id) AS count
      FROM customers
      GROUP BY customer_type
      ORDER BY count DESC`,
    )
    return rows.map((row) => ({
      customer_type: row.customer_type,
      count: Number(row.count),
    }))
  } catch (error) {
    console.error("Error fetching customer type distribution:", error)
    throw error // Re-throw the error
  }
}
