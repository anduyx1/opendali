import { getMysqlClient } from "@/lib/mysql/client"

async function debugInventoryBalance() {
  const connection = await getMysqlClient()

  try {
    console.log("=== DEBUG INVENTORY BALANCE ===")

    // 1. Kiểm tra dữ liệu trong inventory_check_items
    console.log("\n1. Checking inventory_check_items:")
    const [items] = await connection.execute(`
      SELECT ici.*, p.name as product_name, p.stock_quantity as current_stock
      FROM inventory_check_items ici
      JOIN products p ON ici.product_id = p.id
      WHERE ici.actual_quantity IS NOT NULL
      ORDER BY ici.id DESC
      LIMIT 5
    `)
    console.table(items)

    // 2. Test cập nhật trực tiếp stock_quantity
    console.log("\n2. Testing direct stock_quantity update:")
    const testProductId = 123 // ID từ ảnh
    const testActualQuantity = 23 // Số lượng từ ảnh

    // Lấy stock_quantity hiện tại
    const [beforeUpdate] = await connection.execute("SELECT id, name, stock_quantity FROM products WHERE id = ?", [
      testProductId,
    ])
    console.log("Before update:", beforeUpdate)

    // Cập nhật stock_quantity
    const [updateResult] = await connection.execute("UPDATE products SET stock_quantity = ? WHERE id = ?", [
      testActualQuantity,
      testProductId,
    ])
    console.log("Update result:", updateResult)

    // Kiểm tra sau khi cập nhật
    const [afterUpdate] = await connection.execute("SELECT id, name, stock_quantity FROM products WHERE id = ?", [
      testProductId,
    ])
    console.log("After update:", afterUpdate)

    console.log("\n=== DEBUG COMPLETED ===")
  } catch (error) {
    console.error("Debug error:", error)
  } finally {
    await connection.end()
  }
}

// Chạy debug
debugInventoryBalance()
