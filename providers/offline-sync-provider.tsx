"use client"

/**
 * Offline Sync Provider
 * Quản lý auto sync và network status cho toàn bộ app
 */

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { offlineSyncService, type SyncStatus } from "@/lib/services/offline-sync"
import { useToast } from "@/hooks/use-toast"
import { NetworkStatusIndicator } from "@/components/ui/network-status-indicator"
import { NetworkStatusModal } from "@/components/ui/network-status-modal"

interface OfflineSyncContextType {
  syncStatus: SyncStatus
  forcSync: () => Promise<void>
  isInitialized: boolean
}

const OfflineSyncContext = createContext<OfflineSyncContextType | undefined>(undefined)

export function useOfflineSync() {
  const context = useContext(OfflineSyncContext)
  if (context === undefined) {
    throw new Error("useOfflineSync must be used within an OfflineSyncProvider")
  }
  return context
}

interface OfflineSyncProviderProps {
  children: React.ReactNode
}

export function OfflineSyncProvider({ children }: OfflineSyncProviderProps) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    lastSync: null,
    pendingOrders: 0,
    syncInProgress: false,
    conflictCount: 0,
    lastConflictResolution: null,
  })
  const [isInitialized, setIsInitialized] = useState(false)
  const [showNetworkStatus, setShowNetworkStatus] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [showNetworkModal, setShowNetworkModal] = useState(false)
  const [networkModalType, setNetworkModalType] = useState<"offline" | "online">("offline")
  const { toast } = useToast()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted) return

    let retryTimeout: NodeJS.Timeout
    let syncAttempts = 0
    const maxRetryAttempts = 3
    const retryDelay = 5000 // 5 seconds

    const handleStatusChange = (status: SyncStatus) => {
      const wasOffline = !syncStatus.isOnline
      const isNowOnline = status.isOnline

      setSyncStatus(status)

      if (wasOffline !== !isNowOnline) {
        setShowNetworkStatus(true)
        setTimeout(() => setShowNetworkStatus(false), 3000)

        // Show appropriate modal
        if (!isNowOnline && !wasOffline) {
          // Going offline
          setNetworkModalType("offline")
          setShowNetworkModal(true)
        } else if (isNowOnline && wasOffline) {
          // Coming back online
          setNetworkModalType("online")
          setShowNetworkModal(true)
        }
      }

      // Auto sync when coming back online
      if (wasOffline && isNowOnline && status.pendingOrders > 0) {
        toast({
          title: "Kết nối trở lại",
          description: `Đang đồng bộ ${status.pendingOrders} đơn hàng offline...`,
          variant: "default",
        })

        // Retry logic for failed syncs
        const attemptSync = async () => {
          try {
            await offlineSyncService.forcSync()
            syncAttempts = 0 // Reset on success

            toast({
              title: "Đồng bộ thành công",
              description: "Tất cả đơn hàng offline đã được đồng bộ.",
              variant: "success",
            })
          } catch (error) {
            syncAttempts++
            console.error(`Sync attempt ${syncAttempts} failed:`, error)

            if (syncAttempts < maxRetryAttempts) {
              toast({
                title: "Đồng bộ thất bại",
                description: `Thử lại sau ${retryDelay / 1000}s... (${syncAttempts}/${maxRetryAttempts})`,
                variant: "warning",
              })

              retryTimeout = setTimeout(attemptSync, retryDelay)
            } else {
              toast({
                title: "Đồng bộ thất bại",
                description: "Không thể đồng bộ dữ liệu. Vui lòng thử lại thủ công.",
                variant: "destructive",
              })
              syncAttempts = 0 // Reset for next time
            }
          }
        }

        attemptSync()
      }
    }

    // Initialize sync service and set up listeners
    const initializeSync = async () => {
      try {
        if (typeof navigator !== "undefined" && navigator.onLine) {
          await offlineSyncService.forcSync()
        }

        setIsInitialized(true)
      } catch (error) {
        console.error("Failed to initialize sync service:", error)
        setIsInitialized(true) // Still mark as initialized to prevent blocking
      }
    }

    const unsubscribe = offlineSyncService.onStatusChange(handleStatusChange)
    initializeSync()

    // Periodic sync when online (every 5 minutes)
    const periodicSyncInterval = setInterval(
      async () => {
        if (syncStatus.isOnline && !syncStatus.syncInProgress && syncStatus.pendingOrders > 0) {
          try {
            await offlineSyncService.forcSync()
          } catch (error) {
            console.error("Periodic sync failed:", error)
          }
        }
      },
      5 * 60 * 1000,
    ) // 5 minutes

    // Cleanup
    return () => {
      unsubscribe()
      clearTimeout(retryTimeout)
      clearInterval(periodicSyncInterval)
    }
  }, [isMounted, syncStatus.isOnline, toast])

  const forcSync = async () => {
    try {
      await offlineSyncService.forcSync()
      toast({
        title: "Đồng bộ thành công",
        description: "Dữ liệu đã được đồng bộ.",
        variant: "success",
      })
    } catch (error) {
      console.error("Manual sync failed:", error)
      toast({
        title: "Đồng bộ thất bại",
        description: "Không thể đồng bộ dữ liệu. Vui lòng kiểm tra kết nối.",
        variant: "destructive",
      })
    }
  }

  const handleContinueSelling = () => {
    setShowNetworkModal(false)
  }

  const handleContinueOffline = () => {
    setShowNetworkModal(false)
  }

  const handleSwitchToOnline = () => {
    setShowNetworkModal(false)
    // Force sync when switching to online
    forcSync()
  }

  if (!isMounted) {
    return (
      <OfflineSyncContext.Provider
        value={{
          syncStatus,
          forcSync,
          isInitialized: false,
        }}
      >
        {children}
      </OfflineSyncContext.Provider>
    )
  }

  return (
    <OfflineSyncContext.Provider
      value={{
        syncStatus,
        forcSync,
        isInitialized,
      }}
    >
      {children}

      <NetworkStatusModal
        isOnline={syncStatus.isOnline}
        onContinueOffline={handleContinueOffline}
        onSwitchToOnline={handleSwitchToOnline}
        onContinueSelling={handleContinueSelling}
      />

      {/* Network Status Indicator - appears temporarily on connection changes */}
      {showNetworkStatus && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-5">
          <NetworkStatusIndicator compact />
        </div>
      )}

      {/* Persistent offline indicator */}
      {!syncStatus.isOnline && (
        <div className="fixed bottom-4 left-4 z-50">
          <NetworkStatusIndicator compact showDetails />
        </div>
      )}

      {/* Sync progress indicator */}
      {syncStatus.syncInProgress && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            <span className="text-sm">Đang đồng bộ dữ liệu...</span>
          </div>
        </div>
      )}
    </OfflineSyncContext.Provider>
  )
}

export default OfflineSyncProvider
