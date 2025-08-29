"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Store, FileText, Percent, Users, ArrowRightIcon } from "lucide-react"
import { getCurrentUser } from "@/actions/auth"

interface User {
  id: number
  email: string
  full_name: string
  role_id: number
  is_active: boolean
}

interface SettingItem {
  id: string
  title: string
  description: string
  icon: React.ElementType
  href?: string
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const router = useRouter()

  useEffect(() => {
    const fetchUser = async () => {
      console.log("[SettingsPage Client useEffect] Bắt đầu fetch user...")
      try {
        const currentUser = await getCurrentUser()
        console.log("[SettingsPage Client useEffect] Giá trị currentUser sau khi fetch:", currentUser)
        if (!currentUser) {
          console.log("[SettingsPage Client useEffect] currentUser là null/undefined. Đang chuyển hướng client-side.")
          router.push("/login?error=unauthorized")
        } else {
          setUser(currentUser)
          console.log("[SettingsPage Client useEffect] User đã được đặt vào state:", currentUser.email)
        }
      } catch (error: unknown) {
        console.error("[SettingsPage Client useEffect] Lỗi khi fetch user:", error)
        router.push("/login?error=unauthorized")
      } finally {
        setLoading(false)
        console.log("[SettingsPage Client useEffect] Kết thúc fetch user.")
      }
    }

    fetchUser()
  }, [router])

  const [searchTerm, setSearchTerm] = useState("")
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Define the settings items that should be displayed
  const displayedSettings: SettingItem[] = [
    {
      id: "general",
      title: "Cài đặt chung",
      description: "Quản lý thông tin cửa hàng, múi giờ, v.v.",
      icon: Store,
      href: "/settings/general",
    },
    {
      id: "invoice-print-settings",
      title: "Cài đặt hóa đơn & mẫu in",
      description: "Cấu hình thông tin hóa đơn và quản lý mẫu in.",
      icon: FileText,
      href: "/settings/invoice-print-settings",
    },
    {
      id: "tax",
      title: "Cài đặt thuế",
      description: "Cấu hình các loại thuế áp dụng cho sản phẩm và dịch vụ.",
      icon: Percent,
      href: "/settings/tax",
    },
    {
      id: "staff-permissions",
      title: "Nhân viên và phân quyền",
      description: "Quản lý & phân quyền tài khoản nhân viên",
      icon: Users,
      href: "/settings/staff",
    },
  ]

  const filteredSettings = displayedSettings.filter(
    (setting) =>
      setting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      setting.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const renderSettingCard = (item: SettingItem) => {
    const cardContent = (
      <CardContent className="flex flex-col items-start p-4 h-full">
        <div className="flex items-center justify-between w-full mb-2">
          <item.icon className="h-8 w-8 text-blue-600" />
        </div>
        <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
        <p className="text-sm text-muted-foreground flex-1">{item.description}</p>
        <Button asChild variant="outline" className="mt-4 bg-transparent">
          <Link href={item.href || "#"}>
            Đi tới <ArrowRightIcon className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    )

    return (
      <Card key={item.id} className="h-full hover:shadow-md transition-shadow cursor-pointer">
        {cardContent}
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Đang tải cài đặt...</p>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900">
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-50">Cài đặt</h1>
          <div className="relative w-full max-w-xl mx-auto mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Tìm kiếm theo tên cấu hình hoặc chức năng của cấu hình"
              className="pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              ref={searchInputRef}
            />
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{filteredSettings.map(renderSettingCard)}</div>

          {filteredSettings.length === 0 && searchTerm && (
            <div className="text-center py-8 text-muted-foreground">
              <p>
                {'Không tìm thấy cài đặt nào phù hợp với "'}
                {searchTerm}
                {'".'}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
