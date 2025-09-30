"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ThemeSelector } from "./theme-selector"
import { CustomColorEditor } from "./custom-color-editor"
import { ThemePreview } from "./theme-preview"
import { useTheme } from "./theme-context"
import { themePresets } from "@/lib/theme/theme-presets"

interface ThemeSettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ThemeSettingsModal({ open, onOpenChange }: ThemeSettingsModalProps) {
  const { currentTheme, customColors, setTheme, updateCustomColor, resetToDefault, applyCustomColors } = useTheme()
  const [activeTab, setActiveTab] = useState("presets")

  const previewColors = {
    ...currentTheme.colors.light,
    ...customColors,
  }

  const handleThemeSelect = (theme: typeof currentTheme) => {
    setTheme(theme)
    setActiveTab("presets")
  }

  const handleApplyCustomColors = () => {
    applyCustomColors()
    onOpenChange(false)
  }

  const handleReset = () => {
    resetToDefault()
    setActiveTab("presets")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Cài đặt Theme</DialogTitle>
          <DialogDescription>Tùy chỉnh màu sắc và giao diện của ứng dụng theo sở thích của bạn</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="presets">Theme có sẵn</TabsTrigger>
              <TabsTrigger value="custom">Tùy chỉnh màu</TabsTrigger>
              <TabsTrigger value="preview">Xem trước</TabsTrigger>
            </TabsList>

            <div className="mt-4 h-[500px] overflow-y-auto">
              <TabsContent value="presets" className="mt-0">
                <ThemeSelector themes={themePresets} currentTheme={currentTheme} onThemeSelect={handleThemeSelect} />
              </TabsContent>

              <TabsContent value="custom" className="mt-0">
                <CustomColorEditor
                  colors={previewColors}
                  onColorChange={updateCustomColor}
                  onReset={handleReset}
                  onApply={handleApplyCustomColors}
                />
              </TabsContent>

              <TabsContent value="preview" className="mt-0">
                <ThemePreview colors={previewColors} />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset}>
              Đặt lại mặc định
            </Button>
            <Button onClick={handleApplyCustomColors}>Lưu thay đổi</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
