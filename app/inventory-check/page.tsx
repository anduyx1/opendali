"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Filter } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { getInventoryCheckSessions } from "@/lib/actions/inventory-check"

interface InventoryCheck {
  id: number
  session_code: string
  branch_name: string
  staff_name: string
  status: "draft" | "completed" | "balanced"
  notes?: string
  tags?: string
  created_at: string
  updated_at?: string
  balanced_at?: string
  balanced_by?: string
}

export default function InventoryCheckPage() {
  const [inventoryChecks, setInventoryChecks] = useState<InventoryCheck[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [branchFilter, setBranchFilter] = useState("all")

  useEffect(() => {
    const fetchInventoryChecks = async () => {
      try {
        setLoading(true)
        const result = await getInventoryCheckSessions()

        if (result.success) {
          setInventoryChecks(result.data as InventoryCheck[])
        } else {
          toast.error(result.error || "Không thể lấy danh sách phiếu kiểm hàng")
        }
      } catch (error) {
        console.error("Error fetching inventory checks:", error)
        toast.error("Có lỗi xảy ra khi tải dữ liệu")
      } finally {
        setLoading(false)
      }
    }

    fetchInventoryChecks()
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="secondary">Nháp</Badge>
      case "completed":
        return <Badge variant="default">Đã kiểm</Badge>
      case "balanced":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Đã cân bằng</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const filteredChecks = inventoryChecks.filter((check) => {
    const matchesSearch = check.session_code.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || check.status === statusFilter
    const matchesBranch = branchFilter === "all" || check.branch_name === branchFilter
    return matchesSearch && matchesStatus && matchesBranch
  })

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Đang tải danh sách phiếu kiểm hàng...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tất cả phiếu kiểm hàng</h1>
          <p className="text-muted-foreground">Quản lý và theo dõi các phiếu kiểm hàng</p>
        </div>
        <Link href="/inventory-check/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Tạo phiếu kiểm
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm theo mã phiếu kiểm hàng"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="draft">Nháp</SelectItem>
                <SelectItem value="completed">Đã kiểm</SelectItem>
                <SelectItem value="balanced">Đã cân bằng</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Ngày tạo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="today">Hôm nay</SelectItem>
                <SelectItem value="week">Tuần này</SelectItem>
                <SelectItem value="month">Tháng này</SelectItem>
              </SelectContent>
            </Select>
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Chi nhánh" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả chi nhánh</SelectItem>
                {Array.from(new Set(inventoryChecks.map((check) => check.branch_name))).map((branch) => (
                  <SelectItem key={branch} value={branch}>
                    {branch}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox />
                </TableHead>
                <TableHead>Mã phiếu kiểm</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead>Ngày cân bằng</TableHead>
                <TableHead>Nhân viên tạo</TableHead>
                <TableHead>Nhân viên kiểm</TableHead>
                <TableHead>Nhân viên cân bằng</TableHead>
                <TableHead>Ghi chú</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredChecks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    {searchTerm || statusFilter !== "all" || branchFilter !== "all"
                      ? "Không tìm thấy phiếu kiểm hàng nào phù hợp"
                      : "Chưa có phiếu kiểm hàng nào"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredChecks.map((check) => (
                  <TableRow key={check.id} className="hover:bg-muted/50">
                    <TableCell>
                      <Checkbox />
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/inventory-check/${check.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {check.session_code}
                      </Link>
                    </TableCell>
                    <TableCell>{getStatusBadge(check.status)}</TableCell>
                    <TableCell>{formatDate(check.created_at)}</TableCell>
                    <TableCell>{formatDate(check.balanced_at || "")}</TableCell>
                    <TableCell>{check.staff_name}</TableCell>
                    <TableCell>{check.staff_name}</TableCell>
                    <TableCell>{check.balanced_by || "-"}</TableCell>
                    <TableCell>{check.notes || "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Hiển thị {filteredChecks.length} kết quả trên tổng {inventoryChecks.length}
        </p>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" disabled>
            Trước
          </Button>
          <Button variant="outline" size="sm" className="bg-blue-600 text-white">
            1
          </Button>
          <Button variant="outline" size="sm" disabled>
            Sau
          </Button>
        </div>
      </div>
    </div>
  )
}
