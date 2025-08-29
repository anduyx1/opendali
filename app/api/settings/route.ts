import { NextResponse } from "next/server"
import mysql from "@/lib/mysql"
import type { RowDataPacket } from "mysql2"

interface SettingRow extends RowDataPacket {
  key: string
  value: string
}

export async function GET() {
  try {
    const connection = await mysql.getConnection()

    const [rows] = await connection.execute(`
      SELECT 
        \`key\`,
        value
      FROM settings
    `)

    connection.release()

    const settings: Record<string, string> = {}
    ;(rows as SettingRow[]).forEach((row) => {
      settings[row.key] = row.value
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Failed to fetch settings:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}
