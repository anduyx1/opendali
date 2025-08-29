"use client"

import type { ReactNode } from "react"
import { Button, type ButtonProps } from "@/components/ui/button"
import { usePermissions } from "@/lib/hooks/use-permissions"
import type { Permission } from "@/lib/constants/permissions"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface PermissionButtonProps extends ButtonProps {
  children: ReactNode
  permission?: Permission
  permissions?: Permission[]
  requireAll?: boolean
  hideWhenNoAccess?: boolean
  disableTooltip?: string
}

/**
 * Button component that can be disabled or hidden based on permissions
 */
export function PermissionButton({
  children,
  permission,
  permissions,
  requireAll = false,
  hideWhenNoAccess = false,
  disableTooltip = "Bạn không có quyền thực hiện hành động này",
  disabled,
  ...props
}: PermissionButtonProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = usePermissions()

  if (loading) {
    return (
      <Button disabled {...props}>
        <div className="animate-pulse bg-gray-300 h-4 w-16 rounded" />
      </Button>
    )
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

  if (!hasAccess && hideWhenNoAccess) {
    return null
  }

  const isDisabled = disabled || !hasAccess

  if (!hasAccess && disableTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button disabled={isDisabled} {...props}>
                {children}
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{disableTooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <Button disabled={isDisabled} {...props}>
      {children}
    </Button>
  )
}
