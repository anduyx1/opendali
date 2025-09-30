"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Plus, Search, Save } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import { use } from "react"
import {
  getInventoryCheckDetail,
  searchProductsOnly,
  addProductToCheck,
  updateInventoryCheckItemByProduct,
  updateInventoryCheckSession,
} from "@/lib/actions/inventory-check"

interface Product {
  id: number
  name: string
  sku: string
  barcode?: string
  stock_quantity: number
  image_url?: string
  actual_quantity?: number
  difference?: number
  status?: string
  reason?: string
  notes?: string
}

interface SearchProduct {
  id: number
  name: string
  sku: string
  barcode?: string
  stock_quantity: number
  image_url?: string
}

interface CheckInfo {
  id: number
  code: string
  branch: string
  staff: string
  notes: string
  tags: string
  status: string
  created_at: string
}

interface InventoryCheckItem {
  product_id: number
  product_name: string
  product_sku: string
  product_barcode?: string
  system_quantity: number
  product_image?: string
  actual_quantity?: number
  difference?: number
  status?: string
  reason?: string
  notes?: string
}

export default function EditInventoryCheckPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [checkInfo, setCheckInfo] = useState<CheckInfo | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<SearchProduct[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isAddProductOpen, setIsAddProductOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Load dữ liệu phiếu kiểm hiện có
  useEffect(() => {
    const loadCheckDetail = async () => {
      try {
        console.log("🔄 Loading check detail for ID:", resolvedParams.id)
        const result = await getInventoryCheckDetail(Number(resolvedParams.id))

        if (result.success && result.data) {
          const { session, items } = result.data

          setCheckInfo({
            id: session.id,
            code: session.session_code,
            branch: session.branch_name || "",
            staff: session.staff_name || "",
            notes: session.notes || "",
            tags: session.tags || "",
            status: session.status,
            created_at: session.created_at,
          })

          const productList: Product[] = items.map((item: any) => ({
            id: item.product_id,
            name: item.product_name,
            sku: item.product_sku,
            barcode: item.product_barcode,
            stock_quantity: item.system_quantity,
            image_url: item.product_image,
            actual_quantity: item.actual_quantity,
            difference: item.difference,
            status: item.status,
            reason: item.reason || "",
            notes: item.notes || "",
          }))

          setProducts(productList)
          console.log("✅ Loaded check detail successfully:", productList.length, "products")
        } else {
          toast.error("Không thể tải thông tin phiếu kiểm")
          router.push("/inventory-check")
        }
      } catch (error) {
        console.error("❌ Error loading check detail:", error)
        toast.error("Lỗi khi tải thông tin phiếu kiểm")
        router.push("/inventory-check")
      } finally {
        setIsLoading(false)
      }
    }

    loadCheckDetail()
  }, [resolvedParams.id, router])

  // Tìm kiếm sản phẩm
  useEffect(() => {
    const searchProducts = async () => {
      if (searchTerm.trim().length < 2) {
        setSearchResults([])
        return
      }

      setIsSearching(true)
      try {
        const result = await searchProductsOnly(searchTerm.trim())
        if (result.success && Array.isArray(result.data)) {
          // Lọc bỏ sản phẩm đã có trong phiếu kiểm
          const existingProductIds = products.map((p) => p.id)
          const filteredResults = (result.data as any[]).filter(
            (product: any) => !existingProductIds.includes(product.id),
          )
          setSearchResults(filteredResults as SearchProduct[])
        } else {
          setSearchResults([])
        }
      } catch (error) {
        console.error("❌ Error searching products:", error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }

    const debounceTimer = setTimeout(searchProducts, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchTerm, products])

  // Thêm sản phẩm vào phiếu kiểm
  const handleAddProduct = async (product: SearchProduct) => {
    if (!checkInfo) return

    try {
      console.log("🔄 Adding product to check:", product.id)
      const result = await addProductToCheck(checkInfo.id, product.id)

      if (result.success) {
        const newProduct: Product = {
          id: product.id,
          name: product.name,
          sku: product.sku,
          barcode: product.barcode,
          stock_quantity: product.stock_quantity,
          image_url: product.image_url,
          actual_quantity: undefined,
          difference: 0,
          status: "pending",
          reason: "",
          notes: "",
        }

        setProducts((prev) => [...prev, newProduct])
        setSearchTerm("")
        setSearchResults([])
        setIsAddProductOpen(false)
        toast.success(`Đã thêm sản phẩm ${product.name}`)
        console.log("✅ Product added successfully")
      } else {
        toast.error(result.error || "Không thể thêm sản phẩm")
      }
    } catch (error) {
      console.error("❌ Error adding product:", error)
      toast.error("Lỗi khi thêm sản phẩm")
    }
  }

  // Cập nhật số lượng thực tế
  const handleUpdateActualQuantity = async (productId: number, actualQuantity: number) => {
    if (!checkInfo) return

    try {
      console.log("🔄 Updating actual quantity:", { productId, actualQuantity })
      const result = await updateInventoryCheckItemByProduct(checkInfo.id, productId, actualQuantity)

      if (result.success) {
        setProducts((prev) =>
          prev.map((product) =>
            product.id === productId
              ? {
                  ...product,
                  actual_quantity: actualQuantity,
                  difference: actualQuantity - product.stock_quantity,
                  status: actualQuantity === product.stock_quantity ? "matched" : "discrepancy",
                }
              : product,
          ),
        )
        console.log("✅ Actual quantity updated successfully")
      } else {
        toast.error(result.error || "Không thể cập nhật số lượng")
      }
    } catch (error) {
      console.error("❌ Error updating actual quantity:", error)
      toast.error("Lỗi khi cập nhật số lượng")
    }
  }

  // Lưu phiếu kiểm (chuyển từ nháp thành đã kiểm)
  const handleSaveCheck = async () => {
    if (!checkInfo) return

    // Kiểm tra có sản phẩm chưa kiểm không
    const uncheckedProducts = products.filter((p) => p.actual_quantity === undefined || p.actual_quantity === null)
    if (uncheckedProducts.length > 0) {
      toast.error(`Còn ${uncheckedProducts.length} sản phẩm chưa kiểm số lượng thực tế`)
      return
    }

    setIsSaving(true)
    try {
      console.log("🔄 Saving check as completed...")
      const result = await updateInventoryCheckSession(checkInfo.id, {
        status: "completed",
        notes: checkInfo.notes,
        tags: checkInfo.tags,
      })

      if (result.success) {
        toast.success("Đã lưu phiếu kiểm thành công")
        router.push(`/inventory-check/${checkInfo.id}`)
      } else {
        toast.error(result.error || "Không thể lưu phiếu kiểm")
      }
    } catch (error) {
      console.error("❌ Error saving check:", error)
      toast.error("Lỗi khi lưu phiếu kiểm")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Đang tải thông tin phiếu kiểm...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!checkInfo) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p>Không tìm thấy thông tin phiếu kiểm</p>
          <Button onClick={() => router.push("/inventory-check")} className="mt-4">
            Quay lại danh sách
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push(`/inventory-check/${checkInfo.id}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại chi tiết
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Sửa phiếu kiểm hàng</h1>
            <p className="text-muted-foreground">Mã phiếu: {checkInfo.code}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Thêm sản phẩm
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Thêm sản phẩm vào phiếu kiểm</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm theo tên, mã SKU, hoặc mã vạch..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {isSearching && (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div className="max-h-64 overflow-y-auto border rounded-lg">
                    {searchResults.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                        onClick={() => handleAddProduct(product)}
                      >
                        <Image
                          src={product.image_url || "/placeholder.svg?height=40&width=40"}
                          alt={product.name}
                          width={40}
                          height={40}
                          className="rounded"
                        />
                        <div className="flex-1">
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            SKU: {product.sku} {product.barcode && `• Barcode: ${product.barcode}`}
                          </p>
                          <p className="text-sm text-muted-foreground">Tồn kho: {product.stock_quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {searchTerm.length >= 2 && !isSearching && searchResults.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">Không tìm thấy sản phẩm nào</p>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Button onClick={handleSaveCheck} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Đang lưu..." : "Lưu phiếu kiểm"}
          </Button>
        </div>
      </div>

      {/* Thông tin phiếu */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin phiếu</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label>Mã phiếu</Label>
            <Input value={checkInfo.code} disabled />
          </div>
          <div>
            <Label>Chi nhánh</Label>
            <Input value={checkInfo.branch} disabled />
          </div>
          <div>
            <Label>Nhân viên kiểm</Label>
            <Input value={checkInfo.staff} disabled />
          </div>
          <div>
            <Label>Trạng thái</Label>
            <Badge variant="secondary">{checkInfo.status === "draft" ? "Nháp" : "Đã kiểm"}</Badge>
          </div>
          <div className="md:col-span-2">
            <Label>Ghi chú</Label>
            <Textarea
              value={checkInfo.notes}
              onChange={(e) => setCheckInfo((prev) => (prev ? { ...prev, notes: e.target.value } : null))}
              placeholder="Nhập ghi chú..."
            />
          </div>
          <div className="md:col-span-2">
            <Label>Tags</Label>
            <Input
              value={checkInfo.tags}
              onChange={(e) => setCheckInfo((prev) => (prev ? { ...prev, tags: e.target.value } : null))}
              placeholder="Nhập tags..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Danh sách sản phẩm */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách sản phẩm kiểm ({products.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>STT</TableHead>
                <TableHead>Ảnh</TableHead>
                <TableHead>Tên sản phẩm</TableHead>
                <TableHead>Đơn vị</TableHead>
                <TableHead>Tồn chi nhánh</TableHead>
                <TableHead>Tồn thực tế</TableHead>
                <TableHead>Lệch</TableHead>
                <TableHead>Lý do</TableHead>
                <TableHead>Ghi chú</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product, index) => (
                <TableRow key={`${product.id}-${index}`}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <Image
                      src={product.image_url || "/placeholder.svg?height=40&width=40"}
                      alt={product.name}
                      width={40}
                      height={40}
                      className="rounded"
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.sku}</p>
                    </div>
                  </TableCell>
                  <TableCell>---</TableCell>
                  <TableCell>{product.stock_quantity}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={product.actual_quantity || ""}
                      onChange={(e) => {
                        const value = e.target.value === "" ? 0 : Number.parseInt(e.target.value)
                        handleUpdateActualQuantity(product.id, value)
                      }}
                      className="w-20"
                      min="0"
                    />
                  </TableCell>
                  <TableCell>
                    <span
                      className={`font-medium ${
                        product.difference === 0
                          ? "text-green-600"
                          : (product.difference || 0) > 0
                            ? "text-blue-600"
                            : "text-red-600"
                      }`}
                    >
                      {product.difference === 0
                        ? "0"
                        : (product.difference || 0) > 0
                          ? `+${product.difference}`
                          : product.difference}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={product.reason || "none"}
                      onValueChange={(value) => {
                        setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, reason: value } : p)))
                      }}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Chọn lý do" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Không có</SelectItem>
                        <SelectItem value="Hỏng">Hỏng</SelectItem>
                        <SelectItem value="Mất">Mất</SelectItem>
                        <SelectItem value="Khác">Khác</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      value={product.notes || ""}
                      onChange={(e) => {
                        setProducts((prev) =>
                          prev.map((p) => (p.id === product.id ? { ...p, notes: e.target.value } : p)),
                        )
                      }}
                      placeholder="Nhập ghi chú"
                      className="w-40"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {products.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">Chưa có sản phẩm nào trong phiếu kiểm</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
