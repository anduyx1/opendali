"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createCustomerClient, updateCustomerClient } from "@/lib/services/customers-client"
import type { Customer } from "@/lib/types/database"
import { useToast } from "@/hooks/use-toast"
import { AlertCircle } from "lucide-react" // Import icon

interface CustomerFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (customer?: Customer) => void
  initialData?: Customer | null // Dữ liệu cho chỉnh sửa
  defaultName?: string // Tên mặc định cho tạo mới
}

function CustomerFormModal({ isOpen, onClose, onSuccess, initialData, defaultName }: CustomerFormModalProps) {
  const [name, setName] = useState(initialData?.name || defaultName || "")
  const [email, setEmail] = useState(initialData?.email || "")
  const [phone, setPhone] = useState(initialData?.phone || "")
  const [address, setAddress] = useState(initialData?.address || "")
  const [customerType, setCustomerType] = useState(initialData?.customer_type || "new")
  const [loading, setLoading] = useState(false)
  const [formErrors, setFormErrors] = useState<{
    name?: string | null
    email?: string | null
    phone?: string | null
  }>({})
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      if (initialData) {
        setName(initialData.name)
        setEmail(initialData.email || "")
        setPhone(initialData.phone || "")
        setAddress(initialData.address || "")
        setCustomerType(initialData.customer_type || "new")
      } else {
        setName(defaultName || "") // Use defaultName for new customer
        setEmail("")
        setPhone("")
        setAddress("")
        setCustomerType("new")
      }
      setFormErrors({}) // Clear errors when modal opens
    }
  }, [initialData, defaultName, isOpen]) // Depend on defaultName and isOpen

  const validateForm = () => {
    const errors: typeof formErrors = {}
    let isValid = true

    if (!name || name.trim() === "") {
      errors.name = "Tên khách hàng không được để trống."
      isValid = false
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Email không hợp lệ."
      isValid = false
    }

    if (phone && !/^\d+$/.test(phone)) {
      errors.phone = "Số điện thoại chỉ được chứa chữ số."
      isValid = false
    }

    setFormErrors(errors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setFormErrors({}) // Clear previous errors

    if (!validateForm()) {
      setLoading(false)
      return
    }

    const customerData = {
      name,
      email: email || null,
      phone: phone || null,
      address: address || null,
      customer_type: customerType as "new" | "regular" | "vip",
    }

    try {
      let result: Customer | null
      if (initialData && initialData.id) {
        // Check for initialData AND its id for update
        result = await updateCustomerClient(initialData.id, customerData)
        if (result) {
          toast({
            title: "Cập nhật khách hàng thành công",
            description: `Khách hàng ${result.name} đã được cập nhật.`,
          })
        }
      } else {
        // Otherwise, it's a new creation
        result = await createCustomerClient({
          ...customerData,
          date_of_birth: null,
          total_orders: 0,
          total_spent: 0
        })
        if (result) {
          toast({
            title: "Thêm khách hàng thành công",
            description: `Khách hàng ${result.name} đã được thêm vào hệ thống.`,
          })
        }
      }

      if (result) {
        onSuccess()
        onClose()
      } else {
        toast({
          title: "Lỗi",
          description: "Có lỗi xảy ra khi lưu khách hàng. Vui lòng thử lại.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error saving customer:", error)
      toast({
        title: "Lỗi hệ thống",
        description: "Không thể kết nối đến máy chủ hoặc cơ sở dữ liệu.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Chỉnh sửa khách hàng" : "Thêm khách hàng mới"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Tên khách hàng
            </Label>
            <div className="col-span-3">
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              {formErrors.name && (
                <p className="text-sm font-medium text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {formErrors.name}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <div className="col-span-3">
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              {formErrors.email && (
                <p className="text-sm font-medium text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {formErrors.email}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right">
              Số điện thoại
            </Label>
            <div className="col-span-3">
              <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              {formErrors.phone && (
                <p className="text-sm font-medium text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {formErrors.phone}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="address" className="text-right">
              Địa chỉ
            </Label>
            <Textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="customerType" className="text-right">
              Loại khách hàng
            </Label>
            <Select value={customerType} onValueChange={(value: "new" | "regular" | "vip") => setCustomerType(value)}>
              <SelectTrigger id="customerType" className="col-span-3">
                <SelectValue placeholder="Chọn loại khách hàng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">Khách mới</SelectItem>
                <SelectItem value="regular">Thường xuyên</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Đang lưu..." : initialData ? "Lưu thay đổi" : "Thêm khách hàng"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { CustomerFormModal }
export default CustomerFormModal
