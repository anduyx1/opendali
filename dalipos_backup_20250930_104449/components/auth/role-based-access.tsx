"use client"

import type { ReactNode } from "react"
import { usePermissions } from "@/lib/hooks/use-permissions"

interface RoleBasedAccessProps {
  children: ReactNode
  allowedRoles?: string[]
  deniedRoles?: string[]
  requireAdmin?: boolean
  requireSuperAdmin?: boolean
  fallback?: ReactNode
}

/**
 * Component to control access based on user roles
 */
export function RoleBasedAccess({
  children,
  allowedRoles,
  deniedRoles,
  requireAdmin = false,
  requireSuperAdmin = false,
  fallback = null,
}: RoleBasedAccessProps) {
  const { user, isAdmin, isSuperAdmin, loading } = usePermissions()

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-8 w-24 rounded" />
  }

  if (!user) {
    return <>{fallback}</>
  }

  // Check super admin requirement
  if (requireSuperAdmin && !isSuperAdmin) {
    return <>{fallback}</>
  }

  // Check admin requirement
  if (requireAdmin && !isAdmin) {
    return <>{fallback}</>
  }

  // Check denied roles
  if (deniedRoles && deniedRoles.includes(user.role_name)) {
    return <>{fallback}</>
  }

  // Check allowed roles
  if (allowedRoles && !allowedRoles.includes(user.role_name)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
