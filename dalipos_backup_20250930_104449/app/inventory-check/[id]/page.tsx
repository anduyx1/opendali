"use client"

import { useState, use, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Edit } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { getInventoryCheckDetail } from "@/lib/actions/inventory-check"
import { toast } from "sonner"

interface InventoryCheckDetail {
  id: string
  code: string
  status: "draft" | "in_progress" | "completed" | "balanced"
  createdDate: string
  balancedDate?: string
  createdBy: string
  checkedBy: string
  balancedBy?: string
  branch: string
  notes?: string
  products: Array<{
    id: string
    name: string
    code: string
    image?: string
    systemStock: number
    actualStock: number | null
    difference: number
    reason?: string
    notes?: string
  }>
}

interface InventoryCheckItem {
  product_id: number
  product_name: string
  product_sku?: string
  product_barcode?: string
  product_image?: string
  system_quantity?: number
  actual_quantity?: number
  difference?: number
  reason?: string
  notes?: string
}

export default function InventoryCheckDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [checkDetail, setCheckDetail] = useState<InventoryCheckDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true)
        const result = await getInventoryCheckDetail(Number(resolvedParams.id))

        if (result.success && result.data) {
          const { session, items } = result.data

          const detail: InventoryCheckDetail = {
            id: session.id.toString(),
            code: session.session_code,
            status: session.status as "draft" | "in_progress" | "completed" | "balanced",
            createdDate: new Date(session.created_at).toLocaleString("vi-VN"),
            balancedDate: session.balanced_at ? new Date(session.balanced_at).toLocaleString("vi-VN") : undefined,
            createdBy: session.staff_name || "Không xác định",
            checkedBy: session.staff_name || "Không xác định",
            balancedBy: session.balanced_by || undefined,
            branch: session.branch_name || "Chi nhánh mặc định",
            notes: session.notes || undefined,
            products: items.map((item: InventoryCheckItem) => ({
              id: item.product_id.toString(),
              name: item.product_name,
              code: item.product_sku || item.product_barcode || "",
              image: item.product_image || "/placeholder.svg?height=40&width=40",
              systemStock: item.system_quantity || 0,
              actualStock: item.actual_quantity || null,
              difference: item.difference || 0,
              reason: item.reason,
              notes: item.notes,
            })),
          }

          setCheckDetail(detail)
        } else {
          toast.error(result.error || "Không thể tải chi tiết phiếu kiểm hàng")
        }
      } catch (error) {
        console.error("Error fetching detail:", error)
        toast.error("Có lỗi xảy ra khi tải dữ liệu")
      } finally {
        setLoading(false)
      }
    }

    fetchDetail()
  }, [resolvedParams.id])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="secondary">Nháp</Badge>
      case "in_progress":
        return <Badge variant="default">Đang kiểm</Badge>
      case "completed":
        return <Badge variant="default">Đã kiểm</Badge>
      case "balanced":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Đã cân bằng</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getReasonText = (reason?: string) => {
    switch (reason) {
      case "damaged":
        return "Hỏng"
      case "lost":
        return "Mất"
      case "expired":
        return "Hết hạn"
      case "other":
        return "Khác"
      default:
        return reason || "Không xác định"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Đang tải chi tiết phiếu kiểm hàng...</p>
        </div>
      </div>
    )
  }

  if (!checkDetail) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Không tìm thấy phiếu kiểm hàng</p>
          <Link href="/inventory-check">
            <Button>Quay lại danh sách</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/inventory-check">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Chi tiết phiếu kiểm hàng
            </Button>
          </Link>
        </div>
        {checkDetail.status === "draft" && (
          <div className="flex gap-2">
            <Link href={`/inventory-check/${checkDetail.id}/edit`}>
              <Button>
                <Edit className="h-4 w-4 mr-2" />
                Sửa phiếu kiểm
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Check Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Mã phiếu kiểm</p>
              <p className="text-lg font-semibold">{checkDetail.code}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Trạng thái</p>
              {getStatusBadge(checkDetail.status)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Chi nhánh</p>
              <p className="font-medium">{checkDetail.branch}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Ngày tạo</p>
              <p className="font-medium">{checkDetail.createdDate}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Info */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin bổ sung</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Nhân viên tạo</p>
              <p className="font-medium">{checkDetail.createdBy}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Nhân viên kiểm</p>
              <p className="font-medium">{checkDetail.checkedBy}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Nhân viên cân bằng</p>
              <p className="font-medium">{checkDetail.balancedBy || "-"}</p>
            </div>
            {checkDetail.notes && (
              <div className="md:col-span-3">
                <p className="text-sm text-muted-foreground mb-1">Ghi chú</p>
                <p className="font-medium">{checkDetail.notes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách sản phẩm kiểm ({checkDetail.products.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>STT</TableHead>
                <TableHead>Ảnh</TableHead>
                <TableHead>Tên sản phẩm</TableHead>
                <TableHead>Đơn vị</TableHead>
                <TableHead>Tồn chi nhánh</TableHead>
                <TableHead>Tồn thực tế</TableHead>
                <TableHead>Lệch</TableHead>
                <TableHead>Lý do</TableHead>
                <TableHead>Ghi chú</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {checkDetail.products.map((product, index) => (
                <TableRow key={index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <Image
                      src={product.image || "/placeholder.svg?height=40&width=40"}
                      alt={product.name}
                      width={40}
                      height={40}
                      className="rounded"
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.code}</p>
                    </div>
                  </TableCell>
                  <TableCell>---</TableCell>
                  <TableCell>{product.systemStock}</TableCell>
                  <TableCell>{product.actualStock !== null ? product.actualStock : "-"}</TableCell>
                  <TableCell>
                    <span className={product.difference === 0 ? "text-green-600" : "text-red-600"}>
                      {product.difference > 0 ? "+" : ""}
                      {product.difference}
                    </span>
                  </TableCell>
                  <TableCell>{getReasonText(product.reason)}</TableCell>
                  <TableCell>{product.notes || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Tổng sản phẩm kiểm</p>
              <p className="text-2xl font-bold">{checkDetail.products.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Sản phẩm khớp</p>
              <p className="text-2xl font-bold text-green-600">
                {checkDetail.products.filter((p) => p.difference === 0).length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Sản phẩm lệch</p>
              <p className="text-2xl font-bold text-red-600">
                {checkDetail.products.filter((p) => p.difference !== 0).length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
