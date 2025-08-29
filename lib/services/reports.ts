import { parseNumber } from "@/lib/utils"
import {
  getMonthlyStats,
  getMonthlyTotalStats,
  getTodayStats,
  getRecentSales,
  getOrders,
  getOrderById,
  processReturnAndRefund,
  createOrder,
  getSalesDataForLast7Days,
  getMonthlyGrossProfit,
  getMonthlySalesByPaymentMethod,
  getAverageOrderValue,
  getGrossProfitPerOrder as getGrossProfitPerOrderFromOrders, // Import new function
} from "./orders" // Import actual data fetching functions
import { getMonthlyProductPerformance, getTopSellingProducts as getTopSellingProductsFromProducts } from "./products"
import { getTopCustomersBySpendingInPeriod } from "./customers"
import { getMonthlyCategoryGrossProfit } from "./categories" // Corrected import

// Function to get sales summary
export async function getSalesSummary(startDate?: Date, endDate?: Date) {
  const [monthlyStats, averageOrderValue, totalRefunds] = await Promise.all([
    getMonthlyTotalStats(startDate, endDate), // This will fetch from DB or throw error
    getAverageOrderValue(startDate, endDate), // This will fetch from DB or throw error
    // For totalRefunds, we need to sum refund_amount from orders within the period
    (async () => {
      const orders = await getOrders(startDate, endDate)
      return orders.reduce((sum, order) => sum + parseNumber(order.refund_amount), 0)
    })(),
  ])

  return {
    totalSales: monthlyStats.revenue,
    totalOrders: monthlyStats.orders,
    averageOrderValue: averageOrderValue,
    totalRefunds: totalRefunds,
    // netSales and grossProfit would require more specific queries if not already available
    // For now, we can derive them or add specific functions in orders.ts
    netSales: monthlyStats.revenue - totalRefunds,
    grossProfit: await getMonthlyGrossProfit(startDate, endDate),
  }
}

// Function to get top selling products
export async function getTopSellingProducts(limit = 5) {
  // This calls the actual function from products.ts
  const products = await getTopSellingProductsFromProducts(limit)
  // Map to the expected report format
  return products.map((p) => ({
    product_name: p.name,
    total_quantity_sold: p.quantitySold,
    total_sales_amount: p.revenue,
  }))
}

// Function to get sales by payment method
export async function getSalesByPaymentMethod(startDate?: Date, endDate?: Date) {
  // This calls the actual function from orders.ts
  const sales = await getMonthlySalesByPaymentMethod(startDate, endDate)
  // Map to the expected report format
  return sales.map((s) => ({
    payment_method: s.payment_method,
    total_amount: s.total_revenue,
  }))
}

// Function to get sales by customer
export async function getSalesByCustomer(limit = 5, startDate?: Date, endDate?: Date) {
  // This calls the actual function from customers.ts
  const customers = await getTopCustomersBySpendingInPeriod(startDate, endDate, limit)
  // Map to the expected report format
  return customers.map((c) => ({
    customer_name: c.name,
    total_orders: 0, // This data is not directly available from getTopCustomersBySpendingInPeriod, might need another query
    total_spent: c.total_spent_period,
  }))
}

// Function to get sales trend data for a chart
export async function getSalesTrend(): Promise<{ date: string; total_sales: number }[]> {
  // This calls the actual function from orders.ts
  const salesData = await getSalesDataForLast7Days() // This function already handles date range for last 7 days
  // If you need more flexible date ranges (e.g., for month/year), you'd need a more generic function in orders.ts
  return salesData.map((item) => ({
    date: item.sale_date,
    total_sales: item.total_sales,
  }))
}

// New function to get gross profit by product
export async function getGrossProfitByProduct(startDate?: Date, endDate?: Date) {
  const productsPerformance = await getMonthlyProductPerformance(startDate, endDate)
  return productsPerformance.map((p) => ({
    product_name: p.name,
    sku: p.sku,
    total_quantity_sold: p.total_quantity_sold,
    total_revenue: p.total_revenue,
    total_gross_profit: p.total_gross_profit,
  }))
}

// New function to get gross profit by category
export async function getGrossProfitByCategory(startDate?: Date, endDate?: Date) {
  const categoriesGrossProfit = await getMonthlyCategoryGrossProfit(startDate, endDate)
  return categoriesGrossProfit.map((c) => ({
    category_name: c.category_name,
    total_gross_profit: c.total_gross_profit,
  }))
}

// New function to get gross profit per order
export async function getGrossProfitByOrder(startDate?: Date, endDate?: Date) {
  const grossProfitPerOrder = await getGrossProfitPerOrderFromOrders(startDate, endDate)
  return grossProfitPerOrder
}

export const getGrossProfitPerOrder = getGrossProfitByOrder

// Re-export other functions if they are still needed directly by other components
export {
  getTodayStats,
  getMonthlyStats,
  getRecentSales,
  getOrders,
  getOrderById,
  processReturnAndRefund,
  createOrder,
  getSalesDataForLast7Days,
}
