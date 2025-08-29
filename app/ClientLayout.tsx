"use client"

import type React from "react"
import { useEffect } from "react"
import { SidebarProvider } from "@/hooks/use-sidebar"
import { OfflineSyncProvider } from "@/providers/offline-sync-provider"
import Header from "./components/header"
import Sidebar from "./components/sidebar"
import MobileNav from "./components/mobile-nav"
import MobileSidebar from "./components/mobile-sidebar"
import PageHeader from "@/components/ui/page-header"
import { usePathname } from "next/navigation"

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = usePathname()
  const isAuthPage = pathname === "/login" || pathname === "/register"
  const isPosPage = pathname === "/pos" || pathname === "/posmobile"

  useEffect(() => {
    function hideSafariUI() {
      if ((window.navigator as any).standalone) {
        // Đã ở standalone mode (Add to Home Screen)
        document.body.classList.add("ios-standalone")

        // Ngăn chặn Safari navigation xuất hiện
        window.scrollTo(0, 1)
        setTimeout(() => window.scrollTo(0, 0), 0)
      }
    }

    hideSafariUI()

    // Handle route changes
    let currentPath = window.location.pathname
    const checkRouteChange = () => {
      if (window.location.pathname !== currentPath) {
        currentPath = window.location.pathname
        setTimeout(hideSafariUI, 100)
      }
    }

    const interval = setInterval(checkRouteChange, 100)

    // Handle resize and orientation change
    window.addEventListener("resize", hideSafariUI)
    window.addEventListener("orientationchange", () => {
      setTimeout(hideSafariUI, 500)
    })

    return () => {
      clearInterval(interval)
      window.removeEventListener("resize", hideSafariUI)
      window.removeEventListener("orientationchange", hideSafariUI)
    }
  }, [])

  console.log(`[ClientLayout] Pathname: ${pathname} | Is Auth Page: ${isAuthPage}`)

  return (
    <SidebarProvider>
      <OfflineSyncProvider>
        {isAuthPage ? (
          children
        ) : (
          <div className="flex min-h-screen w-full flex-col">
            <Header />
            <MobileSidebar />
            <div className="flex flex-1">
              <Sidebar className="hidden md:block" />
              <main className="flex flex-1 flex-col overflow-hidden md:pl-[var(--sidebar-width)]">
                {!isPosPage && <PageHeader />}
                <div className="flex-1 overflow-auto">{children}</div>
              </main>
            </div>
            <div className="md:hidden">
              <MobileNav />
            </div>
          </div>
        )}
      </OfflineSyncProvider>
    </SidebarProvider>
  )
}
