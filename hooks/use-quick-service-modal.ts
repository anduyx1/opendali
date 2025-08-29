import { create } from "zustand"

interface QuickServiceModalState {
  isOpen: boolean
  onAddServiceCallback: ((name: string, price: number) => void) | null
  openQuickServiceModal: (callback: (name: string, price: number) => void) => void
  closeQuickServiceModal: () => void
}

export const useQuickServiceModal = create<QuickServiceModalState>((set) => ({
  isOpen: false,
  onAddServiceCallback: null,
  openQuickServiceModal: (callback) => set({ isOpen: true, onAddServiceCallback: callback }),
  closeQuickServiceModal: () => set({ isOpen: false, onAddServiceCallback: null }),
}))
