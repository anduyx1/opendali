"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"
import { Building2, Save, Upload } from "lucide-react"
import Image from "next/image"

interface BusinessSettings {
  businessName: string
  businessAddress: string
  businessPhone: string
  businessEmail: string
  businessWebsite: string
  businessTaxId: string
  businessLogo: string
  currency: string
  taxRate: number
  enableTax: boolean
  enableDiscount: boolean
  enableCustomerInfo: boolean
  receiptFooter: string
}

export default function GeneralSettingsPage() {
  const [settings, setSettings] = useState<BusinessSettings>({
    businessName: "",
    businessAddress: "",
    businessPhone: "",
    businessEmail: "",
    businessWebsite: "",
    businessTaxId: "",
    businessLogo: "",
    currency: "VND",
    taxRate: 10,
    enableTax: true,
    enableDiscount: true,
    enableCustomerInfo: true,
    receiptFooter: "Cảm ơn quý khách đã mua hàng!",
  })

  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      // Load settings from API
      const response = await fetch("/api/settings/business")
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch {
      console.error("Error loading settings")
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/settings/business", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        toast({
          title: "Thành công",
          description: "Cài đặt đã được lưu thành công",
        })
      } else {
        throw new Error("Failed to save settings")
      }
    } catch {
      toast({
        title: "Lỗi",
        description: "Không thể lưu cài đặt",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Lỗi",
        description: "Chỉ chấp nhận file hình ảnh",
        variant: "destructive",
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Lỗi",
        description: "File không được vượt quá 5MB",
        variant: "destructive",
      })
      return
    }

    const formData = new FormData()
    formData.append("file", file)

    try {
      setIsLoading(true)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setSettings((prev) => ({ ...prev, businessLogo: data.url }))
        toast({
          title: "Thành công",
          description: "Logo đã được tải lên thành công",
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Upload failed")
      }
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể tải lên logo",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-2 mb-6">
        <Building2 className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Cài đặt chung</h1>
      </div>

      <div className="grid gap-6">
        {/* Thông tin doanh nghiệp */}
        <Card>
          <CardHeader>
            <CardTitle>Thông tin doanh nghiệp</CardTitle>
            <CardDescription>Cập nhật thông tin cơ bản của doanh nghiệp</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Tên doanh nghiệp *</Label>
                <Input
                  id="businessName"
                  value={settings.businessName}
                  onChange={(e) => setSettings((prev) => ({ ...prev, businessName: e.target.value }))}
                  placeholder="Nhập tên doanh nghiệp"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessTaxId">Mã số thuế</Label>
                <Input
                  id="businessTaxId"
                  value={settings.businessTaxId}
                  onChange={(e) => setSettings((prev) => ({ ...prev, businessTaxId: e.target.value }))}
                  placeholder="Nhập mã số thuế"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessAddress">Địa chỉ</Label>
              <Textarea
                id="businessAddress"
                value={settings.businessAddress}
                onChange={(e) => setSettings((prev) => ({ ...prev, businessAddress: e.target.value }))}
                placeholder="Nhập địa chỉ doanh nghiệp"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessPhone">Số điện thoại</Label>
                <Input
                  id="businessPhone"
                  value={settings.businessPhone}
                  onChange={(e) => setSettings((prev) => ({ ...prev, businessPhone: e.target.value }))}
                  placeholder="Nhập số điện thoại"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessEmail">Email</Label>
                <Input
                  id="businessEmail"
                  type="email"
                  value={settings.businessEmail}
                  onChange={(e) => setSettings((prev) => ({ ...prev, businessEmail: e.target.value }))}
                  placeholder="Nhập email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessWebsite">Website</Label>
              <Input
                id="businessWebsite"
                value={settings.businessWebsite}
                onChange={(e) => setSettings((prev) => ({ ...prev, businessWebsite: e.target.value }))}
                placeholder="https://example.com"
              />
            </div>

            {/* Logo Upload */}
            <div className="space-y-2">
              <Label>Logo doanh nghiệp</Label>
              <div className="flex items-center gap-4">
                {settings.businessLogo && (
                  <div className="relative w-20 h-20 border rounded-lg overflow-hidden">
                    <Image
                      src={settings.businessLogo || "/placeholder.svg"}
                      alt="Business Logo"
                      fill
                      className="object-contain"
                      sizes="80px"
                    />
                  </div>
                )}
                <div>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" id="logo-upload" />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("logo-upload")?.click()}
                    disabled={isLoading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {settings.businessLogo ? "Thay đổi logo" : "Tải lên logo"}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cài đặt hóa đơn */}
        <Card>
          <CardHeader>
            <CardTitle>Cài đặt hóa đơn</CardTitle>
            <CardDescription>Cấu hình các tùy chọn hiển thị trên hóa đơn</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currency">Đơn vị tiền tệ</Label>
                <Input
                  id="currency"
                  value={settings.currency}
                  onChange={(e) => setSettings((prev) => ({ ...prev, currency: e.target.value }))}
                  placeholder="VND"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxRate">Thuế suất (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  value={settings.taxRate}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, taxRate: Number.parseFloat(e.target.value) || 0 }))
                  }
                  placeholder="10"
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Hiển thị thuế</Label>
                  <p className="text-sm text-muted-foreground">Hiển thị thông tin thuế trên hóa đơn</p>
                </div>
                <Switch
                  checked={settings.enableTax}
                  onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, enableTax: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Hiển thị giảm giá</Label>
                  <p className="text-sm text-muted-foreground">Hiển thị thông tin giảm giá trên hóa đơn</p>
                </div>
                <Switch
                  checked={settings.enableDiscount}
                  onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, enableDiscount: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Hiển thị thông tin khách hàng</Label>
                  <p className="text-sm text-muted-foreground">Hiển thị tên và thông tin khách hàng trên hóa đơn</p>
                </div>
                <Switch
                  checked={settings.enableCustomerInfo}
                  onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, enableCustomerInfo: checked }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="receiptFooter">Lời cảm ơn cuối hóa đơn</Label>
              <Textarea
                id="receiptFooter"
                value={settings.receiptFooter}
                onChange={(e) => setSettings((prev) => ({ ...prev, receiptFooter: e.target.value }))}
                placeholder="Cảm ơn quý khách đã mua hàng!"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? "Đang lưu..." : "Lưu cài đặt"}
          </Button>
        </div>
      </div>
    </div>
  )
}
