"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import ExcelJS from "exceljs"
import { bulkCreateProducts } from "@/lib/services/products"
import { getAllCategoryIds } from "@/lib/services/categories"
import type { Product } from "@/lib/types/database"
import { v2 as cloudinary } from "cloudinary"
import sharp from "sharp" // Import sharp for server-side image processing
import DatauriParser from "datauri/parser" // To convert buffer to data URI for Cloudinary upload
import { parseNumber } from "@/lib/utils" // Import parseNumber

// Configure Cloudinary for server-side uploads
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

// Define types for parsed data and validation errors
export type ParsedProductRow = {
  [key: string]: any
  originalRowIndex: number // To keep track of the original row number for error reporting
}

export type ImportValidationError = {
  rowIndex: number
  column: string
  message: string
  value: any
}

export type ImportProcessResult = {
  success: boolean
  message: string
  errors?: ImportValidationError[]
  data?: ParsedProductRow[]
  headers?: string[]
}

export type FileDownloadResult = {
  success: boolean
  message: string
  fileData?: string // Base64 encoded file content
  fileName?: string
  error?: string
}

const REQUIRED_HEADERS = ["Tên sản phẩm", "Giá bán lẻ", "Số lượng tồn kho"]

const PRODUCT_FIELD_MAP: Record<string, keyof Product> = {
  "Tên sản phẩm": "name",
  "Mô tả": "description",
  "Giá bán lẻ": "retail_price",
  "Giá bán buôn": "wholesale_price",
  "Giá vốn": "cost_price",
  "Số lượng tồn kho": "stock_quantity",
  "Mức tồn kho tối thiểu": "min_stock_level",
  "Mã vạch": "barcode",
  SKU: "sku",
  "URL hình ảnh": "image_url",
  "Trạng thái": "status",
  "ID danh mục": "category_id",
}

// Helper function to process and upload image from URL to Cloudinary
async function processAndUploadImageFromUrl(
  imageUrl: string,
  publicIdPrefix: string, // e.g., "anhsanpham"
  filenameHint: string, // e.g., product barcode or name
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch image from URL: ${response.statusText} (Status: ${response.status})`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const imageBuffer = Buffer.from(arrayBuffer)

    // Process image with sharp: resize to max 800x800, convert to WebP, set quality
    const processedBuffer = await sharp(imageBuffer)
      .resize(800, 800, { fit: "inside", withoutEnlargement: true }) // Max dimension 800x800px
      .webp({ quality: 80 }) // Convert to WebP with 80% quality
      .toBuffer()

    const parser = new DatauriParser()
    const dataUri = parser.format(".webp", processedBuffer).content

    if (!dataUri) {
      throw new Error("Failed to convert image buffer to Data URI.")
    }

    // Generate a unique public ID for Cloudinary
    const uniqueFilename = `${filenameHint.replace(/[^a-zA-Z0-9_.-]/g, "_")}_${Date.now()}`
    const publicId = `${publicIdPrefix}/${uniqueFilename}`

    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      public_id: publicId,
      folder: publicIdPrefix, // Ensure it's in the specified folder
      resource_type: "image",
    })

    console.log(
      `[Cloudinary Upload Success] Image uploaded: ${uploadResult.secure_url}, Public ID: ${uploadResult.public_id}`,
    )
    return { success: true, url: uploadResult.secure_url }
  } catch (error: any) {
    console.error(`[Cloudinary Upload Error] Failed to process and upload image from URL ${imageUrl}:`, error.message)
    return { success: false, error: `Lỗi xử lý hoặc tải ảnh từ URL: ${error.message}` }
  }
}

export async function uploadAndParseExcel(formData: FormData): Promise<ImportProcessResult> {
  const file = formData.get("file") as File

  if (!file) {
    return { success: false, message: "Không tìm thấy file." }
  }

  if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
    return { success: false, message: "Định dạng file không hợp lệ. Vui lòng tải lên file .xlsx hoặc .xls." }
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer()) as any
    const workbook = new ExcelJS.Workbook()

    if (file.name.endsWith(".xlsx")) {
      await workbook.xlsx.load(buffer)
    } else if (file.name.endsWith(".xls")) {
      return {
        success: false,
        message:
          "Định dạng file .xls hiện không được hỗ trợ. Vui lòng chuyển đổi sang .xlsx hoặc sử dụng một công cụ khác. Thư viện hiện tại chỉ hỗ trợ .xlsx.",
      }
    }

    const worksheet = workbook.worksheets[0]
    if (!worksheet) {
      return { success: false, message: "File Excel không có worksheet nào." }
    }

    const originalHeaders: string[] = []
    worksheet.getRow(1).eachCell((cell) => {
      originalHeaders.push(cell.value?.toString() || "")
    })

    // Create a normalized list of headers for robust checking
    const normalizedHeaders = originalHeaders.map((h) => h.trim().toLowerCase())
    const normalizedRequiredHeaders = REQUIRED_HEADERS.map((h) => h.trim().toLowerCase())

    // Check for required headers using the normalized list
    const missingHeaders = normalizedRequiredHeaders.filter(
      (requiredHeader) => !normalizedHeaders.includes(requiredHeader),
    )
    if (missingHeaders.length > 0) {
      // Map back to original required header names for the message
      const missingOriginalNames = missingHeaders.map(
        (mh) => REQUIRED_HEADERS.find((rh) => rh.trim().toLowerCase() === mh) || mh,
      )
      return {
        success: false,
        message: `Thiếu các cột bắt buộc: ${missingOriginalNames.join(", ")}.`,
        headers: originalHeaders,
      }
    }

    const data: ParsedProductRow[] = []
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return // Skip header row

      const rowData: ParsedProductRow = { originalRowIndex: rowNumber }
      row.eachCell((cell, colNumber) => {
        const header = originalHeaders[colNumber - 1] // Use originalHeaders here
        if (header) {
          rowData[header] = cell.value
        }
      })
      data.push(rowData)
    })

    return {
      success: true,
      message: "File đã được tải lên và phân tích cú pháp thành công.",
      data: data,
      headers: originalHeaders, // Pass originalHeaders to the frontend
    }
  } catch (error: any) {
    console.error("Error parsing Excel file:", error)
    return { success: false, message: `Lỗi khi phân tích cú pháp file Excel: ${error.message}` }
  }
}

export async function processAndImportProducts(
  parsedData: ParsedProductRow[],
  columnMapping: Record<string, string>,
): Promise<ImportProcessResult> {
  const productsToImport: Omit<
    Product,
    "id" | "created_at" | "updated_at" | "image_data" | "price" | "isService" | "category"
  >[] = []
  const validationErrors: ImportValidationError[] = []

  // Fetch all valid category IDs once
  const validCategoryIds = await getAllCategoryIds()

  for (const row of parsedData) {
    const product: Partial<Product> = {}
    let rowHasError = false

    for (const excelCol in columnMapping) {
      const dbField = columnMapping[excelCol] as keyof Product
      let value = row[excelCol]

      // Type conversion and validation
      switch (dbField) {
        case "name":
          if (typeof value !== "string" || value.trim() === "") {
            validationErrors.push({
              rowIndex: row.originalRowIndex,
              column: excelCol,
              message: "Tên sản phẩm không được để trống.",
              value,
            })
            rowHasError = true
          } else {
            product.name = value.trim()
          }
          break
        case "retail_price":
        case "wholesale_price":
        case "cost_price":
          // Use parseNumber for price fields
          value = parseNumber(value)
          if (isNaN(value) || value < 0) {
            validationErrors.push({
              rowIndex: row.originalRowIndex,
              column: excelCol,
              message: "Giá phải là số không âm.",
              value,
            })
            rowHasError = true
          } else {
            product[dbField] = value
          }
          break
        case "stock_quantity":
        case "min_stock_level":
          // Use parseNumber for quantity fields and ensure it's an integer
          value = parseNumber(value)
          if (isNaN(value) || !Number.isInteger(value) || value < 0) {
            validationErrors.push({
              rowIndex: row.originalRowIndex,
              column: excelCol,
              message: "Số lượng/Mức tồn kho phải là số nguyên không âm.",
              value,
            })
            rowHasError = true
          } else {
            product[dbField] = value
          }
          break
        case "category_id":
          if (value === null || value === undefined || value === "") {
            product.category_id = null // Allow null for category_id
          } else {
            value = parseNumber(value) // Use parseNumber for category_id
            if (isNaN(value) || !Number.isInteger(value) || value < 0) {
              validationErrors.push({
                rowIndex: row.originalRowIndex,
                column: excelCol,
                message: "ID danh mục phải là số nguyên không âm hoặc để trống.",
                value,
              })
              rowHasError = true
            } else if (!validCategoryIds.has(value)) {
              validationErrors.push({
                rowIndex: row.originalRowIndex,
                column: excelCol,
                message: `ID danh mục '${value}' không tồn tại.`,
                value,
              })
              rowHasError = true
            } else {
              product.category_id = value
            }
          }
          break
        case "status":
          if (typeof value !== "string" || !["active", "inactive"].includes(value.toLowerCase())) {
            validationErrors.push({
              rowIndex: row.originalRowIndex,
              column: excelCol,
              message: "Trạng thái phải là 'active' hoặc 'inactive'.",
              value,
            })
            rowHasError = true
          } else {
            product.status = value.toLowerCase() as "active" | "inactive"
          }
          break
        case "barcode":
        case "sku":
        case "description":
          product[dbField] = value ? String(value).trim() : null
          break
        case "image_url":
          // Handle image URL: download, process, and upload to Cloudinary
          if (typeof value === "string" && value.trim() !== "") {
            const filenameHint = product.barcode || product.name || `product_${row.originalRowIndex}`
            const uploadResult = await processAndUploadImageFromUrl(value.trim(), "anhsanpham", filenameHint)
            if (uploadResult.success) {
              product.image_url = uploadResult.url
            } else {
              validationErrors.push({
                rowIndex: row.originalRowIndex,
                column: excelCol,
                message: uploadResult.error || "Lỗi khi xử lý hoặc tải ảnh lên Cloudinary.",
                value,
              })
              rowHasError = true
              product.image_url = null // Set to null if upload fails
            }
          } else {
            product.image_url = null // Allow null if no URL provided
          }
          break
        default:
          // Ignore unmapped or unknown fields
          break
      }
    }

    // Ensure required fields are present after mapping
    if (!product.name && !rowHasError) {
      validationErrors.push({
        rowIndex: row.originalRowIndex,
        column: "Tên sản phẩm",
        message: "Tên sản phẩm không được để trống.",
        value: "",
      })
      rowHasError = true
    }
    if (typeof product.retail_price !== "number" && !rowHasError) {
      validationErrors.push({
        rowIndex: row.originalRowIndex,
        column: "Giá bán lẻ",
        message: "Giá bán lẻ không hợp lệ.",
        value: "",
      })
      rowHasError = true
    }
    if (typeof product.stock_quantity !== "number" && !rowHasError) {
      validationErrors.push({
        rowIndex: row.originalRowIndex,
        column: "Số lượng tồn kho",
        message: "Số lượng tồn kho không hợp lệ.",
        value: "",
      })
      rowHasError = true
    }

    if (!rowHasError) {
      // Set default values for optional fields if not provided
      if (product.status === undefined) product.status = "active"
      if (product.wholesale_price === undefined) product.wholesale_price = 0
      if (product.cost_price === undefined) product.cost_price = 0
      if (product.min_stock_level === undefined) product.min_stock_level = null
      if (product.category_id === undefined) product.category_id = null
      if (product.barcode === undefined) product.barcode = null
      if (product.sku === undefined) product.sku = null
      if (product.image_url === undefined) product.image_url = null
      if (product.description === undefined) product.description = null

      productsToImport.push(
        product as Omit<
          Product,
          "id" | "created_at" | "updated_at" | "image_data" | "price" | "isService" | "category"
        >,
      )
    }
  }

  if (validationErrors.length > 0) {
    return { success: false, message: "Có lỗi xác thực dữ liệu. Vui lòng kiểm tra lại.", errors: validationErrors }
  }

  if (productsToImport.length === 0) {
    return { success: false, message: "Không có sản phẩm hợp lệ nào để nhập." }
  }

  try {
    const result = await bulkCreateProducts(productsToImport)
    if (result.success) {
      revalidatePath("/products") // Revalidate product list page
      return { success: true, message: `Đã nhập thành công ${productsToImport.length} sản phẩm.` }
    } else {
      return { success: false, message: result.error || "Lỗi khi lưu sản phẩm vào cơ sở dữ liệu." }
    }
  } catch (error: any) {
    console.error("Error importing products to database:", error)
    return { success: false, message: `Lỗi không xác định khi nhập sản phẩm: ${error.message}` }
  }
}

export async function downloadProductTemplateAction(): Promise<FileDownloadResult> {
  try {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("Sản phẩm")

    const headers = [
      "Tên sản phẩm",
      "Mô tả",
      "Giá bán lẻ",
      "Giá bán buôn",
      "Giá vốn",
      "Số lượng tồn kho",
      "Mức tồn kho tối thiểu",
      "Mã vạch",
      "SKU",
      "URL hình ảnh",
      "Trạng thái (active/inactive)",
      "ID danh mục",
    ]

    worksheet.addRow(headers)

    // Example row
    worksheet.addRow([
      "Áo thun nam",
      "Áo thun cotton 100%",
      150000,
      120000,
      80000,
      100,
      10,
      "SP001",
      "TSHIRT-M-BLK",
      "https://example.com/image.jpg",
      "active",
      1,
    ])

    const buffer = await workbook.xlsx.writeBuffer()
    const fileData = buffer.toString()
    const fileName = "product_template.xlsx"

    return {
      success: true,
      message: "Đã tạo template Excel thành công.",
      fileData,
      fileName,
    }
  } catch (error: any) {
    console.error("Error generating product template:", error)
    return {
      success: false,
      message: `Lỗi khi tạo template Excel: ${error.message || "Không xác định"}`,
      error: error.message || "Unknown error",
    }
  }
}

export async function exportProductsToExcelAction(): Promise<FileDownloadResult> {
  noStore() // Ensure this action is not cached
  try {
    // Assuming getProducts is defined elsewhere and fetches all products
    // For this example, I'll use a placeholder if getProducts is not available in this context
    const products = await (async () => {
      try {
        const { getProducts } = await import("@/lib/services/products")
        return await getProducts()
      } catch (e) {
        console.warn("getProducts not available, using empty array for export.", e)
        return []
      }
    })()

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("Products")

    // Define columns
    worksheet.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Tên sản phẩm", key: "name", width: 30 },
      { header: "Mô tả", key: "description", width: 40 },
      { header: "Giá bán lẻ", key: "retail_price", width: 15 },
      { header: "Giá bán buôn", key: "wholesale_price", width: 15 },
      { header: "Giá vốn", key: "cost_price", width: 15 },
      { header: "Tồn kho", key: "stock_quantity", width: 10 },
      { header: "Mức tồn tối thiểu", key: "min_stock_level", width: 15 },
      { header: "Mã vạch", key: "barcode", width: 20 },
      { header: "SKU", key: "sku", width: 20 },
      { header: "URL ảnh", key: "image_url", width: 40 },
      { header: "Trạng thái", key: "status", width: 15 },
      { header: "ID Danh mục", key: "category_id", width: 15 },
      { header: "Tên danh mục", key: "category", width: 20 },
      { header: "Ngày tạo", key: "created_at", width: 20 },
      { header: "Ngày cập nhật", key: "updated_at", width: 20 },
    ]

    // Add rows
    products.forEach((product) => {
      worksheet.addRow({
        id: product.id,
        name: product.name,
        description: product.description,
        retail_price: product.retail_price,
        wholesale_price: product.wholesale_price,
        cost_price: product.cost_price,
        stock_quantity: product.stock_quantity,
        min_stock_level: product.min_stock_level,
        barcode: product.barcode,
        sku: product.sku,
        image_url: product.image_url,
        status: product.status,
        category_id: product.category_id,
        category: product.category,
        created_at: product.created_at ? new Date(product.created_at).toLocaleString() : "",
        updated_at: product.updated_at ? new Date(product.updated_at).toLocaleString() : "",
      })
    })

    const buffer = await workbook.xlsx.writeBuffer()
    const fileData = buffer.toString()
    const fileName = "product_data.xlsx"

    return {
      success: true,
      message: "Đã xuất dữ liệu sản phẩm thành công.",
      fileData,
      fileName,
    }
  } catch (error: any) {
    console.error("Error exporting products to Excel:", error)
    const errorMessage = error.message || "Failed to export products due to an unknown error."
    return {
      success: false,
      message: errorMessage,
      error: error.message,
    }
  }
}
