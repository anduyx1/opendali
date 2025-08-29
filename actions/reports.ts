"use server"

import {
  getSalesSummary,
  getSalesTrend,
  getTopSellingProducts,
  getSalesByPaymentMethod,
  getSalesByCustomer,
  getGrossProfitByProduct,
  getGrossProfitByCategory,
  getGrossProfitPerOrder,
} from "@/lib/services/reports"
import type {
  SalesSummary,
  SalesTrendData,
  TopSellingProduct,
  SalesByPaymentMethod,
  SalesByCustomer,
  GrossProfitData,
} from "@/lib/types/reports"

export async function fetchSalesSummary(startDate: Date, endDate: Date): Promise<SalesSummary> {
  return getSalesSummary(startDate, endDate)
}

export async function fetchSalesTrend(
  startDate?: Date,
  endDate?: Date,
  interval?: "day" | "week" | "month" | "year",
): Promise<SalesTrendData[]> {
  return getSalesTrend()
}

export async function fetchTopSellingProducts(
  startDate?: Date,
  endDate?: Date,
  limit?: number,
): Promise<TopSellingProduct[]> {
  return getTopSellingProducts(limit)
}

export async function fetchSalesByPaymentMethod(startDate?: Date, endDate?: Date): Promise<SalesByPaymentMethod[]> {
  return getSalesByPaymentMethod(startDate, endDate)
}

export async function fetchSalesByCustomer(startDate?: Date, endDate?: Date, limit?: number): Promise<SalesByCustomer[]> {
  return getSalesByCustomer(limit, startDate, endDate)
}

export async function fetchGrossProfitByProduct(
  startDate?: Date,
  endDate?: Date,
  limit?: number,
): Promise<GrossProfitData[]> {
  return getGrossProfitByProduct(startDate, endDate)
}

export async function fetchGrossProfitByCategory(
  startDate?: Date,
  endDate?: Date,
  limit?: number,
): Promise<GrossProfitData[]> {
  return getGrossProfitByCategory(startDate, endDate)
}

export async function fetchGrossProfitPerOrder(startDate: Date, endDate: Date): Promise<GrossProfitData[]> {
  return getGrossProfitPerOrder(startDate, endDate)
}
