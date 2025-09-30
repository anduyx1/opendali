"use client"

import { useEffect, useState } from "react"
import type { UserWithRole } from "@/lib/types/database"
import type { Permission } from "@/lib/constants/permissions"
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  canAccessRoute,
  isAdmin,
  isSuperAdmin,
  canPerformAction,
} from "@/lib/utils/permissions"

/**
 * Hook to get current user with permissions
 */
export function useCurrentUser() {
  const [user, setUser] = useState<UserWithRole | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch("/api/auth/me")
        if (response.ok) {
          const userData = await response.json()
          setUser(userData)
        }
      } catch (error) {
        console.error("Error fetching user:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  return { user, loading, setUser }
}

/**
 * Hook to check if user has specific permission
 */
export function usePermission(permission: Permission) {
  const { user, loading } = useCurrentUser()

  return {
    hasPermission: hasPermission(user, permission),
    loading,
  }
}

/**
 * Hook to check if user has any of the specified permissions
 */
export function useAnyPermission(permissions: Permission[]) {
  const { user, loading } = useCurrentUser()

  return {
    hasPermission: hasAnyPermission(user, permissions),
    loading,
  }
}

/**
 * Hook to check if user has all of the specified permissions
 */
export function useAllPermissions(permissions: Permission[]) {
  const { user, loading } = useCurrentUser()

  return {
    hasPermission: hasAllPermissions(user, permissions),
    loading,
  }
}

/**
 * Hook to check if user can access route
 */
export function useRouteAccess(route: string) {
  const { user, loading } = useCurrentUser()

  return {
    canAccess: canAccessRoute(user, route),
    loading,
  }
}

/**
 * Hook to check if user is admin
 */
export function useIsAdmin() {
  const { user, loading } = useCurrentUser()

  return {
    isAdmin: isAdmin(user),
    loading,
  }
}

/**
 * Hook to check if user is super admin
 */
export function useIsSuperAdmin() {
  const { user, loading } = useCurrentUser()

  return {
    isSuperAdmin: isSuperAdmin(user),
    loading,
  }
}

/**
 * Hook to check if user can perform action on resource
 */
export function useCanPerformAction(action: "view" | "create" | "edit" | "delete", resource: string) {
  const { user, loading } = useCurrentUser()

  return {
    canPerform: canPerformAction(user, action, resource),
    loading,
  }
}

/**
 * Hook to get all user permissions utilities
 */
export function usePermissions() {
  const { user, loading, setUser } = useCurrentUser()

  return {
    user,
    loading,
    setUser,
    hasPermission: (permission: Permission) => hasPermission(user, permission),
    hasAnyPermission: (permissions: Permission[]) => hasAnyPermission(user, permissions),
    hasAllPermissions: (permissions: Permission[]) => hasAllPermissions(user, permissions),
    canAccessRoute: (route: string) => canAccessRoute(user, route),
    isAdmin: isAdmin(user),
    isSuperAdmin: isSuperAdmin(user),
    canPerformAction: (action: "view" | "create" | "edit" | "delete", resource: string) =>
      canPerformAction(user, action, resource),
  }
}
