"use client"

import React, { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { PencilIcon, Trash2Icon, ShieldIcon, UnlockIcon, EyeIcon } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useActionState } from "react"
import { deleteUserAction } from "@/lib/actions/users"
import { useToast } from "@/components/ui/use-toast"
import StaffFormModal from "./staff-form-modal"
import PermissionsModal from "./permissions-modal"
import AuditLogsModal from "./audit-logs-modal"
import type { UserWithRole, Role } from "@/lib/types/database"
import { PermissionButton } from "@/components/auth/permission-button"
import { PERMISSIONS } from "@/lib/constants/permissions"

interface UserWithLockStatus extends UserWithRole {
  locked_until?: string | null
}

interface StaffTableProps {
  users: UserWithRole[]
  roles: Role[]
}

export default function StaffTable({ users, roles }: StaffTableProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<UserWithRole | null>(null)
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)
  const [userToDeleteId, setUserToDeleteId] = useState<number | null>(null)
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false)
  const [isAuditLogsModalOpen, setIsAuditLogsModalOpen] = useState(false)
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState<UserWithRole | null>(null)
  const [selectedUserForAudit, setSelectedUserForAudit] = useState<UserWithRole | null>(null)

  const { toast } = useToast()
  const [deleteState, deleteAction, isDeleting] = useActionState(deleteUserAction, {
    success: false,
    message: "",
  } as any)

  React.useEffect(() => {
    if (deleteState.message) {
      toast({
        title: deleteState.success ? "Thành công!" : "Lỗi",
        description: deleteState.message,
        variant: deleteState.success ? "default" : "destructive",
      })
      if (deleteState.success) {
        setIsConfirmDeleteOpen(false)
        setUserToDeleteId(null)
      }
    }
  }, [deleteState, toast])

  const handleEdit = (user: UserWithRole) => {
    setCurrentUser(user)
    setIsModalOpen(true)
  }

  const handleDeleteClick = (id: number) => {
    setUserToDeleteId(id)
    setIsConfirmDeleteOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (userToDeleteId !== null) {
      await deleteAction()
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setCurrentUser(null)
  }

  const handleAddStaff = () => {
    setCurrentUser(null)
    setIsModalOpen(true)
  }

  const handleViewPermissions = (user: UserWithRole) => {
    setSelectedUserForPermissions(user)
    setIsPermissionsModalOpen(true)
  }

  const handleViewAuditLogs = (user: UserWithRole) => {
    setSelectedUserForAudit(user)
    setIsAuditLogsModalOpen(true)
  }

  const handleUnlockAccount = async (user: UserWithRole) => {
    try {
      const response = await fetch("/api/admin/unlock-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      })

      if (response.ok) {
        toast({
          title: "Thành công!",
          description: "Tài khoản đã được mở khóa.",
        })
        // Refresh the page or update the user list
        window.location.reload()
      } else {
        throw new Error("Failed to unlock account")
      }
    } catch {
      toast({
        title: "Lỗi",
        description: "Không thể mở khóa tài khoản.",
        variant: "destructive",
      })
    }
  }

  const getAccountStatusBadge = (user: UserWithRole) => {
    if (!user.is_active) {
      return <Badge variant="destructive">Vô hiệu hóa</Badge>
    }

    const userWithLock = user as UserWithLockStatus
    const isLocked = userWithLock.locked_until && new Date(userWithLock.locked_until) > new Date()
    if (isLocked) {
      return <Badge variant="destructive">Bị khóa</Badge>
    }

    return <Badge variant="default">Hoạt động</Badge>
  }

  const getRoleBadge = (user: UserWithRole) => {
    const isSuperAdmin = user.role_permissions?.includes(PERMISSIONS.SYSTEM_ADMIN)
    const isAdmin = user.role_permissions?.includes(PERMISSIONS.USERS_CREATE)

    if (isSuperAdmin) {
      return <Badge className="bg-purple-100 text-purple-800 border-purple-200">{user.role_display_name}</Badge>
    }
    if (isAdmin) {
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">{user.role_display_name}</Badge>
    }
    return <Badge variant="secondary">{user.role_display_name}</Badge>
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-600">Tổng cộng: {users.length} nhân viên</div>
        <PermissionButton permission={PERMISSIONS.USERS_CREATE} onClick={handleAddStaff}>
          Thêm nhân viên mới
        </PermissionButton>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên đầy đủ</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Vai trò</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Đăng nhập cuối</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Không có nhân viên nào.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      <span>{user.full_name}</span>
                      {user.role_permissions?.includes(PERMISSIONS.SYSTEM_ADMIN) && (
                        <ShieldIcon className="h-4 w-4 text-purple-600" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{getRoleBadge(user)}</TableCell>
                  <TableCell>{getAccountStatusBadge(user)}</TableCell>
                  <TableCell>
                    {user.last_login ? new Date(user.last_login).toLocaleDateString("vi-VN") : "Chưa đăng nhập"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-1">
                      <PermissionButton
                        permission={PERMISSIONS.USERS_VIEW}
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewPermissions(user)}
                        disableTooltip="Xem quyền hạn"
                      >
                        <ShieldIcon className="h-4 w-4" />
                      </PermissionButton>

                      <PermissionButton
                        permission={PERMISSIONS.AUDIT_LOGS}
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewAuditLogs(user)}
                        disableTooltip="Xem nhật ký hoạt động"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </PermissionButton>

                      <PermissionButton
                        permission={PERMISSIONS.USERS_EDIT}
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(user)}
                        disableTooltip="Chỉnh sửa nhân viên"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </PermissionButton>

                      {(user as UserWithLockStatus).locked_until &&
                        new Date((user as UserWithLockStatus).locked_until!) > new Date() && (
                          <PermissionButton
                            permission={PERMISSIONS.USERS_EDIT}
                            variant="ghost"
                            size="icon"
                            onClick={() => handleUnlockAccount(user)}
                            disableTooltip="Mở khóa tài khoản"
                          >
                            <UnlockIcon className="h-4 w-4 text-green-600" />
                          </PermissionButton>
                        )}

                      <PermissionButton
                        permission={PERMISSIONS.USERS_DELETE}
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(user.id)}
                        disableTooltip="Xóa nhân viên"
                      >
                        <Trash2Icon className="h-4 w-4 text-red-500" />
                      </PermissionButton>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <StaffFormModal isOpen={isModalOpen} onClose={handleCloseModal} currentUser={currentUser} roles={roles} />

      <PermissionsModal
        isOpen={isPermissionsModalOpen}
        onClose={() => setIsPermissionsModalOpen(false)}
        user={selectedUserForPermissions}
      />

      <AuditLogsModal
        isOpen={isAuditLogsModalOpen}
        onClose={() => setIsAuditLogsModalOpen(false)}
        user={selectedUserForAudit}
      />

      <AlertDialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Thao tác này sẽ vĩnh viễn xóa nhân viên này khỏi cơ sở dữ liệu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting}>
              {isDeleting ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
