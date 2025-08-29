"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { getTaxRate, updateTaxRate } from "@/lib/actions/settings"
import { Loader2, Save } from "lucide-react"

export default function TaxSettingsPage() {
  const { toast } = useToast()
  const [taxRate, setTaxRate] = useState<number>(0.1) // Default value
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const fetchTaxRate = async () => {
      setLoading(true)
      try {
        const currentTaxRate = await getTaxRate()
        setTaxRate(currentTaxRate)
      } catch (error) {
        console.error("Failed to fetch tax rate:", error)
        toast({
          title: "Lỗi",
          description: "Không thể tải thuế suất. Vui lòng thử lại.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    fetchTaxRate()
  }, [toast])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const success = await updateTaxRate(taxRate)
      if (success) {
        toast({
          title: "Thành công",
          description: "Thuế suất đã được cập nhật.",
        })
      } else {
        toast({
          title: "Lỗi",
          description: "Không thể cập nhật thuế suất. Vui lòng thử lại.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error saving tax rate:", error)
      toast({
        title: "Lỗi",
        description: "Đã xảy ra lỗi khi lưu thuế suất.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <h1 className="text-3xl font-bold">Cài đặt Thuế</h1>
      <p className="text-muted-foreground">Quản lý mức thuế suất áp dụng cho các đơn hàng.</p>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Thuế suất</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-24">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <>
              <div>
                <Label htmlFor="tax-rate">Thuế suất (%)</Label>
                <Input
                  id="tax-rate"
                  type="number"
                  placeholder="Nhập thuế suất"
                  value={taxRate * 100} // Display as percentage
                  onChange={(e) => {
                    const value = Number(e.target.value)
                    setTaxRate(isNaN(value) ? 0 : value / 100) // Store as decimal
                  }}
                  min="0"
                  step="0.01"
                  className="mt-1"
                />
                <p className="text-sm text-muted-foreground mt-1">Nhập giá trị phần trăm (ví dụ: 10 cho 10%).</p>
              </div>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Lưu thay đổi
                  </>
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
