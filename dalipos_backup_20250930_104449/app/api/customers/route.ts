import { NextResponse } from "next/server"
import mysql from "@/lib/mysql"

export async function GET() {
  try {
    const connection = await mysql.getConnection()

    const [rows] = await connection.execute(`
      SELECT 
        id,
        name,
        phone,
        email,
        address,
        created_at,
        updated_at
      FROM customers 
      ORDER BY name ASC
    `)

    connection.release()

    return NextResponse.json(rows)
  } catch (error) {
    console.error("Failed to fetch customers:", error)
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 })
  }
}
