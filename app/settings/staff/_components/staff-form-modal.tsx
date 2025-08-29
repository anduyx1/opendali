"use client"

import { useEffect, useState } from "react"
import { useActionState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, Eye, EyeOff, RefreshCw } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { createUserAction, updateUserAction } from "@/lib/actions/users"
import { useToast } from "@/components/ui/use-toast"
import type { UserWithRole, Role } from "@/lib/types/database"
import { validatePassword, generateSecurePassword } from "@/lib/security/password-policy"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useNetworkStatus } from "@/hooks/use-network-status"

interface PasswordValidation {
  isValid: boolean
  strength: string
  errors: string[]
}

interface StaffFormModalProps {
  isOpen: boolean
  onClose: () => void
  currentUser: UserWithRole | null
  roles: Role[]
}

export default function StaffFormModal({ isOpen, onClose, currentUser, roles }: StaffFormModalProps) {
  const { toast } = useToast()
  const { isOnline } = useNetworkStatus()

  const [state, formAction, isPending] = useActionState(currentUser ? updateUserAction : createUserAction, {
    success: false,
    message: "",
  } as any)
  const [isActive, setIsActive] = useState(currentUser?.is_active ?? true)
  const [selectedRoleId, setSelectedRoleId] = useState<string>(currentUser?.role_id?.toString() || "")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidation | null>(null)
  const [mustChangePassword, setMustChangePassword] = useState<boolean | undefined>(false)

  useEffect(() => {
    if (currentUser) {
      setIsActive(currentUser.is_active)
      setSelectedRoleId(currentUser.role_id.toString())
      setMustChangePassword(false)
    } else {
      setIsActive(true)
      setSelectedRoleId("")
      setMustChangePassword(true) // New users must change password on first login
    }
    setPassword("")
    setPasswordValidation(null)
  }, [currentUser, isOpen])

  useEffect(() => {
    if (state.message) {
      toast({
        title: state.success ? "Thành công!" : "Lỗi",
        description: state.message,
        variant: state.success ? "default" : "destructive",
      })
      if (state.success) {
        onClose()
      }
    }
  }, [state, toast, onClose])

  useEffect(() => {
    if (password) {
      const validation = validatePassword(password)
      setPasswordValidation(validation)
    } else {
      setPasswordValidation(null)
    }
  }, [password])

  const handleOpenChange = (open: boolean) => {
    if (!open && !isPending) {
      onClose()
    }
  }

  const handleRoleChange = (value: string) => {
    setSelectedRoleId(value)
  }



  const handleGeneratePassword = () => {
    const newPassword = generateSecurePassword(12)
    setPassword(newPassword)
    setShowPassword(true)
    toast({
      title: "Mật khẩu đã được tạo",
      description: "Mật khẩu mạnh đã được tạo tự động. Hãy sao chép và gửi cho nhân viên.",
    })
  }

  const getPasswordStrengthColor = (strength: string) => {
    switch (strength) {
      case "weak":
        return "text-red-600"
      case "medium":
        return "text-yellow-600"
      case "strong":
        return "text-blue-600"
      case "very-strong":
        return "text-green-600"
      default:
        return "text-gray-600"
    }
  }

  const getPasswordStrengthText = (strength: string) => {
    switch (strength) {
      case "weak":
        return "Yếu"
      case "medium":
        return "Trung bình"
      case "strong":
        return "Mạnh"
      case "very-strong":
        return "Rất mạnh"
      default:
        return ""
    }
  }

  const title = currentUser ? "Chỉnh sửa nhân viên" : "Thêm nhân viên mới"
  const description = currentUser
    ? "Cập nhật thông tin chi tiết của nhân viên này."
    : "Thêm một tài khoản nhân viên mới vào hệ thống."

  const handleFormSubmit = async (formData: FormData) => {
    if (!isOnline) {
      toast({
        title: "Không có kết nối mạng",
        description: "Vui lòng kiểm tra kết nối internet để thực hiện thao tác này.",
        variant: "destructive",
      })
      return
    }

    // Call the original form action
    await formAction()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form action={handleFormSubmit}>
          {currentUser && <Input type="hidden" name="id" value={currentUser.id} />}
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="full_name" className="text-right">
                Tên đầy đủ
              </Label>
              <Input
                id="full_name"
                name="full_name"
                defaultValue={currentUser?.full_name || ""}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={currentUser?.email || ""}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Mật khẩu
              </Label>
              <div className="col-span-3 space-y-2">
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={currentUser ? "Để trống nếu không thay đổi" : "Nhập mật khẩu"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required={!currentUser}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Button type="button" variant="outline" size="icon" onClick={handleGeneratePassword}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                {passwordValidation && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Độ mạnh:</span>
                      <span className={getPasswordStrengthColor(passwordValidation.strength)}>
                        {getPasswordStrengthText(passwordValidation.strength)}
                      </span>
                    </div>
                    {!passwordValidation.isValid && (
                      <Alert>
                        <AlertDescription>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            {passwordValidation.errors.map((error: string, index: number) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Điện thoại
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={currentUser?.phone ?? ""}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role_id" className="text-right">
                Vai trò
              </Label>
              <Select name="role_id" value={selectedRoleId} onValueChange={handleRoleChange}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Chọn vai trò" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      <div className="flex items-center justify-between w-full">
                        <span>{role.display_name}</span>
                        <span className="text-xs text-gray-500 ml-2">{role.permissions?.length || 0} quyền</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="is_active" className="text-right">
                Trạng thái
              </Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Switch id="is_active" checked={isActive} onCheckedChange={setIsActive} />
                <Label htmlFor="is_active" className="text-sm">
                  {isActive ? "Hoạt động" : "Vô hiệu hóa"}
                </Label>
                <input type="hidden" name="is_active" value={isActive ? "true" : "false"} />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="must_change_password" className="text-right">
                Bắt buộc đổi MK
              </Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Checkbox
                  id="must_change_password"
                  checked={mustChangePassword}
                  onCheckedChange={(checked: any) => {
                    // @ts-ignore - Ignore CheckedState type mismatch
                    setMustChangePassword(checked === true as any)
                  }}
                />
                <Label htmlFor="must_change_password" className="text-sm">
                  Yêu cầu đổi mật khẩu khi đăng nhập lần đầu
                </Label>
                <input type="hidden" name="must_change_password" value={mustChangePassword ? "true" : "false"} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={isPending || !isOnline || (password && passwordValidation && !passwordValidation.isValid)}
            >
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Lưu thay đổi"}
              {!isOnline && <span className="ml-2 text-xs">(Offline)</span>}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
