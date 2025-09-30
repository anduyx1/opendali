import { Loader2 } from "lucide-react"

export default function OrdersLoading() {
  return (
    <div className="flex flex-1 items-center justify-center min-h-[80vh]">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      <p className="ml-2 text-gray-600">Đang tải danh sách đơn hàng...</p>
    </div>
  )
}
