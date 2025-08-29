"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tag } from "lucide-react"

interface SimplePlaceholderSelectorProps {
  onInsert: (placeholder: string) => void
  trigger?: React.ReactNode
}

const PLACEHOLDER_GROUPS = [
  {
    label: "Thông tin cửa hàng",
    items: [
      { key: "{{businessName}}", label: "Tên cửa hàng" },
      { key: "{{businessAddress}}", label: "Địa chỉ" },
      { key: "{{businessPhone}}", label: "Số điện thoại" },
      { key: "{{businessEmail}}", label: "Email" },
      { key: "{{businessWebsite}}", label: "Website" },
      { key: "{{businessTaxCode}}", label: "Mã số thuế" },
    ],
  },
  {
    label: "Thông tin đơn hàng",
    items: [
      { key: "{{orderCode}}", label: "Mã đơn hàng" },
      { key: "{{invoiceNumber}}", label: "Số hóa đơn" },
      { key: "{{invoiceDate}}", label: "Ngày tạo" },
      { key: "{{invoiceTime}}", label: "Giờ tạo" },
      { key: "{{totalAmount}}", label: "Tổng tiền" },
      { key: "{{totalQuantity}}", label: "Tổng số lượng" },
      { key: "{{totalDiscount}}", label: "Tổng giảm giá" },
    ],
  },
  {
    label: "Thông tin khách hàng",
    items: [
      { key: "{{customerName}}", label: "Tên khách hàng" },
      { key: "{{customerPhone}}", label: "SĐT khách hàng" },
      { key: "{{customerEmail}}", label: "Email khách hàng" },
      { key: "{{customerAddress}}", label: "Địa chỉ khách hàng" },
    ],
  },
  {
    label: "Chi tiết sản phẩm",
    items: [
      { key: "{{#items}}", label: "Bắt đầu danh sách sản phẩm" },
      { key: "{{/items}}", label: "Kết thúc danh sách sản phẩm" },
      { key: "{{itemName}}", label: "Tên sản phẩm" },
      { key: "{{itemQuantity}}", label: "Số lượng" },
      { key: "{{itemPrice}}", label: "Đơn giá" },
      { key: "{{itemTotal}}", label: "Thành tiền" },
    ],
  },
]

export function SimplePlaceholderSelector({ onInsert, trigger }: SimplePlaceholderSelectorProps) {
  const [open, setOpen] = useState(false)

  const handleInsert = (placeholder: string) => {
    onInsert(placeholder)
    setOpen(false)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Tag className="h-4 w-4 mr-1" />
            Chọn Placeholder
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 max-h-80 overflow-y-auto">
        {PLACEHOLDER_GROUPS.map((group, groupIndex) => (
          <div key={group.label}>
            <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">{group.label}</DropdownMenuLabel>
            {group.items.map((item) => (
              <DropdownMenuItem
                key={item.key}
                onClick={() => handleInsert(item.key)}
                className="cursor-pointer text-sm"
              >
                <div className="flex flex-col items-start">
                  <span className="font-mono text-xs text-blue-600">{item.key}</span>
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                </div>
              </DropdownMenuItem>
            ))}
            {groupIndex < PLACEHOLDER_GROUPS.length - 1 && <DropdownMenuSeparator />}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
