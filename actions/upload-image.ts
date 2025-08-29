"use server"

import { v2 as cloudinary } from "cloudinary"
import DatauriParser from "datauri/parser"

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Use HTTPS
})

export async function uploadImage(formData: FormData) {
  const file = formData.get("file") as File | null
  const finalFilename = formData.get("finalFilename") as string | null // This will be like "product_barcode.webp"

  if (!file) {
    return { success: false, error: "Không có tệp nào được cung cấp." }
  }
  if (!finalFilename) {
    return { success: false, error: "Tên tệp cuối cùng không được cung cấp." }
  }

  try {
    // Convert File to Data URI
    const parser = new DatauriParser()
    // Ensure the file buffer is correctly accessed for DatauriParser
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const dataUri = parser.format(file.name, fileBuffer)

    if (!dataUri.content) {
      return { success: false, error: "Không thể đọc nội dung tệp." }
    }

    // Extract public_id from finalFilename and specify the folder 'anhsanpham'
    // Example: finalFilename "barcode123.webp" -> publicId "anhsanpham/barcode123"
    const publicId = `anhsanpham/${finalFilename.split(".")[0]}`

    const result = await cloudinary.uploader.upload(dataUri.content, {
      public_id: publicId,
      folder: "anhsanpham", // Tổ chức hình ảnh trong thư mục 'anhsanpham' trên Cloudinary
      resource_type: "image",
      format: "webp", // Đảm bảo nó được lưu trữ dưới dạng webp trên Cloudinary
      quality: "auto:low", // Cloudinary's auto quality for web delivery
      overwrite: true, // Cho phép ghi đè nếu public_id đã tồn tại
    })

    return { success: true, url: result.secure_url }
  } catch (error: any) {
    console.error("Lỗi khi tải lên hình ảnh lên Cloudinary:", error)
    return { success: false, error: `Không thể tải lên hình ảnh: ${error.message}` }
  }
}
