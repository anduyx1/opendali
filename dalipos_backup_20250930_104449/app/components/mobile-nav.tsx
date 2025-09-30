"use client"

import { useState, useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import {
  Home,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  Settings,
  Menu,
  Smartphone,
  Monitor,
  Archive,
  Palette,
} from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"
import ProfileDropdown from "./profile-dropdown"
import { ThemeSettingsModal } from "@/components/theme/theme-settings-modal"
import { useThemeSettings } from "@/hooks/use-theme-settings"

const navigation = [
  { name: "Trang chủ", href: "/", icon: Home },
  { name: "POS Desktop", href: "/pos", icon: Monitor },
  { name: "POS Mobile", href: "/posmobile", icon: Smartphone },
  { name: "Đơn hàng", href: "/orders", icon: ShoppingCart },
  { name: "Sản phẩm", href: "/products", icon: Package },
  { name: "Khách hàng", href: "/customers", icon: Users },
  { name: "Kho hàng", href: "/inventory", icon: Archive },
  { name: "Báo cáo", href: "/reports", icon: BarChart3 },
  { name: "Cài đặt", href: "/settings", icon: Settings },
]

export default function MobileNav() {
  const [open, setOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const pathname = usePathname()
  const autoHideTimer = useRef<NodeJS.Timeout | null>(null)
  const { isModalOpen, openThemeSettings, closeThemeSettings } = useThemeSettings()

  useEffect(() => {
    const controlNavbar = () => {
      if (typeof window !== "undefined") {
        const currentScrollY = window.scrollY

        if (autoHideTimer.current) {
          clearTimeout(autoHideTimer.current)
        }

        if (currentScrollY <= 20) {
          setIsVisible(true)
        } else if (currentScrollY > 10) {
          setIsVisible(false)
        }

        if (currentScrollY <= 20) {
          autoHideTimer.current = setTimeout(() => {
            setIsVisible(false)
          }, 3000)
        }
      }
    }

    if (typeof window !== "undefined") {
      window.addEventListener("scroll", controlNavbar)

      autoHideTimer.current = setTimeout(() => {
        setIsVisible(false)
      }, 3000)

      return () => {
        window.removeEventListener("scroll", controlNavbar)
        if (autoHideTimer.current) {
          clearTimeout(autoHideTimer.current)
        }
      }
    }
  }, [])

  if (pathname === "/posmobile") {
    return null
  }

  return (
    <>
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden transition-transform duration-300 ease-in-out ${
          isVisible ? "translate-y-0" : "translate-y-full"
        }`}
        style={{
          marginBottom: "1mm",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div className="grid grid-cols-5 h-16">
          <Link
            href="/"
            className={`flex flex-col items-center justify-center space-y-1 ${
              pathname === "/" ? "text-blue-600 bg-blue-50" : "text-gray-600"
            }`}
          >
            <Home className="h-5 w-5" />
            <span className="text-xs">Tổng Quan</span>
          </Link>

          <Link
            href="/posmobile"
            className={`flex flex-col items-center justify-center space-y-1 ${
              pathname === "/posmobile" ? "text-blue-600 bg-blue-50" : "text-gray-600"
            }`}
          >
            <Monitor className="h-5 w-5" />
            <span className="text-xs">Đặt Hàng</span>
          </Link>

          <Link
            href="/orders"
            className={`flex flex-col items-center justify-center space-y-1 ${
              pathname === "/orders" ? "text-blue-600 bg-blue-50" : "text-gray-600"
            }`}
          >
            <ShoppingCart className="h-5 w-5" />
            <span className="text-xs">Đơn hàng</span>
          </Link>

          <Link
            href="/products"
            className={`flex flex-col items-center justify-center space-y-1 ${
              pathname === "/products" ? "text-blue-600 bg-blue-50" : "text-gray-600"
            }`}
          >
            <Package className="h-5 w-5" />
            <span className="text-xs">Sản phẩm</span>
          </Link>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                className="flex flex-col items-center justify-center space-y-1 h-full text-gray-600"
              >
                <Menu className="h-5 w-5" />
                <span className="text-xs">Thêm</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[60vh]">
              <SheetTitle className="sr-only">Menu Thêm</SheetTitle>
              <div className="flex items-center justify-between p-4 border-b mb-4">
                <div className="flex items-center space-x-3">
                  <ProfileDropdown />
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      openThemeSettings()
                      setOpen(false)
                    }}
                    className="flex items-center space-x-2"
                  >
                    <Palette className="h-4 w-4" />
                    <span className="text-sm">Theme</span>
                  </Button>
                  <ModeToggle />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6">
                {navigation.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                        pathname === item.href ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  )
                })}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <ThemeSettingsModal open={isModalOpen} onOpenChange={closeThemeSettings} />
    </>
  )
}
