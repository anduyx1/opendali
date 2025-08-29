"use client"

import { User, LogOut, Settings, Shield } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { usePermissions } from "@/lib/hooks/use-permissions"
import { logout } from "@/actions/auth"
import { useRouter } from "next/navigation"

interface ProfileDropdownProps {
  variant?: "sidebar" | "header"
}

export default function ProfileDropdown({ variant = "header" }: ProfileDropdownProps) {
  const { user, loading } = usePermissions()
  const router = useRouter()

  if (loading) {
    return <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
  }

  if (!user) {
    return null
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getAvatarUrl = (name: string) => {
    const initials = getInitials(name)
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=0891b2&color=fff&size=128&fontSize=0.6`
  }

  const handleLogout = async () => {
    await logout()
  }

  const handleProfileClick = () => {
    router.push("/profile")
  }

  const handleSettingsClick = () => {
    router.push("/settings")
  }

  const handleAdminClick = () => {
    router.push("/admin")
  }

  if (variant === "sidebar") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="w-full justify-start p-2 h-auto">
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={user.avatar_url || getAvatarUrl(user.full_name || user.username || "U")}
                  alt={user.full_name}
                />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {getInitials(user.full_name || user.username || "U")}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium">{user.full_name || user.username}</span>
                <span className="text-xs text-muted-foreground">{user.role_display_name || user.role_name}</span>
              </div>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64" align="start" side="right">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.full_name || user.username}</p>
              <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
              <p className="text-xs leading-none text-muted-foreground">ID: {user.user_id}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleProfileClick} className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>Hồ sơ</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSettingsClick} className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Cài đặt</span>
          </DropdownMenuItem>
          {user.role_name === "admin" && (
            <DropdownMenuItem onClick={handleAdminClick} className="cursor-pointer">
              <Shield className="mr-2 h-4 w-4" />
              <span>Quản trị</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Đăng xuất</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={user.avatar_url || getAvatarUrl(user.full_name || user.username || "U")}
              alt={user.full_name}
            />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials(user.full_name || user.username || "U")}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72 md:w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center space-x-3 md:flex-col md:items-start md:space-x-0 md:space-y-1">
            <Avatar className="h-12 w-12 md:hidden">
              <AvatarImage
                src={user.avatar_url || getAvatarUrl(user.full_name || user.username || "U")}
                alt={user.full_name}
              />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials(user.full_name || user.username || "U")}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.full_name || user.username}</p>
              <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.role_display_name || user.role_name} • ID: {user.user_id}
              </p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleProfileClick} className="md:text-sm cursor-pointer">
          <User className="mr-2 h-4 w-4" />
          <span>Hồ sơ</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSettingsClick} className="md:text-sm cursor-pointer">
          <Settings className="mr-2 h-4 w-4" />
          <span>Cài đặt</span>
        </DropdownMenuItem>
        {user.role_name === "admin" && (
          <DropdownMenuItem onClick={handleAdminClick} className="md:text-sm cursor-pointer">
            <Shield className="mr-2 h-4 w-4" />
            <span>Quản trị</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-red-600 md:text-sm cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Đăng xuất</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
