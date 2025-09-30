"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import CustomerSelector from "@/app/components/customer-selector"
import type { Customer } from "@/lib/types/database"
import { formatPrice } from "@/lib/utils"
import { useRef, useEffect } from "react"

interface PosSummaryPanelProps {
  customer: Customer | null
  onSelectCustomer: (customer: Customer | null) => void
  onShowCustomerFormModal: () => void
  subtotal: number
  taxRate: number
  discountAmount: number
  total: number
  itemCount: number
  onDiscountChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onTaxRateChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onQuickCheckout: () => void
  onPrintPreReceipt: () => void
  customerSearchTerm: string
  onCustomerSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  filteredCustomers: Customer[]
  showCustomerDropdown: boolean
  setShowCustomerDropdown: (show: boolean) => void
  selectedCustomerIndex: number
  setSelectedCustomerIndex: (index: number) => void
  setCustomerFormDefaultName: (name: string) => void
}

export default function PosSummaryPanel({
  customer,
  onSelectCustomer,
  onShowCustomerFormModal,
  subtotal,
  taxRate,
  discountAmount,
  total,
  itemCount,
  onDiscountChange,
  onTaxRateChange,
  onQuickCheckout,
  onPrintPreReceipt,
  customerSearchTerm,
  onCustomerSearchChange,
  filteredCustomers,
  showCustomerDropdown,
  setShowCustomerDropdown,
  selectedCustomerIndex,
  setSelectedCustomerIndex,
  setCustomerFormDefaultName,
}: PosSummaryPanelProps) {
  const customerInputRef = useRef<HTMLInputElement>(null)
  const customerDropdownRef = useRef<HTMLDivElement>(null)
  const discountInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        customerDropdownRef.current &&
        !customerDropdownRef.current.contains(event.target as Node) &&
        !customerInputRef.current?.contains(event.target as Node)
      ) {
        setShowCustomerDropdown(false)
        setSelectedCustomerIndex(-1)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [setShowCustomerDropdown, setSelectedCustomerIndex])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showCustomerDropdown && filteredCustomers.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault()
          setSelectedCustomerIndex(selectedCustomerIndex < filteredCustomers.length - 1 ? selectedCustomerIndex + 1 : 0)
          return
        }
        if (e.key === "ArrowUp") {
          e.preventDefault()
          setSelectedCustomerIndex(selectedCustomerIndex > 0 ? selectedCustomerIndex - 1 : filteredCustomers.length - 1)
          return
        }
        if (e.key === "Enter" && selectedCustomerIndex >= 0) {
          e.preventDefault()
          const selectedCustomer = filteredCustomers[selectedCustomerIndex]
          onSelectCustomer(selectedCustomer)
          return
        }
        if (e.key === "Escape") {
          e.preventDefault()
          setShowCustomerDropdown(false)
          setSelectedCustomerIndex(-1)
          return
        }
      }

      if (e.key === "Enter" && e.target === customerInputRef.current) {
        e.preventDefault()
        if (showCustomerDropdown && filteredCustomers.length > 0) {
          const customerToSelect =
            selectedCustomerIndex >= 0 ? filteredCustomers[selectedCustomerIndex] : filteredCustomers[0]
          onSelectCustomer(customerToSelect)
        } else if (customerSearchTerm.trim() && filteredCustomers.length === 0) {
          setCustomerFormDefaultName(customerSearchTerm.trim())
          onShowCustomerFormModal()
        }
        return
      }

      if (e.key === "F4") {
        e.preventDefault()
        if (customerInputRef.current) {
          customerInputRef.current.focus()
          customerInputRef.current.select()
          setShowCustomerDropdown(true)
        }
      }

      if (e.key === "F6") {
        e.preventDefault()
        if (discountInputRef.current) {
          discountInputRef.current.focus()
          discountInputRef.current.select()
        }
      }

      if (e.key === "F1") {
        e.preventDefault()
        onQuickCheckout()
      }

      if (e.key === "F2") {
        e.preventDefault()
        onPrintPreReceipt()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [
    showCustomerDropdown,
    filteredCustomers,
    selectedCustomerIndex,
    setSelectedCustomerIndex,
    onSelectCustomer,
    customerSearchTerm,
    setCustomerFormDefaultName,
    onShowCustomerFormModal,
    onQuickCheckout,
    onPrintPreReceipt,
    setShowCustomerDropdown,
  ])

  return (
    <div className="w-[400px] bg-white border-l border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <CustomerSelector
            selectedCustomer={customer}
            onSelectCustomer={onSelectCustomer}
            customerSearchTerm={customerSearchTerm}
            onCustomerSearchChange={onCustomerSearchChange}
            filteredCustomers={filteredCustomers}
            showCustomerDropdown={showCustomerDropdown}
            setShowCustomerDropdown={setShowCustomerDropdown}
            selectedCustomerIndex={selectedCustomerIndex}
            setSelectedCustomerIndex={setSelectedCustomerIndex}
            customerInputRef={customerInputRef}
            customerDropdownRef={customerDropdownRef}
            onShowCustomerFormModal={onShowCustomerFormModal}
            setCustomerFormDefaultName={setCustomerFormDefaultName}
          />
        </div>

        {customer && (
          <div className="mt-2 p-2 bg-blue-50 rounded border">
            <div className="flex items-center justify-between">
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
                  <div className="font-medium text-xl">{customer.name}</div>
                  <div className="text-lg text-gray-500">{customer.phone}</div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-red-600"
                onClick={() => onSelectCustomer(null)}
              >
                ×
              </Button>
            </div>
            <div className="mt-1 text-lg text-gray-500">
              Tổng chi tiêu: {formatPrice(customer.total_spent || 0)} • {customer.total_orders || 0} đơn hàng
            </div>
          </div>
        )}
      </div>

      <div className="p-5 border-b border-gray-200">
        <div className="space-y-2">
          <div className="flex justify-between text-xl">
            <span>Thành tiền:</span>
            <span className="font-medium">{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-xl">
            <span>Tổng tiền: ({itemCount} sản phẩm)</span>
            <span className="font-medium">{formatPrice(subtotal)}</span>{" "}
          </div>
          <div className="flex justify-between text-xl">
            <span>Thuế (%)</span>
            <Input
              id="tax-rate-input"
              type="text"
              className="w-24 h-8 text-right text-xl p-1"
              value={taxRate * 100 || ""}
              onChange={onTaxRateChange}
              min="0"
              max="100"
              step="0.01"
            />
          </div>
          <div className="flex justify-between text-xl">
            <span>Chiết khấu (F6)</span>
            <Input
              id="discount-amount"
              type="text"
              className="w-24 h-8 text-right text-xl p-1"
              value={discountAmount || ""}
              onChange={onDiscountChange}
              ref={discountInputRef}
            />
          </div>
          <div className="border-t pt-20">
            <div className="flex justify-between font-bold text-2xl text-blue-600">
              <span>Tổng Tiền:</span>
              <span>{formatPrice(total)}</span>{" "}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1" />

      <div className="p-4 grid grid-cols-2 gap-2">
        <Button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-xl py-6"
          onClick={onQuickCheckout}
          disabled={itemCount === 0}
        >
          THANH TOÁN (F1)
        </Button>
        <Button
          variant="outline"
          className="w-full text-xl py-6 bg-transparent"
          onClick={onPrintPreReceipt}
          disabled={itemCount === 0}
        >
          IN TẠM TÍNH (F2)
        </Button>
      </div>
    </div>
  )
}
