"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ColorPicker } from "./color-picker"
import type { ColorPalette } from "@/lib/types/theme"

interface CustomColorEditorProps {
  colors: ColorPalette
  onColorChange: (key: keyof ColorPalette, value: string) => void
  onReset: () => void
  onApply: () => void
  className?: string
}

export function CustomColorEditor({ colors, onColorChange, onReset, onApply, className }: CustomColorEditorProps) {
  const [activeTab, setActiveTab] = useState("primary")

  const colorGroups = {
    primary: {
      title: "Màu chính",
      description: "Màu sắc chính của ứng dụng",
      colors: [
        { key: "primary" as keyof ColorPalette, label: "Màu chính" },
        { key: "secondary" as keyof ColorPalette, label: "Màu phụ" },
        { key: "accent" as keyof ColorPalette, label: "Màu nhấn" },
        { key: "ring" as keyof ColorPalette, label: "Viền focus" },
      ],
    },
    layout: {
      title: "Giao diện",
      description: "Màu nền và văn bản",
      colors: [
        { key: "background" as keyof ColorPalette, label: "Nền" },
        { key: "foreground" as keyof ColorPalette, label: "Văn bản" },
        { key: "muted" as keyof ColorPalette, label: "Nền mờ" },
        { key: "mutedForeground" as keyof ColorPalette, label: "Văn bản mờ" },
        { key: "border" as keyof ColorPalette, label: "Viền" },
        { key: "input" as keyof ColorPalette, label: "Ô nhập" },
      ],
    },
    sidebar: {
      title: "Thanh menu",
      description: "Màu sắc thanh menu bên",
      colors: [
        { key: "sidebar" as keyof ColorPalette, label: "Nền sidebar" },
        { key: "sidebarForeground" as keyof ColorPalette, label: "Văn bản sidebar" },
      ],
    },
    charts: {
      title: "Biểu đồ",
      description: "Màu sắc cho biểu đồ và đồ thị",
      colors: [
        { key: "chart1" as keyof ColorPalette, label: "Biểu đồ 1" },
        { key: "chart2" as keyof ColorPalette, label: "Biểu đồ 2" },
        { key: "chart3" as keyof ColorPalette, label: "Biểu đồ 3" },
        { key: "chart4" as keyof ColorPalette, label: "Biểu đồ 4" },
        { key: "chart5" as keyof ColorPalette, label: "Biểu đồ 5" },
      ],
    },
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Tùy chỉnh màu sắc</CardTitle>
        <CardDescription>Điều chỉnh từng màu sắc theo ý muốn của bạn</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="primary">Chính</TabsTrigger>
            <TabsTrigger value="layout">Giao diện</TabsTrigger>
            <TabsTrigger value="sidebar">Menu</TabsTrigger>
            <TabsTrigger value="charts">Biểu đồ</TabsTrigger>
          </TabsList>

          {Object.entries(colorGroups).map(([key, group]) => (
            <TabsContent key={key} value={key} className="space-y-4">
              <div>
                <h4 className="font-medium mb-1">{group.title}</h4>
                <p className="text-sm text-muted-foreground mb-4">{group.description}</p>
              </div>

              <div className="space-y-4">
                {group.colors.map(({ key: colorKey, label }) => (
                  <ColorPicker
                    key={colorKey}
                    label={label}
                    value={colors[colorKey]}
                    onChange={(value) => onColorChange(colorKey, value)}
                  />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="flex gap-2 mt-6 pt-4 border-t">
          <Button onClick={onApply} className="flex-1">
            Áp dụng thay đổi
          </Button>
          <Button variant="outline" onClick={onReset}>
            Đặt lại
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
