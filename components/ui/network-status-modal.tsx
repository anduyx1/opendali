"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Wifi, WifiOff } from "lucide-react"

interface NetworkStatusModalProps {
  isOnline: boolean
  onContinueOffline?: () => void
  onSwitchToOnline?: () => void
  onContinueSelling?: () => void
}

export function NetworkStatusModal({
  isOnline,
  onContinueOffline,
  onSwitchToOnline,
  onContinueSelling,
}: NetworkStatusModalProps) {
  const [showOfflineModal, setShowOfflineModal] = useState(false)
  const [showOnlineModal, setShowOnlineModal] = useState(false)
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    if (!isOnline && !wasOffline) {
      // Chuyển từ online sang offline
      setShowOfflineModal(true)
      setWasOffline(true)
    } else if (isOnline && wasOffline) {
      // Chuyển từ offline sang online
      setShowOfflineModal(false)
      setShowOnlineModal(true)
    }
  }, [isOnline, wasOffline])

  const handleContinueSelling = () => {
    setShowOfflineModal(false)
    onContinueSelling?.()
  }

  const handleContinueOffline = () => {
    setShowOnlineModal(false)
    onContinueOffline?.()
  }

  const handleSwitchToOnline = () => {
    setShowOnlineModal(false)
    setWasOffline(false)
    onSwitchToOnline?.()
  }

  return (
    <>
      {/* Modal mất kết nối internet */}
      <Dialog open={showOfflineModal} onOpenChange={setShowOfflineModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <WifiOff className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle className="text-lg font-semibold">Mất kết nối internet</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
              Kết nối internet đang bị gián đoạn, Sapo đang chuyển sang chế độ Offline, mọi thông tin trong quá trình
              giao dịch sẽ được lưu lại và đồng bộ tự động lên phần mềm khi có kết nối trở lại.
            </DialogDescription>
          </DialogHeader>
          <div className="text-center space-y-4">
            <Button onClick={handleContinueSelling} className="w-full bg-blue-600 hover:bg-blue-700">
              Tiếp tục bán hàng
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal kết nối internet đã sẵn sàng */}
      <Dialog open={showOnlineModal} onOpenChange={setShowOnlineModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Wifi className="h-6 w-6 text-green-600" />
            </div>
            <DialogTitle className="text-lg font-semibold">Kết nối internet đã sẵn sàng</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Đã có kết nối internet! Bạn có muốn chuyển sang chế độ bán hàng Online không?
            </DialogDescription>
          </DialogHeader>
          <div className="text-center space-y-4">
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleContinueOffline} className="flex-1 bg-transparent">
                Tiếp tục bán Offline
              </Button>
              <Button onClick={handleSwitchToOnline} className="flex-1 bg-blue-600 hover:bg-blue-700">
                Bán Online
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default NetworkStatusModal
