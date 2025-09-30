"use client"

import { uploadImage } from "@/actions/upload-image"

// Đặt kích thước tối đa ban đầu cho phép là 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

// Đặt kích thước mục tiêu sau khi nén
const TARGET_COMPRESSED_SIZE = 500 * 1024 // 500KB

// Đặt kích thước tối đa cho chiều rộng hoặc chiều cao của ảnh sau khi resize
const MAX_DIMENSION = 1024

export interface ImageUploadResult {
  success: boolean
  url?: string
  error?: string
  warning?: string // Thêm trường cảnh báo
  metadata?: {
    size: number
    type: string
    width?: number
    height?: number
    uploaded_at: string
  }
}

// Hàm trợ giúp để nén và resize hình ảnh
async function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")

      // Giảm kích thước ảnh xuống MAX_DIMENSION (1024px) nếu cần
      let width = img.width
      let height = img.height
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height *= MAX_DIMENSION / width
          width = MAX_DIMENSION
        } else {
          width *= MAX_DIMENSION / height
          height = MAX_DIMENSION
        }
      }

      canvas.width = width
      canvas.height = height
      ctx?.drawImage(img, 0, 0, width, height)

      let quality = 0.8 // Bắt đầu với chất lượng 80%
      let compressedFile: File | null = null

      const attemptCompression = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to compress image."))
              return
            }
            // Tạo một File object mới từ blob, đảm bảo tên file có đuôi .webp
            const newFilename = file.name.split(".").slice(0, -1).join(".") + ".webp"
            compressedFile = new File([blob], newFilename, { type: "image/webp", lastModified: Date.now() })

            // Nếu file vẫn lớn hơn kích thước mục tiêu VÀ chất lượng có thể giảm, thử lại
            if (compressedFile.size > TARGET_COMPRESSED_SIZE && quality > 0.1) {
              quality = Math.max(0.1, quality - 0.05) // Giảm chất lượng 5%, đảm bảo không thấp hơn 10%
              attemptCompression() // Gọi lại đệ quy
            } else {
              // Đã nén hết sức có thể, trả về file cuối cùng
              resolve(compressedFile) 
            }
          },
          "image/webp", // Sử dụng định dạng WebP
          quality, // Sử dụng chất lượng hiện tại
        )
      }

      attemptCompression() // Bắt đầu quá trình nén
    }
    img.onerror = (error) => reject(error)
    img.crossOrigin = "anonymous"
    img.src = URL.createObjectURL(file)
  })
}

export async function uploadProductImage(
  file: File,
  productName: string,
  productBarcode: string,
): Promise<ImageUploadResult> {
  // Bước 1: Kiểm tra kích thước ban đầu của file
  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      error: `Kích thước file quá lớn: ${(file.size / 1024 / 1024).toFixed(2)}MB. Vui lòng chọn ảnh có kích thước nhỏ hơn 5MB.`,
    };
  }
  
  // Bước 2: Nén và xử lý hình ảnh
  let processedFile = file
  let warningMessage: string | undefined

  try {
    // Gọi hàm nén và resize
    processedFile = await compressImage(file)
    
    // Sau khi nén, kiểm tra lại kích thước cuối cùng so với mục tiêu
    if (processedFile.size > TARGET_COMPRESSED_SIZE) {
      warningMessage = `Kích thước file sau khi nén (${(processedFile.size / 1024).toFixed(2)}KB) vẫn lớn hơn mục tiêu (${(TARGET_COMPRESSED_SIZE / 1024).toFixed(0)}KB), nhưng là kết quả tốt nhất có thể.`
    }
  } catch (error) {
    console.error("Lỗi nén hình ảnh:", error)
    return {
      success: false,
      error: "Có lỗi xảy ra khi nén hình ảnh.",
    }
  }

  // Bước 3: Tải lên hình ảnh đã xử lý
  try {
    const formData = new FormData()
    formData.append("file", processedFile)

    const baseFilename = productBarcode || `product_${Date.now()}`
    const finalFilename = `${baseFilename}.webp`

    formData.append("finalFilename", finalFilename)
    formData.append("productBarcode", productBarcode)
    formData.append("productName", productName)

    const result = await uploadImage(formData)

    if (!result.success) {
      return {
        success: false,
        error: result.error || "Có lỗi xảy ra khi tải lên hình ảnh",
      }
    }

    const metadata = await getImageMetadata(processedFile)

    return {
      success: true,
      url: result.url,
      warning: warningMessage,
      metadata: {
        size: processedFile.size,
        type: processedFile.type,
        width: metadata.width,
        height: metadata.height,
        uploaded_at: new Date().toISOString(),
      },
    }
  } catch (error) {
    console.error("Lỗi tải lên hình ảnh:", error)
    return {
      success: false,
      error: "Có lỗi xảy ra khi tải lên hình ảnh",
    }
  }
}

// Hàm trợ giúp để lấy kích thước hình ảnh
async function getImageMetadata(file: File): Promise<{ width?: number; height?: number }> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
      })
    }
    img.onerror = () => {
      resolve({})
    }
    img.src = URL.createObjectURL(file)
  })
}
