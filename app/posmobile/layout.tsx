import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "POS Mobile - Hệ thống bán hàng di động",
  description: "Hệ thống điểm bán hàng chuyên nghiệp tối ưu cho thiết bị di động",
}

export default function POSMobileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="min-h-screen bg-gray-50 fixed inset-0 z-50">{children}</div>
}
