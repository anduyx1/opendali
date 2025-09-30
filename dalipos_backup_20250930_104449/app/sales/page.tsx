"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Monitor, ArrowRight, ShoppingCart, Users, Package } from "lucide-react"
import Link from "next/link"

export default function SalesPage() {
  const features = [
    {
      icon: Monitor,
      title: "Giao diện POS toàn màn hình",
      description: "Trải nghiệm bán hàng tối ưu với giao diện chuyên nghiệp",
    },
    {
      icon: ShoppingCart,
      title: "Giỏ hàng thông minh",
      description: "Quản lý đơn hàng dễ dàng với tính năng cập nhật real-time",
    },
    {
      icon: Users,
      title: "Quản lý khách hàng",
      description: "Tích hợp thông tin khách hàng và lịch sử mua hàng",
    },
    {
      icon: Package,
      title: "Kiểm soát tồn kho",
      description: "Theo dõi số lượng sản phẩm và cảnh báo hết hàng",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Quản lý bán hàng</h1>
        <p className="text-muted-foreground">Sử dụng hệ thống POS chuyên nghiệp để bán hàng hiệu quả</p>
      </div>

      {/* Main POS Card */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <Monitor className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-xl md:text-2xl">Hệ thống POS - Điểm bán hàng</CardTitle>
          <p className="text-muted-foreground">
            Giao diện toàn màn hình được tối ưu cho việc bán hàng nhanh chóng và chính xác
          </p>
        </CardHeader>
        <CardContent className="text-center">
          <Link href="/pos" target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="text-lg px-6 py-3 w-full sm:w-auto">
              Mở POS
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Features Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {features.map((feature, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <feature.icon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Thao tác nhanh</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <Link href="/products" className="w-full">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Package className="mr-2 h-4 w-4" />
                Quản lý sản phẩm
              </Button>
            </Link>
            <Link href="/customers" className="w-full">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Users className="mr-2 h-4 w-4" />
                Quản lý khách hàng
              </Button>
            </Link>
            <Link href="/reports" className="w-full">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Xem báo cáo
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
