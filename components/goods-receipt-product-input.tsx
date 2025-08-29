"use client"

import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Plus, Minus, X, Info } from "lucide-react"
import { getProductsClient } from "@/lib/services/products-client"
import type { Product, GoodsReceiptItem } from "@/lib/types/database"
import { useToast } from "@/hooks/use-toast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { useMobile } from "@/hooks/use-mobile"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface GoodsReceiptProductInputProps {
  onItemsChange: (items: GoodsReceiptItem[]) => void
}

export function GoodsReceiptProductInput({ onItemsChange }: GoodsReceiptProductInputProps) {
  const { toast } = useToast()
  const isMobile = useMobile()

  const [searchTerm, setSearchTerm] = useState("")
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [selectedItems, setSelectedItems] = useState<GoodsReceiptItem[]>([])
  const [productSearchOpen, setProductSearchOpen] = useState(false)

  useEffect(() => {
    const loadProducts = async () => {
      const products = await getProductsClient()
      setAllProducts(products)
    }
    loadProducts()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      setFilteredProducts(
        allProducts.filter(
          (p) =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.barcode && p.barcode.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase())),
        ),
      )
    } else {
      setFilteredProducts([])
    }
  }, [searchTerm, allProducts])

  useEffect(() => {
    onItemsChange(selectedItems)
  }, [selectedItems, onItemsChange])

  const handleProductSelect = (product: Product) => {
    if (selectedItems.some((item) => item.productId === product.id)) {
      toast({
        title: "Sản phẩm đã tồn tại",
        description: `${product.name} đã có trong danh sách nhập hàng.`,
        variant: "warning",
      })
      return
    }

    const newItem: GoodsReceiptItem = {
      productId: product.id,
      productName: product.name,
      barcode: product.barcode,
      sku: product.sku,
      imageUrl: product.image_url,
      unitPrice: product.wholesale_price || product.retail_price, // Ưu tiên giá sỉ, nếu không có thì giá bán lẻ
      quantity: 1,
      discount: 0,
      stockQuantity: product.stock_quantity,
    }
    setSelectedItems((prev) => [...prev, newItem])
    setSearchTerm("")
    setProductSearchOpen(false)
  }

  const handleQuantityChange = (productId: number, delta: number) => {
    setSelectedItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item,
      ),
    )
  }

  const handleInputChange = (productId: number, field: keyof GoodsReceiptItem, value: string) => {
    setSelectedItems((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? {
              ...item,
              [field]: field === "quantity" || field === "unitPrice" || field === "discount" ? Number(value) : value,
            }
          : item,
      ),
    )
  }

  const handleRemoveItem = (productId: number) => {
    setSelectedItems((prev) => prev.filter((item) => item.productId !== productId))
  }

  const calculateTotalPrice = (item: GoodsReceiptItem) => {
    return item.quantity * item.unitPrice - item.discount
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount)
  }

  const renderProductRow = (item: GoodsReceiptItem) => (
    <TableRow key={item.productId}>
      <TableCell className="font-medium">{selectedItems.indexOf(item) + 1}</TableCell>
      <TableCell>
        {item.imageUrl ? (
          <Image
            src={item.imageUrl || "/placeholder.svg"}
            alt={item.productName}
            width={40}
            height={40}
            className="rounded-md object-cover"
          />
        ) : (
          <div className="h-10 w-10 flex items-center justify-center bg-gray-100 rounded-md text-sm text-gray-500">
            No Img
          </div>
        )}
      </TableCell>
      <TableCell>
        <div className="font-medium">{item.productName}</div>
        <div className="text-sm text-muted-foreground">
          {item.barcode || item.sku || "N/A"}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="ml-1 inline-block h-3 w-3 text-blue-500 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Tồn kho hiện tại: {item.stockQuantity}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </TableCell>
      <TableCell>SP</TableCell> {/* Đơn vị */}
      <TableCell className="w-[150px]">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 bg-transparent"
            onClick={() => handleQuantityChange(item.productId, -1)}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Input
            type="number"
            value={item.quantity}
            onChange={(e) => handleInputChange(item.productId, "quantity", e.target.value)}
            className="w-16 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 bg-transparent"
            onClick={() => handleQuantityChange(item.productId, 1)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
      <TableCell className="w-[120px]">
        <Input
          type="number"
          value={item.unitPrice}
          onChange={(e) => handleInputChange(item.productId, "unitPrice", e.target.value)}
          className="w-full"
        />
      </TableCell>
      <TableCell className="w-[100px]">
        <Input
          type="number"
          value={item.discount}
          onChange={(e) => handleInputChange(item.productId, "discount", e.target.value)}
          className="w-full"
        />
      </TableCell>
      <TableCell className="text-right font-semibold w-[120px]">{formatCurrency(calculateTotalPrice(item))}</TableCell>
      <TableCell className="w-[50px]">
        <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.productId)}>
          <X className="h-4 w-4 text-red-500" />
        </Button>
      </TableCell>
    </TableRow>
  )

  const renderProductCard = (item: GoodsReceiptItem) => (
    <Card key={item.productId} className="mb-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl || "/placeholder.svg"}
              alt={item.productName}
              width={50}
              height={50}
              className="rounded-md object-cover"
            />
          ) : (
            <div className="h-12 w-12 flex items-center justify-center bg-gray-100 rounded-md text-sm text-gray-500">
              No Img
            </div>
          )}
          <div>
            <CardTitle className="text-lg">{item.productName}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {item.barcode || item.sku || "N/A"}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="ml-1 inline-block h-3 w-3 text-blue-500 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Tồn kho hiện tại: {item.stockQuantity}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardDescription>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.productId)}>
          <X className="h-4 w-4 text-red-500" />
        </Button>
      </CardHeader>
      <CardContent className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label>Số lượng nhập</Label>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-transparent"
              onClick={() => handleQuantityChange(item.productId, -1)}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              type="number"
              value={item.quantity}
              onChange={(e) => handleInputChange(item.productId, "quantity", e.target.value)}
              className="w-20 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-transparent"
              onClick={() => handleQuantityChange(item.productId, 1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Label>Đơn giá</Label>
          <Input
            type="number"
            value={item.unitPrice}
            onChange={(e) => handleInputChange(item.productId, "unitPrice", e.target.value)}
            className="w-32 text-right"
          />
        </div>
        <div className="flex items-center justify-between">
          <Label>Chiết khấu</Label>
          <Input
            type="number"
            value={item.discount}
            onChange={(e) => handleInputChange(item.productId, "discount", e.target.value)}
            className="w-32 text-right"
          />
        </div>
        <div className="flex items-center justify-between font-semibold text-lg mt-2">
          <span>Thành tiền:</span>
          <span>{formatCurrency(calculateTotalPrice(item))}</span>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-4">
      <Popover open={productSearchOpen} onOpenChange={setProductSearchOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tên, mã SKU, hoặc quét mã Barcode..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setProductSearchOpen(true)}
            />
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
          <Command>
            <CommandInput placeholder="Tìm kiếm sản phẩm..." value={searchTerm} onValueChange={setSearchTerm} />
            <CommandList>
              {filteredProducts.length === 0 && searchTerm ? (
                <CommandEmpty>Không tìm thấy sản phẩm.</CommandEmpty>
              ) : (
                <CommandGroup>
                  {filteredProducts.map((product) => (
                    <CommandItem key={product.id} value={product.name} onSelect={() => handleProductSelect(product)}>
                      <div className="flex items-center gap-2">
                        {product.image_url && (
                          <Image
                            src={product.image_url || "/placeholder.svg"}
                            alt={product.name}
                            width={30}
                            height={30}
                            className="rounded-md object-cover"
                          />
                        )}
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {product.barcode || product.sku || "N/A"} | Tồn: {product.stock_quantity}
                          </div>
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedItems.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">Chưa có sản phẩm nào được thêm.</div>
      ) : isMobile ? (
        <div className="grid gap-4">{selectedItems.map((item) => renderProductCard(item))}</div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">STT</TableHead>
                <TableHead className="w-[60px]">Ảnh</TableHead>
                <TableHead>Tên sản phẩm</TableHead>
                <TableHead className="w-[80px]">Đơn vị</TableHead>
                <TableHead className="w-[150px]">SL nhập</TableHead>
                <TableHead className="w-[120px]">Đơn giá</TableHead>
                <TableHead className="w-[100px]">Chiết khấu</TableHead>
                <TableHead className="w-[120px] text-right">Thành tiền</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{selectedItems.map((item) => renderProductRow(item))}</TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
