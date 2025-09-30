import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Simplified middleware - only check authentication
 * Authorization will be handled at component/page level
 */
export async function authMiddleware(request: NextRequest) {
  const userId = request.cookies.get("user_authenticated")?.value
  const { pathname } = request.nextUrl

  console.log(`[Auth Middleware] Path: ${pathname} | UserID: ${userId || "undefined"}`)

  // Allow access to public routes
  const publicRoutes = ["/login", "/register", "/_next", "/favicon.ico", "/api"]
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    console.log(`[Auth Middleware] Allowing access to public path: ${pathname}`)
    return NextResponse.next()
  }

  // Check authentication only
  if (!userId) {
    console.log(`[Auth Middleware] User NOT authenticated. Redirecting to login.`)
    return NextResponse.redirect(new URL("/login?message=login_required", request.url))
  }

  console.log(`[Auth Middleware] User authenticated. Allowing access to: ${pathname}`)

  // Add user ID to headers for downstream use
  const response = NextResponse.next()
  response.headers.set("x-user-id", userId)

  return response
}
