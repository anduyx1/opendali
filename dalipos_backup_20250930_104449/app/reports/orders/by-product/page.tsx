"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Copy } from "lucide-react"
import { DateRangePicker } from "@/components/ui/date-range-picker"

interface ProductStatistic {
  id: string
  date: string
  product_name: string
  sku: string
  quantity_sold: number
  revenue: number
  product_discount: number
  allocated_discount: number
  tax: number
  total_amount: number
}

export default function OrdersByProductPage() {
  const [data, setData] = useState<ProductStatistic[]>([])
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

  const fetchProductStatistics = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/reports/orders/by-product?startDate=${startDate}&endDate=${endDate}`)
      const result = await response.json()
      setData(result.data || [])
    } catch (error) {
      console.error("Error fetching product statistics:", error)
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate])

  useEffect(() => {
    fetchProductStatistics()
  }, [fetchProductStatistics])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN").format(amount)
  }

  const handleDateChange = (newStartDate: string, newEndDate: string) => {
    setStartDate(newStartDate)
    setEndDate(newEndDate)
  }

  const handleFilter = () => {
    fetchProductStatistics()
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <nav className="text-sm text-muted-foreground mb-2">
            <span>Báo cáo</span> / <span className="text-foreground">Báo cáo thống kê sản phẩm</span>
          </nav>
          <h1 className="text-2xl font-semibold">Báo cáo thống kê sản phẩm</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Xuất báo cáo
          </Button>
          <Button variant="outline" size="sm">
            <Copy className="h-4 w-4 mr-2" />
            Nhân bản
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <DateRangePicker
              label="Ngày tạo đơn"
              startDate={startDate}
              endDate={endDate}
              onDateChange={handleDateChange}
              onFilter={handleFilter}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="bo-loc" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="bo-loc">Bộ lọc</TabsTrigger>
              <TabsTrigger value="thuoc-tinh">Thuộc tính</TabsTrigger>
            </TabsList>
            <TabsContent value="bo-loc" className="mt-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ngày</TableHead>
                      <TableHead>Tên phiên bản</TableHead>
                      <TableHead>Mã SKU</TableHead>
                      <TableHead className="text-right">Số lượng hàng bán</TableHead>
                      <TableHead className="text-right">Tiền hàng</TableHead>
                      <TableHead className="text-right">Chiết khấu sản phẩm</TableHead>
                      <TableHead className="text-right">Chiết khấu phân bổ</TableHead>
                      <TableHead className="text-right">Thuế</TableHead>
                      <TableHead className="text-right">Thành tiền</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
                          Đang tải dữ liệu...
                        </TableCell>
                      </TableRow>
                    ) : data.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
                          Không có dữ liệu
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <span className="text-blue-600 hover:underline cursor-pointer">thứ năm {item.date}</span>
                          </TableCell>
                          <TableCell>{item.product_name}</TableCell>
                          <TableCell>{item.sku}</TableCell>
                          <TableCell className="text-right">{item.quantity_sold}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.revenue)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.product_discount)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.allocated_discount)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.tax)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.total_amount)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                Hiển thị 1-500 của 500+ kết quả. <span className="font-medium">undefined</span>Xuất tất cả 500+ kết quả
              </div>
            </TabsContent>
            <TabsContent value="thuoc-tinh" className="mt-6">
              <div className="text-center py-8 text-muted-foreground">Chức năng thuộc tính đang được phát triển</div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </main>
  )
}
