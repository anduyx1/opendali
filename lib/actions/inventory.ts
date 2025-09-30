// Re-export all functions from the Supabase-based inventory actions
export {
  updateProductStockAction,
  createStockMovement,
  createGoodsReceiptAction,
  createStockAdjustmentAction,
  getStockMovements,
} from "./inventory-supabase"