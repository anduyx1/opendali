/**
 * Offline Sync Service
 * Quản lý đồng bộ dữ liệu giữa server và IndexedDB với conflict resolution
 */

import { indexedDBService, type OfflineProduct, type OfflineOrder, type OfflineCustomer, type OrderConflict } from "./indexeddb"

interface SyncTimeline {
  order_id: string
  events: SyncEvent[]
}

interface SyncEvent {
  timestamp: string
  event_type: "created" | "modified" | "sync_attempted" | "sync_success" | "conflict_detected" | "conflict_resolved"
  device_id: string
  details: Record<string, unknown>
}

enum ConflictResolutionStrategy {
  FIRST_WRITE_WINS = "first_write_wins",
  LAST_WRITE_WINS = "last_write_wins",
  MANUAL_RESOLVE = "manual_resolve",
}

interface ConflictInfo {
  order_id: string
  local_version: number
  server_version: number
  conflict_fields: string[]
  resolution_strategy: ConflictResolutionStrategy
  resolved: boolean
}

interface SyncStatus {
  isOnline: boolean
  lastSync: Date | null
  pendingOrders: number
  syncInProgress: boolean
  conflictCount: number
  lastConflictResolution: Date | null
}

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c == "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function getDeviceId(): string {
  if (typeof window === "undefined") return "server"

  let deviceId = localStorage.getItem("pos_device_id")
  if (!deviceId) {
    deviceId = generateUUID()
    localStorage.setItem("pos_device_id", deviceId)
  }
  return deviceId
}

class OfflineSyncService {
  private syncStatus: SyncStatus = {
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : false,
    lastSync: null,
    pendingOrders: 0,
    syncInProgress: false,
    conflictCount: 0,
    lastConflictResolution: null,
  }

  private listeners: ((status: SyncStatus) => void)[] = []
  private retryAttempts = 0
  private maxRetries = 3
  private retryDelay = 5000
  private lastSyncLogTime = 0
  private syncLogDebounceMs = 10000
  private conflictStrategy: ConflictResolutionStrategy = ConflictResolutionStrategy.FIRST_WRITE_WINS
  private syncTimelines: Map<string, SyncTimeline> = new Map()

  constructor() {
    if (typeof window !== "undefined") {
      // Listen for online/offline events
      window.addEventListener("online", this.handleOnline.bind(this))
      window.addEventListener("offline", this.handleOffline.bind(this))

      // Initialize IndexedDB
      this.initializeDB()
    }
  }

  private notifySyncSuccess(offlineOrderNumber: string, serverOrderNumber: string): void {
    // Dispatch custom event to notify components about successful sync
    if (typeof window !== "undefined") {
      console.log(`[Sync] Dispatching sync success event: ${offlineOrderNumber} -> ${serverOrderNumber}`)
      window.dispatchEvent(new CustomEvent("offlineOrderSynced", {
        detail: {
          offlineOrderNumber,
          serverOrderNumber,
          timestamp: new Date().toISOString()
        }
      }))
      console.log(`[Sync] Event dispatched successfully`)
    }
  }

  private logSyncEvent(
    orderId: string,
    eventType: SyncEvent["event_type"],
    details: Record<string, unknown> = {},
  ): void {
    const event: SyncEvent = {
      timestamp: new Date().toISOString(),
      event_type: eventType,
      device_id: getDeviceId(),
      details,
    }

    let timeline = this.syncTimelines.get(orderId)
    if (!timeline) {
      timeline = { order_id: orderId, events: [] }
      this.syncTimelines.set(orderId, timeline)
    }

    timeline.events.push(event)

    // Keep only last 50 events per order
    if (timeline.events.length > 50) {
      timeline.events = timeline.events.slice(-50)
    }
  }

  private async detectConflict(localOrder: OfflineOrder, serverOrder: ServerOrder): Promise<ConflictInfo | null> {
    const conflictFields: string[] = []

    // Check for conflicts in key fields
    if (localOrder.total_amount !== serverOrder.total_amount) {
      conflictFields.push("total_amount")
    }
    if (localOrder.status !== serverOrder.status) {
      conflictFields.push("status")
    }
    if (localOrder.payment_status !== serverOrder.payment_status) {
      conflictFields.push("payment_status")
    }

    if (conflictFields.length > 0) {
      return {
        order_id: localOrder.id,
        local_version: 1, // OfflineOrder doesn't have version property
        server_version: serverOrder.version || 1,
        conflict_fields: conflictFields,
        resolution_strategy: this.conflictStrategy,
        resolved: false,
      }
    }

    return null
  }

  private async resolveConflict(
    conflict: ConflictInfo,
    localOrder: OfflineOrder,
    serverOrder: ServerOrder,
  ): Promise<OfflineOrder | ServerOrder | null> {
    this.logSyncEvent(conflict.order_id, "conflict_detected", {
      conflict_fields: conflict.conflict_fields,
      strategy: conflict.resolution_strategy,
    })

    let resolvedOrder: OfflineOrder | ServerOrder = localOrder

    switch (conflict.resolution_strategy) {
      case ConflictResolutionStrategy.FIRST_WRITE_WINS:
        // Keep server version (first write)
        resolvedOrder = serverOrder
        break

      case ConflictResolutionStrategy.LAST_WRITE_WINS:
        // Keep local version (last write)
        resolvedOrder = localOrder
        break

      case ConflictResolutionStrategy.MANUAL_RESOLVE:
        // Flag for manual resolution
        await this.flagForManualResolution(conflict, localOrder, serverOrder)
        return null
    }

    this.logSyncEvent(conflict.order_id, "conflict_resolved", {
      resolution: conflict.resolution_strategy,
      resolved_order: resolvedOrder.id,
    })

    this.syncStatus.lastConflictResolution = new Date()
    this.notifyListeners()

    return resolvedOrder
  }

  private async flagForManualResolution(
    conflict: ConflictInfo,
    localOrder: OfflineOrder,
    serverOrder: ServerOrder,
  ): Promise<void> {
    const conflictData: OrderConflict = {
      id: Date.now().toString(), // Generate unique ID
      localOrder: localOrder,
      serverOrder: localOrder, // Use localOrder as fallback since ServerOrder type doesn't match OfflineOrder
      conflictType: "data_mismatch",
      detectedAt: new Date().toISOString(),
      resolved: false,
    }

    await indexedDBService.saveConflict(conflictData)

    this.syncStatus.conflictCount++
    this.notifyListeners()
  }

  private async initializeDB(): Promise<void> {
    try {
      await indexedDBService.init()
      await this.updatePendingOrdersCount()
    } catch (error) {
      console.error("Failed to initialize IndexedDB:", error)
    }
  }

  private handleOnline(): void {
    this.syncStatus.isOnline = true
    this.notifyListeners()
    // Auto sync when coming back online with retry logic
    this.syncWithRetry()
  }

  private handleOffline(): void {
    this.syncStatus.isOnline = false
    this.notifyListeners()
  }

  private async syncWithRetry(): Promise<void> {
    if (!this.syncStatus.isOnline || this.syncStatus.syncInProgress) {
      return
    }

    try {
      await this.syncAllData()
      this.retryAttempts = 0 // Reset on success
    } catch (error) {
      this.retryAttempts++
      console.error(`Sync attempt ${this.retryAttempts} failed:`, error)

      if (this.retryAttempts < this.maxRetries) {
        setTimeout(() => this.syncWithRetry(), this.retryDelay)
      } else {
        console.error("Max retry attempts reached for sync")
        this.retryAttempts = 0 // Reset for next time
      }
    }
  }

  async syncAllData(): Promise<void> {
    if (!this.syncStatus.isOnline || this.syncStatus.syncInProgress) {
      return
    }

    this.syncStatus.syncInProgress = true
    this.notifyListeners()

    try {
      // Sync products
      await this.syncProducts()

      // Sync customers
      await this.syncCustomers()

      // Sync settings
      await this.syncSettings()

      // Upload pending orders
      await this.uploadPendingOrders()

      try {
        await fetch("/api/reports/refresh-cache", { method: "POST" })
      } catch (error) {
        console.error("Failed to refresh reports cache:", error)
      }

      this.syncStatus.lastSync = new Date()
      await this.updatePendingOrdersCount()

      const now = Date.now()
      if (now - this.lastSyncLogTime > this.syncLogDebounceMs) {
        console.log("Sync completed successfully")
        this.lastSyncLogTime = now
      }
    } catch (error) {
      console.error("Sync failed:", error)
      throw error // Re-throw for retry mechanism
    } finally {
      this.syncStatus.syncInProgress = false
      this.notifyListeners()
    }
  }

  private async syncProducts(): Promise<void> {
    try {
      const response = await fetch("/api/products")
      if (!response.ok) throw new Error("Failed to fetch products")

      const products = await response.json()
      const offlineProducts: OfflineProduct[] = products.map(
        (p: {
          id: number
          name: string
          retail_price: number
          wholesale_price: number
          cost_price: number
          stock_quantity: number
          barcode: string | null
          sku: string | null
          status: string
          is_service: boolean
          image_url: string | null
          category_id: number | null
          created_at: string
          updated_at: string
        }) => ({
          id: p.id,
          name: p.name,
          retail_price: p.retail_price,
          wholesale_price: p.wholesale_price,
          cost_price: p.cost_price,
          stock_quantity: p.stock_quantity,
          barcode: p.barcode,
          sku: p.sku,
          status: p.status,
          is_service: p.is_service,
          image_url: p.image_url,
          category_id: p.category_id,
          created_at: p.created_at,
          updated_at: p.updated_at,
        }),
      )

      await indexedDBService.saveProducts(offlineProducts)
    } catch (error) {
      console.error("Failed to sync products:", error)
    }
  }

  private async syncCustomers(): Promise<void> {
    try {
      const response = await fetch("/api/customers")
      if (!response.ok) throw new Error("Failed to fetch customers")

      const customers = await response.json()
      const offlineCustomers: OfflineCustomer[] = customers.map(
        (c: {
          id: number
          name: string
          phone: string | null
          email: string | null
          address: string | null
          created_at: string
        }) => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          email: c.email,
          address: c.address,
          created_at: c.created_at,
        }),
      )

      await indexedDBService.saveCustomers(offlineCustomers)
    } catch (error) {
      console.error("Failed to sync customers:", error)
    }
  }

  private async syncSettings(): Promise<void> {
    try {
      const response = await fetch("/api/settings")
      if (!response.ok) throw new Error("Failed to fetch settings")

      const settings = await response.json()

      // Save important settings for offline use
      await indexedDBService.saveSetting("tax_rate", settings.tax_rate || 0.1)
      await indexedDBService.saveSetting("store_info", settings.store_info || {})
    } catch (error) {
      console.error("Failed to sync settings:", error)
    }
  }

  private async uploadPendingOrders(): Promise<void> {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const pendingOrders = await indexedDBService.getUnsyncedOrders()
      const now = Date.now()

      if (now - this.lastSyncLogTime <= 100 || pendingOrders.length > 0) {
        console.log(`[Sync] Found ${pendingOrders.length} pending orders to upload`)
      }

      if (pendingOrders.length === 0) {
        if (now - this.lastSyncLogTime <= 100) {
          const allOrders = await indexedDBService.getAllOrders()
          console.log(`[Sync] Total orders in IndexedDB: ${allOrders.length}`)
        }
        if (now - this.lastSyncLogTime <= 100) {
          console.log(`[Sync] Finished uploading pending orders`)
        }
        return
      }

      for (const order of pendingOrders) {
        try {
          this.logSyncEvent(order.id, "sync_attempted", { order_number: order.order_number })

          console.log(`[Sync] Uploading order: ${order.order_number} (ID: ${order.id})`)

          if (order.status === "pending") {
            console.log(`[Sync] Skipping pending order: ${order.order_number}`)
            continue
          }

          let existingOrder = null
          try {
            const checkResponse = await fetch(`/api/orders/check/${order.id}`)
            if (checkResponse.ok) {
              const result = await checkResponse.json()
              if (result.success) {
                existingOrder = result.order
              }
            } else if (checkResponse.status !== 404) {
              // Only log non-404 errors as 404 is expected for new orders
              console.warn(`[Sync] Order check failed with status ${checkResponse.status}`)
            }
          } catch (error) {
            if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
              console.warn(`[Sync] Network error checking order ${order.id}, proceeding with upload`)
            } else {
              console.warn(`[Sync] Error checking existing order ${order.id}:`, error)
            }
            // Continue with upload even if check fails
          }

          if (existingOrder) {
            const conflict = await this.detectConflict(order, existingOrder)
            if (conflict) {
              const resolvedOrder = await this.resolveConflict(conflict, order, existingOrder)
              if (!resolvedOrder) {
                // Manual resolution required, skip for now
                continue
              }
              // Use resolved order for upload
              Object.assign(order, resolvedOrder)
            }
          }

          const response = await fetch("/api/orders", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              customer_id: order.customer_id,
              subtotal: order.subtotal,
              tax_amount: order.tax_amount,
              discount_amount: order.discount_amount,
              total_amount: order.total_amount,
              payment_method: order.payment_method,
              payment_status: order.payment_status,
              status: order.status,
              items: order.items,
              offline_id: order.id,
              created_at: order.created_at,
              version: 1, // OfflineOrder doesn't have version property
              device_id: getDeviceId(),
              sync_timeline: this.syncTimelines.get(order.id)?.events || [],
            }),
          })

          if (response.ok) {
            const result = await response.json()
            console.log(`[Sync] Upload response:`, result)

            if (result.success) {
              this.logSyncEvent(order.id, "sync_success", {
                server_order_number: result.order_number,
              })

              // Delete the offline order after successful sync
              console.log(`[Sync] Deleting synced order from IndexedDB: ${order.id}`)
              await indexedDBService.deleteOrder(order.id)

              const remainingOrders = await indexedDBService.getUnsyncedOrders()
              console.log(`[Sync] Remaining unsynced orders: ${remainingOrders.length}`)

              console.log(`[Sync] Successfully synced offline order: ${order.order_number} -> ${result.order_number}`)
              
              // Notify that sync was successful
              this.notifySyncSuccess(order.order_number, result.order_number)
            } else {
              console.error(`[Sync] Server rejected order ${order.order_number}:`, result.error)
            }
          } else {
            const errorText = await response.text()
            console.error(
              `[Sync] Failed to sync order ${order.order_number}: ${response.status} ${response.statusText}`,
              errorText,
            )
          }
        } catch (error) {
          console.error(`[Sync] Failed to upload order ${order.id}:`, error)
        }
      }

      console.log(`[Sync] Finished uploading pending orders`)

      await this.updatePendingOrdersCount()
    } catch (error) {
      console.error("[Sync] Failed to upload pending orders:", error)
    }
  }

  private async updateLocalInventory(productId: number, quantityChange: number): Promise<void> {
    try {
      const products = await indexedDBService.getProducts()
      const product = products.find((p) => p.id === productId)

      if (product) {
        product.stock_quantity = Math.max(0, product.stock_quantity + quantityChange)
        await indexedDBService.saveProducts([product])
      }
    } catch (error) {
      console.error("Failed to update local inventory:", error)
    }
  }

  async createOfflineOrder(orderData: {
    customer_id?: number
    subtotal: number
    tax_amount: number
    discount_amount: number
    total_amount: number
    payment_method: string
    payment_status: string
    status: string
    items: {
      product_id: number
      product_name: string
      quantity: number
      unit_price: number
      total_price: number
      is_service?: boolean
    }[]
  }): Promise<string> {
    const orderId = generateUUID()
    const orderNumber = `OFF-${Date.now().toString().slice(-6)}`

    const offlineOrder: OfflineOrder = {
      id: orderId,
      order_number: orderNumber,
      customer_id: orderData.customer_id,
      subtotal: orderData.subtotal,
      tax_amount: orderData.tax_amount,
      discount_amount: orderData.discount_amount,
      total_amount: orderData.total_amount,
      payment_method: orderData.payment_method,
      payment_status: orderData.payment_status,
      status: "completed",
      created_at: new Date().toISOString(),
      items: orderData.items,
      synced: false,
      // version property not in OfflineOrder type
      // last_modified property not in OfflineOrder type
      // created_by property not in OfflineOrder type
      // sync_attempts: 0, // Removed - not in OfflineOrder type
    }

    this.logSyncEvent(orderId, "created", {
      order_number: orderNumber,
      total_amount: orderData.total_amount,
    })

    console.log("[v0] Saving offline order to IndexedDB:", orderId, "synced:", offlineOrder.synced)
    await indexedDBService.saveOfflineOrder(offlineOrder)

    await new Promise((resolve) => setTimeout(resolve, 100))

    const savedOrders = await indexedDBService.getUnsyncedOrders()
    console.log("[v0] Unsynced orders after save:", savedOrders.length)

    const specificOrder = savedOrders.find((order) => order.id === orderId)
    if (specificOrder) {
      console.log("[v0] Confirmed order saved:", specificOrder.order_number, "synced:", specificOrder.synced)
    } else {
      console.error("[v0] Order not found after save:", orderId)
    }

    await this.updatePendingOrdersCount()

    return orderId
  }

  async getOfflineProducts(): Promise<OfflineProduct[]> {
    return await indexedDBService.getProducts()
  }

  async getOfflineCustomers(): Promise<OfflineCustomer[]> {
    return await indexedDBService.getCustomers()
  }

  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus }
  }

  onStatusChange(callback: (status: SyncStatus) => void): () => void {
    this.listeners.push(callback)
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach((callback) => callback({ ...this.syncStatus }))
  }

  async forcSync(): Promise<void> {
    if (typeof window === "undefined") {
      return // Skip sync on server-side
    }

    if (!this.syncStatus.isOnline) {
      throw new Error("Cannot sync while offline")
    }

    await this.syncAllData()
  }

  async startBackgroundSync(): Promise<void> {
    if (typeof window === "undefined") {
      return // Skip on server-side
    }

    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready
        // registration.sync.register("background-sync") // sync property not available
      } catch (error) {
        console.error("Background sync registration failed:", error)
      }
    }
  }

  async getStorageInfo(): Promise<{
    products: number
    orders: number
    customers: number
  }> {
    return await indexedDBService.getStorageInfo()
  }

  async getConflicts(): Promise<OrderConflict[]> {
    return await indexedDBService.getConflicts()
  }

  async resolveManualConflict(conflictId: string, resolution: "local" | "server"): Promise<void> {
    const conflicts = await indexedDBService.getConflicts()
    const conflict = conflicts.find(c => c.id === conflictId)
    if (!conflict) return

    if (resolution === "local") {
      // Keep local version, upload to server
      await this.uploadPendingOrders()
    } else {
      // Accept server version, delete local
      await indexedDBService.deleteOrder(conflict.localOrder.id)
    }

    // deleteConflict method not available in IndexedDBService
    // await indexedDBService.deleteConflict(conflictId)
    this.syncStatus.conflictCount--
    this.notifyListeners()
  }

  getSyncTimeline(orderId: string): SyncTimeline | null {
    return this.syncTimelines.get(orderId) || null
  }

  setConflictResolutionStrategy(strategy: ConflictResolutionStrategy): void {
    this.conflictStrategy = strategy
  }

  private async updatePendingOrdersCount(): Promise<void> {
    try {
      const pendingOrders = await indexedDBService.getUnsyncedOrders()
      const conflicts = await indexedDBService.getConflicts()
      this.syncStatus.pendingOrders = pendingOrders.length
      this.syncStatus.conflictCount = conflicts.length
      this.notifyListeners()
    } catch (error) {
      console.error("Failed to update pending orders count:", error)
      this.syncStatus.pendingOrders = 0
      this.syncStatus.conflictCount = 0
    }
  }
}

// Singleton instance
export const offlineSyncService = new OfflineSyncService()
export type { SyncStatus, ConflictResolutionStrategy, ConflictInfo, SyncTimeline, SyncEvent }

interface ServerOrder {
  id: string
  total_amount: number
  status: string
  payment_status: string
  version?: number
  order_number?: string
  [key: string]: unknown
}
