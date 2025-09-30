"use client"
import { useState, useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { ShoppingCart, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/hooks/use-sidebar"

export default function Header() {
  const { toggleSidebar } = useSidebar()
  const [isVisible, setIsVisible] = useState(true)
  const pathname = usePathname()
  const autoHideTimer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const controlHeader = () => {
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
      window.addEventListener("scroll", controlHeader)

      autoHideTimer.current = setTimeout(() => {
        setIsVisible(false)
      }, 3000)

      return () => {
        window.removeEventListener("scroll", controlHeader)
        if (autoHideTimer.current) {
          clearTimeout(autoHideTimer.current)
        }
      }
    }
  }, [])

  const shouldHideOnScroll = pathname !== "/posmobile"

  return (
    <header
      className={`md:hidden fixed top-0 left-0 right-0 z-40 w-full border-b bg-background transition-transform duration-300 ease-in-out ${
        shouldHideOnScroll && !isVisible ? "-translate-y-full" : "translate-y-0"
      }`}
      style={{
        marginTop: isVisible ? "calc(env(safe-area-inset-top) + 2px)" : "0",
        paddingTop: "4px",
        paddingBottom: "4px",
        minHeight: "3.5rem",
        transform:
          shouldHideOnScroll && !isVisible
            ? "translateY(calc(-100% - env(safe-area-inset-top) - 6px))"
            : "translateY(0)",
        transition: "transform 0.3s ease-in-out, margin-top 0.3s ease-in-out",
      }}
    >
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-2">
            <ShoppingCart className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold">POS DALI</span>
          </Link>
          {/* Mobile sidebar toggle */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleSidebar}>
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle Sidebar</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
