"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { formatPrice } from "@/lib/utils"
import { getOrders, getOrderById, processReturnAndRefund } from "@/lib/services/orders"
import type { Order } from "@/lib/types/database"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Search, ArrowLeft } from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"

interface OrderManagementModalProps {
  isOpen: boolean
  onClose: () => void
}

type View = "list" | "details"

interface ItemToReturnForm {
  orderItemId: number // ID of the order_item record
  productId: number
  productName: string
  quantity: number
  maxQuantity: number
  unitPrice: number
  reason: string
}

export default function OrderManagementModal({ isOpen, onClose }: OrderManagementModalProps) {
  const { toast } = useToast()
  const [view, setView] = useState<View>("list")
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [itemsToReturn, setItemsToReturn] = useState<ItemToReturnForm[]>([])
  const [refundMethod, setRefundMethod] = useState("cash")
  const [processingReturn, setProcessingReturn] = useState(false)

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10 // Number of orders per page

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const fetchedOrders = await getOrders()
      setOrders(fetchedOrders)
      setCurrentPage(1) // Reset to first page when orders are re-fetched
    } catch (error) {
      console.error("Failed to fetch orders:", error)
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách đơn hàng.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (isOpen) {
      fetchOrders()
      setView("list") // Always start with the list view when opening
    }
  }, [isOpen, fetchOrders])

  const filteredOrders = useMemo(() => {
    if (!searchTerm) {
      return orders
    }
    return orders.filter(
      (order) =>
        order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.customer as any)?.phone?.includes(searchTerm),
    )
  }, [orders, searchTerm])

  // Calculate paginated orders
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredOrders.slice(startIndex, endIndex)
  }, [filteredOrders, currentPage, itemsPerPage])

  const totalPages = useMemo(() => {
    return Math.ceil(filteredOrders.length / itemsPerPage)
  }, [filteredOrders, itemsPerPage])

  const handleViewDetails = async (orderId: number) => {
    setLoading(true)
    try {
      const orderDetails = await getOrderById(orderId)
      if (orderDetails) {
        setSelectedOrder(orderDetails)
        // Initialize itemsToReturn for the form
        setItemsToReturn(
          (orderDetails.order_items as any)?.map((item: any) => ({
            orderItemId: item.id,
            productId: item.product_id,
            productName: item.product_name,
            quantity: 0, // Default to 0 for return
            maxQuantity: item.quantity - (item.returned_quantity || 0), // Max quantity that can be returned
            unitPrice: item.unit_price,
            reason: "",
          })) || [],
        )
        setView("details")
      } else {
        toast({
          title: "Lỗi",
          description: "Không tìm thấy chi tiết đơn hàng.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to fetch order details:", error)
      toast({
        title: "Lỗi",
        description: "Không thể tải chi tiết đơn hàng.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleQuantityChange = (orderItemId: number, value: string) => {
    setItemsToReturn((prev) =>
      prev.map((item) => {
        if (item.orderItemId === orderItemId) {
          const newQuantity = Math.max(0, Math.min(item.maxQuantity, Number(value) || 0))
          return { ...item, quantity: newQuantity }
        }
        return item
      }),
    )
  }

  const handleReasonChange = (orderItemId: number, value: string) => {
    setItemsToReturn((prev) =>
      prev.map((item) => (item.orderItemId === orderItemId ? { ...item, reason: value } : item)),
    )
  }

  const totalRefundAmount = useMemo(() => {
    return itemsToReturn.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  }, [itemsToReturn])

  const handleProcessReturn = async () => {
    if (!selectedOrder) return

    const itemsToProcess = itemsToReturn.filter((item) => item.quantity > 0)

    if (itemsToProcess.length === 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập số lượng sản phẩm muốn hoàn trả.",
        variant: "warning",
      })
      return
    }

    const hasInvalidQuantity = itemsToProcess.some((item) => item.quantity > item.maxQuantity)
    if (hasInvalidQuantity) {
      toast({
        title: "Lỗi",
        description: "Số lượng hoàn trả vượt quá số lượng có thể hoàn.",
        variant: "warning",
      })
      return
    }

    const hasMissingReason = itemsToProcess.some((item) => !item.reason.trim())
    if (hasMissingReason) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập lý do hoàn trả cho các sản phẩm được chọn.",
        variant: "warning",
      })
      return
    }

    setProcessingReturn(true)
    try {
      const result = await processReturnAndRefund(
        selectedOrder.id,
        itemsToProcess.map((item) => ({
          orderItemId: item.orderItemId,
          productId: item.productId,
          quantity: item.quantity,
          reason: item.reason,
          unitPrice: item.unitPrice,
        })),
        refundMethod,
      )

      if (result.success) {
        toast({
          title: "Thành công",
          description: result.message,
          variant: "success",
        })
        // Refresh the order list and go back to list view
        await fetchOrders()
        setView("list")
        setSelectedOrder(null)
      } else {
        toast({
          title: "Lỗi",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error during return process:", error)
      toast({
        title: "Lỗi",
        description: "Đã xảy ra lỗi khi xử lý hoàn trả. Vui lòng thử lại.",
        variant: "destructive",
      })
    } finally {
      setProcessingReturn(false)
    }
  }

  const getOrderStatusBadge = (status: string) => {
    let colorClass = "bg-gray-200 text-gray-800"
    let displayStatus = status.replace(/_/g, " ").toUpperCase() // Default to uppercase with spaces

    switch (status) {
      case "completed":
        colorClass = "bg-green-100 text-green-800"
        displayStatus = "Đã hoàn thành"
        break
      case "pending":
        colorClass = "bg-yellow-100 text-yellow-800"
        displayStatus = "Đang chờ"
        break
      case "cancelled":
        colorClass = "bg-red-100 text-red-800"
        displayStatus = "Đã hủy"
        break
      case "returned":
        colorClass = "bg-blue-100 text-blue-800"
        displayStatus = "Đã hoàn trả"
        break
      case "partially_returned":
        colorClass = "bg-purple-100 text-purple-800"
        displayStatus = "Hoàn trả một phần"
        break
      case "refunded":
        colorClass = "bg-indigo-100 text-indigo-800"
        displayStatus = "Đã hoàn tiền"
        break
      case "partially_refunded":
        colorClass = "bg-pink-100 text-pink-800"
        displayStatus = "Hoàn tiền một phần"
        break
    }
    return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>{displayStatus}</span>
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {view === "details" && (
              <Button variant="ghost" size="icon" onClick={() => setView("list")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            {view === "list" ? "Quản lý Đơn hàng" : `Chi tiết Đơn hàng #${selectedOrder?.order_number}`}
          </DialogTitle>
          <DialogDescription>
            {view === "list"
              ? "Xem danh sách các đơn hàng đã tạo."
              : "Xem chi tiết đơn hàng và thực hiện hoàn hàng/hoàn tiền."}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="ml-2 text-gray-600">Đang tải dữ liệu...</p>
          </div>
        ) : (
          <>
            {view === "list" && (
              <div className="flex flex-col flex-1">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Tìm kiếm theo mã đơn hàng, tên/SĐT khách hàng..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      setCurrentPage(1) // Reset to first page on search
                    }}
                  />
                </div>
                <ScrollArea className="flex-1 pr-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mã ĐH</TableHead>
                        <TableHead>Khách hàng</TableHead>
                        <TableHead>Tổng tiền</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Ngày tạo</TableHead>
                        <TableHead className="text-right">Hành động</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedOrders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                            Không tìm thấy đơn hàng nào.
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedOrders.map((order) => (
                          <TableRow key={order.id}>
                                                          <TableCell className="font-medium">
                                {order.order_number}
                              </TableCell>
                            <TableCell>{order.customer?.name || "Khách lẻ"}</TableCell>
                            <TableCell>{formatPrice(order.total_amount)}</TableCell>
                            <TableCell>{getOrderStatusBadge(order.order_status)}</TableCell>
                            <TableCell>
                              {new Date(order.created_at).toLocaleString("vi-VN", {
                                timeZone: "Asia/Ho_Chi_Minh",
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="outline" size="sm" onClick={() => handleViewDetails(order.id)}>
                                Chi tiết
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>

                {totalPages > 1 && (
                  <Pagination className="mt-4">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            setCurrentPage((prev) => Math.max(1, prev - 1))
                          }}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : undefined}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault()
                              setCurrentPage(page)
                            }}
                            isActive={page === currentPage}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                          }}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : undefined}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </div>
            )}

            {view === "details" && selectedOrder && (
              <div className="flex flex-col flex-1 overflow-hidden">
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <p>
                      <strong>Khách hàng:</strong> {selectedOrder.customer?.name || "Khách lẻ"}
                    </p>
                    <p>
                      <strong>SĐT:</strong> {(selectedOrder.customer as any)?.phone || "N/A"}
                    </p>
                    <p>
                      <strong>Email:</strong> {selectedOrder.customer?.email || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p>
                      <strong>Tổng tiền:</strong> {formatPrice(selectedOrder.total_amount)}
                    </p>
                    <p>
                      <strong>Đã hoàn:</strong> {formatPrice(selectedOrder.refund_amount || 0)}
                    </p>
                    <p>
                      <strong>Trạng thái đơn:</strong> {getOrderStatusBadge(selectedOrder.order_status)}
                    </p>
                    <p>
                      <strong>PTTT:</strong> {selectedOrder.payment_method}
                    </p>
                                          <p>
                        <strong>Ngày tạo:</strong>{" "}
                        {new Date(selectedOrder.created_at).toLocaleString("vi-VN", {
                          timeZone: "Asia/Ho_Chi_Minh",
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </p>
                  </div>
                </div>

                <h4 className="font-semibold mb-2">Sản phẩm trong đơn hàng:</h4>
                <ScrollArea className="flex-1 pr-4 mb-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SP</TableHead>
                        <TableHead className="text-right">SL Bán</TableHead>
                        <TableHead className="text-right">SL Đã Hoàn</TableHead>
                        <TableHead className="text-right">Đơn giá</TableHead>
                        <TableHead className="text-right">Hoàn trả</TableHead>
                        <TableHead>Lý do hoàn</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {itemsToReturn.map((item) => {
                        const originalOrderItem = selectedOrder.order_items?.find((oi) => oi.id === item.orderItemId)
                        const isFullyReturned =
                          originalOrderItem && originalOrderItem.quantity - (originalOrderItem.returned_quantity || 0) === 0

                        return (
                          <TableRow
                            key={item.orderItemId}
                            className={isFullyReturned ? "bg-gray-50 text-gray-500" : ""}
                          >
                            <TableCell>{item.productName}</TableCell>
                            <TableCell className="text-right">{originalOrderItem?.quantity}</TableCell>
                            <TableCell className="text-right">{originalOrderItem?.returned_quantity}</TableCell>
                            <TableCell className="text-right">{formatPrice(item.unitPrice)}</TableCell>
                            <TableCell className="text-right w-[100px]">
                              {isFullyReturned ? (
                                <span className="text-green-600 text-xs">Đã hoàn đủ</span>
                              ) : (
                                <Input
                                  type="number"
                                  value={item.quantity === 0 ? "" : item.quantity}
                                  onChange={(e) => handleQuantityChange(item.orderItemId, e.target.value)}
                                  min="0"
                                  max={item.maxQuantity}
                                  className="h-8 text-right"
                                  disabled={isFullyReturned}
                                />
                              )}
                            </TableCell>
                            <TableCell className="w-[200px]">
                              {isFullyReturned ? (
                                <span className="text-xs">{originalOrderItem?.return_reason || "N/A"}</span>
                              ) : (
                                <Textarea
                                  value={item.reason}
                                  onChange={(e) => handleReasonChange(item.orderItemId, e.target.value)}
                                  placeholder="Lý do hoàn trả"
                                  className="h-8 text-xs"
                                />
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>

                <div className="flex justify-between items-center mt-auto pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Phương thức hoàn tiền:</span>
                    <Select value={refundMethod} onValueChange={setRefundMethod}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Chọn phương thức" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Tiền mặt</SelectItem>
                        <SelectItem value="bank_transfer">Chuyển khoản</SelectItem>
                        <SelectItem value="card">Thẻ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="text-lg font-bold">
                    Tổng tiền hoàn: <span className="text-red-600">{formatPrice(totalRefundAmount)}</span>
                  </div>
                  <Button onClick={handleProcessReturn} disabled={processingReturn || totalRefundAmount === 0}>
                    {processingReturn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Hoàn hàng & Hoàn tiền
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
