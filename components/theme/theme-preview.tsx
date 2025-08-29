"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { ColorPalette } from "@/lib/types/theme"

interface ThemePreviewProps {
  colors: ColorPalette
  className?: string
}

export function ThemePreview({ colors, className }: ThemePreviewProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Xem trước</CardTitle>
        <CardDescription>Xem theme sẽ trông như thế nào khi áp dụng</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="border rounded-lg overflow-hidden">
            <div
              className="p-3 text-white"
              style={{ backgroundColor: `hsl(${colors.sidebar})`, color: `hsl(${colors.sidebarForeground})` }}
            >
              <div className="font-medium">Menu Sidebar</div>
              <div className="text-sm opacity-80 mt-1">Các mục điều hướng</div>
            </div>

            <div
              className="p-3"
              style={{ backgroundColor: `hsl(${colors.background})`, color: `hsl(${colors.foreground})` }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Button size="sm" style={{ backgroundColor: `hsl(${colors.primary})` }}>
                  Nút Chính
                </Button>
                <Button variant="outline" size="sm">
                  Nút Phụ
                </Button>
              </div>

              <div className="flex gap-1 mb-3">
                <Badge style={{ backgroundColor: `hsl(${colors.chart1})` }}>Biểu đồ 1</Badge>
                <Badge style={{ backgroundColor: `hsl(${colors.chart2})` }}>Biểu đồ 2</Badge>
                <Badge style={{ backgroundColor: `hsl(${colors.chart3})` }}>Biểu đồ 3</Badge>
              </div>

              <div
                className="p-2 rounded text-sm"
                style={{ backgroundColor: `hsl(${colors.muted})`, color: `hsl(${colors.mutedForeground})` }}
              >
                Văn bản nền mờ
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Bảng Màu</h4>
            <div className="grid grid-cols-5 gap-2">
              {Object.entries(colors).map(([key, value]) => (
                <div key={key} className="text-center">
                  <div className="w-full h-8 rounded border mb-1" style={{ backgroundColor: `hsl(${value})` }} />
                  <div className="text-xs text-muted-foreground truncate">{key}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
