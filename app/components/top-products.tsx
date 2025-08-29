import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getTopSellingProducts } from "@/lib/services/products"
import { formatPrice } from "@/lib/utils"
import Image from "next/image"

export default async function TopProducts() {
  const topProducts = await getTopSellingProducts()

  console.log("TopProducts - fetched topProducts:", topProducts)

  return (
    <Card className="col-span-4 md:col-span-3">
      <CardHeader>
        <CardTitle>Sản phẩm bán chạy nhất</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {topProducts.length === 0 ? (
            <p className="text-muted-foreground">Không có dữ liệu sản phẩm bán chạy trong tháng này.</p>
          ) : (
            topProducts.map((product, index) => (
              <div key={product.id} className="flex items-center gap-4">
                {/* Thêm flex-none để đảm bảo kích thước cố định */}
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md flex-none">
                  <Image
                    alt={product.name}
                    className="aspect-square object-cover"
                    height="48"
                    src={product.imageUrl || "/placeholder.svg?height=48&width=48&text=Product"}
                    width="48"
                  />
                </div>
                <div className="grid flex-1 gap-1">
                  <p className="text-sm font-medium leading-none">
                    #{index + 1} {product.name}
                  </p>
                  <p className="text-sm text-muted-foreground">{product.quantitySold} đã bán</p>
                </div>
                <div className="ml-auto font-medium">{formatPrice(product.revenue)}</div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
