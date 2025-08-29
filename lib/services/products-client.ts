"use client"

import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStock,
} from "@/lib/services/products"
import type { Product, NewProduct } from "@/lib/types/database"
import type { MutationResult } from "@/lib/services/products" // Import MutationResult type
import { toast } from "@/components/ui/use-toast" // Ensure toast is imported

// Note: These client-side functions now return the MutationResult type
// to propagate success/error messages from the server.

export async function getProductsClient(): Promise<Product[]> {
  try {
    const products = await getProducts()
    return products
  } catch {
    toast({
      title: "Lỗi",
      description: "Không thể tải danh sách sản phẩm.",
      variant: "destructive",
    })
    return []
  }
}

export async function getProductByIdClient(id: number): Promise<Product | null> {
  try {
    const product = await getProductById(id)
    return product
  } catch {
    toast({
      title: "Lỗi",
      description: "Không thể tải thông tin sản phẩm.",
      variant: "destructive",
    })
    return null
  }
}

export async function createProductClient(productData: NewProduct): Promise<MutationResult<Product | null>> {
  try {
    const result = await createProduct(productData)
    if (!result.success) {
      // No alert here, let the form handle the error display
    }
    return result // Return the full MutationResult
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Có lỗi xảy ra khi tạo sản phẩm."
    return { success: false, error: errorMessage }
  }
}

export async function updateProductClient(
  id: number,
  productData: Partial<NewProduct>,
): Promise<MutationResult<Product | null>> {
  try {
    const result = await updateProduct(id, productData)
    if (!result.success) {
      // No alert here, let the form handle the error display
    }
    return result // Return the full MutationResult
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Có lỗi xảy ra khi cập nhật sản phẩm."
    return { success: false, error: errorMessage }
  }
}

export async function deleteProductClient(id: number): Promise<MutationResult<boolean>> {
  try {
    const result = await deleteProduct(id)
    if (result.success) {
      toast({
        title: "Thành công",
        description: "Sản phẩm đã được xóa.",
      })
    } else {
      toast({
        title: "Lỗi",
        description: result.error || "Không thể xóa sản phẩm.",
        variant: "destructive",
      })
    }
    return result // Return the full MutationResult
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Có lỗi xảy ra khi xóa sản phẩm."
    return { success: false, error: errorMessage }
  }
}

export async function updateProductStockClient(id: number, quantity: number): Promise<MutationResult<Product | null>> {
  try {
    const result = await updateProductStock(id, quantity)
    return result // Return the full MutationResult
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Có lỗi xảy ra khi cập nhật số lượng tồn kho."
    return { success: false, error: errorMessage }
  }
}

// Thêm hàm này để lấy danh mục sản phẩm
export async function getCategoriesClient(): Promise<{ id: string; name: string }[]> {
  console.log("Đang tải danh mục...")
  try {
    // Đây là một triển khai giả lập. Trong ứng dụng thực tế, bạn sẽ lấy dữ liệu từ backend/database.
    // Ví dụ: sử dụng fetch API đến một route API của Next.js hoặc client database trực tiếp.
    await new Promise((resolve) => setTimeout(resolve, 300)) // Giả lập độ trễ mạng
    const mockCategories = [
      { id: "1", name: "Điện thoại" },
      { id: "2", name: "Laptop" },
      { id: "3", name: "Tablet" },
      { id: "4", name: "Phụ kiện" },
      { id: "5", name: "Đồng hồ" },
      { id: "6", name: "Máy ảnh" },
      { id: "7", name: "Gaming" },
      { id: "8", name: "Âm thanh" },
    ]
    return mockCategories
  } catch {
    toast({
      title: "Lỗi",
      description: "Không thể tải danh sách danh mục.",
      variant: "destructive",
    })
    return []
  }
}
