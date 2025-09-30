"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

interface PriceEditModalProps {
  isOpen: boolean
  onClose: () => void
  currentPrice: number | null
  onSave: (newPrice: number) => void
}

export default function PriceEditModal({ isOpen, onClose, currentPrice, onSave }: PriceEditModalProps) {
  const [priceInput, setPriceInput] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen && currentPrice !== null) {
      setPriceInput(new Intl.NumberFormat("vi-VN").format(currentPrice))
    } else {
      setPriceInput("")
    }
  }, [isOpen, currentPrice])

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "") // Remove non-digits
    setPriceInput(new Intl.NumberFormat("vi-VN").format(Number(rawValue)))
  }

  const handleSave = () => {
    const numericPrice = Number(priceInput.replace(/\./g, ""))
    if (isNaN(numericPrice) || numericPrice <= 0) {
      toast({
        title: "Lỗi nhập liệu",
        description: "Vui lòng nhập một giá trị số hợp lệ và lớn hơn 0.",
        variant: "destructive",
      })
      return
    }
    onSave(numericPrice)
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSave()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] top-[30%] translate-y-[-30%]">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa đơn giá</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="new-price" className="text-right">
              Đơn giá mới
            </Label>
            <Input
              id="new-price"
              type="text"
              value={priceInput}
              onChange={handlePriceChange}
              onKeyDown={handleKeyDown}
              className="col-span-3 text-right"
              placeholder="Nhập giá mới"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={handleSave}>Lưu thay đổi</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
