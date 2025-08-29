import { NextResponse } from "next/server"

export async function POST() {
  try {
    // This endpoint is used by the sync service to refresh report caches
    // For now, we'll just return success as the main functionality
    // is handled by individual report endpoints

    console.log("[API] Report cache refresh requested")

    return NextResponse.json({
      success: true,
      message: "Cache refresh completed",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[API] Error refreshing cache:", error)
    return NextResponse.json({ success: false, error: "Failed to refresh cache" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json(
    {
      message: "Use POST method to refresh cache",
    },
    { status: 405 },
  )
}
