"use client"
import { useState, useEffect, useMemo, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { useNetworkStatus } from "@/hooks/use-network-status"
import { getProductsClient } from "@/lib/services/products-client"
import { getCustomersClient } from "@/lib/services/customers-client"
import { createOrderClient } from "@/lib/services/orders-client"
import { getTaxRate } from "@/lib/actions/settings"
import { getPrintTemplateByType } from "@/lib/actions/print-templates"
import { getPosSessions, createPosSession, updatePosSession, deletePosSession } from "@/lib/actions/pos-sessions"
import { IndexedDBService } from "@/lib/services/indexeddb"
import CheckoutModal, { type OrderData } from "@/app/components/checkout-modal"
import ReceiptModal from "@/app/components/receipt-modal"
import PreReceiptModal from "@/app/components/pre-receipt-modal"
import CustomerFormModal from "@/app/components/customer-form-modal"
import ShortcutHelpModal from "@/app/components/shortcut-help-modal"
import QuickServiceModal from "@/app/components/quick-service-modal"
import PriceEditModal from "@/components/price-edit-modal"
import MobilePosInterface from "@/components/mobile-pos-interface"
import ProductSelectionModal from "@/components/product-selection-modal"
import OfflineSyncProvider from "@/components/offline-sync-provider"
import { Loader2 } from "lucide-react"
import React from "react"
import type { PosSession, Customer, Product, CartItem, Order } from "@/lib/types/database"

interface OrderTab extends PosSession {
  customer?: Customer | null
}

export default function POSMobilePage(): React.JSX.Element {
  const { toast } = useToast()
  const networkStatus = useNetworkStatus()
  const [offlineMode, setOfflineMode] = useState<boolean>(false)
  const [indexedDBService, setIndexedDBService] = useState<IndexedDBService | null>(null)
  const [products, setProducts] = useState<Product[]>([]) // This state holds ALL products
  const [isPriceEditModalOpen, setIsPriceEditModalOpen] = useState<boolean>(false)
  const [editingProduct, setEditingProduct] = useState<CartItem | null>(null)
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false)
  const [isPreReceiptModalOpen, setIsPreReceiptModalOpen] = useState<boolean>(false)
  const [customerForReceipt, setCustomerForReceipt] = useState<Customer | null>(null)

  const [orderTabs, setOrderTabs] = useState<OrderTab[]>([])
  const [activeOrderId, setActiveOrderId] = useState<number | null>(null)

  const [nextOrderNumber, setNextOrderNumber] = useState<number>(1)

  const activeOrder = useMemo((): OrderTab => {
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

  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [showCheckout, setShowCheckout] = useState<boolean>(false)
  const [lastOrder, setLastOrder] = useState<Order | null>(null)

  const [showCustomerFormModal, setShowCustomerFormModal] = useState<boolean>(false)
  const [customerFormDefaultName, setCustomerFormDefaultName] = useState<string>("")

  const [initialCheckoutPaymentMethod, setInitialCheckoutPaymentMethod] = useState<string | undefined>(undefined)

  const [showShortcutHelpModal, setShowShortcutHelpModal] = useState<boolean>(false)

  const [showQuickServiceModal, setShowQuickServiceModal] = useState<boolean>(false)

  const [globalTaxRate, setGlobalTaxRate] = useState<number>(0.1)

  const [defaultReceiptTemplateContent, setDefaultReceiptTemplateContent] = useState<string>("")
  const [defaultPreReceiptTemplateContent, setDefaultPreReceiptTemplateContent] = useState<string>("")

  const [isProductSelectionModalOpen, setIsProductSelectionModalOpen] = useState<boolean>(false)

  const [showCustomerDropdown, setShowCustomerDropdown] = useState<boolean>(false)
  const [selectedCustomerIndex, setSelectedCustomerIndex] = useState<number>(-1)

  const customerInputRef = React.useRef<HTMLInputElement>(null)
  const customerDropdownRef = React.useRef<HTMLDivElement>(null)

  const filteredCustomers = useMemo(() => {
    const lowercasedSearchTerm = customerFormDefaultName.trim().toLowerCase()
    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(lowercasedSearchTerm) ||
        (customer.phone && customer.phone.includes(lowercasedSearchTerm)) ||
        (customer.email && customer.email.toLowerCase().includes(lowercasedSearchTerm)),
    )
  }, [customers, customerFormDefaultName])

  useEffect(() => {
    if (customerFormDefaultName.trim() && !activeOrder?.customer) {
      setShowCustomerDropdown(true)
      setSelectedCustomerIndex(-1)
    } else {
      setShowCustomerDropdown(false)
    }
  }, [customerFormDefaultName, activeOrder?.customer])

  useEffect(() => {
    const initIndexedDB = async (): Promise<void> => {
      try {
        const dbService = new IndexedDBService()
        await dbService.init()
        setIndexedDBService(dbService)
      } catch (error) {
        console.error("Failed to initialize IndexedDB:", error)
      }
    }
    initIndexedDB()
  }, [])

  useEffect(() => {
    setOfflineMode(!networkStatus.isOnline)

    if (!networkStatus.isOnline && !offlineMode) {
      toast({
        title: "Mất kết nối internet",
        description:
          "Đã chuyển sang chế độ Offline. Mọi thông tin trong quá trình giao dịch sẽ được lưu lại và đồng bộ tự động lên phần mềm khi có kết nối trở lại.",
        variant: "warning",
        duration: 5000,
      })
    } else if (networkStatus.isOnline && offlineMode) {
      toast({
        title: "Kết nối internet đã sẵn sàng",
        description: "Đã có kết nối internet! Hệ thống sẽ tự động đồng bộ dữ liệu offline.",
        variant: "success",
        duration: 3000,
      })
    }
  }, [networkStatus.isOnline, offlineMode, toast])

  const updateActiveOrder = useCallback(
    async (updates: Partial<OrderTab>): Promise<void> => {
      if (!activeOrderId) return

      const prevOrderTabs = orderTabs

      setOrderTabs((prevTabs) =>
        prevTabs.map((order) => (order.id === activeOrderId ? { ...order, ...updates } : order)),
      )

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
        const cleanDbUpdates = dbUpdates as Partial<PosSession>

        if (!offlineMode) {
          await updatePosSession(activeOrderId, cleanDbUpdates)
        }
      } catch (error) {
        console.error("Failed to update POS session in database:", error)
        setOrderTabs(prevOrderTabs)
        toast({
          title: "Lỗi!",
          description: "Không thể lưu thay đổi đơn hàng. Vui lòng thử lại.",
          variant: "destructive",
        })
      }
    },
    [activeOrderId, orderTabs, toast, offlineMode],
  )

  const addToCart = useCallback(
    (product: Product) => {
      const price = product.wholesale_price
      const costPrice = product.cost_price

      const existingItem = activeOrder.cart_items?.find((item) => item.id === product.id)
      if (existingItem) {
        updateActiveOrder({
          cart_items: (activeOrder.cart_items || []).map((item) =>
            item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
          ),
        })
        if (product.stock_quantity <= 0 && !product.is_service) {
          toast({
            title: "Cảnh báo!",
            description: `Sản phẩm "${product.name}" đã hết hàng. Số lượng tồn kho sẽ âm.`,
            variant: "warning",
          })
        } else if (existingItem.quantity + 1 > product.stock_quantity && !product.is_service) {
          toast({
            title: "Cảnh báo!",
            description: `Sản phẩm "${product.name}" vượt quá số lượng tồn kho. Số lượng tồn kho sẽ âm.`,
            variant: "warning",
          })
        }
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
              stock_quantity: product.stock_quantity,
              is_service: product.is_service || false,
              image_url: product.image_url,
              barcode: product.barcode,
              sku: product.sku,
            },
          ],
        })
        if (product.stock_quantity <= 0 && !product.is_service) {
          toast({
            title: "Cảnh báo!",
            description: `Sản phẩm "${product.name}" đã hết hàng.`,
            variant: "warning",
          })
        }
      }
    },
    [activeOrder, updateActiveOrder, toast],
  )

  const updateQuantity = useCallback(
    (id: number, change: number) => {
      const newCart = (activeOrder.cart_items || [])
        .map((item) => {
          if (item.id === id) {
            const newQuantity = item.quantity + change
            if (newQuantity <= 0) {
              return null
            }
            if (newQuantity > item.stock_quantity && !item.is_service) {
              toast({
                title: "Cảnh báo!",
                description: `Sản phẩm "${item.name}" vượt quá số lượng tồn kho. Số lượng tồn kho sẽ âm.`,
                variant: "warning",
              })
            }
            return { ...item, quantity: newQuantity }
          }
          return item
        })
        .filter(Boolean) as CartItem[]

      updateActiveOrder({ cart_items: newCart })
    },
    [activeOrder, updateActiveOrder, toast],
  )

  const loadPosSessions = useCallback(async (): Promise<void> => {
    try {
      if (offlineMode) {
        if (orderTabs.length === 0) {
          const defaultSession: OrderTab = {
            created_at: new Date(),
            id: Date.now(),
            session_name: "Đơn 1 (Offline)",
            cart_items: [],
            customer_id: null,
            discount_amount: 0,
            received_amount: 0,
            notes: "Đơn hàng offline",
            tax_rate: globalTaxRate,
            user_id: null,
            // created_at: new Date().toISOString(),
                          updated_at: new Date(),
            customer: null,
          }
          setOrderTabs([defaultSession])
          setActiveOrderId(defaultSession.id)
          setNextOrderNumber(2)
        }
        return
      }

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
          // created_at: new Date(),
          // updated_at: new Date(),
          tax_rate: globalTaxRate,
        })
        setOrderTabs([newSession])
        setActiveOrderId(newSession.id)
        setNextOrderNumber(2)
      }
    } catch (error) {
      console.error("Failed to load POS sessions from database:", error)
      if (!offlineMode) {
        setOfflineMode(true)
        toast({
          title: "Chuyển sang chế độ Offline",
          description: "Không thể kết nối server. Đang chuyển sang chế độ offline.",
          variant: "warning",
        })
      }
    }
  }, [globalTaxRate, toast, offlineMode, orderTabs.length])

  useEffect(() => {
    const loadInitialData = async (): Promise<void> => {
      setLoading(true)
      try {
        if (offlineMode && indexedDBService) {
          const [offlineProducts, offlineCustomers] = await Promise.all([
            indexedDBService.getAllProducts(),
            indexedDBService.getAllCustomers(),
          ])

          if (offlineProducts.length > 0) {
            const productsWithPrice = offlineProducts.map((product) => ({
              ...product,
              price: product.wholesale_price,
            }))
            setProducts(productsWithPrice as unknown as Product[])
          }

          if (offlineCustomers.length > 0) {
            setCustomers(offlineCustomers as unknown as Customer[])
          }

          setGlobalTaxRate(0.1)
          await loadPosSessions()
          setLoading(false)
          return
        }

        const [productData, customerData, fetchedTaxRate, receiptTemplate, preReceiptTemplate] = await Promise.all([
          getProductsClient().catch(() => []),
          getCustomersClient().catch(() => []),
          getTaxRate().catch(() => 0.1),
          getPrintTemplateByType("receipt").catch(() => null),
          getPrintTemplateByType("pre_receipt").catch(() => null),
        ])

        const productsWithPrice = productData.map((product) => ({
          ...product,
          price: product.wholesale_price,
        }))

        setProducts(productsWithPrice as unknown as Product[])
        setCustomers(customerData)
        setGlobalTaxRate(fetchedTaxRate)

        if (indexedDBService && productData.length > 0) {
          await indexedDBService.bulkAddProducts(productData as any)
        }
        if (indexedDBService && customerData.length > 0) {
          await indexedDBService.bulkAddCustomers(customerData as any)
        }

        if (receiptTemplate) {
          setDefaultReceiptTemplateContent(receiptTemplate.content)
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
        setOfflineMode(true)
        toast({
          title: "Chuyển sang chế độ Offline",
          description:
            "Không thể tải dữ liệu từ server. Mọi thông tin trong quá trình giao dịch sẽ được lưu lại và đồng bộ tự động lên phần mềm khi có kết nối trở lại.",
          variant: "warning",
          duration: 5000,
        })
      } finally {
        setLoading(false)
      }
    }

    if (indexedDBService) {
      loadInitialData()
    }
  }, [loadPosSessions, toast, offlineMode, indexedDBService])

  const closeOrder = async (orderId: number): Promise<void> => {
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
      if (offlineMode) {
        if (orderTabs.length === 1 && orderTabs[0].id === orderId) {
          const updatedSession = {
            ...orderToClose,
            cart_items: [],
            customer_id: null,
            customer: null,
            discount_amount: 0,
            received_amount: 0,
            notes: "Đơn hàng mới (Offline)",
            tax_rate: globalTaxRate,
            session_name: "Đơn 1",
          }
          setOrderTabs([updatedSession])
          setNextOrderNumber(2)
        } else {
          const newOrderTabs = orderTabs.filter((order) => order.id !== orderId)
          setOrderTabs(newOrderTabs)
          if (activeOrderId === orderId) {
            setActiveOrderId(newOrderTabs[0]?.id || null)
          }
        }
        toast({
          title: "Thành công!",
          description: "Đơn hàng đã được đóng/xóa (Offline).",
          variant: "success",
        })
        return
      }

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

  const duplicateOrder = async (): Promise<void> => {
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

  const handleScanBarcode = useCallback(
    (barcode: string) => {
      if (!barcode.trim()) return

      let foundProduct = products.find(
        (product) => product.barcode && product.barcode.toLowerCase() === barcode.toLowerCase(),
      )

      if (!foundProduct) {
        foundProduct = products.find((product) => product.name.toLowerCase() === barcode.toLowerCase())
      }

      if (foundProduct) {
        addToCart(foundProduct)
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
    },
    [products, addToCart, toast],
  )

  const removeFromCart = useCallback(
    (id: number) => {
      updateActiveOrder({
        cart_items: (activeOrder.cart_items || []).filter((item) => item.id !== id),
      })
    },
    [activeOrder, updateActiveOrder],
  )

  const clearCart = useCallback(() => {
    updateActiveOrder({
      cart_items: [],
      customer_id: null,
      customer: null,
      discount_amount: 0,
      received_amount: 0,
      notes: "Đơn hàng mới",
      tax_rate: globalTaxRate,
    })
  }, [updateActiveOrder, globalTaxRate])

  const subtotal = activeOrder?.cart_items?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0
  const taxAmount = subtotal * (activeOrder?.tax_rate || 0)
  const total = subtotal + taxAmount - (activeOrder?.discount_amount || 0)

  const handleConfirmOrder = useCallback(async (): Promise<void> => {
    if (activeOrder?.cart_items?.length === 0) {
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
      payment_method: "cash",
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
        setLastOrder(order)
        setCustomerForReceipt(customerToPassToReceipt || null)
        setIsReceiptModalOpen(true)

        if (offlineMode) {
          toast({
            title: "Thành công (Offline)!",
            description: "Đơn hàng đã được lưu offline và sẽ đồng bộ khi có mạng.",
            variant: "success",
          })
        } else {
          toast({
            title: "Thành công!",
            description: "Đơn hàng đã được tạo thành công.",
            variant: "success",
          })
        }

        if (offlineMode) {
          if (orderTabs.length === 1) {
            setOrderTabs([
              {
                ...activeOrder,
                cart_items: [],
                customer_id: null,
                customer: null,
                discount_amount: 0,
                received_amount: 0,
                notes: "Đơn hàng mới (Offline)",
                session_name: "Đơn 1",
              },
            ])
          } else {
            const newOrderTabs = orderTabs.filter((order) => order.id !== activeOrderId)
            setOrderTabs(newOrderTabs)
            setActiveOrderId(newOrderTabs[0]?.id || null)
          }
        } else {
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
  }, [activeOrder, activeOrderId, globalTaxRate, loadPosSessions, orderTabs, total, toast, offlineMode])

  const handleDiscountChange = useCallback(
    (value: number) => {
      updateActiveOrder({ discount_amount: value })
    },
    [updateActiveOrder],
  )

  const handleTaxRateChange = useCallback(
    (value: number) => {
      updateActiveOrder({ tax_rate: value })
    },
    [updateActiveOrder],
  )

  const handleNotesChange = useCallback(
    (notes: string) => {
      updateActiveOrder({ notes: notes })
    },
    [updateActiveOrder],
  )

  const loadCustomers = useCallback(async (): Promise<void> => {
    try {
      if (offlineMode && indexedDBService) {
        const offlineCustomers = await indexedDBService.getAllCustomers()
        setCustomers(offlineCustomers as unknown as Customer[])
        return
      }

      const customerData = await getCustomersClient()
      setCustomers(customerData)

      if (indexedDBService && customerData.length > 0) {
        await indexedDBService.bulkAddCustomers(customerData as any)
      }
    } catch (error) {
      console.error("Error loading customers:", error)
      toast({
        title: "Lỗi tải khách hàng!",
        description: "Không thể tải danh sách khách hàng.",
        variant: "destructive",
      })
    }
  }, [toast, offlineMode, indexedDBService])

  const handleSelectCustomer = useCallback(
    (customer: Customer | null) => {
      updateActiveOrder({ customer_id: customer?.id || null, customer: customer })
    },
    [updateActiveOrder],
  )

  const handleCustomerFormSuccess = useCallback(
    async (newCustomer?: Customer) => {
      await loadCustomers()
      if (newCustomer) {
        handleSelectCustomer(newCustomer)
      }
    },
    [loadCustomers, handleSelectCustomer],
  )

  const handleAddQuickService = useCallback(
    (name: string, price: number) => {
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
        price: price,
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
    },
    [addToCart],
  )

  const handleUpdateItemPrice = useCallback((item: CartItem) => {
    setEditingProduct(item)
    setIsPriceEditModalOpen(true)
  }, [])

  const handleSaveItemPrice = useCallback(
    (newPrice: number) => {
      if (editingProduct) {
        const newCart = (activeOrder.cart_items || []).map((item) =>
          item.id === editingProduct.id ? { ...item, price: newPrice } : item,
        )
        updateActiveOrder({ cart_items: newCart })
      }
    },
    [editingProduct, activeOrder, updateActiveOrder],
  )

  const handleCustomerSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomerFormDefaultName(e.target.value)
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
      <OfflineSyncProvider>
        <div className="h-screen flex flex-col">

      <MobilePosInterface
        cartItems={activeOrder?.cart_items || []}
        customer={activeOrder?.customer || null}
        customerSearchTerm={customerFormDefaultName}
        onCustomerSearchChange={handleCustomerSearchChange}
        onUpdateQuantity={updateQuantity}
        onRemoveFromCart={removeFromCart}
        onClearCart={clearCart}
        onSelectCustomer={handleSelectCustomer}
        onConfirmOrder={handleConfirmOrder}
        onShowPreReceipt={() => setIsPreReceiptModalOpen(true)}
        onAddQuickService={() => setShowQuickServiceModal(true)}
        onUpdateItemPrice={handleUpdateItemPrice}
        onCustomerFormSuccess={handleCustomerFormSuccess}
        onShowShortcutHelpModal={() => setShowShortcutHelpModal(true)}
        onDiscountChange={handleDiscountChange}
        discountAmount={activeOrder?.discount_amount || 0}
        taxRate={activeOrder?.tax_rate || 0}
        onTaxRateChange={handleTaxRateChange}
        notes={activeOrder?.notes || ""}
        onNotesChange={handleNotesChange}
        onScanBarcode={handleScanBarcode}
        onDuplicateOrder={duplicateOrder}
        onCloseOrder={() => activeOrderId && closeOrder(activeOrderId)}
        onOpenProductSelectionModal={() => setIsProductSelectionModalOpen(true)}
        onAddCustomerClick={() => setShowCustomerFormModal(true)}
        filteredCustomers={filteredCustomers}
        showCustomerDropdown={showCustomerDropdown}
        setShowCustomerDropdown={setShowCustomerDropdown}
        selectedCustomerIndex={selectedCustomerIndex}
        setSelectedCustomerIndex={setSelectedCustomerIndex}
        customerInputRef={customerInputRef}
        customerDropdownRef={customerDropdownRef}
      />

      <CheckoutModal
        isOpen={showCheckout}
        onClose={() => {
          setShowCheckout(false)
          setInitialCheckoutPaymentMethod(undefined)
        }}
        cartItems={activeOrder?.cart_items || []}
        customer={activeOrder?.customer || null}
        sessionId={1}
        onOrderSuccess={handleConfirmOrder}
        onClearCart={clearCart}
      />

      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false)
          setCustomerForReceipt(null)
        }}
        order={lastOrder}
        customer={customerForReceipt}
        orderData={{
          receivedAmount: total,
          changeAmount: 0,
          paymentMethod: "cash",
        }}
        templateContent={defaultReceiptTemplateContent}
      />

      <PreReceiptModal
        isOpen={isPreReceiptModalOpen}
        onClose={() => setIsPreReceiptModalOpen(false)}
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
        onSuccess={handleCustomerFormSuccess}
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
          onClose={() => setIsPriceEditModalOpen(false)}
          currentPrice={editingProduct.price}
          onSave={(newPrice) => handleSaveItemPrice(newPrice)}
        />
      )}

      <ProductSelectionModal
        isOpen={isProductSelectionModalOpen}
        onClose={() => setIsProductSelectionModalOpen(false)}
        products={products}
        cartItems={activeOrder?.cart_items || []}
        onAddToCart={addToCart}
      />
        </div>
      </OfflineSyncProvider>
    </div>
  )
}
