import { Suspense } from "react"
import DashboardStats from "@/app/components/dashboard-stats"
import RecentSales from "@/app/components/recent-sales"
import { SalesChart } from "@/app/components/sales-chart" // Corrected to named import
import TopProducts from "@/app/components/top-products"

export default async function DashboardPage() {
  // Placeholder for sales data. In a real application, you would fetch this from your database.
  const salesData = [
    { sale_date: "2023-01-01", total_sales: 1200000 },
    { sale_date: "2023-01-02", total_sales: 1900000 },
    { sale_date: "2023-01-03", total_sales: 1500000 },
    { sale_date: "2023-01-04", total_sales: 2200000 },
    { sale_date: "2023-01-05", total_sales: 1800000 },
    { sale_date: "2023-01-06", total_sales: 2500000 },
    { sale_date: "2023-01-07", total_sales: 2100000 },
  ]

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tổng Quan</h1>
      </div>

      <Suspense fallback={<div>Loading stats...</div>}>
        <DashboardStats />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {" "}
        {/* Changed to lg:grid-cols-3 */}
        <div className="lg:col-span-2">
          {" "}
          {/* SalesChart takes 2/3 on large screens */}
          <Suspense fallback={<div>Loading sales chart...</div>}>
            <SalesChart /> {/* Pass data prop */}
          </Suspense>
        </div>
        <div className="lg:col-span-1">
          {" "}
          {/* RecentSales takes 1/3 on large screens */}
          <Suspense fallback={<div>Loading recent sales...</div>}>
            <RecentSales />
          </Suspense>
        </div>
      </div>

      <Suspense fallback={<div>Loading top products...</div>}>
        <TopProducts />
      </Suspense>
    </div>
  )
}
