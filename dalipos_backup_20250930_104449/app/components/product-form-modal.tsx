"use client"

import React from "react"
import { useEffect, useState, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { createProductClient, updateProductClient } from "@/lib/services/products-client"
import { getCategories } from "@/lib/services/categories"
import { uploadProductImage } from "@/lib/utils/image-upload"
import type { Product } from "@/lib/types/database"
import { Upload, Camera, Loader2, X, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { parseNumber } from "@/lib/utils" // Import parseNumber
import Image from "next/image" // Added Next.js Image import for optimization

interface ProductFormModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null
  onSuccess: () => void
}

interface Category {
  id: string
  name: string
}

interface ImageMetadata {
  size: number
  width?: number
  height?: number
  [key: string]: unknown
}

const ProductFormModal: React.FC<ProductFormModalProps> = ({ isOpen, onClose, product, onSuccess }) => {
  const { toast } = useToast()
  const [formData, setFormData] = useState<Partial<Product>>({
    name: "",
    description: "",
    retail_price: 0,
    wholesale_price: 0,
    cost_price: 0,
    stock_quantity: 0,
    min_stock_level: null,
    category: "",
    barcode: "",
    sku: "",
    image_url: "",
    status: "active",
    category_id: null,
  })

  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageData, setImageData] = useState<ImageMetadata | null>(null) // Replaced any type with proper ImageMetadata interface
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [formErrors, setFormErrors] = useState<{
    name?: string | null
    retail_price?: string | null
    wholesale_price?: string | null
    cost_price?: string | null
    stock_quantity?: string | null
    min_stock_level?: string | null
    barcode?: string | null
    sku?: string | null
  }>({})

  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const dialogDescriptionId = React.useId()

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const fetchedCategories = await getCategories()
        if (Array.isArray(fetchedCategories)) {
          setCategories(fetchedCategories.map(cat => ({
            ...cat,
            id: cat.id.toString()
          })))
        } else {
          console.error("getCategories did not return an array:", fetchedCategories)
          setCategories([])
        }
      } catch (error) {
        console.error("Error fetching categories:", error)
        setCategories([])
      }
    }
    if (isOpen) {
      fetchCategories()
    }
  }, [isOpen])

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        description: product.description || "",
        retail_price: product.retail_price || 0,
        wholesale_price: product.wholesale_price || 0,
        cost_price: product.cost_price || 0,
        stock_quantity: product.stock_quantity || 0,
        min_stock_level: product.min_stock_level === 0 ? null : product.min_stock_level,
        category: product.category || "",
        barcode: product.barcode || "",
        sku: product.sku || "",
        image_url: product.image_url || "",
        status: product.status || "active",
        category_id: product.category_id || null,
      })
      setImageUrl(product.image_url || null)
      setImageData(product.image_data ? (product.image_data as any) : null)
    } else {
      setFormData({
        name: "",
        description: "",
        retail_price: 0,
        wholesale_price: 0,
        cost_price: 0,
        stock_quantity: 0,
        min_stock_level: null,
        category: "",
        barcode: "",
        sku: "",
        image_url: "",
        status: "active",
        category_id: null,
      })
      setImageUrl(null)
      setImageData(null)
    }
    setFormErrors({})
    setUploadError(null)
    setIsUploading(false)
  }, [product, isOpen])

  useEffect(() => {
    if (isOpen && product && product.category_id !== null && categories.length > 0) {
      const categoryExists = categories.some((cat) => Number(cat.id) === product.category_id)
      if (!categoryExists) {
        setFormData((prev) => ({
          ...prev,
          category_id: null,
          category: "",
        }))
        toast({
          title: "Cảnh báo!",
          description: "Danh mục của sản phẩm này không còn tồn tại. Vui lòng chọn lại danh mục.",
          variant: "destructive",
        })
      }
    }
  }, [isOpen, product, categories, toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
    setFormErrors((prev) => ({ ...prev, [id]: null }))
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    console.log(`[${id}] Input value:`, value)

    const numValue = value === "" ? "" : parseNumber(value)
    console.log(`[${id}] Parsed value:`, numValue)

    setFormData((prev) => ({ ...prev, [id]: isNaN(numValue as number) ? "" : numValue }))
    setFormErrors((prev) => ({ ...prev, [id]: null }))
  }

  const handleSelectChange = (value: string) => {
    const selectedCategory = categories.find((cat) => cat.id === value)
    setFormData((prev) => ({
      ...prev,
      category_id: selectedCategory ? Number(selectedCategory.id) : null,
      category: selectedCategory ? selectedCategory.name : "",
    }))
  }

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, status: checked ? "active" : "inactive" }))
  }

  const validateForm = () => {
    const errors: typeof formErrors = {}
    let isValid = true

    if (!formData.name || formData.name.trim() === "") {
      errors.name = "Tên sản phẩm không được để trống."
      isValid = false
    }

    const retailPrice = formData.retail_price as number
    if (isNaN(retailPrice) || retailPrice <= 0) {
      errors.retail_price = "Giá bán lẻ phải là số dương."
      isValid = false
    }

    const stockQuantity = formData.stock_quantity as number
    if (isNaN(stockQuantity) || stockQuantity < 0 || !Number.isInteger(stockQuantity)) {
      errors.stock_quantity = "Số lượng tồn kho phải là số nguyên không âm."
      isValid = false
    }

    const wholesalePrice = formData.wholesale_price as number | null
    if (wholesalePrice !== null && (isNaN(wholesalePrice) || wholesalePrice < 0)) {
      errors.wholesale_price = "Giá bán buôn phải là số không âm."
      isValid = false
    }

    const costPrice = formData.cost_price as number | null
    if (costPrice !== null && (isNaN(costPrice) || costPrice < 0)) {
      errors.cost_price = "Giá vốn phải là số không âm."
      isValid = false
    }

    const minStockLevel = formData.min_stock_level as number | null
    if (minStockLevel !== null && (isNaN(minStockLevel) || minStockLevel < 0 || !Number.isInteger(minStockLevel))) {
      errors.min_stock_level = "Mức tồn kho tối thiểu phải là số nguyên không âm."
      isValid = false
    }

    setFormErrors(errors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setFormErrors({})

    if (!validateForm()) {
      setLoading(false)
      return
    }

    try {
      const productDataToSend = {
        ...formData,
        retail_price: formData.retail_price as number,
        wholesale_price: formData.wholesale_price === 0 ? null : Number(formData.wholesale_price || 0),
        cost_price: formData.cost_price === 0 ? null : Number(formData.cost_price || 0),
        stock_quantity: formData.stock_quantity as number,
        min_stock_level: formData.min_stock_level === 0 ? null : Number(formData.min_stock_level || 0),
        barcode: formData.barcode || null,
        sku: formData.sku || null,
        image_url: imageUrl,
        category_id: formData.category_id || null,
      }

      console.log("Product data being sent to server:", productDataToSend)
      console.log("Retail price specifically:", productDataToSend.retail_price, typeof productDataToSend.retail_price)

      let result
      if (product) {
        result = await updateProductClient(product.id, productDataToSend as Partial<Product>)
      } else {
        result = await createProductClient(productDataToSend as Product)
      }

      if (result.success) {
        onSuccess()
        onClose()
        toast({
          title: "Thành công!",
          description: product ? "Sản phẩm đã được cập nhật." : "Sản phẩm đã được thêm mới.",
          variant: "default",
        })
      } else {
        if (result.error && result.error.includes("Mã vạch này đã tồn tại")) {
          setFormErrors({ barcode: result.error })
        } else if (result.error && result.error.includes("Mã SKU này đã tồn tại")) {
          setFormErrors({ sku: result.error })
        } else {
          toast({
            title: "Lỗi!",
            description: result.error || "Có lỗi xảy ra khi lưu sản phẩm.",
            variant: "destructive",
          })
        }
      }
    } catch (error: unknown) {
      console.error("Error saving product (client-side catch):", error)
      const errorMessage = error instanceof Error ? error.message : "Có lỗi không mong muốn xảy ra khi lưu sản phẩm."
      toast({
        title: "Lỗi không xác định!",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadError(null)

    try {
      const result = await uploadProductImage(
        file,
        formData.name || "new-product",
        formData.barcode || Date.now().toString(),
      )

      if (result.success && result.url) {
        setImageUrl(result.url)
        setImageData(result.metadata || null)
      } else {
        setUploadError(result.error || "Không thể tải lên hình ảnh")
      }
    } catch (error) {
      console.error("Upload error:", error)
      setUploadError("Có lỗi xảy ra khi tải lên hình ảnh")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      if (cameraInputRef.current) {
        cameraInputRef.current.value = ""
      }
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"
    else return (bytes / 1048576).toFixed(1) + " MB"
  }

  const handleRemoveImage = () => {
    setImageUrl(null)
    setImageData(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby={dialogDescriptionId}>
        <DialogHeader>
          <DialogTitle>{product ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}</DialogTitle>
          <DialogDescription id={dialogDescriptionId} className="sr-only">
            {product ? "Form để chỉnh sửa thông tin sản phẩm." : "Form để thêm sản phẩm mới."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Tên sản phẩm *</Label>
                <Input id="name" value={formData.name || ""} onChange={(e) => handleChange(e)} required />
                {formErrors.name && (
                  <p className="text-sm font-medium text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {formErrors.name}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="category_id">Danh mục</Label>
                <Select
                  value={formData.category_id?.toString() || ""}
                  onValueChange={(value) => handleSelectChange(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(categories) && categories.length > 0 ? (
                      categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-categories" disabled>
                        Không có danh mục nào
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="retail_price">Giá bán lẻ *</Label>
                <Input
                  id="retail_price"
                  type="text"
                  value={formData.retail_price === 0 ? "" : formData.retail_price?.toString() || ""}
                  onChange={handleNumberChange}
                  required
                />
                {formErrors.retail_price && (
                  <p className="text-sm font-medium text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {formErrors.retail_price}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="wholesale_price">Giá bán buôn</Label>
                <Input
                  id="wholesale_price"
                  type="text"
                  value={formData.wholesale_price === 0 ? "" : formData.wholesale_price?.toString() || ""}
                  onChange={handleNumberChange}
                />
                {formErrors.wholesale_price && (
                  <p className="text-sm font-medium text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {formErrors.wholesale_price}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="cost_price">Giá vốn</Label>
                <Input
                  id="cost_price"
                  type="text"
                  value={formData.cost_price === 0 ? "" : formData.cost_price?.toString() || ""}
                  onChange={handleNumberChange}
                />
                {formErrors.cost_price && (
                  <p className="text-sm font-medium text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {formErrors.cost_price}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="stock_quantity">Số lượng tồn kho *</Label>
                <Input
                  id="stock_quantity"
                  type="text"
                  value={formData.stock_quantity === 0 ? "" : formData.stock_quantity?.toString() || ""}
                  onChange={handleNumberChange}
                  required
                />
                {formErrors.stock_quantity && (
                  <p className="text-sm font-medium text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {formErrors.stock_quantity}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="min_stock_level">Mức tồn kho tối thiểu</Label>
                <Input
                  id="min_stock_level"
                  type="text"
                  value={formData.min_stock_level === null ? "" : formData.min_stock_level?.toString() || ""}
                  onChange={handleNumberChange}
                />
                {formErrors.min_stock_level && (
                  <p className="text-sm font-medium text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {formErrors.min_stock_level}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="barcode">Mã vạch</Label>
                <Input id="barcode" value={formData.barcode || ""} onChange={handleChange} />
                {formErrors.barcode && (
                  <p className="text-sm font-medium text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {formErrors.barcode}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="sku">SKU</Label>
                <Input id="sku" value={formData.sku || ""} onChange={handleChange} />
                {formErrors.sku && (
                  <p className="text-sm font-medium text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {formErrors.sku}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="status">Trạng thái</Label>
              <div className="flex items-center gap-2">
                <Switch id="status" checked={formData.status === "active"} onCheckedChange={handleSwitchChange} />
                <span className="text-sm text-muted-foreground">
                  {formData.status === "active" ? "Hoạt động" : "Tạm dừng"}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
              {imageUrl ? (
                <div className="relative w-full">
                  <Image
                    src={imageUrl || "/placeholder.svg"}
                    alt="Product"
                    width={256}
                    height={256}
                    className="mx-auto max-h-64 object-contain rounded-md"
                    priority={false}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={handleRemoveImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>

                  {imageData && (
                    <div className="mt-2 text-sm text-gray-500 text-center">
                      <p>Kích thước: {formatFileSize(imageData.size)}</p>
                      {imageData.width && imageData.height && (
                        <p>
                          Kích thước: {imageData.width}x{imageData.height}px
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    ref={fileInputRef}
                  />

                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageUpload}
                    className="hidden"
                    ref={cameraInputRef}
                  />

                  <div className="flex flex-col items-center justify-center gap-4">
                    <div className="flex gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="flex items-center gap-2"
                      >
                        {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        Chọn file
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => cameraInputRef.current?.click()}
                        disabled={isUploading}
                        className="flex items-center gap-2"
                      >
                        <Camera className="h-4 w-4" />
                        Chụp ảnh
                      </Button>
                    </div>

                    <p className="text-sm text-gray-500">Hỗ trợ JPG, PNG, GIF. Tối đa 5MB.Ảnh sẽ tự nén</p>
                  </div>
                </>
              )}
            </div>
            {uploadError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{uploadError}</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Đang lưu..." : "Lưu sản phẩm"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default ProductFormModal
