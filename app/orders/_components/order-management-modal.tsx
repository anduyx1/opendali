"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Order } from "@/lib/types/database"
import { formatCurrency, getOrderStatusBadge } from "@/lib/utils"
import { getOrderDetails, type OrderDetails } from "@/lib/actions/orders"
import { useEffect, useState } from "react"
import { useToast } from "@/components/ui/use-toast"

type OrderManagementModalProps = {
  isOpen: boolean
  onClose: () => void
  order: Order
}

export function OrderManagementModal({ isOpen, onClose, order }: OrderManagementModalProps) {
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen) {
      const fetchDetails = async () => {
        setLoading(true)
        const result = await getOrderDetails(order.id)
        if (result) {
          setOrderDetails(result)
        } else {
          toast({
            title: "Lỗi tải chi tiết đơn hàng",
            description: "Không thể tải chi tiết đơn hàng.",
            variant: "destructive",
          })
          onClose()
        }
        setLoading(false)
      }
      fetchDetails()
    }
  }, [isOpen, order.id, onClose, toast])

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đang tải chi tiết đơn hàng...</DialogTitle>
          </DialogHeader>
          <p>Vui lòng chờ.</p>
        </DialogContent>
      </Dialog>
    )
  }

  if (!orderDetails) {
    return null // Should not happen if loading is handled
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Chi tiết đơn hàng #{orderDetails.id}</DialogTitle>
          <DialogDescription>Thông tin chi tiết về đơn hàng và các mặt hàng đã mua.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-sm font-medium">Khách hàng:</p>
              <p>{orderDetails.customer_name || "Khách vãng lai"}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Ngày đặt hàng:</p>
              <p>{new Date(orderDetails.order_date).toLocaleString("vi-VN")}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Tổng cộng:</p>
              <p className="font-semibold">{formatCurrency(orderDetails.total_amount)}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Trạng thái:</p>
              {getOrderStatusBadge(orderDetails.status)}
            </div>
            <div>
              <p className="text-sm font-medium">Phương thức thanh toán:</p>
              <p>
                {orderDetails.payment_type === "cash"
                  ? "Tiền mặt"
                  : orderDetails.payment_type === "card"
                    ? "Thẻ"
                    : orderDetails.payment_type === "transfer"
                      ? "Chuyển khoản"
                      : "N/A"}
              </p>
            </div>
            {orderDetails.notes && (
              <div className="col-span-2">
                <p className="text-sm font-medium">Ghi chú:</p>
                <p>{orderDetails.notes}</p>
              </div>
            )}
          </div>

          <h3 className="text-lg font-semibold mt-4">Các mặt hàng</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sản phẩm</TableHead>
                <TableHead className="text-right">Số lượng</TableHead>
                <TableHead className="text-right">Giá</TableHead>
                <TableHead className="text-right">Tổng</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderDetails.items?.map((item) => (
                <TableRow key={item.product_id}>
                  <TableCell>{item.product_name}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.total_price)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  )
}
