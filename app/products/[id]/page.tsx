"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Edit, Package, History, TrendingUp, TrendingDown, FileText } from "lucide-react"
import Image from "next/image"
import { getProductByIdClient } from "@/lib/services/products-client"
import { getProductStockHistory } from "@/lib/services/stock-movements-client"
import { getProductOrderHistory } from "@/lib/services/orders-client"
import type { Product, StockMovement } from "@/lib/types/database"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { formatCompactPrice } from "@/lib/utils" // Declare the formatCompactPrice variable

interface ProductOrderHistory {
  order_id: string
  order_code: string
  customer_name: string
  quantity: number
  unit_price: number
  total_amount: number
  order_date: string
  order_status: string
}

interface CombinedHistoryItem {
  id: string
  date: string
  type: "stock" | "order"
  employee: string
  action: string
  quantityChange?: number
  stockAfter?: number
  orderCode?: string
  orderId?: string
  customerName?: string
  unitPrice?: number
  totalAmount?: number
  status?: string
  icon: React.ReactNode
}

export default function ProductDetailPage() {
  const formatDateTime = (date: Date): string => {
    return new Intl.DateTimeFormat("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date)
  }

  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [product, setProduct] = useState<Product | null>(null)
  const [stockHistory, setStockHistory] = useState<StockMovement[]>([])
  const [orderHistory, setOrderHistory] = useState<ProductOrderHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("info")

  const loadProductData = useCallback(
    async (productId: string) => {
      try {
        setLoading(true)

        // Load product details
        const productData = await getProductByIdClient(Number(productId))
        setProduct(productData)

        // Load stock movement history
        const stockData = await getProductStockHistory(productId)
        setStockHistory(stockData)

        // Load order history
        const orderData = await getProductOrderHistory(productId)
        setOrderHistory(orderData)
      } catch (error) {
        console.error("Error loading product data:", error)
        toast({
          title: "Lỗi tải dữ liệu",
          description: "Không thể tải thông tin sản phẩm. Vui lòng thử lại.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    },
    [toast],
  )

  useEffect(() => {
    if (params.id) {
      loadProductData(params.id as string)
    }
  }, [params.id, loadProductData])

  const getMovementIcon = (type: string) => {
    switch (type) {
      case "import":
      case "adjustment_increase":
      case "return":
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case "export":
      case "sale":
      case "adjustment_decrease":
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <FileText className="h-4 w-4 text-gray-600" />
    }
  }

  const getMovementTypeText = (type: string) => {
    const types: Record<string, string> = {
      import: "Nhập kho",
      export: "Xuất kho",
      sale: "Xuất kho giao hàng cho khách/shipper",
      adjustment_increase: "Điều chỉnh tăng",
      adjustment_decrease: "Điều chỉnh giảm",
      return: "Trả hàng",
      initial: "Khởi tạo variant",
      transfer_in: "Chuyển kho vào",
      transfer_out: "Chuyển kho ra",
      purchase: "Nhập hàng từ NCC",
      goods_receipt: "Nhập hàng",
      inventory_check: "Kiểm kho",
      damage: "Hàng hỏng",
      expired: "Hàng hết hạn",
      promotion: "Khuyến mãi",
      sample: "Hàng mẫu",
      gift: "Tặng kèm",
      in: "Nhập kho",
      out: "Xuất kho",
      stock_in: "Nhập kho",
      stock_out: "Xuất kho",
    }
    return types[type] || type
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      active: { label: "Hoạt động", className: "bg-green-100 text-green-800" },
      inactive: { label: "Tạm dừng", className: "bg-yellow-100 text-yellow-800" },
      discontinued: { label: "Ngừng KD", className: "bg-red-100 text-red-800" },
    }
    const config = statusConfig[status] || { label: status, className: "bg-gray-100 text-gray-800" }
    return <Badge className={config.className}>{config.label}</Badge>
  }

  const isImportOrder = (action: string, type: string, orderCode?: string) => {
    const importActions = [
      "Nhập kho",
      "Nhập hàng từ NCC",
      "Nhập hàng",
      "Khởi tạo variant",
      "Chuyển kho vào",
      "Trả hàng",
      "Điều chỉnh tăng",
      "in", // API trả về "in"
      "stock_in",
    ]

    // Kiểm tra theo action
    if (importActions.includes(action)) return true

    // Kiểm tra theo order code (PON = Purchase Order Number, GR = Goods Receipt)
    if (orderCode && (orderCode.startsWith("PON") || orderCode.startsWith("GR") || orderCode.startsWith("PO"))) {
      return true
    }

    // Kiểm tra theo type
    if (type === "stock" && action.includes("nhập")) return true

    return false
  }

  const getSupplierName = (orderCode: string, action: string) => {
    if (!orderCode) return "NCC Mặc định"

    if (orderCode.startsWith("PON")) return "Công ty TNHH ABC"
    if (orderCode.startsWith("GR")) return "Nhà cung cấp XYZ"
    if (orderCode.startsWith("PO")) return "Nhà cung cấp DEF"
    if (action && action.includes("Khởi tạo")) return "Hệ thống"

    return "NCC Mặc định"
  }

  const getCombinedHistory = (): CombinedHistoryItem[] => {
    const combined: CombinedHistoryItem[] = []

    const currentStock = product?.stock_quantity || 0

    stockHistory.forEach((movement) => {
      const unitCost = product?.cost_price || 0
      const quantity = Math.abs(movement.quantity_change || 0)
      const totalAmount = quantity * unitCost

      combined.push({
        id: `stock-${movement.id}`,
        date: movement.created_at.toISOString(),
        type: "stock",
                  employee: (movement.created_by || "Dali").toString(),
        action: getMovementTypeText(movement.movement_type),
        quantityChange: movement.quantity_change,
        stockAfter: movement.stock_after || currentStock,
        orderCode: movement.reference_id,
        totalAmount: totalAmount > 0 ? totalAmount : undefined,
        icon: getMovementIcon(movement.movement_type),
      })
    })

    orderHistory.forEach((order) => {
      const totalAmount = order.quantity * order.unit_price

      combined.push({
        id: `order-${order.order_id}`,
        date: order.order_date,
        type: "order",
        employee: "Hệ thống",
        action: "Bán hàng",
        orderCode: order.order_code,
        orderId: order.order_id,
        customerName: order.customer_name,
        quantityChange: -order.quantity,
        unitPrice: order.unit_price,
        totalAmount: totalAmount,
        status: order.order_status,
        icon: <TrendingDown className="h-4 w-4 text-blue-600" />,
      })
    })

    const sortedHistory = combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    let runningStock = currentStock
    for (let i = 0; i < sortedHistory.length; i++) {
      const item = sortedHistory[i]
      if (item.stockAfter === undefined || item.stockAfter === null) {
        if (item.quantityChange) {
          runningStock -= item.quantityChange
        }
        item.stockAfter = runningStock
      } else {
        runningStock = item.stockAfter
      }
    }

    return sortedHistory
  }

  const handleOrderClick = (orderId: string) => {
    window.open(`/orders?orderId=${orderId}`, "_blank", "noopener,noreferrer")
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Không tìm thấy sản phẩm.</p>
        <Button onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{product.name}</h1>
            <p className="text-muted-foreground">Chi tiết sản phẩm và lịch sử giao dịch</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Chỉnh sửa
          </Button>
          <Button variant="outline">
            <Package className="mr-2 h-4 w-4" />
            Sao chép
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden relative">
              {product.image_url ? (
                <Image
                  src={product.image_url || "/placeholder.svg"}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 256px"
                />
              ) : (
                <div className="text-center">
                  <Package className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Sản phẩm chưa có ảnh tải lên</p>
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-xl font-semibold">{product.name}</h2>
                {getStatusBadge(product.status || "active")}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Giá bán lẻ</p>
                  <p className="text-lg font-semibold text-blue-600">{formatCompactPrice(product.retail_price)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Giá bán buôn</p>
                  <p className="text-lg font-semibold">{formatCompactPrice(product.wholesale_price)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tồn kho hiện tại</p>
                  <p className="text-lg font-semibold text-green-600">{product.stock_quantity} sản phẩm</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Giá nhập</p>
                  <p className="text-lg font-semibold">{formatCompactPrice(product.cost_price || 0)}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="info">Thông tin sản phẩm</TabsTrigger>
          <TabsTrigger value="history">Lịch sử giao dịch</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin chi tiết</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mã SKU:</span>
                    <span className="font-medium">{product.sku || "---"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mã barcode:</span>
                    <span className="font-medium">{product.barcode || "---"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Khối lượng:</span>
                    <span className="font-medium">---</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Đơn vị tính:</span>
                    <span className="font-medium">---</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phân loại:</span>
                    <span className="font-medium">{product.category || "Sản phẩm thường"}</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Loại sản phẩm:</span>
                    <span className="font-medium">---</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nhãn hiệu:</span>
                    <span className="font-medium">---</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tags:</span>
                    <span className="font-medium">---</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ngày tạo:</span>
                    <span className="font-medium">
                      {product.created_at ? formatDateTime(new Date(product.created_at)) : "---"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ngày cập nhật cuối:</span>
                    <span className="font-medium">
                      {product.updated_at ? formatDateTime(new Date(product.updated_at)) : "---"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Giá sản phẩm</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Giá bán lẻ:</span>
                    <span className="font-medium">{formatCompactPrice(product.retail_price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Giá nhập:</span>
                    <span className="font-medium">{formatCompactPrice(product.cost_price || 0)}</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Giá bán buôn:</span>
                    <span className="font-medium">{formatCompactPrice(product.wholesale_price)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Thông tin thêm</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Cho phép bán</span>
                  <Badge variant={product.status === "active" ? "default" : "secondary"}>
                    {product.status === "active" ? "Có" : "Không"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Áp dụng thuế</span>
                  <Badge variant="secondary">Không</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Lịch sử giao dịch
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Ngày ghi nhận</th>
                      <th className="text-left py-3 px-4">Nhân viên</th>
                      <th className="text-left py-3 px-4">Thao tác</th>
                      <th className="text-left py-3 px-4">Số lượng thay đổi</th>
                      <th className="text-left py-3 px-4">Tồn kho</th>
                      <th className="text-left py-3 px-4">Mã đơn hàng</th>
                      <th className="text-left py-3 px-4">Khách hàng/NCC</th>
                      <th className="text-left py-3 px-4">Thành tiền</th>
                      <th className="text-left py-3 px-4">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getCombinedHistory().length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-8 text-muted-foreground">
                          Chưa có lịch sử giao dịch
                        </td>
                      </tr>
                    ) : (
                      getCombinedHistory().map((item) => (
                        <tr key={item.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">{formatDateTime(new Date(item.date))}</td>
                          <td className="py-3 px-4">{item.employee}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {item.icon}
                              {item.action}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {item.quantityChange && (
                              <span
                                className={`font-medium ${item.quantityChange > 0 ? "text-green-600" : "text-red-600"}`}
                              >
                                {item.quantityChange > 0 ? "+" : ""}
                                {item.quantityChange}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-medium">
                            {item.stockAfter !== undefined && item.stockAfter !== null ? `${item.stockAfter}` : "---"}
                          </td>
                          <td className="py-3 px-4">
                            {item.orderCode ? (
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="link"
                                  className="p-0 h-auto text-blue-600 hover:underline"
                                  onClick={() => item.orderId && handleOrderClick(item.orderId)}
                                >
                                  {item.orderCode}
                                </Button>
                                {isImportOrder(item.action, item.type, item.orderCode) && (
                                  <span className="text-red-600 text-xs font-medium ml-1">(nhập)</span>
                                )}
                              </div>
                            ) : (
                              "---"
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {item.customerName ? (
                              <span>{item.customerName}</span>
                            ) : isImportOrder(item.action, item.type, item.orderCode) ? (
                              <span className="text-red-600 font-medium">
                                {getSupplierName(item.orderCode || "", item.action || "")}
                              </span>
                            ) : (
                              "---"
                            )}
                          </td>
                          <td className="py-3 px-4 font-medium">
                            {item.totalAmount && item.totalAmount > 0 ? formatCompactPrice(item.totalAmount) : "---"}
                          </td>
                          <td className="py-3 px-4">
                            {item.status ? (
                              <Badge className="bg-green-100 text-green-800">
                                {item.status === "completed"
                                  ? "Hoàn thành"
                                  : item.status === "pending"
                                    ? "Đang xử lý"
                                    : item.status === "cancelled"
                                      ? "Đã hủy"
                                      : item.status}
                              </Badge>
                            ) : item.type === "stock" ? (
                              <Badge className="bg-blue-100 text-blue-800">Đã thực hiện</Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-800">Chưa xác định</Badge>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
