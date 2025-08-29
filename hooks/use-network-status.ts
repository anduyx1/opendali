"use client"

/**
 * Network Status Hook
 * Theo dõi trạng thái kết nối mạng và cung cấp thông tin chi tiết
 */

import { useState, useEffect, useCallback } from "react"

interface NetworkStatus {
  isOnline: boolean
  isSlowConnection: boolean
  connectionType: string
  lastOnlineTime: Date | null
  lastOfflineTime: Date | null
  isCheckingConnection: boolean
  lastPingTime: Date | null
  pingLatency: number | null
  retryCount: number
  maxRetries: number
}

export function useNetworkStatus(): NetworkStatus {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    isSlowConnection: false,
    connectionType: "unknown",
    lastOnlineTime: null,
    lastOfflineTime: null,
    isCheckingConnection: false,
    lastPingTime: null,
    pingLatency: null,
    retryCount: 0,
    maxRetries: 3,
  })

  const checkServerConnection = useCallback(
    async (retryAttempt = 0): Promise<boolean> => {
      if (!navigator.onLine) {
        return false
      }

      setNetworkStatus((prev) => ({
        ...prev,
        isCheckingConnection: true,
        retryCount: retryAttempt,
      }))

      try {
        const startTime = Date.now()

        const timeoutMs = Math.min(5000 + retryAttempt * 2000, 15000)
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

        const response = await fetch("/api/health", {
          method: "HEAD",
          signal: controller.signal,
          cache: "no-cache",
          headers: {
            "Cache-Control": "no-cache",
          },
        })

        clearTimeout(timeoutId)
        const endTime = Date.now()
        const latency = endTime - startTime

        const isConnected = response.ok
        const now = new Date()

        setNetworkStatus((prev) => ({
          ...prev,
          isCheckingConnection: false,
          lastPingTime: now,
          pingLatency: latency,
          isOnline: isConnected,
          retryCount: isConnected ? 0 : prev.retryCount,
          lastOnlineTime: isConnected && !prev.isOnline ? now : prev.lastOnlineTime,
          lastOfflineTime: !isConnected && prev.isOnline ? now : prev.lastOfflineTime,
        }))

        if (!isConnected && retryAttempt < networkStatus.maxRetries) {
          const retryDelay = Math.min(1000 * Math.pow(2, retryAttempt), 10000) // Exponential backoff, max 10s
          setTimeout(() => {
            checkServerConnection(retryAttempt + 1)
          }, retryDelay)
        }

        return isConnected
      } catch (error) {
        const now = new Date()
        const isAbortError = error instanceof Error && error.name === "AbortError"

        setNetworkStatus((prev) => ({
          ...prev,
          isCheckingConnection: false,
          lastPingTime: now,
          pingLatency: null,
          isOnline: false,
          lastOfflineTime: prev.isOnline ? now : prev.lastOfflineTime,
        }))

        if (retryAttempt < networkStatus.maxRetries && !isAbortError) {
          const retryDelay = Math.min(1000 * Math.pow(2, retryAttempt), 10000)
          setTimeout(() => {
            checkServerConnection(retryAttempt + 1)
          }, retryDelay)
        }

        return false
      }
    },
    [networkStatus.maxRetries],
  )

  const updateNetworkStatus = useCallback(() => {
    const isOnline = navigator.onLine
    const now = new Date()

    setNetworkStatus((prev) => ({
      ...prev,
      isOnline,
      retryCount: 0, // Reset retry count on network change
      lastOnlineTime: isOnline && !prev.isOnline ? now : prev.lastOnlineTime,
      lastOfflineTime: !isOnline && prev.isOnline ? now : prev.lastOfflineTime,
    }))

    if (isOnline) {
      checkServerConnection(0)
    }
  }, [checkServerConnection])

  useEffect(() => {
    const updateConnectionInfo = () => {
      if ("connection" in navigator) {
        const connection = (navigator as any).connection
        setNetworkStatus((prev) => ({
          ...prev,
          connectionType: connection.effectiveType || "unknown",
          isSlowConnection: connection.effectiveType === "slow-2g" || connection.effectiveType === "2g",
        }))
      }
    }

    // Initial setup
    updateNetworkStatus()
    updateConnectionInfo()

    if (navigator.onLine) {
      checkServerConnection(0)
    }

    // Event listeners
    window.addEventListener("online", updateNetworkStatus)
    window.addEventListener("offline", updateNetworkStatus)

    // Connection change listener (if supported)
    if ("connection" in navigator) {
      const connection = (navigator as any).connection
      connection.addEventListener("change", updateConnectionInfo)
    }

    const handleVisibilityChange = () => {
      if (!document.hidden && navigator.onLine) {
        // Check ngay khi tab active trở lại
        checkServerConnection(0)
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    // Cleanup
    return () => {
      window.removeEventListener("online", updateNetworkStatus)
      window.removeEventListener("offline", updateNetworkStatus)
      document.removeEventListener("visibilitychange", handleVisibilityChange)

      if ("connection" in navigator) {
        const connection = (navigator as any).connection
        connection.removeEventListener("change", updateConnectionInfo)
      }
    }
  }, [updateNetworkStatus, checkServerConnection])

  return networkStatus
}
