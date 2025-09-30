"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { calculateCartTotals, calculateChange, formatNumber, formatPrice } from "@/lib/utils"
import type { CartItem, Customer, PosAppSettings } from "@/lib/types/database"
import { createOrder } from "@/lib/services/orders-client"
import { updatePosSession } from "@/lib/actions/pos-sessions"
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { getPosAppSettings } from "@/lib/services/settings-client"

export type OrderData = {
  customer_id: number | null
  subtotal: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  payment_method: string
  payment_status: string
  order_status: string
  notes: string | null
  order_items: {
    product_id: number
    product_name: string
    quantity: number
    unit_price: number
    total_price: number
    cost_price: number | null
    is_service: boolean
  }[]
}

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  cartItems: CartItem[]
  customer: Customer | null
  sessionId: number
  onOrderSuccess: () => void
  onClearCart: () => void
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  customer,
  sessionId,
  onOrderSuccess,
  onClearCart,
}) => {
  const { toast } = useToast()
  const [receivedAmount, setReceivedAmount] = useState<number>(0)
  const [paymentMethod, setPaymentMethod] = useState<string>("cash")
  const [isProcessing, setIsProcessing] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [appSettings, setAppSettings] = useState<PosAppSettings | null>(null)

  const fetchSettings = useCallback(async () => {
    const settings = await getPosAppSettings()
    setAppSettings(settings as any)
  }, [])

  useEffect(() => {
    if (isOpen) {
      fetchSettings()
    }
  }, [isOpen, fetchSettings])

  const taxRate = appSettings?.tax_rate || 0

  const { subtotal, taxAmount, totalAmount } = useMemo(
    () => calculateCartTotals(cartItems, taxRate),
    [cartItems, taxRate],
  )

  const changeAmount = useMemo(() => calculateChange(totalAmount, receivedAmount), [totalAmount, receivedAmount])

  useEffect(() => {
    if (isOpen) {
      setReceivedAmount(totalAmount) // Pre-fill received amount with total
      setPaymentMethod("cash")
      setCheckoutError(null)
    }
  }, [isOpen, totalAmount])

  const handleReceivedAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Allow empty string for user to clear input, but convert to 0 for calculations
    const numValue = value === "" ? 0 : Number.parseFloat(value.replace(/\./g, "").replace(",", "."))
    setReceivedAmount(isNaN(numValue) ? 0 : numValue)
  }, [])

  const handlePaymentMethodChange = useCallback((value: string) => {
    setPaymentMethod(value)
  }, [])

  const handleCheckout = useCallback(async () => {
    if (isProcessing) return

    if (cartItems.length === 0) {
      setCheckoutError("Giỏ hàng trống. Vui lòng thêm sản phẩm.")
      return
    }

    if (paymentMethod === "cash" && receivedAmount < totalAmount) {
      setCheckoutError("Số tiền nhận được không đủ.")
      return
    }

    setIsProcessing(true)
    setCheckoutError(null)

    try {
      const orderItems = cartItems.map((item) => ({
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        cost_price: item.cost || null,
        is_service: item.is_service,
      }))

      const orderData: OrderData = {
        customer_id: customer?.id || null,
        subtotal: subtotal,
        tax_amount: taxAmount,
        discount_amount: 0, // Assuming no discount applied in this modal yet
        total_amount: totalAmount,
        payment_method: paymentMethod,
        payment_status: paymentMethod === "cash" && receivedAmount >= totalAmount ? "paid" : "pending", // Mark as paid if cash received is enough
        order_status: "completed", // Default to completed on checkout
        notes: null, // Add notes if available
        order_items: orderItems,
      }

      const result = await createOrder(orderData as any, (orderData as any).items || [])

      if (result && (result as any).success) {
        // Update POS session after successful order
        await updatePosSession(sessionId, {
          cart_items: [], // Clear cart
          customer_id: null, // Clear customer
          discount_amount: 0,
          notes: null,
          received_amount: 0,
        })

        toast({
          title: "Thanh toán thành công!",
          description: `Đơn hàng ${(result as any)?.data?.order_number || "N/A"} đã được tạo.`,
          variant: "default",
        })
        onOrderSuccess()
        onClearCart() // Clear cart in the parent component
        onClose()
      } else {
        setCheckoutError((result as any)?.error || "Có lỗi xảy ra khi tạo đơn hàng.")
        toast({
          title: "Lỗi thanh toán!",
          description: (result as any)?.error || "Không thể tạo đơn hàng.",
          variant: "destructive",
        })
      }
    } catch (error: unknown) {
      console.error("Checkout error:", error)
      const errorMessage = error instanceof Error ? error.message : "Lỗi không xác định khi thanh toán."
      setCheckoutError(errorMessage)
      toast({
        title: "Lỗi không xác định!",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }, [
    isProcessing,
    cartItems,
    paymentMethod,
    receivedAmount,
    totalAmount,
    customer,
    sessionId,
    subtotal,
    taxAmount,
    onOrderSuccess,
    onClearCart,
    onClose,
    toast,
  ])

  const dialogDescriptionId = React.useId()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" aria-describedby={dialogDescriptionId}>
        <DialogHeader>
          <DialogTitle>Thanh toán</DialogTitle>
          <DialogDescription id={dialogDescriptionId} className="sr-only">
            Xác nhận và hoàn tất đơn hàng.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* Order Summary */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Tóm tắt đơn hàng</h3>
            <ScrollArea className="h-[200px] pr-4">
              {cartItems.length === 0 ? (
                <p className="text-muted-foreground">Giỏ hàng trống.</p>
              ) : (
                cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatPrice(item.price)} x {item.quantity}
                      </p>
                    </div>
                    <div className="font-semibold">{formatPrice(item.price * item.quantity)}</div>
                  </div>
                ))
              )}
            </ScrollArea>
            <Separator className="my-4" />
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Tổng phụ:</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Thuế ({taxRate}%):</span>
                <span className="font-medium">{formatPrice(taxAmount)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Tổng cộng:</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>
            </div>
            {customer && (
              <div className="mt-4 p-3 bg-muted rounded-md">
                <p className="text-sm font-medium">Khách hàng:</p>
                <p className="text-base font-semibold">{customer.name}</p>
                {customer.phone && <p className="text-sm text-muted-foreground">{customer.phone}</p>}
              </div>
            )}
          </div>

          {/* Payment Details */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Chi tiết thanh toán</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="receivedAmount">Số tiền nhận được</Label>
                <Input
                  id="receivedAmount"
                  type="text" // Use text to allow custom formatting and prevent browser number input issues
                  value={formatNumber(receivedAmount)} // Format for display
                  onChange={handleReceivedAmountChange}
                  className="text-lg font-bold"
                  inputMode="decimal"
                />
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Tiền thừa:</span>
                <span className={changeAmount < 0 ? "text-red-500" : "text-green-500"}>
                  {formatPrice(changeAmount)}
                </span>
              </div>

              <Separator />

              <div>
                <Label>Phương thức thanh toán</Label>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={handlePaymentMethodChange}
                  className="grid grid-cols-2 gap-4 mt-2"
                >
                  <Label
                    htmlFor="cash"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
                  >
                    <RadioGroupItem id="cash" value="cash" className="sr-only" />
                    Tiền mặt
                  </Label>
                  <Label
                    htmlFor="card"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
                  >
                    <RadioGroupItem id="card" value="card" className="sr-only" />
                    Thẻ
                  </Label>
                  {/* Add more payment methods as needed */}
                </RadioGroup>
              </div>

              {checkoutError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{checkoutError}</AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Hủy
          </Button>
          <Button onClick={handleCheckout} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              "Hoàn tất thanh toán"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CheckoutModal
