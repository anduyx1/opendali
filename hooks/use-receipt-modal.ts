import { create } from "zustand"
import type { Order, Customer } from "@/lib/types/database"
import type { OrderData } from "@/app/components/checkout-modal"

interface ReceiptModalState {
  isOpen: boolean
  order: Order | null
  customer: Customer | null
  orderData: OrderData | null
  openReceiptModal: (order: Order, customer: Customer | null, orderData: OrderData) => void
  closeReceiptModal: () => void
}

export const useReceiptModal = create<ReceiptModalState>((set) => ({
  isOpen: false,
  order: null,
  customer: null,
  orderData: null,
  openReceiptModal: (order, customer, orderData) => set({ isOpen: true, order, customer, orderData }),
  closeReceiptModal: () => set({ isOpen: false, order: null, customer: null, orderData: null }),
}))
