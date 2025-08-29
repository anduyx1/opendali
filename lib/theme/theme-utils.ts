import type { ColorPalette } from "@/lib/types/theme"

/**
 * Apply màu sắc theme vào CSS variables của document
 * @param colors - Bảng màu cần apply
 * @param isDark - Có phải dark mode không
 */
export function applyThemeColors(colors: ColorPalette, isDark = false) {
  const root = document.documentElement

  // Map các thuộc tính ColorPalette với tên CSS variable tương ứng
  const cssVariableMap: Record<keyof ColorPalette, string> = {
    primary: "--primary",
    secondary: "--secondary",
    accent: "--accent",
    background: "--background",
    foreground: "--foreground",
    muted: "--muted",
    mutedForeground: "--muted-foreground",
    border: "--border",
    input: "--input",
    ring: "--ring",
    sidebar: "--sidebar",
    sidebarForeground: "--sidebar-foreground",
    chart1: "--chart-1",
    chart2: "--chart-2",
    chart3: "--chart-3",
    chart4: "--chart-4",
    chart5: "--chart-5",
  }

  // Apply từng màu vào CSS variable tương ứng
  Object.entries(colors).forEach(([key, value]) => {
    const cssVar = cssVariableMap[key as keyof ColorPalette]
    if (cssVar) {
      root.style.setProperty(cssVar, value)
    }
  })

  // Toggle class để hỗ trợ dark/light mode
  document.body.classList.toggle("dark-theme", isDark)
  document.body.classList.toggle("light-theme", !isDark)
}

/**
 * Lấy giá trị của CSS variable
 * @param variableName - Tên CSS variable (bao gồm --)
 * @returns Giá trị của variable
 */
export function getCSSVariableValue(variableName: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim()
}

/**
 * Cập nhật nhiều CSS variables cùng lúc với performance tối ưu
 * @param updates - Object chứa các variable và giá trị mới
 */
export function batchUpdateCSSVariables(updates: Record<string, string>) {
  const root = document.documentElement

  // Sử dụng requestAnimationFrame để update mượt mà
  requestAnimationFrame(() => {
    Object.entries(updates).forEach(([variable, value]) => {
      root.style.setProperty(variable, value)
    })
  })
}

/**
 * Chuyển đổi màu từ HEX sang HSL format
 * @param hex - Mã màu HEX (ví dụ: #ff0000)
 * @returns Chuỗi HSL format (ví dụ: "0 100% 50%")
 */
export function hexToHsl(hex: string): string {
  // Chuyển đổi HEX thành RGB values (0-1)
  const r = Number.parseInt(hex.slice(1, 3), 16) / 255
  const g = Number.parseInt(hex.slice(3, 5), 16) / 255
  const b = Number.parseInt(hex.slice(5, 7), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0,
    s = 0
  const l = (max + min) / 2

  // Tính toán HSL values
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

/**
 * Chuyển đổi màu từ HSL sang HEX format
 * @param hsl - Chuỗi HSL format (ví dụ: "0 100% 50%")
 * @returns Mã màu HEX (ví dụ: #ff0000)
 */
export function hslToHex(hsl: string): string {
  // Parse HSL string thành numbers
  const [h, s, l] = hsl.split(" ").map((val, i) => {
    if (i === 0) return Number.parseInt(val) / 360
    return Number.parseInt(val.replace("%", "")) / 100
  })

  // Chuyển đổi HSL thành RGB
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h * 6) % 2) - 1))
  const m = l - c / 2

  let r = 0,
    g = 0,
    b = 0

  // Xác định RGB values dựa trên hue
  if (0 <= h && h < 1 / 6) {
    r = c
    g = x
    b = 0
  } else if (1 / 6 <= h && h < 2 / 6) {
    r = x
    g = c
    b = 0
  } else if (2 / 6 <= h && h < 3 / 6) {
    r = 0
    g = c
    b = x
  } else if (3 / 6 <= h && h < 4 / 6) {
    r = 0
    g = x
    b = c
  } else if (4 / 6 <= h && h < 5 / 6) {
    r = x
    g = 0
    b = c
  } else if (5 / 6 <= h && h < 1) {
    r = c
    g = 0
    b = x
  }

  const finalR = Math.round((r + m) * 255)
  const finalG = Math.round((g + m) * 255)
  const finalB = Math.round((b + m) * 255)

  return `#${finalR.toString(16).padStart(2, "0")}${finalG.toString(16).padStart(2, "0")}${finalB.toString(16).padStart(2, "0")}`
}

/**
 * Lưu theme settings vào localStorage
 * @param themeId - ID của theme
 * @param customColors - Màu sắc tùy chỉnh (optional)
 */
export function saveThemeToStorage(themeId: string, customColors?: Partial<ColorPalette>) {
  localStorage.setItem("theme-id", themeId)
  if (customColors) {
    localStorage.setItem("custom-colors", JSON.stringify(customColors))
  }
}

/**
 * Load theme settings từ localStorage
 * @returns Object chứa themeId và customColors
 */
export function loadThemeFromStorage(): { themeId: string | null; customColors: Partial<ColorPalette> | null } {
  const themeId = localStorage.getItem("theme-id")
  const customColorsStr = localStorage.getItem("custom-colors")
  const customColors = customColorsStr ? JSON.parse(customColorsStr) : null

  return { themeId, customColors }
}
