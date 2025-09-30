"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus } from "lucide-react"
import { getStockMovements } from "@/lib/services/stock-movements"
import type { StockMovement } from "@/lib/types/database"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { StockAdjustmentModal } from "@/components/stock-adjustment-modal"
import { Badge } from "@/components/ui/badge"

export default function StockAdjustmentsPage() {
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const loadStockMovements = async () => {
    setLoading(true)
    try {
      const movements = await getStockMovements()
      setStockMovements(movements)
    } catch (error) {
      console.error("Error loading stock movements:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStockMovements()
  }, [])

  const handleSuccess = () => {
    loadStockMovements() // Reload movements after a successful adjustment
  }

  const getMovementTypeLabel = (type: StockMovement["movement_type"]) => {
    switch (type) {
      case "import":
        return (
          <Badge variant="default" className="bg-green-500 hover:bg-green-500">
            Nhập hàng
          </Badge>
        )
      case "export":
        return <Badge variant="destructive">Xuất hàng</Badge>
      case "adjustment":
        return <Badge variant="secondary">Điều chỉnh</Badge>
      case "sale_return":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            Trả hàng bán
          </Badge>
        )
      case "initial_stock":
        return <Badge variant="outline">Tồn kho ban đầu</Badge>
      default:
        return <Badge variant="secondary">{type}</Badge>
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Lịch sử nhập/xuất kho</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Điều chỉnh tồn kho
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Các giao dịch gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Đang tải lịch sử giao dịch...</div>
          ) : stockMovements.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Chưa có giao dịch tồn kho nào.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead>Mã SKU/Barcode</TableHead>
                    <TableHead>Thay đổi</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Lý do</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockMovements.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell>{format(new Date(movement.created_at), "dd/MM/yyyy HH:mm", { locale: vi })}</TableCell>
                      <TableCell className="font-medium">Product ID: {movement.product_id}</TableCell>
                      <TableCell className="text-muted-foreground">
                        N/A
                      </TableCell>
                      <TableCell>
                        <span
                          className={`font-semibold ${
                            movement.quantity_change > 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {movement.quantity_change > 0 ? `+${movement.quantity_change}` : movement.quantity_change}
                        </span>
                      </TableCell>
                      <TableCell>{getMovementTypeLabel(movement.movement_type)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {movement.reason || "Không có"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <StockAdjustmentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={handleSuccess} />
    </div>
  )
}
