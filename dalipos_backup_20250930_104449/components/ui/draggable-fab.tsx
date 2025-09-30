"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface DraggableFloatingActionButtonProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  size?: "sm" | "default" | "lg"
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
}

export function DraggableFloatingActionButton({
  children,
  onClick,
  className,
  size = "lg",
  variant = "default",
}: DraggableFloatingActionButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onClick) {
      onClick()
    }
  }

  return (
    <Button
      size={size}
      variant={variant}
      className={cn(
        "fixed bottom-20 right-6 z-50 rounded-full shadow-lg hover:shadow-xl transition-all duration-200",
        "hover:scale-105",
        size === "lg" && "w-14 h-14",
        size === "default" && "w-12 h-12",
        size === "sm" && "w-10 h-10",
        className,
      )}
      onClick={handleClick}
    >
      {children}
    </Button>
  )
}
