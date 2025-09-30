import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = createClient()

    const { data: rows, error } = await supabase
      .from('settings')
      .select('key, value')

    if (error) {
      throw error
    }

    const settings: Record<string, string> = {}
    rows?.forEach((row) => {
      settings[row.key] = row.value
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Failed to fetch settings:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}
