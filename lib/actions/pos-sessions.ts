"use server"

import { unstable_noStore as noStore } from "next/cache"
import { dbPool } from "@/lib/mysql/client"
import type { PosSession, CartItem, Customer } from "@/lib/types/database"
import type { RowDataPacket, ResultSetHeader } from "mysql2"

interface PosSessionRow extends RowDataPacket {
  id: number
  user_id: number | null
  session_name: string
  cart_items: string
  customer_id: number | null
  discount_amount: string
  received_amount: string
  notes: string
  tax_rate: string
  created_at: string
  updated_at: string
}

interface CustomerRow extends RowDataPacket {
  id: number
  name: string
  email: string | null
  phone: string | null
  address: string | null
  total_spent: string
  total_orders: string
  customer_type: string
  created_at: string
  updated_at: string
}

export async function getPosSessions(userId: number | null): Promise<PosSession[]> {
  noStore() // Ensure this is dynamic and not cached
  const mysql = dbPool

  if (!mysql) {
    console.error("Database pool is not initialized. Check environment variables.")
    return []
  }

  try {
    // 1. Fetch all POS sessions without joining customers initially
    const [sessionRows] = await mysql.query<PosSessionRow[]>(
      `SELECT ps.* FROM pos_sessions ps WHERE ps.user_id = ? OR ps.user_id IS NULL ORDER BY ps.created_at ASC`,
      [userId],
    )

    const customerIds = new Set<number>()
    sessionRows.forEach((row) => {
      if (row.customer_id) {
        customerIds.add(row.customer_id)
      }
    })

    const customersMap = new Map<number, Customer>()
    if (customerIds.size > 0) {
      // 2. Fetch all unique customer details in one go
      const [customerRows] = await mysql.query<CustomerRow[]>(
        `SELECT id, name, email, phone, address, total_spent, total_orders, customer_type, created_at, updated_at FROM customers WHERE id IN (?)`,
        [Array.from(customerIds)],
      )
      customerRows.forEach((c) => {
        customersMap.set(c.id, {
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          address: c.address,
          total_spent: Number.parseFloat(c.total_spent || "0"),
          total_orders: Number.parseInt(c.total_orders || "0"),
          customer_type: c.customer_type as "new" | "regular" | "vip" | null,
          date_of_birth: null,
          created_at: new Date(c.created_at),
          updated_at: new Date(c.updated_at),
        })
      })
    }

    // 3. Process session rows and attach customer data
    return sessionRows.map((row) => {
      let cartItems: CartItem[] = []
      try {
        cartItems = row.cart_items ? JSON.parse(row.cart_items) : []
      } catch (e) {
        console.error("Failed to parse cart_items JSON for session ID:", row.id, e)
        cartItems = []
      }

      const customer = row.customer_id ? customersMap.get(row.customer_id) || null : null

      return {
        id: row.id,
        user_id: row.user_id,
        session_name: row.session_name,
        cart_items: cartItems,
        customer_id: row.customer_id,
        discount_amount: Number.parseFloat(row.discount_amount || "0"),
        received_amount: Number.parseFloat(row.received_amount || "0"),
        notes: row.notes,
        tax_rate: Number.parseFloat(row.tax_rate || "0"),
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
        customer: customer,
      } as PosSession
    })
  } catch (error) {
    console.error("Error fetching POS sessions:", error)
    return []
  }
}

export async function createPosSession(
  sessionData: Omit<PosSession, "id" | "created_at" | "updated_at" | "customer">,
): Promise<PosSession> {
  noStore()
  const mysql = dbPool

  if (!mysql) {
    console.error("Database pool is not initialized. Cannot create POS session.")
    throw new Error("Database connection error.")
  }

  try {
    const [result] = await mysql.query<ResultSetHeader>(
      `INSERT INTO pos_sessions (user_id, session_name, cart_items, customer_id, discount_amount, received_amount, notes, tax_rate, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        sessionData.user_id,
        sessionData.session_name,
        JSON.stringify(sessionData.cart_items),
        sessionData.customer_id,
        sessionData.discount_amount,
        sessionData.received_amount,
        sessionData.notes,
        sessionData.tax_rate,
      ],
    )

    const newSessionId = result.insertId
    // Fetch the newly created session without a join
    const [sessionRows] = await mysql.query<PosSessionRow[]>(`SELECT * FROM pos_sessions WHERE id = ?`, [newSessionId])

    const newSessionRow = sessionRows[0]
    if (!newSessionRow) {
      throw new Error("Failed to retrieve newly created session.")
    }

    let cartItems: CartItem[] = []
    try {
      cartItems = newSessionRow.cart_items ? JSON.parse(newSessionRow.cart_items) : []
    } catch (e) {
      console.error("Failed to parse cart_items JSON for new session:", e)
      cartItems = []
    }

    let customer: Customer | null = null
    if (newSessionRow.customer_id) {
      // Fetch customer details separately if a customer is associated
      const [customerRows] = await mysql.query<CustomerRow[]>(
        `SELECT id, name, email, phone, address, total_spent, total_orders, customer_type, created_at, updated_at FROM customers WHERE id = ?`,
        [newSessionRow.customer_id],
      )
      if (customerRows.length > 0) {
        const c = customerRows[0]
        customer = {
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          address: c.address,
          total_spent: Number.parseFloat(c.total_spent || "0"),
          total_orders: Number.parseInt(c.total_orders || "0"),
          customer_type: c.customer_type as "new" | "regular" | "vip" | null,
          date_of_birth: null,
          created_at: new Date(c.created_at),
          updated_at: new Date(c.updated_at),
        }
      }
    }

    return {
      id: newSessionRow.id,
      user_id: newSessionRow.user_id,
      session_name: newSessionRow.session_name,
      cart_items: cartItems,
      customer_id: newSessionRow.customer_id,
      discount_amount: Number.parseFloat(newSessionRow.discount_amount || "0"),
      received_amount: Number.parseFloat(newSessionRow.received_amount || "0"),
      notes: newSessionRow.notes,
      tax_rate: Number.parseFloat(newSessionRow.tax_rate || "0"),
              created_at: new Date(newSessionRow.created_at),
        updated_at: new Date(newSessionRow.updated_at),
      customer: customer,
    } as PosSession
  } catch (error) {
    console.error("Error creating POS session:", error)
    throw error
  }
}

export async function updatePosSession(
  id: number,
  updates: Partial<Omit<PosSession, "id" | "created_at" | "updated_at" | "customer">>,
): Promise<PosSession> {
  noStore()
  const mysql = dbPool

  if (!mysql) {
    console.error("Database pool is not initialized. Cannot update POS session.")
    throw new Error("Database connection error.")
  }

  try {
    const updateFields: string[] = []
    const updateValues: (string | number | null)[] = []

    for (const key in updates) {
      if (Object.prototype.hasOwnProperty.call(updates, key)) {
        if (key === "customer") {
          continue
        }

        if (key === "cart_items") {
          updateFields.push("cart_items = ?")
          updateValues.push(JSON.stringify(updates[key]))
        } else {
          updateFields.push(`${key} = ?`)
          updateValues.push(updates[key as keyof typeof updates] as string | number | null)
        }
      }
    }

    updateFields.push("updated_at = NOW()")

    await mysql.query(`UPDATE pos_sessions SET ${updateFields.join(", ")} WHERE id = ?`, [...updateValues, id])

    // Fetch the updated session row (without customer join)
    const [sessionRows] = await mysql.query<PosSessionRow[]>(`SELECT * FROM pos_sessions WHERE id = ?`, [id])

    const updatedSessionRow = sessionRows[0]
    if (!updatedSessionRow) {
      throw new Error("Failed to retrieve updated session.")
    }

    let cartItems: CartItem[] = []
    try {
      cartItems = updatedSessionRow.cart_items ? JSON.parse(updatedSessionRow.cart_items) : []
    } catch (e) {
      console.error("Failed to parse cart_items JSON for updated session:", e)
      cartItems = []
    }

    let customer: Customer | null = null
    if (updatedSessionRow.customer_id) {
      // Fetch customer details separately if a customer is associated
      const [customerRows] = await mysql.query<CustomerRow[]>(
        `SELECT id, name, email, phone, address, total_spent, total_orders, customer_type, created_at, updated_at FROM customers WHERE id = ?`,
        [updatedSessionRow.customer_id],
      )
      if (customerRows.length > 0) {
        const c = customerRows[0]
        customer = {
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          address: c.address,
          total_spent: Number.parseFloat(c.total_spent || "0"),
          total_orders: Number.parseInt(c.total_orders || "0"),
          customer_type: c.customer_type as "new" | "regular" | "vip" | null,
          date_of_birth: null,
          created_at: new Date(c.created_at),
          updated_at: new Date(c.updated_at),
        }
      }
    }

    return {
      id: updatedSessionRow.id,
      user_id: updatedSessionRow.user_id,
      session_name: updatedSessionRow.session_name,
      cart_items: cartItems,
      customer_id: updatedSessionRow.customer_id,
      discount_amount: Number.parseFloat(updatedSessionRow.discount_amount || "0"),
      received_amount: Number.parseFloat(updatedSessionRow.received_amount || "0"),
      notes: updatedSessionRow.notes,
      tax_rate: Number.parseFloat(updatedSessionRow.tax_rate || "0"),
              created_at: new Date(updatedSessionRow.created_at),
        updated_at: new Date(updatedSessionRow.updated_at),
      customer: customer,
    } as PosSession
  } catch (error) {
    console.error("Error updating POS session:", error)
    throw error
  }
}

export async function deletePosSession(id: number): Promise<boolean> {
  noStore()
  const mysql = dbPool

  if (!mysql) {
    console.error("Database pool is not initialized. Cannot delete POS session.")
    throw new Error("Database connection error.")
  }

  try {
    await mysql.query("DELETE FROM pos_sessions WHERE id = ?", [id])
    return true
  } catch (error) {
    console.error("Error deleting POS session:", error)
    throw error
  }
}
