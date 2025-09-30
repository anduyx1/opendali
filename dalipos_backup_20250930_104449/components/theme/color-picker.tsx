"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { hexToHsl, hslToHex } from "@/lib/theme/theme-utils"

interface ColorPickerProps {
  label: string
  value: string // HSL format
  onChange: (value: string) => void
  className?: string
}

export function ColorPicker({ label, value, onChange, className }: ColorPickerProps) {
  const [hexValue, setHexValue] = useState(hslToHex(value))

  const handleHexChange = (hex: string) => {
    if (hex.match(/^#[0-9A-Fa-f]{6}$/)) {
      setHexValue(hex)
      onChange(hexToHsl(hex))
    } else {
      setHexValue(hex)
    }
  }

  const handleColorInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value
    setHexValue(hex)
    onChange(hexToHsl(hex))
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex items-center gap-2">
        <div className="relative">
          <input
            type="color"
            value={hexValue}
            onChange={handleColorInputChange}
            className="w-10 h-10 rounded-md border border-input cursor-pointer"
            style={{ backgroundColor: hexValue }}
          />
        </div>

        <Input
          type="text"
          value={hexValue}
          onChange={(e) => handleHexChange(e.target.value)}
          placeholder="#000000"
          className="flex-1 font-mono text-sm"
          maxLength={7}
        />

        <div className="text-xs text-muted-foreground font-mono min-w-[100px]">{value}</div>
      </div>
    </div>
  )
}
