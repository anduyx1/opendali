// Re-export all functions from the Supabase-based orders service
export {
  getOrders,
  getOrderById,
  createOrder,
  getRecentSales,
  getTodayStats,
  getSalesDataForLast7Days,
  getMonthlyStats,
  getMonthlyTotalStats,
  getProductsSoldCountMonthly,
  getAverageOrderValue,
  getMonthlyGrossProfit,
  getMonthlySalesByPaymentMethod,
  getGrossProfitPerOrder,
  processReturnAndRefund,
  placeCustomerOrder,
} from "./orders-supabase"