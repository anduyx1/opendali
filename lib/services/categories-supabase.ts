"use server"

import { unstable_noStore as noStore } from "next/cache"
import { createAdminClient as createClient } from "@/lib/supabase/admin"
import type { Category } from "@/lib/types/database"

export type MutationResult<T> = { success: true; data: T } | { success: false; error: string }

export async function getCategories(): Promise<Category[]> {
  noStore()
  const supabase = createClient()

  try {
    const { data: categoriesData, error } = await supabase
      .from("categories")
      .select("*")
      .order("name", { ascending: true })

    if (error) {
      console.error("Error fetching categories from Supabase:", error)
      throw error
    }

    return (categoriesData || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    }))
  } catch (error) {
    console.error("Error fetching categories from Supabase:", error)
    throw error
  }
}

export async function getCategoryById(id: number): Promise<Category | null> {
  noStore()
  const supabase = createClient()

  try {
    const { data: categoryData, error } = await supabase
      .from("categories")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // No rows found
      }
      console.error("Error fetching category from Supabase:", error)
      throw error
    }

    if (!categoryData) return null

    return {
      id: categoryData.id,
      name: categoryData.name,
      description: categoryData.description,
      created_at: new Date(categoryData.created_at),
      updated_at: new Date(categoryData.updated_at),
    }
  } catch (error) {
    console.error("Error fetching category from Supabase:", error)
    throw error
  }
}

export async function createCategory(categoryData: Omit<Category, "id" | "created_at" | "updated_at">): Promise<MutationResult<Category>> {
  const supabase = createClient()

  try {
    const { data: newCategory, error } = await supabase
      .from("categories")
      .insert({
        name: categoryData.name,
        description: categoryData.description,
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    const category: Category = {
      id: newCategory.id,
      name: newCategory.name,
      description: newCategory.description,
      created_at: new Date(newCategory.created_at),
      updated_at: new Date(newCategory.updated_at),
    }

    return { success: true, data: category }
  } catch (error) {
    console.error("Error creating category in Supabase:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function updateCategory(id: number, categoryData: Partial<Omit<Category, "id" | "created_at" | "updated_at">>): Promise<MutationResult<Category>> {
  const supabase = createClient()

  try {
    const { data: updatedCategory, error } = await supabase
      .from("categories")
      .update({
        ...categoryData,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    const category: Category = {
      id: updatedCategory.id,
      name: updatedCategory.name,
      description: updatedCategory.description,
      created_at: new Date(updatedCategory.created_at),
      updated_at: new Date(updatedCategory.updated_at),
    }

    return { success: true, data: category }
  } catch (error) {
    console.error("Error updating category in Supabase:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function deleteCategory(id: number): Promise<MutationResult<void>> {
  const supabase = createClient()

  try {
    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: undefined }
  } catch (error) {
    console.error("Error deleting category in Supabase:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function getAllCategoryIds(): Promise<Set<number>> {
  noStore()
  const supabase = createClient()

  try {
    const { data: categories, error } = await supabase
      .from("categories")
      .select("id")

    if (error) {
      throw error
    }

    const ids = (categories || []).map(cat => cat.id)
    return new Set(ids)
  } catch (error) {
    console.error("Error fetching all category IDs from Supabase:", error)
    throw error
  }
}

export async function getMonthlyCategoryGrossProfit(
  startDate?: Date,
  endDate?: Date,
): Promise<{ category_name: string; total_gross_profit: number }[]> {
  noStore()
  const supabase = createClient()

  try {
    const now = new Date()
    const start = startDate || getStartOfMonth(now)
    const end = endDate || getEndOfMonth(now)

    const { data: profitData, error } = await supabase
      .from("order_items")
      .select(`
        unit_price,
        quantity,
        cost_price,
        products:products(
          categories:categories(name)
        ),
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

    // Group by category and calculate gross profit
    const categoryProfits = new Map<string, number>()

    profitData?.forEach(item => {
      const categoryName = item.products?.categories?.name || "Uncategorized"
      const unitProfit = parseNumber(item.unit_price) - parseNumber(item.cost_price || 0)
      const itemProfit = unitProfit * item.quantity

      const current = categoryProfits.get(categoryName) || 0
      categoryProfits.set(categoryName, current + itemProfit)
    })

    return Array.from(categoryProfits.entries())
      .map(([category_name, total_gross_profit]) => ({
        category_name,
        total_gross_profit
      }))
      .sort((a, b) => b.total_gross_profit - a.total_gross_profit)
  } catch (error) {
    console.error("Error fetching monthly category gross profit from Supabase:", error)
    throw error
  }
}

// Helper function
function getStartOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function getEndOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
}

function parseNumber(value: any): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') return parseFloat(value) || 0
  return 0
}