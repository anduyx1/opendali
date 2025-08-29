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
import type { Order, Customer } from "@/lib/types/database"
import { useEffect, useRef } from "react"
import { formatPrice, calculateTotalQuantity } from "@/lib/utils" // Import calculateTotalQuantity
import { ScrollArea } from "@/components/ui/scroll-area"

interface ReceiptModalProps {
  isOpen: boolean
  onClose: () => void
  order: Order | null
  customer: Customer | null
  orderData: {
    receivedAmount?: number
    changeAmount?: number
    paymentMethod?: string
  }
  templateContent: string // HTML content for the receipt
}

export default function ReceiptModal({
  isOpen,
  onClose,
  order,
  customer,
  orderData,
  templateContent,
}: ReceiptModalProps) {
  const printIframeRef = useRef<HTMLIFrameElement | null>(null)

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Modified to return HTML string for items with more details in a table-like structure
  const formatItemsForTemplate = (items: Order["order_items"]) => {
    if (!items || items.length === 0) {
      return ""
    }

    const htmlResult = `
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
        <div style="display: table-row-group; font-size: 0.85em;">
          ${items
            .map((item) => {
              const productName = item.product_name || (item.is_service ? "Dịch vụ nhanh" : "Sản phẩm")

              const productCode = item.is_service
                ? "Dịch vụ"
                : item.product?.barcode || item.product?.sku || item.product_id || "N/A"
              return `<div style="display: table-row; border-top: 1px dashed #eee;">
                  <div style="display: table-cell; padding: 5px 0; vertical-align: top;">
                    <div style="font-weight: bold;">${productName}</div>
                    ${(item as any).notes || "" ? `<div style="font-size: 0.75em; color: #6b7280;">${(item as any).notes || ""}</div>` : ""}
                    ${item.is_service ? `<div style="font-size: 0.75em; color: #059669; font-style: italic;">Dịch vụ nhanh</div>` : ""}
                  </div>
                  <div style="display: table-cell; padding: 5px 0; vertical-align: top; text-align: center;">
                    ${productCode}
                  </div>
                  <div style="display: table-cell; padding: 5px 0; vertical-align: top; text-align: center;">${item.quantity}</div>
                  <div style="display: table-cell; padding: 5px 0; vertical-align: top; text-align: right;">${formatPrice(item.unit_price)}</div>
                  <div style="display: table-cell; padding: 5px 0; vertical-align: top; text-align: right;">${formatPrice(item.total_price)}</div>
                </div>`
            })
            .join("")}
        </div>
      </div>
    `

    return htmlResult
  }

  const replacePlaceholders = (template: string, data: Record<string, string>) => {
    let result = template
    for (const key in data) {
      result = result.replace(new RegExp(`\\{${key}\\}`, "g"), data[key])
    }
    return result
  }

  const handlePrint = () => {
    if (!order || !templateContent) return // Ensure order and templateContent are available

    const templateData = {
      shop_name: "Tên Cửa Hàng Của Bạn", // Placeholder
      shop_address: "Địa chỉ Cửa Hàng Của Bạn", // Placeholder
      shop_phone: "Số điện thoại Cửa Hàng Của Bạn", // Placeholder
      date: formatDateTime(order.created_at.toString()),
      time: new Date().toLocaleTimeString("vi-VN"), // New placeholder
      orderNumber: order.order_number,
      customerName: customer ? customer.name : "Khách lẻ",
      items: formatItemsForTemplate(order.order_items), // This now returns HTML divs
      subtotal: formatPrice(order.subtotal),
      taxAmount: formatPrice(order.tax_amount),
      discountAmount: formatPrice(order.discount_amount),
      totalAmount: formatPrice(order.total_amount),
      receivedAmount: formatPrice(orderData.receivedAmount || order.total_amount),
      changeAmount: formatPrice(orderData.changeAmount || 0),
      paymentMethod: orderData.paymentMethod || "Tiền mặt",
      total_quantity: calculateTotalQuantity(order.order_items || []).toString(), // Updated to total quantity
    }

    const finalReceiptContent = replacePlaceholders(templateContent, templateData)

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
          <title>Hóa Đơn</title>
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
          ${finalReceiptContent}
        </body>
        </html>
      `)
      iframeDoc.close()

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

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("print-mode-active")

      const afterPrintHandler = () => {
        document.body.classList.remove("print-mode-active")
        onClose()
      }

      window.addEventListener("afterprint", afterPrintHandler)

      return () => {
        window.removeEventListener("afterprint", afterPrintHandler)
        document.body.classList.remove("print-mode-active")
      }
    }
  }, [isOpen, onClose])

  if (!order || !templateContent) return null

  const templateData = {
    shop_name: "Tên Cửa Hàng Của Bạn", // Placeholder
    shop_address: "Địa chỉ Cửa Hàng Của Bạn", // Placeholder
    shop_phone: "Số điện thoại Cửa Hàng Của Bạn", // Placeholder
    date: formatDateTime(order.created_at.toString()),
    time: new Date().toLocaleTimeString("vi-VN"), // New placeholder
    orderNumber: order.order_number,
    customerName: customer ? customer.name : "Khách lẻ",
    items: formatItemsForTemplate(order.order_items), // This now returns HTML divs
    subtotal: formatPrice(order.subtotal),
    taxAmount: formatPrice(order.tax_amount),
    discountAmount: formatPrice(order.discount_amount),
    totalAmount: formatPrice(order.total_amount),
    receivedAmount: formatPrice(orderData.receivedAmount || order.total_amount),
    changeAmount: formatPrice(orderData.changeAmount || 0),
    paymentMethod: orderData.paymentMethod || "Tiền mặt",
    total_quantity: calculateTotalQuantity(order.order_items || []).toString(), // Added fallback empty array for safety
  }

  const finalReceiptContent = replacePlaceholders(templateContent, templateData)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] p-0 receipt-modal-dialog-content">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="text-center">Hóa Đơn Bán Hàng</DialogTitle>
          <DialogDescription className="text-center">Hóa đơn chính thức cho đơn hàng đã thanh toán</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] px-6">
          <div className="p-4 bg-white text-black">
            <div dangerouslySetInnerHTML={{ __html: finalReceiptContent }} />
          </div>
        </ScrollArea>
        <DialogFooter className="p-4 border-t flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={handlePrint}>In Hóa Đơn</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
