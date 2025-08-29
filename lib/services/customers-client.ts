"use client"

import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from "@/lib/services/customers"
import type { Customer, NewCustomer } from "@/lib/types/database"

export async function getCustomersClient(): Promise<Customer[]> {
  try {
    const customers = await getCustomers()
    return customers
  } catch (error) {
    console.error("Error fetching customers:", error)
    return []
  }
}

export async function createCustomerClient(customerData: NewCustomer): Promise<Customer | null> {
  try {
    const newCustomer = await createCustomer(customerData)
    // Assuming createCustomer returns { success: true, id: number } or { success: false, error: string }
    if (newCustomer && newCustomer.success) {
      // Fetch the newly created customer to return the full object
      const fetchedCustomer = await getCustomers().then((c) => c.find((cust) => cust.id === newCustomer.id))
      return fetchedCustomer || null
    }
    return null
  } catch (error) {
    console.error("Error creating customer:", error)
    return null
  }
}

export async function updateCustomerClient(id: number, customerData: Partial<NewCustomer>): Promise<Customer | null> {
  try {
    const updatedResult = await updateCustomer(id, customerData)
    if (updatedResult && updatedResult.success) {
      // Fetch the updated customer to return the full object
      const fetchedCustomer = await getCustomers().then((c) => c.find((cust) => cust.id === id))
      return fetchedCustomer || null
    }
    return null
  } catch (error) {
    console.error("Error updating customer:", error)
    return null
  }
}

export async function deleteCustomerClient(id: number): Promise<boolean> {
  try {
    const success = await deleteCustomer(id)
    return success.success
  } catch (error) {
    console.error("Error deleting customer:", error)
    return false
  }
}
