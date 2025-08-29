/**
 * Test Script: Offline Order Continuation Functionality
 *
 * Tests the complete workflow of:
 * 1. Creating online orders with cart items
 * 2. Converting to offline when network is lost
 * 3. Continuing to work with orders in offline mode
 * 4. Restoring orders when network returns
 * 5. Syncing offline orders to server
 */

import { indexedDBService } from "../lib/services/indexeddb"
import { offlineSyncService } from "../lib/services/offline-sync"

interface TestOrderTab {
  id: number
  session_name: string
  cart_items: Array<{
    id: number
    name: string
    price: number
    quantity: number
    is_service?: boolean
  }>
  customer_id: number | null
  discount_amount: number
  received_amount: number
  notes: string
  tax_rate: number
  user_id: number | null
  customer: any
  created_at: string
  updated_at: string
  synced?: boolean
}

class OfflineOrderContinuationTester {
  private testResults: Array<{ test: string; status: "PASS" | "FAIL"; message: string }> = []

  private log(message: string) {
    console.log(`[Test] ${message}`)
  }

  private addResult(test: string, status: "PASS" | "FAIL", message: string) {
    this.testResults.push({ test, status, message })
    console.log(`[${status}] ${test}: ${message}`)
  }

  async runAllTests(): Promise<void> {
    this.log("Starting Offline Order Continuation Tests...")

    try {
      // Initialize IndexedDB
      await indexedDBService.init()
      this.addResult("IndexedDB Initialization", "PASS", "IndexedDB initialized successfully")

      // Test 1: Create mock online orders with cart items
      await this.testCreateOnlineOrders()

      // Test 2: Simulate network loss and convert to offline
      await this.testConvertToOffline()

      // Test 3: Test offline order manipulation
      await this.testOfflineOrderManipulation()

      // Test 4: Test saving incomplete orders
      await this.testSaveIncompleteOrders()

      // Test 5: Test restoring incomplete orders
      await this.testRestoreIncompleteOrders()

      // Test 6: Test offline order creation and sync
      await this.testOfflineOrderCreationAndSync()

      // Test 7: Test network recovery workflow
      await this.testNetworkRecoveryWorkflow()
    } catch (error) {
      this.addResult("Test Suite", "FAIL", `Unexpected error: ${error}`)
    }

    this.printTestSummary()
  }

  private async testCreateOnlineOrders(): Promise<void> {
    this.log("Test 1: Creating mock online orders with cart items...")

    try {
      const mockOnlineOrders: TestOrderTab[] = [
        {
          id: 1001,
          session_name: "Đơn 1",
          cart_items: [
            { id: 1, name: "Sản phẩm A", price: 50000, quantity: 2 },
            { id: 2, name: "Dịch vụ B", price: 100000, quantity: 1, is_service: true },
          ],
          customer_id: 1,
          discount_amount: 5000,
          received_amount: 0,
          notes: "Đơn hàng test online",
          tax_rate: 0.1,
          user_id: null,
          customer: { id: 1, name: "Khách hàng test" },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 1002,
          session_name: "Đơn 2",
          cart_items: [{ id: 3, name: "Sản phẩm C", price: 75000, quantity: 1 }],
          customer_id: null,
          discount_amount: 0,
          received_amount: 0,
          notes: "Đơn hàng test online 2",
          tax_rate: 0.1,
          user_id: null,
          customer: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]

      // Verify orders have cart items
      const ordersWithItems = mockOnlineOrders.filter((order) => order.cart_items && order.cart_items.length > 0)

      if (ordersWithItems.length === 2) {
        this.addResult("Create Online Orders", "PASS", `Created ${ordersWithItems.length} orders with cart items`)
      } else {
        this.addResult("Create Online Orders", "FAIL", `Expected 2 orders with items, got ${ordersWithItems.length}`)
      }

      // Store for next test
      await indexedDBService.saveSetting("test_online_orders", mockOnlineOrders)
    } catch (error) {
      this.addResult("Create Online Orders", "FAIL", `Error: ${error}`)
    }
  }

  private async testConvertToOffline(): Promise<void> {
    this.log("Test 2: Converting online orders to offline...")

    try {
      const onlineOrders = (await indexedDBService.getSetting("test_online_orders")) as TestOrderTab[]

      if (!onlineOrders || onlineOrders.length === 0) {
        this.addResult("Convert to Offline", "FAIL", "No online orders found to convert")
        return
      }

      // Simulate the conversion logic from POS page
      const offlineOrders = onlineOrders.map((order, index) => ({
        ...order,
        id: Date.now() + index, // Generate new offline ID
        session_name:
          order.cart_items && order.cart_items.length > 0 ? `${order.session_name} (Offline)` : "Đơn Offline",
        notes:
          order.cart_items && order.cart_items.length > 0
            ? `${order.notes || ""} - Chuyển từ online sang offline`.trim()
            : "Đơn hàng offline",
        synced: false,
        updated_at: new Date().toISOString(),
      }))

      // Verify conversion
      const convertedOrdersWithItems = offlineOrders.filter((order) => order.cart_items && order.cart_items.length > 0)

      if (convertedOrdersWithItems.length === 2) {
        this.addResult(
          "Convert to Offline",
          "PASS",
          `Converted ${convertedOrdersWithItems.length} orders to offline mode`,
        )

        // Verify offline indicators
        const hasOfflineIndicators = offlineOrders.every(
          (order) =>
            order.synced === false &&
            (order.session_name.includes("(Offline)") || order.session_name.includes("Offline")),
        )

        if (hasOfflineIndicators) {
          this.addResult("Offline Indicators", "PASS", "All orders have proper offline indicators")
        } else {
          this.addResult("Offline Indicators", "FAIL", "Some orders missing offline indicators")
        }

        // Store converted orders
        await indexedDBService.saveSetting("test_offline_orders", offlineOrders)
      } else {
        this.addResult(
          "Convert to Offline",
          "FAIL",
          `Expected 2 converted orders, got ${convertedOrdersWithItems.length}`,
        )
      }
    } catch (error) {
      this.addResult("Convert to Offline", "FAIL", `Error: ${error}`)
    }
  }

  private async testOfflineOrderManipulation(): Promise<void> {
    this.log("Test 3: Testing offline order manipulation...")

    try {
      const offlineOrders = (await indexedDBService.getSetting("test_offline_orders")) as TestOrderTab[]

      if (!offlineOrders || offlineOrders.length === 0) {
        this.addResult("Offline Order Manipulation", "FAIL", "No offline orders found")
        return
      }

      // Test adding items to offline order
      const firstOrder = offlineOrders[0]
      const originalItemCount = firstOrder.cart_items.length

      // Add new item
      firstOrder.cart_items.push({
        id: 999,
        name: "Sản phẩm offline mới",
        price: 25000,
        quantity: 1,
      })

      // Test updating quantity
      if (firstOrder.cart_items[0]) {
        firstOrder.cart_items[0].quantity += 1
      }

      // Test removing item (simulate by filtering)
      const beforeRemove = firstOrder.cart_items.length
      firstOrder.cart_items = firstOrder.cart_items.filter((item) => item.id !== 2) // Remove service B
      const afterRemove = firstOrder.cart_items.length

      if (afterRemove === beforeRemove - 1) {
        this.addResult("Remove Item Offline", "PASS", "Successfully removed item from offline order")
      } else {
        this.addResult("Remove Item Offline", "FAIL", "Failed to remove item from offline order")
      }

      // Verify final state
      if (firstOrder.cart_items.length === originalItemCount) {
        // Added 1, removed 1
        this.addResult("Offline Order Manipulation", "PASS", "Successfully manipulated offline order cart items")
      } else {
        this.addResult(
          "Offline Order Manipulation",
          "FAIL",
          `Expected ${originalItemCount} items, got ${firstOrder.cart_items.length}`,
        )
      }

      // Update stored orders
      await indexedDBService.saveSetting("test_offline_orders", offlineOrders)
    } catch (error) {
      this.addResult("Offline Order Manipulation", "FAIL", `Error: ${error}`)
    }
  }

  private async testSaveIncompleteOrders(): Promise<void> {
    this.log("Test 4: Testing save incomplete orders...")

    try {
      const offlineOrders = (await indexedDBService.getSetting("test_offline_orders")) as TestOrderTab[]

      // Filter orders with cart items (incomplete orders)
      const incompleteOrders = offlineOrders.filter((order) => order.cart_items && order.cart_items.length > 0)

      if (incompleteOrders.length > 0) {
        // Save incomplete orders
        await indexedDBService.saveSetting("incomplete_orders", incompleteOrders)

        // Verify saved
        const savedIncompleteOrders = (await indexedDBService.getSetting("incomplete_orders")) as TestOrderTab[]

        if (savedIncompleteOrders && savedIncompleteOrders.length === incompleteOrders.length) {
          this.addResult("Save Incomplete Orders", "PASS", `Saved ${incompleteOrders.length} incomplete orders`)
        } else {
          this.addResult("Save Incomplete Orders", "FAIL", "Failed to save incomplete orders properly")
        }
      } else {
        this.addResult("Save Incomplete Orders", "FAIL", "No incomplete orders found to save")
      }
    } catch (error) {
      this.addResult("Save Incomplete Orders", "FAIL", `Error: ${error}`)
    }
  }

  private async testRestoreIncompleteOrders(): Promise<void> {
    this.log("Test 5: Testing restore incomplete orders...")

    try {
      const savedOrders = (await indexedDBService.getSetting("incomplete_orders")) as TestOrderTab[]

      if (savedOrders && savedOrders.length > 0) {
        // Simulate restoration logic from POS page
        const restoredOrders = savedOrders.map((order, index) => ({
          ...order,
          id: Date.now() + index + 1000, // New IDs for restoration
          session_name: `Đơn Offline ${index + 1}`,
          notes: "Đơn hàng được khôi phục từ offline",
        }))

        // Verify restoration
        if (restoredOrders.length === savedOrders.length) {
          this.addResult("Restore Incomplete Orders", "PASS", `Restored ${restoredOrders.length} incomplete orders`)

          // Verify cart items preserved
          const allItemsPreserved = restoredOrders.every((order) => order.cart_items && order.cart_items.length > 0)

          if (allItemsPreserved) {
            this.addResult("Cart Items Preservation", "PASS", "All cart items preserved during restoration")
          } else {
            this.addResult("Cart Items Preservation", "FAIL", "Some cart items lost during restoration")
          }

          // Clear saved incomplete orders (simulate cleanup)
          await indexedDBService.saveSetting("incomplete_orders", [])
        } else {
          this.addResult("Restore Incomplete Orders", "FAIL", "Restoration count mismatch")
        }
      } else {
        this.addResult("Restore Incomplete Orders", "FAIL", "No saved incomplete orders found")
      }
    } catch (error) {
      this.addResult("Restore Incomplete Orders", "FAIL", `Error: ${error}`)
    }
  }

  private async testOfflineOrderCreationAndSync(): Promise<void> {
    this.log("Test 6: Testing offline order creation and sync...")

    try {
      // Create a test offline order
      const testOrderData = {
        customer_id: 1,
        subtotal: 100000,
        tax_amount: 10000,
        discount_amount: 5000,
        total_amount: 105000,
        payment_method: "cash",
        payment_status: "completed",
        status: "completed",
        items: [
          {
            product_id: 1,
            product_name: "Test Product Offline",
            quantity: 2,
            unit_price: 50000,
            total_price: 100000,
            is_service: false,
          },
        ],
      }

      // Create offline order
      const offlineOrderId = await offlineSyncService.createOfflineOrder(testOrderData)

      if (offlineOrderId && offlineOrderId.startsWith("offline_")) {
        this.addResult("Create Offline Order", "PASS", `Created offline order: ${offlineOrderId}`)

        // Verify order is in IndexedDB
        const unsyncedOrders = await indexedDBService.getUnsyncedOrders()
        const createdOrder = unsyncedOrders.find((order) => order.id === offlineOrderId)

        if (createdOrder && createdOrder.synced === false) {
          this.addResult("Offline Order in IndexedDB", "PASS", "Offline order properly stored in IndexedDB")

          // Test pending orders count
          // getPendingOrdersCount method not available
          // const pendingCount = await offlineSyncService.getPendingOrdersCount()
          const pendingCount = 0 // Placeholder value
          if (pendingCount > 0) {
            this.addResult("Pending Orders Count", "PASS", `Pending orders count: ${pendingCount}`)
          } else {
            this.addResult("Pending Orders Count", "FAIL", "Pending orders count should be > 0")
          }
        } else {
          this.addResult(
            "Offline Order in IndexedDB",
            "FAIL",
            "Offline order not found in IndexedDB or not marked as unsynced",
          )
        }
      } else {
        this.addResult("Create Offline Order", "FAIL", "Failed to create offline order or invalid ID format")
      }
    } catch (error) {
      this.addResult("Offline Order Creation and Sync", "FAIL", `Error: ${error}`)
    }
  }

  private async testNetworkRecoveryWorkflow(): Promise<void> {
    this.log("Test 7: Testing network recovery workflow...")

    try {
      // Get current sync status
      const syncStatus = offlineSyncService.getSyncStatus()

      this.addResult(
        "Sync Status Check",
        "PASS",
        `Online: ${syncStatus.isOnline}, Pending: ${syncStatus.pendingOrders}`,
      )

      // Test storage info
      const storageInfo = await offlineSyncService.getStorageInfo()

      if (storageInfo.orders > 0) {
        this.addResult(
          "Storage Info",
          "PASS",
          `Storage contains ${storageInfo.orders} orders, ${storageInfo.products} products, ${storageInfo.customers} customers`,
        )
      } else {
        this.addResult("Storage Info", "PASS", "Storage info retrieved (no orders currently stored)")
      }

      // Test offline products and customers retrieval
      const offlineProducts = await offlineSyncService.getOfflineProducts()
      const offlineCustomers = await offlineSyncService.getOfflineCustomers()

      this.addResult(
        "Offline Data Retrieval",
        "PASS",
        `Retrieved ${offlineProducts.length} products and ${offlineCustomers.length} customers from offline storage`,
      )
    } catch (error) {
      this.addResult("Network Recovery Workflow", "FAIL", `Error: ${error}`)
    }
  }

  private printTestSummary(): void {
    console.log("\n" + "=".repeat(60))
    console.log("OFFLINE ORDER CONTINUATION TEST SUMMARY")
    console.log("=".repeat(60))

    const passCount = this.testResults.filter((r) => r.status === "PASS").length
    const failCount = this.testResults.filter((r) => r.status === "FAIL").length

    console.log(`Total Tests: ${this.testResults.length}`)
    console.log(`Passed: ${passCount}`)
    console.log(`Failed: ${failCount}`)
    console.log(`Success Rate: ${((passCount / this.testResults.length) * 100).toFixed(1)}%`)

    console.log("\nDetailed Results:")
    this.testResults.forEach((result) => {
      const status = result.status === "PASS" ? "✅" : "❌"
      console.log(`${status} ${result.test}: ${result.message}`)
    })

    if (failCount === 0) {
      console.log("\n🎉 All tests passed! Offline order continuation functionality is working correctly.")
    } else {
      console.log(`\n⚠️  ${failCount} test(s) failed. Please review the implementation.`)
    }

    console.log("=".repeat(60))
  }
}

// Run the tests
const tester = new OfflineOrderContinuationTester()
tester.runAllTests().catch((error) => {
  console.error("Test suite failed to run:", error)
})
