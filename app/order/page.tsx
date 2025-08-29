"use client"
import { useState, useEffect, useMemo, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { getProductsClient } from "@/lib/services/products-client"
import { getCustomersClient } from "@/lib/services/customers-client"
import { createOrderClient } from "@/lib/services/orders-client"
import { getTaxRate } from "@/lib/actions/settings"
import { getPrintTemplateByType } from "@/lib/actions/print-templates"
import { getPosSessions, createPosSession, updatePosSession, deletePosSession } from "@/lib/actions/pos-sessions"
import type { OrderData } from "@/app/components/checkout-modal"
import ReceiptModal from "@/app/components/receipt-modal"
import PreReceiptModal from "@/app/components/pre-receipt-modal"
import CustomerFormModal from "@/app/components/customer-form-modal"
import ShortcutHelpModal from "@/app/components/shortcut-help-modal"
import QuickServiceModal from "@/app/components/quick-service-modal"
import PriceEditModal from "@/components/price-edit-modal"
import MobilePosInterface from "@/components/mobile-pos-interface" // Updated import path
import type { Product, CartItem, Customer, PosSession } from "@/lib/types/database"
import { Loader2 } from "lucide-react"

// OrderTab interface now extends PosSession to include client-side specific fields if any,
// but primarily maps to PosSession from DB.
interface OrderTab extends PosSession {
  customer?: Customer | null
}

export default function OrderPage() {
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isPriceEditModalOpen, setIsPriceEditModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<CartItem | null>(null)
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false)
  const [isPreReceiptModalOpen, setIsPreReceiptModal] = useState(false)
  const [customerForReceipt, setCustomerForReceipt] = useState<Customer | null>(null)

  const [orderTabs, setOrderTabs] = useState<OrderTab[]>([])
  const [activeOrderId, setActiveOrderId] = useState<number | null>(null)

  const [nextOrderNumber, setNextOrderNumber] = useState<number>(1)

  const activeOrder = useMemo(() => {
    if (activeOrderId === null || !Array.isArray(orderTabs) || orderTabs.length === 0) {
      return {
        id: 0,
        session_name: "Đơn tạm",
        cart_items: [],
        customer_id: null,
        discount_amount: 0,
        received_amount: 0,
        notes: "Đơn hàng tạm thời",
        created_at: new Date(),
        updated_at: new Date(),
        tax_rate: 0.1,
        user_id: null,
        customer: null,
      } as OrderTab
    }
    return orderTabs.find((order) => order.id === activeOrderId) || orderTabs[0]
  }, [orderTabs, activeOrderId])

  const [loading, setLoading] = useState(true)
  const [customerSearchTerm, setCustomerSearchTerm] = useState("")

  const [showCustomerFormModal, setShowCustomerFormModal] = useState(false)
  const [customerFormDefaultName, setCustomerFormDefaultName] = useState<string>("")

  const [showShortcutHelpModal, setShowShortcutHelpModal] = useState(false)

  const [showQuickServiceModal, setShowQuickServiceModal] = useState(false)

  const [globalTaxRate, setGlobalTaxRate] = useState(0.1)

  const [defaultReceiptTemplateContent, setDefaultReceiptTemplateContent] = useState<string>("")
  const [defaultPreReceiptTemplateContent, setDefaultPreReceiptTemplateContent] = useState<string>("")

  const loadPosSessions = useCallback(async () => {
    try {
      const sessions = await getPosSessions(null)
      setOrderTabs(sessions)

      if (sessions.length > 0) {
        const maxNum = Math.max(
          0,
          ...sessions.map((tab) => {
            const match = tab.session_name.match(/Đơn (\d+)/)
            return match ? Number.parseInt(match[1]) : 0
          }),
        )
        setNextOrderNumber(maxNum + 1)
        setActiveOrderId(sessions[0].id)
      } else {
        const newSession = await createPosSession({
          user_id: null,
          session_name: "Đơn 1",
          cart_items: [],
          customer_id: null,
          discount_amount: 0,
          received_amount: 0,
          notes: "Đơn hàng mới",
          tax_rate: globalTaxRate,
        })
        setOrderTabs([newSession])
        setActiveOrderId(newSession.id)
        setNextOrderNumber(2)
      }
    } catch (error) {
      console.error("Failed to load POS sessions from database:", error)
      toast({
        title: "Lỗi tải phiên POS!",
        description: "Không thể tải các phiên làm việc. Vui lòng kiểm tra kết nối DB.",
        variant: "destructive",
      })
    }
  }, [globalTaxRate, toast])

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true)
      try {
        const [productData, receiptTemplate, preReceiptTemplate] = await Promise.all([
          getProductsClient(),
          getTaxRate(),
          getPrintTemplateByType("receipt"),
          getPrintTemplateByType("pre_receipt"),
        ])

        const productsWithPrice = productData.map((product) => ({
          ...product,
          price: product.wholesale_price,
        }))

        setProducts(productsWithPrice as unknown as Product[])
        setGlobalTaxRate(0.1)

        if (receiptTemplate && typeof receiptTemplate === 'object' && 'content' in receiptTemplate) {
          setDefaultReceiptTemplateContent((receiptTemplate as any)?.content?.toString() || "")
        } else {
          toast({
            title: "Cảnh báo",
            description: "Không tìm thấy mẫu hóa đơn mặc định. Vui lòng cấu hình trong cài đặt.",
            variant: "warning",
          })
        }

        if (preReceiptTemplate) {
          setDefaultPreReceiptTemplateContent(preReceiptTemplate.content)
        } else {
          toast({
            title: "Cảnh báo",
            description: "Không tìm thấy mẫu tạm tính mặc định. Vui lòng cấu hình trong cài đặt.",
            variant: "warning",
          })
        }

        await loadPosSessions()
      } catch (error) {
        console.error("Error loading initial data:", error)
        toast({
          title: "Lỗi tải dữ liệu!",
          description: "Không thể tải dữ liệu ban đầu. Vui lòng kiểm tra kết nối DB.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()
  }, [loadPosSessions, toast])

  const closeOrder = async (orderId: number) => {
    const orderToClose = orderTabs.find((tab) => tab.id === orderId)

    if (!orderToClose) return

    if (orderToClose.cart_items && orderToClose.cart_items.length > 0) {
      const confirmed = window.confirm(
        `Đơn hàng "${orderToClose.session_name}" có sản phẩm. Bạn có chắc chắn muốn xóa/làm mới đơn hàng này không?`,
      )
      if (!confirmed) {
        return
      }
    }

    try {
      if (orderTabs.length === 1 && orderTabs[0].id === orderId) {
        const updatedSession = await updatePosSession(orderId, {
          cart_items: [],
          customer_id: null,
          discount_amount: 0,
          received_amount: 0,
          notes: "Đơn hàng mới",
          tax_rate: globalTaxRate,
          session_name: "Đơn 1",
        })
        setOrderTabs([updatedSession])
        setNextOrderNumber(2)
      } else {
        await deletePosSession(orderId)
        const newOrderTabs = orderTabs.filter((order) => order.id !== orderId)
        setOrderTabs(newOrderTabs)

        if (activeOrderId === orderId) {
          setActiveOrderId(newOrderTabs[0]?.id || null)
        }
      }
      toast({
        title: "Thành công!",
        description: "Đơn hàng đã được đóng/xóa.",
        variant: "success",
      })
    } catch (error) {
      console.error("Failed to close/delete POS session:", error)
      toast({
        title: "Lỗi!",
        description: "Không thể đóng/xóa đơn hàng. Vui lòng thử lại.",
        variant: "destructive",
      })
    }
  }

  const duplicateOrder = async () => {
    const orderToDuplicate = activeOrder
    if (!orderToDuplicate) return

    try {
      const duplicatedSession = await createPosSession({
        user_id: null,
        session_name: `Đơn ${nextOrderNumber}`,
        cart_items: orderToDuplicate.cart_items,
        customer_id: orderToDuplicate.customer_id,
        discount_amount: orderToDuplicate.discount_amount,
        received_amount: orderToDuplicate.received_amount,
        notes: orderToDuplicate.notes,
        tax_rate: orderToDuplicate.tax_rate,
      })
      setOrderTabs((prev) => [...prev, duplicatedSession])
      setActiveOrderId(duplicatedSession.id)
      setNextOrderNumber((prev) => prev + 1)
      toast({
        title: "Thành công!",
        description: "Đơn hàng đã được nhân bản.",
        variant: "success",
      })
    } catch (error) {
      console.error("Failed to duplicate POS session:", error)
      toast({
        title: "Lỗi!",
        description: "Không thể nhân bản đơn hàng. Vui lòng thử lại.",
        variant: "destructive",
      })
    }
  }

  const updateActiveOrder = async (updates: Partial<OrderTab>) => {
    if (!activeOrderId) return

    setOrderTabs((prevTabs) => prevTabs.map((order) => (order.id === activeOrderId ? { ...order, ...updates } : order)))

    try {
      const dbUpdates: Partial<PosSession> = { ...updates }
      if (updates.cart_items) {
        dbUpdates.cart_items = updates.cart_items
      }
      if (updates.customer === null) {
        dbUpdates.customer_id = null
      } else if (updates.customer && updates.customer.id !== undefined) {
        dbUpdates.customer_id = updates.customer.id
      }
      const finalUpdates = dbUpdates as Partial<PosSession>

      await updatePosSession(activeOrderId, finalUpdates)
    } catch (error) {
      console.error("Failed to update POS session in database:", error)
      toast({
        title: "Lỗi!",
        description: "Không thể lưu thay đổi đơn hàng. Vui lòng thử lại.",
        variant: "destructive",
      })
    }
  }

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
  }

  const handleCustomerSearchChange = (value: string) => {
    setCustomerSearchTerm(value)
  }

  const handleScanBarcode = (barcode: string) => {
    if (!barcode.trim()) return

    let foundProduct = products.find(
      (product) => product.barcode && product.barcode.toLowerCase() === barcode.toLowerCase(),
    )

    if (!foundProduct) {
      foundProduct = products.find((product) => product.name.toLowerCase() === barcode.toLowerCase())
    }

    if (foundProduct) {
      addToCart(foundProduct)
      setSearchTerm("")
      toast({
        title: "Thành công!",
        description: `Đã thêm "${foundProduct.name}" vào giỏ hàng.`,
        variant: "success",
      })
    } else {
      toast({
        title: "Lỗi!",
        description: `Không tìm thấy sản phẩm với mã/tên: "${barcode}"`,
        variant: "destructive",
      })
    }
  }

  const addToCart = (product: Product) => {
    const price = product.wholesale_price
    const costPrice = product.cost_price

    const existingItem = (activeOrder.cart_items || []).find((item) => item.id === product.id)
    if (existingItem) {
      if (existingItem.quantity >= (product.stock_quantity || 0) && !product.is_service) {
        toast({
          title: "Hết hàng!",
          description: `Chỉ còn ${product.stock_quantity} sản phẩm trong kho!`,
          variant: "destructive",
        })
        return
      }
      updateActiveOrder({
        cart_items: (activeOrder.cart_items || []).map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        ),
      })
    } else {
      updateActiveOrder({
        cart_items: [
          ...(activeOrder.cart_items || []),
          {
            id: product.id,
            name: product.name,
            price: price || 0,
            // cost_price: costPrice,
            quantity: 1,
            stock_quantity: product.stock_quantity || 0,
            is_service: product.is_service || false,
          },
        ],
      })
    }
  }

  const updateQuantity = (id: number, change: number) => {
    const newCart = (activeOrder.cart_items || [])
      .map((item) => {
        if (item.id === id) {
          const newQuantity = item.quantity + change
          // Remove stock check since CartItem doesn't have stock property
          return newQuantity > 0 ? { ...item, quantity: newQuantity } : item
        }
        return item
      })
      .filter((item) => item.quantity > 0)

    updateActiveOrder({ cart_items: newCart })
  }

  const removeFromCart = (id: number) => {
    updateActiveOrder({
      cart_items: (activeOrder.cart_items || []).filter((item) => item.id !== id),
    })
  }

  const clearCart = () => {
    updateActiveOrder({
      cart_items: [],
      customer_id: null,
      customer: null,
      discount_amount: 0,
      received_amount: 0,
      notes: "Đơn hàng mới",
      tax_rate: globalTaxRate,
    })
  }

  const subtotal = (activeOrder?.cart_items || []).reduce((sum, item) => sum + item.price * item.quantity, 0) || 0
  const taxAmount = subtotal * (activeOrder?.tax_rate || 0)
  const total = subtotal + taxAmount - (activeOrder?.discount_amount || 0)

  const handleConfirmOrder = async () => {
    if (!activeOrder?.cart_items || activeOrder.cart_items.length === 0) {
      toast({
        title: "Giỏ hàng trống!",
        description: "Vui lòng thêm sản phẩm vào giỏ hàng trước khi thanh toán.",
        variant: "warning",
      })
      return
    }

    const orderData: OrderData = {
      customer_id: activeOrder?.customer?.id || null,
      subtotal: subtotal,
      tax_amount: taxAmount,
      discount_amount: activeOrder?.discount_amount || 0,
      total_amount: total,
      payment_method: "cash", // Default for mobile quick checkout
      payment_status: "paid",
      order_status: "completed",
      notes: activeOrder?.notes || "",
      order_items: (activeOrder.cart_items || []).map((item) => ({
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        cost_price: null,
        is_service: item.is_service,
      })),
    }

    try {
      const customerToPassToReceipt = activeOrder.customer

      const order = await createOrderClient(
        orderData.customer_id,
        activeOrder.cart_items || [],
        orderData.payment_method,
        orderData.discount_amount,
        activeOrder?.tax_rate || 0,
        activeOrder.notes || "",
      )

      if (order) {
        setCustomerForReceipt(customerToPassToReceipt || null)
        setIsReceiptModalOpen(true)
        toast({
          title: "Thành công!",
          description: "Đơn hàng đã được tạo thành công.",
          variant: "success",
        })

        if (orderTabs.length === 1) {
          await updatePosSession(activeOrderId!, {
            cart_items: [],
            customer_id: null,
            discount_amount: 0,
            received_amount: 0,
            notes: "Đơn hàng mới",
            tax_rate: globalTaxRate,
            session_name: "Đơn 1",
          })
          await loadPosSessions()
        } else {
          await deletePosSession(activeOrderId!)
          await loadPosSessions()
        }
      } else {
        toast({
          title: "Lỗi!",
          description: "Có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Checkout error:", error)
      toast({
        title: "Lỗi!",
        description: "Có lỗi xảy ra khi tạo đơn hàng: " + (error as Error).message,
        variant: "destructive",
      })
    }
  }

  const handleDiscountChange = (value: number) => {
    updateActiveOrder({ discount_amount: value })
  }

  const handleTaxRateChange = (value: number) => {
    updateActiveOrder({ tax_rate: value })
  }

  const handleNotesChange = (notes: string) => {
    updateActiveOrder({ notes: notes })
  }

  const loadCustomers = async () => {
    try {
      await getCustomersClient()
    } catch (error) {
      console.error("Error loading customers:", error)
      toast({
        title: "Lỗi tải khách hàng!",
        description: "Không thể tải danh sách khách hàng.",
        variant: "destructive",
      })
    }
  }

  const handleCustomerFormSuccess = async (newCustomer: Customer) => {
    await loadCustomers()
    if (newCustomer) {
      handleSelectCustomer(newCustomer)
    }
  }

  const handleSelectCustomer = (customer: Customer | null) => {
    updateActiveOrder({ customer_id: customer?.id || null, customer: customer })
    setCustomerSearchTerm("")
  }

  const handleAddQuickService = (name: string, price: number) => {
    const quickServiceProduct: Product = {
      id: Date.now(),
      name: name,
      retail_price: price,
      wholesale_price: price,
      cost_price: price,
      stock_quantity: Number.POSITIVE_INFINITY,
      status: "active",
      created_at: new Date(),
      updated_at: new Date(),
                  price: price || 0,
      is_service: true,
      description: null,
      category_id: null,
      barcode: null,
      image_url: null,
      image_data: null,
      min_stock_level: null,
      sku: null,
    }
    addToCart(quickServiceProduct)
  }

  const handleUpdateItemPrice = (item: CartItem) => {
    setEditingProduct(item)
    setIsPriceEditModal(true)
  }

  const handleSaveItemPrice = (newPrice: number) => {
    if (editingProduct) {
      const newCart = (activeOrder.cart_items || []).map((item) =>
        item.id === editingProduct.id ? { ...item, price: newPrice } : item,
      )
      updateActiveOrder({ cart_items: newCart })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
        <p className="ml-4 text-lg text-gray-600">Đang tải dữ liệu...</p>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      <MobilePosInterface
        {...{
          cartItems: activeOrder?.cart_items || [],
          customer: activeOrder?.customer || null,
          onAddToCart: addToCart as any,
          onUpdateQuantity: updateQuantity,
          onRemoveFromCart: removeFromCart,
          onClearCart: clearCart,
          onSelectCustomer: handleSelectCustomer,
          onConfirmOrder: handleConfirmOrder,
          onShowPreReceipt: () => setIsPreReceiptModal(true),
          onAddQuickService: () => setShowQuickServiceModal(true),
          onUpdateItemPrice: handleUpdateItemPrice,
          onCustomerFormSuccess: async (customer: any) => {
            if (customer) {
              await handleCustomerFormSuccess(customer)
            }
          },
          onShowShortcutHelpModal: () => setShowShortcutHelpModal(true),
          onDiscountChange: handleDiscountChange,
          discountAmount: activeOrder?.discount_amount || 0,
          taxRate: activeOrder?.tax_rate || 0,
          onTaxRateChange: handleTaxRateChange,
          onNotesChange: handleNotesChange,
          notes: activeOrder?.notes || "",
          onScanBarcode: handleScanBarcode,
          onDuplicateOrder: duplicateOrder,
          onCloseOrder: () => activeOrderId && closeOrder(activeOrderId),
          onCloseOrderModal: () => {},
        } as any}
        // products={products}
        // searchTerm={searchTerm}
        // customerSearchTerm={customerSearchTerm}
        // onSearchChange={handleSearchChange}
        // onCustomerSearchChange={(e) => handleCustomerSearchChange(e.target.value)}
        cartItems={activeOrder?.cart_items || []}
        customer={activeOrder?.customer || null}

        onAddToCart={addToCart as any}
        onUpdateQuantity={updateQuantity}
        onRemoveFromCart={removeFromCart}
        onClearCart={clearCart}
        onSelectCustomer={handleSelectCustomer}
        onConfirmOrder={handleConfirmOrder}
        onShowPreReceipt={() => setIsPreReceiptModal(true)}
        onAddQuickService={() => setShowQuickServiceModal(true)}
        onUpdateItemPrice={handleUpdateItemPrice}
        onCustomerFormSuccess={async (customer) => {
          if (customer) {
            await handleCustomerFormSuccess(customer)
          }
        }}
        onShowShortcutHelpModal={() => setShowShortcutHelpModal(true)}
        onDiscountChange={handleDiscountChange}
        discountAmount={activeOrder?.discount_amount || 0}
        taxRate={activeOrder?.tax_rate || 0}
        onTaxRateChange={handleTaxRateChange}
        onNotesChange={handleNotesChange}
        notes={activeOrder?.notes || ""}
        onScanBarcode={handleScanBarcode}
        onDuplicateOrder={duplicateOrder}
        onCloseOrder={() => activeOrderId && closeOrder(activeOrderId)}
        onCloseOrderModal={() => {}}
      />

      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false)
          setCustomerForReceipt(null)
        }}
        customer={customerForReceipt}
        order={{
          id: 0,
          order_number: `ORD-${Date.now()}`,
          customer_id: activeOrder?.customer?.id || null,
          subtotal: subtotal,
          tax_amount: taxAmount,
          discount_amount: activeOrder?.discount_amount || 0,
          total_amount: total,
          payment_method: "cash",
          payment_status: "paid",
          order_status: "completed",
          notes: activeOrder?.notes || "",
          created_at: new Date(),
          updated_at: new Date(),
          refund_amount: null,
          order_items: (activeOrder?.cart_items || []).map((item) => ({
            id: 0,
            order_id: 0,
            product_id: item.id,
            product_name: item.name,
            quantity: item.quantity,
            unit_price: item.price,
            total_price: item.price * item.quantity,
            cost_price: null,
            is_service: item.is_service,
            returned_quantity: null,
            returned_at: null,
          })),
        }}
        orderData={{
          receivedAmount: total,
          changeAmount: 0,
          paymentMethod: "cash",
        }}
        templateContent={defaultReceiptTemplateContent}
      />

      <PreReceiptModal
        isOpen={isPreReceiptModalOpen}
        onClose={() => setIsPreReceiptModal(false)}
        cartItems={activeOrder?.cart_items || []}
        customer={activeOrder?.customer || null}
        subtotal={subtotal}
        taxRate={activeOrder?.tax_rate || 0}
        discountAmount={activeOrder?.discount_amount || 0}
        templateContent={defaultPreReceiptTemplateContent}
      />

      <CustomerFormModal
        isOpen={showCustomerFormModal}
        onClose={() => {
          setShowCustomerFormModal(false)
          setCustomerFormDefaultName("")
        }}
        onSuccess={async (customer) => {
          if (customer) {
            await handleCustomerFormSuccess(customer)
          }
        }}
        initialData={null}
        defaultName={customerFormDefaultName}
      />

      <ShortcutHelpModal isOpen={showShortcutHelpModal} onClose={() => setShowShortcutHelpModal(false)} />

      <QuickServiceModal
        isOpen={showQuickServiceModal}
        onClose={() => setShowQuickServiceModal(false)}
        onAddService={handleAddQuickService}
      />

      {editingProduct && (
        <PriceEditModal
          isOpen={isPriceEditModalOpen}
          onClose={() => setIsPriceEditModal(false)}
          currentPrice={editingProduct.price}
          onSave={(newPrice) => handleSaveItemPrice(newPrice)}
        />
      )}
    </div>
  )
}
