"use client"

import { useState, useEffect } from "react"
import { usePermissions } from "@/lib/hooks/use-permissions"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { User, Shield, Crown } from "lucide-react"

interface UserInfoProps {
  showPermissions?: boolean
  showRole?: boolean
  compact?: boolean
}

/**
 * Component to display current user information with role and permissions
 */
export function UserInfo({ showPermissions = false, showRole = true, compact = false }: UserInfoProps) {
  const { user, isAdmin, isSuperAdmin, loading } = usePermissions()
  const [roleIcon, setRoleIcon] = useState<React.ReactNode>(<User className="h-3 w-3" />)
  const [roleColor, setRoleColor] = useState<string>("bg-gray-100 text-gray-800 border-gray-200")

  useEffect(() => {
    const updateRoleInfo = async () => {
      if (await isSuperAdmin) {
        setRoleIcon(<Crown className="h-3 w-3" />)
        setRoleColor("bg-purple-100 text-purple-800 border-purple-200")
      } else if (await isAdmin) {
        setRoleIcon(<Shield className="h-3 w-3" />)
        setRoleColor("bg-blue-100 text-blue-800 border-blue-200")
      } else {
        setRoleIcon(<User className="h-3 w-3" />)
        setRoleColor("bg-gray-100 text-gray-800 border-gray-200")
      }
    }
    updateRoleInfo()
  }, [isSuperAdmin, isAdmin])

  if (loading) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="pb-2">
          <div className="flex items-center space-x-3">
            <div className="animate-pulse bg-gray-300 rounded-full h-10 w-10" />
            <div className="space-y-2">
              <div className="animate-pulse bg-gray-300 h-4 w-24 rounded" />
              <div className="animate-pulse bg-gray-300 h-3 w-16 rounded" />
            </div>
          </div>
        </CardHeader>
      </Card>
    )
  }

  if (!user) {
    return null
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }



  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src={user.avatar_url || undefined} alt={user.full_name} />
          <AvatarFallback className="text-xs">{getInitials(user.full_name)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="text-sm font-medium">{user.full_name}</span>
          {showRole && (
            <Badge variant="outline" className={`text-xs ${roleColor}`}>
              {roleIcon}
              <span className="ml-1">{user.role_display_name}</span>
            </Badge>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-2">
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.avatar_url || undefined} alt={user.full_name} />
            <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{user.full_name}</h3>
            <p className="text-sm text-gray-600">{user.email}</p>
            {showRole && (
                          <Badge variant="outline" className={`mt-1 ${roleColor}`}>
              {roleIcon}
                <span className="ml-1">{user.role_display_name}</span>
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      {showPermissions && user.role_permissions && (
        <CardContent className="pt-0">
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Quyền hạn:</h4>
            <div className="flex flex-wrap gap-1">
              {user.role_permissions.slice(0, 6).map((permission) => (
                <Badge key={permission} variant="secondary" className="text-xs">
                  {permission.split(".")[1] || permission}
                </Badge>
              ))}
              {user.role_permissions.length > 6 && (
                <Badge variant="secondary" className="text-xs">
                  +{user.role_permissions.length - 6} khác
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
