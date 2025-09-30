// Re-export all functions from the Supabase-based products service
export {
  getProducts,
  getProductById,
  updateProductStock,
  getProductByBarcode,
  searchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getTopSellingProducts,
  getMonthlyProductPerformance,
  bulkCreateProducts,
  type MutationResult,
} from "./products-supabase"