"use client"

/**
 * Sync Status Panel Component
 * Hiển thị trạng thái đồng bộ dữ liệu offline
 */

import { useState, useEffect } from "react"
import { RefreshCw, Database, Upload, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { offlineSyncService, type SyncStatus } from "@/lib/services/offline-sync"
import { cn } from "@/lib/utils"

interface SyncStatusPanelProps {
  className?: string
  showDetails?: boolean
}

export function SyncStatusPanel({ className, showDetails = true }: SyncStatusPanelProps) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    lastSync: null,
    pendingOrders: 0,
    syncInProgress: false,
    conflictCount: 0,
    lastConflictResolution: null,
  })

  const [storageInfo, setStorageInfo] = useState({
    products: 0,
    orders: 0,
    customers: 0,
  })

  useEffect(() => {
    const unsubscribe = offlineSyncService.onStatusChange(setSyncStatus)

    const updateStorageInfo = async () => {
      try {
        const info = await offlineSyncService.getStorageInfo()
        setStorageInfo(info)
      } catch (error) {
        console.error("Failed to get storage info:", error)
      }
    }

    updateStorageInfo()
    const interval = setInterval(updateStorageInfo, 30000) // Update every 30 seconds

    return () => {
      unsubscribe()
      clearInterval(interval)
    }
  }, [])

  const handleManualSync = async () => {
    try {
      await offlineSyncService.forcSync()
    } catch (error) {
      console.error("Manual sync failed:", error)
    }
  }

  const formatLastSync = (date: Date | null) => {
    if (!date) return "Chưa đồng bộ"
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)

    if (minutes < 1) return "Vừa xong"
    if (minutes < 60) return `${minutes} phút trước`

    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} giờ trước`

    const days = Math.floor(hours / 24)
    return `${days} ngày trước`
  }

  const getSyncStatusColor = () => {
    if (!syncStatus.isOnline) return "text-red-600"
    if (syncStatus.syncInProgress) return "text-blue-600"
    if (syncStatus.pendingOrders > 0) return "text-yellow-600"
    return "text-green-600"
  }

  const getSyncStatusIcon = () => {
    if (!syncStatus.isOnline) return <AlertCircle className="h-4 w-4" />
    if (syncStatus.syncInProgress) return <RefreshCw className="h-4 w-4 animate-spin" />
    if (syncStatus.pendingOrders > 0) return <Upload className="h-4 w-4" />
    return <CheckCircle className="h-4 w-4" />
  }

  const getSyncStatusText = () => {
    if (!syncStatus.isOnline) return "Offline"
    if (syncStatus.syncInProgress) return "Đang đồng bộ..."
    if (syncStatus.pendingOrders > 0) return `${syncStatus.pendingOrders} đơn chờ đồng bộ`
    return "Đã đồng bộ"
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span>Trạng thái đồng bộ</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualSync}
            disabled={syncStatus.syncInProgress || !syncStatus.isOnline}
            className="h-7 px-2 bg-transparent"
          >
            <RefreshCw className={cn("h-3 w-3", syncStatus.syncInProgress && "animate-spin")} />
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={getSyncStatusColor()}>{getSyncStatusIcon()}</span>
            <span className="text-sm font-medium">{getSyncStatusText()}</span>
          </div>
          <Badge variant={syncStatus.isOnline ? "default" : "destructive"}>
            {syncStatus.isOnline ? "Online" : "Offline"}
          </Badge>
        </div>

        {showDetails && (
          <>
            <div className="text-xs text-muted-foreground">Đồng bộ lần cuối: {formatLastSync(syncStatus.lastSync)}</div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center p-2 bg-muted rounded">
                <div className="font-medium">{storageInfo.products}</div>
                <div className="text-muted-foreground">Sản phẩm</div>
              </div>
              <div className="text-center p-2 bg-muted rounded">
                <div className="font-medium">{storageInfo.customers}</div>
                <div className="text-muted-foreground">Khách hàng</div>
              </div>
              <div className="text-center p-2 bg-muted rounded">
                <div className="font-medium">{storageInfo.orders}</div>
                <div className="text-muted-foreground">Đơn offline</div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default SyncStatusPanel
