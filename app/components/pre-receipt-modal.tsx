"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { CartItem, Customer } from "@/lib/types/database"
import { useRef } from "react"
import { formatPrice, calculateTotalQuantity } from "@/lib/utils" // Import calculateTotalQuantity
import { ScrollArea } from "@/components/ui/scroll-area"

interface PreReceiptModalProps {
  isOpen: boolean
  onClose: () => void
  cartItems: CartItem[]
  customer: Customer | null
  subtotal: number
  taxRate: number
  discountAmount: number
  templateContent: string // New prop for dynamic template content
}

export default function PreReceiptModal({
  isOpen,
  onClose,
  cartItems,
  customer,
  subtotal,
  taxRate,
  discountAmount,
  templateContent,
}: PreReceiptModalProps) {
  const printIframeRef = useRef<HTMLIFrameElement | null>(null)
  const taxAmount = subtotal * taxRate
  const total = subtotal + taxAmount - discountAmount

  // Modified to return HTML string for items with more details in a table-like structure
  const formatItemsForTemplate = (items: CartItem[]) => {
    if (!items || items.length === 0) return ""

    const tableHeader = `
      <div style="display: table; width: 100%; border-collapse: collapse; margin-bottom: 10px; color: #000;">
        <div style="display: table-header-group; font-weight: bold; font-size: 0.9em;">
          <div style="display: table-row;">
            <div style="display: table-cell; padding: 5px 0; width: 30%;">Tên sản phẩm</div>
            <div style="display: table-cell; padding: 5px 0; width: 10%; text-align: center;">Mã</div>
            <div style="display: table-cell; padding: 5px 0; width: 10%; text-align: center;">SL</div>
            <div style="display: table-cell; padding: 5px 0; width: 25%; text-align: right;">Đơn giá</div>
            <div style="display: table-cell; padding: 5px 0; width: 25%; text-align: right;">Thành tiền</div>
          </div>
        </div>
        <div style="display: table-row-group; font-size: 0.85em;">`

    const tableRows = items
      .map((item) => {
        // Escape HTML characters in item data
        const escapedName = item.name.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/&/g, "&amp;")
        const escapedNote = (item as any).notes || ""
          ? ((item as any).notes || "").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/&/g, "&amp;")
          : ""
        const itemCode = item.is_service ? "Dịch vụ" : item.barcode || item.sku || item.id || "N/A"
        const escapedItemCode = itemCode.toString().replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/&/g, "&amp;")

        return `<div style="display: table-row; border-top: 1px dashed #eee;">
                  <div style="display: table-cell; padding: 5px 0; vertical-align: top;">
                    <div style="font-weight: bold;">${escapedName}</div>
                    ${escapedNote ? `<div style="font-size: 0.75em; color: #6b7280;">${escapedNote}</div>` : ""}
                  </div>
                  <div style="display: table-cell; padding: 5px 0; vertical-align: top; text-align: center;">${escapedItemCode}</div>
                  <div style="display: table-cell; padding: 5px 0; vertical-align: top; text-align: center;">${item.quantity}</div>
                  <div style="display: table-cell; padding: 5px 0; vertical-align: top; text-align: right;">${formatPrice(item.price)}</div>
                  <div style="display: table-cell; padding: 5px 0; vertical-align: top; text-align: right;">${formatPrice(item.price * item.quantity)}</div>
                </div>`
      })
      .join("")

    const tableFooter = `
        </div>
      </div>`

    return tableHeader + tableRows + tableFooter
  }

  const replacePlaceholders = (template: string, data: Record<string, string>) => {
    let result = template
    for (const key in data) {
      // Updated regex to match {key}
      result = result.replace(new RegExp(`\\{${key}\\}`, "g"), data[key])
    }
    return result
  }

  const renderTemplateContent = () => {
    if (!cartItems || !Array.isArray(cartItems)) {
      return "<p>Không có sản phẩm trong giỏ hàng</p>"
    }

    let content = templateContent
    if (!content) {
      // Fallback template if no custom template is provided
      content = `
        <div style="text-align: center; margin-bottom: 15px; color: #000;">
          <h3 style="font-size: 1.2em; font-weight: bold; margin-bottom: 5px;">Tạm Tính</h3>
          <p style="font-size: 0.8em;">Ngày: {date}</p>
          <p style="font-size: 0.8em;">Giờ: {time}</p>
          {customer_info}
        </div>
        <div style="margin-bottom: 15px; color: #000;">
          <h4 style="font-size: 1em; font-weight: bold; margin-bottom: 5px;">Chi tiết sản phẩm:</h4>
          {items}
        </div>
        <div style="border-top: 1px dashed #ccc; padding-top: 10px; color: #000;">
          <table style="width: 100%; font-size: 0.9em;">
            <tr><td style="text-align: left;">Tổng cộng:</td><td style="text-align: right;">{subtotal}</td></tr>
            <tr><td style="text-align: left;">Thuế ({tax_rate_percent}%):</td><td style="text-align: right;">{taxAmount}</td></tr>
            <tr><td style="text-align: left;">Chiết khấu:</td><td style="text-align: right;">{discountAmount}</td></tr>
            <tr style="font-weight: bold; font-size: 1.1em;"><td style="text-align: left; padding-top: 5px;">Tổng tiền:</td><td style="text-align: right; padding-top: 5px;">{totalAmount}</td></tr>
          </table>
        </div>
        <p style="text-align: center; font-size: 0.7em; margin-top: 15px; color: #000;">Cảm ơn quý khách!</p>
        <p style="text-align: center; font-size: 0.7em; margin-top: 5px; color: #000;">Tổng số lượng sản phẩm: {total_quantity}</p>
      `
    }

    const customerName = customer?.name
      ? customer.name.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/&/g, "&amp;")
      : ""
    const customerPhone = customer?.phone
      ? customer.phone.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/&/g, "&amp;")
      : ""

    const templateData = {
      shop_name: "Tên Cửa Hàng Của Bạn", // Placeholder
      shop_address: "Địa chỉ Cửa Hàng Của Bạn", // Placeholder
      shop_phone: "Số điện thoại Cửa Hàng Của Bạn", // Placeholder
      date: new Date().toLocaleDateString("vi-VN"),
      time: new Date().toLocaleTimeString("vi-VN"), // New placeholder
      customer_info: customer
        ? `<p style="font-size: 0.8em; color: #000;">Khách hàng: ${customerName} (${customerPhone})</p>`
        : "",
      customerName: customerName || "Khách lẻ", // Thêm placeholder customerName
      customerPhone: customerPhone, // Thêm placeholder customerPhone
      items: formatItemsForTemplate(cartItems), // This now returns HTML divs
      subtotal: formatPrice(subtotal),
      tax_rate_percent: (taxRate * 100).toString(),
      taxAmount: formatPrice(taxAmount), // Changed from tax_amount
      discountAmount: formatPrice(discountAmount), // Changed from discount_amount
      totalAmount: formatPrice(total), // Changed from total_amount
      total_quantity: calculateTotalQuantity(cartItems || []).toString(), // Added fallback empty array for safety
    }

    return replacePlaceholders(content, templateData)
  }

  const handlePrint = () => {
    const printContent = renderTemplateContent()
    if (!printContent) return

    const iframe = document.createElement("iframe")
    iframe.style.position = "absolute"
    iframe.style.top = "-9999px"
    iframe.style.left = "-9999px"
    iframe.style.width = "0"
    iframe.style.height = "0"
    document.body.appendChild(iframe)
    printIframeRef.current = iframe

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
    if (iframeDoc) {
      iframeDoc.open()
      iframeDoc.write(`
        <html>
        <head>
          <title>Tạm Tính</title>
          <style>
            body { font-family: 'Arial', sans-serif; margin: 0; padding: 15px; font-size: 12px; line-height: 1.4; color: #000; }
            h3, h4 { margin: 0; padding: 0; color: #000; }
            p { margin: 0; padding: 0; color: #000; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 10px; color: #000; }
            th, td { padding: 5px 0; text-align: left; vertical-align: top; color: #000; }
            th:last-child, td:last-child { text-align: right; }
            .border-dashed { border-bottom: 1px dashed #ccc; }
            .font-bold { font-weight: bold; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-lg { font-size: 1.125rem; }
            .text-xl { font-size: 1.25rem; }
            .text-2xl { font-size: 1.5rem; }
            .text-sm { font-size: 0.875rem; }
            .text-xs { font-size: 0.75rem; }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
        </html>
      `)
      iframeDoc.close()

      // Add event listener for afterprint to clean up iframe
      iframe.contentWindow?.addEventListener("afterprint", () => {
        if (printIframeRef.current) {
          document.body.removeChild(printIframeRef.current)
          printIframeRef.current = null
        }
      })

      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
      onClose() // Close the modal immediately after print is initiated
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>Xem trước Tạm Tính</DialogTitle>
          <DialogDescription>Xem trước hóa đơn tạm tính trước khi in</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] px-6">
          <div className="p-4 bg-white text-black">
            <div dangerouslySetInnerHTML={{ __html: renderTemplateContent() }} />
          </div>
        </ScrollArea>
        <DialogFooter className="p-6 pt-4 flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={handlePrint}>In Tạm Tính</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
