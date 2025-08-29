"use server"

import { dbPool } from "@/lib/mysql/client"
import type { InvoiceSettings, Settings } from "@/lib/types/database"
import type { ResultSetHeader, RowDataPacket } from "mysql2"
import { revalidatePath } from "next/cache"

interface TaxRateRow extends RowDataPacket {
  tax_rate: string
}

interface InvoiceSettingsRow extends RowDataPacket {
  id: number
  business_name: string | null
  business_address: string | null
  business_phone: string | null
  business_email: string | null
  business_website: string | null
  business_tax_id: string | null
  logo_url: string | null
  default_template: string | null
  show_notes: number
  show_customer_info: number
  show_tax: number
  show_discount: number
  header_font_size: number | null
  text_color: string | null
  created_at: string
  updated_at: string
}

interface AppSettingsRow extends RowDataPacket {
  id: string
  tax_rate: string
  shop_name: string | null
  shop_address: string | null
  shop_phone: string | null
  default_receipt_template_id: number | null
  default_pre_receipt_template_id: number | null
  last_order_sequence: number
  created_at: string
  updated_at: string
}

export async function getTaxRate(): Promise<number> {
  const connection = await dbPool.getConnection()
  try {
    const [rows] = await connection.query<TaxRateRow[]>(
      "SELECT tax_rate FROM pos_app_settings WHERE id = 'pos_settings'",
    )
    return rows.length > 0 ? Number.parseFloat(rows[0].tax_rate) : 0.1
  } catch (error) {
    console.error("Error fetching tax rate:", error)
    return 0.1
  } finally {
    connection.release()
  }
}

export async function updateTaxRate(newTaxRate: number): Promise<{ success: boolean; error?: string }> {
  const connection = await dbPool.getConnection()
  try {
    await connection.query("UPDATE pos_app_settings SET tax_rate = ? WHERE id = 'pos_settings'", [newTaxRate])
    revalidatePath("/settings/tax")
    return { success: true }
  } catch (error: unknown) {
    console.error("Error updating tax rate:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return { success: false, error: errorMessage }
  } finally {
    connection.release()
  }
}

export async function getInvoiceSettings(): Promise<InvoiceSettings | null> {
  const connection = await dbPool.getConnection()
  try {
    const [rows] = await connection.execute<InvoiceSettingsRow[]>(`SELECT * FROM invoice_settings LIMIT 1`)
    if (rows.length > 0) {
      const settings = rows[0]
      return {
        id: settings.id,
        business_name: settings.business_name || null,
        business_address: settings.business_address || null,
        business_phone: settings.business_phone || null,
        business_tax_id: settings.business_tax_id || null,
        logo_url: settings.logo_url || null,
        show_notes: Boolean(settings.show_notes),
        show_customer_info: Boolean(settings.show_customer_info),
        show_tax: Boolean(settings.show_tax),
        show_discount: Boolean(settings.show_discount),
        header_font_size: settings.header_font_size?.toString() || null,
        text_color: settings.text_color || null,
        created_at: new Date(settings.created_at),
        updated_at: new Date(settings.updated_at),
      } as InvoiceSettings
    }
    return null
  } catch (error: unknown) {
    console.error("Lỗi khi lấy cài đặt hóa đơn:", error)
    return null
  } finally {
    connection.release()
  }
}

export async function updateInvoiceSettings(
  settings: Partial<InvoiceSettings>,
): Promise<{ success: boolean; message?: string; error?: string }> {
  const connection = await dbPool.getConnection()
  try {
    const existingSettings = await getInvoiceSettings()

    if (existingSettings) {
      const [result] = await connection.execute<ResultSetHeader>(
        `UPDATE invoice_settings SET
        business_name = ?,
        business_address = ?,
        business_phone = ?,
        business_email = ?,
        business_website = ?,
        business_tax_id = ?,
        logo_url = ?,
        default_template = ?,
        show_notes = ?,
        show_customer_info = ?,
        show_tax = ?,
        show_discount = ?,
        header_font_size = ?,
        text_color = ?,
        updated_at = NOW()
        WHERE id = ?`,
        [
          settings.business_name ?? existingSettings.business_name,
          settings.business_address ?? existingSettings.business_address,
          settings.business_phone ?? existingSettings.business_phone,
          null, // business_email not in schema
          null, // business_website not in schema
          settings.business_tax_id ?? existingSettings.business_tax_id,
          settings.logo_url ?? existingSettings.logo_url,
          null, // default_template not in schema
          settings.show_notes !== undefined ? (settings.show_notes ? 1 : 0) : existingSettings.show_notes ? 1 : 0,
          settings.show_customer_info !== undefined
            ? settings.show_customer_info
              ? 1
              : 0
            : existingSettings.show_customer_info
              ? 1
              : 0,
          settings.show_tax !== undefined ? (settings.show_tax ? 1 : 0) : existingSettings.show_tax ? 1 : 0,
          settings.show_discount !== undefined ? (settings.show_discount ? 1 : 0) : existingSettings.show_discount ? 1 : 0,
          settings.header_font_size ?? existingSettings.header_font_size,
          settings.text_color ?? existingSettings.text_color,
          existingSettings.id,
        ],
      )
      return { success: result.affectedRows > 0, message: "Cài đặt hóa đơn đã được cập nhật." }
    } else {
      const [result] = await connection.execute<ResultSetHeader>(
        `INSERT INTO invoice_settings (business_name, business_address, business_phone, business_email, business_website, business_tax_id, logo_url, default_template, show_notes, show_customer_info, show_tax, show_discount, header_font_size, text_color) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          settings.business_name || null,
          settings.business_address || null,
          settings.business_phone || null,
          null, // business_email not in schema
          null, // business_website not in schema
          settings.business_tax_id || null,
          settings.logo_url || null,
          null, // default_template not in schema
          settings.show_notes ? 1 : 0,
          settings.show_customer_info ? 1 : 0,
          settings.show_tax ? 1 : 0,
          settings.show_discount ? 1 : 0,
          settings.header_font_size || null,
          settings.text_color || null,
        ],
      )
      return { success: result.affectedRows > 0, message: "Cài đặt hóa đơn đã được tạo." }
    }
  } catch (error: unknown) {
    console.error("Lỗi khi cập nhật cài đặt hóa đơn:", error)
    const errorMessage = error instanceof Error ? error.message : "Không thể cập nhật cài đặt hóa đơn."
    return { success: false, error: errorMessage }
  } finally {
    connection.release()
  }
}

export async function getAppSettings(): Promise<Settings | null> {
  const connection = await dbPool.getConnection()
  try {
    const [rows] = await connection.execute<AppSettingsRow[]>(
      `SELECT * FROM pos_app_settings WHERE id = 'pos_settings'`,
    )
    if (rows.length > 0) {
      const settings = rows[0]
      return {
        key: settings.id,
        value: settings.tax_rate,
      } as Settings
    }
    return null
  } catch (error: unknown) {
    console.error("Lỗi khi lấy cài đặt ứng dụng:", error)
    return null
  } finally {
    connection.release()
  }
}

export async function updateAppSettings(
  settings: Partial<Settings>,
): Promise<{ success: boolean; message?: string; error?: string }> {
  const connection = await dbPool.getConnection()
  try {
    const existingSettings = await getAppSettings()

    if (existingSettings) {
      const [result] = await connection.execute<ResultSetHeader>(
        `UPDATE pos_app_settings SET
        tax_rate = ?,
        shop_name = ?,
        shop_address = ?,
        shop_phone = ?,
        default_receipt_template_id = ?,
        default_pre_receipt_template_id = ?,
        last_order_sequence = ?,
        updated_at = NOW()
        WHERE id = 'pos_settings'`,
        [
          settings.value ?? existingSettings.value,
        ],
      )
      return { success: result.affectedRows > 0, message: "Cài đặt ứng dụng đã được cập nhật." }
    } else {
      const [result] = await connection.execute<ResultSetHeader>(
        `INSERT INTO pos_app_settings (id, tax_rate, shop_name, shop_address, shop_phone, default_receipt_template_id, default_pre_receipt_template_id, last_order_sequence) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          "pos_settings",
          settings.value ?? "0.1",
        ],
      )
      return { success: result.affectedRows > 0, message: "Cài đặt ứng dụng đã được tạo." }
    }
  } catch (error: unknown) {
    console.error("Lỗi khi cập nhật cài đặt ứng dụng:", error)
    const errorMessage = error instanceof Error ? error.message : "Không thể cập nhật cài đặt ứng dụng."
    return { success: false, error: errorMessage }
  } finally {
    connection.release()
  }
}

export const getStoreSettings: typeof getAppSettings = getAppSettings
export const updateStoreSettings: typeof updateAppSettings = updateAppSettings
