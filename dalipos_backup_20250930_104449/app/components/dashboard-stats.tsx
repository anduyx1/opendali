import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getTodayStats, getMonthlyTotalStats, getProductsSoldCountMonthly } from "@/lib/services/orders"
import { getNewCustomersCountMonthly, getNewCustomersCountPreviousMonth } from "@/lib/services/customers"
import { formatCompactPrice } from "@/lib/utils"

export default async function DashboardStats() {
  try {
    const todayStats = await getTodayStats()
    const monthlyStats = await getMonthlyTotalStats()
    const newCustomersCount = await getNewCustomersCountMonthly()
    const newCustomersCountPreviousMonth = await getNewCustomersCountPreviousMonth()
    const productsSoldCount = await getProductsSoldCountMonthly()

    console.log("DashboardStats - todayStats:", todayStats)
    console.log("DashboardStats - monthlyStats:", monthlyStats)

    // Calculate percentage change for new customers
    let newCustomersPercentageChange = 0
    if (newCustomersCountPreviousMonth > 0) {
      newCustomersPercentageChange =
        ((newCustomersCount - newCustomersCountPreviousMonth) / newCustomersCountPreviousMonth) * 100
    } else if (newCustomersCount > 0) {
      newCustomersPercentageChange = 100
    }

    // Format the percentage string
    const newCustomersPercentageString =
      newCustomersPercentageChange >= 0
        ? `+${newCustomersPercentageChange.toFixed(1)}% so với tháng trước`
        : `${newCustomersPercentageChange.toFixed(1)}% so với tháng trước`

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng doanh thu (Hôm nay)</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-primary"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCompactPrice(todayStats.revenue)}</div>
            <p className="text-xs text-muted-foreground">{todayStats.orders} đơn hàng hôm nay</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-secondary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng doanh thu (Tháng này)</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-secondary"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{formatCompactPrice(monthlyStats.revenue)}</div>
            <p className="text-xs text-muted-foreground">{monthlyStats.orders} đơn hàng tháng này</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-accent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Khách hàng mới</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-accent"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">+{newCustomersCount}</div>
            <p className="text-xs text-muted-foreground">{newCustomersPercentageString}</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-chart-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sản phẩm đã bán</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4"
              style={{ color: "hsl(var(--chart-4))" }}
            >
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <path d="M2 10h20" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: "hsl(var(--chart-4))" }}>
              +{productsSoldCount}
            </div>
            <p className="text-xs text-muted-foreground">+19% so với tháng trước</p>
          </CardContent>
        </Card>
      </div>
    )
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return (
      <div className="text-center py-8">
        <p>Failed to load dashboard statistics.</p>
      </div>
    )
  }
}
