"use client"

import { useSidebar } from "@/hooks/use-sidebar"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import MainSidebarContent from "./main-sidebar-content"

export default function MobileSidebar() {
  const { openMobile, setOpenMobile } = useSidebar()

  return (
    <Sheet open={openMobile} onOpenChange={setOpenMobile}>
      <SheetContent
        side="left"
        className="p-0 w-64"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          marginTop: "8px",
        }}
      >
        <SheetTitle className="sr-only">Menu điều hướng</SheetTitle>
        <SheetDescription className="sr-only">Điều hướng chính của ứng dụng.</SheetDescription>
        <MainSidebarContent />
      </SheetContent>
    </Sheet>
  )
}
