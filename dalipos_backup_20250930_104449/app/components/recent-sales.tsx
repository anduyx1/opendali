import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getRecentSales, getMonthlyStats } from "@/lib/services/orders" // Import getMonthlyStats
import { formatCompactPrice } from "@/lib/utils" // Updated import to use formatCompactPrice

export default async function RecentSales() {
  const recentSales = await getRecentSales() // Fetch recent sales from the database
  const monthlyStats = await getMonthlyStats() // Fetch monthly stats to get the order count

  return (
    <Card>
      <CardHeader>
        <CardTitle>Giao dịch gần đây</CardTitle>
        <CardDescription>Bạn đã có {monthlyStats.length} giao dịch trong tháng này</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {recentSales.map((sale, index) => (
            <div key={index} className="flex items-center">
              <Avatar className="h-9 w-9">
                <AvatarFallback>
                  {sale.customer?.name
                    ? sale.customer.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                    : "N/A"}
                </AvatarFallback>
              </Avatar>
              <div className="ml-4 space-y-1 flex-1 min-w-0">
                <p className="text-sm font-medium leading-none truncate">{sale.customer?.name || "Khách hàng"}</p>
                <p className="text-xs text-muted-foreground truncate">{sale.customer?.email || "Không có email"}</p>
              </div>
              <div className="ml-auto font-medium text-sm md:text-base">{formatCompactPrice(sale.total_amount)}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
