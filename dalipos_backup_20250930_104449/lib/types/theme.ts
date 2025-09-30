/**
 * Interface định nghĩa bảng màu hoàn chỉnh cho theme
 * Bao gồm tất cả màu sắc cần thiết cho UI components
 */
export interface ColorPalette {
  // Màu chính của theme
  primary: string
  // Màu phụ
  secondary: string
  // Màu nhấn
  accent: string
  // Màu nền chính
  background: string
  // Màu chữ chính
  foreground: string
  // Màu nền nhạt
  muted: string
  // Màu chữ trên nền nhạt
  mutedForeground: string
  // Màu viền
  border: string
  // Màu nền input
  input: string
  // Màu viền focus
  ring: string
  // Màu nền sidebar
  sidebar: string
  // Màu chữ sidebar
  sidebarForeground: string
  // Màu biểu đồ 1
  chart1: string
  // Màu biểu đồ 2
  chart2: string
  // Màu biểu đồ 3
  chart3: string
  // Màu biểu đồ 4
  chart4: string
  // Màu biểu đồ 5
  chart5: string
}

/**
 * Interface cấu hình theme hoàn chỉnh
 * Bao gồm metadata và bảng màu cho cả light/dark mode
 */
export interface ThemeConfig {
  // ID duy nhất của theme
  id: string
  // Tên hiển thị của theme
  name: string
  // Bảng màu cho light và dark mode
  colors: {
    light: ColorPalette
    dark: ColorPalette
  }
}

/**
 * Interface cho Theme Context
 * Định nghĩa các methods và properties có thể truy cập từ useTheme hook
 */
export interface ThemeContextType {
  // Theme hiện tại đang sử dụng
  currentTheme: ThemeConfig
  // Màu sắc tùy chỉnh của user
  customColors: Partial<ColorPalette>
  // Function thay đổi theme
  setTheme: (theme: ThemeConfig) => void
  // Function cập nhật một màu tùy chỉnh
  updateCustomColor: (key: keyof ColorPalette, value: string) => void
  // Function reset về màu mặc định
  resetToDefault: () => void
  // Function apply custom colors
  applyCustomColors: () => void
}
