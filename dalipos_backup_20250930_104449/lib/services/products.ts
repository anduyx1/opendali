"use server"

import { unstable_noStore as noStore } from "next/cache"
import { dbPool as mysql } from "@/lib/mysql/client"
import type { Product } from "@/lib/types/database"
import { parseNumber } from "@/lib/utils"
import { formatToMySQLDateTime } from "@/lib/mysql/utils"
import * as cloudinary from "cloudinary" // Import Cloudinary
import type { RowDataPacket } from "mysql2"

// Configure Cloudinary for server-side deletion
//cloudinary.v2.config({
//  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//  api_key: process.env.CLOUDINARY_API_KEY,
//  api_secret: process.env.CLOUDINARY_API_SECRET,
//  secure: true,
//})

// Define a common return type for mutations
export type MutationResult<T> = { success: true; data: T } | { success: false; error: string }

interface ProductRow extends RowDataPacket {
  id: number
  name: string
  description: string | null
  retail_price: number
  wholesale_price: number | null
  cost_price: number | null
  stock_quantity: number
  min_stock_level: number | null
  barcode: string | null
  image_url: string | null
  status: string
  category_id: number | null
  category_name: string | null
  created_at: Date
  updated_at: Date
  sku: string | null
}

export async function getProducts(): Promise<Product[]> {
  noStore()
  try {
    const [rows] = await mysql.execute(
      `SELECT p.*, c.name AS category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       ORDER BY p.created_at DESC`,
    )
    return (rows as ProductRow[]).map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      retail_price: parseNumber(row.retail_price),
      wholesale_price: parseNumber(row.wholesale_price),
      cost_price: parseNumber(row.cost_price),
      stock_quantity: row.stock_quantity,
      min_stock_level: row.min_stock_level,
      barcode: row.barcode,
      image_url: row.image_url,
      status: row.status,
      category_id: row.category_id,
      category: row.category_name,
      image_data: null, // Add missing property
      is_service: false, // Add missing property
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
      sku: row.sku,
    }))
  } catch (error) {
    console.error("Error fetching products from MySQL:", error)
    throw error
  }
}

export async function getProductById(id: number): Promise<Product | null> {
  noStore()
  try {
    const [rows] = await mysql.execute(
      `SELECT p.*, c.name AS category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ?`,
      [id],
    )
    const row = (rows as ProductRow[])[0]
    if (!row) return null

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      retail_price: parseNumber(row.retail_price),
      wholesale_price: parseNumber(row.wholesale_price),
      cost_price: parseNumber(row.cost_price),
      stock_quantity: row.stock_quantity,
      min_stock_level: row.min_stock_level,
      barcode: row.barcode,
      image_url: row.image_url,
      status: row.status,
      category_id: row.category_id,
      category: row.category_name,
      image_data: null, // Add missing property
      is_service: false, // Add missing property
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
      sku: row.sku,
    }
  } catch (error) {
    console.error("Error fetching product from MySQL:", error)
    throw error
  }
}

export async function createProduct(
  productInput: Omit<Product, "id" | "created_at" | "updated_at" | "image_data" | "price" | "isService" | "category">,
): Promise<MutationResult<Product | null>> {
  try {
    const [result] = await mysql.execute(
      `INSERT INTO products (name, description, retail_price, wholesale_price, cost_price, stock_quantity, min_stock_level, barcode, image_url, status, category_id, sku)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        productInput.name,
        productInput.description || null,
        productInput.retail_price,
        productInput.wholesale_price || null,
        productInput.cost_price || null,
        productInput.stock_quantity,
        productInput.min_stock_level || null,
        productInput.barcode || null,
        productInput.image_url || null,
        productInput.status,
        productInput.category_id || null,
        productInput.sku || null,
      ],
    )
    // @ts-expect-error - MySQL result.insertId is not typed but exists at runtime
    const newId = result.insertId
    const newProduct = await getProductById(newId)
    return { success: true, data: newProduct }
  } catch (error: unknown) {
    console.error("Error creating product in MySQL:", error)
    const mysqlError = error as { code?: string; sqlMessage?: string }
    if (mysqlError.code === "ER_DUP_ENTRY" && mysqlError.sqlMessage?.includes("barcode")) {
      return { success: false, error: "Mã vạch này đã tồn tại. Vui lòng sử dụng mã vạch khác." }
    }
    if (mysqlError.code === "ER_DUP_ENTRY" && mysqlError.sqlMessage?.includes("sku")) {
      return { success: false, error: "Mã SKU này đã tồn tại. Vui lòng sử dụng mã SKU khác." }
    }
    if (mysqlError.code === "ER_NO_REFERENCED_ROW_2" || mysqlError.code === "ER_NO_REFERENCED_ROW") {
      return { success: false, error: "Danh mục sản phẩm không hợp lệ. Vui lòng chọn một danh mục hiện có." }
    }
    return { success: false, error: "Có lỗi xảy ra khi lưu sản phẩm." }
  }
}

export async function updateProduct(
  id: number,
  updates: Partial<
    Omit<Product, "id" | "created_at" | "updated_at" | "image_data" | "price" | "isService" | "category">
  >,
): Promise<MutationResult<Product | null>> {
  try {
    const updateFields: string[] = []
    const updateValues: (string | number | null)[] = []

    if (updates.name !== undefined) {
      updateFields.push("name = ?")
      updateValues.push(updates.name)
    }
    if (updates.description !== undefined) {
      updateFields.push("description = ?")
      updateValues.push(updates.description || null)
    }
    if (updates.retail_price !== undefined) {
      updateFields.push("retail_price = ?")
      updateValues.push(updates.retail_price)
    }
    if (updates.wholesale_price !== undefined) {
      updateFields.push("wholesale_price = ?")
      updateValues.push(updates.wholesale_price || null)
    }
    if (updates.cost_price !== undefined) {
      updateFields.push("cost_price = ?")
      updateValues.push(updates.cost_price || null)
    }
    if (updates.stock_quantity !== undefined) {
      updateFields.push("stock_quantity = ?")
      updateValues.push(updates.stock_quantity)
    }
    if (updates.min_stock_level !== undefined) {
      updateFields.push("min_stock_level = ?")
      updateValues.push(updates.min_stock_level || null)
    }
    if (updates.barcode !== undefined) {
      updateFields.push("barcode = ?")
      updateValues.push(updates.barcode || null)
    }
    if (updates.image_url !== undefined) {
      updateFields.push("image_url = ?")
      updateValues.push(updates.image_url || null)
    }
    if (updates.status !== undefined) {
      updateFields.push("status = ?")
      updateValues.push(updates.status)
    }
    if (updates.category_id !== undefined) {
      updateFields.push("category_id = ?")
      updateValues.push(updates.category_id || null)
    }
    if (updates.sku !== undefined) {
      updateFields.push("sku = ?")
      updateValues.push(updates.sku || null)
    }

    if (updateFields.length === 0) {
      const currentProduct = await getProductById(id)
      return { success: true, data: currentProduct }
    }

    await mysql.execute(`UPDATE products SET ${updateFields.join(", ")}, updated_at = NOW() WHERE id = ?`, [
      ...updateValues,
      id,
    ])
    const updatedProduct = await getProductById(id)
    return { success: true, data: updatedProduct }
  } catch (error: unknown) {
    console.error("Error updating product in MySQL:", error)
    const mysqlError = error as { code?: string; sqlMessage?: string }
    if (mysqlError.code === "ER_DUP_ENTRY" && mysqlError.sqlMessage?.includes("barcode")) {
      return { success: false, error: "Mã vạch này đã tồn tại. Vui lòng sử dụng mã vạch khác." }
    }
    if (mysqlError.code === "ER_DUP_ENTRY" && mysqlError.sqlMessage?.includes("sku")) {
      return { success: false, error: "Mã SKU này đã tồn tại. Vui lòng sử dụng mã SKU khác." }
    }
    if (mysqlError.code === "ER_NO_REFERENCED_ROW_2" || mysqlError.code === "ER_NO_REFERENCED_ROW") {
      return { success: false, error: "Danh mục sản phẩm không hợp lệ. Vui lòng chọn một danh mục hiện có." }
    }
    return { success: false, error: "Có lỗi xảy ra khi cập nhật sản phẩm." }
  }
}

// Helper to extract public_id from Cloudinary URL
const getPublicIdFromCloudinaryUrl = (url: string): string | null => {
  try {
    // Cloudinary URL format: https://res.cloudinary.com/<cloud_name>/image/upload/<version>/<folder>/<public_id>.<format>
    // We need to extract <folder>/<public_id>
    const urlParts = url.split("/")
    const uploadIndex = urlParts.indexOf("upload")
    if (uploadIndex === -1 || uploadIndex + 1 >= urlParts.length) return null

    // The path after 'upload/' might include a version number (e.g., v12345/)
    // and the folder structure. We need to remove the version and extension.
    const pathAfterUpload = urlParts.slice(uploadIndex + 1).join("/")
    const publicIdWithVersionAndExt = pathAfterUpload.replace(/^v\d+\//, "") // Remove version like v123456789/
    const publicId = publicIdWithVersionAndExt.split(".").slice(0, -1).join(".") // Remove extension
    return publicId
  } catch (e) {
    console.error("Error parsing Cloudinary URL:", e)
    return null
  }
}

export async function deleteProduct(id: number): Promise<MutationResult<boolean>> {
  try {
    // 1. Get product details to find image_url
    const productToDelete = await getProductById(id)

    // 2. Delete image from Cloudinary if image_url exists
    if (productToDelete && productToDelete.image_url) {
      const publicId = getPublicIdFromCloudinaryUrl(productToDelete.image_url)
      if (publicId) {
        try {
          await cloudinary.v2.uploader.destroy(publicId)
          console.log(`Successfully deleted Cloudinary image with public ID: ${publicId}`)
        } catch (cloudinaryError: unknown) {
          const errorMessage = cloudinaryError instanceof Error ? cloudinaryError.message : "Unknown error"
          console.error(`Error deleting Cloudinary image ${publicId}:`, errorMessage)
          // Decide whether to fail the product deletion or just log the image deletion error
          // For now, we'll log and proceed with database deletion to maintain data consistency
          // You might want to return an error here if image deletion is critical
        }
      } else {
        console.warn(
          `Could not extract public ID from URL: ${productToDelete.image_url}. Skipping Cloudinary deletion.`,
        )
      }
    }

    // 3. Delete product from database
    const [result] = await mysql.execute("DELETE FROM products WHERE id = ?", [id])
    // @ts-expect-error - MySQL result.affectedRows is not typed but exists at runtime
    const success = result.affectedRows > 0
    return { success: true, data: success }
  } catch (error: unknown) {
    console.error("Error deleting product from MySQL:", error)
    const mysqlError = error as { code?: string }
    if (mysqlError.code === "ER_ROW_IS_REFERENCED_2") {
      return {
        success: false,
        error:
          "Không thể xóa sản phẩm này vì nó đã có trong các đơn hàng. Vui lòng xóa các đơn hàng liên quan trước hoặc thay đổi ràng buộc khóa ngoại.",
      }
    }
    return { success: false, error: "Có lỗi xảy ra khi xóa sản phẩm." }
  }
}

// Modified to take a delta (change in quantity)
export async function updateProductStock(
  productId: number,
  quantityChange: number,
): Promise<MutationResult<Product | null>> {
  noStore()
  try {
    await mysql.execute("UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?", [
      quantityChange,
      productId,
    ])
    const updatedProduct = await getProductById(productId)
    return { success: true, data: updatedProduct }
  } catch (error) {
    console.error("Error updating product stock:", error)
    return { success: false, error: "Có lỗi xảy ra khi cập nhật số lượng tồn kho." }
  }
}

interface TopSellingProductRow extends RowDataPacket {
  id: number
  name: string
  image_url: string | null
  total_quantity_sold: number
  total_revenue: number
}

export async function getTopSellingProducts(limit = 5) {
  noStore()

  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    const [rows] = await mysql.execute(
      `SELECT
         p.id,
         p.name,
         p.image_url,
         COALESCE(SUM(oi.quantity), 0) AS total_quantity_sold,
         COALESCE(SUM(oi.total_price), 0) AS total_revenue
       FROM products p
       JOIN order_items oi ON p.id = oi.product_id
       JOIN orders o ON oi.order_id = o.id
       WHERE o.created_at >= ? AND o.created_at <= ? AND o.order_status = 'completed'
       GROUP BY p.id, p.name, p.image_url
       ORDER BY total_quantity_sold DESC
       LIMIT ?`,
      [formatToMySQLDateTime(startOfMonth), formatToMySQLDateTime(endOfMonth), limit],
    )

    return (rows as TopSellingProductRow[]).map((row) => ({
      id: row.id,
      name: row.name,
      imageUrl: row.image_url,
      quantitySold: Number(row.total_quantity_sold),
      revenue: parseNumber(row.total_revenue),
    }))
  } catch (error) {
    console.error("Error fetching top selling products from MySQL:", error)
    throw error
  }
}

interface ProductPerformanceRow extends RowDataPacket {
  id: number
  name: string
  sku: string | null
  retail_price: number
  cost_price: number
  total_quantity_sold: number
  total_revenue: number
  total_gross_profit: number
}

export async function getMonthlyProductPerformance(
  startDate?: Date,
  endDate?: Date,
): Promise<
  {
    id: number
    name: string
    sku: string | null
    retail_price: number
    cost_price: number
    total_quantity_sold: number
    total_revenue: number
    total_gross_profit: number
  }[]
> {
  noStore()

  try {
    const now = new Date()
    const start = startDate || new Date(now.getFullYear(), now.getMonth(), 1)
    const end = endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    const [rows] = await mysql.execute(
      `SELECT
        p.id,
        p.name,
        p.sku,
        p.retail_price,
        p.cost_price,
        COALESCE(SUM(oi.quantity), 0) AS total_quantity_sold,
        COALESCE(SUM(oi.total_price), 0) AS total_revenue,
        COALESCE(SUM((oi.unit_price - p.cost_price) * oi.quantity), 0) AS total_gross_profit
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id
      WHERE o.created_at >= ? AND o.created_at <= ? AND o.order_status = 'completed'
      GROUP BY p.id, p.name, p.sku, p.retail_price, p.cost_price
      ORDER BY total_revenue DESC`,
      [formatToMySQLDateTime(start), formatToMySQLDateTime(end)],
    )
    return (rows as ProductPerformanceRow[]).map((row) => ({
      id: row.id,
      name: row.name,
      sku: row.sku,
      retail_price: parseNumber(row.retail_price),
      cost_price: parseNumber(row.cost_price),
      total_quantity_sold: Number(row.total_quantity_sold),
      total_revenue: parseNumber(row.total_revenue),
      total_gross_profit: parseNumber(row.total_gross_profit),
    }))
  } catch (error) {
    console.error("Error fetching monthly product performance from MySQL:", error)
    throw error
  }
}

export async function bulkCreateProducts(
  products: Omit<Product, "id" | "created_at" | "updated_at" | "image_data" | "price" | "isService" | "category">[],
): Promise<MutationResult<number>> {
  if (products.length === 0) {
    return { success: true, data: 0 }
  }

  try {
    const values = products.map((p) => [
      p.name,
      p.description || null,
      p.retail_price,
      p.wholesale_price || null,
      p.cost_price || null,
      p.stock_quantity,
      p.min_stock_level || null,
      p.barcode || null,
      p.image_url || null,
      p.status,
      p.category_id || null,
      p.sku || null,
    ])

    const query = `
      INSERT INTO products (name, description, retail_price, wholesale_price, cost_price, stock_quantity, min_stock_level, barcode, image_url, status, category_id, sku)
      VALUES ?
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        description = VALUES(description),
        retail_price = VALUES(retail_price),
        wholesale_price = VALUES(wholesale_price),
        cost_price = VALUES(cost_price),
        stock_quantity = VALUES(stock_quantity),
        min_stock_level = VALUES(min_stock_level),
        image_url = VALUES(image_url),
        status = VALUES(status),
        category_id = VALUES(category_id),
        updated_at = NOW()
    `
    // Using `mysql.query` for `VALUES ?` syntax as `mysql.execute` doesn't directly support it for bulk inserts with `ON DUPLICATE KEY UPDATE`
    // mysql.query with VALUES ? syntax is not fully typed
    const [result] = await mysql.query(query, [values])

    // @ts-expect-error - MySQL result.affectedRows is not typed but exists at runtime
    return { success: true, data: result.affectedRows }
  } catch (error: unknown) {
    console.error("Error bulk creating products in MySQL:", error)
    const mysqlError = error as { code?: string; message?: string }
    if (mysqlError.code === "ER_DUP_ENTRY") {
      return { success: false, error: "Có sản phẩm trùng lặp mã vạch hoặc SKU. Vui lòng kiểm tra lại file." }
    }
    if (mysqlError.code === "ER_NO_REFERENCED_ROW_2" || mysqlError.code === "ER_NO_REFERENCED_ROW") {
      return { success: false, error: "Có sản phẩm có ID danh mục không hợp lệ. Vui lòng kiểm tra lại." }
    }
    return { success: false, error: `Lỗi khi nhập dữ liệu hàng loạt: ${mysqlError.message || "Unknown error"}` }
  }
}
