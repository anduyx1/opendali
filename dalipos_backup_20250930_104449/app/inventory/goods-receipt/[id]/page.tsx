"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, FileText, MoreHorizontal } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { useParams } from "next/navigation"
import { getGoodsReceiptDetail } from "@/lib/actions/goods-receipt"
import Image from "next/image"
import Link from "next/link"

interface GoodsReceiptDetail {
  id: number
  receiptCode: string
  status: string
  supplierName: string
  supplierPhone: string
  supplierAddress: string
  branch: string
  staff: string
  createdAt: string
  deliveryDate: string
  note: string
  tags: string
  totalAmount: number
  paidAmount: number
  supplierDebt: number
  supplierTotalOrders: number
  supplierOrderCount: number
  supplierReturns: number
  canReturn: boolean // Add canReturn flag
  items: Array<{
    id: number
    productName: string
    sku: string
    imageUrl: string
    unit: string
    quantity: number
    unitPrice: number
    discount: number
    totalPrice: number
    returnedQuantity?: number // Add returned quantity
    canReturn?: boolean // Add can return flag for individual items
  }>
}

export default function GoodsReceiptDetailPage() {
  const params = useParams()
  const [detail, setDetail] = useState<GoodsReceiptDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState("")

  useEffect(() => {
    const loadDetail = async () => {
      try {
        const result = await getGoodsReceiptDetail(Number(params.id))
        if (result.success) {
          setDetail(result.data as any || null)
        }
      } catch (error) {
        console.error("Error loading goods receipt detail:", error)
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      loadDetail()
    }
  }, [params.id])

  if (loading) {
    return <div className="flex justify-center items-center h-64">Đang tải...</div>
  }

  if (!detail) {
    return <div className="text-center py-8">Không tìm thấy đơn nhập hàng</div>
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "completed":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "draft":
        return "Nháp"
      case "pending":
        return "Đang giao dịch"
      case "completed":
        return "Hoàn thành"
      default:
        return status
    }
  }

  const handlePayment = async () => {
    if (!detail || !paymentAmount) return

    const amount = Number.parseFloat(paymentAmount)
    const remainingAmount = (detail.totalAmount || 0) - (detail.paidAmount || 0)

    if (isNaN(amount) || amount <= 0) {
      alert("Vui lòng nhập số tiền hợp lệ")
      return
    }

    if (amount > remainingAmount) {
      alert(`Số tiền thanh toán không được vượt quá ${formatCurrency(remainingAmount)}`)
      return
    }

    const confirmPayment = confirm(`Thanh toán ${formatCurrency(amount)} cho đơn nhập hàng ${detail.receiptCode}?`)

    if (confirmPayment) {
      try {
        const { payGoodsReceipt } = await import("@/lib/actions/goods-receipt")
        const result = await payGoodsReceipt(detail.id, amount)

        if (result.success) {
          alert("Thanh toán thành công!")
          setPaymentModalOpen(false)
          setPaymentAmount("")
          window.location.reload()
        } else {
          alert("Lỗi thanh toán: " + result.error)
        }
      } catch (error) {
        console.error("Payment error:", error)
        alert("Có lỗi xảy ra khi thanh toán")
      }
    }
  }

  const openPaymentModal = () => {
    if (!detail) return
    const remainingAmount = (detail.totalAmount || 0) - (detail.paidAmount || 0)
    setPaymentAmount(remainingAmount.toString())
    setPaymentModalOpen(true)
  }

  const handleCompleteOrder = async () => {
    if (!detail) return

    const confirmComplete = confirm(`Hoàn thành đơn nhập hàng ${detail.receiptCode}?`)

    if (confirmComplete) {
      try {
        const { completeGoodsReceipt } = await import("@/lib/actions/goods-receipt")
        const result = await completeGoodsReceipt(detail.id)

        if (result.success) {
          alert("Đơn nhập hàng đã được hoàn thành!")
          window.location.reload()
        } else {
          alert("Lỗi: " + result.error)
        }
      } catch (error) {
        console.error("Complete order error:", error)
        alert("Có lỗi xảy ra khi hoàn thành đơn")
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* {(detail?.paidAmount || 0) >= (detail?.totalAmount || 0) && (
        <div className="md:hidden bg-green-500 text-white text-center py-3 px-4 font-medium">
          ✓ Thanh toán thành công!
        </div>
      )} */}

      <div className="md:hidden sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
        <Link href="/inventory/goods-receipt">
          <Button variant="ghost" size="sm" className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-lg font-semibold">{detail?.receiptCode}</h1>
        <div className="flex gap-2">
          {detail?.canReturn ? (
            <Link href={`/inventory/goods-receipt/${detail.id}/return`}>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-sm">
                Hoàn trả
              </Button>
            </Link>
          ) : (
            <Button disabled variant="outline" size="sm" className="px-3 py-1 text-sm bg-transparent">
              Đã hoàn trả hết
            </Button>
          )}
        </div>
      </div>

      <div className="hidden md:flex items-center justify-between p-4 md:p-6">
        <div className="flex items-center gap-2">
          <Link href="/inventory/goods-receipt">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{detail?.receiptCode}</h1>
            <p className="text-sm text-muted-foreground">{detail?.createdAt}</p>
          </div>
          <Badge className={getStatusColor(detail?.status || "")}>{getStatusText(detail?.status || "")}</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Thoát</Button>
          <Button variant="outline">Sửa đơn</Button>
          {detail?.canReturn && (
            <Link href={`/inventory/goods-receipt/${detail.id}/return`}>
              <Button>Hoàn trả</Button>
            </Link>
          )}
          {!detail?.canReturn && (
            <Button disabled variant="outline">
              Đã hoàn trả hết
            </Button>
          )}
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        <div className="md:hidden">
          <div className="flex items-center justify-between px-2">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-semibold mb-2">
                ✓
              </div>
              <div className="text-center">
                <div className="text-xs font-medium">Đang giao dịch</div>
                <div className="text-xs text-gray-500">
                  14:46
                  <br />
                  14/8/2025
                </div>
              </div>
            </div>
            <div className="flex-1 h-0.5 bg-blue-500 mx-2 mt-[-20px]"></div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-semibold mb-2">
                ✓
              </div>
              <div className="text-center">
                <div className="text-xs font-medium">Đã nhập</div>
                <div className="text-xs text-gray-500">
                  14:46
                  <br />
                  14/8/2025
                </div>
              </div>
            </div>
            <div
              className={`flex-1 h-0.5 mx-2 mt-[-20px] ${(detail?.paidAmount || 0) >= (detail?.totalAmount || 0) ? "bg-blue-500" : "bg-gray-300"}`}
            ></div>
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full ${(detail?.paidAmount || 0) >= (detail?.totalAmount || 0) ? "bg-blue-500 text-white" : "bg-gray-300 text-gray-600"} flex items-center justify-center text-sm font-semibold mb-2`}
              >
                {(detail?.paidAmount || 0) >= (detail?.totalAmount || 0) ? "✓" : "3"}
              </div>
              <div className="text-center">
                <div className="text-xs font-medium">Hoàn thành</div>
                <div className="text-xs text-gray-500">
                  {(detail?.paidAmount || 0) >= (detail?.totalAmount || 0) ? "14:46\n14/8/2025" : ""}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden md:flex items-center justify-center py-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-semibold">
                ✓
              </div>
              <div className="text-center">
                <div className="text-sm font-medium">Tạo đơn</div>
                <div className="text-xs text-muted-foreground">{detail.createdAt}</div>
              </div>
            </div>
            <div className="w-16 h-0.5 bg-blue-500"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-semibold">
                ✓
              </div>
              <div className="text-center">
                <div className="text-sm font-medium">Nhập hàng</div>
                <div className="text-xs text-muted-foreground">{detail.createdAt}</div>
              </div>
            </div>
            <div
              className={`w-16 h-0.5 ${(detail.paidAmount || 0) >= (detail.totalAmount || 0) ? "bg-blue-500" : "bg-gray-300"}`}
            ></div>
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full ${(detail.paidAmount || 0) >= (detail.totalAmount || 0) ? "bg-blue-500 text-white" : "bg-gray-300 text-gray-600"} flex items-center justify-center text-sm font-semibold`}
              >
                {(detail.paidAmount || 0) >= (detail.totalAmount || 0) ? "✓" : "3"}
              </div>
              <div className="text-center">
                <div className="text-sm font-medium">Thanh toán</div>
                <div className="text-xs text-muted-foreground">
                  {(detail.paidAmount || 0) >= (detail.totalAmount || 0) ? detail.createdAt : "---"}
                </div>
              </div>
            </div>
            <div className={`w-16 h-0.5 ${detail.status === "completed" ? "bg-blue-500" : "bg-gray-300"}`}></div>
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full ${detail.status === "completed" ? "bg-blue-500 text-white" : "bg-gray-300 text-gray-600"} flex items-center justify-center text-sm font-semibold`}
              >
                {detail.status === "completed" ? "✓" : "4"}
              </div>
              <div className="text-center">
                <div className="text-sm font-medium">Hoàn thành</div>
                <div className="text-xs text-muted-foreground">
                  {detail.status === "completed" ? detail.createdAt : "---"}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="md:hidden bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
          <div className="text-4xl font-bold text-gray-900 mb-2">
            {formatCurrency(detail?.totalAmount || 0).replace("₫", "")}
          </div>
          <div className="text-sm text-gray-600 mb-1">Tạo bởi {detail?.staff}</div>
          <div className="text-sm text-gray-600 mb-3">{detail?.branch}</div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gray-500"></div>
            <span className="text-sm text-gray-600">
              {(detail?.paidAmount || 0) >= (detail?.totalAmount || 0) ? "Thanh toán toàn bộ" : "Chưa thanh toán"}
            </span>
          </div>
        </div>

        <div className="md:hidden bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">👤</div>
            <div>
              <div className="font-semibold text-gray-900">{detail?.supplierName}</div>
              <div className="text-blue-600 font-medium">{detail?.supplierPhone}</div>
              <div className="text-sm text-gray-500">{detail?.supplierAddress}</div>
            </div>
          </div>
        </div>

        <div className="md:hidden bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Sản phẩm ({detail?.items.length || 0})</h3>
          </div>
          {detail?.items.map((item) => (
            <div key={item.id} className="p-4 border-b border-gray-100 last:border-b-0">
              <div className="text-sm text-gray-500">STT: {detail.items.indexOf(item) + 1}</div>
              <div className="flex gap-3">
                <div className="relative">
                  <Image
                    src={item.imageUrl || "/placeholder.svg?height=60&width=60"}
                    alt={item.productName || "Sản phẩm"}
                    width={60}
                    height={60}
                    className="rounded-lg object-cover"
                  />
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                    {item.quantity}
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{item.productName}</h4>
                  <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">{formatCurrency(item.unitPrice || 0)}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-gray-900">{formatCurrency(item.totalPrice || 0)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="md:hidden bg-white rounded-lg p-4 border border-gray-200 space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Tiền hàng</span>
            <span className="font-semibold">{formatCurrency(detail?.totalAmount || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Thuế</span>
            <span className="font-semibold">0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-600">Chiết khấu</span>
            <span className="font-semibold text-blue-600">0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-600">Chi phí nhập hàng</span>
            <span className="font-semibold text-blue-600">0</span>
          </div>
          <div className="border-t border-gray-200 pt-3">
            <div className="flex justify-between">
              <span className="font-semibold text-gray-900">Tổng tiền</span>
              <span className="font-bold text-lg">{formatCurrency(detail?.totalAmount || 0)}</span>
            </div>
          </div>
        </div>

        <div className="md:hidden bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">👤</div>
              <div>
                <div className="font-medium text-gray-900">
                  {detail?.supplierName} - {detail?.supplierPhone}
                </div>
              </div>
            </div>
            <div className="text-gray-400">›</div>
          </div>
        </div>

        {(detail?.paidAmount || 0) >= (detail?.totalAmount || 0) && (
          <div className="md:hidden bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 text-blue-600 mb-3">
              <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs">
                ✓
              </div>
              <span className="font-medium">Đã thanh toán toàn bộ</span>
            </div>
            <div className="text-sm text-gray-600">
              <div className="font-medium">Tiền mặt</div>
              <div>14:46 14/08/2025 {formatCurrency(detail?.paidAmount || 0)}</div>
            </div>
          </div>
        )}

        <div className="hidden md:block">
          <div className="flex flex-col gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-800">
                <div className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-xs">
                  ✓
                </div>
                <span>Đơn nhập hàng {detail.receiptCode} đã được tạo thành công</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">👤</div>
                      Thông tin nhà cung cấp
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <h3 className="font-semibold">{detail.supplierName}</h3>
                      <p className="text-sm text-muted-foreground">{detail.supplierPhone}</p>
                      <p className="text-sm text-muted-foreground">{detail.supplierAddress}</p>
                    </div>
                    <div className="mt-4 p-3 border rounded-lg bg-muted/50">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-sm text-muted-foreground">Công nợ</div>
                          <div className="font-semibold text-red-600">{formatCurrency(detail.supplierDebt || 0)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">
                            Tổng đơn nhập ({detail.supplierOrderCount || 0} đơn)
                          </div>
                          <div className="font-semibold text-blue-600">
                            {formatCurrency(detail.supplierTotalOrders || 0)}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Trả hàng</div>
                          <div className="font-semibold text-red-600">
                            {formatCurrency(detail.supplierReturns || 0)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-green-600 mb-4">
                      <div className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-xs">
                        ✓
                      </div>
                      <span className="font-medium">Đơn nhập hàng đã nhập kho</span>
                    </div>
                    <div className="flex items-center gap-2 text-blue-600">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span>
                        {detail.receiptCode} • {detail.createdAt}
                      </span>
                      <Button variant="ghost" size="sm">
                        <FileText className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${(detail.paidAmount || 0) >= (detail.totalAmount || 0) ? "bg-green-500" : "bg-gray-400"}`}
                        ></div>
                        <span className="font-medium">
                          {(detail.paidAmount || 0) >= (detail.totalAmount || 0)
                            ? "Đơn nhập hàng đã thanh toán"
                            : "Đơn nhập hàng chưa thanh toán"}
                        </span>
                      </div>
                      {(detail.paidAmount || 0) < (detail.totalAmount || 0) && (
                        <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
                          <DialogTrigger asChild>
                            <Button onClick={openPaymentModal}>Thanh toán</Button>
                          </DialogTrigger>
                          <DialogContent className="w-[95vw] max-w-md mx-auto max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="text-lg font-semibold">Thanh toán đơn nhập hàng</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Mã đơn nhập hàng</Label>
                                <Input value={detail.receiptCode} disabled className="bg-gray-50" />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Nhà cung cấp</Label>
                                <Input value={detail.supplierName} disabled className="bg-gray-50" />
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">Tổng tiền</Label>
                                  <Input
                                    value={formatCurrency(detail.totalAmount || 0)}
                                    disabled
                                    className="bg-gray-50"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">Đã thanh toán</Label>
                                  <Input
                                    value={formatCurrency(detail.paidAmount || 0)}
                                    disabled
                                    className="bg-gray-50"
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Còn phải trả</Label>
                                <Input
                                  value={formatCurrency((detail.totalAmount || 0) - (detail.paidAmount || 0))}
                                  disabled
                                  className="font-semibold text-red-600 bg-red-50 border-red-200"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="paymentAmount" className="text-sm font-medium">
                                  Số tiền thanh toán <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  id="paymentAmount"
                                  type="number"
                                  value={paymentAmount}
                                  onChange={(e) => setPaymentAmount(e.target.value)}
                                  placeholder="Nhập số tiền thanh toán"
                                  min="0"
                                  max={(detail.totalAmount || 0) - (detail.paidAmount || 0)}
                                  className="text-lg font-semibold"
                                  autoFocus
                                />
                              </div>
                              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                <Button
                                  variant="outline"
                                  onClick={() => setPaymentModalOpen(false)}
                                  className="flex-1 h-12"
                                >
                                  Hủy
                                </Button>
                                <Button
                                  onClick={handlePayment}
                                  className="flex-1 h-12 bg-blue-600 hover:bg-blue-700"
                                  disabled={!paymentAmount || Number.parseFloat(paymentAmount) <= 0}
                                >
                                  Xác nhận thanh toán
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-sm text-muted-foreground">Tiền cần trả NCC</div>
                        <div className="font-semibold">{formatCurrency(detail.totalAmount || 0)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Đã trả</div>
                        <div className="font-semibold text-green-600">{formatCurrency(detail.paidAmount || 0)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Còn phải trả</div>
                        <div className="font-semibold text-red-600">
                          {formatCurrency((detail.totalAmount || 0) - (detail.paidAmount || 0))}
                        </div>
                      </div>
                    </div>

                    {(detail.paidAmount || 0) > 0 && (
                      <div className="mt-4 p-3 border rounded-lg bg-blue-50">
                        <div className="text-sm text-blue-800">
                          <div className="font-medium">Thông tin thanh toán:</div>
                          <div>• Đã thanh toán: {formatCurrency(detail.paidAmount || 0)}</div>
                          <div>• Công nợ hiện tại: {formatCurrency(detail.supplierDebt || 0)}</div>
                          {(detail.paidAmount || 0) >= (detail.totalAmount || 0) && (
                            <div className="text-green-600 font-medium">✓ Đã thanh toán đầy đủ</div>
                          )}
                        </div>
                      </div>
                    )}

                    {(detail.paidAmount || 0) >= (detail.totalAmount || 0) && detail.status !== "completed" && (
                      <div className="mt-4 pt-4 border-t">
                        <Button onClick={handleCompleteOrder} className="w-full" variant="default">
                          Hoàn thành đơn nhập hàng
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Thông tin đơn nhập hàng</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Chi nhánh</span>
                      <span>: {detail.branch}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Chính sách giá</span>
                      <span>: Giá nhập</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nhân viên phụ trách</span>
                      <span>: {detail.staff}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ngày hẹn giao</span>
                      <span>: {detail.deliveryDate || "---"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ngày nhập</span>
                      <span>: {detail.createdAt}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tham chiếu</span>
                      <span>: ---</span>
                    </div>
                    <div className="mt-4">
                      <Button variant="link" className="text-blue-600 p-0">
                        Xem lịch sử đơn nhập hàng
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Thông tin sản phẩm</CardTitle>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>STT</TableHead>
                    <TableHead>Ảnh</TableHead>
                    <TableHead>Tên sản phẩm</TableHead>
                    <TableHead>Đơn vị</TableHead>
                    <TableHead>SL nhập</TableHead>
                    <TableHead>SL hoàn trả</TableHead>
                    <TableHead>Đơn giá</TableHead>
                    <TableHead>Chiết khấu</TableHead>
                    <TableHead>Thành tiền</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detail.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{detail.items.indexOf(item) + 1}</TableCell>
                      <TableCell>
                        <Image
                          src={item.imageUrl || "/placeholder.svg?height=40&width=40"}
                          alt={item.productName || "Hình ảnh sản phẩm"}
                          width={40}
                          height={40}
                          className="rounded object-cover"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{item.productName}</div>
                        <div className="text-sm text-muted-foreground">{item.sku}</div>
                      </TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>{item.quantity || 0}</TableCell>
                      <TableCell>
                        <span
                          className={`font-medium ${(item.returnedQuantity || 0) > 0 ? "text-red-600" : "text-gray-400"}`}
                        >
                          {item.returnedQuantity || 0}
                        </span>
                        {(item.returnedQuantity || 0) > 0 && (
                          <div className="text-xs text-red-500">
                            Còn lại: {(item.quantity || 0) - (item.returnedQuantity || 0)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{formatCurrency(item.unitPrice || 0)}</TableCell>
                      <TableCell>{item.discount || 0}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(item.totalPrice || 0)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Ghi chú đơn</h4>
                  <p className="text-sm text-muted-foreground">{detail.note || "Chưa có ghi chú"}</p>
                  <h4 className="font-medium mb-2 mt-4">Tags</h4>
                  <p className="text-sm text-muted-foreground">{detail.tags || "Chưa có tags"}</p>
                </div>
                <div></div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Số lượng</span>
                    <span className="font-semibold">
                      {detail.items.reduce((sum, item) => sum + (item.quantity || 0), 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>SL hoàn trả</span>
                    <span className="font-semibold">
                      {detail.items.reduce((sum, item) => sum + (item.returnedQuantity || 0), 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tổng tiền</span>
                    <span className="font-semibold">{formatCurrency(detail.totalAmount || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Chiết khấu</span>
                    <span>0</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
