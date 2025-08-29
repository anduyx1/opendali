"use client"

import { getStoreSettings, updateStoreSettings, getAppSettings } from "@/lib/actions/settings"
import type { StoreSettings, Settings } from "@/lib/types/database"

export const getStoreSettingsClient = async (): Promise<StoreSettings | null> => {
  const settings = await getStoreSettings()
  if (!settings) return null
  
  // Convert Settings to StoreSettings format
  return {
    store_name: "Dali Shop",
    store_address: "Hà Nội, Việt Nam",
    store_phone: "0352210000",
    store_email: "info@dalishop.com",
    tax_rate: parseFloat(settings.value || "0.1"),
    currency: "VND",
    receipt_footer: "Cảm ơn quý khách đã mua hàng!",
  }
}

export const updateStoreSettingsClient = async (settings: Partial<StoreSettings>): Promise<{ success: boolean; message?: string; error?: string }> => {
  // Convert StoreSettings to Settings format
  const convertedSettings: Partial<Settings> = {
    value: settings.tax_rate?.toString(),
  }
  return await updateStoreSettings(convertedSettings)
}

export const getPosAppSettings = async (): Promise<Settings | null> => {
  return await getAppSettings()
}
