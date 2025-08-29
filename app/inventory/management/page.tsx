import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getProducts } from "@/lib/services/products"
import { EditableStockTable } from "@/components/editable-stock-table"

export default async function InventoryManagementPage() {
  const products = await getProducts()

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <h1 className="text-2xl font-bold">Quản lý tồn kho</h1>
      <Card>
        <CardHeader>
          <CardTitle>Danh sách sản phẩm tồn kho</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên sản phẩm</TableHead>
                <TableHead>Giá bán lẻ</TableHead>
                <TableHead>Giá bán buôn</TableHead>
                <TableHead>Số lượng tồn kho</TableHead>
              </TableRow>
            </TableHeader>
            <EditableStockTable products={products} />
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
