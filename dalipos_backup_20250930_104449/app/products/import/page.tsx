import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProductImportForm } from "./import-form"

export default function ProductImportPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Nhập dữ liệu sản phẩm</h1>
          <p className="text-sm text-gray-500">Nhập dữ liệu sản phẩm từ file Excel.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tải lên file Excel</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductImportForm />
        </CardContent>
      </Card>
    </div>
  )
}
