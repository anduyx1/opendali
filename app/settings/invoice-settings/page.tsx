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
import type { InvoiceSettings, PrintTemplate } from "@/lib/types/database"
import { getInvoiceSettings, updateInvoiceSettings } from "@/lib/actions/settings"
import { getAllPrintTemplates } from "@/lib/actions/print-templates" // Changed import
import InvoicePreview from "@/app/components/invoice-preview"
import { UploadCloud, Loader2 } from "lucide-react"
import Image from "next/image"
import { uploadImage } from "@/actions/upload-image"

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

export default function InvoiceSettingsPage() {
  const [settings, setSettings] = useState<InvoiceSettings>(defaultInvoiceSettings)
  const [printTemplates, setPrintTemplates] = useState<PrintTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [selectedTemplateContent, setSelectedTemplateContent] = useState<string>("")
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      // Changed function call
      const [currentSettings, fetchedTemplates] = await Promise.all([getInvoiceSettings(), getAllPrintTemplates()])

      if (currentSettings) {
        setSettings(currentSettings)
      }
      setPrintTemplates(fetchedTemplates)

      // Set default selected template if available
      if (fetchedTemplates.length > 0) {
        const defaultReceiptTemplate = fetchedTemplates.find(
          (template) => template.type === "receipt" && template.is_default,
        )
        if (defaultReceiptTemplate) {
          setSelectedTemplateId(defaultReceiptTemplate.id.toString())
          setSelectedTemplateContent(defaultReceiptTemplate.content)
        } else {
          // Fallback to first template if no default receipt template
          setSelectedTemplateId(fetchedTemplates[0].id.toString())
          setSelectedTemplateContent(fetchedTemplates[0].content)
        }
      }
      setIsLoading(false)
    }
    fetchData()
  }, [])

  useEffect(() => {
    // Update selected template content when selectedTemplateId changes
    const template = printTemplates.find((t) => t.id.toString() === selectedTemplateId)
    if (template) {
      setSelectedTemplateContent(template.content)
    } else {
      setSelectedTemplateContent("") // Clear if no template selected
    }
  }, [selectedTemplateId, printTemplates])

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
      const result = await uploadImage(formData)
      if (result.success && result.url) {
        setSettings((prev) => ({ ...prev, logo_url: result.url }))
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="ml-2 text-gray-600">Đang tải cài đặt hóa đơn...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 md:p-6">
      <div className="lg:w-1/2 space-y-6">
        <h1 className="text-3xl font-bold">Cài đặt hóa đơn</h1>
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
                <Label htmlFor="businessPhone">Số điện thoại</Label>
                <Input id="business_phone" value={settings.business_phone || ""} onChange={handleInputChange} />
              </div>
              <div>
                <Label htmlFor="businessEmail">Email</Label>
                <Input id="business_email" value="" onChange={handleInputChange} disabled />
                <p className="text-sm text-muted-foreground">Email không được hỗ trợ trong phiên bản này</p>
              </div>
              <div>
                <Label htmlFor="businessWebsite">Website</Label>
                <Input id="business_website" value="" onChange={handleInputChange} disabled />
                <p className="text-sm text-muted-foreground">Website không được hỗ trợ trong phiên bản này</p>
              </div>
              <div>
                <Label htmlFor="businessTaxId">Mã số thuế</Label>
                <Input id="business_tax_id" value={settings.business_tax_id || ""} onChange={handleInputChange} />
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
                  <div className="relative mt-2 h-16 w-32">
                    <Image
                      src={settings.logo_url || "/placeholder.svg"}
                      alt="Logo Preview"
                      fill
                      className="object-contain"
                      sizes="128px"
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
              <div className="flex items-center justify-between">
                <Label htmlFor="showNotes">Hiển thị ghi chú</Label>
                <Switch
                  id="showNotes"
                  checked={settings.show_notes}
                  onCheckedChange={(checked) => handleSwitchChange("show_notes", checked)}
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
        <div className="mb-4">
          <Label htmlFor="template-select">Chọn mẫu in để xem trước</Label>
          <Select
            value={selectedTemplateId ?? undefined}
            onValueChange={(value) => setSelectedTemplateId(value)}
            disabled={printTemplates.length === 0}
          >
            <SelectTrigger id="template-select" className="w-full">
              <SelectValue placeholder="Chọn một mẫu in" />
            </SelectTrigger>
            <SelectContent>
              {printTemplates
                .filter((template) => template.id !== 0)
                .map((template) => (
                  <SelectItem key={template.id} value={template.id.toString()}>
                    {template.name} ({template.type === "receipt" ? "Hóa đơn" : "Tạm tính"})
                    {template.is_default && " (Mặc định)"}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          {printTemplates.length === 0 && (
            <p className="text-sm text-red-500 mt-2">
              Chưa có mẫu in nào. Vui lòng tạo mẫu in tại{" "}
              <a href="/settings/print-templates" className="underline">
                Cài đặt &gt; Mẫu in
              </a>{" "}
              để xem trước.
            </p>
          )}
        </div>
        {selectedTemplateContent ? (
          <InvoicePreview
            invoiceSettings={settings}
            templateContent={selectedTemplateContent}
          />
        ) : (
          <Card className="border border-gray-300 p-4 text-center text-gray-500">
            Vui lòng chọn một mẫu in để xem trước.
          </Card>
        )}
      </div>
    </div>
  )
}
