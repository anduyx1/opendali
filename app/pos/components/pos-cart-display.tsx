"use client"
import { Button } from "@/components/ui/button"
import { Trash2, Plus, Minus, ShoppingCart } from "lucide-react"
import type { CartItem, Product } from "@/lib/types/database"
import { formatPrice } from "@/lib/utils"
import Image from "next/image"

interface PosCartDisplayProps {
  cartItems: CartItem[]
  products: Product[] // To get product image/barcode
  activeOrderName: string
  onUpdateQuantity: (id: number, change: number) => void // Changed prop name
  onRemoveFromCart: (id: number) => void // Changed prop name
  onEditPrice: (item: CartItem) => void // Changed prop name
}

export default function PosCartDisplay({
  cartItems,
  products,
  activeOrderName,
  onUpdateQuantity, // Destructured with new name
  onRemoveFromCart, // Destructured with new name
  onEditPrice, // Destructured with new name
}: PosCartDisplayProps) {
  return (
    <div className="flex-1 flex flex-col bg-white min-h-0">
      {/* Chỉ hiển thị tiêu đề cột khi có sản phẩm trong giỏ hàng */}
      {cartItems.length > 0 && (
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-11 gap-2 px-4 py-3 text-sm font-medium text-gray-700">
            <div className="col-span-1">STT</div>
            <div className="col-span-1">Ảnh SP</div>
            <div className="col-span-1">Mã SKU</div>
            <div className="col-span-4">Tên sản phẩm</div>
            <div className="col-span-1">Số lượng</div>
            <div className="col-span-2 text-right">Đơn giá</div>
            <div className="col-span-1 text-right">Thành tiền</div>
          </div>
        </div>
      )}
      <div className="flex-1 overflow-y-auto flex flex-col">
        {cartItems.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p>Chưa có sản phẩm nào trong {activeOrderName}</p>
              <p className="text-sm mt-2">Nhấn F3 để tìm kiếm sản phẩm theo mã SKU hoặc tên</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {cartItems.map((item, index) => {
              const product = products.find((p) => p.id === item.id)
              // Ensure item.name is a string before using charAt
              const itemName = typeof item.name === "string" ? item.name : ""
              return (
                <div key={item.id} className="grid grid-cols-11 gap-2 px-4 py-3 hover:bg-gray-50">
                  <div className="col-span-1 flex items-center">
                    {index + 1}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-red-600 ml-1"
                      onClick={() => onRemoveFromCart(item.id)} // Use new prop name
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="col-span-1 flex items-center">
                    <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center overflow-hidden relative">
                      {product?.image_url ? (
                        <Image
                          src={product.image_url || "/placeholder.svg"}
                          alt={itemName || "Product image"} // Add alt text fallback
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      ) : (
                        <span className="text-xs font-bold text-gray-600">{itemName ? itemName.charAt(0) : "?"}</span>
                      )}
                    </div>
                  </div>
                  <div className="col-span-1 flex items-center text-sm">
                    {item.is_service ? "" : product?.barcode || item.id}
                  </div>
                  <div className="col-span-4 flex items-center">
                    <div>
                      <div className="font-medium text-sm">{itemName || "Sản phẩm không tên"}</div>
                      {item.is_service ? (
                        <div className="text-xs text-gray-500">Dịch vụ</div>
                      ) : (
                        <div className="text-xs text-gray-500">Mặc định</div>
                      )}
                    </div>
                  </div>
                  <div className="col-span-1 flex items-center">
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 w-6 p-0 bg-transparent"
                        onClick={() => onUpdateQuantity(item.id, -1)} // Use new prop name
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 w-6 p-0 bg-transparent"
                        onClick={() => onUpdateQuantity(item.id, 1)} // Use new prop name
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center text-sm justify-end">
                    <Button
                      variant="ghost"
                      className="h-auto p-0 text-sm font-medium text-right w-full justify-end"
                      onClick={() => onEditPrice(item)} // Use new prop name
                    >
                      {formatPrice(item.price)}
                    </Button>
                  </div>
                  <div className="col-span-1 flex items-center font-medium text-sm justify-end">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
