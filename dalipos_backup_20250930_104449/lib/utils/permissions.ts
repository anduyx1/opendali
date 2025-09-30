import type { UserWithRole } from "@/lib/types/database"
import type { Permission } from "@/lib/constants/permissions"
import { DATABASE_PERMISSION_MAPPING } from "@/lib/constants/permissions"

/**
 * Expand database permissions to full permission list
 */
function expandDatabasePermissions(databasePermissions: string[]): Permission[] {
  const expandedPermissions: Permission[] = []

  for (const dbPermission of databasePermissions) {
    // Check if it's a database permission that needs mapping
    if (DATABASE_PERMISSION_MAPPING[dbPermission as keyof typeof DATABASE_PERMISSION_MAPPING]) {
      const mappedPermissions = DATABASE_PERMISSION_MAPPING[dbPermission as keyof typeof DATABASE_PERMISSION_MAPPING]
      expandedPermissions.push(...mappedPermissions)
    } else {
      // It's already a standard permission
      expandedPermissions.push(dbPermission as Permission)
    }
  }

  return [...new Set(expandedPermissions)] // Remove duplicates
}

/**
 * Check if user has specific permission
 */
export function hasPermission(user: UserWithRole | null, permission: Permission): boolean {
  if (!user || !user.role_permissions) {
    return false
  }

  if (user.role_permissions.includes("all")) {
    return true
  }

  const expandedPermissions = expandDatabasePermissions(user.role_permissions)
  return expandedPermissions.includes(permission)
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(user: UserWithRole | null, permissions: Permission[]): boolean {
  if (!user || !user.role_permissions) {
    return false
  }

  if (user.role_permissions.includes("all")) {
    return true
  }

  const expandedPermissions = expandDatabasePermissions(user.role_permissions)
  return permissions.some((permission) => expandedPermissions.includes(permission))
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(user: UserWithRole | null, permissions: Permission[]): boolean {
  if (!user || !user.role_permissions) {
    return false
  }

  if (user.role_permissions.includes("all")) {
    return true
  }

  const expandedPermissions = expandDatabasePermissions(user.role_permissions)
  return permissions.every((permission) => expandedPermissions.includes(permission))
}

/**
 * Check if user can access a specific route
 */
export async function canAccessRoute(user: UserWithRole | null, route: string): Promise<boolean> {
  if (!user) {
    return false
  }

  if (user.role_permissions && user.role_permissions.includes("all")) {
    return true
  }

  const { ROUTE_PERMISSIONS } = await import("@/lib/constants/permissions")

  const requiredPermissions = ROUTE_PERMISSIONS[route as keyof typeof ROUTE_PERMISSIONS]
  if (!requiredPermissions) {
    return true // No specific permissions required
  }

  return hasAnyPermission(user, requiredPermissions as unknown as Permission[])
}

/**
 * Get user's role display name
 */
export function getUserRoleDisplay(user: UserWithRole | null): string {
  if (!user) {
    return "Không xác định"
  }

  return user.role_display_name || user.role_name || "Không xác định"
}

/**
 * Check if user is admin (has system admin permission)
 */
export async function isAdmin(user: UserWithRole | null): Promise<boolean> {
  if (!user || !user.role_permissions) {
    return false
  }

  if (user.role_permissions.includes("all")) {
    return true
  }

  const { PERMISSIONS } = await import("@/lib/constants/permissions")
  return hasPermission(user, PERMISSIONS.SYSTEM_ADMIN)
}

/**
 * Check if user is super admin (has all permissions)
 */
export async function isSuperAdmin(user: UserWithRole | null): Promise<boolean> {
  if (!user || !user.role_permissions) {
    return false
  }

  if (user.role_permissions.includes("all")) {
    return true
  }

  const { PERMISSIONS } = await import("@/lib/constants/permissions")
  const allPermissions = Object.values(PERMISSIONS)

  return hasAllPermissions(user, allPermissions)
}

/**
 * Filter permissions based on user's role
 */
export async function getAvailablePermissions(user: UserWithRole | null): Promise<Permission[]> {
  if (!user || !user.role_permissions) {
    return []
  }

  if (user.role_permissions.includes("all")) {
    const { PERMISSIONS } = await import("@/lib/constants/permissions")
    return Object.values(PERMISSIONS)
  }

  return expandDatabasePermissions(user.role_permissions)
}

/**
 * Check if user can perform action on resource
 */
export function canPerformAction(
  user: UserWithRole | null,
  action: "view" | "create" | "edit" | "delete",
  resource: string,
): boolean {
  const permission = `${resource}.${action}` as Permission
  return hasPermission(user, permission)
}

/**
 * Get permission label for display
 */
export function getPermissionLabel(permission: Permission): string {
  const labels: Record<string, string> = {
    "users.view": "Xem người dùng",
    "users.create": "Tạo người dùng",
    "users.edit": "Sửa người dùng",
    "users.delete": "Xóa người dùng",
    "roles.view": "Xem vai trò",
    "roles.create": "Tạo vai trò",
    "roles.edit": "Sửa vai trò",
    "roles.delete": "Xóa vai trò",
    "products.view": "Xem sản phẩm",
    "products.create": "Tạo sản phẩm",
    "products.edit": "Sửa sản phẩm",
    "products.delete": "Xóa sản phẩm",
    "products.manage_stock": "Quản lý tồn kho",
    "orders.view": "Xem đơn hàng",
    "orders.create": "Tạo đơn hàng",
    "orders.edit": "Sửa đơn hàng",
    "orders.delete": "Xóa đơn hàng",
    "orders.refund": "Hoàn tiền",
    "customers.view": "Xem khách hàng",
    "customers.create": "Tạo khách hàng",
    "customers.edit": "Sửa khách hàng",
    "customers.delete": "Xóa khách hàng",
    "inventory.view": "Xem kho hàng",
    "inventory.adjust": "Điều chỉnh kho",
    "inventory.receive": "Nhập hàng",
    "inventory.check": "Kiểm kho",
    "reports.view": "Xem báo cáo",
    "reports.export": "Xuất báo cáo",
    "reports.financial": "Báo cáo tài chính",
    "settings.view": "Xem cài đặt",
    "settings.edit": "Sửa cài đặt",
    "settings.system": "Cài đặt hệ thống",
    "pos.access": "Truy cập POS",
    "pos.discount": "Áp dụng giảm giá",
    "pos.refund": "Hoàn tiền POS",
    "pos.void": "Hủy giao dịch",
    "audit.logs": "Xem nhật ký",
    "system.admin": "Quản trị hệ thống",
  }

  return labels[permission] || permission
}
