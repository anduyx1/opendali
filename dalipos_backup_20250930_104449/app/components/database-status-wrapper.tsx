"use server"

import { createClient } from "@/lib/supabase/server"
import { checkDatabaseReady } from "@/lib/database-check"
import DatabaseStatus from "./database-status"
import { cookies } from "next/headers" // Re-introduce cookies import

export async function DatabaseStatusWrapper() {
  const cookieStore = cookies() // Get cookie store
  const supabase = createClient() // Remove cookie store parameter

  let isReady = false
  let isLoading = true

  if (supabase) {
    isReady = await checkDatabaseReady(supabase) // Pass the initialized supabase client
    isLoading = false
  } else {
    isReady = false
    isLoading = false
  }

  return <DatabaseStatus isReady={isReady} isLoading={isLoading} />
}
