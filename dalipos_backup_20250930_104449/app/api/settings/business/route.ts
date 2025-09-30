import { type NextRequest, NextResponse } from "next/server"
import { getDbConnection } from "@/lib/mysql/client"
import type { RowDataPacket } from "mysql2"

interface BusinessSettingRow extends RowDataPacket {
  setting_key: string
  setting_value: string
}

interface BusinessSettings {
  businessName: string
  businessAddress: string
  businessPhone: string
  businessEmail: string
  businessWebsite: string
  businessTaxId: string
  businessLogo: string
  currency: string
  taxRate: number
  enableTax: boolean
  enableDiscount: boolean
  enableCustomerInfo: boolean
  receiptFooter: string
}

export async function GET() {
  try {
    const connection = await getDbConnection()

    const [rows] = await connection.execute(`
      SELECT setting_key, setting_value 
      FROM business_settings
    `)

    connection.release()

    const settings: BusinessSettings = {
      businessName: "",
      businessAddress: "",
      businessPhone: "",
      businessEmail: "",
      businessWebsite: "",
      businessTaxId: "",
      businessLogo: "",
      currency: "VND",
      taxRate: 10,
      enableTax: true,
      enableDiscount: true,
      enableCustomerInfo: true,
      receiptFooter: "Cảm ơn quý khách đã mua hàng!",
    }
    ;(rows as BusinessSettingRow[]).forEach((row) => {
      const key = row.setting_key as keyof BusinessSettings
      let value: string | number | boolean = row.setting_value

      // Parse boolean and number values
      if (value === "true") value = true
      else if (value === "false") value = false
      else if (!isNaN(Number(value)) && value !== "") value = Number(value)

      if (key in settings) {
        ;(settings as any)[key] = value
      }
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Failed to fetch business settings:", error)
    return NextResponse.json({ error: "Failed to fetch business settings" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const settings = await request.json()
    const connection = await getDbConnection()

    // Create table if not exists
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS business_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(255) UNIQUE NOT NULL,
        setting_value TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)

    // Update or insert each setting
    for (const [key, value] of Object.entries(settings)) {
      await connection.execute(
        `
        INSERT INTO business_settings (setting_key, setting_value)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
      `,
        [key, String(value)],
      )
    }

    connection.release()

    return NextResponse.json({
      success: true,
      message: "Business settings saved successfully",
    })
  } catch (error) {
    console.error("Failed to save business settings:", error)
    return NextResponse.json({ error: "Failed to save business settings" }, { status: 500 })
  }
}
