"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Plus, Eye, MapPin, Calendar, Package } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"
import { getGoodsReceipts } from "@/lib/actions/goods-receipt"
import { toast } from "sonner"
import { DraggableFloatingActionButton } from "@/components/ui/draggable-fab"

interface GoodsReceiptRecord {
  id: number
  code: string
  receiptDate: string
  status: "draft" | "completed" | "cancelled"
  paymentStatus: "paid" | "partial" | "unpaid"
  importStatus: "pending" | "imported"
  branch: string
  supplier: string
  staff: string
  totalAmount: number
  paidAmount: number
  returnedAmount: number
  displayStatus?: string
}

export default function GoodsReceiptListPage() {
  const [receipts, setReceipts] = useState<GoodsReceiptRecord[]>([])
  const [filteredReceipts, setFilteredReceipts] = useState<GoodsReceiptRecord[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter] = useState("all") // removed unused setStatusFilter
  const [dateFilter] = useState("all") // removed unused setDateFilter
  const [supplierFilter] = useState("all") // removed unused setSupplierFilter
  const [activeTab, setActiveTab] = useState("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadGoodsReceipts = async () => {
      try {
        setLoading(true)
        const result = await getGoodsReceipts()

        if (result.success && result.data) {
          const formattedReceipts: GoodsReceiptRecord[] = (result.data as any[]).map(
            (receipt: {
              id: number
              receipt_code: string
              created_at: string
              status: string
              display_status?: string
              payment_status?: string
              branch?: string
              supplier_name?: string
              supplier?: string
              staff_name?: string
              staff?: string
              total_amount?: number
              paid_amount?: number
              returned_amount?: number
            }) => ({
              id: receipt.id,
              code: receipt.receipt_code,
              receiptDate: new Date(receipt.created_at).toLocaleString("vi-VN"),
              status: receipt.status as "draft" | "completed" | "cancelled",
              displayStatus: receipt.display_status,
              paymentStatus: (receipt.payment_status || "unpaid") as "paid" | "partial" | "unpaid",
              importStatus: receipt.status === "completed" ? "imported" : "pending",
              branch: receipt.branch || "Chi nhánh mặc định",
              supplier: receipt.supplier_name || receipt.supplier || "Chưa có thông tin",
              staff: receipt.staff_name || receipt.staff || "Chưa có thông tin",
              totalAmount: receipt.total_amount || 0,
              paidAmount: receipt.paid_amount || 0,
              returnedAmount: receipt.returned_amount || 0,
            }),
          )

          setReceipts(formattedReceipts)
          setFilteredReceipts(formattedReceipts)
        } else {
          console.error("Failed to load goods receipts:", result.error)
          toast.error("Không thể tải danh sách đơn nhập hàng")
          setReceipts([])
          setFilteredReceipts([])
        }
      } catch (error) {
        console.error("Error loading goods receipts:", error)
        toast.error("Có lỗi xảy ra khi tải danh sách đơn nhập hàng")
        setReceipts([])
        setFilteredReceipts([])
      } finally {
        setLoading(false)
      }
    }

    loadGoodsReceipts()
  }, [])

  const getStatusBadge = (status: string, paymentStatus: string, displayStatus?: string) => {
    if (displayStatus === "partial_returned") {
      return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Hoàn 1 phần</Badge>
    } else if (displayStatus === "returned") {
      return <Badge className="bg-red-100 text-red-800 border-red-200">Hoàn Trả</Badge>
    } else if (status === "completed" && paymentStatus === "paid") {
      return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Hoàn thành</Badge>
    } else if (status === "draft" && paymentStatus === "unpaid") {
      return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Chưa thanh toán</Badge>
    } else if (paymentStatus === "partial") {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Thanh toán một phần</Badge>
    } else if (status === "draft") {
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Đã nhập hàng</Badge>
    }
    return <Badge variant="outline">Chưa xác định</Badge>
  }

  const getImportStatusBadge = (importStatus: string, paymentStatus: string, displayStatus?: string) => {
    if (displayStatus === "partial_returned") {
      return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Hoàn 1 phần</Badge>
    } else if (displayStatus === "returned") {
      return <Badge className="bg-red-100 text-red-800 border-red-200">Đã hoàn trả</Badge>
    } else if (importStatus === "imported" && paymentStatus === "paid") {
      return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Đã nhập & thanh toán</Badge>
    } else if (importStatus === "imported" && paymentStatus === "partial") {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Đã nhập - Thiếu tiền</Badge>
    } else if (importStatus === "imported" && paymentStatus === "unpaid") {
      return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Đã nhập - Chưa thanh toán</Badge>
    }
    return <Badge variant="outline">Chưa nhập</Badge>
  }

  const allCount = receipts.length
  const pendingCount = receipts.filter((r) => r.status === "draft").length
  const completedCount = receipts.filter((r) => r.status === "completed").length

  useEffect(() => {
    let filtered = receipts

    if (activeTab !== "all") {
      if (activeTab === "pending") {
        filtered = filtered.filter((r) => r.status === "draft")
      } else if (activeTab === "completed") {
        filtered = filtered.filter((r) => r.status === "completed")
      }
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (r) =>
          r.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.staff.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    setFilteredReceipts(filtered)
  }, [receipts, searchTerm, activeTab, statusFilter, dateFilter, supplierFilter])

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-24 h-24 bg-cyan-50 rounded-full flex items-center justify-center mb-4">
        <Package className="w-12 h-12 text-cyan-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có đơn nhập hàng</h3>
      <p className="text-gray-500 text-center mb-6 max-w-sm">
        Bắt đầu tạo đơn nhập hàng đầu tiên để quản lý kho hàng của bạn
      </p>
      <Link href="/inventory/goods-receipt/create">
        <Button className="bg-cyan-800 hover:bg-cyan-900">
          <Plus className="w-4 h-4 mr-2" />
          Tạo đơn nhập hàng
        </Button>
      </Link>
    </div>
  )

  const MobileCard = ({ receipt }: { receipt: GoodsReceiptRecord }) => (
    <Link href={`/inventory/goods-receipt/${receipt.id}`}>
      <Card className="mb-3 hover:shadow-md transition-shadow duration-200 border-l-4 border-l-cyan-800">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-bold text-lg text-gray-900">{receipt.code}</h3>
              <p className="text-sm text-gray-500">{receipt.supplier}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg text-gray-900">{formatCurrency(receipt.totalAmount)}</p>
              {receipt.paymentStatus !== "paid" && (
                <div className="text-xs text-orange-600">
                  {getStatusBadge(receipt.status, receipt.paymentStatus, receipt.displayStatus)}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center text-sm text-gray-600 mb-2">
            <Calendar className="w-4 h-4 mr-2" />
            <span>{receipt.receiptDate}</span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="w-4 h-4 mr-1" />
              <span className="text-xs">{receipt.branch}</span>
            </div>
            {getImportStatusBadge(receipt.importStatus, receipt.paymentStatus, receipt.displayStatus)}
          </div>
        </CardContent>
      </Card>
    </Link>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900 md:text-2xl">Đơn nhập hàng</h1>
              <div className="flex items-center text-sm text-cyan-600 mt-1"></div>
            </div>
            <div className="hidden md:flex gap-2">
              <Link href="/inventory/goods-receipt/create">
                <Button className="bg-cyan-800 hover:bg-cyan-900">
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo đơn nhập hàng
                </Button>
              </Link>
            </div>
            <div className="md:hidden">
              <Button variant="ghost" size="sm">
                <Search className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm mã đơn nhập, nhà cung cấp..."
              className="pl-10 bg-gray-50 border-gray-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-4">
          <TabsList className="grid w-full grid-cols-3 bg-gray-100">
            <TabsTrigger value="all" className="text-xs md:text-sm">
              Tất cả ({allCount})
            </TabsTrigger>
            <TabsTrigger value="pending" className="text-xs md:text-sm">
              Đang giao dịch ({pendingCount})
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-xs md:text-sm">
              Hoàn thành ({completedCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-800"></div>
              </div>
            ) : filteredReceipts.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                <div className="md:hidden">
                  {filteredReceipts.map((receipt) => (
                    <MobileCard key={receipt.id} receipt={receipt} />
                  ))}
                </div>

                <div className="hidden md:block">
                  <Card>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[50px]">
                                <input type="checkbox" className="rounded" />
                              </TableHead>
                              <TableHead>Mã đơn nhập</TableHead>
                              <TableHead>Ngày nhập</TableHead>
                              <TableHead>Trạng thái</TableHead>
                              <TableHead>Trạng thái nhập</TableHead>
                              <TableHead>Chi nhánh nhập</TableHead>
                              <TableHead>Nhà cung cấp</TableHead>
                              <TableHead>Nhân viên tạo</TableHead>
                              <TableHead className="text-right">Giá trị đơn</TableHead>
                              <TableHead className="w-[100px]">Thao tác</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredReceipts.map((receipt) => (
                              <TableRow key={receipt.id}>
                                <TableCell>
                                  <input type="checkbox" className="rounded" />
                                </TableCell>
                                <TableCell>
                                  <Link
                                    href={`/inventory/goods-receipt/${receipt.id}`}
                                    className="text-cyan-600 hover:underline font-medium"
                                  >
                                    {receipt.code}
                                  </Link>
                                </TableCell>
                                <TableCell>{receipt.receiptDate}</TableCell>
                                <TableCell>
                                  {getStatusBadge(receipt.status, receipt.paymentStatus, receipt.displayStatus)}
                                </TableCell>
                                <TableCell>
                                  {getImportStatusBadge(
                                    receipt.importStatus,
                                    receipt.paymentStatus,
                                    receipt.displayStatus,
                                  )}
                                </TableCell>
                                <TableCell>{receipt.branch}</TableCell>
                                <TableCell>{receipt.supplier}</TableCell>
                                <TableCell>{receipt.staff}</TableCell>
                                <TableCell className="text-right font-semibold">
                                  {formatCurrency(receipt.totalAmount)}
                                  {receipt.paymentStatus !== "paid" && (
                                    <div className="text-xs text-red-600">
                                      Còn thiếu: {formatCurrency(receipt.totalAmount - receipt.paidAmount)}
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Button variant="ghost" size="sm">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <div className="md:hidden">
        <DraggableFloatingActionButton
          onClick={() => (window.location.href = "/inventory/goods-receipt/create")}
          className="bg-cyan-800 hover:bg-cyan-900"
        >
          <Plus className="w-6 h-6" />
        </DraggableFloatingActionButton>
      </div>
    </div>
  )
}
