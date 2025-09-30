"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { getSalesDataForLast7Days } from "@/lib/services/reports" // Import from reports service
import { formatCompactPrice, formatShortDate } from "@/lib/utils" // Updated import to use formatCompactPrice
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function SalesChart() {
  const { toast } = useToast()
  const [salesData, setSalesData] = useState<{ sale_date: string; total_sales: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSalesData = async () => {
      setLoading(true)
      try {
        const data = await getSalesDataForLast7Days()
        console.log("Fetched sales data for chart:", data) // Log fetched data

        // --- Bổ sung kiểm tra dữ liệu nhận được ---
        if (Array.isArray(data)) {
          setSalesData(data)
        } else {
          // Log chi tiết hơn nếu dữ liệu không phải mảng
          console.error("Lỗi: Dữ liệu doanh số nhận được không phải mảng. Giá trị:", data)
          setSalesData([]) // Đặt là mảng rỗng để tránh lỗi "not iterable"
          toast({
            title: "Lỗi dữ liệu",
            description: "Dữ liệu doanh số nhận được không đúng định dạng. Vui lòng thử lại.",
            variant: "destructive",
          })
        }
        // --- Kết thúc kiểm tra ---
      } catch (error) {
        console.error("Không thể tải dữ liệu doanh số cho biểu đồ:", error)
        toast({
          title: "Lỗi",
          description: "Không thể tải dữ liệu doanh số cho biểu đồ.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    fetchSalesData()
  }, [toast])

  const chartData = useMemo(() => {
    // Dòng này an toàn hơn vì salesData đã được đảm bảo là mảng
    const sortedData = [...salesData].sort((a, b) => {
      // Đảm bảo sale_date có định dạng hợp lệ trước khi phân tích
      const dateA = new Date(a.sale_date).getTime() // Changed this line
      const dateB = new Date(b.sale_date).getTime() // Changed this line
      return dateA - dateB
    })

    return sortedData.map((item) => ({
      ...item,
      sale_date: formatShortDate(item.sale_date), // Format ngày cho hiển thị trên trục X
    }))
  }, [salesData])

  const chartConfig = {
    total_sales: {
      label: "Doanh số",
      color: "hsl(var(--secondary))",
    },
    sale_date: {
      label: "Ngày",
    },
  } as const

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle>Doanh số bán hàng 7 ngày</CardTitle>
        <CardDescription>Doanh số theo ngày</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="ml-2 text-gray-600">Đang tải biểu đồ...</p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
            <BarChart accessibilityLayer data={chartData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="sale_date"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
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
                content={<ChartTooltipContent hideLabel formatter={(value) => formatCompactPrice(value as any)} />}
              />
              <Bar dataKey="total_sales" fill="var(--color-total_sales)" radius={4} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

export default SalesChart
