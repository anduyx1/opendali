"use client"

import { type ReactNode, useEffect } from "react"
import { useRouter } from "next/navigation"
import { usePermissions } from "@/lib/hooks/use-permissions"
import type { Permission } from "@/lib/constants/permissions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { ShieldX, ArrowLeft } from "lucide-react"

interface ProtectedRouteProps {
  children: ReactNode
  permission?: Permission
  permissions?: Permission[]
  requireAll?: boolean
  redirectTo?: string
  showError?: boolean
}

/**
 * Component to protect entire routes based on permissions
 */
export function ProtectedRoute({
  children,
  permission,
  permissions,
  requireAll = false,
  redirectTo = "/",
  showError = true,
}: ProtectedRouteProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading, user } = usePermissions()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [loading, user, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  let hasAccess = false

  if (permission) {
    hasAccess = hasPermission(permission)
  } else if (permissions && permissions.length > 0) {
    if (requireAll) {
      hasAccess = hasAllPermissions(permissions)
    } else {
      hasAccess = hasAnyPermission(permissions)
    }
  } else {
    // No permissions specified, allow access
    hasAccess = true
  }

  if (hasAccess) {
    return <>{children}</>
  }

  if (!showError) {
    router.push(redirectTo)
    return null
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="max-w-md w-full">
        <Alert className="border-red-200 bg-red-50">
          <ShieldX className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Không có quyền truy cập</h3>
                <p className="text-sm mt-1">
                  Bạn không có quyền truy cập trang này. Vui lòng liên hệ quản trị viên để được cấp quyền.
                </p>
              </div>
              <Button onClick={() => router.push(redirectTo)} variant="outline" size="sm" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}
