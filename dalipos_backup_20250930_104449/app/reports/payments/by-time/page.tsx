"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Download, Copy, HelpCircle, BarChart3 } from "lucide-react"
import { DateRangePicker } from "@/components/ui/date-range-picker"

interface PaymentData {
  id: string
  date: string
  payment_method: string
  order_code: string
  staff_name: string
  branch_name: string
  customer_name: string
  amount: number
}

interface ChartData {
  date: string
  amount: number
}

export default function PaymentsByTimePage() {
  const [data, setData] = useState<PaymentData[]>([])
  const [chartData, setChartData] = useState<ChartData[]>([])
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
  const [viewType, setViewType] = useState("chart")

  const fetchPaymentData = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/reports/payments/by-time?startDate=${startDate}&endDate=${endDate}&reportType=${reportType}&groupBy=${groupBy}`,
      )
      const result = await response.json()

      const validData = (result.data || []).map((item: PaymentData) => ({
        ...item,
        amount: isNaN(Number(item.amount)) ? 0 : Number(item.amount),
      }))

      const validChartData = (result.chartData || []).map((item: ChartData) => ({
        ...item,
        amount: isNaN(Number(item.amount)) ? 0 : Number(item.amount),
      }))

      setData(validData)
      setChartData(validChartData)
    } catch (error) {
      console.error("Error fetching payment data:", error)
      setData([])
      setChartData([])
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate, reportType, groupBy])

  useEffect(() => {
    fetchPaymentData()
  }, [fetchPaymentData])

  const formatCurrency = (amount: number) => {
    if (isNaN(amount) || amount === null || amount === undefined) {
      return "0"
    }
    return new Intl.NumberFormat("vi-VN").format(amount)
  }

  const totalAmount = data.reduce((sum, item) => {
    const amount = isNaN(Number(item.amount)) ? 0 : Number(item.amount)
    return sum + amount
  }, 0)

  const handleDateChange = (newStartDate: string, newEndDate: string) => {
    setStartDate(newStartDate)
    setEndDate(newEndDate)
  }

  const handleFilter = () => {
    fetchPaymentData()
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <nav className="text-sm text-muted-foreground mb-2">
            <span>Báo cáo</span> / <span className="text-foreground">Thông tin thanh toán</span>
          </nav>
          <h1 className="text-2xl font-semibold">Thông tin thanh toán</h1>
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
                  <SelectItem value="theo-phuong-thuc">Theo phương thức</SelectItem>
                  <SelectItem value="theo-nhan-vien">Theo nhân viên</SelectItem>
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

            <div className="flex items-center gap-2 ml-auto">
              <Button
                variant={viewType === "chart" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewType("chart")}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Biểu đồ cột
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {viewType === "chart" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold text-blue-600">
              {formatCurrency(totalAmount)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), "Tiền đã thanh toán"]}
                    labelStyle={{ color: "#000" }}
                  />
                  <Bar dataKey="amount" fill="hsl(var(--chart-1))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ngày thanh toán</TableHead>
                  <TableHead>Tên phương thức thanh toán</TableHead>
                  <TableHead>Mã đơn hàng</TableHead>
                  <TableHead>Tên nhân viên thanh toán</TableHead>
                  <TableHead>Tên chi nhánh</TableHead>
                  <TableHead>Tên khách hàng</TableHead>
                  <TableHead className="text-right">Tiền đã thanh toán</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Đang tải dữ liệu...
                    </TableCell>
                  </TableRow>
                ) : data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Không có dữ liệu
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    <TableRow className="font-medium bg-muted/50">
                      <TableCell>Tổng</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell className="text-right">{formatCurrency(totalAmount)}</TableCell>
                    </TableRow>
                    {data.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.date}</TableCell>
                        <TableCell>
                          <span className="capitalize">
                            {item.payment_method === "cash"
                              ? "Tiền mặt"
                              : item.payment_method === "bank_transfer"
                                ? "Chuyển khoản"
                                : item.payment_method === "card"
                                  ? "Thẻ"
                                  : "Khác"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-blue-600 hover:underline cursor-pointer">{item.order_code}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-blue-600 hover:underline cursor-pointer">{item.staff_name}</span>
                        </TableCell>
                        <TableCell>{item.branch_name}</TableCell>
                        <TableCell>
                          <span className="text-blue-600 hover:underline cursor-pointer">{item.customer_name}</span>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">Lọc kết quả (1345)</div>
        </CardContent>
      </Card>
    </main>
  )
}
