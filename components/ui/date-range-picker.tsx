"use client"

import { useState } from "react"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DateRangePickerProps {
  label?: string
  startDate: string
  endDate: string
  onDateChange: (startDate: string, endDate: string) => void
  onFilter: () => void
}

export function DateRangePicker({
  label = "Ngày tạo đơn",
  startDate,
  endDate,
  onDateChange,
  onFilter,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState("custom")

  const getPresetDates = (preset: string) => {
    const today = new Date()
    const formatDate = (date: Date) => {
      return date.toISOString().split("T")[0]
    }

    switch (preset) {
      case "today":
        return { start: formatDate(today), end: formatDate(today) }
      case "yesterday":
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        return { start: formatDate(yesterday), end: formatDate(yesterday) }
      case "7days":
        const week = new Date(today)
        week.setDate(week.getDate() - 7)
        return { start: formatDate(week), end: formatDate(today) }
      case "30days":
        const month = new Date(today)
        month.setDate(month.getDate() - 30)
        return { start: formatDate(month), end: formatDate(today) }
      case "lastMonth":
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)
        return { start: formatDate(lastMonth), end: formatDate(lastMonthEnd) }
      case "thisMonth":
        const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        return { start: formatDate(thisMonth), end: formatDate(today) }
      case "lastYear":
        const lastYear = new Date(today.getFullYear() - 1, 0, 1)
        const lastYearEnd = new Date(today.getFullYear() - 1, 11, 31)
        return { start: formatDate(lastYear), end: formatDate(lastYearEnd) }
      case "thisYear":
        const thisYear = new Date(today.getFullYear(), 0, 1)
        return { start: formatDate(thisYear), end: formatDate(today) }
      default:
        return { start: startDate, end: endDate }
    }
  }

  const handlePresetSelect = (preset: string) => {
    setSelectedPreset(preset)
    if (preset !== "custom") {
      const dates = getPresetDates(preset)
      onDateChange(dates.start, dates.end)
    }
  }

  const formatDisplayDate = (date: string) => {
    if (!date) return ""
    const d = new Date(date)
    return d.toLocaleDateString("vi-VN")
  }

  return (
    <div className="flex items-center gap-4">
      <Select value={label} onValueChange={() => {}}>
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={label}>{label}</SelectItem>
        </SelectContent>
      </Select>

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-64 justify-start text-left font-normal bg-transparent">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {startDate && endDate
              ? `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`
              : "Chọn khoảng thời gian"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="start">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={selectedPreset === "today" ? "default" : "outline"}
                size="sm"
                onClick={() => handlePresetSelect("today")}
              >
                Hôm nay
              </Button>
              <Button
                variant={selectedPreset === "yesterday" ? "default" : "outline"}
                size="sm"
                onClick={() => handlePresetSelect("yesterday")}
              >
                Hôm qua
              </Button>
              <Button
                variant={selectedPreset === "7days" ? "default" : "outline"}
                size="sm"
                onClick={() => handlePresetSelect("7days")}
              >
                7 ngày qua
              </Button>
              <Button
                variant={selectedPreset === "30days" ? "default" : "outline"}
                size="sm"
                onClick={() => handlePresetSelect("30days")}
              >
                30 ngày qua
              </Button>
              <Button
                variant={selectedPreset === "lastMonth" ? "default" : "outline"}
                size="sm"
                onClick={() => handlePresetSelect("lastMonth")}
              >
                Tháng trước
              </Button>
              <Button
                variant={selectedPreset === "thisMonth" ? "default" : "outline"}
                size="sm"
                onClick={() => handlePresetSelect("thisMonth")}
              >
                Tháng này
              </Button>
              <Button
                variant={selectedPreset === "lastYear" ? "default" : "outline"}
                size="sm"
                onClick={() => handlePresetSelect("lastYear")}
              >
                Năm trước
              </Button>
              <Button
                variant={selectedPreset === "thisYear" ? "default" : "outline"}
                size="sm"
                onClick={() => handlePresetSelect("thisYear")}
              >
                Năm nay
              </Button>
            </div>

            <Button
              variant={selectedPreset === "custom" ? "default" : "outline"}
              className="w-full"
              onClick={() => handlePresetSelect("custom")}
            >
              Tùy chọn
            </Button>

            {selectedPreset === "custom" && (
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => onDateChange(e.target.value, endDate)}
                    className="pr-8"
                  />
                  <CalendarIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                <div className="relative">
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => onDateChange(startDate, e.target.value)}
                    className="pr-8"
                  />
                  <CalendarIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            )}

            <Button
              onClick={() => {
                onFilter()
                setIsOpen(false)
              }}
              className="w-full bg-primary hover:bg-primary/90"
            >
              Lọc
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
