"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DateRangePicker } from "@/components/date-range-picker"
import { formatShortDate, formatCompactPrice } from "@/lib/utils"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Line, LineChart } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import {
  getSalesSummary,
  getTopSellingProducts,
  getSalesByPaymentMethod,
  getSalesByCustomer,
  getSalesTrend,
  getGrossProfitByProduct,
  getGrossProfitByCategory,
  getGrossProfitByOrder,
} from "@/lib/services/reports"
import {
  getStartOfDay,
  getEndOfDay,
  getStartOfMonth,
  getEndOfMonth,
  getStartOfYear,
  getEndOfYear,
  getStartOfWeek,
  getEndOfWeek,
} from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { DateRange } from "react-day-picker"

type TimeRange = "today" | "week" | "month" | "year" | "custom"

export default function ReportsPage() {
  const { toast } = useToast()
  const [dateRange, setDateRange] = useState<DateRange>({
    from: getStartOfMonth(new Date()),
    to: getEndOfMonth(new Date()),
  })

  const handleDateChange = (date: DateRange | undefined) => {
    setDateRange(date || { from: undefined, to: undefined })
  }
  const [timeRange, setTimeRange] = useState<TimeRange>("month")
  const [loading, setLoading] = useState(true)
  const [salesSummary, setSalesSummary] = useState({
    totalSales: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    totalRefunds: 0,
  })
  const [topProducts, setTopProducts] = useState<
    { product_name: string; total_quantity_sold: number; total_sales_amount: number }[]
  >([])
  const [salesByPayment, setSalesByPayment] = useState<{ payment_method: string; total_amount: number }[]>([])
  const [salesByCustomer, setSalesByCustomer] = useState<
    { customer_name: string; total_orders: number; total_spent: number }[]
  >([])
  const [salesTrend, setSalesTrend] = useState<{ date: string; total_sales: number }[]>([])
  const [productGrossProfit, setProductGrossProfit] = useState<
    {
      product_name: string
      sku: string | null
      total_quantity_sold: number
      total_revenue: number
      total_gross_profit: number
    }[]
  >([])
  const [categoryGrossProfit, setCategoryGrossProfit] = useState<
    { category_name: string | null; total_gross_profit: number }[]
  >([])
  const [grossProfitPerOrder, setGrossProfitPerOrder] = useState<
    { order_number: string; total_gross_profit: number; total_amount: number }[]
  >([])

  const fetchData = useCallback(
    async (from: Date | undefined, to: Date | undefined) => {
      setLoading(true)
      try {
        const [summary, products, paymentMethods, customers, trend, prodGrossProfit, catGrossProfit, orderGrossProfit] =
          await Promise.all([
            getSalesSummary(from, to),
            getTopSellingProducts(5),
            getSalesByPaymentMethod(from, to),
            getSalesByCustomer(undefined, from, to),
            getSalesTrend(),
            getGrossProfitByProduct(from, to),
            getGrossProfitByCategory(from, to),
            getGrossProfitByOrder(from, to),
          ])
        setSalesSummary(summary)
        setTopProducts(products)
        setSalesByPayment(paymentMethods)
        setSalesByCustomer(customers)
        setSalesTrend(trend)
        setProductGrossProfit(prodGrossProfit)
        setCategoryGrossProfit(catGrossProfit)
        setGrossProfitPerOrder(orderGrossProfit)

        console.log("[v0] Sales Summary Data:", summary)
        console.log("[v0] Total Refunds:", summary.totalRefunds)
        console.log("[v0] Formatted Total Refunds:", formatCompactPrice(summary.totalRefunds))
        console.log("Fetched Sales Summary:", summary)
        console.log("Fetched Top Products:", products)
        console.log("Fetched Sales By Payment Method:", paymentMethods)
        console.log("Fetched Sales By Customer:", customers)
        console.log("Fetched Sales Trend:", trend)
        console.log("Fetched Product Gross Profit:", prodGrossProfit)
        console.log("Fetched Category Gross Profit:", catGrossProfit)
        console.log("Fetched Gross Profit Per Order:", orderGrossProfit)
      } catch (error) {
        console.error("Failed to fetch report data:", error)
        toast({
          title: "Lỗi",
          description: "Không thể tải dữ liệu báo cáo.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    },
    [toast],
  )

  useEffect(() => {
    fetchData(dateRange.from, dateRange.to)
  }, [dateRange, fetchData])

  const handleTimeRangeChange = (value: TimeRange) => {
    setTimeRange(value)
    const now = new Date()
    let newFrom: Date | undefined
    let newTo: Date | undefined

    switch (value) {
      case "today":
        newFrom = getStartOfDay(now)
        newTo = getEndOfDay(now)
        break
      case "week":
        newFrom = getStartOfWeek(now)
        newTo = getEndOfWeek(now)
        break
      case "month":
        newFrom = getStartOfMonth(now)
        newTo = getEndOfMonth(now)
        break
      case "year":
        newFrom = getStartOfYear(now)
        newTo = getEndOfYear(now)
        break
      case "custom":
      default:
        newFrom = dateRange.from || getStartOfMonth(now)
        newTo = dateRange.to || getEndOfMonth(now)
        break
    }
    setDateRange({ from: newFrom, to: newTo })
  }

  const chartConfigSalesTrend = {
    total_sales: {
      label: "Doanh số",
      color: "hsl(var(--chart-2))",
    },
  } as const

  const chartConfigPaymentMethods = {
    total_amount: {
      label: "Tổng tiền",
      color: "hsl(var(--chart-2))",
    },
  } as const

  const chartConfigGrossProfitPerOrder = {
    total_gross_profit: {
      label: "Lợi nhuận gộp",
      color: "hsl(var(--chart-2))",
    },
    total_amount: {
      label: "Tổng doanh số",
      color: "hsl(var(--chart-1))",
    },
  } as const

  const salesTrendChartData = useMemo(() => {
    const sortedData = [...salesTrend].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    return sortedData.map((item) => ({
      ...item,
      date: formatShortDate(item.date), // item.date will now be YYYY-MM-DD
    }))
  }, [salesTrend])

  const paymentMethodsChartData = useMemo(() => {
    return salesByPayment.map((item) => ({
      ...item,
      payment_method: item.payment_method || "Không xác định",
    }))
  }, [salesByPayment])

  const grossProfitPerOrderChartData = useMemo(() => {
    const sortedData = [...grossProfitPerOrder].sort((a, b) => b.total_gross_profit - a.total_gross_profit)
    return sortedData.slice(0, 20)
  }, [grossProfitPerOrder])

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Báo cáo & Phân tích</h1>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Chọn khoảng thời gian" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hôm nay</SelectItem>
              <SelectItem value="week">Tuần này</SelectItem>
              <SelectItem value="month">Tháng này</SelectItem>
              <SelectItem value="year">Năm nay</SelectItem>
              <SelectItem value="custom">Tùy chỉnh</SelectItem>
            </SelectContent>
          </Select>
          {timeRange === "custom" && <DateRangePicker date={dateRange} setDate={handleDateChange} />}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="ml-2 text-gray-600">Đang tải báo cáo...</p>
        </div>
      ) : (
        <>
          {/* Dashboard grid layout with 6 KPI cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
            {/* Card 1: Doanh thu của hàng với biểu đồ kết hợp */}
            <Card className="col-span-full lg:col-span-2">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-medium text-muted-foreground">DOANH THU CỦA HÀNG</CardTitle>
                    <p className="text-xs text-muted-foreground">7 ngày qua</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCompactPrice(salesSummary.totalSales)}
                    </div>
                  </div>
                </div>
                <Select defaultValue="revenue">
                  <SelectTrigger className="w-[140px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="revenue">Theo ngày giao hàng</SelectItem>
                    <SelectItem value="orders">Theo đơn hàng</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfigSalesTrend} className="h-[200px] w-full">
                  <BarChart data={salesTrendChartData}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={(value) => formatCompactPrice(value)}
                    />
                    <ChartTooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-3 border rounded-lg shadow-lg">
                              <p className="font-medium">{`${label}`}</p>
                              <p className="text-blue-600">
                                <span className="inline-block w-3 h-3 bg-blue-600 rounded-full mr-2"></span>
                                Doanh thu: {formatCompactPrice(payload[0].value)}
                              </p>
                              <p className="text-green-600">
                                <span className="inline-block w-3 h-3 bg-green-600 rounded-full mr-2"></span>
                                Lợi nhuận: {formatCompactPrice(payload[0].value * 0.2)} {/* Mock profit calculation */}
                              </p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Bar dataKey="total_sales" fill="hsl(var(--chart-2))" radius={4} />
                  </BarChart>
                </ChartContainer>
                <div className="flex items-center gap-4 mt-2 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-600 rounded-sm"></div>
                    <span>Doanh thu</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-600 rounded-sm"></div>
                    <span>Lợi nhuận</span>
                  </div>
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="w-full h-8 mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Chọn loại báo cáo</SelectItem>
                    <SelectItem value="revenue">Báo cáo doanh thu</SelectItem>
                    <SelectItem value="profit">Báo cáo lợi nhuận</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-1 mt-2 text-xs text-yellow-600">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span>Gợi ý</span>
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Thông tin giao hàng với donut chart */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-medium text-muted-foreground">THÔNG TIN GIAO HÀNG</CardTitle>
                    <p className="text-xs text-muted-foreground">7 ngày qua</p>
                  </div>
                </div>
                <Select defaultValue="status">
                  <SelectTrigger className="w-full h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="status">Theo tình trạng</SelectItem>
                    <SelectItem value="area">Theo khu vực</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="relative w-32 h-32 mb-4">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="16"
                      fill="transparent"
                      className="text-gray-200"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="hsl(var(--chart-1))"
                      strokeWidth="16"
                      fill="transparent"
                      strokeDasharray={`${2 * Math.PI * 56}`}
                      strokeDashoffset={`${2 * Math.PI * 56 * 0.2}`}
                      className="transition-all duration-300"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold">{salesSummary.totalOrders}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "hsl(var(--chart-1))" }}></div>
                  <span>Đã giao hàng</span>
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="w-full h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Chọn loại báo cáo</SelectItem>
                    <SelectItem value="delivered">Đã giao hàng</SelectItem>
                    <SelectItem value="pending">Đang giao</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-1 mt-2 text-xs text-yellow-600">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span>Gợi ý</span>
                </div>
              </CardContent>
            </Card>

            {/* Cards 3-6: Các KPI cards nhỏ với navigation links */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">TRẢ HÀNG</CardTitle>
                <p className="text-xs text-muted-foreground">7 ngày qua</p>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCompactPrice(salesSummary.totalRefunds || 0)}
                </div>
                <div className="space-y-2 mt-4 text-sm text-muted-foreground">
                  <Link
                    href="/reports/returns/by-order"
                    className="flex items-center gap-2 hover:text-primary transition-colors"
                  >
                    <div className="w-4 h-4 bg-gray-100 rounded flex items-center justify-center">
                      <div className="w-2 h-2 bg-gray-400 rounded"></div>
                    </div>
                    <span>Trả hàng theo đơn hàng</span>
                  </Link>
                  <Link
                    href="/reports/returns/by-product"
                    className="flex items-center gap-2 hover:text-primary transition-colors"
                  >
                    <div className="w-4 h-4 bg-gray-100 rounded flex items-center justify-center">
                      <div className="w-2 h-2 bg-gray-400 rounded"></div>
                    </div>
                    <span>Trả hàng theo sản phẩm</span>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">THANH TOÁN</CardTitle>
                <p className="text-xs text-muted-foreground">7 ngày qua</p>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCompactPrice((salesSummary.totalSales || 0) - (salesSummary.totalRefunds || 0))}
                </div>
                <div className="space-y-2 mt-4 text-sm text-muted-foreground">
                  <Link
                    href="/reports/payments/by-time"
                    className="flex items-center gap-2 hover:text-primary transition-colors"
                  >
                    <div className="w-4 h-4 bg-gray-100 rounded flex items-center justify-center">
                      <div className="w-2 h-2 bg-gray-400 rounded"></div>
                    </div>
                    <span>Báo cáo thanh toán theo thời gian</span>
                  </Link>
                  <Link
                    href="/reports/payments/by-staff"
                    className="flex items-center gap-2 hover:text-primary transition-colors"
                  >
                    <div className="w-4 h-4 bg-gray-100 rounded flex items-center justify-center">
                      <div className="w-2 h-2 bg-gray-400 rounded"></div>
                    </div>
                    <span>Báo cáo thanh toán theo nhân viên</span>
                  </Link>
                  <Link
                    href="/reports/payments/by-method"
                    className="flex items-center gap-2 hover:text-primary transition-colors"
                  >
                    <div className="w-4 h-4 bg-gray-100 rounded flex items-center justify-center">
                      <div className="w-2 h-2 bg-gray-400 rounded"></div>
                    </div>
                    <span>Báo cáo theo phương thức thanh toán</span>
                  </Link>
                  <Link
                    href="/reports/payments/by-branch"
                    className="flex items-center gap-2 hover:text-primary transition-colors"
                  >
                    <div className="w-4 h-4 bg-gray-100 rounded flex items-center justify-center">
                      <div className="w-2 h-2 bg-gray-400 rounded"></div>
                    </div>
                    <span>Báo cáo thanh toán theo chi nhánh</span>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">ĐƠN HÀNG</CardTitle>
                <p className="text-xs text-muted-foreground">7 ngày qua</p>
                <div className="flex items-center gap-1">
                  <span className="bg-red-500 text-white text-xs px-1 rounded">MỚI</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{salesSummary.totalOrders}</div>
                <div className="space-y-2 mt-4 text-sm text-muted-foreground">
                  <Link
                    href="/reports/orders/statistics"
                    className="flex items-center gap-2 hover:text-primary transition-colors"
                  >
                    <div className="w-4 h-4 bg-gray-100 rounded flex items-center justify-center">
                      <div className="w-2 h-2 bg-gray-400 rounded"></div>
                    </div>
                    <span>Báo cáo thống kê theo đơn hàng</span>
                  </Link>
                  <Link
                    href="/reports/orders/by-product"
                    className="flex items-center gap-2 hover:text-primary transition-colors"
                  >
                    <div className="w-4 h-4 bg-gray-100 rounded flex items-center justify-center">
                      <div className="w-2 h-2 bg-gray-400 rounded"></div>
                    </div>
                    <span>Báo cáo thống kê theo sản phẩm</span>
                  </Link>
                  <Link
                    href="/reports/sales/detailed"
                    className="flex items-center gap-2 hover:text-primary transition-colors"
                  >
                    <div className="w-4 h-4 bg-gray-100 rounded flex items-center justify-center">
                      <div className="w-2 h-2 bg-gray-400 rounded"></div>
                    </div>
                    <span>Báo cáo bán hàng chi tiết</span>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs chi tiết bên dưới */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
              <TabsTrigger value="overview">Tổng quan</TabsTrigger>
              <TabsTrigger value="products">Sản phẩm</TabsTrigger>
              <TabsTrigger value="customers">Khách hàng</TabsTrigger>
              <TabsTrigger value="profit">Lợi nhuận</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tổng doanh số</CardTitle>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-muted-foreground"
                  >
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCompactPrice(salesSummary.totalSales)}</div>
                  <p className="text-xs text-muted-foreground">Tổng doanh số trong khoảng thời gian đã chọn</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tổng đơn hàng</CardTitle>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-muted-foreground"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{salesSummary.totalOrders}</div>
                  <p className="text-xs text-muted-foreground">Tổng số đơn hàng đã tạo</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Giá trị đơn hàng TB</CardTitle>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-muted-foreground"
                  >
                    <rect width="20" height="14" x="2" y="6" rx="2" />
                    <path d="M2 10h20" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCompactPrice(salesSummary.averageOrderValue)}</div>
                  <p className="text-xs text-muted-foreground">Giá trị trung bình mỗi đơn hàng</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tổng tiền hoàn</CardTitle>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-muted-foreground"
                  >
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCompactPrice(salesSummary.totalRefunds || 0)}</div>
                  <p className="text-xs text-muted-foreground">Tổng số tiền đã hoàn trả</p>
                </CardContent>
              </Card>

              <Card className="col-span-full lg:col-span-2">
                <CardHeader>
                  <CardTitle>Xu hướng doanh số</CardTitle>
                  <CardDescription>Doanh số theo ngày trong khoảng thời gian đã chọn.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfigSalesTrend} className="min-h-[200px] w-full">
                    <LineChart
                      accessibilityLayer
                      data={salesTrendChartData}
                      margin={{
                        left: 12,
                        right: 12,
                      }}
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(value) => value}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(value) => formatCompactPrice(value)}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel formatter={(value) => formatCompactPrice(value as number)} />}
                      />
                      <Line
                        dataKey="total_sales"
                        type="monotone"
                        stroke="var(--color-total_sales)"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card className="col-span-full lg:col-span-2">
                <CardHeader>
                  <CardTitle>Doanh số theo phương thức thanh toán</CardTitle>
                  <CardDescription>Phân tích doanh số theo các phương thức thanh toán.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfigPaymentMethods} className="min-h-[200px] w-full">
                    <BarChart data={paymentMethodsChartData}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="payment_method" tickLine={false} tickMargin={10} axisLine={false} />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(value) => formatCompactPrice(value)}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel formatter={(value) => formatCompactPrice(value as number)} />}
                      />
                      <Bar dataKey="total_amount" fill="var(--color-total_amount)" radius={4} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="products" className="mt-4 grid gap-4 md:grid-cols-2">
              <Card className="col-span-full">
                <CardHeader>
                  <CardTitle>Sản phẩm bán chạy nhất</CardTitle>
                  <CardDescription>Top 10 sản phẩm bán chạy nhất theo số lượng.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Sản phẩm</TableHead>
                          <TableHead className="text-right">SL Bán</TableHead>
                          <TableHead className="text-right">Doanh số</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topProducts.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-4 text-gray-500">
                              Không có dữ liệu sản phẩm bán chạy.
                            </TableCell>
                          </TableRow>
                        ) : (
                          topProducts.map((product, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{product.product_name}</TableCell>
                              <TableCell className="text-right">{product.total_quantity_sold}</TableCell>
                              <TableCell className="text-right">
                                {formatCompactPrice(product.total_sales_amount)}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card className="col-span-full">
                <CardHeader>
                  <CardTitle>Lợi nhuận gộp theo sản phẩm</CardTitle>
                  <CardDescription>Lợi nhuận gộp của từng sản phẩm trong khoảng thời gian đã chọn.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Sản phẩm</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead className="text-right">SL Bán</TableHead>
                          <TableHead className="text-right">Doanh số</TableHead>
                          <TableHead className="text-right">Lợi nhuận gộp</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {productGrossProfit.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                              Không có dữ liệu lợi nhuận gộp theo sản phẩm.
                            </TableCell>
                          </TableRow>
                        ) : (
                          productGrossProfit.map((product, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{product.product_name}</TableCell>
                              <TableCell>{product.sku || "N/A"}</TableCell>
                              <TableCell className="text-right">{product.total_quantity_sold}</TableCell>
                              <TableCell className="text-right">{formatCompactPrice(product.total_revenue)}</TableCell>
                              <TableCell className="text-right">
                                {formatCompactPrice(product.total_gross_profit)}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="customers" className="mt-4 grid gap-4">
              <Card className="col-span-full">
                <CardHeader>
                  <CardTitle>Doanh số theo khách hàng</CardTitle>
                  <CardDescription>Top 10 khách hàng chi tiêu nhiều nhất.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Khách hàng</TableHead>
                          <TableHead className="text-right">Tổng đơn</TableHead>
                          <TableHead className="text-right">Tổng chi tiêu</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {salesByCustomer.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-4 text-gray-500">
                              Không có dữ liệu khách hàng.
                            </TableCell>
                          </TableRow>
                        ) : (
                          salesByCustomer.map((customer, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{customer.customer_name || "Khách lẻ"}</TableCell>
                              <TableCell className="text-right">{customer.total_orders}</TableCell>
                              <TableCell className="text-right">{formatCompactPrice(customer.total_spent)}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="profit" className="mt-4 grid gap-4 md:grid-cols-2">
              <Card className="col-span-full">
                <CardHeader>
                  <CardTitle>Lợi nhuận gộp theo danh mục</CardTitle>
                  <CardDescription>
                    Lợi nhuận gộp của từng danh mục sản phẩm trong khoảng thời gian đã chọn.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Danh mục</TableHead>
                          <TableHead className="text-right">Lợi nhuận gộp</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {categoryGrossProfit.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={2} className="text-center py-4 text-gray-500">
                              Không có dữ liệu lợi nhuận gộp theo danh mục.
                            </TableCell>
                          </TableRow>
                        ) : (
                          categoryGrossProfit.map((category, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">
                                {category.category_name || "Không danh mục"}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCompactPrice(category.total_gross_profit)}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card className="col-span-full">
                <CardHeader>
                  <CardTitle>Lợi nhuận gộp theo đơn hàng</CardTitle>
                  <CardDescription>
                    Lợi nhuận gộp của từng đơn hàng trong khoảng thời gian đã chọn (Top 20).
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfigGrossProfitPerOrder} className="min-h-[300px] w-full">
                    <BarChart
                      accessibilityLayer
                      data={grossProfitPerOrderChartData}
                      margin={{
                        left: 12,
                        right: 12,
                      }}
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="order_number"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        angle={-45}
                        textAnchor="end"
                        interval={0}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(value) => formatCompactPrice(value)}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={
                          <ChartTooltipContent
                            formatter={(value, name) => {
                              if (name === "total_gross_profit") {
                                return [formatCompactPrice(value as number), "Lợi nhuận gộp"]
                              }
                              if (name === "total_amount") {
                                return [formatCompactPrice(value as number), "Tổng doanh số"]
                              }
                              return [value, name]
                            }}
                            labelFormatter={(label) => `Đơn hàng: ${label}`}
                          />
                        }
                      />
                      <Bar dataKey="total_gross_profit" fill="var(--color-total_gross_profit)" radius={4} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </main>
  )
}
