"use client"

import * as React from "react"
import { useMobile } from "@/hooks/use-mobile" // Corrected import to useMobile

const SIDEBAR_KEYBOARD_SHORTCUT = "b"

type SidebarContext = {
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContext | null>(null)

export function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }
  return context
}

export const SidebarProvider = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, style, children, ...props }, ref) => {
    const isMobile = useMobile() // Using the correctly imported useMobile
    const [openMobile, setOpenMobile] = React.useState(false)

    // Helper to toggle the sidebar (only affects mobile now)
    const toggleSidebar = React.useCallback(() => {
      setOpenMobile((open) => !open)
    }, [])

    // Adds a keyboard shortcut to toggle the sidebar (only affects mobile now)
    React.useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
          event.preventDefault()
          if (isMobile) {
            // Only toggle on mobile
            toggleSidebar()
          }
        }
      }

      window.addEventListener("keydown", handleKeyDown)
      return () => window.removeEventListener("keydown", handleKeyDown)
    }, [toggleSidebar, isMobile])

    const contextValue = React.useMemo<SidebarContext>(
      () => ({
        openMobile,
        setOpenMobile,
        isMobile,
        toggleSidebar,
      }),
      [openMobile, setOpenMobile, isMobile, toggleSidebar],
    )

    return (
      <SidebarContext.Provider value={contextValue}>
        <div
          style={
            {
              "--sidebar-width": "16rem", // Hardcode width for desktop
              "--sidebar-width-icon": "3rem", // Keep for potential future use or if other components rely on it
              ...style,
            } as React.CSSProperties
          }
          className={className}
          ref={ref}
          {...props}
        >
          {children}
        </div>
      </SidebarContext.Provider>
    )
  },
)
SidebarProvider.displayName = "SidebarProvider"
