"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

interface ShortcutHelpModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ShortcutHelpModal({ isOpen, onClose }: ShortcutHelpModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Chú thích phím tắt</DialogTitle>
          <DialogDescription>
            Dưới đây là danh sách các phím tắt bạn có thể sử dụng để thao tác nhanh hơn.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex justify-between items-center">
            <span className="font-medium">F1</span>
            <span className="text-sm text-gray-600">Thanh toán</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium">F2</span>
            <span className="text-sm text-gray-600">In tạm tính</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium">F3</span>
            <span className="text-sm text-gray-600">Tìm kiếm sản phẩm</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium">F4</span>
            <span className="text-sm text-gray-600">Tìm kiếm khách hàng</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium">F6</span>
            <span className="text-sm text-gray-600">Nhập chiết khấu</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium">F9</span>
            <span className="text-sm text-gray-600">Thêm dịch vụ</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium">F10</span>
            <span className="text-sm text-gray-600">Chuyển đến tab sản phẩm</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium">Alt + X</span>
            <span className="text-sm text-gray-600">Thanh toán nhanh bằng tiền mặt</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium">↑ / ↓</span>
            <span className="text-sm text-gray-600">Chọn mục trong danh sách tìm kiếm</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium">Enter</span>
            <span className="text-sm text-gray-600">Chọn mục / Thêm sản phẩm / Xác nhận</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium">Esc</span>
            <span className="text-sm text-gray-600">Đóng danh sách tìm kiếm</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
