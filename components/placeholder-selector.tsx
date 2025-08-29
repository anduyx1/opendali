"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Copy, Search, Tag } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface PlaceholderDefinition {
  key: string
  label: string
  description: string
  category: string
  example: string
}

const PLACEHOLDER_DEFINITIONS: PlaceholderDefinition[] = [
  // Thông tin doanh nghiệp
  {
    key: "{{businessName}}",
    label: "Tên doanh nghiệp",
    description: "Tên của cửa hàng/doanh nghiệp",
    category: "Doanh nghiệp",
    example: "Cửa hàng ABC",
  },
  {
    key: "{{businessAddress}}",
    label: "Địa chỉ doanh nghiệp",
    description: "Địa chỉ của cửa hàng",
    category: "Doanh nghiệp",
    example: "123 Đường ABC, Quận 1, TP.HCM",
  },
  {
    key: "{{businessPhone}}",
    label: "Số điện thoại",
    description: "Số điện thoại liên hệ",
    category: "Doanh nghiệp",
    example: "0123 456 789",
  },
  {
    key: "{{businessEmail}}",
    label: "Email doanh nghiệp",
    description: "Email liên hệ",
    category: "Doanh nghiệp",
    example: "contact@abc.com",
  },
  {
    key: "{{businessWebsite}}",
    label: "Website",
    description: "Website của doanh nghiệp",
    category: "Doanh nghiệp",
    example: "https://abc.com",
  },
  {
    key: "{{businessTaxId}}",
    label: "Mã số thuế",
    description: "Mã số thuế doanh nghiệp",
    category: "Doanh nghiệp",
    example: "0123456789",
  },

  // Thông tin hóa đơn
  {
    key: "{{invoiceNumber}}",
    label: "Số hóa đơn",
    description: "Mã số hóa đơn",
    category: "Hóa đơn",
    example: "HD001",
  },
  {
    key: "{{invoiceDate}}",
    label: "Ngày hóa đơn",
    description: "Ngày tạo hóa đơn",
    category: "Hóa đơn",
    example: "15/01/2024",
  },
  {
    key: "{{invoiceTime}}",
    label: "Giờ hóa đơn",
    description: "Giờ tạo hóa đơn",
    category: "Hóa đơn",
    example: "14:30:25",
  },

  // Thông tin khách hàng
  {
    key: "{{customerName}}",
    label: "Tên khách hàng",
    description: "Tên của khách hàng",
    category: "Khách hàng",
    example: "Nguyễn Văn A",
  },
  {
    key: "{{customerPhone}}",
    label: "SĐT khách hàng",
    description: "Số điện thoại khách hàng",
    category: "Khách hàng",
    example: "0987 654 321",
  },
  {
    key: "{{customerEmail}}",
    label: "Email khách hàng",
    description: "Email của khách hàng",
    category: "Khách hàng",
    example: "customer@email.com",
  },
  {
    key: "{{customerAddress}}",
    label: "Địa chỉ khách hàng",
    description: "Địa chỉ của khách hàng",
    category: "Khách hàng",
    example: "456 Đường XYZ",
  },

  // Thông tin sản phẩm
  {
    key: "{{#each items}}",
    label: "Danh sách sản phẩm (bắt đầu)",
    description: "Bắt đầu vòng lặp sản phẩm",
    category: "Sản phẩm",
    example: "{{#each items}}",
  },
  {
    key: "{{/each}}",
    label: "Danh sách sản phẩm (kết thúc)",
    description: "Kết thúc vòng lặp sản phẩm",
    category: "Sản phẩm",
    example: "{{/each}}",
  },
  {
    key: "{{itemName}}",
    label: "Tên sản phẩm",
    description: "Tên của sản phẩm (trong vòng lặp)",
    category: "Sản phẩm",
    example: "Sản phẩm A",
  },
  { key: "{{itemQuantity}}", label: "Số lượng", description: "Số lượng sản phẩm", category: "Sản phẩm", example: "2" },
  {
    key: "{{itemPrice}}",
    label: "Đơn giá",
    description: "Giá của một sản phẩm",
    category: "Sản phẩm",
    example: "50,000 ₫",
  },
  {
    key: "{{itemTotal}}",
    label: "Thành tiền",
    description: "Tổng tiền của sản phẩm",
    category: "Sản phẩm",
    example: "100,000 ₫",
  },

  // Thông tin thanh toán
  {
    key: "{{subtotal}}",
    label: "Tạm tính",
    description: "Tổng tiền trước thuế và giảm giá",
    category: "Thanh toán",
    example: "200,000 ₫",
  },
  {
    key: "{{taxAmount}}",
    label: "Tiền thuế",
    description: "Số tiền thuế",
    category: "Thanh toán",
    example: "20,000 ₫",
  },
  {
    key: "{{discountAmount}}",
    label: "Tiền giảm giá",
    description: "Số tiền được giảm",
    category: "Thanh toán",
    example: "10,000 ₫",
  },
  {
    key: "{{totalAmount}}",
    label: "Tổng cộng",
    description: "Tổng số tiền phải thanh toán",
    category: "Thanh toán",
    example: "210,000 ₫",
  },
  {
    key: "{{receivedAmount}}",
    label: "Tiền nhận",
    description: "Số tiền khách đưa",
    category: "Thanh toán",
    example: "250,000 ₫",
  },
  {
    key: "{{changeAmount}}",
    label: "Tiền thối",
    description: "Số tiền thối lại",
    category: "Thanh toán",
    example: "40,000 ₫",
  },
  {
    key: "{{paymentMethod}}",
    label: "Phương thức thanh toán",
    description: "Cách thức thanh toán",
    category: "Thanh toán",
    example: "Tiền mặt",
  },

  // Thông tin khác
  {
    key: "{{receiptFooter}}",
    label: "Lời cảm ơn",
    description: "Lời cảm ơn cuối hóa đơn",
    category: "Khác",
    example: "Cảm ơn quý khách đã mua hàng!",
  },
  {
    key: "{{totalQuantity}}",
    label: "Tổng số lượng",
    description: "Tổng số lượng sản phẩm",
    category: "Khác",
    example: "5",
  },
]

interface PlaceholderSelectorProps {
  onInsert?: (placeholder: string) => void
  trigger?: React.ReactNode
}

export function PlaceholderSelector({ onInsert, trigger }: PlaceholderSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  const categories = ["all", ...Array.from(new Set(PLACEHOLDER_DEFINITIONS.map((p) => p.category)))]

  const filteredPlaceholders = PLACEHOLDER_DEFINITIONS.filter((placeholder) => {
    const matchesSearch =
      placeholder.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      placeholder.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      placeholder.key.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || placeholder.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleInsert = (placeholder: string) => {
    if (onInsert) {
      onInsert(placeholder)
    }
    setIsOpen(false)
    toast({
      title: "Đã chèn placeholder",
      description: `Đã chèn ${placeholder} vào vị trí con trỏ`,
    })
  }

  const handleCopy = async (placeholder: string) => {
    try {
      await navigator.clipboard.writeText(placeholder)
      toast({
        title: "Đã sao chép",
        description: `Đã sao chép ${placeholder} vào clipboard`,
      })
    } catch {
      toast({
        title: "Lỗi",
        description: "Không thể sao chép placeholder",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Tag className="h-4 w-4 mr-2" />
            Chọn Placeholder
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Chọn Placeholder
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Tìm kiếm</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Tìm kiếm placeholder..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label>Danh mục</Label>
              <div className="flex gap-2 mt-2">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category === "all" ? "Tất cả" : category}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Placeholder List */}
          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {filteredPlaceholders.map((placeholder) => (
              <div key={placeholder.key} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded text-sm font-mono">{placeholder.key}</code>
                      <Badge variant="secondary" className="text-xs">
                        {placeholder.category}
                      </Badge>
                    </div>
                    <div>
                      <h4 className="font-medium">{placeholder.label}</h4>
                      <p className="text-sm text-muted-foreground">{placeholder.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Ví dụ: <span className="font-medium">{placeholder.example}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleCopy(placeholder.key)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button size="sm" onClick={() => handleInsert(placeholder.key)}>
                      Chèn
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredPlaceholders.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Không tìm thấy placeholder nào</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
