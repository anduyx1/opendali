"use client"

import type { InvoiceSettings } from "@/lib/types/database"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { useEffect, useRef, useState, useCallback } from "react"

interface InvoicePreviewProps {
  invoiceSettings: InvoiceSettings
  templateContent: string
  className?: string
}

export default function InvoicePreview({ invoiceSettings, templateContent, className }: InvoicePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [iframeLoaded, setIframeLoaded] = useState(false)

  const replacePlaceholders = useCallback(
    (content: string) => {
      const today = new Date()
      const formattedDate = format(today, "dd/MM/yyyy")
      const formattedTime = format(today, "HH:mm:ss")

      return content
        .replace(/{{businessName}}/g, invoiceSettings.business_name || "Tên Doanh Nghiệp")
        .replace(/{{businessAddress}}/g, invoiceSettings.business_address || "Địa chỉ Doanh Nghiệp")
        .replace(/{{businessPhone}}/g, invoiceSettings.business_phone || "Số điện thoại")
        .replace(/{{businessTaxId}}/g, invoiceSettings.business_tax_id || "Mã số thuế")
        .replace(/{{invoiceNumber}}/g, "INV-2024-001")
        .replace(/{{invoiceDate}}/g, formattedDate)
        .replace(/{{invoiceTime}}/g, formattedTime)
        .replace(/{{customerName}}/g, "Tên Khách Hàng")
        .replace(/{{customerAddress}}/g, "Địa chỉ Khách Hàng")
        .replace(/{{totalAmount}}/g, "1.234.567 VND")
        .replace(/{{notes}}/g, invoiceSettings.show_notes ? "Ghi chú mẫu: Cảm ơn quý khách đã mua hàng!" : "")
        .replace(/{{logoUrl}}/g, invoiceSettings.logo_url || "/placeholder.svg?height=100&width=100")
    },
    [invoiceSettings],
  )

  useEffect(() => {
    if (iframeRef.current && iframeLoaded) {
      const iframeDoc = iframeRef.current.contentDocument
      if (iframeDoc) {
        const processedContent = replacePlaceholders(templateContent)
        iframeDoc.open()
        iframeDoc.write(processedContent)
        iframeDoc.close()
      }
    }
  }, [templateContent, invoiceSettings, iframeLoaded, replacePlaceholders]) // Added replacePlaceholders to dependency array

  return (
    <div className={cn("relative h-[80vh] w-full overflow-hidden rounded-md border", className)}>
      {!iframeLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <p className="text-gray-500 dark:text-gray-400">Đang tải bản xem trước...</p>
        </div>
      )}
      <iframe
        ref={iframeRef}
        title="Invoice Preview"
        className="h-full w-full border-none"
        onLoad={() => setIframeLoaded(true)}
      />
    </div>
  )
}
