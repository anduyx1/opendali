"use client"

import { useState, useTransition, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { TableBody, TableCell, TableRow } from "@/components/ui/table"
import { formatPrice } from "@/lib/utils"
import type { Product } from "@/lib/types/database"
import { updateProductStockAction } from "@/lib/actions/inventory"
import { toast } from "sonner"

interface EditableStockTableProps {
  products: Product[]
}

export function EditableStockTable({ products: initialProducts }: EditableStockTableProps) {
  const [products, setProducts] = useState(initialProducts)
  const [isPending, startTransition] = useTransition()

  const handleStockChange = useCallback((productId: number, newStock: number) => {
    setProducts((prevProducts) =>
      prevProducts.map((p) => (p.id === productId ? { ...p, stock_quantity: newStock } : p)),
    )
  }, [])

  const handleBlur = useCallback(async (productId: number, newStock: number, oldStock: number) => {
    if (newStock === oldStock) return // No change, do nothing

    startTransition(async () => {
      const result = await updateProductStockAction(productId, newStock, oldStock)
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
        // Revert to old stock if update failed
        setProducts((prevProducts) =>
          prevProducts.map((p) => (p.id === productId ? { ...p, stock_quantity: oldStock } : p)),
        )
      }
    })
  }, [])

  return (
    <TableBody>
      {products.map((product) => (
        <TableRow key={product.id}>
          <TableCell className="font-medium">{product.name}</TableCell>
          <TableCell>{formatPrice(product.retail_price)}</TableCell>
          <TableCell>{formatPrice(product.wholesale_price || 0)}</TableCell>
          <TableCell>
            <Input
              type="number"
              value={product.stock_quantity}
              onChange={(e) => handleStockChange(product.id, Number.parseInt(e.target.value) || 0)}
              onBlur={(e) => handleBlur(product.id, Number.parseInt(e.target.value) || 0, product.stock_quantity)}
              className="w-24 text-center"
              disabled={isPending}
            />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  )
}
