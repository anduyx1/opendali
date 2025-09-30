"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PlusCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast" // Import useToast

interface QuickServiceModalProps {
  isOpen: boolean
  onClose: () => void
  onAddService: (name: string, price: number) => void
}

export default function QuickServiceModal({ isOpen, onClose, onAddService }: QuickServiceModalProps) {
  const { toast } = useToast() // Initialize useToast
  const [serviceName, setServiceName] = useState("Dịch vụ nhanh")
  const [servicePrice, setServicePrice] = useState(0)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setServiceName("Dịch vụ nhanh")
      setServicePrice(0)
    }
  }, [isOpen])

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Use parseFloat to handle decimal numbers. If the input is empty, parseFloat("") is NaN.
    // If the input is invalid (e.g., "abc"), parseFloat("abc") is NaN.
    // We want to default to 0 in these cases.
    const parsedPrice = Number.parseFloat(value)
    setServicePrice(isNaN(parsedPrice) ? 0 : parsedPrice)
  }

  const handleAdd = () => {
    if (!serviceName.trim()) {
      toast({
        title: "Lỗi nhập liệu!",
        description: "Tên dịch vụ không được để trống.",
        variant: "destructive",
      })
      return
    }
    onAddService(serviceName, servicePrice)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5" />
            Thêm Dịch vụ nhanh
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="serviceName" className="text-right">
              Tên dịch vụ
            </Label>
            <Input
              id="serviceName"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="servicePrice" className="text-right">
              Giá
            </Label>
            <Input
              id="servicePrice"
              type="number"
              value={servicePrice}
              onChange={handlePriceChange} // Use the new handler
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={handleAdd}>Thêm vào đơn hàng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
