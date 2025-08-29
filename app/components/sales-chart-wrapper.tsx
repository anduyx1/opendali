import SalesChart from "@/app/components/sales-chart"
import { getSalesDataForLast7Days } from "@/lib/services/orders" // Import trực tiếp Server Action
import { Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function SalesChartWrapper() {
  let salesData: any[] = []
  let loading = true
  let error = null

  try {
    salesData = await getSalesDataForLast7Days() // Gọi Server Action
    // Sort data by date to ensure correct order on the chart
    salesData.sort((a, b) => new Date(a.sale_date).getTime() - new Date(b.sale_date).getTime())
    loading = false
  } catch (e) {
    console.error("Failed to fetch sales data in SalesChartWrapper:", e)
    error = "Không thể tải dữ liệu doanh thu."
    loading = false
  }

  if (loading) {
    return (
      <Card className="col-span-full lg:col-span-3">
        <CardHeader>
          <CardTitle>Biểu đồ doanh thu</CardTitle>
          <p className="text-sm text-gray-500">Doanh thu 7 ngày qua</p>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="mt-2 text-gray-600">Đang tải dữ liệu...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="col-span-full lg:col-span-3">
        <CardHeader>
          <CardTitle>Biểu đồ doanh thu</CardTitle>
          <p className="text-sm text-gray-500">Doanh thu 7 ngày qua</p>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-red-500">{error}</p>
        </CardContent>
      </Card>
    )
  }

  return <SalesChart />
}
