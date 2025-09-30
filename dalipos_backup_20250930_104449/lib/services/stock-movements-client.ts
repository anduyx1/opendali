import type { StockMovement } from "@/lib/types/database"

export async function getProductStockHistory(productId: string): Promise<StockMovement[]> {
  try {
    const response = await fetch(`/api/products/${productId}/stock-history`)
    if (!response.ok) {
      throw new Error("Failed to fetch stock history")
    }
    return await response.json()
  } catch (error) {
    console.error("Error fetching stock history:", error)
    return []
  }
}

export async function createStockMovement(movement: Omit<StockMovement, "id" | "created_at">): Promise<StockMovement> {
  const response = await fetch("/api/stock-movements", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(movement),
  })

  if (!response.ok) {
    throw new Error("Failed to create stock movement")
  }

  return await response.json()
}
