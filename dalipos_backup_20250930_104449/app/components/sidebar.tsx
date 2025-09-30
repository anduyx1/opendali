"use client"

import MainSidebarContent from "./main-sidebar-content"
import { cn } from "@/lib/utils"

export default function Sidebar({ className }: { className?: string }) {
  return (
    <aside className={cn("fixed inset-y-0 left-0 z-10 w-[var(--sidebar-width)] border-r bg-sidebar", className)}>
      <MainSidebarContent />
    </aside>
  )
}
