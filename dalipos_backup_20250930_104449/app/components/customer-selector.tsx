"use client"

import type React from "react"
import { Input } from "@/components/ui/input"
import { Search, Plus, X } from "lucide-react"
import type { Customer } from "@/lib/types/database"

interface CustomerSelectorProps {
  selectedCustomer: Customer | null
  onSelectCustomer: (customer: Customer | null) => void
  customerSearchTerm: string
  onCustomerSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  filteredCustomers: Customer[]
  showCustomerDropdown: boolean
  setShowCustomerDropdown: (show: boolean) => void
  selectedCustomerIndex: number
  setSelectedCustomerIndex: (index: number) => void
  customerInputRef: React.RefObject<HTMLInputElement | null>
  customerDropdownRef: React.RefObject<HTMLDivElement | null>
  onShowCustomerFormModal: (customer?: Customer) => void // This prop is now used to trigger the modal from parent
  setCustomerFormDefaultName: (name: string) => void
}

export default function CustomerSelector({
  selectedCustomer,
  onSelectCustomer,
  customerSearchTerm,
  onCustomerSearchChange,
  filteredCustomers,
  showCustomerDropdown,
  setShowCustomerDropdown,
  selectedCustomerIndex,
  setSelectedCustomerIndex,
  customerInputRef,
  customerDropdownRef,
  onShowCustomerFormModal,
  setCustomerFormDefaultName,
}: CustomerSelectorProps) {
  const handleAddCustomerClick = () => {
    setCustomerFormDefaultName(customerSearchTerm.trim())
    onShowCustomerFormModal() // Trigger the modal from the parent
    onCustomerSearchChange({ target: { value: "" } } as React.ChangeEvent<HTMLInputElement>) // Clear search term
    setShowCustomerDropdown(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showCustomerDropdown && filteredCustomers.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedCustomerIndex(selectedCustomerIndex < filteredCustomers.length - 1 ? selectedCustomerIndex + 1 : selectedCustomerIndex)
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedCustomerIndex(selectedCustomerIndex > 0 ? selectedCustomerIndex - 1 : 0)
      } else if (e.key === "Enter") {
        e.preventDefault()
        if (selectedCustomerIndex !== -1) {
          onSelectCustomer(filteredCustomers[selectedCustomerIndex])
          setShowCustomerDropdown(false)
        } else if (customerSearchTerm.trim()) {
          // If Enter is pressed and no item is highlighted, but there's a search term,
          // it means no match was found. We can trigger adding a new customer.
          handleAddCustomerClick()
        }
      } else if (e.key === "Escape") {
        setShowCustomerDropdown(false)
      }
    } else if (e.key === "Enter" && customerSearchTerm.trim() && !selectedCustomer) {
      // This is the condition the user is explicitly asking for.
      // If Enter is pressed on an empty customer field with a search term,
      // and no dropdown is shown (meaning no matches), open customer form.
      handleAddCustomerClick()
    }
  }

  const handleCustomerInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onCustomerSearchChange(e)
    setSelectedCustomerIndex(-1) // Reset selection when input changes
  }

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300 h-4 w-4" />
      <Input
        type="text"
        placeholder="Tìm kiếm khách hàng (F4)"
        className="pl-10 w-full"
        value={selectedCustomer ? selectedCustomer.name : customerSearchTerm}
        onChange={handleCustomerInputChange}
        onFocus={() => !selectedCustomer && customerSearchTerm.trim() && setShowCustomerDropdown(true)}
        onBlur={(e) => {
          // Capture currentTarget and relatedTarget before setTimeout
          const currentTarget = e.currentTarget
          const relatedTarget = e.relatedTarget

          // Delay hiding dropdown to allow click events on dropdown items
          setTimeout(() => {
            // Ensure both currentTarget and relatedTarget are valid Nodes before using contains
            if (
              currentTarget instanceof Node &&
              relatedTarget instanceof Node &&
              !currentTarget.contains(relatedTarget)
            ) {
              setShowCustomerDropdown(false)
            } else if (!relatedTarget) {
              // If relatedTarget is null, it means focus left the document or went to non-DOM element
              setShowCustomerDropdown(false)
            }
          }, 100)
        }}
        onKeyDown={handleKeyDown}
        disabled={!!selectedCustomer}
        ref={customerInputRef}
      />
      {selectedCustomer && (
        <button
          type="button"
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
          onClick={() => onSelectCustomer(null)}
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {showCustomerDropdown && (
        <div
          ref={customerDropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto"
        >
          {filteredCustomers.length > 0 ? (
            <>
              <div className="p-2 border-b border-gray-100 bg-gray-50 text-xs text-gray-600">
                Tìm thấy {filteredCustomers.length} khách hàng - Dùng ↑↓ để chọn, Enter để thêm
              </div>
              {filteredCustomers.map((customer, index) => (
                <div
                  key={customer.id}
                  className={`p-3 cursor-pointer border-b border-gray-100 hover:bg-blue-50 transition-colors ${
                    index === selectedCustomerIndex ? "bg-blue-100" : ""
                  }`}
                  onClick={() => {
                    onSelectCustomer(customer)
                    setShowCustomerDropdown(false)
                  }}
                >
                  <div className="font-medium text-sm text-gray-900">{customer.name}</div>
                  <div className="text-xs text-gray-500">{customer.phone || customer.email}</div>
                </div>
              ))}
            </>
          ) : (
            <div className="p-3 text-center text-sm text-gray-500">
              Không tìm thấy khách hàng.
              <button
                type="button"
                className="flex items-center justify-center gap-1 text-blue-600 hover:underline mt-2 mx-auto"
                onClick={handleAddCustomerClick}
              >
                <Plus className="h-4 w-4" /> Thêm khách hàng mới
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
