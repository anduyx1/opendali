"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, Plus, Phone, Mail, Edit, Trash } from "lucide-react" // Added Edit and Trash icons
import { getCustomersClient, deleteCustomerClient } from "@/lib/services/customers-client" // Added deleteCustomerClient
import type { Customer } from "@/lib/types/database"
import CustomerFormModal from "@/app/components/customer-form-modal" // Import the new modal
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog" // Import AlertDialog
import { useToast } from "@/hooks/use-toast" // Import useToast
import { formatCompactPrice, formatNumber } from "@/lib/utils" // Import formatCompactPrice and formatNumber

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false) // State for modal visibility
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null) // State for editing customer
  const { toast } = useToast()

  const loadCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const customerData = await getCustomersClient()
      setCustomers(customerData)
    } catch (error) {
      console.error("Error loading customers:", error)
      toast({
        title: "Lỗi tải dữ liệu",
        description: "Không thể tải danh sách khách hàng.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadCustomers()
  }, [loadCustomers]) // Added loadCustomers to dependency array

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (customer.phone && customer.phone.includes(searchTerm)),
  )

  const handleAddCustomerClick = () => {
    setEditingCustomer(null) // Clear any editing data
    setIsModalOpen(true)
  }

  const handleEditCustomerClick = (customer: Customer) => {
    setEditingCustomer(customer)
    setIsModalOpen(true)
  }

  const handleDeleteCustomer = async (customerId: number) => {
    setLoading(true)
    try {
      const success = await deleteCustomerClient(customerId)
      if (success) {
        toast({
          title: "Xóa khách hàng thành công",
          description: "Khách hàng đã được xóa khỏi hệ thống.",
        })
        loadCustomers() // Refresh the list
      } else {
        toast({
          title: "Lỗi",
          description: "Không thể xóa khách hàng. Vui lòng thử lại.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting customer:", error)
      toast({
        title: "Lỗi hệ thống",
        description: "Không thể kết nối đến máy chủ hoặc cơ sở dữ liệu.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    // Only show loading if no data is present yet
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Quản lý khách hàng</h1>
          <p className="text-muted-foreground">Đang tải dữ liệu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Quản lý khách hàng</h1>
          <p className="text-muted-foreground">Quản lý thông tin và lịch sử mua hàng của khách hàng</p>
        </div>
        <Button onClick={handleAddCustomerClick}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm khách hàng
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Danh sách khách hàng</CardTitle>
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Tìm kiếm khách hàng..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCustomers.length === 0 && !loading ? (
              <p className="col-span-full text-center text-muted-foreground">Không tìm thấy khách hàng nào.</p>
            ) : (
              filteredCustomers.map((customer) => (
                <Card key={customer.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback>
                          {customer.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-medium">{customer.name}</h3>
                        <Badge
                          variant={
                            customer.customer_type === "vip"
                              ? "default"
                              : customer.customer_type === "regular"
                                ? "secondary"
                                : "outline"
                          }
                          className="mt-1"
                        >
                          {customer.customer_type === "vip"
                            ? "VIP"
                            : customer.customer_type === "regular"
                              ? "Thường xuyên"
                              : "Khách mới"}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      {customer.email && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Mail className="mr-2 h-4 w-4" />
                          {customer.email}
                        </div>
                      )}
                      {customer.phone && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Phone className="mr-2 h-4 w-4" />
                          {customer.phone}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-blue-600">{formatNumber(customer.total_orders)}</p>
                        <p className="text-xs text-muted-foreground">Đơn hàng</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-green-600">{formatCompactPrice(customer.total_spent)}</p>
                        <p className="text-xs text-muted-foreground">Tổng chi tiêu</p>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <Button variant="outline" size="icon" onClick={() => handleEditCustomerClick(customer)}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Chỉnh sửa</span>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="icon">
                            <Trash className="h-4 w-4" />
                            <span className="sr-only">Xóa</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Hành động này không thể hoàn tác. Thao tác này sẽ xóa vĩnh viễn khách hàng {customer.name}{" "}
                              khỏi cơ sở dữ liệu.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteCustomer(customer.id)}>Xóa</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <CustomerFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadCustomers} // Refresh list after success
        initialData={editingCustomer}
      />
    </div>
  )
}
