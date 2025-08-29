"use client"

import { useState, useMemo, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area" // Re-added ScrollArea
import { Badge } from "@/components/ui/badge" // Re-added Badge
import { Search, AlertCircle } from "lucide-react" // Re-added AlertCircle
import { formatPrice } from "@/lib/utils"
import type { Product, CartItem } from "@/lib/types/database"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useDebounce } from "@/hooks/use-debounce"
import { useToast } from "@/hooks/use-toast" // Re-added useToast for stock warning
import Image from "next/image"

interface ProductSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  products: Product[] // All products are passed here
  cartItems: CartItem[]
  onAddToCart: (product: Product) => void
}

// Helper function for pagination page numbers
const getPaginationPages = (currentPage: number, totalPages: number) => {
  const pages: (number | string)[] = []
  const maxPagesToShow = 5 // Number of page links to show around the current page
  const startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2))
  const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1)

  if (startPage > 1) {
    pages.push(1)
    if (startPage > 2) {
      pages.push("...")
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i)
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      pages.push("...")
    }
    pages.push(totalPages)
  }

  return pages
}

export default function ProductSelectionModal({
  isOpen,
  onClose,
  products,
  cartItems,
  onAddToCart,
}: ProductSelectionModalProps) {
  const { toast } = useToast() // Initialize useToast
  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20) // Default items per page

  // Reset page to 1 when modal opens or search term changes
  useEffect(() => {
    setCurrentPage(1)
  }, [isOpen, debouncedSearchTerm])

  const filteredProducts = useMemo(() => {
    if (!debouncedSearchTerm) {
      return products
    }
    const lowercasedSearchTerm = debouncedSearchTerm.toLowerCase()
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(lowercasedSearchTerm) ||
        (product.barcode && product.barcode.toLowerCase().includes(lowercasedSearchTerm)) ||
        (product.sku && product.sku.toLowerCase().includes(lowercasedSearchTerm)),
    )
  }, [products, debouncedSearchTerm])

  const totalFilteredProducts = filteredProducts.length
  const totalPages = Math.ceil(totalFilteredProducts / itemsPerPage)

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredProducts.slice(startIndex, endIndex)
  }, [filteredProducts, currentPage, itemsPerPage])

  const productQuantitiesInCart = useMemo(() => {
    return cartItems.reduce((map, item) => {
      map.set(item.id, item.quantity)
      return map
    }, new Map<number, number>())
  }, [cartItems])

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value))
    setCurrentPage(1) // Reset to first page when items per page changes
  }

  const pagesToDisplay = getPaginationPages(currentPage, totalPages)

  const handleProductClick = (product: Product) => {
    // Allow adding out-of-stock products, but show a warning
    if (product.stock_quantity <= 0 && !product.is_service) {
      toast({
        title: "Cảnh báo!",
        description: `Sản phẩm "${product.name}" đã hết hàng. Vẫn có thể thêm vào giỏ hàng.`,
        variant: "warning",
      })
    }
    onAddToCart(product)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Chọn sản phẩm</DialogTitle>
        </DialogHeader>
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              className="pl-10 pr-4 py-2 rounded-lg border border-gray-300 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="flex flex-col divide-y divide-gray-200">
            {paginatedProducts.length === 0 ? (
              <div className="text-center py-6 text-gray-500 flex flex-col items-center justify-center">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>Không tìm thấy sản phẩm nào.</p>
              </div>
            ) : (
              paginatedProducts.map((product) => {
                const quantityInCart = productQuantitiesInCart.get(product.id) || 0
                const isOutOfStock = product.stock_quantity <= 0 && !product.is_service
                return (
                  <div
                    key={product.id}
                    className={`flex items-center p-3 bg-white cursor-pointer hover:bg-gray-50 transition-colors ${
                      isOutOfStock ? "opacity-70" : "" // Keep opacity for visual cue
                    }`}
                    onClick={() => handleProductClick(product)}
                  >
                    <div className="relative flex-shrink-0 w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden mr-3">
                      {product.image_url ? (
                        <Image
                          src={product.image_url || "/placeholder.svg"}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      ) : (
                        <span className="text-xl font-bold text-gray-400">{product.name.charAt(0)}</span>
                      )}
                      {quantityInCart > 0 && (
                        <Badge
                          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold z-10"
                          variant="default"
                        >
                          {quantityInCart}
                        </Badge>
                      )}
                    </div>
                    <div className="flex-1 flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-base line-clamp-1">{product.name}</h3>
                        <div className="text-sm text-gray-500 mt-0.5">
                          SKU: {product.sku || product.barcode || product.id}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-blue-600 text-base">{formatPrice(product.price || 0)}</span>
                        <div className="text-sm text-gray-500 mt-0.5">
                          {product.is_service ? "Dịch vụ" : isOutOfStock ? "Hết hàng" : `${product.stock_quantity} còn`}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>

        {/* Pagination Controls */}
        {totalFilteredProducts > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between mt-4 p-4 border-t">
            <div className="flex items-center space-x-2 mb-2 sm:mb-0">
              <span className="text-sm text-gray-700">Sản phẩm mỗi trang:</span>
              <Select value={String(itemsPerPage)} onValueChange={handleItemsPerPageChange}>
                <SelectTrigger className="w-[80px] h-8">
                  <SelectValue placeholder="20" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  {currentPage === 1 ? (
                    <PaginationPrevious className="pointer-events-none opacity-50" />
                  ) : (
                    <PaginationPrevious onClick={() => handlePageChange(currentPage - 1)} />
                  )}
                </PaginationItem>
                {pagesToDisplay.map((page, index) => (
                  <PaginationItem key={index}>
                    {page === "..." ? (
                      <PaginationEllipsis />
                    ) : (
                      <PaginationLink
                        onClick={() => handlePageChange(Number(page))}
                        isActive={Number(page) === currentPage}
                      >
                        {page}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ))}
                <PaginationItem>
                  {currentPage === totalPages ? (
                    <PaginationNext className="pointer-events-none opacity-50" />
                  ) : (
                    <PaginationNext onClick={() => handlePageChange(currentPage + 1)} />
                  )}
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
