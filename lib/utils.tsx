import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Badge } from "@/components/ui/badge" // Import Badge component
import type { CartItem } from "./types/database"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper to convert Decimal/string to Number and handle null
export const parseNumber = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined) {
    return 0
  }
  if (typeof value === "string") {
    // Remove all non-numeric characters except dots and commas
    let cleanedValue = value.replace(/[^0-9,.]/g, "")

    // Handle Vietnamese number format where dots are thousands separators
    // and commas are decimal separators
    if (cleanedValue.includes(".") && cleanedValue.includes(",")) {
      // Both dot and comma present - assume Vietnamese format: 1.234.567,89
      cleanedValue = cleanedValue.replace(/\./g, "").replace(",", ".")
    } else if (cleanedValue.includes(".") && !cleanedValue.includes(",")) {
      // Only dots present - could be thousands separator or decimal
      const dotCount = (cleanedValue.match(/\./g) || []).length
      if (dotCount === 1) {
        // Single dot - check if it's likely a decimal or thousands separator
        const parts = cleanedValue.split(".")
        if (parts[1] && parts[1].length <= 2) {
          // Likely decimal separator (e.g., "12.50")
          // Keep as is
        } else {
          // Likely thousands separator (e.g., "12.000")
          cleanedValue = cleanedValue.replace(/\./g, "")
        }
      } else {
        // Multiple dots - assume thousands separators (e.g., "1.234.567")
        cleanedValue = cleanedValue.replace(/\./g, "")
      }
    } else if (cleanedValue.includes(",") && !cleanedValue.includes(".")) {
      // Only comma present - assume decimal separator
      cleanedValue = cleanedValue.replace(",", ".")
    }

    const parsed = Number.parseFloat(cleanedValue)
    return isNaN(parsed) ? 0 : parsed
  }
  return value
}

// Add formatNumber function
export function formatNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined) {
    return "0"
  }
  const numValue = typeof value === "string" ? Number.parseFloat(value) : value
  if (isNaN(numValue)) {
    return "0"
  }
  return new Intl.NumberFormat("vi-VN").format(numValue)
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount)
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price)
}

// New function to format price compactly for charts
export function formatCompactPrice(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) {
    console.log("[v0] formatCompactPrice: amount is null/undefined, returning '0 ₫'")
    return "0 ₫"
  }

  const numAmount = typeof amount === "string" ? Number.parseFloat(amount) : amount

  if (isNaN(numAmount)) {
    console.log("[v0] formatCompactPrice: amount is NaN, returning '0 ₫'")
    return "0 ₫"
  }

  if (numAmount === 0) {
    console.log("[v0] formatCompactPrice: amount is exactly 0, returning '0 ₫'")
    return "0 ₫"
  }

  const absAmount = Math.abs(numAmount)
  const sign = numAmount < 0 ? "-" : ""

  if (absAmount < 1_000_000) {
    // For values less than 1 million, use full format
    return formatCurrency(numAmount)
  } else if (absAmount < 1_000_000_000) {
    // Millions
    const millions = absAmount / 1_000_000
    return `${sign}${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(millions)}tr ₫`
  } else {
    // Billions and above
    const billions = absAmount / 1_000_000_000
    return `${sign}${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(billions)}tỷ ₫`
  }
}

// Centralized timezone definition for the application
const TARGET_APP_TIMEZONE = "Asia/Ho_Chi_Minh"
const TARGET_APP_TIMEZONE_OFFSET_HOURS = 7 // UTC+7 for Asia/Ho_Chi_Minh

// Helper to get a Date object representing the start of a given date in the target timezone, as a UTC Date.
// This function takes a Date object (which might be in UTC or local server time)
// and returns a new Date object that represents the start of that day *in the TARGET_APP_TIMEZONE*,
// but its internal value is adjusted to UTC.
export function getStartOfDayInAppTimezone(date: Date): Date {
  // Get the date components (year, month, day) in the TARGET_APP_TIMEZONE
  const formatter = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: TARGET_APP_TIMEZONE,
  })
  const parts = formatter.formatToParts(date)
  const year = Number.parseInt(parts.find((p) => p.type === "year")?.value || "0")
  const month = Number.parseInt(parts.find((p) => p.type === "month")?.value || "0") - 1 // Month is 0-indexed
  const day = Number.parseInt(parts.find((p) => p.type === "day")?.value || "0")

  // Create a UTC Date object for 00:00:00 of that day in the TARGET_APP_TIMEZONE.
  // Since TARGET_APP_TIMEZONE is UTC+7, 00:00:00 in HCMC is 17:00:00 UTC of the previous day.
  // So, we create a UTC date for the target day at 00:00:00 and subtract the offset.
  const utcDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0))
  utcDate.setUTCHours(utcDate.getUTCHours() - TARGET_APP_TIMEZONE_OFFSET_HOURS)
  return utcDate
}

// Helper to get a Date object representing the end of a given date in the target timezone, as a UTC Date.
export function getEndOfDayInAppTimezone(date: Date): Date {
  // Get the date components (year, month, day) in the TARGET_APP_TIMEZONE
  const formatter = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: TARGET_APP_TIMEZONE,
  })
  const parts = formatter.formatToParts(date)
  const year = Number.parseInt(parts.find((p) => p.type === "year")?.value || "0")
  const month = Number.parseInt(parts.find((p) => p.type === "month")?.value || "0") - 1
  const day = Number.parseInt(parts.find((p) => p.type === "day")?.value || "0")

  // Create a UTC Date object for 23:59:59.999 of that day in the TARGET_APP_TIMEZONE.
  // Similar to getStartOfDayInAppTimezone, adjust by subtracting the offset.
  const utcDate = new Date(Date.UTC(year, month, day, 23, 59, 59, 999))
  utcDate.setUTCHours(utcDate.getUTCHours() - TARGET_APP_TIMEZONE_OFFSET_HOURS)
  return utcDate
}

// Modified date range functions to use the new timezone-aware helpers.
// These functions will now return UTC Date objects that represent the start/end
// of the period *in the application's target timezone*.
export function getStartOfMonth(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), 1) // Creates a Date object in server's local time
  return getStartOfDayInAppTimezone(d) // Convert to start of day in app timezone, as UTC
}

export function getEndOfMonth(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999) // Creates a Date object in server's local time
  return getEndOfDayInAppTimezone(d) // Convert to end of day in app timezone, as UTC
}

export function getStartOfDay(date: Date): Date {
  return getStartOfDayInAppTimezone(date)
}

export function getEndOfDay(date: Date): Date {
  return getEndOfDayInAppTimezone(date)
}

export function getStartOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay() // Get day of week based on server's local time (UTC)
  // Adjust to Monday start (1 for Monday, 0 for Sunday)
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const startOfWeekDate = new Date(d.setDate(diff))
  return getStartOfDayInAppTimezone(startOfWeekDate)
}

export function getEndOfWeek(date: Date): Date {
  const d = new Date(getStartOfWeek(date)) // This already returns a UTC date for start of week in app timezone
  d.setUTCDate(d.getUTCDate() + 6) // Add 6 days to the UTC date
  return getEndOfDayInAppTimezone(d) // Get end of that day in app timezone, as UTC
}

export function getStartOfYear(date: Date): Date {
  const d = new Date(date.getFullYear(), 0, 1)
  return getStartOfDayInAppTimezone(d)
}

export function getEndOfYear(date: Date): Date {
  const d = new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999)
  return getEndOfDayInAppTimezone(d)
}

export function getPreviousMonth(date: Date): Date {
  return getStartOfMonth(new Date(date.getFullYear(), date.getMonth() - 1, 1))
}

export function getNextMonth(date: Date): Date {
  return getStartOfMonth(new Date(date.getFullYear(), date.getMonth() + 1, 1))
}

export function getPreviousYear(date: Date): Date {
  return getStartOfYear(new Date(date.getFullYear() - 1, date.getMonth(), 1))
}

export function getNextYear(date: Date): Date {
  return getStartOfYear(new Date(date.getFullYear() + 1, date.getMonth(), 1))
}

export function getPreviousWeek(date: Date): Date {
  const d = new Date(date)
  d.setDate(d.getDate() - 7)
  return getStartOfWeek(d)
}

export function getNextWeek(date: Date): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + 7)
  return getStartOfWeek(d)
}

export function getPreviousDay(date: Date): Date {
  const d = new Date(date)
  d.setDate(d.getDate() - 1)
  return getStartOfDay(d)
}

export function getNextDay(date: Date): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + 1)
  return getStartOfDay(d)
}

export function formatDate(dateString: string | Date) {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: TARGET_APP_TIMEZONE, // Ensure formatting is timezone-aware
  }).format(date)
}

export function formatShortDate(dateString: string | Date): string {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return "Invalid Date"
    }
    // Format the date components in the target timezone
    const formatter = new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      timeZone: TARGET_APP_TIMEZONE, // Use the defined app timezone
    })
    const formatted = formatter.format(date)
    return formatted
  } catch (error) {
    console.error("Error formatting date:", error)
    return "Error"
  }
}

// New function to format date and time concisely (DD/MM/YYYY HH:MM)
export function formatDateTimeConcise(dateString: string | Date): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TARGET_APP_TIMEZONE, // Ensure formatting is timezone-aware
  }).format(date)
}

export function formatTime(dateString: string | Date) {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: TARGET_APP_TIMEZONE, // Ensure formatting is timezone-aware
  }).format(date)
}

export function calculateDiscountedPrice(originalPrice: number, discountPercentage: number): number {
  if (discountPercentage < 0 || discountPercentage > 100) {
    console.warn("Discount percentage must be between 0 and 100.")
    return originalPrice
  }
  return originalPrice * (1 - discountPercentage / 100)
}

export function calculateTotalPrice(items: { price: number; quantity: number }[]): number {
  return items.reduce((total, item) => total + item.price * item.quantity, 0)
}

export function calculateTotalQuantity(items: { quantity: number }[] | undefined | null): number {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return 0
  }

  try {
    return items.reduce((total, item) => {
      if (!item || typeof item.quantity !== "number" || isNaN(item.quantity)) {
        return total
      }
      return total + item.quantity
    }, 0)
  } catch (error) {
    console.error("Error calculating total quantity:", error)
    return 0
  }
}

export function calculateCartTotals(cartItems: CartItem[], taxRate: number) {
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const taxAmount = subtotal * (taxRate / 100)
  const totalAmount = subtotal + taxAmount
  return { subtotal, taxAmount, totalAmount }
}

export function calculateChange(totalAmount: number, receivedAmount: number) {
  return receivedAmount - totalAmount
}

export function formatPhoneNumber(phoneNumber: string | null | undefined): string {
  if (!phoneNumber) return ""
  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, "")

  // Apply formatting based on common Vietnamese phone number patterns
  // This is a basic example and might need more sophisticated logic for all cases
  if (digits.startsWith("84") && digits.length > 9) {
    // International format +84
    return `+${digits.substring(0, 2)} ${digits.substring(2, 5)} ${digits.substring(5, 8)} ${digits.substring(8)}`
  } else if (digits.length === 10) {
    // Common 10-digit format (e.g., 090 123 4567)
    return `${digits.substring(0, 4)} ${digits.substring(4, 7)} ${digits.substring(7)}`
  } else if (digits.length === 11) {
    // Common 11-digit format (e.g., 0123 456 7890 - old mobile numbers)
    return `${digits.substring(0, 4)} ${digits.substring(4, 7)} ${digits.substring(7)}`
  }
  // Return as is if no specific format matches
  return phoneNumber
}

interface BusinessSettings {
  businessName?: string
  businessAddress?: string
  businessPhone?: string
  businessEmail?: string
  businessWebsite?: string
  businessTaxId?: string
  receiptFooter?: string
}

interface OrderItem {
  name?: string
  quantity?: number
  price?: number
}

interface OrderData {
  invoiceDate?: string
  invoiceTime?: string
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  customerAddress?: string
  invoiceNumber?: string
  totalQuantity?: string
  itemsHtml?: string
  items?: OrderItem[]
  subtotal?: string
  taxAmount?: string
  discountAmount?: string
  totalAmount?: string
  receivedAmount?: string
  changeAmount?: string
  paymentMethod?: string
}

export function processPrintTemplateContent(
  templateContent: string,
  businessSettings?: BusinessSettings,
  orderData?: OrderData,
): string {
  let content = templateContent

  // Use business settings if provided, otherwise use sample data
  const businessName = businessSettings?.businessName || "Cửa hàng ABC"
  const businessAddress = businessSettings?.businessAddress || "123 Đường ABC, Quận 1, TP.HCM"
  const businessPhone = businessSettings?.businessPhone || "0123 456 789"
  const businessEmail = businessSettings?.businessEmail || "contact@abc.com"
  const businessWebsite = businessSettings?.businessWebsite || "https://abc.com"
  const businessTaxId = businessSettings?.businessTaxId || "0123456789"
  const receiptFooter = businessSettings?.receiptFooter || "Cảm ơn quý khách đã mua hàng!"

  // Use order data if provided, otherwise use sample data
  const sampleDate = orderData?.invoiceDate || new Date().toLocaleDateString("vi-VN")
  const sampleTime = orderData?.invoiceTime || new Date().toLocaleTimeString("vi-VN")
  const customerName = orderData?.customerName || "Khách hàng thử nghiệm"
  const customerPhone = orderData?.customerPhone || "0987 654 321"
  const customerEmail = orderData?.customerEmail || "customer@email.com"
  const customerAddress = orderData?.customerAddress || "456 Đường XYZ"
  const invoiceNumber = orderData?.invoiceNumber || "TEST-001"
  const totalQuantity = orderData?.totalQuantity || "3"

  // Replace business placeholders
  content = content
    .replace(/\{\{businessName\}\}/g, businessName)
    .replace(/\{\{businessAddress\}\}/g, businessAddress)
    .replace(/\{\{businessPhone\}\}/g, businessPhone)
    .replace(/\{\{businessEmail\}\}/g, businessEmail)
    .replace(/\{\{businessWebsite\}\}/g, businessWebsite)
    .replace(/\{\{businessTaxId\}\}/g, businessTaxId)
    .replace(/\{\{receiptFooter\}\}/g, receiptFooter)

  // Replace invoice placeholders
  content = content
    .replace(/\{\{invoiceNumber\}\}/g, invoiceNumber)
    .replace(/\{\{invoiceDate\}\}/g, sampleDate)
    .replace(/\{\{invoiceTime\}\}/g, sampleTime)

  // Replace customer placeholders
  content = content
    .replace(/\{\{customerName\}\}/g, customerName)
    .replace(/\{\{customerPhone\}\}/g, customerPhone)
    .replace(/\{\{customerEmail\}\}/g, customerEmail)
    .replace(/\{\{customerAddress\}\}/g, customerAddress)

  // Replace other placeholders
  content = content.replace(/\{\{totalQuantity\}\}/g, totalQuantity)

  // Handle legacy placeholders for backward compatibility
  content = content
    .replace(/\{date\}/g, sampleDate)
    .replace(/\{time\}/g, sampleTime)
    .replace(/\{customerName\}/g, customerName)
    .replace(/\{orderNumber\}/g, invoiceNumber)
    .replace(/\{total_quantity\}/g, totalQuantity)

  // Handle items and financial data
  const sampleItemsHtml =
    orderData?.itemsHtml ||
    `
    <div style="display: table; width: 100%; border-collapse: collapse; margin-bottom: 10px; color: #000;">
      <div style="display: table-header-group; font-weight: bold; font-size: 0.9em;">
        <div style="display: table-row;">
          <div style="display: table-cell; padding: 5px 0; width: 40%;">Tên sản phẩm</div>
          <div style="display: table-cell; padding: 5px 0; width: 20%; text-align: center;">Mã</div>
          <div style="display: table-cell; padding: 5px 0; width: 10%; text-align: center;">SL</div>
          <div style="display: table-cell; padding: 5px 0; width: 15%; text-align: right;">Đơn giá</div>
          <div style="display: table-cell; padding: 5px 0; width: 15%; text-align: right;">Thành tiền</div>
        </div>
      </div>
      <div style="display: table-row-group; font-size: 0.85em;">
        <div style="display: table-row; border-top: 1px dashed #eee;">
          <div style="display: table-cell; padding: 5px 0; vertical-align: top;">
            <div style="font-weight: bold;">Sản phẩm A</div>
          </div>
          <div style="display: table-cell; padding: 5px 0; vertical-align: top; text-align: center;">SKU001</div>
          <div style="display: table-cell; padding: 5px 0; vertical-align: top; text-align: center;">1</div>
          <div style="display: table-cell; padding: 5px 0; vertical-align: top; text-align: right;">${formatCurrency(100000)}</div>
          <div style="display: table-cell; padding: 5px 0; vertical-align: top; text-align: right;">${formatCurrency(100000)}</div>
        </div>
        <div style="display: table-row; border-top: 1px dashed #eee;">
          <div style="display: table-cell; padding: 5px 0; vertical-align: top;">
            <div style="font-weight: bold;">Sản phẩm B</div>
          </div>
          <div style="display: table-cell; padding: 5px 0; vertical-align: top; text-align: center;">SKU002</div>
          <div style="display: table-cell; padding: 5px 0; vertical-align: top; text-align: center;">2</div>
          <div style="display: table-cell; padding: 5px 0; vertical-align: top; text-align: right;">${formatCurrency(50000)}</div>
          <div style="display: table-cell; padding: 5px 0; vertical-align: top; text-align: right;">${formatCurrency(100000)}</div>
        </div>
      </div>
    </div>`

  const subtotal = orderData?.subtotal || formatCurrency(200000)
  const taxAmount = orderData?.taxAmount || formatCurrency(20000)
  const discountAmount = orderData?.discountAmount || formatCurrency(10000)
  const totalAmount = orderData?.totalAmount || formatCurrency(210000)
  const receivedAmount = orderData?.receivedAmount || formatCurrency(250000)
  const changeAmount = orderData?.changeAmount || formatCurrency(40000)
  const paymentMethod = orderData?.paymentMethod || "Tiền mặt"

  // Handle items loop
  const itemsRegex = /\{\{#each items\}\}(.*?)\{\{\/each\}\}/g
  content = content.replace(itemsRegex, (match, template) => {
    if (orderData?.items && Array.isArray(orderData.items)) {
      return orderData.items
        .map((item: OrderItem) => {
          let itemContent = template
          itemContent = itemContent
            .replace(/\{\{itemName\}\}/g, item.name || "")
            .replace(/\{\{itemQuantity\}\}/g, item.quantity?.toString() || "0")
            .replace(/\{\{itemPrice\}\}/g, formatCurrency(item.price || 0))
            .replace(/\{\{itemTotal\}\}/g, formatCurrency((item.price || 0) * (item.quantity || 0)))
          return itemContent
        })
        .join("")
    }
    return sampleItemsHtml
  })

  // Replace financial placeholders
  content = content
    .replace(/\{\{subtotal\}\}/g, subtotal)
    .replace(/\{\{taxAmount\}\}/g, taxAmount)
    .replace(/\{\{discountAmount\}\}/g, discountAmount)
    .replace(/\{\{totalAmount\}\}/g, totalAmount)
    .replace(/\{\{receivedAmount\}\}/g, receivedAmount)
    .replace(/\{\{changeAmount\}\}/g, changeAmount)
    .replace(/\{\{paymentMethod\}\}/g, paymentMethod)

  // Legacy placeholders
  content = content
    .replace(/\{items\}/g, sampleItemsHtml)
    .replace(/\{subtotal\}/g, subtotal)
    .replace(/\{taxAmount\}/g, taxAmount)
    .replace(/\{discountAmount\}/g, discountAmount)
    .replace(/\{totalAmount\}/g, totalAmount)
    .replace(/\{receivedAmount\}/g, receivedAmount)
    .replace(/\{changeAmount\}/g, changeAmount)
    .replace(/\{paymentMethod\}/g, paymentMethod)

  return content
}

export function getOrderStatusBadge(status: string) {
  let variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" = "secondary"
  let text = status

  switch (status) {
    case "completed":
      variant = "default" // Using default for success-like appearance
      text = "Hoàn thành"
      break
    case "pending":
      variant = "warning"
      text = "Đang chờ"
      break
    case "cancelled":
      variant = "destructive"
      text = "Đã hủy"
      break
    case "returned": // Added handling for 'returned'
      variant = "outline"
      text = "Đã hoàn trả"
      break
    case "partially_returned": // Added handling for 'partially_returned'
      variant = "outline"
      text = "Hoàn trả một phần"
      break
    case "refunded":
      variant = "outline"
      text = "Đã hoàn tiền"
      break
    case "partially_refunded":
      variant = "outline"
      text = "Hoàn tiền một phần"
      break
    default:
      variant = "secondary"
      text = status
  }

  return <Badge variant={variant}>{text}</Badge>
}

export function generateInvoiceNumber(): string {
  const now = new Date()
  const year = now.getFullYear().toString().slice(-2)
  const month = (now.getMonth() + 1).toString().padStart(2, "0")
  const day = now.getDate().toString().padStart(2, "0")
  const hours = now.getHours().toString().padStart(2, "0")
  const minutes = now.getMinutes().toString().padStart(2, "0")
  const seconds = now.getSeconds().toString().padStart(2, "0")
  const random = Math.floor(Math.random() * 9000) + 1000 // 4-digit random number

  return `INV-${year}${month}${day}-${hours}${minutes}${seconds}-${random}`
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

export function getFormattedQuarter(date: Date): number {
  const month = date.getMonth() + 1
  return Math.ceil(month / 3)
}

export function getFormattedDate(date: Date, includeYear = true): string {
  const options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: includeYear ? "numeric" : undefined,
    timeZone: TARGET_APP_TIMEZONE, // Ensure formatting is timezone-aware
  }
  return new Intl.DateTimeFormat("vi-VN", options).format(date)
}

export function getFormattedDateTime(date: Date): string {
  return `${getFormattedDate(date)} ${formatTime(date)}`
}

export function getFormattedDateRange(startDate: Date, endDate: Date): string {
  return `${getFormattedDate(startDate)} - ${getFormattedDate(endDate)}`
}

export function getFormattedMonthYear(date: Date): string {
  return new Intl.DateTimeFormat("vi-VN", { month: "long", year: "numeric", timeZone: TARGET_APP_TIMEZONE }).format(
    date,
  )
}

export function getFormattedYear(date: Date): string {
  return new Intl.DateTimeFormat("vi-VN", { year: "numeric", timeZone: TARGET_APP_TIMEZONE }).format(date)
}

export function getFormattedWeekRange(startDate: Date, endDate: Date): string {
  return `${getFormattedDate(startDate)} - ${getFormattedDate(endDate)}`
}

export function getAmPm(): string[] {
  return ["AM", "PM"]
}

export function getMeridiem(hour: number): string {
  return hour >= 12 ? "PM" : "AM"
}

export function getHour12(hour: number): number {
  return hour % 12 === 0 ? 12 : hour % 12
}

export function getHour24(hour: number, meridiem: string): number {
  if (meridiem === "PM" && hour < 12) {
    return hour + 12
  }
  if (meridiem === "AM" && hour === 12) {
    return 0
  }
  return hour
}

export function getMonthNames(): string[] {
  return Array.from({ length: 12 }, (_, i) =>
    new Intl.DateTimeFormat("vi-VN", { month: "long", timeZone: TARGET_APP_TIMEZONE }).format(new Date(0, i)),
  )
}

export function getDayNames(): string[] {
  return Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat("vi-VN", { weekday: "long", timeZone: TARGET_APP_TIMEZONE }).format(new Date(0, 0, i)),
  )
}

export function getDayShortNames(): string[] {
  return Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat("vi-VN", { weekday: "short", timeZone: TARGET_APP_TIMEZONE }).format(new Date(0, 0, i)),
  )
}

export function getDayMinNames(): string[] {
  return Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat("vi-VN", { weekday: "narrow", timeZone: TARGET_APP_TIMEZONE }).format(new Date(0, 0, i)),
  )
}

export function getYears(startYear: number, endYear: number): number[] {
  const years = []
  for (let i = startYear; i <= endYear; i++) {
    years.push(i)
  }
  return years
}

export function getMonths(year: number): Date[] {
  const months = []
  for (let i = 0; i < 12; i++) {
    months.push(getStartOfMonth(new Date(year, i, 1))) // Use timezone-aware start of month
  }
  return months
}

export function getWeeks(year: number): Date[] {
  const weeks = []
  const firstDayOfYear = getStartOfYear(new Date(year, 0, 1)) // Use timezone-aware start of year
  const currentDay = new Date(firstDayOfYear)
  while (currentDay.getFullYear() === year) {
    weeks.push(new Date(currentDay))
    currentDay.setUTCDate(currentDay.getUTCDate() + 7) // Advance by UTC days
  }
  return weeks
}

export function getDays(year: number, month: number): Date[] {
  const days = []
  const numDays = getDaysInMonth(year, month)
  for (let i = 1; i <= numDays; i++) {
    days.push(getStartOfDay(new Date(year, month, i))) // Use timezone-aware start of day
  }
  return days
}

export function getHours(): number[] {
  return Array.from({ length: 24 }, (_, i) => i)
}

export function getMinutes(): number[] {
  return Array.from({ length: 60 }, (_, i) => i)
}

export function getSeconds(): number[] {
  return Array.from({ length: 60 }, (_, i) => i)
}

// Add formatDateWithTimezone function
export function formatDateWithTimezone(date: Date | string, options?: {
  showTime?: boolean
  timeZone?: string
}): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const timeZone = options?.timeZone || "Asia/Ho_Chi_Minh"
  
  if (options?.showTime === false) {
    return dateObj.toLocaleDateString("vi-VN", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    })
  }
  
  return dateObj.toLocaleString("vi-VN", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  })
}
