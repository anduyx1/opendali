// Re-export all functions from the Supabase-based categories service
export {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllCategoryIds,
  getMonthlyCategoryGrossProfit,
  type MutationResult,
} from "./categories-supabase"