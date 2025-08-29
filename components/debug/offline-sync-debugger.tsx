"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Database, Wifi, WifiOff, Play, Trash2 } from "lucide-react"
import { offlineSyncService, type SyncStatus } from "@/lib/services/offline-sync"
import { indexedDBService } from "@/lib/services/indexeddb"

interface StorageInfo {
  products: number
  orders: number
  customers: number
}

interface DebugOrder {
  id: string
  order_number: string
  total_amount: number
  synced: boolean
  created_at: string
  items_count: number
}

interface WindowWithTestFunction extends Window {
  testOfflineSync?: () => Promise<void>
}

export function OfflineSyncDebugger() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null)
  const [unsyncedOrders, setUnsyncedOrders] = useState<DebugOrder[]>([])
  const [allOrders, setAllOrders] = useState<DebugOrder[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const refreshData = async () => {
    setIsLoading(true)
    try {
      // Get sync status
      const status = offlineSyncService.getSyncStatus()
      setSyncStatus(status)

      // Get storage info
      const storage = await indexedDBService.getStorageInfo()
      setStorageInfo(storage)

      // Get unsynced orders
      const unsynced = await indexedDBService.getUnsyncedOrders()
      const unsyncedDebug = unsynced.map((order) => ({
        id: order.id,
        order_number: order.order_number,
        total_amount: order.total_amount,
        synced: order.synced,
        created_at: order.created_at,
        items_count: order.items?.length || 0,
      }))
      setUnsyncedOrders(unsyncedDebug)

      // Get all orders
      const all = await indexedDBService.getAllOrders()
      const allDebug = all.map((order) => ({
        id: order.id,
        order_number: order.order_number,
        total_amount: order.total_amount,
        synced: order.synced,
        created_at: order.created_at,
        items_count: order.items?.length || 0,
      }))
      setAllOrders(allDebug)

      setLastRefresh(new Date())
    } catch (error) {
      console.error("Failed to refresh debug data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleForceSync = async () => {
    try {
      await offlineSyncService.forcSync()
      await refreshData()
    } catch (error) {
      console.error("Force sync failed:", error)
    }
  }

  const handleClearAllOrders = async () => {
    if (confirm("Are you sure you want to clear all offline orders? This cannot be undone.")) {
      try {
        const orders = await indexedDBService.getAllOrders()
        for (const order of orders) {
          await indexedDBService.deleteOrder(order.id)
        }
        await refreshData()
      } catch (error) {
        console.error("Failed to clear orders:", error)
      }
    }
  }

  const handleCreateTestOrder = async () => {
    try {
      await offlineSyncService.createOfflineOrder({
        customer_id: 1,
        subtotal: Math.random() * 100,
        tax_amount: 10,
        discount_amount: 0,
        total_amount: Math.random() * 100 + 10,
        payment_method: "cash",
        payment_status: "completed",
        status: "completed",
        items: [
          {
            product_id: 1,
            product_name: "Debug Test Product",
            quantity: 1,
            unit_price: Math.random() * 100,
            total_price: Math.random() * 100,
            is_service: false,
          },
        ],
      })
      await refreshData()
    } catch (error) {
      console.error("Failed to create test order:", error)
    }
  }

  const runComprehensiveTest = async () => {
    if (typeof window !== "undefined" && (window as WindowWithTestFunction).testOfflineSync) {
      try {
        const testFunction = (window as WindowWithTestFunction).testOfflineSync
        if (testFunction && typeof testFunction === 'function') {
          await testFunction()
          await refreshData()
        }
      } catch (error) {
        console.error("Error running test:", error)
      }
    } else {
      console.error("Test function not available. Make sure test script is loaded.")
    }
  }

  useEffect(() => {
    refreshData()

    // Set up sync status listener
    const unsubscribe = offlineSyncService.onStatusChange((status) => {
      setSyncStatus(status)
    })

    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        try {
          unsubscribe()
        } catch (error) {
          console.warn('Error calling unsubscribe:', error)
        }
      }
    }
  }, [])

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Offline Sync Debugger</h2>
          <p className="text-muted-foreground">Monitor and debug offline synchronization functionality</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refreshData} disabled={isLoading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={runComprehensiveTest} variant="secondary">
            <Play className="h-4 w-4 mr-2" />
            Run Tests
          </Button>
        </div>
      </div>

      {lastRefresh && (
        <p className="text-sm text-muted-foreground">Last refreshed: {lastRefresh.toLocaleTimeString()}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Sync Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              {syncStatus?.isOnline ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              Network Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Online:</span>
              <Badge variant={syncStatus?.isOnline ? "default" : "destructive"}>
                {syncStatus?.isOnline ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Sync in Progress:</span>
              <Badge variant={syncStatus?.syncInProgress ? "secondary" : "outline"}>
                {syncStatus?.syncInProgress ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Pending Orders:</span>
              <Badge variant={syncStatus?.pendingOrders ? "destructive" : "default"}>
                {syncStatus?.pendingOrders || 0}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Last Sync:</span>
              <span className="text-sm">
                {syncStatus?.lastSync ? new Date(syncStatus.lastSync).toLocaleTimeString() : "Never"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Storage Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Storage Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Products:</span>
              <Badge variant="outline">{storageInfo?.products || 0}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Customers:</span>
              <Badge variant="outline">{storageInfo?.customers || 0}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Offline Orders:</span>
              <Badge variant="outline">{storageInfo?.orders || 0}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Total Orders:</span>
              <Badge variant="outline">{allOrders.length}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Debug Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button onClick={handleForceSync} className="w-full" size="sm">
              Force Sync
            </Button>
            <Button onClick={handleCreateTestOrder} variant="outline" className="w-full bg-transparent" size="sm">
              Create Test Order
            </Button>
            <Button onClick={handleClearAllOrders} variant="destructive" className="w-full" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All Orders
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Unsynced Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Unsynced Orders ({unsyncedOrders.length})</CardTitle>
          <CardDescription>Orders waiting to be synchronized with the server</CardDescription>
        </CardHeader>
        <CardContent>
          {unsyncedOrders.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No unsynced orders found</p>
          ) : (
            <div className="space-y-2">
              {unsyncedOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">{order.order_number}</p>
                    <p className="text-sm text-muted-foreground">
                      ${order.total_amount.toFixed(2)} • {order.items_count} items
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={order.synced ? "default" : "destructive"}>
                      {order.synced ? "Synced" : "Pending"}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(order.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Orders */}
      <Card>
        <CardHeader>
          <CardTitle>All Orders ({allOrders.length})</CardTitle>
          <CardDescription>Complete list of orders in IndexedDB storage</CardDescription>
        </CardHeader>
        <CardContent>
          {allOrders.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No orders found in storage</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {allOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-2 border rounded text-sm">
                  <div>
                    <p className="font-medium">{order.order_number}</p>
                    <p className="text-xs text-muted-foreground">ID: {order.id.substring(0, 20)}...</p>
                  </div>
                  <div className="text-right">
                    <p>${order.total_amount.toFixed(2)}</p>
                    <Badge variant={order.synced ? "default" : "destructive"} className="text-xs">
                      {order.synced ? "Synced" : "Pending"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
