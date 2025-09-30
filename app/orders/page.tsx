"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
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
import { formatPrice, getOrderStatusBadge, formatCompactPrice } from "@/lib/utils"
import { getOrders, getOrderById, processReturnAndRefund } from "@/lib/services/orders"
import { getPrintTemplateByType } from "@/lib/actions/print-templates"
import type { Order, Customer } from "@/lib/types/database"
import { useToast } from "@/hooks/use-toast"
import { Loader as Loader2, Search, ArrowLeft, Printer } from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import ReceiptModal from "@/app/components/receipt-modal"
import { useMobile } from "@/hooks/use-mobile"
import { useSearchParams } from "next/navigation"
import { IndexedDBService } from "@/lib/services/indexeddb"
import { useNetworkStatus } from "@/hooks/use-network-status"
import { Suspense } from "react"

type View = "list" | "details"

interface ItemToReturnForm {
  orderItemId: number
  productId: number
  productName: string
  quantity: number
  maxQuantity: number
  unitPrice: number
  reason: string
}

interface OfflineOrder {
  isOfflineOrder?: boolean
  isUnsynced?: boolean
}

type OrderWithOfflineStatus = Order & {
  isOfflineOrder?: boolean
  isUnsynced?: boolean
  synced?: boolean
  server_order_number?: string
}

function OrdersContent() {
  const { toast } = useToast()
  const isMobile = useMobile()
  const searchParams = useSearchParams()
  const isOnline = useNetworkStatus()
  const [view, setView] = useState<View>("list")
  const [orders, setOrders] = useState<OrderWithOfflineStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<OrderWithOfflineStatus | null>(null)
  const [itemsToReturn, setItemsToReturn] = useState<ItemToReturnForm[]>([])
  const [refundMethod, setRefundMethod] = useState("cash")
  const [processingReturn, setProcessingReturn] = useState(false)

  // Receipt Modal states
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [receiptModalOrder, setReceiptModalOrder] = useState<OrderWithOfflineStatus | null>(null)
  const [receiptModalCustomer, setReceiptModalCustomer] = useState<Customer | null>(null)
  const [receiptModalOrderData, setReceiptModalOrderData] = useState<{
    receivedAmount?: number
    changeAmount?: number
    paymentMethod?: string
  }>({})
  const [receiptTemplateContent, setReceiptTemplateContent] = useState<string>("")

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      let fetchedOrders: OrderWithOfflineStatus[] = []

      if (isOnline) {
        try {
          console.log("[v0] Fetching orders from API /api/orders")
          const response = await fetch("/api/orders")
          if (response.ok) {
            const data = await response.json()
            fetchedOrders = data.orders || []
            console.log(
              `[v0] API returned ${fetchedOrders.length} orders:`,
              fetchedOrders.map((o) => ({ id: o.id, order_number: o.order_number, created_at: o.created_at })),
            )
          } else {
            console.error("Failed to fetch orders from API:", response.status)
            // Fallback to server action if API fails
            fetchedOrders = await getOrders()
            console.log(`[v0] Fallback server action returned ${fetchedOrders.length} orders`)
          }
        } catch (error) {
          console.error("API fetch failed, using server action:", error)
          // Fallback to server action if API fails
          fetchedOrders = await getOrders()
          console.log(`[v0] Fallback server action returned ${fetchedOrders.length} orders`)
        }
      }

      // Always check for offline orders to merge with online orders
      try {
        const indexedDB = new IndexedDBService()
        await indexedDB.init()

        const allOfflineOrders = await indexedDB.getAllOrders()
        const unsyncedOrders = await indexedDB.getUnsyncedOrders()
        const unsyncedOrderIds = new Set(unsyncedOrders.map((order) => order.id))

        console.log(`[v0] Found ${allOfflineOrders.length} offline orders, ${unsyncedOrders.length} unsynced`)

        // Format offline orders to match Order interface
        const offlineOrdersFormatted = allOfflineOrders.map((order) => ({
          ...order,
          order_number: order.order_number || `OFFLINE-${order.id}`,
          order_status: order.status,
          created_at: order.created_at || new Date().toISOString(),
          customer: order.customer_id ? { id: order.customer_id, name: "Khách hàng", phone: "", email: "" } : null,
          isOfflineOrder: true,
          isUnsynced: unsyncedOrderIds.has(order.id),
          order_items:
            order.items?.map(
              (
                item: {
                  product_id: number
                  product_name: string
                  quantity: number
                  unit_price: number
                  total_price: number
                  is_service?: boolean
                },
                index: number,
              ) => ({
                id: index + 1,
                order_id: typeof order.id === "string" ? Number.parseInt(order.id.split("_")[1]) || 0 : order.id,
                product_id: item.product_id,
                product_name: item.product_name,
                quantity: item.quantity,
                unit_price: item.unit_price,
                total_price: item.total_price,
                returned_quantity: 0,
                returned_at: null,
                return_reason: null,
                is_service: item.is_service || false,
                created_at: order.created_at || new Date().toISOString(),
                updated_at: order.created_at || new Date().toISOString(),
              }),
            ) || [],
        }))

        // Merge online and offline orders, prioritizing online orders
        const allOrders = [...fetchedOrders]

        // Add offline orders that don't exist in online orders
        offlineOrdersFormatted.forEach((offlineOrder) => {
          const existsOnline = fetchedOrders.some(
            (onlineOrder) => onlineOrder.order_number === offlineOrder.order_number,
          )
          if (!existsOnline) {
            allOrders.push(offlineOrder as any)
            console.log(`[v0] Added offline order ${offlineOrder.order_number} to list`)
          } else {
            console.log(`[v0] Offline order ${offlineOrder.order_number} already exists online, skipping`)
          }
        })

        fetchedOrders = allOrders
        console.log(`[v0] Final merged orders count: ${fetchedOrders.length}`)
      } catch (error) {
        console.error("Failed to fetch offline orders:", error)
      }

      // Sort by creation date, newest first
      fetchedOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      setOrders(fetchedOrders)
      setCurrentPage(1)
    } catch (error) {
      console.error("Failed to fetch orders:", error)
      toast({
        title: "Lỗi",
        description: isOnline ? "Không thể tải danh sách đơn hàng." : "Không thể tải đơn hàng offline.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [isOnline, toast])

  const fetchReceiptTemplate = useCallback(async () => {
    try {
      const template = await getPrintTemplateByType("receipt")
      if (template) {
        setReceiptTemplateContent(template.content)
      } else {
        toast({
          title: "Lỗi",
          description: "Không thể tải mẫu hóa đơn. Vui lòng kiểm tra cài đặt mẫu in.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to fetch receipt template:", error)
      toast({
        title: "Lỗi",
        description: "Đã xảy ra lỗi khi tải mẫu hóa đơn.",
        variant: "destructive",
      })
    }
  }, [toast])

  useEffect(() => {
    fetchOrders()
    fetchReceiptTemplate()

    const handleNetworkChange = () => {
      setTimeout(() => {
        fetchOrders()
      }, 1000) // Small delay to ensure network is stable
    }

    if (typeof window !== "undefined") {
      window.addEventListener("online", handleNetworkChange)
      window.addEventListener("offline", handleNetworkChange)

      return () => {
        window.removeEventListener("online", handleNetworkChange)
        window.removeEventListener("offline", handleNetworkChange)
      }
    }
  }, [fetchOrders, fetchReceiptTemplate])

  const handleViewDetails = useCallback(
    async (orderId: number) => {
      setLoading(true)
      try {
        let orderDetails: OrderWithOfflineStatus | null = null

        if (isOnline) {
          orderDetails = await getOrderById(orderId)
        } else {
          // Try to get from IndexedDB for offline orders
          const indexedDB = new IndexedDBService()
          await indexedDB.init()
          const offlineOrder = await indexedDB.getOrderById(orderId)
          orderDetails = offlineOrder ? {
            ...offlineOrder,
            id: Number(offlineOrder.id),
            isOfflineOrder: true,
            isUnsynced: !offlineOrder.synced
          } as any : null
        }

        if (orderDetails) {
          setSelectedOrder(orderDetails)
          // Initialize itemsToReturn for the form
          const initializedItems =
            orderDetails.order_items?.map((item) => ({
              orderItemId: item.id,
              productId: item.product_id,
              productName: item.product_name,
              quantity: 0, // Default to 0 for return
              maxQuantity: item.quantity - (item.returned_quantity || 0), // Max quantity that can be returned
              unitPrice: item.unit_price,
              reason: "",
            })) || []
          setItemsToReturn(initializedItems as any)
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
    },
    [isOnline, toast],
  )

  useEffect(() => {
    const orderId = searchParams.get("orderId")
    if (orderId && orders.length > 0) {
      const orderIdNum = Number.parseInt(orderId)
      handleViewDetails(orderIdNum)
    }
  }, [searchParams, orders, handleViewDetails])

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
    const amount = itemsToReturn.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
    return amount
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

    const processedItems = itemsToProcess.map((item) => ({
      orderItemId: item.orderItemId,
      productId: item.productId,
      quantity: item.quantity,
      reason: item.reason.trim() || "Hoàn trả theo yêu cầu khách hàng",
      unitPrice: item.unitPrice,
    }))

    setProcessingReturn(true)
    try {
      const result = await processReturnAndRefund(selectedOrder.id, processedItems, refundMethod)

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

  const handleReprintInvoice = (order: OrderWithOfflineStatus) => {
    if (!receiptTemplateContent) {
      toast({
        title: "Lỗi",
        description: "Mẫu hóa đơn chưa được tải. Vui lòng thử lại sau.",
        variant: "destructive",
      })
      return
    }

    setReceiptModalOrder(order)
    setReceiptModalCustomer(order.customer as any || null)
    setReceiptModalOrderData({
      receivedAmount: order.total_amount,
      changeAmount: 0, // For reprint, assume no change
      paymentMethod: order.payment_method,
    })
    setShowReceiptModal(true)
  }

  const getSyncStatusBadge = (order: OrderWithOfflineStatus) => {
    if (!order.isOfflineOrder) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Online
        </span>
      )
    }

    if (order.isUnsynced) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          Offline - Chưa đồng bộ
        </span>
      )
    }

    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        Offline - Đã đồng bộ
      </span>
    )
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl flex items-center gap-2">
          {view === "details" && (
            <Button variant="ghost" size="icon" onClick={() => setView("list")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          {view === "list" ? "Quản lý Đơn hàng" : `Chi tiết Đơn hàng #${selectedOrder?.order_number}`}
        </h1>
      </div>
      <div className="flex-1 rounded-lg border border-dashed shadow-sm p-4 flex flex-col">
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
                      setCurrentPage(1)
                    }}
                  />
                </div>
                <ScrollArea className="flex-1 pr-4">
                  {isMobile ? (
                    <div className="space-y-2">
                      {paginatedOrders.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">Không tìm thấy đơn hàng nào.</div>
                      ) : (
                        paginatedOrders.map((order) => (
                          <div
                            key={order.id}
                            className="flex justify-between items-center p-3 border-b last:border-b-0 bg-white rounded-md shadow-sm"
                            onClick={() => handleViewDetails(order.id)}
                          >
                            <div className="flex flex-col">
                              <span className="font-semibold text-base">{order.order_number}</span>
                              <span className="text-sm text-gray-600">{order.customer?.name || "Khách lẻ"}</span>
                              <span className="text-xs text-gray-500">
                                {new Date(order.created_at).toLocaleString("vi-VN", {
                                  timeZone: "Asia/Ho_Chi_Minh",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </span>
                              <div className="mt-1">{getSyncStatusBadge(order)}</div>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="font-semibold text-base">{formatCompactPrice(order.total_amount)}</span>
                              <span className="text-sm text-gray-600">{getOrderStatusBadge(order.order_status)}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mã ĐH</TableHead>
                          <TableHead>Khách hàng</TableHead>
                          <TableHead>Tổng tiền</TableHead>
                          <TableHead>Trạng thái</TableHead>
                          <TableHead>Trạng thái đồng bộ</TableHead>
                          <TableHead>Ngày tạo</TableHead>
                          <TableHead className="text-right">Hành động</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedOrders.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-gray-500">
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
                              <TableCell>{formatCompactPrice(order.total_amount)}</TableCell>
                              <TableCell>{getOrderStatusBadge(order.order_status)}</TableCell>
                              <TableCell>{getSyncStatusBadge(order)}</TableCell>
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
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" size="sm" onClick={() => handleViewDetails(order.id)}>
                                    Chi tiết
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleReprintInvoice(order)}
                                    disabled={!receiptTemplateContent}
                                  >
                                    <Printer className="h-4 w-4 mr-1" /> In lại
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  )}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
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
                      <strong>Tổng tiền:</strong> {formatCompactPrice(selectedOrder.total_amount)}
                    </p>
                    <p>
                      <strong>Đã hoàn:</strong> {formatCompactPrice(selectedOrder.refund_amount || 0)}
                    </p>
                    <div>
                      <strong>Trạng thái đơn:</strong> {getOrderStatusBadge(selectedOrder.order_status)}
                    </div>
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
                                <div className="flex items-center gap-1">
                                  {" "}
                                  <Input
                                    type="number"
                                    value={item.quantity === 0 ? "" : item.quantity}
                                    onChange={(e) => handleQuantityChange(item.orderItemId, e.target.value)}
                                    min="0"
                                    max={item.maxQuantity}
                                    className="h-8 text-right"
                                    disabled={isFullyReturned}
                                  />
                                  {item.maxQuantity > 0 && (
                                    <span className="text-xs text-gray-500">/ {item.maxQuantity}</span>
                                  )}
                                </div>
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

                <div className="flex flex-col md:flex-row justify-between items-center mt-auto pt-4 border-t gap-4">
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
                    Tổng tiền hoàn: <span className="text-red-600">{formatCompactPrice(totalRefundAmount)}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => selectedOrder && handleReprintInvoice(selectedOrder)}
                      disabled={!receiptTemplateContent}
                      variant="outline"
                    >
                      <Printer className="h-4 w-4 mr-2" /> In lại hóa đơn
                    </Button>
                    <Button onClick={handleProcessReturn} disabled={processingReturn || totalRefundAmount === 0}>
                      {processingReturn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Hoàn hàng & Hoàn tiền
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        order={receiptModalOrder}
        customer={receiptModalCustomer}
        orderData={receiptModalOrderData}
        templateContent={receiptTemplateContent}
      />
    </main>
  )
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OrdersContent />
    </Suspense>
  )
}
