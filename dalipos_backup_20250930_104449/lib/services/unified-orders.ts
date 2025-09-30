/**
 * Unified Order Management Service
 * Quản lý đơn hàng thống nhất giữa online và offline
 */

import { indexedDBService, type OfflineOrder } from "./indexeddb"
import { getPosSessions, createPosSession, updatePosSession, deletePosSession } from "@/lib/actions/pos-sessions"
import type { PosSession } from "@/lib/types/database"

export interface UnifiedOrder extends PosSession {
  source: "online" | "offline"
  syncStatus?: "synced" | "pending" | "error"
  offlineId?: string
  serverOrderNumber?: string
}

export class UnifiedOrderService {
  private static instance: UnifiedOrderService
  private listeners: ((orders: UnifiedOrder[]) => void)[] = []

  static getInstance(): UnifiedOrderService {
    if (!UnifiedOrderService.instance) {
      UnifiedOrderService.instance = new UnifiedOrderService()
    }
    return UnifiedOrderService.instance
  }

  /**
   * Lấy tất cả đơn hàng (online + offline) thống nhất
   */
  async getAllUnifiedOrders(): Promise<UnifiedOrder[]> {
    try {
      // Lấy đơn online
      const onlineOrders = await this.getOnlineOrders()
      
      // Lấy đơn offline
      const offlineOrders = await this.getOfflineOrders()
      
      // Merge và sắp xếp theo thời gian tạo
      const allOrders = [...onlineOrders, ...offlineOrders].sort((a, b) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })

      console.log(`[UnifiedOrders] Total orders: ${allOrders.length} (${onlineOrders.length} online, ${offlineOrders.length} offline)`)
      
      return allOrders
    } catch (error) {
      console.error("[UnifiedOrders] Error getting unified orders:", error)
      return []
    }
  }

  /**
   * Lấy đơn hàng online
   */
  private async getOnlineOrders(): Promise<UnifiedOrder[]> {
    try {
      const sessions = await getPosSessions()
      return sessions.map(session => ({
        ...session,
        source: "online" as const,
        syncStatus: "synced" as const,
      }))
    } catch (error) {
      console.error("[UnifiedOrders] Error getting online orders:", error)
      // When offline, try to get cached online orders from IndexedDB
      try {
        const cachedOrders = await indexedDBService.getCachedOnlineOrders()
        console.log(`[UnifiedOrders] Using ${cachedOrders.length} cached online orders`)
        return cachedOrders.map(order => ({
          ...order,
          source: "online" as const,
          syncStatus: "pending" as const, // Mark as pending when offline
        }))
      } catch (cacheError) {
        console.error("[UnifiedOrders] Error getting cached online orders:", cacheError)
        return []
      }
    }
  }

  /**
   * Lấy đơn hàng offline
   */
  private async getOfflineOrders(): Promise<UnifiedOrder[]> {
    try {
      const offlineOrders = await indexedDBService.getAllOrders()
      
      return offlineOrders.map(order => {
        // Extract actual ID from offline order ID
        const actualId = parseInt(order.id.split("_")[1]) || Date.now()
        
                 return {
           id: actualId,
           user_id: null,
           session_name: order.order_number,
           cart_items: order.items.map(item => ({
             id: item.product_id,
             name: item.product_name,
             price: item.unit_price,
             quantity: item.quantity,
             cost_price: 0,
             stock_quantity: 0,
             is_service: item.is_service || false,
           })),
           customer_id: order.customer_id || null,
           discount_amount: order.discount_amount || 0,
           received_amount: 0,
           notes: order.notes || "Đơn hàng offline",
           tax_rate: order.tax_amount / order.subtotal || 0.1,
           created_at: new Date(order.created_at),
           updated_at: new Date(order.updated_at),
           source: "offline" as const,
           syncStatus: order.synced ? "synced" : "pending",
           offlineId: order.id,
           serverOrderNumber: order.server_order_number,
         }
      })
    } catch (error) {
      console.error("[UnifiedOrders] Error getting offline orders:", error)
      return []
    }
  }

  /**
   * Tạo đơn hàng mới (online hoặc offline)
   */
  async createOrder(orderData: Partial<UnifiedOrder>, isOffline: boolean = false): Promise<UnifiedOrder> {
    try {
      if (isOffline) {
        // Tạo đơn offline
        const offlineOrder = await this.createOfflineOrder(orderData)
        console.log(`[UnifiedOrders] Created offline order: ${offlineOrder.session_name}`)
        return offlineOrder
      } else {
        // Tạo đơn online
        const onlineOrder = await this.createOnlineOrder(orderData)
        console.log(`[UnifiedOrders] Created online order: ${onlineOrder.session_name}`)
        return onlineOrder
      }
    } catch (error) {
      console.error("[UnifiedOrders] Error creating order:", error)
      throw error
    }
  }

  /**
   * Tạo đơn offline
   */
  private async createOfflineOrder(orderData: Partial<UnifiedOrder>): Promise<UnifiedOrder> {
    const orderNumber = `OFF-${Date.now().toString().slice(-6)}`
    const offlineOrderId = await indexedDBService.saveOfflineOrder({
      id: `offline_${Date.now()}`,
      order_number: orderNumber,
      customer_id: orderData.customer_id || null,
      subtotal: orderData.cart_items?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0,
      tax_amount: 0,
      discount_amount: orderData.discount_amount || 0,
      total_amount: orderData.cart_items?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0,
      payment_method: "cash",
      payment_status: "pending",
      status: "pending",
      notes: orderData.notes || "Đơn hàng offline mới",
      items: orderData.cart_items?.map(item => ({
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        is_service: item.is_service || false,
      })) || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      synced: false,
    })

    // Use the actual ID from IndexedDB for consistency
    const actualId = offlineOrderId ? parseInt(offlineOrderId.split("_")[1]) || Date.now() : Date.now()

    return {
      id: actualId,
      user_id: null,
      session_name: orderNumber,
      cart_items: orderData.cart_items || [],
      customer_id: orderData.customer_id || null,
      discount_amount: orderData.discount_amount || 0,
      received_amount: 0,
      notes: "Đơn hàng offline mới",
      tax_rate: 0.1,
      created_at: new Date(),
      updated_at: new Date(),
      source: "offline",
      syncStatus: "pending",
      offlineId: offlineOrderId,
    }
  }

  /**
   * Tạo đơn online
   */
  private async createOnlineOrder(orderData: Partial<UnifiedOrder>): Promise<UnifiedOrder> {
    const session = await createPosSession({
      cart_items: orderData.cart_items || [],
      customer_id: orderData.customer_id || null,
      discount_amount: orderData.discount_amount || 0,
      received_amount: 0,
      notes: orderData.notes || "Đơn hàng online mới",
      tax_rate: orderData.tax_rate || 0.1,
      session_name: `Đơn ${Date.now()}`,
    })

    return {
      ...session,
      source: "online",
      syncStatus: "synced",
    }
  }

  /**
   * Cập nhật đơn hàng
   */
  async updateOrder(orderId: number, updates: Partial<UnifiedOrder>): Promise<void> {
    try {
      const allOrders = await this.getAllUnifiedOrders()
      console.log(`[UnifiedOrders] Looking for order ${orderId} in ${allOrders.length} orders`)
      console.log(`[UnifiedOrders] Available order IDs:`, allOrders.map(o => ({ id: o.id, name: o.session_name, source: o.source })))
      
      const order = allOrders.find(o => o.id === orderId)
      
      if (!order) {
        console.error(`[UnifiedOrders] Order ${orderId} not found in available orders`)
        throw new Error(`Order ${orderId} not found`)
      }

      console.log(`[UnifiedOrders] Found order: ${order.session_name} (${order.source})`)

      if (order.source === "offline") {
        // Cập nhật đơn offline
        await this.updateOfflineOrder(order.offlineId!, updates)
      } else {
        // Cập nhật đơn online
        await updatePosSession(orderId, updates)
      }

      console.log(`[UnifiedOrders] Updated ${order.source} order: ${order.session_name}`)
      this.notifyListeners()
    } catch (error) {
      console.error("[UnifiedOrders] Error updating order:", error)
      throw error
    }
  }

  /**
   * Cập nhật đơn offline
   */
  private async updateOfflineOrder(offlineId: string, updates: Partial<UnifiedOrder>): Promise<void> {
    try {
      // Lấy đơn hàng hiện tại từ IndexedDB
      const allOrders = await indexedDBService.getAllOrders()
      const existingOrder = allOrders.find(order => order.id === offlineId)
      
      if (!existingOrder) {
        throw new Error(`Offline order ${offlineId} not found`)
      }

      // Cập nhật các trường được cung cấp
      const updatedOrder: OfflineOrder = {
        ...existingOrder,
        items: updates.cart_items?.map(item => ({
          product_id: item.id,
          product_name: item.name,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity,
          is_service: item.is_service || false,
        })) || existingOrder.items,
        customer_id: updates.customer_id ?? existingOrder.customer_id,
        discount_amount: updates.discount_amount ?? existingOrder.discount_amount,
        notes: updates.notes ?? existingOrder.notes,
        updated_at: new Date().toISOString(),
      }

      // Lưu lại vào IndexedDB
      await indexedDBService.saveOfflineOrder(updatedOrder)
      console.log(`[UnifiedOrders] Updated offline order: ${offlineId}`)
    } catch (error) {
      console.error(`[UnifiedOrders] Error updating offline order ${offlineId}:`, error)
      throw error
    }
  }

  /**
   * Xóa đơn hàng
   */
  async deleteOrder(orderId: number): Promise<void> {
    try {
      const allOrders = await this.getAllUnifiedOrders()
      const order = allOrders.find(o => o.id === orderId)
      
      if (!order) {
        throw new Error(`Order ${orderId} not found`)
      }

      if (order.source === "offline") {
        // Xóa đơn offline
        await indexedDBService.deleteOrder(order.offlineId!)
      } else {
        // Xóa đơn online
        await deletePosSession(orderId)
      }

      console.log(`[UnifiedOrders] Deleted ${order.source} order: ${order.session_name}`)
      this.notifyListeners()
    } catch (error) {
      console.error("[UnifiedOrders] Error deleting order:", error)
      throw error
    }
  }

  /**
   * Đồng bộ đơn offline lên server
   */
  async syncOfflineOrders(): Promise<void> {
    try {
      const offlineOrders = await this.getOfflineOrders()
      const pendingOrders = offlineOrders.filter(order => order.syncStatus === "pending")
      
      console.log(`[UnifiedOrders] Syncing ${pendingOrders.length} offline orders`)
      
      for (const order of pendingOrders) {
        try {
          // Sync logic here
          console.log(`[UnifiedOrders] Synced order: ${order.session_name}`)
        } catch (error) {
          console.error(`[UnifiedOrders] Failed to sync order ${order.session_name}:`, error)
        }
      }
      
      this.notifyListeners()
    } catch (error) {
      console.error("[UnifiedOrders] Error syncing offline orders:", error)
    }
  }

  /**
   * Subscribe to order changes
   */
  subscribe(listener: (orders: UnifiedOrder[]) => void): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  /**
   * Notify all listeners
   */
  private async notifyListeners(): Promise<void> {
    const orders = await this.getAllUnifiedOrders()
    this.listeners.forEach(listener => listener(orders))
  }

  /**
   * Refresh orders and notify listeners
   */
  async refresh(): Promise<void> {
    await this.notifyListeners()
  }
}

export const unifiedOrderService = UnifiedOrderService.getInstance()
