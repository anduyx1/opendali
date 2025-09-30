"use client"

import type React from "react"

import { useState, useEffect, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import type { InvoiceSettings } from "@/lib/types/database"
import { getInvoiceSettings, updateInvoiceSettings } from "@/lib/actions/settings"
import InvoicePreview from "@/app/components/invoice-preview"
import { UploadCloud } from "lucide-react"
import { uploadImage } from "@/actions/upload-image" // Assuming this action exists
import Image from "next/image"

const defaultInvoiceSettings: InvoiceSettings = {
  id: 1,
  business_name: "Cửa hàng của bạn",
  business_address: "Địa chỉ cửa hàng của bạn",
  business_phone: "0123456789",
  business_tax_id: "0123456789",
  show_customer_info: true,
  show_tax: true,
  show_discount: true,
  show_notes: true,
  header_font_size: "text-2xl",
  text_color: "text-gray-800",
  logo_url: null,
  created_at: new Date(),
  updated_at: new Date(),
}

export default function InvoiceTemplatesPage() {
  const [settings, setSettings] = useState<InvoiceSettings>(defaultInvoiceSettings)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  useEffect(() => {
    const fetchSettings = async () => {
      const currentSettings = await getInvoiceSettings()
      if (currentSettings) {
        setSettings(currentSettings)
      }
    }
    fetchSettings()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setSettings((prev) => ({ ...prev, [id]: value }))
  }

  const handleSwitchChange = (id: keyof InvoiceSettings, checked: boolean) => {
    setSettings((prev) => ({ ...prev, [id]: checked }))
  }

  const handleSelectChange = (id: keyof InvoiceSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [id]: value }))
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const formData = new FormData()
      formData.append("file", file)
      const result = await uploadImage(formData) // Assuming uploadImage returns { success: true, url: string } or { success: false, error: string }
      if (result.success && result.url) {
        setSettings((prev) => ({ ...prev, logoUrl: result.url }))
        toast({
          title: "Tải lên logo thành công",
          description: "Logo đã được cập nhật.",
        })
      } else {
        toast({
          title: "Lỗi tải lên logo",
          description: result.error || "Không thể tải lên logo.",
          variant: "destructive",
        })
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const { success, error } = await updateInvoiceSettings(settings)
      if (success) {
        toast({
          title: "Cập nhật thành công",
          description: "Cài đặt hóa đơn đã được lưu.",
        })
      } else {
        toast({
          title: "Lỗi",
          description: error || "Không thể lưu cài đặt hóa đơn.",
          variant: "destructive",
        })
      }
    })
  }

  // Dummy data for preview
  const dummyInvoiceItems = [
    { description: "Sản phẩm A", quantity: 2, unitPrice: 100000, total: 200000 },
    { description: "Sản phẩm B", quantity: 1, unitPrice: 150000, total: 150000 },
  ]
  const dummySubtotal = dummyInvoiceItems.reduce((sum, item) => sum + item.total, 0)
  const dummyTaxAmount = settings.show_tax ? dummySubtotal * 0.1 : 0 // Example 10% tax
  const dummyDiscountAmount = settings.show_discount ? dummySubtotal * 0.05 : 0 // Example 5% discount
  const dummyTotalAmount = dummySubtotal + dummyTaxAmount - dummyDiscountAmount

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 md:p-6">
      <div className="lg:w-1/2 space-y-6">
        <h1 className="text-3xl font-bold">Tùy chỉnh mẫu hóa đơn</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin doanh nghiệp</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="businessName">Tên doanh nghiệp</Label>
                <Input id="business_name" value={settings.business_name} onChange={handleInputChange} />
              </div>
              <div>
                <Label htmlFor="businessAddress">Địa chỉ doanh nghiệp</Label>
                <Input id="business_address" value={settings.business_address} onChange={handleInputChange} />
              </div>
              <div>
                <Label htmlFor="logoUrl">Logo (URL)</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="logoUrl"
                    value={settings.logo_url || ""}
                    onChange={handleInputChange}
                    placeholder="Hoặc tải lên từ máy tính"
                  />
                  <label htmlFor="logo-upload" className="cursor-pointer p-2 border rounded-md hover:bg-gray-50">
                    <UploadCloud className="h-5 w-5" />
                    <span className="sr-only">Tải lên logo</span>
                  </label>
                  <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </div>
                {settings.logo_url && (
                  <div className="mt-2 relative w-16 h-16">
                    <Image
                      src={settings.logo_url || "/placeholder.svg"}
                      alt="Logo Preview"
                      fill
                      className="object-contain"
                      sizes="64px"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tùy chọn hiển thị</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="showCustomerInfo">Hiển thị thông tin khách hàng</Label>
                <Switch
                  id="showCustomerInfo"
                  checked={settings.show_customer_info}
                  onCheckedChange={(checked) => handleSwitchChange("show_customer_info", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="showTax">Hiển thị thuế</Label>
                <Switch
                  id="showTax"
                  checked={settings.show_tax}
                  onCheckedChange={(checked) => handleSwitchChange("show_tax", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="showDiscount">Hiển thị giảm giá</Label>
                <Switch
                  id="showDiscount"
                  checked={settings.show_discount}
                  onCheckedChange={(checked) => handleSwitchChange("show_discount", checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Kiểu chữ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="headerFontSize">Kích thước tiêu đề</Label>
                <Select
                  value={settings.header_font_size}
                  onValueChange={(value) => handleSelectChange("header_font_size", value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn kích thước" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text-xl">Nhỏ (text-xl)</SelectItem>
                    <SelectItem value="text-2xl">Trung bình (text-2xl)</SelectItem>
                    <SelectItem value="text-3xl">Lớn (text-3xl)</SelectItem>
                    <SelectItem value="text-4xl">Rất lớn (text-4xl)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="textColor">Màu chữ</Label>
                <Select value={settings.text_color} onValueChange={(value) => handleSelectChange("text_color", value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn màu chữ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text-gray-900">Đen (text-gray-900)</SelectItem>
                    <SelectItem value="text-gray-800">Xám đậm (text-gray-800)</SelectItem>
                    <SelectItem value="text-gray-700">Xám (text-gray-700)</SelectItem>
                    <SelectItem value="text-blue-600">Xanh dương (text-blue-600)</SelectItem>
                    <SelectItem value="text-red-600">Đỏ (text-red-600)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Đang lưu..." : "Lưu cài đặt"}
          </Button>
        </form>
      </div>

      <div className="lg:w-1/2 lg:sticky lg:top-4 h-fit">
        <h2 className="text-2xl font-bold mb-4">Xem trước hóa đơn</h2>
        <InvoicePreview
          invoiceSettings={settings}
          templateContent=""
        />
      </div>
    </div>
  )
}
