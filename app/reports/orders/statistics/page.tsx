"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Download, Copy, HelpCircle } from "lucide-react"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import Link from "next/link"

interface OrderStatistic {
  id: string
  date: string
  order_code: string
  status: string
  product_count: number
  expected_revenue: number
  cash_payment: number
  bank_transfer: number
  online_payment: number
  card_payment: number
  cod_payment: number
  other_ratio: number
  points_used: number
  remaining_payment: number
  expected_cost: number
  max_shipping_fee: number
  expected_profit: number
}

export default function OrdersStatisticsPage() {
  const [data, setData] = useState<OrderStatistic[]>([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState(() => {
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    return sevenDaysAgo.toISOString().split("T")[0]
  })
  const [endDate, setEndDate] = useState(() => {
    const now = new Date()
    return now.toISOString().split("T")[0]
  })
  const [reportType, setReportType] = useState("theo-thoi-gian")
  const [groupBy, setGroupBy] = useState("ngay")

  const fetchOrderStatistics = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/reports/orders/statistics?startDate=${startDate}&endDate=${endDate}&reportType=${reportType}&groupBy=${groupBy}`,
      )
      const result = await response.json()
      setData(result.data || [])
    } catch (error) {
      console.error("Error fetching order statistics:", error)
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate, reportType, groupBy])

  useEffect(() => {
    fetchOrderStatistics()
  }, [fetchOrderStatistics])

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      completed: { label: "Hoàn thành", variant: "default" },
      pending: { label: "Chờ xử lý", variant: "secondary" },
      cancelled: { label: "Đã hủy", variant: "destructive" },
      processing: { label: "Đang xử lý", variant: "outline" },
    }
    const statusInfo = statusMap[status] || { label: status, variant: "outline" as const }
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN").format(amount)
  }

  const totalRevenue = data.reduce((sum, item) => sum + item.expected_revenue, 0)

  const handleDateChange = (newStartDate: string, newEndDate: string) => {
    setStartDate(newStartDate)
    setEndDate(newEndDate)
  }

  const handleFilter = () => {
    fetchOrderStatistics()
  }

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "---"
    return dateString
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <nav className="text-sm text-muted-foreground mb-2">
            <span>Báo cáo</span> / <span className="text-foreground">Báo cáo thống kê đơn hàng</span>
          </nav>
          <h1 className="text-2xl font-semibold">Báo cáo thống kê đơn hàng</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Copy className="h-4 w-4 mr-2" />
            Nhân bản
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Xuất báo cáo
          </Button>
          <Button variant="outline" size="sm">
            <HelpCircle className="h-4 w-4 mr-2" />
            Trợ giúp
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center">
            <DateRangePicker
              label="Khoảng thời gian"
              startDate={startDate}
              endDate={endDate}
              onDateChange={handleDateChange}
              onFilter={handleFilter}
            />

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Loại báo cáo</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="theo-thoi-gian">Theo thời gian</SelectItem>
                  <SelectItem value="theo-san-pham">Theo sản phẩm</SelectItem>
                  <SelectItem value="theo-khach-hang">Theo khách hàng</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Nhóm theo</label>
              <Select value={groupBy} onValueChange={setGroupBy}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ngay">Ngày</SelectItem>
                  <SelectItem value="tuan">Tuần</SelectItem>
                  <SelectItem value="thang">Tháng</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Chi tiết thống kê đơn hàng</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Mã đơn hàng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Số lượng sản phẩm</TableHead>
                  <TableHead className="text-right">Doanh số dự kiến</TableHead>
                  <TableHead className="text-right">Tiền mặt</TableHead>
                  <TableHead className="text-right">Chuyển khoản</TableHead>
                  <TableHead className="text-right">Thanh toán online</TableHead>
                  <TableHead className="text-right">Thẻ</TableHead>
                  <TableHead className="text-right">COD</TableHead>
                  <TableHead className="text-right">Tỷ trọng khác</TableHead>
                  <TableHead className="text-right">Điểm</TableHead>
                  <TableHead className="text-right">Cần lại phải trả</TableHead>
                  <TableHead className="text-right">Tiền vốn dự kiến</TableHead>
                  <TableHead className="text-right">Phí vận chuyển tối đa các sàn</TableHead>
                  <TableHead className="text-right">Lợi nhuận ròng dự kiến</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={16} className="text-center py-8">
                      Đang tải dữ liệu...
                    </TableCell>
                  </TableRow>
                ) : data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={16} className="text-center py-8">
                      Không có dữ liệu
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    <TableRow className="font-medium bg-muted/50">
                      <TableCell>Tổng</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell className="text-right">
                        {data.reduce((sum, item) => sum + item.product_count, 0)}
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(totalRevenue)}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(data.reduce((sum, item) => sum + item.cash_payment, 0))}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(data.reduce((sum, item) => sum + item.bank_transfer, 0))}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(data.reduce((sum, item) => sum + item.online_payment, 0))}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(data.reduce((sum, item) => sum + item.card_payment, 0))}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(data.reduce((sum, item) => sum + item.cod_payment, 0))}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(data.reduce((sum, item) => sum + item.other_ratio, 0))}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(data.reduce((sum, item) => sum + item.points_used, 0))}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(data.reduce((sum, item) => sum + item.remaining_payment, 0))}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(data.reduce((sum, item) => sum + item.expected_cost, 0))}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(data.reduce((sum, item) => sum + item.max_shipping_fee, 0))}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(data.reduce((sum, item) => sum + item.expected_profit, 0))}
                      </TableCell>
                    </TableRow>
                    {data.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{formatDateTime(item.date)}</TableCell>
                        <TableCell>
                          <Link
                            href={`/orders?orderId=${item.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline cursor-pointer hover:text-blue-800 transition-colors"
                          >
                            {item.order_code}
                          </Link>
                        </TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                        <TableCell className="text-right">{item.product_count}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.expected_revenue)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.cash_payment)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.bank_transfer)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.online_payment)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.card_payment)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.cod_payment)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.other_ratio)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.points_used)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.remaining_payment)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.expected_cost)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.max_shipping_fee)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.expected_profit)}</TableCell>
                      </TableRow>
                    ))}
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
