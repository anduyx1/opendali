"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Pencil } from "lucide-react"
import { CustomerFormModal } from "../../components/customer-form-modal"
import type { Customer } from "@/lib/types/database"
import { useRouter } from "next/navigation"

export function EditCustomerButton({ customer }: { customer: Customer }) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const handleSaveSuccess = () => {
    setIsOpen(false)
    router.refresh() // Re-fetch data for the server component
  }

  return (
    <>
      <Button variant="outline" size="icon" onClick={() => setIsOpen(true)}>
        <Pencil className="h-4 w-4" />
        <span className="sr-only">Sửa</span>
      </Button>
      <CustomerFormModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        initialData={customer}
        onSuccess={handleSaveSuccess}
      />
    </>
  )
}
