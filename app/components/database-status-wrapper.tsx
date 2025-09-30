import { createClient } from "@/lib/supabase/server"
import { checkDatabaseReady } from "@/lib/database-check"
import DatabaseStatus from "./database-status"

export async function DatabaseStatusWrapper() {
  const supabase = createClient()

  let isReady = false
  let isLoading = true

  if (supabase) {
    isReady = await checkDatabaseReady(supabase)
    isLoading = false
  } else {
    isReady = false
    isLoading = false
  }

  return <DatabaseStatus isReady={isReady} isLoading={isLoading} />
}
