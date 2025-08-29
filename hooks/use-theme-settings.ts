"use client"

import { useState } from "react"
import { useTheme } from "@/components/theme/theme-context"
import type { ColorPalette } from "@/lib/types/theme"

export function useThemeSettings() {
  const theme = useTheme()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const openThemeSettings = () => setIsModalOpen(true)
  const closeThemeSettings = () => setIsModalOpen(false)

  const exportTheme = () => {
    const themeData = {
      theme: theme.currentTheme,
      customColors: theme.customColors,
      timestamp: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(themeData, null, 2)], {
      type: "application/json",
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `theme-${theme.currentTheme.id}-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const importTheme = (file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const result = e.target?.result as string
          const themeData = JSON.parse(result)

          if (themeData.theme && themeData.customColors) {
            theme.setTheme(themeData.theme)

            // Apply custom colors one by one
            Object.entries(themeData.customColors).forEach(([key, value]) => {
              theme.updateCustomColor(key as keyof ColorPalette, value as string)
            })

            resolve()
          } else {
            reject(new Error("Invalid theme file format"))
          }
        } catch (error) {
          reject(error)
        }
      }

      reader.onerror = () => reject(new Error("Failed to read file"))
      reader.readAsText(file)
    })
  }

  return {
    ...theme,
    isModalOpen,
    openThemeSettings,
    closeThemeSettings,
    exportTheme,
    importTheme,
  }
}
