import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Monitor, ShoppingCart, Users, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function PosLandingContent() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Main POS System Card */}
      <Card className="text-center py-8 px-4">
        <CardHeader className="pb-4">
          <CardTitle className="text-3xl font-bold">Quản lý bán hàng</CardTitle>
          <CardDescription className="text-lg mt-2">
            Sử dụng hệ thống POS chuyên nghiệp để bán hàng hiệu quả
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          <div className="bg-primary text-primary-foreground rounded-full p-6">
            <Monitor className="h-16 w-16" />
          </div>
          <h2 className="text-2xl font-semibold">Hệ thống POS - Điểm bán hàng</h2>
          <p className="text-muted-foreground max-w-md">
            Giao diện toàn màn hình được tối ưu cho việc bán hàng nhanh chóng và chính xác
          </p>
          <Button asChild className="mt-4 bg-black text-white">
            <Link href="/pos">
              Mở POS <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Feature Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Card 1: Full-screen POS Interface */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <Monitor className="h-8 w-8 text-primary" />
            <CardTitle className="text-xl">Giao diện POS toàn màn hình</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>Trải nghiệm bán hàng tối ưu với giao diện chuyên nghiệp</CardDescription>
          </CardContent>
        </Card>

        {/* Card 2: Smart Shopping Cart */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <ShoppingCart className="h-8 w-8 text-primary" />
            <CardTitle className="text-xl">Giỏ hàng thông minh</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>Quản lý đơn hàng dễ dàng với tính năng cập nhật real-time</CardDescription>
          </CardContent>
        </Card>

        {/* Card 3: Customer Management */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <Users className="h-8 w-8 text-primary" />
            <CardTitle className="text-xl">Quản lý khách hàng</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>Tích hợp thông tin khách hàng và lịch sử mua hàng</CardDescription>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
