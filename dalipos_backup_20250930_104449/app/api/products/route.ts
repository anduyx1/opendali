import { NextResponse } from "next/server"
import mysql from "@/lib/mysql"

export async function GET() {
  try {
    const connection = await mysql.getConnection()

    const [rows] = await connection.execute(`
      SELECT 
        id,
        name,
        retail_price,
        wholesale_price,
        cost_price,
        stock_quantity,
        barcode,
        sku,
        status,
        created_at,
        updated_at
      FROM products 
      WHERE status = 'active'
      ORDER BY name ASC
    `)

    connection.release()

    return NextResponse.json(rows)
  } catch (error) {
    console.error("Failed to fetch products:", error)
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
  }
}
