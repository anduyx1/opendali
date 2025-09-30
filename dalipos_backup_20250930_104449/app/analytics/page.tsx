"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { KpiCard } from "@/components/reports/kpi-card"
import { CombinedChart } from "@/components/reports/combined-chart"
import { DonutChart } from "@/components/reports/donut-chart"
import { TopProductsTable } from "@/components/reports/top-products-table"
import { TrendingUp, Package, CreditCard, ShoppingCart, RotateCcw, Truck } from "lucide-react"

export default function AnalyticsPage() {
  const [timePeriod, setTimePeriod] = useState("7-days")

  // Mock data cho biểu đồ doanh thu
  const revenueData = [
    { date: "11/08", revenue: 38000000, profit: 4200000 },
    { date: "12/08", revenue: 35000000, profit: 3800000 },
    { date: "13/08", revenue: 25140000, profit: 4415000 },
    { date: "14/08", revenue: 32000000, profit: 3500000 },
    { date: "15/08", revenue: 42000000, profit: 4800000 },
    { date: "16/08", revenue: 28000000, profit: 3200000 },
    { date: "17/08", revenue: 22000000, profit: 2800000 },
  ]

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Báo cáo phân tích</h1>
        <Select value={timePeriod} onValueChange={setTimePeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Chọn thời gian" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7-days">7 ngày qua</SelectItem>
            <SelectItem value="30-days">30 ngày qua</SelectItem>
            <SelectItem value="this-month">Tháng này</SelectItem>
            <SelectItem value="last-month">Tháng trước</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid layout chính */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Card doanh thu với biểu đồ kết hợp */}
        <div className="md:col-span-2">
          <KpiCard
            title="DOANH THU CỦA HÀNG"
            value="210,245,000"
            period="7 ngày qua"
            icon={<TrendingUp className="h-5 w-5" />}
            chart={<CombinedChart data={revenueData} />}
            reportOptions={["Gợi ý", "Doanh thu theo ngày", "Doanh thu theo sản phẩm", "Doanh thu theo nhân viên"]}
          />
        </div>

        {/* Card thông tin giao hàng với donut chart */}
        <KpiCard
          title="THÔNG TIN GIAO HÀNG"
          value="305"
          period="7 ngày qua"
          icon={<Truck className="h-5 w-5" />}
          chart={<DonutChart value={305} total={305} />}
          reportOptions={["Gợi ý", "Theo tình trạng giao hàng", "Theo khu vực", "Theo thời gian"]}
        />

        {/* Card trả hàng */}
        <KpiCard
          title="TRẢ HÀNG"
          value="0"
          period="7 ngày qua"
          icon={<RotateCcw className="h-5 w-5" />}
          reportItems={["Trả hàng theo đơn hàng", "Trả hàng theo sản phẩm"]}
        />

        {/* Card thanh toán */}
        <KpiCard
          title="THANH TOÁN"
          value="209,425,000"
          period="7 ngày qua"
          icon={<CreditCard className="h-5 w-5" />}
          reportItems={[
            "Báo cáo thanh toán theo thời gian",
            "Báo cáo thanh toán theo nhân viên",
            "Báo cáo theo phương thức thanh toán",
            "Báo cáo thanh toán theo chi nhánh",
          ]}
        />

        {/* Card đơn hàng */}
        <KpiCard
          title="ĐƠN HÀNG"
          value="305"
          period="7 ngày qua"
          icon={<ShoppingCart className="h-5 w-5" />}
          badge="MỚI"
          reportItems={[
            "Báo cáo thống kê theo đơn hàng",
            "Báo cáo thống kê theo sản phẩm",
            "Báo cáo bán hàng chi tiết",
          ]}
        />
      </div>

      {/* Bảng sản phẩm bán chạy */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Top sản phẩm bán chạy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TopProductsTable />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hoạt động gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Đơn hàng mới #ORD-001234</p>
                  <p className="text-xs text-muted-foreground">2 phút trước</p>
                </div>
                <span className="text-sm font-medium">1,250,000₫</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Thanh toán hoàn tất #PAY-5678</p>
                  <p className="text-xs text-muted-foreground">5 phút trước</p>
                </div>
                <span className="text-sm font-medium">890,000₫</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-orange-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Nhập hàng mới</p>
                  <p className="text-xs text-muted-foreground">10 phút trước</p>
                </div>
                <span className="text-sm font-medium">50 sản phẩm</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
