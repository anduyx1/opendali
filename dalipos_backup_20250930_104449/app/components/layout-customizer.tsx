"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Settings, Monitor, RotateCcw, Save, Layout, Maximize2, Grid3X3, Sidebar, ShoppingCart } from "lucide-react"

export interface LayoutConfig {
  headerVisible: boolean
  headerHeight: number
  cartWidth: number
  productGridColumns: number
  searchBarSize: "small" | "medium" | "large"
  cartPosition: "right" | "left" | "bottom"
  productCardSize: "compact" | "normal" | "large"
  showProductImages: boolean
  showProductStock: boolean
  showProductCategory: boolean
}

interface LayoutCustomizerProps {
  config: LayoutConfig
  onConfigChange: (config: LayoutConfig) => void
}

const defaultConfig: LayoutConfig = {
  headerVisible: true,
  headerHeight: 52,
  cartWidth: 384,
  productGridColumns: 0, // 0 = auto
  searchBarSize: "medium",
  cartPosition: "right",
  productCardSize: "normal",
  showProductImages: true,
  showProductStock: true,
  showProductCategory: true,
}

export default function LayoutCustomizer({ config, onConfigChange }: LayoutCustomizerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [tempConfig, setTempConfig] = useState<LayoutConfig>(config)

  const handleSave = () => {
    onConfigChange(tempConfig)
    setIsOpen(false)
    // Lưu vào localStorage
    localStorage.setItem("pos-layout-config", JSON.stringify(tempConfig))
  }

  const handleReset = () => {
    setTempConfig(defaultConfig)
  }

  const updateConfig = (key: keyof LayoutConfig, value: LayoutConfig[keyof LayoutConfig]) => {
    setTempConfig((prev) => ({ ...prev, [key]: value }))
  }

  const presets = [
    {
      name: "Mặc định",
      description: "Layout chuẩn cho màn hình lớn",
      config: defaultConfig,
    },
    {
      name: "Tablet",
      description: "Tối ưu cho màn hình tablet",
      config: {
        ...defaultConfig,
        cartWidth: 320,
        productGridColumns: 3,
        searchBarSize: "small" as const,
        productCardSize: "compact" as const,
      },
    },
    {
      name: "Màn hình nhỏ",
      description: "Dành cho màn hình nhỏ",
      config: {
        ...defaultConfig,
        headerVisible: false,
        cartPosition: "bottom" as const,
        cartWidth: 0,
        productGridColumns: 2,
        productCardSize: "compact" as const,
        showProductCategory: false,
      },
    },
    {
      name: "Tối giản",
      description: "Giao diện tối giản nhất",
      config: {
        ...defaultConfig,
        headerVisible: false,
        cartWidth: 300,
        showProductImages: false,
        showProductCategory: false,
        productCardSize: "compact" as const,
      },
    },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Layout className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Tùy chỉnh giao diện POS
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Presets */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Mẫu có sẵn
            </h3>
            <div className="grid gap-3">
              {presets.map((preset, index) => (
                <div
                  key={index}
                  className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setTempConfig(preset.config)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{preset.name}</h4>
                    <Badge variant="outline" className="text-xs">
                      {preset.name === "Mặc định" ? "Hiện tại" : "Preset"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{preset.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Settings */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Tùy chỉnh chi tiết</h3>

            {/* Header Settings */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Maximize2 className="h-4 w-4" />
                Header
              </h4>

              <div className="flex items-center justify-between">
                <Label htmlFor="header-visible">Hiển thị header</Label>
                <Switch
                  id="header-visible"
                  checked={tempConfig.headerVisible}
                  onCheckedChange={(checked) => updateConfig("headerVisible", checked)}
                />
              </div>

              {tempConfig.headerVisible && (
                <div className="space-y-2">
                  <Label>Chiều cao header: {tempConfig.headerHeight}px</Label>
                  <Slider
                    value={[tempConfig.headerHeight]}
                    onValueChange={([value]) => updateConfig("headerHeight", value)}
                    min={40}
                    max={100}
                    step={4}
                    className="w-full"
                  />
                </div>
              )}
            </div>

            {/* Cart Settings */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Giỏ hàng
              </h4>

              <div className="space-y-2">
                <Label>Vị trí giỏ hàng</Label>
                <Select value={tempConfig.cartPosition} onValueChange={(value) => updateConfig("cartPosition", value as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="right">Bên phải</SelectItem>
                    <SelectItem value="left">Bên trái</SelectItem>
                    <SelectItem value="bottom">Dưới cùng</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {tempConfig.cartPosition !== "bottom" && (
                <div className="space-y-2">
                  <Label>Độ rộng giỏ hàng: {tempConfig.cartWidth}px</Label>
                  <Slider
                    value={[tempConfig.cartWidth]}
                    onValueChange={([value]) => updateConfig("cartWidth", value)}
                    min={280}
                    max={500}
                    step={20}
                    className="w-full"
                  />
                </div>
              )}
            </div>

            {/* Product Grid Settings */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Grid3X3 className="h-4 w-4" />
                Lưới sản phẩm
              </h4>

              <div className="space-y-2">
                <Label>Số cột: {tempConfig.productGridColumns === 0 ? "Tự động" : tempConfig.productGridColumns}</Label>
                <Slider
                  value={[tempConfig.productGridColumns]}
                  onValueChange={([value]) => updateConfig("productGridColumns", value)}
                  min={0}
                  max={8}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>Kích thước card sản phẩm</Label>
                <Select
                  value={tempConfig.productCardSize}
                  onValueChange={(value) => updateConfig("productCardSize", value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compact">Nhỏ gọn</SelectItem>
                    <SelectItem value="normal">Bình thường</SelectItem>
                    <SelectItem value="large">Lớn</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Kích thước thanh tìm kiếm</Label>
                <Select
                  value={tempConfig.searchBarSize}
                  onValueChange={(value) => updateConfig("searchBarSize", value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Nhỏ</SelectItem>
                    <SelectItem value="medium">Vừa</SelectItem>
                    <SelectItem value="large">Lớn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Display Options */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Sidebar className="h-4 w-4" />
                Hiển thị
              </h4>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-images">Hiển thị hình ảnh sản phẩm</Label>
                  <Switch
                    id="show-images"
                    checked={tempConfig.showProductImages}
                    onCheckedChange={(checked) => updateConfig("showProductImages", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="show-stock">Hiển thị số lượng tồn kho</Label>
                  <Switch
                    id="show-stock"
                    checked={tempConfig.showProductStock}
                    onCheckedChange={(checked) => updateConfig("showProductStock", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="show-category">Hiển thị danh mục</Label>
                  <Switch
                    id="show-category"
                    checked={tempConfig.showProductCategory}
                    onCheckedChange={(checked) => updateConfig("showProductCategory", checked)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-6 border-t">
          <Button variant="outline" onClick={handleReset} className="flex-1 bg-transparent">
            <RotateCcw className="mr-2 h-4 w-4" />
            Đặt lại mặc định
          </Button>
          <Button onClick={handleSave} className="flex-1">
            <Save className="mr-2 h-4 w-4" />
            Lưu thay đổi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Hook để load config từ localStorage
export function useLayoutConfig(): [LayoutConfig, (config: LayoutConfig) => void] {
  const [config, setConfig] = useState<LayoutConfig>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("pos-layout-config")
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch {
          return defaultConfig
        }
      }
    }
    return defaultConfig
  })

  const updateConfig = (newConfig: LayoutConfig) => {
    setConfig(newConfig)
    if (typeof window !== "undefined") {
      localStorage.setItem("pos-layout-config", JSON.stringify(newConfig))
    }
  }

  return [config, updateConfig]
}
