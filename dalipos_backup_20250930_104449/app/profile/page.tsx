"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { usePermissions } from "@/lib/hooks/use-permissions"
import { User, Mail, Phone, MapPin, Calendar, Shield, Edit3, Save, X } from "lucide-react"
import { toast } from "sonner"

export default function ProfilePage() {
  const { user, loading } = usePermissions()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
  })

  // Sử dụng useEffect để điền dữ liệu người dùng vào form khi có
  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || "",
        email: user.email || "",
        phone: user.phone || "",
      })
    }
  }, [user])

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="h-8 bg-muted animate-pulse rounded" />
          <div className="h-64 bg-muted animate-pulse rounded" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Không thể tải thông tin người dùng</p>
          </CardContent>
        </Card>
      </div>
    )
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
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=0891b2&color=fff&size=256&fontSize=0.6`
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSave = async () => {
    try {
      // TODO: Implement API call to update user profile
      toast.success("Cập nhật thông tin thành công!")
      setIsEditing(false)
    } catch { // Đã sửa lỗi tại đây: loại bỏ biến lỗi
      toast.error("Có lỗi xảy ra khi cập nhật thông tin")
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setFormData({
      full_name: user.full_name || "",
      email: user.email || "",
      phone: user.phone || "",
    })
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Hồ sơ cá nhân</h1>
            <p className="text-muted-foreground">Quản lý thông tin cá nhân của bạn</p>
          </div>
          {!isEditing ? (
            <Button onClick={handleEdit}>
              <Edit3 className="mr-2 h-4 w-4" />
              Chỉnh sửa
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Lưu
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <X className="mr-2 h-4 w-4" />
                Hủy
              </Button>
            </div>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Profile Card */}
          <Card className="md:col-span-1">
            <CardHeader className="text-center">
              <div className="flex justify-center">
                <Avatar className="h-24 w-24">
                  <AvatarImage
                    src={user.avatar_url || getAvatarUrl(user.full_name || user.username || "U")}
                    alt={user.full_name}
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                    {getInitials(user.full_name || user.username || "U")}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-xl">{user.full_name || user.username}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
              <div className="flex justify-center">
                <Badge variant={user.role_name === "admin" ? "default" : "secondary"}>
                  <Shield className="mr-1 h-3 w-3" />
                  {user.role_display_name || user.role_name}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>ID: {user.user_id}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Tham gia: {new Date().toLocaleDateString("vi-VN")}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Information Card */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Thông tin chi tiết</CardTitle>
              <CardDescription>Thông tin cá nhân và liên hệ của bạn</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!isEditing ? (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Họ và tên
                      </Label>
                      <p className="text-sm text-muted-foreground">{user.full_name || "Chưa cập nhật"}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </Label>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Số điện thoại
                      </Label>
                      <p className="text-sm text-muted-foreground">{user.phone || "Chưa cập nhật"}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Địa chỉ
                      </Label>
                      <p className="text-sm text-muted-foreground">Chưa cập nhật</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Giới thiệu</Label>
                    <p className="text-sm text-muted-foreground">Chưa có thông tin giới thiệu</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Họ và tên</Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        placeholder="Nhập họ và tên"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="Nhập email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Số điện thoại</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="Nhập số điện thoại"
                      />
                    </div>

                  </div>

                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
