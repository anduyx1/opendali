"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Package, ChevronUp, ChevronDown } from "lucide-react"
import type { Product } from "@/lib/types/database"

interface BottomProductTabProps {
  products: Product[]
  searchTerm: string
  onSearchChange: (term: string) => void
  onAddToCart: (product: Product) => void
  expanded: boolean
  onToggleExpand: () => void
}

export default function BottomProductTab({
  products,
  searchTerm,
  onSearchChange,
  onAddToCart,
  expanded,
  onToggleExpand,
}: BottomProductTabProps) {
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price)
  }

  return (
    <div
      className={`bg-white border-t border-gray-200 shadow-lg transition-all duration-300 ${expanded ? "h-[50vh]" : "h-[20vh]"}`}
    >
      {/* Tab Header with toggle */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold flex items-center">
          <Package className="h-5 w-5 mr-2 text-blue-600" />
          Sản phẩm ({filteredProducts.length})
        </h2>
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Tìm sản phẩm..."
              className="pl-8 h-8 text-sm"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <Button variant="ghost" size="sm" onClick={onToggleExpand} className="h-8 w-8 p-0">
            {expanded ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Products Horizontal Scroll */}
      <div className="overflow-y-auto h-[calc(100%-40px)]">
        <div className="p-3">
          <div className="flex gap-3 overflow-x-auto pb-2">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className={`flex-shrink-0 w-[180px] cursor-pointer transition-all hover:shadow-md ${
                  product.stock_quantity === 0 ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={() => product.stock_quantity > 0 && onAddToCart(product)}
              >
                <CardContent className="p-3">
                  <div className="aspect-square w-full bg-gray-100 rounded-md mb-2 flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-400">{product.name.charAt(0)}</span>
                  </div>
                  <h3 className="font-medium text-sm line-clamp-1">{product.name}</h3>
                  <div className="flex items-center justify-between mt-1">
                    <Badge variant="outline" className="text-xs px-1">
                      {product.stock_quantity} còn
                    </Badge>
                    <span className="font-bold text-blue-600 text-sm">{formatPrice(product.price || 0)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredProducts.length === 0 && (
              <div className="flex items-center justify-center w-full py-6 text-gray-500">
                Không tìm thấy sản phẩm nào
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
