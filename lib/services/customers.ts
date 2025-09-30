// Re-export all functions from the Supabase-based customers service
export {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  updateCustomerStats,
  searchCustomers,
  getNewCustomersCountMonthly,
  getNewCustomersCountPreviousMonth,
  getTopCustomersBySpendingInPeriod,
  type NewCustomer,
} from "./customers-supabase"