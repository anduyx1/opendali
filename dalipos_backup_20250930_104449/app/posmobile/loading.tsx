import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
      <p className="ml-4 text-lg text-gray-600">Đang tải dữ liệu...</p>
    </div>
  )
}
