import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "POS - Hệ thống bán hàng",
  description: "Hệ thống điểm bán hàng chuyên nghiệp",
}

export default function POSLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="min-h-screen bg-gray-50 fixed inset-0 z-50">{children}</div>
}
