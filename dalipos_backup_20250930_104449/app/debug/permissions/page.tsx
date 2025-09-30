"use client"

import { usePermissions } from "@/lib/hooks/use-permissions"
import { PERMISSIONS } from "@/lib/constants/permissions"

export default function PermissionsPage() {
  const { user, loading, hasPermission, isAdmin, isSuperAdmin } = usePermissions()

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug: User Permissions</h1>

      {/* User Info */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">User Information</h2>
        {user ? (
          <div className="space-y-2">
            <p>
              <strong>ID:</strong> {user.id}
            </p>
            <p>
              <strong>User ID:</strong> {user.user_id}
            </p>
            <p>
              <strong>Username:</strong> {user.username}
            </p>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>Full Name:</strong> {user.full_name}
            </p>
            <p>
              <strong>Role ID:</strong> {user.role_id}
            </p>
            <p>
              <strong>Role Name:</strong> {user.role_name}
            </p>
            <p>
              <strong>Role Display Name:</strong> {user.role_display_name}
            </p>
            <p>
              <strong>Is Active:</strong> {user.is_active ? "Yes" : "No"}
            </p>
            <p>
              <strong>Is Admin:</strong> {(isAdmin as any) ? "Yes" : "No"}
            </p>
            <p>
              <strong>Is Super Admin:</strong> {(isSuperAdmin as any) ? "Yes" : "No"}
            </p>
          </div>
        ) : (
          <p>No user data found</p>
        )}
      </div>

      {/* Raw Permissions */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">Raw Permissions</h2>
        {user?.role_permissions ? (
          <div>
            <p>
              <strong>Permissions Array:</strong>
            </p>
            <pre className="bg-white p-2 rounded mt-2 text-sm">{JSON.stringify(user.role_permissions, null, 2)}</pre>
          </div>
        ) : (
          <p>No permissions found</p>
        )}
      </div>

      {/* Permission Tests */}
      <div className="bg-green-50 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">Permission Tests</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium mb-2">User Management</h3>
            <ul className="space-y-1 text-sm">
              <li>users.view: {(hasPermission as any)(PERMISSIONS.USERS_VIEW) ? "✅" : "❌"}</li>
              <li>users.create: {(hasPermission as any)(PERMISSIONS.USERS_CREATE) ? "✅" : "❌"}</li>
              <li>users.edit: {(hasPermission as any)(PERMISSIONS.USERS_EDIT) ? "✅" : "❌"}</li>
              <li>users.delete: {(hasPermission as any)(PERMISSIONS.USERS_DELETE) ? "✅" : "❌"}</li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium mb-2">System</h3>
            <ul className="space-y-1 text-sm">
              <li>system.admin: {(hasPermission as any)(PERMISSIONS.SYSTEM_ADMIN) ? "✅" : "❌"}</li>
              <li>settings.view: {(hasPermission as any)(PERMISSIONS.SETTINGS_VIEW) ? "✅" : "❌"}</li>
              <li>settings.edit: {(hasPermission as any)(PERMISSIONS.SETTINGS_EDIT) ? "✅" : "❌"}</li>
              <li>audit.logs: {(hasPermission as any)(PERMISSIONS.AUDIT_LOGS) ? "✅" : "❌"}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* All Permissions Check */}
      <div className="bg-yellow-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">All Available Permissions</h2>
        <div className="grid grid-cols-3 gap-2 text-sm">
          {Object.entries(PERMISSIONS).map(([key, permission]) => (
            <div key={key} className="flex items-center space-x-2">
              <span>{(hasPermission as any)(permission) ? "✅" : "❌"}</span>
              <span>{permission}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
