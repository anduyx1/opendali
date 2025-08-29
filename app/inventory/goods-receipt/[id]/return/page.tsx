"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Plus, Minus, User, MapPin } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { useParams, useRouter } from "next/navigation"
import { getGoodsReceiptForReturn, createGoodsReturn } from "@/lib/actions/goods-returns"
import Image from "next/image"
import Link from "next/link"

interface ReturnItem {
  id: number
  productId: number
  productName: string
  sku: string
  imageUrl: string
  originalQuantity: number
  returnedQuantity: number
  availableQuantity: number
  returnQuantity: number
  unitPrice: number
  totalAmount: number
}

interface ReceiptData {
  id: number
  receiptCode: string
  supplierName: string
  supplierPhone: string
  branch: string
  staff: string
  status: string
  items: Array<{
    id: number
    productId: number
    productName: string
    sku: string
    imageUrl: string
    quantity: number
    returnedQuantity?: number
    unitPrice: number
  }>
}

export default function GoodsReceiptReturnPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([])
  const [returnReason, setReturnReason] = useState("")
  const [returnAllItems, setReturnAllItems] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const loadReceiptData = async () => {
      try {
        const result = await getGoodsReceiptForReturn(Number(params.id))
        if (result.success) {
          setReceiptData(result.data as any || null)
                      const items = result.data?.items.map(
            (item: {
              id: number
              productId: number
              productName: string
              sku: string
              imageUrl: string
              quantity: number
              returnedQuantity?: number
              unitPrice: number
            }) => ({
              id: item.id,
              productId: item.productId,
              productName: item.productName,
              sku: item.sku,
              imageUrl: item.imageUrl,
              originalQuantity: item.quantity,
              returnedQuantity: item.returnedQuantity || 0,
              availableQuantity: item.quantity - (item.returnedQuantity || 0),
              returnQuantity: 0,
              unitPrice: item.unitPrice,
              totalAmount: 0,
            }),
          )
          setReturnItems(items || [])
        }
      } catch (error) {
        console.error("Error loading receipt data:", error)
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      loadReceiptData()
    }
  }, [params.id])

  const handleReturnAllItems = (checked: boolean) => {
    setReturnAllItems(checked)
    setReturnItems((items) =>
      items.map((item) => ({
        ...item,
        returnQuantity: checked ? item.availableQuantity : 0,
        totalAmount: checked ? item.availableQuantity * item.unitPrice : 0,
      })),
    )
  }

  const updateReturnQuantity = (itemId: number, quantity: number) => {
    setReturnItems((items) =>
      items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              returnQuantity: Math.min(Math.max(0, quantity), item.availableQuantity),
              totalAmount: Math.min(Math.max(0, quantity), item.availableQuantity) * item.unitPrice,
            }
          : item,
      ),
    )
  }

  const handleCreateReturn = async () => {
    if (!receiptData) return

    const itemsToReturn = returnItems.filter((item) => item.returnQuantity > 0)

    if (itemsToReturn.length === 0) {
      alert("Vui lòng chọn ít nhất một sản phẩm để hoàn trả")
      return
    }

    if (receiptData.status !== "completed") {
      alert("Bạn không thể hoàn trả cho đơn nhập chưa hoàn thành thanh toán")
      return
    }

    const confirmReturn = confirm(`Tạo phiếu hoàn trả cho ${itemsToReturn.length} sản phẩm?`)

    if (confirmReturn) {
      setSubmitting(true)
      try {
        const result = await createGoodsReturn({
          goodsReceiptId: receiptData.id,
          supplierName: receiptData.supplierName,
          branch: receiptData.branch,
          staff: receiptData.staff,
          returnReason,
          items: itemsToReturn.map((item) => ({
            productId: item.productId,
            quantity: item.returnQuantity,
            unitPrice: item.unitPrice,
          })),
        })

        if (result.success) {
          alert(`Đã tạo phiếu hoàn trả ${result.returnCode} thành công!`)
          router.push(`/inventory/goods-receipt/${params.id}`)
        } else {
          alert("Lỗi: " + result.error)
        }
      } catch (error) {
        console.error("Error creating return:", error)
        alert("Có lỗi xảy ra khi tạo phiếu hoàn trả")
      } finally {
        setSubmitting(false)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
      </div>
    )
  }

  if (!receiptData) {
    return <div className="text-center py-8">Không tìm thấy đơn nhập hàng</div>
  }

  const totalReturnQuantity = returnItems.reduce((sum, item) => sum + item.returnQuantity, 0)
  const totalReturnAmount = returnItems.reduce((sum, item) => sum + item.totalAmount, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/inventory/goods-receipt/${params.id}`}>
              <Button variant="ghost" size="sm" className="p-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="font-bold text-lg">Hoàn trả hàng</h1>
              <p className="text-sm text-gray-600">{receiptData.receiptCode}</p>
            </div>
          </div>
          <Button
            onClick={handleCreateReturn}
            disabled={submitting || totalReturnQuantity === 0}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 text-sm"
          >
            {submitting ? "Đang xử lý..." : "Hoàn trả"}
          </Button>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between p-6 bg-white border-b">
        <div className="flex items-center gap-2">
          <Link href={`/inventory/goods-receipt/${params.id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Tạo hoàn trả cho đơn nhập {receiptData.receiptCode}</h1>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            Thoát
          </Button>
          <Button onClick={handleCreateReturn} disabled={submitting} className="bg-cyan-600 hover:bg-cyan-700">
            {submitting ? "Đang xử lý..." : "Hoàn trả"}
          </Button>
        </div>
      </div>

      {/* Progress Timeline - Mobile */}
      <div className="md:hidden px-4 py-4 bg-white">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-4 left-8 right-8 h-0.5 bg-gray-200"></div>
          <div className="absolute top-4 left-8 w-1/2 h-0.5 bg-cyan-600"></div>

          <div className="flex flex-col items-center relative z-10">
            <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white"></div>
            </div>
            <span className="text-xs mt-1 text-cyan-600 font-medium">Chọn sản phẩm</span>
          </div>

          <div className="flex flex-col items-center relative z-10">
            <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white"></div>
            </div>
            <span className="text-xs mt-1 text-cyan-600 font-medium">Xác nhận</span>
          </div>

          <div className="flex flex-col items-center relative z-10">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-gray-400"></div>
            </div>
            <span className="text-xs mt-1 text-gray-400">Hoàn thành</span>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {/* Mobile: Return All Checkbox */}
            <div className="md:hidden bg-white rounded-lg p-4 border">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="returnAll"
                  checked={returnAllItems}
                  onCheckedChange={handleReturnAllItems}
                  className="data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                />
                <Label htmlFor="returnAll" className="font-medium">
                  Trả toàn bộ sản phẩm
                </Label>
              </div>
            </div>

            {/* Mobile: Product Cards */}
            <div className="md:hidden space-y-3">
              {returnItems.map((item) => (
                <Card key={item.id} className="overflow-hidden transition-all duration-200 hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <div className="relative">
                        <Image
                          src={item.imageUrl || "/placeholder.svg?height=60&width=60"}
                          alt={item.productName || "Hình ảnh sản phẩm"}
                          width={60}
                          height={60}
                          className="rounded-lg object-cover"
                        />
                        {item.returnQuantity > 0 && (
                          <div className="absolute -top-2 -right-2 bg-cyan-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                            {item.returnQuantity}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{item.productName}</h3>
                        <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                        <p className="text-sm font-medium text-gray-900">{formatCurrency(item.unitPrice)}</p>

                        <div className="flex items-center justify-between mt-3">
                          <div className="text-xs text-gray-500">
                            Có thể trả: {item.availableQuantity}
                            {item.returnedQuantity > 0 && (
                              <span className="text-orange-600 ml-1">(đã trả: {item.returnedQuantity})</span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-8 h-8 p-0 border-gray-300 bg-transparent"
                              onClick={() => updateReturnQuantity(item.id, item.returnQuantity - 1)}
                              disabled={item.returnQuantity <= 0}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>

                            <Input
                              type="number"
                              min="0"
                              max={item.availableQuantity}
                              value={item.returnQuantity}
                              onChange={(e) => updateReturnQuantity(item.id, Number(e.target.value))}
                              className="w-16 h-8 text-center text-sm border-gray-300"
                            />

                            <Button
                              variant="outline"
                              size="sm"
                              className="w-8 h-8 p-0 border-gray-300 bg-transparent"
                              onClick={() => updateReturnQuantity(item.id, item.returnQuantity + 1)}
                              disabled={item.returnQuantity >= item.availableQuantity}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {item.totalAmount > 0 && (
                          <div className="mt-2 text-right">
                            <span className="text-sm font-semibold text-cyan-600">
                              {formatCurrency(item.totalAmount)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Desktop: Table View */}
            <Card className="hidden md:block">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Thông tin sản phẩm trả</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="returnAllDesktop"
                      checked={returnAllItems}
                      onCheckedChange={handleReturnAllItems}
                      className="data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                    />
                    <Label htmlFor="returnAllDesktop">Trả toàn bộ sản phẩm</Label>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã SKU</TableHead>
                      <TableHead>Tên sản phẩm</TableHead>
                      <TableHead>Số lượng</TableHead>
                      <TableHead>Giá hàng trả</TableHead>
                      <TableHead>Thành tiền</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {returnItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Image
                              src={item.imageUrl || "/placeholder.svg?height=40&width=40"}
                              alt={item.productName || "Hình ảnh sản phẩm"}
                              width={40}
                              height={40}
                              className="rounded object-cover"
                            />
                            <div>
                              <div className="font-medium">{item.sku}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              max={item.availableQuantity}
                              value={item.returnQuantity}
                              onChange={(e) => updateReturnQuantity(item.id, Number(e.target.value))}
                              className="w-16"
                            />
                            <span className="text-muted-foreground">
                              / {item.availableQuantity}
                              {item.returnedQuantity > 0 && (
                                <span className="text-xs text-orange-600 ml-1">(đã trả: {item.returnedQuantity})</span>
                              )}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                        <TableCell className="font-semibold">{formatCurrency(item.totalAmount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div></div>
                  <div></div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Số lượng hàng trả</span>
                      <span className="font-semibold">{totalReturnQuantity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Giá trị hàng trả</span>
                      <span className="font-semibold">{formatCurrency(totalReturnAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Chi phí</span>
                      <span>0</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>VAT</span>
                      <span>0</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Chiết khấu</span>
                      <span>0</span>
                    </div>
                    <div className="flex justify-between font-semibold text-lg border-t pt-2">
                      <span>Tổng giá trị hàng trả</span>
                      <span className="text-cyan-600">{formatCurrency(totalReturnAmount)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mobile: Summary Card */}
            <Card className="md:hidden bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-200">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Số lượng hàng trả</span>
                    <span className="font-bold text-lg">{totalReturnQuantity}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Tổng giá trị</span>
                    <span className="font-bold text-xl text-cyan-600">{formatCurrency(totalReturnAmount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Refund Information */}
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-green-700">
                  💰 NHẬN TIỀN HOÀN LẠI TỪ NHÀ CUNG CẤP
                </CardTitle>
              </CardHeader>
              <CardContent>
                {receiptData.status !== "completed" ? (
                  <p className="text-gray-600">Bạn không thể nhận tiền hoàn cho đơn nhập chưa có thanh toán</p>
                ) : (
                  <p className="text-green-600 font-semibold">
                    Có thể nhận hoàn tiền: {formatCurrency(totalReturnAmount)}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Supplier Info */}
            <Card className="border-cyan-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-cyan-700">
                  <User className="h-5 w-5" />
                  Nhà cung cấp
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900">{receiptData.supplierName}</h3>
                  <p className="text-sm text-cyan-600 font-medium">{receiptData.supplierPhone}</p>
                </div>
              </CardContent>
            </Card>

            {/* Branch Info */}
            <Card className="border-cyan-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-cyan-700">
                  <MapPin className="h-5 w-5" />
                  Chi nhánh hoàn trả
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium text-gray-900">{receiptData.branch}</p>
              </CardContent>
            </Card>

            {/* Return Reason */}
            <Card className="border-cyan-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-cyan-700">Lý do hoàn trả</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="Nhập lý do hoàn trả..."
                  rows={4}
                  className="border-gray-300 focus:border-cyan-500 focus:ring-cyan-500"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Action */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pb-safe">
        <Button
          onClick={handleCreateReturn}
          disabled={submitting || totalReturnQuantity === 0}
          className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-3 font-semibold text-lg"
        >
          {submitting ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Đang xử lý...
            </div>
          ) : (
            `Hoàn trả ${totalReturnQuantity > 0 ? `(${totalReturnQuantity})` : ""}`
          )}
        </Button>
      </div>
    </div>
  )
}
