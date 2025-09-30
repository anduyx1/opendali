"use client"

import type React from "react"

import { useState, useTransition, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { createStockAdjustmentAction } from "@/lib/actions/inventory"
import { getProductsClient } from "@/lib/services/products-client"
import type { Product, StockMovementType } from "@/lib/types/database"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface StockAdjustmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function StockAdjustmentModal({ isOpen, onClose, onSuccess }: StockAdjustmentModalProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  const [products, setProducts] = useState<Product[]>([])
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null)
  const [quantityChange, setQuantityChange] = useState<number>(0)
  const [movementType, setMovementType] = useState<StockMovementType>("adjustment")
  const [reason, setReason] = useState<string>("")
  const [productSearchOpen, setProductSearchOpen] = useState(false)

  useEffect(() => {
    const loadProducts = async () => {
      const fetchedProducts = await getProductsClient()
      setProducts(fetchedProducts)
    }
    if (isOpen) {
      loadProducts()
      // Reset form when opened
      setSelectedProductId(null)
      setQuantityChange(0)
      setMovementType("adjustment")
      setReason("")
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedProductId === null) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn sản phẩm.",
        variant: "destructive",
      })
      return
    }

    if (quantityChange === 0) {
      toast({
        title: "Lỗi",
        description: "Số lượng thay đổi không thể bằng 0.",
        variant: "destructive",
      })
      return
    }

    startTransition(async () => {
      const result = await createStockAdjustmentAction({
        productId: selectedProductId,
        adjustmentType: movementType as "increase" | "decrease" | "initial_stock",
        quantityChange,
        reason,
        adjustmentDate: new Date().toISOString(),
      })

      if (result.success) {
        toast({
          title: "Thành công",
          description: result.message,
          variant: "success",
        })
        onSuccess()
        onClose()
      } else {
        toast({
          title: "Lỗi",
          description: result.message,
          variant: "destructive",
        })
      }
    })
  }

  const selectedProduct = products.find((p) => p.id === selectedProductId)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Điều chỉnh tồn kho</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="product" className="text-right">
              Sản phẩm
            </Label>
            <Popover open={productSearchOpen} onOpenChange={setProductSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={productSearchOpen}
                  className="col-span-3 justify-between"
                >
                  {selectedProductId
                    ? products.find((product) => product.id === selectedProductId)?.name
                    : "Chọn sản phẩm..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0">
                <Command>
                  <CommandInput placeholder="Tìm kiếm sản phẩm..." />
                  <CommandList>
                    <CommandEmpty>Không tìm thấy sản phẩm.</CommandEmpty>
                    <CommandGroup>
                      {products.map((product) => (
                        <CommandItem
                          key={product.id}
                          value={product.name}
                          onSelect={() => {
                            setSelectedProductId(product.id)
                            setProductSearchOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedProductId === product.id ? "opacity-100" : "opacity-0",
                            )}
                          />
                          {product.name} ({product.stock_quantity} SP)
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quantity" className="text-right">
              Số lượng thay đổi
            </Label>
            <Input
              id="quantity"
              type="number"
              value={quantityChange}
              onChange={(e) => setQuantityChange(Number(e.target.value))}
              className="col-span-3"
              placeholder="Dương cho nhập, âm cho xuất"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">
              Loại giao dịch
            </Label>
            <Select value={movementType} onValueChange={(value: StockMovementType) => setMovementType(value)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Chọn loại giao dịch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="import">Nhập hàng</SelectItem>
                <SelectItem value="export">Xuất hàng</SelectItem>
                <SelectItem value="adjustment">Điều chỉnh</SelectItem>
                <SelectItem value="sale_return">Trả hàng bán</SelectItem>
                <SelectItem value="initial_stock">Tồn kho ban đầu</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="reason" className="text-right">
              Lý do
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="col-span-3"
              placeholder="Lý do điều chỉnh tồn kho..."
            />
          </div>

          {selectedProduct && (
            <div className="grid grid-cols-4 items-center gap-4 text-sm text-muted-foreground">
              <div className="col-span-4 text-center">
                Tồn kho hiện tại của **{selectedProduct.name}**: **{selectedProduct.stock_quantity}**
                {quantityChange !== 0 && <> → Tồn kho mới: **{selectedProduct.stock_quantity + quantityChange}**</>}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Hủy
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Đang lưu..." : "Lưu điều chỉnh"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
