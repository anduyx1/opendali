/**
 * IndexedDB Service cho Offline POS System
 * Quản lý lưu trữ cục bộ sản phẩm, đơn hàng và giao dịch
 */

interface OfflineProduct {
  id: number
  name: string
  retail_price: number
  wholesale_price: number
  cost_price: number
  stock_quantity: number
  barcode?: string
  sku?: string
  status: string
  is_service?: boolean
  image_url?: string
  category_id?: number
  created_at: string
  updated_at: string
}

interface OfflineOrder {
  id: string // UUID cho offline orders
  order_number: string // OFF-xxxx (offline order number)
  server_order_number?: string // ORD-xxxx (server order number after sync)
  customer_id?: number
  subtotal: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  payment_method: string
  payment_status: string
  status: string
  notes?: string
  created_at: string
  updated_at: string
  items: OfflineOrderItem[]
  synced: boolean // Flag để track sync status
}

interface OfflineOrderItem {
  product_id: number
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
  is_service?: boolean
}

interface OfflineCustomer {
  id: number
  name: string
  phone?: string
  email?: string
  address?: string
  created_at: string
}

interface OrderConflict {
  id: string
  localOrder: OfflineOrder
  serverOrder: OfflineOrder
  conflictType: "data_mismatch" | "duplicate" | "version_conflict"
  detectedAt: string
  resolved: boolean
  resolutionStrategy?: "first_write_wins" | "last_write_wins" | "manual"
  resolvedAt?: string
}

interface SyncLogEntry {
  id: string
  orderId: string
  action: "create" | "update" | "sync" | "conflict_detected" | "conflict_resolved"
  timestamp: string
  details: Record<string, unknown>
  success: boolean
  error?: string
}

class IndexedDBService {
  private dbName = "POS_Offline_DB"
  private version = 2 // Tăng version để thêm stores mới
  private db: IDBDatabase | null = null
  private lastLogTime = 0
  private logDebounceMs = 5000 // Only log every 5 seconds

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Products store
        if (!db.objectStoreNames.contains("products")) {
          const productsStore = db.createObjectStore("products", { keyPath: "id" })
          productsStore.createIndex("barcode", "barcode", { unique: false })
          productsStore.createIndex("sku", "sku", { unique: false })
          productsStore.createIndex("status", "status", { unique: false })
        }

        // Orders store (for offline orders)
        if (!db.objectStoreNames.contains("orders")) {
          const ordersStore = db.createObjectStore("orders", { keyPath: "id" })
          ordersStore.createIndex("synced", "synced", { unique: false })
          ordersStore.createIndex("created_at", "created_at", { unique: false })
        }

        // Customers store
        if (!db.objectStoreNames.contains("customers")) {
          const customersStore = db.createObjectStore("customers", { keyPath: "id" })
          customersStore.createIndex("phone", "phone", { unique: false })
        }

        // Settings store (for app settings, tax rates, etc.)
        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings", { keyPath: "key" })
        }

        if (!db.objectStoreNames.contains("conflicts")) {
          const conflictsStore = db.createObjectStore("conflicts", { keyPath: "id" })
          conflictsStore.createIndex("resolved", "resolved", { unique: false })
          conflictsStore.createIndex("detectedAt", "detectedAt", { unique: false })
        }

        if (!db.objectStoreNames.contains("sync_logs")) {
          const syncLogsStore = db.createObjectStore("sync_logs", { keyPath: "id" })
          syncLogsStore.createIndex("orderId", "orderId", { unique: false })
          syncLogsStore.createIndex("timestamp", "timestamp", { unique: false })
          syncLogsStore.createIndex("action", "action", { unique: false })
        }
      }
    })
  }

  // Products operations
  async saveProducts(products: OfflineProduct[]): Promise<void> {
    if (!this.db) throw new Error("Database not initialized")

    const transaction = this.db!.transaction(["products"], "readwrite")
    const store = transaction.objectStore("products")

    for (const product of products) {
      await new Promise<void>((resolve, reject) => {
        const request = store.put(product)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    }
  }

  async bulkAddProducts(products: OfflineProduct[]): Promise<void> {
    return this.saveProducts(products)
  }

  async getAllProducts(): Promise<OfflineProduct[]> {
    return this.getProducts()
  }

  async getProducts(): Promise<OfflineProduct[]> {
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["products"], "readonly")
      const store = transaction.objectStore("products")
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async getProductById(id: number): Promise<OfflineProduct | null> {
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["products"], "readonly")
      const store = transaction.objectStore("products")
      const request = store.get(id)

      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  // Orders operations
  async saveOfflineOrder(order: OfflineOrder): Promise<string> {
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["orders"], "readwrite")
      const store = transaction.objectStore("orders")

      console.log(`[IndexedDB] Saving order ${order.order_number} with synced=${order.synced}`)
      const request = store.put(order)

      request.onsuccess = () => {
        console.log(`[IndexedDB] Successfully saved order ${order.order_number}`)
        resolve(order.id) // Trả về ID của order
      }
      request.onerror = () => {
        console.error(`[IndexedDB] Failed to save order ${order.order_number}:`, request.error)
        reject(request.error)
      }
    })
  }

  async getUnsyncedOrders(): Promise<OfflineOrder[]> {
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["orders"], "readonly")
      const store = transaction.objectStore("orders")

      const request = store.getAll()

      request.onsuccess = () => {
        const allOrders = request.result as OfflineOrder[]
        const now = Date.now()

        if (allOrders.length > 0 && now - this.lastLogTime > this.logDebounceMs) {
          console.log(`[IndexedDB] Total orders in database: ${allOrders.length}`)
          this.lastLogTime = now
        }

        const unsyncedOrders = allOrders.filter((order) => {
          const isUnsynced = order.synced === false || order.synced === undefined
          const isCompleted = order.status === "completed" && order.payment_status === "completed"
          return isUnsynced && isCompleted // Chỉ trả về đơn đã thanh toán và chưa đồng bộ
        })

        if (unsyncedOrders.length > 0 && now - this.lastLogTime <= 100) {
          console.log(`[IndexedDB] Completed unsynced orders found: ${unsyncedOrders.length}`)
          unsyncedOrders.forEach(order => {
            console.log(`[IndexedDB] Order ready for sync: ${order.order_number} (status: ${order.status}, payment: ${order.payment_status})`)
          })
        }

        resolve(unsyncedOrders)
      }

      request.onerror = () => reject(request.error)
    })
  }

  async markOrderAsSynced(orderId: string): Promise<void> {
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["orders"], "readwrite")
      const store = transaction.objectStore("orders")
      const getRequest = store.get(orderId)

      getRequest.onsuccess = () => {
        const order = getRequest.result
        if (order) {
          order.synced = true
          const putRequest = store.put(order)
          putRequest.onsuccess = () => resolve()
          putRequest.onerror = () => reject(putRequest.error)
        } else {
          resolve()
        }
      }
      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  async deleteOrder(orderId: string): Promise<void> {
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["orders"], "readwrite")
      const store = transaction.objectStore("orders")
      const request = store.delete(orderId)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async deleteOrderByNumber(orderNumber: string): Promise<void> {
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["orders"], "readwrite")
      const store = transaction.objectStore("orders")
      const getAllRequest = store.getAll()

      getAllRequest.onsuccess = () => {
        const orders = getAllRequest.result as OfflineOrder[]
        const orderToDelete = orders.find(order => order.order_number === orderNumber)
        
        if (orderToDelete) {
          console.log(`[IndexedDB] Deleting order by number: ${orderNumber}`)
          const deleteRequest = store.delete(orderToDelete.id)
          deleteRequest.onsuccess = () => resolve()
          deleteRequest.onerror = () => reject(deleteRequest.error)
        } else {
          console.log(`[IndexedDB] Order not found by number: ${orderNumber}`)
          resolve()
        }
      }
      getAllRequest.onerror = () => reject(getAllRequest.error)
    })
  }

  async getAllOrders(): Promise<OfflineOrder[]> {
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["orders"], "readonly")
      const store = transaction.objectStore("orders")
      const request = store.getAll()

      request.onsuccess = () => {
        const orders = request.result.map((order: OfflineOrder) => ({
          ...order,
          order_status: order.status,
          order_items:
            order.items?.map((item) => ({
              id: item.product_id,
              product_id: item.product_id,
              product_name: item.product_name,
              quantity: item.quantity,
              unit_price: item.unit_price,
              total_price: item.total_price,
              returned_quantity: 0,
              is_service: item.is_service || false,
            })) || [],
        }))
        resolve(orders)
      }
      request.onerror = () => reject(request.error)
    })
  }

  async getCachedOnlineOrders(): Promise<OfflineOrder[]> {
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["orders"], "readonly")
      const store = transaction.objectStore("orders")
      const getAllRequest = store.getAll()

      getAllRequest.onsuccess = () => {
        const allOrders = getAllRequest.result as OfflineOrder[]
        // Filter for cached online orders (orders that were online but cached when going offline)
        const cachedOnlineOrders = allOrders.filter(order => 
          order.order_number.startsWith("ONLINE-") || 
          (order.synced === undefined && order.status === "pending")
        )
        console.log(`[IndexedDB] Found ${cachedOnlineOrders.length} cached online orders`)
        resolve(cachedOnlineOrders)
      }
      getAllRequest.onerror = () => reject(getAllRequest.error)
    })
  }

  async getOrderById(id: number): Promise<OfflineOrder | null> {
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["orders"], "readonly")
      const store = transaction.objectStore("orders")
      const request = store.get(id.toString())

      request.onsuccess = () => {
        const order = request.result as OfflineOrder | undefined
        if (order) {
          const formattedOrder: OfflineOrder = {
            ...order,
            order_status: order.status,
            order_items:
              order.items?.map((item) => ({
                id: item.product_id,
                product_id: item.product_id,
                product_name: item.product_name,
                quantity: item.quantity,
                unit_price: item.unit_price,
                total_price: item.total_price,
                returned_quantity: 0,
                is_service: item.is_service || false,
              })) || [],
          } as OfflineOrder
          resolve(formattedOrder)
        } else {
          resolve(null)
        }
      }
      request.onerror = () => reject(request.error)
    })
  }

  // Customers operations
  async saveCustomers(customers: OfflineCustomer[]): Promise<void> {
    if (!this.db) throw new Error("Database not initialized")

    const transaction = this.db!.transaction(["customers"], "readwrite")
    const store = transaction.objectStore("customers")

    for (const customer of customers) {
      await new Promise<void>((resolve, reject) => {
        const request = store.put(customer)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    }
  }

  async bulkAddCustomers(customers: OfflineCustomer[]): Promise<void> {
    return this.saveCustomers(customers)
  }

  async getAllCustomers(): Promise<OfflineCustomer[]> {
    return this.getCustomers()
  }

  async getCustomers(): Promise<OfflineCustomer[]> {
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["customers"], "readonly")
      const store = transaction.objectStore("customers")
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // Settings operations
  async saveSetting(key: string, value: unknown): Promise<void> {
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["settings"], "readwrite")
      const store = transaction.objectStore("settings")
      const request = store.put({ key, value })

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getSetting(key: string): Promise<unknown> {
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["settings"], "readonly")
      const store = transaction.objectStore("settings")
      const request = store.get(key)

      request.onsuccess = () => resolve(request.result?.value || null)
      request.onerror = () => reject(request.error)
    })
  }

  // Conflict resolution methods
  async getConflicts(): Promise<OrderConflict[]> {
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["conflicts"], "readonly")
      const store = transaction.objectStore("conflicts")
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async saveConflict(conflict: OrderConflict): Promise<void> {
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["conflicts"], "readwrite")
      const store = transaction.objectStore("conflicts")
      const request = store.put(conflict)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async resolveConflict(conflictId: string, resolutionStrategy: string): Promise<void> {
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["conflicts"], "readwrite")
      const store = transaction.objectStore("conflicts")
      const getRequest = store.get(conflictId)

      getRequest.onsuccess = () => {
        const conflict = getRequest.result
        if (conflict) {
          conflict.resolved = true
          conflict.resolutionStrategy = resolutionStrategy
          conflict.resolvedAt = new Date().toISOString()

          const putRequest = store.put(conflict)
          putRequest.onsuccess = () => resolve()
          putRequest.onerror = () => reject(putRequest.error)
        } else {
          resolve()
        }
      }
      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  // Sync logging methods
  async getSyncLog(orderId?: string): Promise<SyncLogEntry[]> {
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["sync_logs"], "readonly")
      const store = transaction.objectStore("sync_logs")

      if (orderId) {
        const index = store.index("orderId")
        const request = index.getAll(orderId)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      } else {
        const request = store.getAll()
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      }
    })
  }

  async saveSyncLog(logEntry: SyncLogEntry): Promise<void> {
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["sync_logs"], "readwrite")
      const store = transaction.objectStore("sync_logs")
      const request = store.put(logEntry)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // Utility methods
  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized")

    const stores = ["products", "orders", "customers", "settings", "conflicts", "sync_logs"]
    const transaction = this.db!.transaction(stores, "readwrite")

    for (const storeName of stores) {
      const store = transaction.objectStore(storeName)
      await new Promise<void>((resolve, reject) => {
        const request = store.clear()
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    }
  }

  async getStorageInfo(): Promise<{
    products: number
    orders: number
    customers: number
    conflicts: number
    syncLogs: number
  }> {
    if (!this.db) throw new Error("Database not initialized")

    const [products, orders, customers, conflicts, syncLogs] = await Promise.all([
      this.getProducts(),
      this.getUnsyncedOrders(),
      this.getCustomers(),
      this.getConflicts(),
      this.getSyncLog(),
    ])

    return {
      products: products.length,
      orders: orders.length,
      customers: customers.length,
      conflicts: conflicts.length,
      syncLogs: syncLogs.length,
    }
  }

  async getPendingOrdersCount(): Promise<number> {
    try {
      const unsyncedOrders = await this.getUnsyncedOrders()
      return unsyncedOrders.length
    } catch (error) {
      console.error("Failed to get pending orders count:", error)
      return 0
    }
  }
}

// Singleton instance
export const indexedDBService = new IndexedDBService()
export { IndexedDBService }
export type { OfflineProduct, OfflineOrder, OfflineOrderItem, OfflineCustomer, OrderConflict, SyncLogEntry }
