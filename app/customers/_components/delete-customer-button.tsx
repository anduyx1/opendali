"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { deleteCustomer } from "@/lib/actions/customers"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

export function DeleteCustomerButton({ customerId }: { customerId: number }) {
  const [isAlertOpen, setIsAlertOpen] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleDelete = async () => {
    const result = await deleteCustomer(customerId)
    if (result.success) {
      toast({
        title: "Xóa khách hàng thành công!",
        description: "Khách hàng đã được xóa khỏi hệ thống.",
      })
      router.refresh() // Re-fetch data for the server component
    } else {
      toast({
        title: "Lỗi",
        description: result.message || "Không thể xóa khách hàng.",
        variant: "destructive",
      })
    }
    setIsAlertOpen(false)
  }

  return (
    <>
      <Button variant="destructive" size="icon" onClick={() => setIsAlertOpen(true)}>
        <Trash2 className="h-4 w-4" />
        <span className="sr-only">Xóa</span>
      </Button>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Thao tác này sẽ xóa vĩnh viễn khách hàng và tất cả dữ liệu liên quan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
