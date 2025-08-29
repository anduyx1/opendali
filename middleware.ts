import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { logPoolStatus } from "@/lib/mysql/client"

export function middleware(request: NextRequest) {
  // Tạm thời tắt logging để tránh spam
  // Log pool status on connection errors
  // if (request.nextUrl.pathname.includes('/api/') && request.method === 'GET') {
  //   // Log pool status for API requests that might cause connection issues
  //   logPoolStatus()
  // }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
