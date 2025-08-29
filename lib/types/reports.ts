export interface SalesSummary {
  totalSales: number
  totalOrders: number
  averageOrderValue: number
  totalRefunds: number
  netSales: number
  grossProfit: number
}

export interface SalesTrendData {
  date: string
  total_sales: number
}

export interface TopSellingProduct {
  product_name: string
  total_quantity_sold: number
  total_sales_amount: number
}

export interface SalesByPaymentMethod {
  payment_method: string
  total_amount: number
}

export interface SalesByCustomer {
  customer_name: string
  total_orders: number
  total_spent: number
}

export interface GrossProfitData {
  product_name?: string
  category_name?: string
  order_number?: string
  sku?: string | null
  total_quantity_sold?: number
  total_revenue?: number
  total_gross_profit?: number
}
