import { getSuppliers } from "@/lib/actions/suppliers"
import type { Supplier } from "@/lib/types/database"

export async function getSuppliersClient(): Promise<Supplier[]> {
  try {
    const result = await getSuppliers()
    if (result.success) {
      return result.data.map(supplier => ({
        ...supplier,
        address: supplier.address || null,
        email: supplier.email || null, // Fix undefined to null
        phone: supplier.phone || null, // Fix undefined to null
        created_at: new Date(supplier.created_at),
        updated_at: new Date(supplier.updated_at),
      }))
    } else {
      console.error("Error fetching suppliers:", result.error)
      return []
    }
  } catch (error) {
    console.error("Error in getSuppliersClient:", error)
    return []
  }
}
