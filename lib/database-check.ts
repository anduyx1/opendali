"use server"
import type { createClient } from "@/lib/supabase/server"

let databaseReadyStatus: boolean | null = null
let lastCheckTime = 0
const CACHE_DURATION = 5000 // Cache status for 5 seconds to avoid excessive checks

export async function checkDatabaseReady(supabase: ReturnType<typeof createClient>): Promise<boolean> {
  const now = Date.now()

  if (databaseReadyStatus !== null && now - lastCheckTime < CACHE_DURATION) {
    return databaseReadyStatus
  }

  if (!supabase) {
    console.warn("Supabase client not available, assuming database not ready.")
    databaseReadyStatus = false
    lastCheckTime = now
    return false
  }

  try {
    const { error } = await supabase.from("products").select("id").limit(1)

    if (error) {
      if (error.code === "42P01") {
        console.warn("Required database tables do not exist. Using mock data.")
        databaseReadyStatus = false
      } else {
        console.error("Unexpected database error during readiness check:", error.message)
        databaseReadyStatus = false
      }
    } else {
      databaseReadyStatus = true
    }
  } catch (err) {
    console.error("An unexpected error occurred during database readiness check:", err)
    databaseReadyStatus = false
  }

  lastCheckTime = now
  return databaseReadyStatus
}
