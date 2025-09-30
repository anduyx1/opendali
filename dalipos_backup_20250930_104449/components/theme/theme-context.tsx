"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { ThemeConfig, ThemeContextType, ColorPalette } from "@/lib/types/theme"
import { defaultTheme, themePresets } from "@/lib/theme/theme-presets"
import { applyThemeColors, saveThemeToStorage, loadThemeFromStorage } from "@/lib/theme/theme-utils"

/**
 * Context quản lý theme toàn cục của ứng dụng
 * Hỗ trợ theme presets và custom colors
 */
const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: ThemeConfig
}

/**
 * Provider quản lý state và logic cho hệ thống theme
 * - Tự động load theme từ localStorage
 * - Detect dark/light mode từ system
 * - Apply colors động vào CSS variables
 */
export function ThemeProvider({ children, defaultTheme: initialTheme = defaultTheme }: ThemeProviderProps) {
  // State quản lý theme hiện tại
  const [currentTheme, setCurrentTheme] = useState<ThemeConfig>(initialTheme)
  // State quản lý màu sắc tùy chỉnh
  const [customColors, setCustomColors] = useState<Partial<ColorPalette>>({})
  // State theo dõi dark mode
  const [isDark, setIsDark] = useState(false)

  // Effect load theme từ localStorage khi component mount
  useEffect(() => {
    const { themeId, customColors: savedCustomColors } = loadThemeFromStorage()

    // Khôi phục theme đã lưu
    if (themeId) {
      const foundTheme = themePresets.find((theme) => theme.id === themeId)
      if (foundTheme) {
        setCurrentTheme(foundTheme)
      }
    }

    // Khôi phục custom colors đã lưu
    if (savedCustomColors) {
      setCustomColors(savedCustomColors)
    }

    // Detect system dark mode preference
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    setIsDark(mediaQuery.matches)

    // Listen cho thay đổi dark mode
    const handleChange = (e: MediaQueryListEvent) => setIsDark(e.matches)
    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  // Effect apply colors khi theme hoặc dark mode thay đổi
  useEffect(() => {
    const colors = isDark ? currentTheme.colors.dark : currentTheme.colors.light
    const mergedColors = { ...colors, ...customColors }
    applyThemeColors(mergedColors, isDark)
  }, [currentTheme, customColors, isDark])

  /**
   * Thay đổi theme và lưu vào localStorage
   */
  const setTheme = (theme: ThemeConfig) => {
    setCurrentTheme(theme)
    saveThemeToStorage(theme.id, customColors)
  }

  /**
   * Cập nhật một màu tùy chỉnh và lưu vào localStorage
   */
  const updateCustomColor = (key: keyof ColorPalette, value: string) => {
    const newCustomColors = { ...customColors, [key]: value }
    setCustomColors(newCustomColors)
    saveThemeToStorage(currentTheme.id, newCustomColors)
  }

  /**
   * Reset về màu mặc định của theme
   */
  const resetToDefault = () => {
    setCustomColors({})
    saveThemeToStorage(currentTheme.id, {})
  }

  /**
   * Apply custom colors và lưu vào localStorage
   */
  const applyCustomColors = () => {
    const colors = isDark ? currentTheme.colors.dark : currentTheme.colors.light
    const mergedColors = { ...colors, ...customColors }
    applyThemeColors(mergedColors, isDark)
    saveThemeToStorage(currentTheme.id, customColors)
  }

  const value: ThemeContextType = {
    currentTheme,
    customColors,
    setTheme,
    updateCustomColor,
    resetToDefault,
    applyCustomColors,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

/**
 * Hook để sử dụng Theme Context
 * Throw error nếu sử dụng ngoài ThemeProvider
 */
export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
