"use client"

import type { ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface KpiCardProps {
  title: string
  value: string
  period: string
  icon: ReactNode
  chart?: ReactNode
  badge?: string
  reportOptions?: string[]
  reportItems?: string[]
}

export function KpiCard({
  title,
  value,
  period,
  icon,
  chart,
  badge,
  reportOptions = [],
  reportItems = [],
}: KpiCardProps) {
  return (
    <Card className="relative">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-primary">{icon}</div>
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            {badge && (
              <Badge variant="destructive" className="text-xs">
                {badge}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-primary">{value}</div>
          <div className="text-xs text-muted-foreground">{period}</div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Biểu đồ nếu có */}
        {chart && <div className="mb-4">{chart}</div>}

        {/* Dropdown chọn loại báo cáo */}
        {reportOptions.length > 0 && (
          <div className="mb-4">
            <Select defaultValue={reportOptions[0]}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {reportOptions.map((option, index) => (
                  <SelectItem key={index} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Danh sách các loại báo cáo */}
        {reportItems.length > 0 && (
          <div className="space-y-2">
            {reportItems.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                <div className="h-1 w-1 rounded-full bg-current" />
                {item}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
