"use client"

import { usePathname } from "next/navigation"
import { useEffect } from "react"

interface PageHeaderProps {
  title?: string
  className?: string
}

const getPageTitle = (pathname: string): string => {
  const routes: Record<string, string> = {
    "/": "Tổng Quan",
    "/orders": "Quản lý Đơn hàng",
    "/products": "Quản lý Sản phẩm",
    "/customers": "Quản lý Khách hàng",
    "/inventory": "Quản lý Kho",
    "/reports": "Báo cáo",
    "/reports/orders/statistics": "Chi tiết thống kê đơn hàng",
    "/reports/orders/by-product": "Báo cáo thống kê sản phẩm",
    "/reports/payments/by-time": "Thông tin thanh toán",
    "/reports/payments/by-staff": "Thanh toán theo nhân viên",
    "/reports/payments/by-method": "Thanh toán theo phương thức",
    "/reports/payments/by-branch": "Thanh toán theo chi nhánh",
    "/reports/returns/by-order": "Trả hàng theo đơn hàng",
    "/reports/returns/by-product": "Trả hàng theo sản phẩm",
    "/reports/sales/detailed": "Báo cáo bán hàng chi tiết",
    "/analytics": "Phân tích dữ liệu",
    "/pos": "Bán hàng",
    "/settings": "Cài đặt",
  }

  return routes[pathname] || "POS DALI"
}

export default function PageHeader({ title, className = "" }: PageHeaderProps) {
  const pathname = usePathname()
  const pageTitle = title || getPageTitle(pathname)

  useEffect(() => {
    document.title = `${pageTitle} - POS DALI`
  }, [pageTitle])

  return (
    <div className={`bg-sidebar text-sidebar-foreground px-6 py-4 border-b border-sidebar-border ${className}`}>
      <h1 className="text-2xl font-semibold">{pageTitle}</h1>
    </div>
  )
}
