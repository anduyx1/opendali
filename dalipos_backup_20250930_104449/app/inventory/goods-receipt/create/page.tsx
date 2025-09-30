"use client"

import { useState, useEffect, useTransition, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Search, Plus, Minus, X, Settings, Package } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { getProductsClient } from "@/lib/services/products-client"
import { getSuppliersClient } from "@/lib/services/suppliers-client"
import { createGoodsReceipt } from "@/lib/actions/goods-receipt"
import { createSupplier } from "@/lib/actions/suppliers"
import { useRouter } from "next/navigation"
import type { Product } from "@/lib/types/database"
import Image from "next/image"
import Link from "next/link"

interface GoodsReceiptItem {
  id: number
  productId: number
  productName: string
  sku?: string
  barcode?: string
  imageUrl?: string
  unit: string
  quantity: number
  unitPrice: number
  discount: number
  stockQuantity: number
}

interface Supplier {
  id: number
  name: string
  phone?: string
  email?: string
  address?: string
  created_at: string
  updated_at: string
}

export default function CreateGoodsReceiptPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Form states
  const [supplier, setSupplier] = useState("")
  const [branch, setBranch] = useState("Chi nhánh mặc định")
  const [staff, setStaff] = useState("Dali")
  const [deliveryDate, setDeliveryDate] = useState("")
  const [note, setNote] = useState("")
  const [tags, setTags] = useState("")

  // Product states
  const [products, setProducts] = useState<GoodsReceiptItem[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [showAddProductModal, setShowAddProductModal] = useState(false)

  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set())

  // Supplier states
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [showCreateSupplierModal, setShowCreateSupplierModal] = useState(false)
  const [supplierSearchResults, setSupplierSearchResults] = useState<Supplier[]>([])
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    phone: "",
    address: "",
    email: "",
  })

  // Load data
  useEffect(() => {
    const loadData = async () => {
      const [productsData, suppliersData] = await Promise.all([getProductsClient(), getSuppliersClient()])
      setAllProducts(productsData)
      setSuppliers(suppliersData.map(supplier => ({
        ...supplier,
        phone: supplier.phone || undefined,
        address: supplier.address || undefined,
        email: supplier.email || undefined,
        created_at: supplier.created_at.toISOString(),
        updated_at: supplier.updated_at.toISOString()
      })))
    }
    loadData()
  }, [])

  // Search products
  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = allProducts
        .filter(
          (p) =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (p.barcode && p.barcode.toLowerCase().includes(searchTerm.toLowerCase())),
        )
        .slice(0, 10)
      setSearchResults(filtered)
    } else {
      setSearchResults([])
    }
  }, [searchTerm, allProducts])

  // Search suppliers
  useEffect(() => {
    if (supplier.trim()) {
      const filtered = suppliers
        .filter(
          (s) =>
            s.name.toLowerCase().includes(supplier.toLowerCase()) ||
            (s.phone && s.phone.includes(supplier)) ||
            (s.email && s.email.toLowerCase().includes(supplier.toLowerCase())),
        )
        .slice(0, 10)
      setSupplierSearchResults(filtered)
    } else {
      setSupplierSearchResults([])
    }
  }, [supplier, suppliers])

  const addProduct = (product: Product) => {
    if (products.some((p) => p.productId === product.id)) {
      toast({
        title: "Sản phẩm đã tồn tại",
        description: "Sản phẩm này đã có trong đơn nhập hàng",
        variant: "destructive",
      })
      return
    }

    const newItem: GoodsReceiptItem = {
      id: Date.now(),
      productId: product.id,
      productName: product.name,
      sku: product.sku || undefined,
      barcode: product.barcode || undefined,
      imageUrl: product.image_url || undefined,
      unit: "SP",
      quantity: 1,
      unitPrice: product.wholesale_price || product.retail_price,
      discount: 0,
      stockQuantity: product.stock_quantity,
    }

    setProducts((prev) => [...prev, newItem])
    setSearchTerm("")
    setSearchResults([])
    toast({
      title: "Thành công",
      description: `Đã thêm sản phẩm ${product.name}`,
    })
  }

  // Add multiple products
  const addMultipleProducts = () => {
    const productsToAdd = allProducts
      .filter((p) => selectedProducts.has(p.id))
      .filter((p) => !products.some((existing) => existing.productId === p.id))
      .map((product) => ({
        id: Date.now() + Math.random(),
        productId: product.id,
        productName: product.name,
        sku: product.sku || undefined,
        barcode: product.barcode || undefined,
        imageUrl: product.image_url || undefined,
        unit: "SP",
        quantity: 1,
        unitPrice: product.wholesale_price || product.retail_price,
        discount: 0,
        stockQuantity: product.stock_quantity,
      }))

    setProducts((prev) => [...prev, ...productsToAdd])
    setSelectedProducts(new Set())
    setShowAddProductModal(false)

    toast({
      title: "Thành công",
      description: `Đã thêm ${productsToAdd.length} sản phẩm`,
      variant: "default",
    })
  }

  const updateQuantity = (id: number, newQuantity: number) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, quantity: Math.max(0, newQuantity) } : p)))
  }

  // Update product field
  const updateProduct = (id: number, field: keyof GoodsReceiptItem, value: string | number) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)))
  }

  // Remove product
  const removeProduct = (id: number) => {
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }

  const handleCreateSupplier = async () => {
    if (!newSupplier.name.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tên nhà cung cấp",
        variant: "destructive",
      })
      return
    }

    try {
      const result = await createSupplier(newSupplier)

      if (result.success) {
        const supplierData: Supplier = {
          id: result.data?.id || 0,
          name: result.data?.name || "",
          phone: result.data?.phone || undefined,
          address: result.data?.address || undefined,
          email: result.data?.email || undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        setSelectedSupplier(supplierData)
        setSupplier(supplierData.name)

        // Cập nhật danh sách suppliers nếu là nhà cung cấp mới
        if (!suppliers.find((s) => s.id === supplierData.id)) {
          setSuppliers((prev) => [...prev, supplierData])
        }

        setNewSupplier({ name: "", phone: "", address: "", email: "" })
        setShowCreateSupplierModal(false)

        toast({
          title: "Thành công",
          description: result.message,
          variant: "default",
        })
      } else {
        toast({
          title: "Lỗi",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi tạo nhà cung cấp",
        variant: "destructive",
      })
    }
  }

  // Select supplier
  const selectSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setSupplier(supplier.name)
    setSupplierSearchResults([])
  }

  // Calculate totals
  const totalQuantity = products.reduce((sum, p) => sum + p.quantity, 0)
  const totalAmount = products.reduce((sum, p) => sum + (p.quantity * p.unitPrice - p.discount), 0)

  // Handle submit
  const handleSubmit = () => {
    if (products.length === 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng thêm sản phẩm vào đơn nhập hàng",
        variant: "destructive",
      })
      return
    }

    startTransition(async () => {
      try {
        const result = await createGoodsReceipt({
          supplier: selectedSupplier?.name || supplier || "Nhà cung cấp mặc định",
          branch,
          staff,
          deliveryDate,
          note,
          tags,
          items: products.map((p) => ({
            productId: p.productId,
            quantity: p.quantity,
            unitPrice: p.unitPrice,
            discount: p.discount,
          })),
        })

        if (result.success) {
          toast({
            title: "Thành công",
            description: `Đã tạo đơn nhập hàng ${result.receiptCode} thành công`,
            variant: "default",
          })
          router.push("/inventory/goods-receipt")
        } else {
          toast({
            title: "Lỗi",
            description: result.error || "Không thể tạo đơn nhập hàng",
            variant: "destructive",
          })
        }
      } catch {
        toast({
          title: "Lỗi",
          description: "Đã xảy ra lỗi khi tạo đơn nhập hàng",
          variant: "destructive",
        })
      }
    })
  }

  // Handle save draft
  const handleSaveDraft = () => {
    toast({
      title: "Thông báo",
      description: "Chức năng lưu nháp đang được phát triển",
      variant: "default",
    })
  }

  // Product search for mobile
  const [showProductModal, setShowProductModal] = useState(false)

  useEffect(() => {
    if (searchTerm.trim()) {
      setShowProductModal(true)
    }
  }, [searchTerm])

  const focusSearchInput = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-50 bg-white border-b">
        <div className="flex items-center p-4">
          <Link href="/inventory/goods-receipt">
            <Button variant="ghost" size="sm" className="p-2">
              <X className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1 mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                ref={searchInputRef}
                placeholder="Tìm và thêm sản phẩm vào đơn"
                className="pl-10 bg-gray-100 border-0 rounded-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => {
                  if (!showProductModal) {
                    setShowProductModal(true)
                  }
                }}
              />
            </div>
          </div>
          <Button variant="ghost" size="sm" className="p-2">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between p-4 md:p-6">
        <div className="flex items-center gap-2">
          <Link href="/inventory/goods-receipt">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Tạo đơn nhập hàng</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/inventory/goods-receipt")}>
            Thoát
          </Button>
          <Button variant="outline" onClick={handleSaveDraft}>
            Tạo & chưa nhập
          </Button>
          <Button onClick={handleSubmit} disabled={isPending} className="bg-cyan-800 hover:bg-cyan-900">
            {isPending ? "Đang tạo..." : "Tạo & nhập hàng"}
          </Button>
        </div>
      </div>

      {/* Mobile Content */}
      <div className="md:hidden px-4 pb-24">
        {products.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-cyan-50 rounded-full flex items-center justify-center">
              <Package className="w-12 h-12 text-cyan-600" />
            </div>
            <p className="text-muted-foreground mb-4">Đơn nhập hàng của bạn chưa có sản phẩm nào!</p>
            <Button onClick={focusSearchInput} className="bg-cyan-800 hover:bg-cyan-900">
              Chọn nhiều sản phẩm
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {products.map((product) => (
              <div key={product.id} className="bg-white border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <Image
                      src={product.imageUrl || "/placeholder.svg?height=50&width=50"}
                      alt={product.productName}
                      width={50}
                      height={50}
                      className="rounded object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-base truncate">{product.productName}</h3>
                      <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                      <p className="font-semibold text-sm">{formatCurrency(product.unitPrice)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(product.id, product.quantity - 1)}
                      className="w-7 h-7 rounded-full touch-manipulation p-0 flex-shrink-0"
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <Input
                      type="number"
                      value={product.quantity}
                      onChange={(e) => updateQuantity(product.id, Number.parseInt(e.target.value) || 0)}
                      className="w-10 text-center text-xs h-7 flex-shrink-0"
                      min="0"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(product.id, product.quantity + 1)}
                      className="w-7 h-7 rounded-full touch-manipulation p-0 flex-shrink-0"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeProduct(product.id)}
                      className="text-red-500 hover:text-red-700 w-7 h-7 p-0 flex-shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            <div className="mt-4 pt-4 border-t hidden md:block">
              <Button variant="outline" onClick={() => setShowProductModal(true)} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Thêm sản phẩm khác
              </Button>
            </div>
          </div>
        )}

        {searchResults.length > 0 && (
          <div className="absolute top-16 left-4 right-4 bg-white border rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
            {searchResults.map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                onClick={() => addProduct(product)}
              >
                <Image
                  src={product.image_url || "/placeholder.svg?height=40&width=40"}
                  alt={product.name}
                  width={40}
                  height={40}
                  className="rounded object-cover"
                />
                <div className="flex-1">
                  <div className="font-medium">{product.name}</div>
                  <div className="text-sm text-muted-foreground">
                    SKU: {product.sku || "N/A"} | Tồn: {product.stock_quantity}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{formatCurrency(product.wholesale_price || product.retail_price)}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white rounded-lg p-4 mb-6">
          <h3 className="font-medium mb-3">Nhà cung cấp</h3>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tên, SĐT..."
              className="pl-8"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
            />
          </div>

          {supplierSearchResults.length > 0 && (
            <div className="mt-2 border rounded-lg max-h-48 overflow-y-auto bg-background shadow-lg">
              {supplierSearchResults.map((supplier) => (
                <div
                  key={supplier.id}
                  className="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                  onClick={() => selectSupplier(supplier)}
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm">{supplier.name}</div>
                    <div className="text-xs text-muted-foreground">{supplier.phone}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedSupplier && (
            <div className="mt-3 p-3 border rounded-lg bg-muted/50">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium text-sm">{selectedSupplier.name}</div>
                  <div className="text-xs text-muted-foreground">{selectedSupplier.phone}</div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedSupplier(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Summary */}
        <div className="bg-white rounded-lg p-4 mb-6 space-y-3">
          <div className="flex justify-between text-sm">
            <span>Tổng số lượng</span>
            <span className="font-medium">{totalQuantity}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Tổng tiền hàng</span>
            <span className="font-medium">{formatCurrency(totalAmount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Thuế</span>
            <span className="font-medium">0</span>
          </div>
          <div className="flex justify-between text-sm text-cyan-600">
            <span>Chiết khấu</span>
            <span className="font-medium">0</span>
          </div>
          <div className="flex justify-between text-sm text-cyan-600">
            <span>Chi phí nhập hàng</span>
            <span className="font-medium">0</span>
          </div>
        </div>

        {/* Mobile Supplier Info */}
        {/* <div className="bg-white rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
              </div>
              <div>
                <div className="font-medium text-sm">{selectedSupplier?.name || supplier || "dali - 0352210000"}</div>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="p-1">
              <ArrowLeft className="h-4 w-4 rotate-180" />
            </Button>
          </div>
        </div> */}

        {/* Mobile Total */}
        <div className="bg-white rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-lg font-medium">Tạm tính</span>
            <span className="text-xl font-bold">{formatCurrency(totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Desktop Content */}
      <div className="hidden md:block">
        <div className="flex flex-col gap-4 p-4 md:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Supplier Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin nhà cung cấp</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Tìm theo tên, SĐT, mã nhà cung cấp... (F4)"
                      className="pl-8"
                      value={supplier}
                      onChange={(e) => setSupplier(e.target.value)}
                    />
                  </div>

                  {/* Dropdown hiển thị kết quả tìm kiếm nhà cung cấp */}
                  {supplierSearchResults.length > 0 && (
                    <div className="mt-2 border rounded-lg max-h-48 overflow-y-auto bg-background shadow-lg">
                      {supplierSearchResults.map((supplier) => (
                        <div
                          key={supplier.id}
                          className="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                          onClick={() => selectSupplier(supplier)}
                        >
                          <div className="flex-1">
                            <div className="font-medium">{supplier.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {supplier.phone} | {supplier.email || "Chưa có email"}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedSupplier ? (
                    <div className="mt-4 p-4 border rounded-lg bg-muted/50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{selectedSupplier.name}</h3>
                          <p className="text-sm text-muted-foreground">{selectedSupplier.phone}</p>
                          <p className="text-sm text-muted-foreground">{selectedSupplier.address}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedSupplier(null)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <div className="text-4xl mb-2">📋</div>
                      <p>Chưa có thông tin nhà cung cấp</p>
                      <Dialog open={showCreateSupplierModal} onOpenChange={setShowCreateSupplierModal}>
                        <DialogTrigger asChild>
                          <Button className="mt-4 bg-transparent" variant="outline">
                            <Plus className="h-4 w-4 mr-2" />
                            Tạo nhanh nhà cung cấp
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Tạo nhà cung cấp mới</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="supplier-name">Tên nhà cung cấp *</Label>
                              <Input
                                id="supplier-name"
                                value={newSupplier.name}
                                onChange={(e) => setNewSupplier((prev) => ({ ...prev, name: e.target.value }))}
                                placeholder="Nhập tên nhà cung cấp"
                              />
                            </div>
                            <div>
                              <Label htmlFor="supplier-phone">Số điện thoại</Label>
                              <Input
                                id="supplier-phone"
                                value={newSupplier.phone}
                                onChange={(e) => setNewSupplier((prev) => ({ ...prev, phone: e.target.value }))}
                                placeholder="Nhập số điện thoại"
                              />
                            </div>
                            <div>
                              <Label htmlFor="supplier-address">Địa chỉ</Label>
                              <Input
                                id="supplier-address"
                                value={newSupplier.address}
                                onChange={(e) => setNewSupplier((prev) => ({ ...prev, address: e.target.value }))}
                                placeholder="Nhập địa chỉ"
                              />
                            </div>
                            <div>
                              <Label htmlFor="supplier-email">Email</Label>
                              <Input
                                id="supplier-email"
                                type="email"
                                value={newSupplier.email}
                                onChange={(e) => setNewSupplier((prev) => ({ ...prev, email: e.target.value }))}
                                placeholder="Nhập email"
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" onClick={() => setShowCreateSupplierModal(false)}>
                                Hủy
                              </Button>
                              <Button onClick={handleCreateSupplier}>Tạo nhà cung cấp</Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Product Info */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Thông tin sản phẩm</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Tách dòng</Badge>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Search */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Tìm theo tên, mã SKU, hoặc quét mã Barcode...(F3)"
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Dialog open={showAddProductModal} onOpenChange={setShowAddProductModal}>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          <Plus className="h-4 w-4 mr-2" />
                          Thêm nhiều sản phẩm
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Chọn sản phẩm</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Tìm kiếm theo tên, mã SKU, Barcode sản phẩm" className="pl-8" />
                          </div>
                          <div className="text-sm text-muted-foreground">Đã chọn {selectedProducts.size} sản phẩm</div>
                          <div className="max-h-96 overflow-y-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-[50px]">
                                    <input
                                      type="checkbox"
                                      checked={selectedProducts.size === allProducts.length}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedProducts(new Set(allProducts.map((p) => p.id)))
                                        } else {
                                          setSelectedProducts(new Set())
                                        }
                                      }}
                                    />
                                  </TableHead>
                                  <TableHead>Ảnh</TableHead>
                                  <TableHead>Tên sản phẩm</TableHead>
                                  <TableHead>Giá nhập</TableHead>
                                  <TableHead>Tồn</TableHead>
                                  <TableHead>Có thể bán</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {allProducts.slice(0, 20).map((product) => (
                                  <TableRow key={product.id}>
                                    <TableCell>
                                      <input
                                        type="checkbox"
                                        checked={selectedProducts.has(product.id)}
                                        onChange={(e) => {
                                          const newSelected = new Set(selectedProducts)
                                          if (e.target.checked) {
                                            newSelected.add(product.id)
                                          } else {
                                            newSelected.delete(product.id)
                                          }
                                          setSelectedProducts(newSelected)
                                        }}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Image
                                        src={product.image_url || "/placeholder.svg?height=40&width=40"}
                                        alt={product.name}
                                        width={40}
                                        height={40}
                                        className="rounded object-cover"
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <div className="font-medium">{product.name}</div>
                                      <div className="text-sm text-muted-foreground">
                                        {product.sku || product.barcode || "N/A"}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      {formatCurrency(product.wholesale_price || product.retail_price)}
                                    </TableCell>
                                    <TableCell>{product.stock_quantity}</TableCell>
                                    <TableCell>{product.stock_quantity}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                          <div className="flex justify-between">
                            <Button variant="outline" onClick={() => setShowAddProductModal(false)}>
                              Thoát
                            </Button>
                            <Button onClick={addMultipleProducts}>Xác nhận</Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Select defaultValue="wholesale">
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="wholesale">Giá nhập</SelectItem>
                        <SelectItem value="retail">Giá bán</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div className="border rounded-lg max-h-48 overflow-y-auto">
                      {searchResults.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                          onClick={() => addProduct(product)}
                        >
                          <Image
                            src={product.image_url || "/placeholder.svg?height=40&width=40"}
                            alt={product.name}
                            width={40}
                            height={40}
                            className="rounded object-cover"
                          />
                          <div className="flex-1">
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {product.sku || product.barcode || "N/A"} | Tồn: {product.stock_quantity}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">
                              {formatCurrency(product.wholesale_price || product.retail_price)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Product Table */}
                  {products.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <div className="text-4xl mb-4">📦</div>
                      <p>Đơn hàng nhập của bạn chưa có sản phẩm nào</p>
                      <Button className="mt-4" onClick={() => setShowAddProductModal(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Thêm sản phẩm
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>STT</TableHead>
                            <TableHead>Ảnh</TableHead>
                            <TableHead>Tên sản phẩm</TableHead>
                            <TableHead>Đơn vị</TableHead>
                            <TableHead>SL nhập</TableHead>
                            <TableHead>Đơn giá</TableHead>
                            <TableHead>Chiết khấu</TableHead>
                            <TableHead>Thành tiền</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {products.map((product, index) => (
                            <TableRow key={product.id}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>
                                <Image
                                  src={product.imageUrl || "/placeholder.svg?height=40&width=40"}
                                  alt={product.productName}
                                  width={40}
                                  height={40}
                                  className="rounded object-cover"
                                />
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">{product.productName}</div>
                                <div className="text-sm text-muted-foreground">
                                  {product.sku || product.barcode || "N/A"}
                                </div>
                              </TableCell>
                              <TableCell>{product.unit}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7 bg-transparent"
                                    onClick={() => updateQuantity(product.id, -1)}
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                  <Input
                                    type="number"
                                    value={product.quantity}
                                    onChange={(e) =>
                                      updateProduct(product.id, "quantity", Number.parseInt(e.target.value) || 0)
                                    }
                                    className="w-16 text-center"
                                  />
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7 bg-transparent"
                                    onClick={() => updateQuantity(product.id, 1)}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={product.unitPrice}
                                  onChange={(e) =>
                                    updateProduct(product.id, "unitPrice", Number.parseFloat(e.target.value) || 0)
                                  }
                                  className="w-24"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={product.discount}
                                  onChange={(e) =>
                                    updateProduct(product.id, "discount", Number.parseFloat(e.target.value) || 0)
                                  }
                                  className="w-20"
                                />
                              </TableCell>
                              <TableCell className="font-semibold">
                                {formatCurrency(product.quantity * product.unitPrice - product.discount)}
                              </TableCell>
                              <TableCell>
                                <Button variant="ghost" size="icon" onClick={() => removeProduct(product.id)}>
                                  <X className="h-4 w-4 text-red-500" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Notes & Tags */}
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="note">Ghi chú đơn</Label>
                      <Textarea
                        id="note"
                        placeholder="VD: Hàng tặng gói riêng"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="tags">Tags</Label>
                      <Input
                        id="tags"
                        placeholder="Nhập ký tự và ấn enter"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Order Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin đơn nhập hàng</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Chi nhánh</Label>
                    <Select value={branch} onValueChange={setBranch}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Chi nhánh mặc định">Chi nhánh mặc định</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Nhân viên</Label>
                    <Select value={staff} onValueChange={setStaff}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Dali">Dali</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Ngày hẹn giao</Label>
                    <Input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
                  </div>
                </CardContent>
              </Card>

              {/* Summary */}
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <div className="flex justify-between">
                    <span>Số lượng:</span>
                    <span className="font-semibold">{totalQuantity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tổng tiền:</span>
                    <span className="font-semibold">{formatCurrency(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Chiết khấu (F6):</span>
                    <span>0</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Chi phí nhập hàng:</span>
                    <Button variant="link" className="h-auto p-0 text-blue-600">
                      <Plus className="h-3 w-3 mr-1" />
                      Thêm chi phí (F7)
                    </Button>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Thuế:</span>
                    <span>0</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Tiền cần trả:</span>
                    <span className="font-semibold">{formatCurrency(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Còn phải trả:</span>
                    <span>{formatCurrency(totalAmount)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Button */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t"
        style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
      >
        <div className="mb-16">
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className="w-full bg-cyan-800 hover:bg-cyan-900 text-white py-3 text-base font-medium"
          >
            {isPending ? "Đang tạo..." : "Tạo & nhập hàng"}
          </Button>
        </div>
      </div>

      {/* Modals */}
      <Dialog open={showAddProductModal} onOpenChange={setShowAddProductModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chọn sản phẩm</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Tìm kiếm theo tên, mã SKU, Barcode sản phẩm" className="pl-8" />
            </div>
            <div className="text-sm text-muted-foreground">Đã chọn {selectedProducts.size} sản phẩm</div>
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <input
                        type="checkbox"
                        checked={selectedProducts.size === allProducts.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProducts(new Set(allProducts.map((p) => p.id)))
                          } else {
                            setSelectedProducts(new Set())
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Ảnh</TableHead>
                    <TableHead>Tên sản phẩm</TableHead>
                    <TableHead>Giá nhập</TableHead>
                    <TableHead>Tồn</TableHead>
                    <TableHead>Có thể bán</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allProducts.slice(0, 20).map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedProducts.has(product.id)}
                          onChange={(e) => {
                            const newSelected = new Set(selectedProducts)
                            if (e.target.checked) {
                              newSelected.add(product.id)
                            } else {
                              newSelected.delete(product.id)
                            }
                            setSelectedProducts(newSelected)
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Image
                          src={product.image_url || "/placeholder.svg?height=40&width=40"}
                          alt={product.name}
                          width={40}
                          height={40}
                          className="rounded object-cover"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">{product.sku || product.barcode || "N/A"}</div>
                      </TableCell>
                      <TableCell>{formatCurrency(product.wholesale_price || product.retail_price)}</TableCell>
                      <TableCell>{product.stock_quantity}</TableCell>
                      <TableCell>{product.stock_quantity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setShowAddProductModal(false)}>
                Thoát
              </Button>
              <Button onClick={addMultipleProducts}>Xác nhận</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateSupplierModal} onOpenChange={setShowCreateSupplierModal}>
        <DialogTrigger asChild>
          <Button className="mt-4 bg-transparent" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Tạo nhanh nhà cung cấp
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo nhà cung cấp mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="supplier-name">Tên nhà cung cấp *</Label>
              <Input
                id="supplier-name"
                value={newSupplier.name}
                onChange={(e) => setNewSupplier((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Nhập tên nhà cung cấp"
              />
            </div>
            <div>
              <Label htmlFor="supplier-phone">Số điện thoại</Label>
              <Input
                id="supplier-phone"
                value={newSupplier.phone}
                onChange={(e) => setNewSupplier((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="Nhập số điện thoại"
              />
            </div>
            <div>
              <Label htmlFor="supplier-address">Địa chỉ</Label>
              <Input
                id="supplier-address"
                value={newSupplier.address}
                onChange={(e) => setNewSupplier((prev) => ({ ...prev, address: e.target.value }))}
                placeholder="Nhập địa chỉ"
              />
            </div>
            <div>
              <Label htmlFor="supplier-email">Email</Label>
              <Input
                id="supplier-email"
                type="email"
                value={newSupplier.email}
                onChange={(e) => setNewSupplier((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="Nhập email"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateSupplierModal(false)}>
                Hủy
              </Button>
              <Button onClick={handleCreateSupplier}>Tạo nhà cung cấp</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
