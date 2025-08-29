import type { Product, Customer, Order, Category } from "@/lib/types/database"

interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
  stock_quantity: number
}

// Mock data for development
export const initialMockProducts: Product[] = [
  {
    id: 1,
    name: "iPhone 15 Pro Max",
    description: "iPhone 15 Pro Max 256GB Titan tự nhiên",
    retail_price: 35000000,
    wholesale_price: 32000000,
    cost_price: 30000000,
    category_id: 1,
    stock_quantity: 15,
    min_stock_level: 5,
    barcode: "1234567890123",
    sku: "IPH15PM-256",
    image_url: "https://picsum.photos/seed/iphone15/500/500",
    image_data: {
      size: 150000,
      type: "image/jpeg",
      width: 500,
      height: 500,
      uploaded_at: new Date().toISOString(),
    },
    status: "active",
    is_service: false,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 2,
    name: "Samsung Galaxy S24 Ultra",
    description: "Samsung Galaxy S24 Ultra 512GB Titan Gray",
    retail_price: 32000000,
    wholesale_price: 29000000,
    cost_price: 27000000,
    category_id: 1,
    stock_quantity: 12,
    min_stock_level: 4,
    barcode: "1234567890124",
    sku: "SGS24U-512",
    image_url: "https://picsum.photos/seed/samsung24/500/500",
    image_data: {
      size: 180000,
      type: "image/jpeg",
      width: 500,
      height: 500,
      uploaded_at: new Date().toISOString(),
    },
    status: "active",
    is_service: false,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 3,
    name: "MacBook Pro 16-inch",
    description: "MacBook Pro 16-inch M3 Pro 1TB Space Black",
    retail_price: 75000000,
    wholesale_price: 70000000,
    cost_price: 65000000,
    category_id: 2,
    stock_quantity: 8,
    min_stock_level: 2,
    barcode: "1234567890125",
    sku: "MBP16-M3-1TB",
    image_url: "https://picsum.photos/seed/macbook16/500/500",
    image_data: {
      size: 220000,
      type: "image/jpeg",
      width: 500,
      height: 500,
      uploaded_at: new Date().toISOString(),
    },
    status: "active",
    is_service: false,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 4,
    name: "Dell XPS 15",
    description: "Dell XPS 15 9530 Intel Core i7 1TB SSD",
    retail_price: 45000000,
    wholesale_price: 42000000,
    cost_price: 40000000,
    category_id: 2,
    stock_quantity: 6,
    min_stock_level: 2,
    barcode: "1234567890126",
    sku: "DXP15-I7-1TB",
    image_url: "https://picsum.photos/seed/dellxps15/500/500",
    image_data: {
      size: 190000,
      type: "image/jpeg",
      width: 500,
      height: 500,
      uploaded_at: new Date().toISOString(),
    },
    status: "active",
    is_service: false,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 5,
    name: "AirPods Pro 2",
    description: "AirPods Pro 2 với Active Noise Cancellation",
    retail_price: 7500000,
    wholesale_price: 6800000,
    cost_price: 6000000,
    category_id: 3,
    stock_quantity: 25,
    min_stock_level: 8,
    barcode: "1234567890127",
    sku: "APP2-ANC",
    image_url: "https://picsum.photos/seed/airpodspro/500/500",
    image_data: {
      size: 120000,
      type: "image/jpeg",
      width: 500,
      height: 500,
      uploaded_at: new Date().toISOString(),
    },
    status: "active",
    is_service: false,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 6,
    name: "iPad Pro 12.9-inch",
    description: "iPad Pro 12.9-inch M2 256GB Space Gray",
    retail_price: 28000000,
    wholesale_price: 26000000,
    cost_price: 24000000,
    category_id: 4,
    stock_quantity: 10,
    min_stock_level: 3,
    barcode: "1234567890128",
    sku: "IPP12-M2-256",
    image_url: "https://picsum.photos/seed/ipadpro/500/500",
    image_data: {
      size: 160000,
      type: "image/jpeg",
      width: 500,
      height: 500,
      uploaded_at: new Date().toISOString(),
    },
    status: "active",
    is_service: false,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 7,
    name: "Apple Watch Series 9",
    description: "Apple Watch Series 9 GPS 45mm Midnight",
    retail_price: 12000000,
    wholesale_price: 11000000,
    cost_price: 10000000,
    category_id: 5,
    stock_quantity: 18,
    min_stock_level: 6,
    barcode: "1234567890129",
    sku: "AW9-45MM",
    image_url: "https://picsum.photos/seed/applewatch/500/500",
    image_data: {
      size: 140000,
      type: "image/jpeg",
      width: 500,
      height: 500,
      uploaded_at: new Date().toISOString(),
    },
    status: "active",
    is_service: false,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 8,
    name: "Sony WH-1000XM5",
    description: "Sony WH-1000XM5 Wireless Noise Canceling Headphones",
    retail_price: 8500000,
    wholesale_price: 7800000,
    cost_price: 7200000,
    category_id: 3,
    stock_quantity: 15,
    min_stock_level: 5,
    barcode: "1234567890130",
    sku: "SWH1000XM5",
    image_url: "https://picsum.photos/seed/sonywh1000xm5/500/500",
    image_data: {
      size: 130000,
      type: "image/jpeg",
      width: 500,
      height: 500,
      uploaded_at: new Date().toISOString(),
    },
    status: "active",
    is_service: false,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 9,
    name: "Samsung Galaxy Tab S9",
    description: "Samsung Galaxy Tab S9 11-inch 128GB Graphite",
    retail_price: 18000000,
    wholesale_price: 16500000,
    cost_price: 15000000,
    category_id: 4,
    stock_quantity: 12,
    min_stock_level: 4,
    barcode: "1234567890131",
    sku: "SGT9-11-128",
    image_url: "https://picsum.photos/seed/samsungtab/500/500",
    image_data: {
      size: 170000,
      type: "image/jpeg",
      width: 500,
      height: 500,
      uploaded_at: new Date().toISOString(),
    },
    status: "active",
    is_service: false,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 10,
    name: "Garmin Fenix 7",
    description: "Garmin Fenix 7 Sapphire Solar GPS Watch",
    retail_price: 25000000,
    wholesale_price: 23000000,
    cost_price: 21000000,
    category_id: 5,
    stock_quantity: 8,
    min_stock_level: 2,
    barcode: "1234567890132",
    sku: "GF7-SAPPHIRE",
    image_url: "https://picsum.photos/seed/garminfenix/500/500",
    image_data: {
      size: 200000,
      type: "image/jpeg",
      width: 500,
      height: 500,
      uploaded_at: new Date().toISOString(),
    },
    status: "active",
    is_service: false,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 11,
    name: "iPhone 15",
    description: "iPhone 15 128GB Black",
    retail_price: 25000000,
    wholesale_price: 23000000,
    cost_price: 21000000,
    category_id: 1,
    stock_quantity: 20,
    min_stock_level: 7,
    barcode: "1234567890133",
    sku: "IPH15-128",
    image_url: "https://picsum.photos/seed/iphone15/500/500",
    image_data: {
      size: 145000,
      type: "image/jpeg",
      width: 500,
      height: 500,
      uploaded_at: new Date().toISOString(),
    },
    status: "active",
    is_service: false,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 12,
    name: "MacBook Air 15-inch",
    description: "MacBook Air 15-inch M2 256GB Midnight",
    retail_price: 45000000,
    wholesale_price: 42000000,
    cost_price: 40000000,
    category_id: 2,
    stock_quantity: 14,
    min_stock_level: 4,
    barcode: "1234567890134",
    sku: "MBA15-M2-256",
    image_url: "https://picsum.photos/seed/macbookair15/500/500",
    image_data: {
      size: 185000,
      type: "image/jpeg",
      width: 500,
      height: 500,
      uploaded_at: new Date().toISOString(),
    },
    status: "active",
    is_service: false,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 13,
    name: "Samsung Galaxy A55",
    description: "Samsung Galaxy A55 5G 128GB Awesome Black",
    retail_price: 12000000,
    wholesale_price: 11000000,
    cost_price: 10000000,
    category_id: 1,
    stock_quantity: 25,
    min_stock_level: 8,
    barcode: "1234567890135",
    sku: "SGA55-128",
    image_url: "https://picsum.photos/seed/samsunga55/500/500",
    image_data: {
      size: 135000,
      type: "image/jpeg",
      width: 500,
      height: 500,
      uploaded_at: new Date().toISOString(),
    },
    status: "active",
    is_service: false,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 14,
    name: "Lenovo ThinkPad X1 Carbon",
    description: "Lenovo ThinkPad X1 Carbon Gen 11 Intel Core i7 1TB",
    retail_price: 55000000,
    wholesale_price: 51000000,
    cost_price: 48000000,
    category_id: 2,
    stock_quantity: 6,
    min_stock_level: 2,
    barcode: "1234567890136",
    sku: "LTX1C-I7-1TB",
    image_url: "https://picsum.photos/seed/thinkpadx1/500/500",
    image_data: {
      size: 210000,
      type: "image/jpeg",
      width: 500,
      height: 500,
      uploaded_at: new Date().toISOString(),
    },
    status: "active",
    is_service: false,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 15,
    name: "Bose QuietComfort 45",
    description: "Bose QuietComfort 45 Wireless Headphones",
    retail_price: 7500000,
    wholesale_price: 6800000,
    cost_price: 6200000,
    category_id: 3,
    stock_quantity: 18,
    min_stock_level: 6,
    barcode: "1234567890137",
    sku: "BQC45-WH",
    image_url: "https://picsum.photos/seed/boseqc45/500/500",
    image_data: {
      size: 125000,
      type: "image/jpeg",
      width: 500,
      height: 500,
      uploaded_at: new Date().toISOString(),
    },
    status: "active",
    is_service: false,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 16,
    name: "iPad Air 5th Gen",
    description: "iPad Air 5th Gen 64GB Space Gray",
    retail_price: 18000000,
    wholesale_price: 16500000,
    cost_price: 15000000,
    category_id: 4,
    stock_quantity: 16,
    min_stock_level: 5,
    barcode: "1234567890138",
    sku: "IPA5-64GB",
    image_url: "https://picsum.photos/seed/ipadair/500/500",
    image_data: {
      size: 155000,
      type: "image/jpeg",
      width: 500,
      height: 500,
      uploaded_at: new Date().toISOString(),
    },
    status: "active",
    is_service: false,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 17,
    name: "Casio G-Shock",
    description: "Casio G-Shock GA-2100-1A1 Black",
    retail_price: 3500000,
    wholesale_price: 3200000,
    cost_price: 3000000,
    category_id: 5,
    stock_quantity: 30,
    min_stock_level: 10,
    barcode: "1234567890139",
    sku: "CGS-GA2100",
    image_url: "https://picsum.photos/seed/casiogshock/500/500",
    image_data: {
      size: 110000,
      type: "image/jpeg",
      width: 500,
      height: 500,
      uploaded_at: new Date().toISOString(),
    },
    status: "active",
    is_service: false,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 18,
    name: "Xiaomi 14 Ultra",
    description: "Xiaomi 14 Ultra 512GB Black",
    retail_price: 28000000,
    wholesale_price: 26000000,
    cost_price: 24000000,
    category_id: 1,
    stock_quantity: 12,
    min_stock_level: 4,
    barcode: "1234567890140",
    sku: "XM14U-512",
    image_url: "https://picsum.photos/seed/xiaomi14ultra/500/500",
    image_data: {
      size: 175000,
      type: "image/jpeg",
      width: 500,
      height: 500,
      uploaded_at: new Date().toISOString(),
    },
    status: "active",
    is_service: false,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 19,
    name: "HP Spectre x360",
    description: "HP Spectre x360 14 Intel Core i7 1TB SSD",
    retail_price: 48000000,
    wholesale_price: 45000000,
    cost_price: 42000000,
    category_id: 2,
    stock_quantity: 8,
    min_stock_level: 3,
    barcode: "1234567890141",
    sku: "HPSX360-I7-1TB",
    image_url: "https://picsum.photos/seed/hpspectre/500/500",
    image_data: {
      size: 195000,
      type: "image/jpeg",
      width: 500,
      height: 500,
      uploaded_at: new Date().toISOString(),
    },
    status: "active",
    is_service: false,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 20,
    name: "JBL Flip 6",
    description: "JBL Flip 6 Portable Bluetooth Speaker",
    retail_price: 3500000,
    wholesale_price: 3200000,
    cost_price: 3000000,
    category_id: 3,
    stock_quantity: 22,
    min_stock_level: 7,
    barcode: "1234567890142",
    sku: "JBL-FLIP6",
    image_url: "https://picsum.photos/seed/jblflip6/500/500",
    image_data: {
      size: 100000,
      type: "image/jpeg",
      width: 500,
      height: 500,
      uploaded_at: new Date().toISOString(),
    },
    status: "active",
    is_service: false,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 21,
    name: "Samsung Galaxy Tab A9",
    description: "Samsung Galaxy Tab A9 10.9-inch 64GB Gray",
    retail_price: 8000000,
    wholesale_price: 7300000,
    cost_price: 6800000,
    category_id: 4,
    stock_quantity: 20,
    min_stock_level: 6,
    barcode: "1234567890143",
    sku: "SGTA9-64GB",
    image_url: "https://picsum.photos/seed/samsungtaba9/500/500",
    image_data: {
      size: 140000,
      type: "image/jpeg",
      width: 500,
      height: 500,
      uploaded_at: new Date().toISOString(),
    },
    status: "active",
    is_service: false,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 22,
    name: "Seiko 5 Sports",
    description: "Seiko 5 Sports Automatic Watch SRPD55K1",
    retail_price: 5500000,
    wholesale_price: 5000000,
    cost_price: 4700000,
    category_id: 5,
    stock_quantity: 15,
    min_stock_level: 5,
    barcode: "1234567890144",
    sku: "S5S-SRPD55K1",
    image_url: "https://picsum.photos/seed/seiko5/500/500",
    image_data: {
      size: 120000,
      type: "image/jpeg",
      width: 500,
      height: 500,
      uploaded_at: new Date().toISOString(),
    },
    status: "active",
    is_service: false,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 23,
    name: "OnePlus 12",
    description: "OnePlus 12 256GB Black",
    retail_price: 22000000,
    wholesale_price: 20000000,
    cost_price: 18000000,
    category_id: 1,
    stock_quantity: 16,
    min_stock_level: 5,
    barcode: "1234567890145",
    sku: "OP12-256",
    image_url: "https://picsum.photos/seed/oneplus12/500/500",
    image_data: {
      size: 165000,
      type: "image/jpeg",
      width: 500,
      height: 500,
      uploaded_at: new Date().toISOString(),
    },
    status: "active",
    is_service: false,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 24,
    name: "ASUS ROG Zephyrus",
    description: "ASUS ROG Zephyrus G14 AMD Ryzen 9 1TB SSD",
    retail_price: 65000000,
    wholesale_price: 60000000,
    cost_price: 56000000,
    category_id: 2,
    stock_quantity: 4,
    min_stock_level: 1,
    barcode: "1234567890146",
    sku: "ARZ-G14-R9-1TB",
    image_url: "https://picsum.photos/seed/asusrog/500/500",
    image_data: {
      size: 230000,
      type: "image/jpeg",
      width: 500,
      height: 500,
      uploaded_at: new Date().toISOString(),
    },
    status: "active",
    is_service: false,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 25,
    name: "OPPO Find X6 Pro",
    description: "OPPO Find X6 Pro 256GB Black",
    retail_price: 26000000,
    wholesale_price: 24000000,
    cost_price: 22000000,
    category_id: 1,
    stock_quantity: 8,
    min_stock_level: 3,
    barcode: "1234567890147",
    sku: "OFX6P-256",
    image_url: "https://picsum.photos/seed/oppofindx6/500/500",
    image_data: {
      size: 170000,
      type: "image/jpeg",
      width: 500,
      height: 500,
      uploaded_at: new Date().toISOString(),
    },
    status: "active",
    is_service: false,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 26,
    name: "Acer Predator Helios 300",
    description: "Laptop gaming Acer Predator Helios 300",
    retail_price: 38000000,
    wholesale_price: 35000000,
    cost_price: 33000000,
    category_id: 2,
    stock_quantity: 4,
    min_stock_level: 1,
    barcode: "1234567890148",
    sku: "APH300-GAMING",
    image_url: "https://picsum.photos/seed/acerpredator/500/500",
    image_data: {
      size: 195000,
      type: "image/jpeg",
      width: 500,
      height: 500,
      uploaded_at: new Date().toISOString(),
    },
    status: "active",
    is_service: false,
    created_at: new Date(),
    updated_at: new Date(),
  },
]

// Update productIdCounter to reflect the new total number of products
let productIdCounter = 27 // Start from 27 since we now have 26 initial products

export const initialMockCustomers: Customer[] = [
  {
    id: 1,
    name: "Nguyễn Văn An",
    email: "nguyenvanan@email.com",
    phone: "0901234567",
    address: "123 Đường ABC, Quận 1, TP.HCM",
    date_of_birth: null,
    customer_type: "vip",
    total_spent: 45000000,
    total_orders: 15,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 2,
    name: "Trần Thị Bình",
    email: "tranthibinh@email.com",
    phone: "0907654321",
    address: "456 Đường DEF, Quận 2, TP.HCM",
    date_of_birth: null,
    customer_type: "regular",
    total_spent: 25000000,
    total_orders: 8,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 3,
    name: "Lê Văn Cường",
    email: "levancuong@email.com",
    phone: "0912345678",
    address: "789 Đường GHI, Quận 3, TP.HCM",
    date_of_birth: null,
    customer_type: "vip",
    total_spent: 67000000,
    total_orders: 22,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 4,
    name: "Phạm Thị Dung",
    email: "phamthidung@email.com",
    phone: "0987654321",
    address: "321 Đường JKL, Quận 4, TP.HCM",
    date_of_birth: null,
    customer_type: "new",
    total_spent: 8000000,
    total_orders: 3,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 5,
    name: "Hoàng Văn Em",
    email: "hoangvanem@email.com",
    phone: "0934567890",
    address: "654 Đường MNO, Quận 5, TP.HCM",
    date_of_birth: null,
    customer_type: "regular",
    total_spent: 18000000,
    total_orders: 6,
    created_at: new Date(),
    updated_at: new Date(),
  },
]

export const initialMockCategories: Category[] = [
  { id: 1, name: "Điện thoại", description: "Các loại điện thoại di động", created_at: new Date(), updated_at: new Date() },
  { id: 2, name: "Laptop", description: "Máy tính xách tay", created_at: new Date(), updated_at: new Date() },
  { id: 3, name: "Phụ kiện", description: "Phụ kiện điện tử", created_at: new Date(), updated_at: new Date() },
  { id: 4, name: "Tablet", description: "Máy tính bảng", created_at: new Date(), updated_at: new Date() },
  { id: 5, name: "Đồng hồ", description: "Đồng hồ thông minh", created_at: new Date(), updated_at: new Date() },
]

// In-memory storage for mock data
let mockProductsData: Product[] = [...initialMockProducts]
let mockCustomersData: Customer[] = [...initialMockCustomers]
let mockOrdersData: Order[] = []
let mockCategoriesData: Category[] = [...initialMockCategories]
let customerIdCounter = 6 // Start from 6 since we have 5 initial customers
let orderIdCounter = 1
let categoryIdCounter = 6 // Start from 6 for categories

// Product operations
export function getMockProducts(): Product[] {
  return mockProductsData.filter((p) => p.status === "active")
}

export function getMockProductById(id: number): Product | null {
  return mockProductsData.find((p) => p.id === id) || null
}

export function createMockProduct(product: Omit<Product, "id" | "created_at" | "updated_at">): Product {
  const newProduct: Product = {
    ...product,
    id: productIdCounter++,
    created_at: new Date(),
    updated_at: new Date(),
  }
  mockProductsData.push(newProduct)
  return newProduct
}

export function updateMockProduct(id: number, updates: Partial<Product>): Product | null {
  const productIndex = mockProductsData.findIndex((p) => p.id === id)
  if (productIndex === -1) return null

  mockProductsData[productIndex] = {
    ...mockProductsData[productIndex],
    ...updates,
    updated_at: new Date(),
  }
  return mockProductsData[productIndex]
}

export function deleteMockProduct(id: number): boolean {
  const productIndex = mockProductsData.findIndex((p) => p.id === id)
  if (productIndex === -1) return false

  mockProductsData[productIndex] = {
    ...mockProductsData[productIndex],
    status: "inactive" as const,
    updated_at: new Date(),
  }
  return true
}

export function updateMockProductStock(id: number, newStock: number): boolean {
  const productIndex = mockProductsData.findIndex((p) => p.id === id)
  if (productIndex !== -1) {
      mockProductsData[productIndex] = {
    ...mockProductsData[productIndex],
    stock_quantity: newStock,
    updated_at: new Date(),
  }
    return true
  }
  return false
}

// Customer operations
export function getMockCustomers(): Customer[] {
  return mockCustomersData
}

export function getMockCustomerById(id: number): Customer | null {
  return mockCustomersData.find((c) => c.id === id) || null
}

export function createMockCustomer(
  customer: Omit<Customer, "id" | "created_at" | "updated_at" | "total_spent" | "total_orders">,
): Customer {
  const newCustomer: Customer = {
    ...customer,
    id: customerIdCounter++,
    total_spent: 0,
    total_orders: 0,
    created_at: new Date(),
    updated_at: new Date(),
  }
  mockCustomersData.push(newCustomer)
  return newCustomer
}

export function updateMockCustomer(id: number, updates: Partial<Customer>): Customer | null {
  const customerIndex = mockCustomersData.findIndex((c) => c.id === id)
  if (customerIndex === -1) return null

  mockCustomersData[customerIndex] = {
    ...mockCustomersData[customerIndex],
    ...updates,
    updated_at: new Date(),
  }
  return mockCustomersData[customerIndex]
}

export function deleteMockCustomer(id: number): boolean {
  const initialLength = mockCustomersData.length
  mockCustomersData = mockCustomersData.filter((c) => c.id !== id)
  return mockCustomersData.length < initialLength
}

// Order operations
export function getMockOrders(): Order[] {
  return mockOrdersData
}

export function createMockOrder(
  customerId: number | null,
  cartItems: CartItem[],
  paymentMethod: string,
  discountAmount: number,
  taxRate: number,
): Order {
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const taxAmount = subtotal * taxRate
  const totalAmount = subtotal + taxAmount - discountAmount

  const order: Order = {
    id: orderIdCounter++,
    customer_id: customerId,
    order_number: `ORD-${Date.now()}`,
    subtotal,
    tax_amount: taxAmount,
    discount_amount: discountAmount,
    total_amount: totalAmount,
    payment_method: paymentMethod,
    payment_status: "completed" as const,
    order_status: "completed" as const,
    refund_amount: null,
    notes: null,
    created_at: new Date(),
    updated_at: new Date(),
    order_items: cartItems.map((item, index) => ({
      id: index + 1,
      order_id: orderIdCounter - 1,
      product_id: item.id,
      product_name: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.price * item.quantity,
      returned_quantity: 0,
      cost_price: 0,
      is_service: false,
      created_at: new Date(),
    })),
  }

  mockOrdersData.push(order)

  // Update product stock
  cartItems.forEach((item) => {
    updateMockProductStock(item.id, item.stock_quantity - item.quantity)
  })

  // Update customer stats if customer exists
  if (customerId) {
    const customerIndex = mockCustomersData.findIndex((c) => c.id === customerId)
    if (customerIndex !== -1) {
      const customer = mockCustomersData[customerIndex]
      const newTotalSpent = (customer.total_spent || 0) + totalAmount
      const newTotalOrders = (customer.total_orders || 0) + 1

      let customerType: "new" | "regular" | "vip" = "regular"
      if (newTotalSpent >= 50000000) {
        customerType = "vip"
      } else if (newTotalOrders === 1) {
        customerType = "new"
      }

      mockCustomersData[customerIndex] = {
        ...customer,
        total_spent: newTotalSpent,
        total_orders: newTotalOrders,
        customer_type: customerType,
        updated_at: new Date(),
      }
    }
  }

  return order
}

export function getMockTodayStats(): { totalSales: number; totalOrders: number; averageOrderValue: number } {
  return {
    totalSales: 35000000,
    totalOrders: 15,
    averageOrderValue: 2333333,
  }
}

export function getMockMonthlyStats(): { totalSales: number; totalOrders: number; averageOrderValue: number } {
  return {
    totalSales: 1250000000,
    totalOrders: 250,
    averageOrderValue: 5000000,
  }
}

// Category operations
export function getMockCategories(): Category[] {
  return mockCategoriesData
}

export function createMockCategory(name: string): Category {
  const newCategory: Category = {
    id: categoryIdCounter++,
    name,
    description: null,
    created_at: new Date(),
    updated_at: new Date(),
  }
  mockCategoriesData.push(newCategory)
  return newCategory
}

export function updateMockCategory(id: number, name: string): Category | null {
  const categoryIndex = mockCategoriesData.findIndex((c) => c.id === id)
  if (categoryIndex === -1) return null

  mockCategoriesData[categoryIndex] = {
    ...mockCategoriesData[categoryIndex],
    name,
    updated_at: new Date(),
  }
  return mockCategoriesData[categoryIndex]
}

export function deleteMockCategory(id: number): boolean {
  const initialLength = mockCategoriesData.length
  mockCategoriesData = mockCategoriesData.filter((c) => c.id !== id)
  return mockCategoriesData.length < initialLength
}

export function getMockSalesData(): Array<{ sale_date: string; total_sales: number }> {
  return [
    { sale_date: "2023-01-01", total_sales: 1200 },
    { sale_date: "2023-01-02", total_sales: 1500 },
    { sale_date: "2023-01-03", total_sales: 1000 },
    { sale_date: "2023-01-04", total_sales: 1800 },
    { sale_date: "2023-01-05", total_sales: 1300 },
    { sale_date: "2023-01-06", total_sales: 2000 },
    { sale_date: "2023-01-07", total_sales: 1700 },
  ]
}

export function getMockTopProducts(): Array<{
  product_name: string
  total_quantity_sold: number
  total_sales_amount: number
}> {
  return [
    { product_name: "Laptop Gaming XYZ", total_quantity_sold: 15, total_sales_amount: 250000000 },
    { product_name: "Điện thoại ABC", total_quantity_sold: 30, total_sales_amount: 150000000 },
    { product_name: "Tai nghe Bluetooth", total_quantity_sold: 50, total_sales_amount: 50000000 },
    { product_name: "Bàn phím cơ", total_quantity_sold: 25, total_sales_amount: 30000000 },
    { product_name: "Chuột không dây", total_quantity_sold: 40, total_sales_amount: 20000000 },
  ]
}

export function getMockCustomerSpending() {
  return [
    { customer_name: "Nguyễn Văn A", total_orders: 5, total_spent: 300000000 },
    { customer_name: "Trần Thị B", total_orders: 3, total_spent: 180000000 },
    { customer_name: "Lê Văn C", total_orders: 7, total_spent: 120000000 },
    { customer_name: "Phạm Thị D", total_orders: 2, total_spent: 90000000 },
    { customer_name: "Hoàng Văn E", total_orders: 4, total_spent: 75000000 },
    { customer_name: "Khách lẻ", total_orders: 10, total_spent: 50000000 },
  ]
}

export function getMockSalesSummary() {
  return {
    totalSales: 1250000000,
    totalOrders: 250,
    averageOrderValue: 5000000,
    totalRefunds: 15000000,
  }
}

export function getMockSalesByPaymentMethod() {
  return [
    { payment_method: "Tiền mặt", total_amount: 600000000 },
    { payment_method: "Chuyển khoản", total_amount: 400000000 },
    { payment_method: "Thẻ tín dụng", total_amount: 200000000 },
    { payment_method: "Ví điện tử", total_amount: 50000000 },
  ]
}

export function getMockSalesTrend() {
  return [
    { date: "2024-06-20", total_sales: 15000000 },
    { date: "2024-06-21", total_sales: 22000000 },
    { date: "2024-06-22", total_sales: 18000000 },
    { date: "2024-06-23", total_sales: 25000000 },
    { date: "2024-06-24", total_sales: 30000000 },
    { date: "2024-06-25", total_sales: 28000000 },
    { date: "2024-06-26", total_sales: 35000000 },
  ]
}

// Reset function for testing
export function resetMockData(): void {
  mockProductsData = [...initialMockProducts]
  mockCustomersData = [...initialMockCustomers]
  mockOrdersData = []
  mockCategoriesData = [...initialMockCategories]
  productIdCounter = 27
  customerIdCounter = 6
  orderIdCounter = 1
  categoryIdCounter = 6
}
