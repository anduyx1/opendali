"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { ThemeConfig } from "@/lib/types/theme"

interface ThemeSelectorProps {
  themes: ThemeConfig[]
  currentTheme: ThemeConfig
  onThemeSelect: (theme: ThemeConfig) => void
  className?: string
}

export function ThemeSelector({ themes, currentTheme, onThemeSelect, className }: ThemeSelectorProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <h3 className="text-lg font-semibold mb-2">Bộ Theme Có Sẵn</h3>
        <p className="text-sm text-muted-foreground">Chọn một theme có sẵn hoặc tùy chỉnh màu sắc riêng</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {themes.map((theme) => (
          <Card
            key={theme.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              currentTheme.id === theme.id ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => onThemeSelect(theme)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{theme.name}</CardTitle>
                {currentTheme.id === theme.id && (
                  <Badge variant="default" className="text-xs">
                    Đang dùng
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-1 mb-3">
                <div
                  className="w-6 h-6 rounded-sm border"
                  style={{ backgroundColor: `hsl(${theme.colors.light.primary})` }}
                  title="Màu chính"
                />
                <div
                  className="w-6 h-6 rounded-sm border"
                  style={{ backgroundColor: `hsl(${theme.colors.light.chart2})` }}
                  title="Biểu đồ 2"
                />
                <div
                  className="w-6 h-6 rounded-sm border"
                  style={{ backgroundColor: `hsl(${theme.colors.light.chart3})` }}
                  title="Biểu đồ 3"
                />
                <div
                  className="w-6 h-6 rounded-sm border"
                  style={{ backgroundColor: `hsl(${theme.colors.light.chart4})` }}
                  title="Biểu đồ 4"
                />
                <div
                  className="w-6 h-6 rounded-sm border"
                  style={{ backgroundColor: `hsl(${theme.colors.light.chart5})` }}
                  title="Biểu đồ 5"
                />
              </div>

              <Button
                variant={currentTheme.id === theme.id ? "default" : "outline"}
                size="sm"
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation()
                  onThemeSelect(theme)
                }}
              >
                {currentTheme.id === theme.id ? "Đang sử dụng" : "Chọn theme"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
