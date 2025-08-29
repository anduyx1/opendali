"use client"

import type React from "react"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Search, ShoppingCart, Plus, Minus, Trash2 } from "lucide-react"
import Image from "next/image"
import { getProducts } from "@/lib/services/products"
import { getCustomers } from "@/lib/services/customers" // Import getCustomers
import { placeCustomerOrder } from "@/lib/services/orders"
import { formatPrice } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import type { Product, Customer } from "@/lib/types/database" // Import Customer type

interface CartItem extends Product {
  quantity: number
}

export default function MobileOrderInterface() {
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [customers, setCustomers] = useState<Customer[]>([]) // New state for customers
  const [loadingCustomers, setLoadingCustomers] = useState(true) // New state for loading customers
  const [searchTerm, setSearchTerm] = useState("")
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [customerInfo, setCustomerInfo] = useState({
    id: null as number | null, // Add customer ID
    name: "",
    phone: "",
    address: "",
  })
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [isProcessingOrder, setIsProcessingOrder] = useState(false)

  const fetchData = useCallback(async () => {
    setLoadingProducts(true)
    setLoadingCustomers(true)
    try {
      const [fetchedProducts, fetchedCustomers] = await Promise.all([getProducts(), getCustomers()])
      setProducts(fetchedProducts)
      setCustomers(fetchedCustomers)
    } catch (error) {
      console.error("Failed to fetch data:", error)
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách sản phẩm hoặc khách hàng.",
        variant: "destructive",
      })
    } finally {
      setLoadingProducts(false)
      setLoadingCustomers(false)
    }
  }, [toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filteredProducts = useMemo(() => {
    if (!searchTerm) {
      return products
    }
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.barcode?.includes(searchTerm),
    )
  }, [products, searchTerm])

  const handleAddToCart = (product: Product) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === product.id)
      if (existingItem) {
        return prevItems.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
      } else {
        return [...prevItems, { ...product, quantity: 1 }]
      }
    })
    toast({
      title: "Đã thêm vào giỏ hàng",
      description: `${product.name} đã được thêm vào giỏ.`,
    })
  }

  const handleUpdateCartQuantity = (productId: number, newQuantity: number) => {
    setCartItems((prevItems) => {
      if (newQuantity <= 0) {
        return prevItems.filter((item) => item.id !== productId)
      }
      return prevItems.map((item) => (item.id === productId ? { ...item, quantity: newQuantity } : item))
    })
  }

  const handleRemoveFromCart = (productId: number) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== productId))
    toast({
      title: "Đã xóa khỏi giỏ hàng",
      description: "Sản phẩm đã được xóa khỏi giỏ.",
      variant: "destructive",
    })
  }

  const totalCartItems = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0)
  }, [cartItems])

  const totalCartAmount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity * item.retail_price, 0)
  }, [cartItems])

  const handleCustomerInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCustomerInfo((prev) => ({ ...prev, [name]: value }))
  }

  const handleCustomerSelect = (customerId: string) => {
    if (customerId === "new_customer") {
      setCustomerInfo({ id: null, name: "", phone: "", address: "" })
      return
    }
    const selectedCustomer = customers.find((c) => c.id.toString() === customerId)
    if (selectedCustomer) {
      setCustomerInfo({
        id: selectedCustomer.id,
        name: selectedCustomer.name,
        phone: selectedCustomer.phone || "",
        address: selectedCustomer.address || "",
      })
    } else {
      // Fallback if customer not found (shouldn't happen with proper data)
      setCustomerInfo({ id: null, name: "", phone: "", address: "" })
    }
  }

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      toast({
        title: "Lỗi",
        description: "Giỏ hàng trống. Vui lòng thêm sản phẩm.",
        variant: "warning",
      })
      return
    }
    if (!customerInfo.name || !customerInfo.phone) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tên và số điện thoại khách hàng.",
        variant: "warning",
      })
      return
    }

    setIsProcessingOrder(true)
    try {
      const orderData = {
        customerId: customerInfo.id, // Pass customer ID if selected
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        customerAddress: customerInfo.address,
        paymentMethod: paymentMethod,
        items: cartItems.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          unitPrice: item.retail_price,
        })),
      }
      const result = await placeCustomerOrder(orderData as any, orderData.items as any || [])

      if (result && (result as any).success) {
        toast({
          title: "Đặt hàng thành công!",
          description: (result as any)?.message || "Đặt hàng thành công",
          variant: "success",
        })
        setCartItems([]) // Clear cart
        setCustomerInfo({ id: null, name: "", phone: "", address: "" }) // Clear customer info
        setIsCheckoutOpen(false) // Close modal
      } else {
        toast({
          title: "Lỗi",
          description: (result as any)?.message || "Đã xảy ra lỗi khi đặt hàng",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error placing order:", error)
      toast({
        title: "Lỗi",
        description: "Đã xảy ra lỗi khi đ��t hàng. Vui lòng thử lại.",
        variant: "destructive",
      })
    } finally {
      setIsProcessingOrder(false)
    }
  }

  return (
    <div className="flex flex-col h-full p-4 sm:p-6 lg:p-8">
      {/* Product Search */}
      <div className="mb-4 sticky top-0 bg-background z-10 py-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Tìm kiếm sản phẩm..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Product Listing */}
      <ScrollArea className="flex-1 mb-4">
        {loadingProducts ? (
          <div className="flex flex-1 items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="ml-2 text-gray-600">Đang tải sản phẩm...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-1 items-center justify-center h-full text-gray-500">
            Không tìm thấy sản phẩm nào.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-4">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="flex flex-col">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  {/* Placeholder for product image */}
                  <div className="relative w-[100px] h-[100px] mb-2">
                    <Image
                      src={
                        product.image_url ||
                        `/placeholder.svg?height=100&width=100&query=${encodeURIComponent(product.name) || "/placeholder.svg"}`
                      }
                      alt={product.name}
                      fill
                      className="object-cover rounded-md"
                      sizes="100px"
                    />
                  </div>
                  <CardTitle className="text-base font-semibold line-clamp-2 h-12">{product.name}</CardTitle>
                  <p className="text-sm text-gray-500 mb-2">{product.sku}</p>
                  <p className="text-lg font-bold text-primary mb-3">{formatPrice(product.retail_price)}</p>
                  <Button
                    onClick={() => handleAddToCart(product)}
                    className="w-full"
                    disabled={product.stock_quantity <= 0} // Disable if out of stock
                  >
                    {product.stock_quantity <= 0 ? "Hết hàng" : "Thêm vào giỏ"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Floating Cart Button */}
      {totalCartItems > 0 && (
        <div className="fixed bottom-16 right-4 md:bottom-4 md:right-4 z-20">
          <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
            <DialogTrigger asChild>
              <Button className="relative rounded-full h-14 w-14 shadow-lg">
                <ShoppingCart className="h-6 w-6" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold">
                  {totalCartItems}
                </span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] md:max-w-lg lg:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Giỏ hàng của bạn</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {cartItems.length === 0 ? (
                  <p className="text-center text-gray-500">Giỏ hàng trống.</p>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Sản phẩm</TableHead>
                          <TableHead className="text-center">SL</TableHead>
                          <TableHead className="text-right">Đơn giá</TableHead>
                          <TableHead className="text-right">Tổng</TableHead>
                          <TableHead className="text-right">Xóa</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cartItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-6 w-6 bg-transparent"
                                  onClick={() => handleUpdateCartQuantity(item.id, item.quantity - 1)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <Input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) =>
                                    handleUpdateCartQuantity(item.id, Number.parseInt(e.target.value) || 0)
                                  }
                                  className="w-12 text-center h-8"
                                  min="1"
                                />
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-6 w-6 bg-transparent"
                                  onClick={() => handleUpdateCartQuantity(item.id, item.quantity + 1)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">{formatPrice(item.retail_price)}</TableCell>
                            <TableCell className="text-right">
                              {formatPrice(item.quantity * item.retail_price)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="destructive"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleRemoveFromCart(item.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    <div className="mt-4 border-t pt-4">
                      <h3 className="text-lg font-semibold mb-2">Thông tin khách hàng</h3>
                      <div className="grid gap-2">
                        <div>
                          <Label htmlFor="customerSelect">Chọn khách hàng</Label>
                          <Select
                            onValueChange={handleCustomerSelect}
                            value={customerInfo.id?.toString() || "new_customer"}
                          >
                            <SelectTrigger id="customerSelect" className="w-full">
                              <SelectValue placeholder="Chọn khách hàng hiện có hoặc nhập mới" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new_customer">-- Khách hàng mới --</SelectItem>
                              {loadingCustomers ? (
                                <SelectItem value="loading" disabled>
                                  Đang tải khách hàng...
                                </SelectItem>
                              ) : (
                                customers.map((customer) => (
                                  <SelectItem key={customer.id} value={customer.id.toString()}>
                                    {customer.name} - {customer.phone}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="customerName">Tên khách hàng *</Label>
                          <Input
                            id="customerName"
                            name="name"
                            value={customerInfo.name}
                            onChange={handleCustomerInfoChange}
                            placeholder="Nguyễn Văn A"
                          />
                        </div>
                        <div>
                          <Label htmlFor="customerPhone">Số điện thoại *</Label>
                          <Input
                            id="customerPhone"
                            name="phone"
                            value={customerInfo.phone}
                            onChange={handleCustomerInfoChange}
                            placeholder="0912345678"
                            type="tel"
                          />
                        </div>
                        <div>
                          <Label htmlFor="customerAddress">Địa chỉ</Label>
                          <Input
                            id="customerAddress"
                            name="address"
                            value={customerInfo.address}
                            onChange={handleCustomerInfoChange}
                            placeholder="123 Đường ABC, Quận XYZ"
                          />
                        </div>
                      </div>

                      <h3 className="text-lg font-semibold mt-4 mb-2">Phương thức thanh toán</h3>
                      <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Chọn phương thức thanh toán" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Tiền mặt</SelectItem>
                          <SelectItem value="bank_transfer">Chuyển khoản</SelectItem>
                          <SelectItem value="card">Thẻ</SelectItem>
                        </SelectContent>
                      </Select>

                      <div className="flex justify-between items-center mt-6 text-xl font-bold">
                        <span>Tổng cộng:</span>
                        <span className="text-primary">{formatPrice(totalCartAmount)}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCheckoutOpen(false)}>
                  Tiếp tục mua hàng
                </Button>
                <Button onClick={handlePlaceOrder} disabled={isProcessingOrder || cartItems.length === 0}>
                  {isProcessingOrder && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Đặt hàng
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  )
}
