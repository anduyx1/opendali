"use client"

import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Calendar, Clock, MapPin, Monitor } from "lucide-react"
import type { UserWithRole } from "@/lib/types/database"
import type { AuditLogEntry } from "@/lib/security/audit-logger"

interface AuditLogsModalProps {
  isOpen: boolean
  onClose: () => void
  user: UserWithRole | null
}

export default function AuditLogsModal({ isOpen, onClose, user }: AuditLogsModalProps) {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(false)

  const fetchAuditLogs = useCallback(async () => {
    if (!user) return

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/audit-logs?userId=${user.id}&limit=50`)
      if (response.ok) {
        const logs = await response.json()
        setAuditLogs(logs)
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (isOpen && user) {
      fetchAuditLogs()
    }
  }, [isOpen, user, fetchAuditLogs])

  const getEventTypeLabel = (eventType: string) => {
    const labels: Record<string, string> = {
      user_login: "Đăng nhập",
      user_logout: "Đăng xuất",
      failed_login: "Đăng nhập thất bại",
      password_changed: "Đổi mật khẩu",
      account_locked: "Tài khoản bị khóa",
      permission_denied: "Từ chối quyền truy cập",
      data_export: "Xuất dữ liệu",
      settings_changed: "Thay đổi cài đặt",
    }
    return labels[eventType] || eventType
  }

  const getEventTypeBadge = (eventType: string) => {
    const variants: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
      user_login: "default",
      user_logout: "secondary",
      failed_login: "destructive",
      password_changed: "outline",
      account_locked: "destructive",
      permission_denied: "destructive",
    }
    return variants[eventType] || "secondary"
  }

  if (!user) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Nhật ký hoạt động - {user.full_name}</DialogTitle>
          <DialogDescription>Xem lịch sử hoạt động và các sự kiện bảo mật của nhân viên này.</DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[500px]">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center text-gray-500 py-8">Không có nhật ký hoạt động nào được tìm thấy.</div>
          ) : (
            <div className="space-y-4">
              {auditLogs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={getEventTypeBadge(log.eventType)}>{getEventTypeLabel(log.eventType)}</Badge>
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-1" />
                      {log.createdAt ? new Date(log.createdAt).toLocaleDateString("vi-VN") : ""}
                      <Clock className="h-4 w-4 ml-2 mr-1" />
                      {log.createdAt ? new Date(log.createdAt).toLocaleTimeString("vi-VN") : ""}
                    </div>
                  </div>

                  {log.ipAddress && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>IP: {log.ipAddress}</span>
                    </div>
                  )}

                  {log.userAgent && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Monitor className="h-4 w-4 mr-1" />
                      <span className="truncate">{log.userAgent}</span>
                    </div>
                  )}

                  {log.resource && (
                    <div className="text-sm">
                      <span className="font-medium">Tài nguyên: </span>
                      <span className="text-gray-600">{log.resource}</span>
                      {log.action && (
                        <>
                          <span className="mx-2">•</span>
                          <span className="text-gray-600">{log.action}</span>
                        </>
                      )}
                    </div>
                  )}

                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <div className="text-sm">
                      <span className="font-medium">Chi tiết: </span>
                      <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
