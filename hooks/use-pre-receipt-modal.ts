import { create } from "zustand"
import type { CartItem, Customer } from "@/lib/types/database"

interface PreReceiptModalState {
  isOpen: boolean
  cartItems: CartItem[]
  customer: Customer | null
  subtotal: number
  taxRate: number
  discountAmount: number
  openPreReceiptModal: (
    cartItems: CartItem[],
    customer: Customer | null,
    subtotal: number,
    taxRate: number,
    discountAmount: number,
  ) => void
  closePreReceiptModal: () => void
}

export const usePreReceiptModal = create<PreReceiptModalState>((set) => ({
  isOpen: false,
  cartItems: [],
  customer: null,
  subtotal: 0,
  taxRate: 0,
  discountAmount: 0,
  openPreReceiptModal: (cartItems, customer, subtotal, taxRate, discountAmount) =>
    set({ isOpen: true, cartItems, customer, subtotal, taxRate, discountAmount }),
  closePreReceiptModal: () =>
    set({ isOpen: false, cartItems: [], customer: null, subtotal: 0, taxRate: 0, discountAmount: 0 }),
}))
