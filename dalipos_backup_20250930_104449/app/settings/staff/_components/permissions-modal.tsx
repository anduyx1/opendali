"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ShieldIcon, UserIcon, Crown } from "lucide-react"
import type { UserWithRole } from "@/lib/types/database"
import { getPermissionLabel } from "@/lib/utils/permissions"
import { PERMISSIONS } from "@/lib/constants/permissions"

interface PermissionsModalProps {
  isOpen: boolean
  onClose: () => void
  user: UserWithRole | null
}

export default function PermissionsModal({ isOpen, onClose, user }: PermissionsModalProps) {
  const [groupedPermissions, setGroupedPermissions] = useState<Record<string, string[]>>({})

  useEffect(() => {
    if (user?.role_permissions) {
      // Group permissions by category
      const grouped = user.role_permissions.reduce(
        (acc: Record<string, string[]>, permission: string) => {
          const category = permission.split(".")[0]
          if (!acc[category]) {
            acc[category] = []
          }
          acc[category].push(permission)
          return acc
        },
        {} as Record<string, string[]>,
      )
      setGroupedPermissions(grouped)
    }
  }, [user])

  if (!user) return null

  const getRoleIcon = () => {
    const isSuperAdmin = (user.role_permissions as any)?.includes(PERMISSIONS.SYSTEM_ADMIN)
    const isAdmin = (user.role_permissions as any)?.includes(PERMISSIONS.USERS_CREATE)

    if (isSuperAdmin) return <Crown className="h-5 w-5 text-purple-600" />
    if (isAdmin) return <ShieldIcon className="h-5 w-5 text-blue-600" />
    return <UserIcon className="h-5 w-5 text-gray-600" />
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      users: "Quản lý người dùng",
      roles: "Quản lý vai trò",
      products: "Quản lý sản phẩm",
      orders: "Quản lý đơn hàng",
      customers: "Quản lý khách hàng",
      inventory: "Quản lý kho hàng",
      reports: "Báo cáo",
      settings: "Cài đặt",
      pos: "Bán hàng POS",
      audit: "Nhật ký kiểm toán",
      system: "Quản trị hệ thống",
    }
    return labels[category] || category
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {getRoleIcon()}
            <span>Quyền hạn của {user.full_name}</span>
          </DialogTitle>
          <DialogDescription>Xem chi tiết các quyền hạn được cấp cho nhân viên này.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* User Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{user.full_name}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Vai trò</p>
                  <Badge className="mt-1">
                    {getRoleIcon()}
                    <span className="ml-1">{user.role_display_name}</span>
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">Tổng quyền hạn</p>
                  <p className="text-2xl font-bold text-blue-600">{user.role_permissions?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Permissions by Category */}
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {Object.entries(groupedPermissions).map(([category, permissions]) => (
                <Card key={category}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{getCategoryLabel(category)}</CardTitle>
                    <CardDescription>{permissions.length} quyền trong nhóm này</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-2">
                      {permissions.map((permission: any) => (
                        <div key={permission} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm font-medium">{getPermissionLabel(permission)}</span>
                          <Badge variant="outline" className="text-xs">
                            {permission}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
