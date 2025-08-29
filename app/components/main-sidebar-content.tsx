"use client"

import type React from "react"

import { cn } from "@/lib/utils"
import { useSidebar } from "@/hooks/use-sidebar"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Home,
  ShoppingCart,
  Users,
  Package,
  BarChart,
  Settings,
  ClipboardCheck,
  ChevronDown,
  ChevronRight,
  Palette,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import ProfileDropdown from "./profile-dropdown"
import { Button } from "@/components/ui/button"
import { ThemeSettingsModal } from "@/components/theme/theme-settings-modal"
import { useThemeSettings } from "@/hooks/use-theme-settings"

interface SubItem {
  name: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
}

export default function MainSidebarContent() {
  const { setOpenMobile } = useSidebar()
  const pathname = usePathname()
  const [expandedMenus, setExpandedMenus] = useState<string[]>([])
  const { isModalOpen, openThemeSettings, closeThemeSettings } = useThemeSettings()

  const navItems = [
    {
      name: "Tổng Quan",
      href: "/",
      icon: Home,
    },
    {
      name: "Bán Hàng Ở Quầy",
      href: "/sales",
      icon: ShoppingCart,
    },
    {
      name: "Đơn hàng",
      href: "/orders",
      icon: Package,
    },
    {
      name: "Sản phẩm",
      href: "/products",
      icon: Package,
      subItems: [
        {
          name: "Danh sách sản phẩm",
          href: "/products",
        },
        {
          name: "Kiểm hàng",
          href: "/inventory-check",
          icon: ClipboardCheck,
        },
        {
          name: "Nhập hàng",
          href: "/inventory/goods-receipt",
        },
      ],
    },
    {
      name: "Khách hàng",
      href: "/customers",
      icon: Users,
    },
    {
      name: "Báo cáo",
      href: "/reports",
      icon: BarChart,
      subItems: [
        {
          name: "Tổng quan báo cáo",
          href: "/reports",
        },
        {
          name: "Thống kê đơn hàng",
          href: "/reports/orders/statistics",
        },
        {
          name: "Báo cáo sản phẩm",
          href: "/reports/orders/by-product",
        },
        {
          name: "Thanh toán theo thời gian",
          href: "/reports/payments/by-time",
        },
        {
          name: "Thanh toán theo nhân viên",
          href: "/reports/payments/by-staff",
        },
        {
          name: "Thanh toán theo phương thức",
          href: "/reports/payments/by-method",
        },
        {
          name: "Trả hàng theo đơn hàng",
          href: "/reports/returns/by-order",
        },
        {
          name: "Trả hàng theo sản phẩm",
          href: "/reports/returns/by-product",
        },
      ],
    },
    {
      name: "Cài đặt",
      href: "/settings",
      icon: Settings,
    },
  ]

  const toggleSubmenu = (itemName: string) => {
    setExpandedMenus((prev) =>
      prev.includes(itemName) ? prev.filter((name) => name !== itemName) : [...prev, itemName],
    )
  }

  const isSubmenuActive = (subItems: SubItem[]) => {
    return subItems.some((subItem) => pathname === subItem.href || pathname.startsWith(subItem.href + "/"))
  }

  return (
    <>
      <div className="flex h-full max-h-screen flex-col gap-2 bg-sidebar text-sidebar-foreground">
        <div className="flex h-14 items-center border-b border-sidebar-border px-4 lg:h-[60px] lg:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold text-sidebar-foreground hover:text-sidebar-primary transition-colors"
          >
            <ShoppingCart className="h-6 w-6 text-sidebar-primary" />
            <span className="">POS DALI</span>
          </Link>
        </div>
        <ScrollArea className="flex-1">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {navItems.map((item) => (
              <div key={item.name}>
                {item.subItems ? (
                  <div>
                    <button
                      onClick={() => toggleSubmenu(item.name)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground/80 transition-all duration-200 hover:text-sidebar-foreground hover:bg-white/10 hover:shadow-sm",
                        (pathname === item.href || isSubmenuActive(item.subItems)) &&
                          "bg-white/20 text-sidebar-foreground font-medium shadow-sm",
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="flex-1 text-left">{item.name}</span>
                      {expandedMenus.includes(item.name) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    {expandedMenus.includes(item.name) && (
                      <div className="ml-4 mt-1 space-y-1">
                        {item.subItems.map((subItem) => (
                          <Link
                            key={subItem.name}
                            href={subItem.href}
                            className={cn(
                              "flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground/70 transition-all duration-200 hover:text-sidebar-foreground hover:bg-white/10 text-xs hover:shadow-sm",
                              (pathname === subItem.href || pathname.startsWith(subItem.href + "/")) &&
                                "bg-white/20 text-sidebar-foreground font-medium shadow-sm",
                            )}
                            onClick={() => setOpenMobile(false)}
                          >
                            {subItem.icon && <subItem.icon className="h-3 w-3" />}
                            {subItem.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground/80 transition-all duration-200 hover:text-sidebar-foreground hover:bg-white/10 hover:shadow-sm",
                      pathname === item.href && "bg-white/20 text-sidebar-foreground font-medium shadow-sm",
                    )}
                    onClick={() => setOpenMobile(false)}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                )}
              </div>
            ))}
          </nav>
        </ScrollArea>
        <div className="mt-auto p-4 border-t border-sidebar-border space-y-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={openThemeSettings}
            className="w-full justify-start gap-3 text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-white/10"
          >
            <Palette className="h-4 w-4" />
            <span>Cài đặt Theme</span>
          </Button>
          <ProfileDropdown variant="sidebar" />
        </div>
      </div>
      <ThemeSettingsModal open={isModalOpen} onOpenChange={closeThemeSettings} />
    </>
  )
}
