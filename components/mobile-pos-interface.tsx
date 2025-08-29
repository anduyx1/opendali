"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type React from "react"
import { useEffect, useRef } from "react"
import {
  ShoppingCart,
  Plus,
  X,
  Receipt,
  HandCoins,
  Trash2,
  Search,
  NotebookPen,
  ChevronLeft,
  Minus,
} from "lucide-react"
import { formatPrice } from "@/lib/utils" // Assuming formatPrice is available and correct
import CustomerSelector from "@/app/components/customer-selector"
import { Avatar, AvatarFallback } from "@/components/ui/avatar" // Import Avatar components
import type { CartItem, Customer } from "@/lib/types/database"
import Image from "next/image"

interface MobilePosInterfaceProps {
  cartItems: CartItem[]
  customer: Customer | null
  customerSearchTerm: string
  onCustomerSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onUpdateQuantity: (id: number, change: number) => void
  onRemoveFromCart: (id: number) => void
  onClearCart: () => void
  onSelectCustomer: (customer: Customer | null) => void
  onConfirmOrder: () => void
  onShowPreReceipt: () => void
  onAddQuickService: () => void
  onUpdateItemPrice: (item: CartItem) => void
  onCustomerFormSuccess: (customer?: Customer) => void
  onShowShortcutHelpModal: () => void
  onDiscountChange: (value: number) => void
  discountAmount: number
  taxRate: number
  onTaxRateChange: (value: number) => void
  onScanBarcode: (barcode: string) => void
  onDuplicateOrder: () => void
  onCloseOrder: () => void
  notes: string
  onNotesChange: (notes: string) => void
  onOpenProductSelectionModal: () => void
  onAddCustomerClick: () => void // New prop for adding customer
  // Props for CustomerSelector
  filteredCustomers: Customer[]
  showCustomerDropdown: boolean
  setShowCustomerDropdown: (show: boolean) => void
  selectedCustomerIndex: number
  setSelectedCustomerIndex: (index: number) => void
  customerInputRef: React.RefObject<HTMLInputElement | null>
  customerDropdownRef: React.RefObject<HTMLDivElement | null>
}

export default function MobilePosInterface({
  cartItems,
  customer,
  customerSearchTerm,
  onCustomerSearchChange,
  onUpdateQuantity,
  onRemoveFromCart,
  onClearCart,
  onSelectCustomer,
  onConfirmOrder,
  onShowPreReceipt,
  onAddQuickService,
  onUpdateItemPrice,
  onCustomerFormSuccess,
  onShowShortcutHelpModal,
  onDiscountChange,
  discountAmount,
  taxRate,
  onTaxRateChange,
  onScanBarcode,
  onDuplicateOrder,
  onCloseOrder,
  notes,
  onNotesChange,
  onOpenProductSelectionModal,
  onAddCustomerClick, // Destructure new prop
  // Props for CustomerSelector
  filteredCustomers,
  showCustomerDropdown,
  setShowCustomerDropdown,
  selectedCustomerIndex,
  setSelectedCustomerIndex,
  customerInputRef,
  customerDropdownRef,
}: MobilePosInterfaceProps) {
  const barcodeRef = useRef<HTMLInputElement>(null)

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const taxAmount = subtotal * taxRate
  const total = subtotal + taxAmount - discountAmount
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  useEffect(() => {
    // Focus barcode input on component mount
    barcodeRef.current?.focus()
  }, [])

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Top Bar */}
      <div className="bg-blue-600 text-white p-1 py-1 mt-12 flex items-center justify-between shadow-md">
        <Button variant="ghost" size="icon" className="text-white h-12 w-12 ml-4" onClick={() => window.history.back()}>
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-base font-semibold">Đặt Hàng</h1>
        <Button variant="ghost" size="icon" className="text-white h-12 w-12 mr-4" onClick={onShowShortcutHelpModal}>
          <NotebookPen className="h-6 w-6" />
        </Button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Customer & Product Search Input */}
        <div className="p-3 border-b border-gray-200 bg-white">
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            {/* This input now triggers the modal */}
            <Input
              type="text"
              placeholder="Tìm kiếm hoặc chọn sản phẩm..."
              className="pl-10 pr-4 py-2 rounded-lg border border-gray-300 w-full cursor-pointer"
              readOnly // Make it read-only to prevent direct typing and force modal interaction
              onClick={onOpenProductSelectionModal} // Open modal on click
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
              <Button variant="ghost" size="icon" className="text-gray-500" onClick={onAddQuickService}>
                <Plus className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {" "}
            {/* Added flex container for CustomerSelector and new button */}
            <div className="flex-1">
              {" "}
              {/* Make CustomerSelector take available space */}
              <CustomerSelector
                selectedCustomer={customer}
                onSelectCustomer={onSelectCustomer}
                customerSearchTerm={customerSearchTerm}
                onCustomerSearchChange={onCustomerSearchChange}
                filteredCustomers={filteredCustomers}
                showCustomerDropdown={showCustomerDropdown}
                setShowCustomerDropdown={setShowCustomerDropdown}
                selectedCustomerIndex={selectedCustomerIndex}
                setSelectedCustomerIndex={setSelectedCustomerIndex} // Pass the setter here
                customerInputRef={customerInputRef}
                customerDropdownRef={customerDropdownRef}
                onShowCustomerFormModal={onCustomerFormSuccess} // This needs to be adjusted to open the modal
                setCustomerFormDefaultName={() => {
                  // This prop is not directly used by CustomerSelector, but passed from POSMobilePage
                  // It's a setter for the default name in the customer form modal.
                  // The actual modal opening is handled by POSMobilePage.
                }}
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 bg-transparent"
              onClick={onAddCustomerClick} // Call the new prop
              aria-label="Thêm khách hàng mới"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {customer && (
            <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {customer.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-sm">{customer.name}</div>
                  <div className="text-xs text-gray-600">{customer.phone}</div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-red-600"
                onClick={() => onSelectCustomer(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Main content area: Cart items and summary */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {cartItems.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p>Giỏ hàng trống.</p>
                <p className="text-sm mt-2">Nhấn vào ô tìm kiếm sản phẩm để thêm sản phẩm.</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto divide-y divide-gray-200">
              {cartItems.map((item) => {
                // Ensure item.name is a string before using charAt
                const itemName = typeof item.name === "string" ? item.name : ""
                return (
                  <div key={item.id} className="flex items-center p-2.5 bg-white">
                    <div className="flex-shrink-0 w-14 h-14 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden mr-3 relative">
                      {item.image_url ? ( // Use item.image_url from cart item
                        <Image
                          src={item.image_url || "/placeholder.svg"}
                          alt={itemName || "Product image"} // Add alt text fallback
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      ) : (
                        <span className="text-lg font-bold text-gray-400">{itemName ? itemName.charAt(0) : "?"}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-sm line-clamp-1">{itemName || "Sản phẩm không tên"}</h3>
                      <div className="text-xs text-gray-500">
                        {item.is_service ? "Dịch vụ" : `SKU: ${item.barcode || item.id}`} {/* Use item.barcode */}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 w-6 p-0 bg-transparent"
                            onClick={() => onUpdateQuantity(item.id, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 w-6 p-0 bg-transparent"
                            onClick={() => onUpdateQuantity(item.id, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          className="h-auto p-0 text-sm font-medium text-right"
                          onClick={() => onUpdateItemPrice(item)}
                        >
                          {formatPrice(item.price)}
                        </Button>
                        <span className="font-bold text-blue-600 text-sm">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-red-600 ml-3"
                      onClick={() => onRemoveFromCart(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )
              })}
            </div>
          )}

          {/* Cart Summary and Actions */}
          <div className="p-3 border-t border-gray-200 bg-white mb-5">
            <div className="space-y-2 mb-3">
              <div className="flex justify-between text-sm">
                <span>Tổng ({itemCount} sản phẩm):</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Thuế ({taxRate * 100}%):</span>
                <Input
                  type="number"
                  className="w-20 h-7 text-right text-sm p-1"
                  value={taxRate * 100}
                  onChange={(e) => onTaxRateChange(Number(e.target.value) / 100)}
                  min="0"
                  max="100"
                  step="0.01"
                />
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Chiết khấu:</span>
                <Input
                  type="number"
                  className="w-20 h-7 text-right text-sm p-1"
                  value={discountAmount}
                  onChange={(e) => onDiscountChange(Number(e.target.value))}
                  min="0"
                />
              </div>
              <div className="flex justify-between text-lg font-bold text-blue-600 border-t pt-2 mt-2">
                <span>Tổng cộng:</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white py-3 text-base"
                onClick={onConfirmOrder}
                disabled={cartItems.length === 0}
              >
                <HandCoins className="h-5 w-5 mr-2" /> THANH TOÁN
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="py-2 text-sm bg-transparent"
                  onClick={onShowPreReceipt}
                  disabled={cartItems.length === 0}
                >
                  <Receipt className="h-4 w-4 mr-1" /> IN TẠM TÍNH
                </Button>
                <Button variant="outline" className="py-2 text-sm bg-transparent" onClick={onAddQuickService}>
                  <Plus className="h-4 w-4 mr-1" /> Dịch vụ nhanh
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" className="py-2 text-sm bg-transparent" onClick={onCloseOrder}>
                  <X className="h-4 w-4 mr-1" /> Đóng
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
