"use client"

const topProducts = [
  {
    id: 1,
    name: "Áo thun nam basic",
    sku: "AT001",
    sold: 156,
    revenue: "15,600,000",
    trend: "up",
  },
  {
    id: 2,
    name: "Quần jean nữ skinny",
    sku: "QJ002",
    sold: 134,
    revenue: "13,400,000",
    trend: "up",
  },
  {
    id: 3,
    name: "Giày sneaker unisex",
    sku: "GS003",
    sold: 98,
    revenue: "9,800,000",
    trend: "down",
  },
  {
    id: 4,
    name: "Túi xách nữ da",
    sku: "TX004",
    sold: 87,
    revenue: "8,700,000",
    trend: "up",
  },
  {
    id: 5,
    name: "Đồng hồ nam thể thao",
    sku: "DH005",
    sold: 76,
    revenue: "7,600,000",
    trend: "stable",
  },
]

export function TopProductsTable() {
  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "up":
        return "text-green-600"
      case "down":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return "↗"
      case "down":
        return "↘"
      default:
        return "→"
    }
  }

  return (
    <div className="space-y-3">
      {topProducts.map((product, index) => (
        <div key={product.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-sm">
            {index + 1}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{product.name}</p>
            <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
          </div>
          <div className="text-right">
            <p className="font-medium text-sm">{product.sold} bán</p>
            <p className="text-xs text-muted-foreground">{product.revenue}₫</p>
          </div>
          <div className={`text-lg ${getTrendColor(product.trend)}`}>{getTrendIcon(product.trend)}</div>
        </div>
      ))}
    </div>
  )
}
