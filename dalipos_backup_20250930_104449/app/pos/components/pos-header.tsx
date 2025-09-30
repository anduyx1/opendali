"use client"

import type React from "react"
import { useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Home, X, AlertCircle, CheckCircle } from "lucide-react"
import type { Product, PosSession } from "@/lib/types/database"
import type { UnifiedOrder } from "@/lib/services/unified-orders"
import { formatPrice } from "@/lib/utils"

interface PosHeaderProps {
  searchTerm: string
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSearchEnter: (term: string) => void
  filteredProducts: Product[]
  showSearchDropdown: boolean
  setShowSearchDropdown: (show: boolean) => void
  selectedSearchIndex: number
  setSelectedSearchIndex: (index: number) => void
  onSelectProduct: (product: Product) => void
  searchMessage: { type: "success" | "error" | null; text: string }
  orderTabs: UnifiedOrder[]
  activeOrderId: number | null
  onSetActiveOrder: (id: number) => void
  onCreateNewOrder: () => void
  onCloseOrder: (id: number) => void
  onShowShortcutHelp: () => void
}

export default function PosHeader({
  searchTerm,
  onSearchChange,
  onSearchEnter,
  filteredProducts,
  showSearchDropdown,
  setShowSearchDropdown,
  selectedSearchIndex,
  setSelectedSearchIndex,
  onSelectProduct,
  searchMessage,
  orderTabs,
  activeOrderId,
  onSetActiveOrder,
  onCreateNewOrder,
  onCloseOrder,
  onShowShortcutHelp,
}: PosHeaderProps) {
  const router = useRouter()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchDropdownRef = useRef<HTMLDivElement>(null)

  const handleSetShowSearchDropdown = useCallback(
    (show: boolean) => {
      setShowSearchDropdown(show)
    },
    [setShowSearchDropdown],
  )

  const handleSetSelectedSearchIndex = useCallback(
    (index: number) => {
      setSelectedSearchIndex(index)
    },
    [setSelectedSearchIndex],
  )

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchDropdownRef.current &&
        !searchDropdownRef.current.contains(event.target as Node) &&
        !searchInputRef.current?.contains(event.target as Node)
      ) {
        handleSetShowSearchDropdown(false)
        handleSetSelectedSearchIndex(-1)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [handleSetShowSearchDropdown, handleSetSelectedSearchIndex]) // Updated dependency array

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showSearchDropdown && filteredProducts.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault()
          setSelectedSearchIndex(selectedSearchIndex < filteredProducts.length - 1 ? selectedSearchIndex + 1 : 0)
          return
        }
        if (e.key === "ArrowUp") {
          e.preventDefault()
          setSelectedSearchIndex(selectedSearchIndex > 0 ? selectedSearchIndex - 1 : filteredProducts.length - 1)
          return
        }
        if (e.key === "Enter" && selectedSearchIndex >= 0) {
          e.preventDefault()
          const selectedProduct = filteredProducts[selectedSearchIndex]
          onSelectProduct(selectedProduct)
          return
        }
        if (e.key === "Escape") {
          e.preventDefault()
          setShowSearchDropdown(false)
          setSelectedSearchIndex(-1)
          return
        }
      }

      if (e.key === "Enter" && e.target === searchInputRef.current) {
        e.preventDefault()
        if (showSearchDropdown && filteredProducts.length > 0) {
          const productToSelect = selectedSearchIndex >= 0 ? filteredProducts[selectedSearchIndex] : filteredProducts[0]
          onSelectProduct(productToSelect)
        } else {
          onSearchEnter(searchTerm)
        }
        return
      }

      if (e.key === "F3") {
        e.preventDefault()
        if (searchInputRef.current) {
          searchInputRef.current.focus()
          searchInputRef.current.select()
          setShowSearchDropdown(true)
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [
    showSearchDropdown,
    filteredProducts,
    selectedSearchIndex,
    setSelectedSearchIndex,
    onSelectProduct,
    onSearchEnter,
    searchTerm,
    setShowSearchDropdown,
  ])

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <header className="bg-blue-600 text-white px-4 py-2 flex items-center justify-between relative z-50">
      <div className="flex items-center space-x-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300 h-4 w-4 z-10" />
          <Input
            type="text"
            placeholder="Nhập mã SKU hoặc tên sản phẩm (F3)"
            className="pl-10 w-80 bg-white text-black"
            value={searchTerm}
            onChange={onSearchChange}
            onFocus={() => searchTerm.trim() && setShowSearchDropdown(true)}
            ref={searchInputRef}
          />

          {showSearchDropdown && filteredProducts.length > 0 && (
            <div
              ref={searchDropdownRef}
              className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-80 overflow-y-auto"
            >
              <div className="p-2 border-b border-gray-100 bg-gray-50 text-xs text-gray-600">
                Tìm thấy {filteredProducts.length} sản phẩm - Dùng ↑↓ để chọn, Enter để thêm
              </div>
              {filteredProducts.slice(0, 10).map((product, index) => (
                <div
                  key={product.id}
                  className={`p-3 cursor-pointer border-b border-gray-100 hover:bg-blue-50 transition-colors ${
                    index === selectedSearchIndex ? "bg-blue-100" : ""
                  } ${product.stock_quantity === 0 && !product.is_service ? "opacity-50 cursor-not-allowed" : ""}`}
                  onClick={() => onSelectProduct(product)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                        {product.image_url ? (
                          <Image
                            src={product.image_url || "/placeholder.svg"}
                            alt={product.name}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Image
                            src="/placeholder.svg"
                            alt="Placeholder product image"
                            width={40}
                            height={40}
                            className="w-full h-full object-cover text-gray-400"
                          />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-sm text-gray-900">{product.name}</div>
                        <div className="text-xs text-gray-500">
                          SKU: {product.barcode || product.id} | {product.category || "Chưa phân loại"}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-blue-600">{formatPrice(product.wholesale_price || 0)}</div>
                      <div
                        className={`text-xs ${product.stock_quantity > 0 || product.is_service ? "text-green-600" : "text-red-600"}`}
                      >
                        {product.is_service
                          ? "Dịch vụ"
                          : product.stock_quantity > 0
                            ? `Còn ${product.stock_quantity}`
                            : "Hết hàng"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {filteredProducts.length > 10 && (
                <div className="p-2 text-center text-xs text-gray-500 bg-gray-50">
                  Và {filteredProducts.length - 10} sản phẩm khác...
                </div>
              )}
            </div>
          )}

          {searchMessage.type && (
            <div
              className={`absolute top-full left-0 right-0 mt-1 p-2 rounded text-sm flex items-center gap-2 z-40 ${
                searchMessage.type === "success"
                  ? "bg-green-100 text-green-800 border border-green-200"
                  : "bg-red-100 text-red-800 border border-red-200"
              }`}
            >
              {searchMessage.type === "success" ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              {searchMessage.text}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" className="bg-blue-500 border-blue-400 text-white hover:bg-blue-400">
            🛒 (F10)
          </Button>

          <div className="flex items-center space-x-1">
            {orderTabs.map((order) => (
              <div key={order.id} className="relative group">
                <Button
                  variant="outline"
                  size="sm"
                  className={`${
                    activeOrderId === order.id
                      ? "bg-white text-blue-600 border-white"
                      : "bg-blue-500 border-blue-400 text-white hover:bg-blue-400"
                  } pr-12 min-w-[100px]`}
                  onClick={() => onSetActiveOrder(order.id)}
                >
                  <div className="flex items-center gap-1">
                    <span className="mr-1">{order.session_name}</span>
                    {/* Source indicator */}
                    <span className="text-xs">
                      {order.source === "online" ? "🌐" : "📱"}
                    </span>
                    {/* Sync status for offline orders */}
                    {order.source === "offline" && order.syncStatus === "pending" && (
                      <span className="text-xs">⏳</span>
                    )}
                  </div>
                  {order.cart_items && order.cart_items.length > 0 && (
                    <Badge
                      variant={activeOrderId === order.id ? "default" : "secondary"}
                      className="ml-1 px-2 py-0 text-xs font-medium bg-orange-500 text-white border-orange-600"
                    >
                      {order.cart_items.reduce((sum, item) => sum + item.quantity, 0)} SP
                    </Badge>
                  )}
                </Button>

                <div className="absolute right-1 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 text-red-600 hover:bg-red-100"
                      onClick={(e) => {
                        e.stopPropagation()
                        onCloseOrder(order.id)
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 pointer-events-none z-50">
                  <div className="bg-gray-800 text-white text-xs rounded py-2 px-3 whitespace-nowrap">
                    <div className="font-medium">
                      {order.session_name} 
                      <span className="ml-1">
                        {order.source === "online" ? "🌐 Online" : "📱 Offline"}
                      </span>
                      {order.source === "offline" && order.syncStatus === "pending" && (
                        <span className="ml-1 text-yellow-400">⏳ Chờ đồng bộ</span>
                      )}
                    </div>
                    <div>
                      {(order.cart_items || []).reduce((sum, item) => sum + item.quantity, 0)} sản phẩm (
                      {(order.cart_items || []).length} loại)
                    </div>
                    <div>Tạo lúc: {order.created_at ? formatTime(order.created_at.toString()) : "N/A"}</div>
                    {order.cart_items && order.cart_items.length > 0 && (
                      <div className="mt-1 pt-1 border-t border-gray-600">
                        Tổng: {formatPrice(
                          (order.cart_items || []).reduce((sum, item) => sum + item.price * item.quantity, 0),
                        )}{" "}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              size="sm"
              className="bg-green-500 border-green-400 text-white hover:bg-green-400"
              onClick={onCreateNewOrder}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="bg-blue-500 border-blue-400 text-white"
            onClick={() => router.push("/")}
          >
            <Home className="h-4 w-4" />
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="bg-blue-500 border-blue-400 text-white"
          onClick={onShowShortcutHelp}
        >
          ⊕ Phím tắt
        </Button>
      </div>
    </header>
  )
}
