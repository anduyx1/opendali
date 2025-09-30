import { Wifi, WifiOff, AlertTriangle, Clock } from "lucide-react"
import { useNetworkStatus } from "@/hooks/use-network-status"
import { cn } from "@/lib/utils"

interface NetworkStatusIndicatorProps {
  className?: string
  showDetails?: boolean
  compact?: boolean
}

export function NetworkStatusIndicator({
  className,
  showDetails = false,
  compact = false,
}: NetworkStatusIndicatorProps) {
  const networkStatus = useNetworkStatus()

  const getStatusColor = () => {
    if (!networkStatus.isOnline) return "text-red-500 bg-red-50"
    if (networkStatus.isSlowConnection) return "text-yellow-500 bg-yellow-50"
    return "text-green-500 bg-green-50"
  }

  const getStatusIcon = () => {
    if (!networkStatus.isOnline) return <WifiOff className="h-4 w-4" />
    if (networkStatus.isSlowConnection) return <AlertTriangle className="h-4 w-4" />
    return <Wifi className="h-4 w-4" />
  }

  const getStatusText = () => {
    if (!networkStatus.isOnline) return "Offline"
    if (networkStatus.isSlowConnection) return "Kết nối chậm"
    return "Online"
  }

  const formatTime = (date: Date | null) => {
    if (!date) return "Chưa xác định"
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
          getStatusColor(),
          className,
        )}
      >
        {getStatusIcon()}
        <span>{getStatusText()}</span>
      </div>
    )
  }

  return (
    <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg border", getStatusColor(), className)}>
      {getStatusIcon()}
      <div className="flex flex-col">
        <span className="text-sm font-medium">{getStatusText()}</span>
        {showDetails && (
          <div className="text-xs opacity-75">
            {networkStatus.connectionType !== "unknown" && (
              <span>Loại: {networkStatus.connectionType.toUpperCase()}</span>
            )}
            {networkStatus.lastOfflineTime && (
              <div className="flex items-center gap-1 mt-1">
                <Clock className="h-3 w-3" />
                <span>Offline lúc: {formatTime(networkStatus.lastOfflineTime)}</span>
              </div>
            )}
            {networkStatus.lastOnlineTime && !networkStatus.isOnline && (
              <div className="flex items-center gap-1 mt-1">
                <Clock className="h-3 w-3" />
                <span>Online lần cuối: {formatTime(networkStatus.lastOnlineTime)}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default NetworkStatusIndicator
