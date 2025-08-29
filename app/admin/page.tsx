"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { usePermissions } from "@/lib/hooks/use-permissions"
import {
  Users,
  ShoppingCart,
  Package,
  Settings,
  BarChart3,
  Shield,
  Database,
  Activity,
  TrendingUp,
  AlertTriangle,
} from "lucide-react"
import Link from "next/link"

export default function AdminPage() {
  const { user, loading } = usePermissions()

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="h-8 bg-muted animate-pulse rounded" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!user || user.role_name !== "admin") {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto" />
              <h2 className="text-xl font-semibold">Không có quyền truy cập</h2>
              <p className="text-muted-foreground">Bạn cần có quyền quản trị viên để truy cập trang này.</p>
              <Button asChild>
                <Link href="/">Về trang chủ</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const adminCards = [
    {
      title: "Quản lý người dùng",
      description: "Quản lý tài khoản và phân quyền",
      icon: Users,
      href: "/settings/staff",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      count: "12 người dùng",
    },
    {
      title: "Quản lý đơn hàng",
      description: "Theo dõi và xử lý đơn hàng",
      icon: ShoppingCart,
      href: "/orders",
      color: "text-green-600",
      bgColor: "bg-green-50",
      count: "156 đơn hàng",
    },
    {
      title: "Quản lý sản phẩm",
      description: "Thêm, sửa, xóa sản phẩm",
      icon: Package,
      href: "/inventory",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      count: "89 sản phẩm",
    },
    {
      title: "Cài đặt hệ thống",
      description: "Cấu hình và tùy chỉnh hệ thống",
      icon: Settings,
      href: "/settings",
      color: "text-gray-600",
      bgColor: "bg-gray-50",
      count: "15 cài đặt",
    },
    {
      title: "Báo cáo & Thống kê",
      description: "Xem báo cáo doanh thu và thống kê",
      icon: BarChart3,
      href: "/reports",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      count: "8 báo cáo",
    },
    {
      title: "Bảo mật",
      description: "Quản lý bảo mật và quyền truy cập",
      icon: Shield,
      href: "/settings/staff",
      color: "text-red-600",
      bgColor: "bg-red-50",
      count: "5 vai trò",
    },
    {
      title: "Cơ sở dữ liệu",
      description: "Sao lưu và khôi phục dữ liệu",
      icon: Database,
      href: "/debug",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      count: "Hoạt động tốt",
    },
    {
      title: "Hoạt động hệ thống",
      description: "Theo dõi hoạt động và hiệu suất",
      icon: Activity,
      href: "/debug/permissions",
      color: "text-teal-600",
      bgColor: "bg-teal-50",
      count: "99.9% uptime",
    },
  ]

  const stats = [
    {
      title: "Doanh thu hôm nay",
      value: "2,450,000 ₫",
      change: "+12.5%",
      icon: TrendingUp,
      positive: true,
    },
    {
      title: "Đơn hàng mới",
      value: "23",
      change: "+8.2%",
      icon: ShoppingCart,
      positive: true,
    },
    {
      title: "Khách hàng mới",
      value: "12",
      change: "+15.3%",
      icon: Users,
      positive: true,
    },
    {
      title: "Sản phẩm bán chạy",
      value: "45",
      change: "-2.1%",
      icon: Package,
      positive: false,
    },
  ]

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Bảng điều khiển quản trị</h1>
            <p className="text-muted-foreground">Chào mừng trở lại, {user.full_name || user.username}</p>
          </div>
          <Badge variant="default" className="px-3 py-1">
            <Shield className="mr-1 h-3 w-3" />
            Quản trị viên
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className={`text-xs ${stat.positive ? "text-green-600" : "text-red-600"}`}>
                      {stat.change} so với hôm qua
                    </p>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <stat.icon className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Admin Functions */}
        <div>
          <h2 className="text-2xl font-semibold mb-6">Chức năng quản trị</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {adminCards.map((card, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                <Link href={card.href}>
                  <CardHeader className="pb-3">
                    <div className={`w-12 h-12 rounded-lg ${card.bgColor} flex items-center justify-center mb-3`}>
                      <card.icon className={`h-6 w-6 ${card.color}`} />
                    </div>
                    <CardTitle className="text-lg">{card.title}</CardTitle>
                    <CardDescription className="text-sm">{card.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{card.count}</p>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Thao tác nhanh</CardTitle>
            <CardDescription>Các tác vụ thường dùng trong quản trị hệ thống</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/settings/staff">
                  <Users className="mr-2 h-4 w-4" />
                  Thêm người dùng
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/inventory">
                  <Package className="mr-2 h-4 w-4" />
                  Thêm sản phẩm
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/reports">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Xem báo cáo
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Cài đặt hệ thống
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
