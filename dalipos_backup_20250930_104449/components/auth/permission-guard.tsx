"use client"

import type { ReactNode } from "react"
import { usePermissions } from "@/lib/hooks/use-permissions"
import type { Permission } from "@/lib/constants/permissions"

interface PermissionGuardProps {
  children: ReactNode
  permission?: Permission
  permissions?: Permission[]
  requireAll?: boolean
  fallback?: ReactNode
  showFallback?: boolean
}

/**
 * Component to conditionally render children based on user permissions
 */
export function PermissionGuard({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  showFallback = true,
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = usePermissions()

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-8 w-24 rounded" />
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

  return showFallback ? <>{fallback}</> : null
}
