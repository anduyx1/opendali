import { getMysqlClient } from "@/lib/mysql/client"

async function testBalanceInventory() {
  const connection = await getMysqlClient()

  try {
    console.log("=== TEST CÂN BẰNG KHO ===")

    // 1. Kiểm tra bảng products
    console.log("\n1. Kiểm tra bảng products:")
    const [products] = (await connection.execute("SELECT id, name, sku, stock_quantity FROM products LIMIT 5")) as any[]
    console.log("Products:", products)

    // 2. Kiểm tra bảng inventory_check_sessions
    console.log("\n2. Kiểm tra phiếu kiểm hàng:")
    const [sessions] = (await connection.execute(
      "SELECT * FROM inventory_check_sessions ORDER BY created_at DESC LIMIT 3",
    )) as any[]
    console.log("Sessions:", sessions)

    // 3. Kiểm tra bảng inventory_check_items
    console.log("\n3. Kiểm tra items trong phiếu kiểm:")
    const [items] = (await connection.execute(
      "SELECT * FROM inventory_check_items ORDER BY created_at DESC LIMIT 5",
    )) as any[]
    console.log("Items:", items)

    // 4. Test cập nhật trực tiếp stock_quantity
    if (products.length > 0) {
      const testProduct = products[0]
      const newStock = 999

      console.log(`\n4. Test cập nhật stock_quantity cho product ${testProduct.id}:`)
      console.log(`Stock hiện tại: ${testProduct.stock_quantity}`)
      console.log(`Cập nhật thành: ${newStock}`)

      const [updateResult] = (await connection.execute("UPDATE products SET stock_quantity = ? WHERE id = ?", [
        newStock,
        testProduct.id,
      ])) as any[]

      console.log("Update result:", updateResult)

      // Kiểm tra kết quả
      const [updatedProduct] = (await connection.execute("SELECT id, name, stock_quantity FROM products WHERE id = ?", [
        testProduct.id,
      ])) as any[]

      console.log("Product sau khi cập nhật:", updatedProduct[0])

      // Khôi phục lại giá trị cũ
      await connection.execute("UPDATE products SET stock_quantity = ? WHERE id = ?", [
        testProduct.stock_quantity,
        testProduct.id,
      ])
      console.log("Đã khôi phục lại giá trị cũ")
    }
  } catch (error) {
    console.error("Lỗi test:", error)
  } finally {
    await connection.end()
  }
}

testBalanceInventory()
