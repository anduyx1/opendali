"use client"

import { useState, useEffect, useRef, useTransition, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Grid,
  List,
  Settings2,
  FileDown,
  ArrowLeft,
  Package,
  ArrowUpDown,
  Filter,
  ScanLine,
} from "lucide-react"
import { getProductsClient, deleteProductClient } from "@/lib/services/products-client"
import ProductFormModal from "../components/product-form-modal"
import CategoryManagementModal from "../components/category-management-modal"
import type { Product } from "@/lib/types/database"
import { formatCompactPrice, formatDateTimeConcise } from "@/lib/utils"
import { exportProductsToExcelAction } from "@/actions/product-import"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useMobile } from "@/hooks/use-mobile" // Import useMobile hook
import { DraggableFloatingActionButton } from "@/components/ui/draggable-fab"
import Image from "next/image"

export default function ProductsPage() {
  const { toast } = useToast()
  const router = useRouter()
  const isMobile = useMobile() // Use the hook
  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [showProductForm, setShowProductForm] = useState(false)
  const [showCategoryManagement, setShowCategoryManagement] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list">(isMobile ? "list" : "grid") // Default to list on mobile
  const [isExporting, startExportTransition] = useTransition()
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set())
  const [isSelectAllChecked, setIsSelectAllChecked] = useState<boolean | "indeterminate">(false)

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)

  const searchInputRef = useRef<HTMLInputElement>(null)

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.barcode && product.barcode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex)

  const loadProducts = useCallback(async () => {
    try {
      const productData = await getProductsClient()
      setProducts(productData)
    } catch (error) {
      console.error("Error loading products:", error)
      toast({
        title: "Lỗi tải sản phẩm",
        description: "Không thể tải danh sách sản phẩm. Vui lòng thử lại.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  // Effect to update select all checkbox state
  useEffect(() => {
    if (!isMobile) {
      // Only apply for desktop list view
      const allSelected = paginatedProducts.every((product) => selectedProductIds.has(product.id.toString()))
      const anySelected = paginatedProducts.some((product) => selectedProductIds.has(product.id.toString()))

      if (allSelected && paginatedProducts.length > 0) {
        setIsSelectAllChecked(true)
      } else if (anySelected) {
        setIsSelectAllChecked("indeterminate")
      } else {
        setIsSelectAllChecked(false)
      }
    } else {
      setIsSelectAllChecked(false) // No select all on mobile list view
    }
  }, [selectedProductIds, paginatedProducts, isMobile])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "F3") {
        event.preventDefault()
        searchInputRef.current?.focus()
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value))
    setCurrentPage(1) // Reset to first page when items per page changes
  }

  // Function to generate pagination pagination page numbers
  const getPaginationPages = (currentPage: number, totalPages: number) => {
    const pages: (number | string)[] = []
    const maxVisibleItems = 5 // Tối đa 5 ô hiển thị (bao gồm cả số trang và dấu '...')

    if (totalPages <= maxVisibleItems) {
      // Nếu tổng số trang ít hơn hoặc bằng 5, hiển thị tất cả
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Logic khi tổng số trang lớn hơn 5
      const numMiddlePagesToShow = 3 // Số trang hiển thị trực tiếp ở giữa (ví dụ: current-1, current, current+1)
      const numSidePages = Math.floor((maxVisibleItems - 1) / 2) // Số trang hiển thị ở mỗi bên của trang hiện tại (2 cho 5 ô)

      // Trường hợp 1: Trang hiện tại ở gần đầu (1, 2, 3, 4, ...)
      if (currentPage <= numSidePages + 1) {
        // Ví dụ: currentPage <= 3 (1,2,3)
        for (let i = 1; i <= maxVisibleItems - 1; i++) {
          // Hiển thị 1, 2, 3, 4
          pages.push(i)
        }
        pages.push("...") // Dấu chấm lửng
        pages.push(totalPages) // Trang cuối cùng
      }
      // Trường hợp 2: Trang hiện tại ở gần cuối (..., total-3, total-2, total-1, total)
      else if (currentPage >= totalPages - numSidePages) {
        // Ví dụ: currentPage >= totalPages - 2
        pages.push(1) // Trang đầu tiên
        pages.push("...") // Dấu chấm lửng
        for (let i = totalPages - (maxVisibleItems - 2); i <= totalPages; i++) {
          // Hiển thị total-3, total-2, total-1, total
          pages.push(i)
        }
      }
      // Trường hợp 3: Trang hiện tại ở giữa (..., current-1, current, current+1, ...)
      else {
        pages.push(1) // Trang đầu tiên
        pages.push("...") // Dấu chấm lửng
        for (
          let i = currentPage - Math.floor((numMiddlePagesToShow - 1) / 2);
          i <= currentPage + Math.ceil((numMiddlePagesToShow - 1) / 2);
          i++
        ) {
          pages.push(i) // Hiển thị current-1, current, current+1
        }
        pages.push("...") // Dấu chấm lửng
        pages.push(totalPages) // Trang cuối cùng
      }
    }
    return pages
  }

  const paginationPages = getPaginationPages(currentPage, totalPages)

  const handleAddProduct = () => {
    setEditingProduct(null)
    setShowProductForm(true)
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setShowProductForm(true)
  }

  const handleDeleteProduct = async (product: Product) => {
    if (confirm(`Bạn có chắc muốn xóa sản phẩm "${product.name}"?`)) {
      try {
        const result = await deleteProductClient(product.id)
        if (result.success) {
          await loadProducts()
          toast({
            title: "Thành công",
            description: `Đã xóa sản phẩm "${product.name}".`,
            variant: "default",
          })
        } else {
          toast({
            title: "Lỗi",
            description: result.error || "Không thể xóa sản phẩm. Vui lòng thử lại.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error in handleDeleteProduct:", error)
        toast({
          title: "Lỗi",
          description: "Có lỗi xảy ra khi xóa sản phẩm.",
          variant: "destructive",
        })
      }
    }
  }

  const handleFormSuccess = async () => {
    await loadProducts()
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newSelectedIds = new Set(selectedProductIds)
              paginatedProducts.forEach((product) => newSelectedIds.add(product.id.toString()))
      setSelectedProductIds(newSelectedIds)
    } else {
      const newSelectedIds = new Set(selectedProductIds)
              paginatedProducts.forEach((product) => newSelectedIds.delete(product.id.toString()))
      setSelectedProductIds(newSelectedIds)
    }
  }

  const handleSelectProduct = (productId: string, checked: boolean) => {
    setSelectedProductIds((prev) => {
      const newSelectedIds = new Set(prev)
      if (checked) {
        newSelectedIds.add(productId)
      } else {
        newSelectedIds.delete(productId)
      }
      return newSelectedIds
    })
  }

  const handleExportProducts = async () => {
    startExportTransition(async () => {
      try {
        toast({
          title: "Đang xuất dữ liệu",
          description: "Đang chuẩn bị file Excel để tải xuống...",
        })
        const result = await exportProductsToExcelAction()

        if (result.success && result.fileData && result.fileName) {
          const byteCharacters = atob(result.fileData)
          const byteNumbers = new Array(byteCharacters.length)
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i)
          }
          const byteArray = new Uint8Array(byteNumbers)
          const blob = new Blob([byteArray], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          })

          const url = window.URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = result.fileName
          document.body.appendChild(a)
          a.click()
          a.remove()
          window.URL.revokeObjectURL(url)

          toast({
            title: "Thành công",
            description: "Đã xuất dữ liệu sản phẩm thành công.",
            variant: "default",
          })
        } else {
          console.error("Export failed:", result)
          toast({
            title: "Lỗi xuất dữ liệu",
            description: result.message || "Không thể xuất dữ liệu sản phẩm. Vui lòng thử lại.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error exporting products:", error)
        toast({
          title: "Lỗi",
          description: "Có lỗi xảy ra khi xuất dữ liệu sản phẩm.",
          variant: "destructive",
        })
      }
    })
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {" "}
      {/* Added padding-bottom for FAB */}
      {isMobile ? (
        // Mobile Header and Search/Filter
        <div className="flex flex-col gap-4 px-4 pt-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-bold text-center flex-1">Quản lý kho</h1>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={() => setShowCategoryManagement(true)}>
                <Package className="h-6 w-6" />
              </Button>
              <Button variant="ghost" size="icon">
                <Settings2 className="h-6 w-6" />
              </Button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Nhập tên, mã SKU, barcode"
              className="pl-10 pr-10 rounded-lg h-12 text-base"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              ref={searchInputRef}
            />
            <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 transform -translate-y-1/2">
              <ScanLine className="h-5 w-5 text-gray-400" />
            </Button>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-600">
            <Select>
              <SelectTrigger className="w-[180px] border-none shadow-none text-base font-medium">
                <SelectValue placeholder="Tất cả loại sản phẩm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại sản phẩm</SelectItem>
                {/* Add dynamic categories here */}
              </SelectContent>
            </Select>
            <div className="flex gap-4">
              <Button variant="ghost" size="icon">
                <ArrowUpDown className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Filter className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground ml-2">{filteredProducts.length} phiên bản</p>
        </div>
      ) : (
        // Desktop Header and Search/Filter
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Quản lý sản phẩm</h1>
            <p className="text-sm text-gray-500">Quản lý danh sách sản phẩm và kho hàng</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleExportProducts} variant="outline" disabled={isExporting}>
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang xuất...
                </>
              ) : (
                <>
                  <FileDown className="mr-2 h-4 w-4" />
                  Xuất Excel
                </>
              )}
            </Button>
            <Button onClick={() => setShowCategoryManagement(true)} variant="outline">
              <Settings2 className="mr-2 h-4 w-4" />
              Quản lý danh mục
            </Button>
            <Button onClick={handleAddProduct}>
              <Plus className="mr-2 h-4 w-4" />
              Thêm sản phẩm
            </Button>
          </div>
        </div>
      )}
      <Card className={isMobile ? "shadow-none border-none" : ""}>
        {!isMobile && ( // Only show CardHeader for desktop
          <CardHeader>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <CardTitle className="flex items-center gap-2">
                Danh sách sản phẩm
                <Badge variant="outline" className="flex items-center gap-1 text-3xl text-blue-700 font-bold">
                  {filteredProducts.length}
                </Badge>
              </CardTitle>

              <div className="flex items-center gap-2">
                <div className="relative flex-1 md:w-80">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Nhấn F3 để tìm kiếm nhanh..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    ref={searchInputRef}
                  />
                  <span className="absolute -bottom-5 left-0 text-xs text-muted-foreground"></span>
                </div>
                <div className="flex border rounded-md">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="icon"
                    className="h-10 w-10 rounded-r-none"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="icon"
                    className="h-10 w-10 rounded-l-none"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
        )}
        <CardContent className={isMobile ? "p-0" : ""}>
          {" "}
          {/* Remove padding on mobile */}
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : paginatedProducts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm
                ? "Không tìm thấy sản phẩm nào phù hợp với tìm kiếm của bạn."
                : "Chưa có sản phẩm nào. Hãy thêm sản phẩm mới!"}
            </div>
          ) : viewMode === "grid" && !isMobile ? ( // Grid view only for desktop
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
              {paginatedProducts.map((product) => (
                <Card key={product.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <div className="aspect-[16/9] w-full bg-gray-100 relative">
                    {product.image_url ? (
                      <Image
                        src={product.image_url || "/placeholder.svg"}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <span className="text-4xl font-bold text-gray-400">{product.name.charAt(0)}</span>
                      </div>
                    )}

                    <Badge
                      className={`absolute top-2 right-2 ${
                        product.stock_quantity > (product.min_stock_level || 10)
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : product.stock_quantity > 0
                            ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                            : "bg-red-100 text-red-800 hover:bg-red-100"
                      }`}
                    >
                      {product.stock_quantity} sản phẩm
                    </Badge>
                  </div>

                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium line-clamp-2">{product.name}</h3>
                      </div>
                      <div className="flex items-center gap-2 ml-2 shrink-0">
                        <div
                          className={`h-3 w-3 rounded-full ${
                            product.status === "active" ? "bg-green-500" : "bg-red-500"
                          }`}
                          title={
                            product.status === "active"
                              ? "Hoạt động"
                              : product.status === "inactive"
                                ? "Tạm dừng"
                                : "Ngừng KD"
                          }
                        />
                        {(product.barcode || product.sku) && (
                          <span className="text-sm text-muted-foreground">{product.barcode || product.sku}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 mt-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Giá bán lẻ:</span>
                        <span className="font-medium text-blue-600">{formatCompactPrice(product.retail_price)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Giá bán buôn:</span>
                        <span className="font-medium">{formatCompactPrice(product.wholesale_price)}</span>
                      </div>
                      {product.created_at && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Ngày tạo:</span>
                          <span className="text-sm">{formatDateTimeConcise(new Date(product.created_at))}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-transparent"
                        onClick={() => handleEditProduct(product)}
                      >
                        <Edit className="h-4 w-4 mr-1" /> Sửa
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-red-600 hover:text-red-700 bg-transparent"
                        onClick={() => handleDeleteProduct(product)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" /> Xóa
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            // List view (mobile optimized or desktop table)
            <div className="overflow-x-auto">
              {isMobile ? (
                // Mobile List View (Card-like rows)
                <div className="flex flex-col">
                  {paginatedProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-4 py-3 px-4 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/products/${product.id}`)} // Navigate to detail page
                    >
                      <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center overflow-hidden shrink-0 relative">
                        {product.image_url ? (
                          <Image
                            src={product.image_url || "/placeholder.svg"}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        ) : (
                          <span className="text-xl font-medium text-gray-600">{product.name.charAt(0)}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-base line-clamp-1">{product.name}</h3>
                        {product.sku && (
                          <p className="text-sm text-muted-foreground line-clamp-1">SKU: {product.sku}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end text-right shrink-0">
                        <span className="font-bold text-lg text-gray-800">
                          {formatCompactPrice(product.retail_price)}
                        </span>
                        <span className="text-sm text-muted-foreground">{product.stock_quantity}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Desktop List View (Table)
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 w-12">
                        <Checkbox
                          checked={isSelectAllChecked}
                          onCheckedChange={handleSelectAll}
                          aria-label="Chọn tất cả sản phẩm"
                        />
                      </th>
                      <th className="text-left py-3 px-4">Sản phẩm</th>
                      <th className="text-left py-3 px-4">Giá bán lẻ</th>
                      <th className="text-left py-3 px-4 hidden md:table-cell">Giá bán buôn</th>
                      <th className="text-left py-3 px-4">Tồn kho</th>
                      <th className="text-left py-3 px-4 hidden md:table-cell">Trạng thái</th>
                      <th className="text-left py-3 px-4 hidden md:table-cell">Ngày tạo</th>
                      <th className="text-left py-3 px-4">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedProducts.map((product) => (
                      <tr
                        key={product.id}
                        className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={(e) => {
                          // Don't navigate if clicking on checkbox or action buttons
                          const target = e.target as HTMLElement
                          if (
                            target.closest('input[type="checkbox"]') ||
                            target.closest("button") ||
                            target.closest('[role="checkbox"]')
                          ) {
                            return
                          }
                          router.push(`/products/${product.id}`)
                        }}
                      >
                        <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedProductIds.has(product.id.toString())}
                                                          onCheckedChange={(checked) => handleSelectProduct(product.id.toString(), checked as boolean)}
                            aria-label={`Chọn sản phẩm ${product.name}`}
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden relative">
                              {product.image_url ? (
                                <Image
                                  src={product.image_url || "/placeholder.svg"}
                                  alt={product.name}
                                  fill
                                  className="object-cover"
                                  sizes="48px"
                                />
                              ) : (
                                <span className="text-sm font-medium text-gray-600">{product.name.charAt(0)}</span>
                              )}
                            </div>
                            <div>
                              <span className="font-medium">{product.name}</span>
                              {(product.barcode || product.sku) && (
                                <p className="text-sm text-muted-foreground">{product.barcode || product.sku}</p>
                              )}
                              {product.description && (
                                <p className="text-sm text-muted-foreground hidden md:block">{product.description}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium">{formatCompactPrice(product.retail_price)}</td>
                        <td className="py-3 px-4 hidden md:table-cell">
                          {formatCompactPrice(product.wholesale_price)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              product.stock_quantity > (product.min_stock_level || 10)
                                ? "bg-green-100 text-green-800"
                                : product.stock_quantity > 0
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                            }`}
                          >
                            {product.stock_quantity} sản phẩm
                          </span>
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell">
                          <div
                            className={`h-3 w-3 rounded-full ${
                              product.status === "active" ? "bg-green-500" : "bg-red-500"
                            }`}
                            title={
                              product.status === "active"
                                ? "Hoạt động"
                                : product.status === "inactive"
                                  ? "Tạm dừng"
                                  : "Ngừng KD"
                            }
                          />
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell">
                          {product.created_at && formatDateTimeConcise(new Date(product.created_at))}
                        </td>
                        <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditProduct(product)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 bg-transparent"
                              onClick={() => handleDeleteProduct(product)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      {/* Bulk Actions Bar (only for desktop list view with selections) */}
      {selectedProductIds.size > 0 && !isMobile && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground p-4 rounded-lg shadow-lg flex items-center gap-4 z-50">
          <span className="font-medium">{selectedProductIds.size} sản phẩm đã chọn</span>
          <Button
            variant="secondary"
            onClick={() => {
              if (confirm(`Bạn có chắc muốn xóa ${selectedProductIds.size} sản phẩm đã chọn?`)) {
                // Implement bulk delete logic here
                setSelectedProductIds(new Set())
                toast({
                  title: "Thao tác hàng loạt",
                  description: `Đã xóa ${selectedProductIds.size} sản phẩm (chức năng demo).`,
                  variant: "default",
                })
              }
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Xóa đã chọn
          </Button>
          <Button variant="secondary" onClick={() => setSelectedProductIds(new Set())}>
            Hủy chọn
          </Button>
        </div>
      )}
      {/* Floating Action Button for mobile */}
      {isMobile && (
        <DraggableFloatingActionButton onClick={handleAddProduct}>
          <Plus className="h-6 w-6" />
        </DraggableFloatingActionButton>
      )}
      {/* Pagination Controls */}
      {filteredProducts.length > 0 && (
        <div className="flex justify-between items-center mt-4 px-4 md:px-0">
          {" "}
          {/* Added horizontal padding for mobile */}
          <div className="flex items-center gap-1">
            {/* Giảm kích thước chữ từ text-sm xuống text-xs */}
            <span className="text-xs text-muted-foreground">Hiển thị:</span>
            {/* Giảm chiều rộng của SelectTrigger từ w-[70px] xuống w-[56px] */}
            <Select value={String(itemsPerPage)} onValueChange={handleItemsPerPageChange}>
              <SelectTrigger className="w-[56px] h-8 text-xs">
                {" "}
                {/* Giảm chiều cao và kích thước chữ bên trong trigger */}
                <SelectValue placeholder={itemsPerPage} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Pagination>
            {/* Giảm khoảng cách giữa các PaginationItem từ gap-1 xuống gap-0.5 */}
            <PaginationContent className="gap-0.5">
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (currentPage > 1) handlePageChange(currentPage - 1)
                  }}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              {paginationPages.map((page, index) => (
                <PaginationItem key={index}>
                  {page === "..." ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink
                      href="#"
                      isActive={page === currentPage}
                      onClick={(e) => {
                        e.preventDefault()
                        handlePageChange(Number(page))
                      }}
                      // Giảm kích thước nút phân trang từ size="default" xuống size="sm"
                      size="sm"
                    >
                      {page}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (currentPage < totalPages) handlePageChange(currentPage + 1)
                  }}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
      <ProductFormModal
        isOpen={showProductForm}
        onClose={() => setShowProductForm(false)}
        product={editingProduct}
        onSuccess={handleFormSuccess}
      />
      <CategoryManagementModal
        isOpen={showCategoryManagement}
        onClose={() => {
          setShowCategoryManagement(false)
          loadProducts()
        }}
      />
    </div>
  )
}
