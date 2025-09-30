"use server"

import { unstable_noStore as noStore } from "next/cache"
import { createAdminClient as createClient } from "@/lib/supabase/admin"
import type { Product } from "@/lib/types/database"
import { parseNumber } from "@/lib/utils"

export type MutationResult<T> = { success: true; data: T } | { success: false; error: string }

export async function getProducts(): Promise<Product[]> {
  noStore()
  const supabase = createClient()

  try {
    const { data: productsData, error } = await supabase
      .from("products")
      .select(`
        *,
        categories:categories(name)
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching products from Supabase:", error)
      throw error
    }

    return (productsData || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      retail_price: parseNumber(row.retail_price),
      wholesale_price: parseNumber(row.wholesale_price),
      cost_price: parseNumber(row.cost_price),
      stock_quantity: row.stock_quantity,
      min_stock_level: row.min_stock_level,
      barcode: row.barcode,
      image_url: row.image_url,
      status: row.status,
      category_id: row.category_id,
      category: row.categories?.name || null,
      image_data: row.image_data,
      is_service: row.is_service || false,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
      sku: row.sku,
    }))
  } catch (error) {
    console.error("Error fetching products from Supabase:", error)
    throw error
  }
}

export async function getProductById(id: number): Promise<Product | null> {
  noStore()
  const supabase = createClient()

  try {
    const { data: productData, error } = await supabase
      .from("products")
      .select(`
        *,
        categories:categories(name)
      `)
      .eq("id", id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // No rows found
      }
      console.error("Error fetching product from Supabase:", error)
      throw error
    }

    if (!productData) return null

    return {
      id: productData.id,
      name: productData.name,
      description: productData.description,
      retail_price: parseNumber(productData.retail_price),
      wholesale_price: parseNumber(productData.wholesale_price),
      cost_price: parseNumber(productData.cost_price),
      stock_quantity: productData.stock_quantity,
      min_stock_level: productData.min_stock_level,
      barcode: productData.barcode,
      image_url: productData.image_url,
      status: productData.status,
      category_id: productData.category_id,
      category: productData.categories?.name || null,
      image_data: productData.image_data,
      is_service: productData.is_service || false,
      created_at: new Date(productData.created_at),
      updated_at: new Date(productData.updated_at),
      sku: productData.sku,
    }
  } catch (error) {
    console.error("Error fetching product from Supabase:", error)
    throw error
  }
}

export async function updateProductStock(productId: number, quantityChange: number): Promise<void> {
  const supabase = createClient()

  try {
    // First get the current stock
    const { data: currentProduct, error: fetchError } = await supabase
      .from("products")
      .select("stock_quantity")
      .eq("id", productId)
      .single()

    if (fetchError) {
      throw fetchError
    }

    const newStock = currentProduct.stock_quantity + quantityChange

    // Update the stock
    const { error: updateError } = await supabase
      .from("products")
      .update({
        stock_quantity: newStock,
        updated_at: new Date().toISOString()
      })
      .eq("id", productId)

    if (updateError) {
      throw updateError
    }

    console.log(`Updated product ${productId} stock: ${currentProduct.stock_quantity} + ${quantityChange} = ${newStock}`)
  } catch (error) {
    console.error("Error updating product stock in Supabase:", error)
    throw error
  }
}

export async function getProductByBarcode(barcode: string): Promise<Product | null> {
  noStore()
  const supabase = createClient()

  try {
    const { data: productData, error } = await supabase
      .from("products")
      .select(`
        *,
        categories:categories(name)
      `)
      .eq("barcode", barcode)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // No rows found
      }
      throw error
    }

    if (!productData) return null

    return {
      id: productData.id,
      name: productData.name,
      description: productData.description,
      retail_price: parseNumber(productData.retail_price),
      wholesale_price: parseNumber(productData.wholesale_price),
      cost_price: parseNumber(productData.cost_price),
      stock_quantity: productData.stock_quantity,
      min_stock_level: productData.min_stock_level,
      barcode: productData.barcode,
      image_url: productData.image_url,
      status: productData.status,
      category_id: productData.category_id,
      category: productData.categories?.name || null,
      image_data: productData.image_data,
      is_service: productData.is_service || false,
      created_at: new Date(productData.created_at),
      updated_at: new Date(productData.updated_at),
      sku: productData.sku,
    }
  } catch (error) {
    console.error("Error fetching product by barcode from Supabase:", error)
    throw error
  }
}

export async function searchProducts(query: string): Promise<Product[]> {
  noStore()
  const supabase = createClient()

  try {
    const { data: productsData, error } = await supabase
      .from("products")
      .select(`
        *,
        categories:categories(name)
      `)
      .or(`name.ilike.%${query}%, barcode.ilike.%${query}%, sku.ilike.%${query}%`)
      .order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    return (productsData || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      retail_price: parseNumber(row.retail_price),
      wholesale_price: parseNumber(row.wholesale_price),
      cost_price: parseNumber(row.cost_price),
      stock_quantity: row.stock_quantity,
      min_stock_level: row.min_stock_level,
      barcode: row.barcode,
      image_url: row.image_url,
      status: row.status,
      category_id: row.category_id,
      category: row.categories?.name || null,
      image_data: row.image_data,
      is_service: row.is_service || false,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
      sku: row.sku,
    }))
  } catch (error) {
    console.error("Error searching products in Supabase:", error)
    throw error
  }
}

export async function createProduct(productData: Omit<Product, "id" | "created_at" | "updated_at">): Promise<MutationResult<Product>> {
  const supabase = createClient()

  try {
    const { data: newProduct, error } = await supabase
      .from("products")
      .insert({
        name: productData.name,
        description: productData.description,
        sku: productData.sku,
        barcode: productData.barcode,
        category_id: productData.category_id,
        retail_price: productData.retail_price,
        wholesale_price: productData.wholesale_price,
        cost_price: productData.cost_price,
        stock_quantity: productData.stock_quantity || 0,
        min_stock_level: productData.min_stock_level,
        is_service: productData.is_service || false,
        status: productData.status || 'active',
        image_url: productData.image_url,
        image_data: productData.image_data,
      })
      .select(`
        *,
        categories:categories(name)
      `)
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    const product: Product = {
      id: newProduct.id,
      name: newProduct.name,
      description: newProduct.description,
      retail_price: parseNumber(newProduct.retail_price),
      wholesale_price: parseNumber(newProduct.wholesale_price),
      cost_price: parseNumber(newProduct.cost_price),
      stock_quantity: newProduct.stock_quantity,
      min_stock_level: newProduct.min_stock_level,
      barcode: newProduct.barcode,
      image_url: newProduct.image_url,
      status: newProduct.status,
      category_id: newProduct.category_id,
      category: newProduct.categories?.name || null,
      image_data: newProduct.image_data,
      is_service: newProduct.is_service || false,
      created_at: new Date(newProduct.created_at),
      updated_at: new Date(newProduct.updated_at),
      sku: newProduct.sku,
    }

    return { success: true, data: product }
  } catch (error) {
    console.error("Error creating product in Supabase:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function updateProduct(id: number, productData: Partial<Omit<Product, "id" | "created_at" | "updated_at">>): Promise<MutationResult<Product>> {
  const supabase = createClient()

  try {
    const { data: updatedProduct, error } = await supabase
      .from("products")
      .update({
        ...productData,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select(`
        *,
        categories:categories(name)
      `)
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    const product: Product = {
      id: updatedProduct.id,
      name: updatedProduct.name,
      description: updatedProduct.description,
      retail_price: parseNumber(updatedProduct.retail_price),
      wholesale_price: parseNumber(updatedProduct.wholesale_price),
      cost_price: parseNumber(updatedProduct.cost_price),
      stock_quantity: updatedProduct.stock_quantity,
      min_stock_level: updatedProduct.min_stock_level,
      barcode: updatedProduct.barcode,
      image_url: updatedProduct.image_url,
      status: updatedProduct.status,
      category_id: updatedProduct.category_id,
      category: updatedProduct.categories?.name || null,
      image_data: updatedProduct.image_data,
      is_service: updatedProduct.is_service || false,
      created_at: new Date(updatedProduct.created_at),
      updated_at: new Date(updatedProduct.updated_at),
      sku: updatedProduct.sku,
    }

    return { success: true, data: product }
  } catch (error) {
    console.error("Error updating product in Supabase:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function deleteProduct(id: number): Promise<MutationResult<void>> {
  const supabase = createClient()

  try {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: undefined }
  } catch (error) {
    console.error("Error deleting product in Supabase:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function getTopSellingProducts(startDate?: Date, endDate?: Date, limit = 10) {
  noStore()
  const supabase = createClient()

  try {
    const now = new Date()
    const start = startDate ? startDate.toISOString() : getStartOfMonth(now).toISOString()
    const end = endDate ? endDate.toISOString() : getEndOfMonth(now).toISOString()

    const { data: topProducts, error } = await supabase
      .from("order_items")
      .select(`
        product_id,
        product_name,
        quantity,
        total_price,
        products:products(name, image_url),
        orders!inner(created_at, order_status)
      `)
      .eq("orders.order_status", "completed")
      .gte("orders.created_at", start)
      .lte("orders.created_at", end)

    if (error) {
      throw error
    }

    // Group by product and calculate totals
    const productStats = new Map<number, {
      product_id: number
      product_name: string
      total_quantity: number
      total_revenue: number
      image_url?: string
    }>()

    topProducts?.forEach(item => {
      const existing = productStats.get(item.product_id) || {
        product_id: item.product_id,
        product_name: item.products?.name || item.product_name,
        total_quantity: 0,
        total_revenue: 0,
        image_url: item.products?.image_url,
      }

      existing.total_quantity += item.quantity
      existing.total_revenue += parseNumber(item.total_price)
      productStats.set(item.product_id, existing)
    })

    return Array.from(productStats.values())
      .sort((a, b) => b.total_quantity - a.total_quantity)
      .slice(0, limit)
  } catch (error) {
    console.error("Error fetching top selling products:", error)
    throw error
  }
}

export async function getMonthlyProductPerformance(startDate?: Date, endDate?: Date) {
  noStore()
  const supabase = createClient()

  try {
    const now = new Date()
    const start = startDate ? startDate.toISOString() : getStartOfMonth(now).toISOString()
    const end = endDate ? endDate.toISOString() : getEndOfMonth(now).toISOString()

    const { data: performance, error } = await supabase
      .from("order_items")
      .select(`
        product_id,
        product_name,
        quantity,
        total_price,
        unit_price,
        cost_price,
        products:products(name),
        orders!inner(created_at, order_status)
      `)
      .eq("orders.order_status", "completed")
      .gte("orders.created_at", start)
      .lte("orders.created_at", end)

    if (error) {
      throw error
    }

    // Group by product and calculate performance metrics
    const productPerformance = new Map<number, {
      product_id: number
      product_name: string
      total_quantity: number
      total_revenue: number
      gross_profit: number
    }>()

    performance?.forEach(item => {
      const existing = productPerformance.get(item.product_id) || {
        product_id: item.product_id,
        product_name: item.products?.name || item.product_name,
        total_quantity: 0,
        total_revenue: 0,
        gross_profit: 0,
      }

      const profit = (parseNumber(item.unit_price) - parseNumber(item.cost_price || 0)) * item.quantity
      existing.total_quantity += item.quantity
      existing.total_revenue += parseNumber(item.total_price)
      existing.gross_profit += profit
      productPerformance.set(item.product_id, existing)
    })

    return Array.from(productPerformance.values())
      .sort((a, b) => b.total_revenue - a.total_revenue)
  } catch (error) {
    console.error("Error fetching monthly product performance:", error)
    throw error
  }
}

export async function bulkCreateProducts(products: Omit<Product, "id" | "created_at" | "updated_at">[]): Promise<MutationResult<Product[]>> {
  const supabase = createClient()

  try {
    const { data: newProducts, error } = await supabase
      .from("products")
      .insert(products.map(product => ({
        name: product.name,
        description: product.description,
        sku: product.sku,
        barcode: product.barcode,
        category_id: product.category_id,
        retail_price: product.retail_price,
        wholesale_price: product.wholesale_price,
        cost_price: product.cost_price,
        stock_quantity: product.stock_quantity || 0,
        min_stock_level: product.min_stock_level,
        is_service: product.is_service || false,
        status: product.status || 'active',
        image_url: product.image_url,
        image_data: product.image_data,
      })))
      .select(`
        *,
        categories:categories(name)
      `)

    if (error) {
      return { success: false, error: error.message }
    }

    const createdProducts: Product[] = (newProducts || []).map((product: any) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      retail_price: parseNumber(product.retail_price),
      wholesale_price: parseNumber(product.wholesale_price),
      cost_price: parseNumber(product.cost_price),
      stock_quantity: product.stock_quantity,
      min_stock_level: product.min_stock_level,
      barcode: product.barcode,
      image_url: product.image_url,
      status: product.status,
      category_id: product.category_id,
      category: product.categories?.name || null,
      image_data: product.image_data,
      is_service: product.is_service || false,
      created_at: new Date(product.created_at),
      updated_at: new Date(product.updated_at),
      sku: product.sku,
    }))

    return { success: true, data: createdProducts }
  } catch (error) {
    console.error("Error bulk creating products in Supabase:", error)
    return { success: false, error: (error as Error).message }
  }
}

// Helper function imports
function getStartOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function getEndOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
}