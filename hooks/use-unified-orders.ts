import { useState, useEffect, useCallback } from "react"
import { unifiedOrderService, type UnifiedOrder } from "@/lib/services/unified-orders"

export function useUnifiedOrders() {
  const [orders, setOrders] = useState<UnifiedOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load orders
  const loadOrders = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const unifiedOrders = await unifiedOrderService.getAllUnifiedOrders()
      setOrders(unifiedOrders)
    } catch (err) {
      console.error("[useUnifiedOrders] Error loading orders:", err)
      setError(err instanceof Error ? err.message : "Lỗi tải đơn hàng")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Create new order
  const createOrder = useCallback(async (orderData: Partial<UnifiedOrder>, isOffline: boolean = false) => {
    try {
      const newOrder = await unifiedOrderService.createOrder(orderData, isOffline)
      await loadOrders() // Refresh orders
      return newOrder
    } catch (err) {
      console.error("[useUnifiedOrders] Error creating order:", err)
      throw err
    }
  }, [loadOrders])

  // Update order
  const updateOrder = useCallback(async (orderId: number, updates: Partial<UnifiedOrder>) => {
    try {
      await unifiedOrderService.updateOrder(orderId, updates)
      await loadOrders() // Refresh orders
    } catch (err) {
      console.error("[useUnifiedOrders] Error updating order:", err)
      throw err
    }
  }, [loadOrders])

  // Delete order
  const deleteOrder = useCallback(async (orderId: number) => {
    try {
      await unifiedOrderService.deleteOrder(orderId)
      await loadOrders() // Refresh orders
    } catch (err) {
      console.error("[useUnifiedOrders] Error deleting order:", err)
      throw err
    }
  }, [loadOrders])

  // Sync offline orders
  const syncOfflineOrders = useCallback(async () => {
    try {
      await unifiedOrderService.syncOfflineOrders()
      await loadOrders() // Refresh orders
    } catch (err) {
      console.error("[useUnifiedOrders] Error syncing offline orders:", err)
      throw err
    }
  }, [loadOrders])

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = unifiedOrderService.subscribe((updatedOrders) => {
      setOrders(updatedOrders)
    })

    return unsubscribe
  }, [])

  // Initial load
  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  return {
    orders,
    isLoading,
    error,
    loadOrders,
    createOrder,
    updateOrder,
    deleteOrder,
    syncOfflineOrders,
  }
}
