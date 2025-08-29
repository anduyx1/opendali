import type React from "react"
import type { Metadata, Viewport } from "next"
import { Mona_Sans as FontSans } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"
import { ThemeProvider } from "@/components/theme/theme-context"
import { Toaster } from "@/components/ui/toaster"
import ClientLayout from "./ClientLayout"

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "POS DALI - Hệ thống quản lý bán hàng",
  description: "A modern POS system built with Next.js and Shadcn UI.",
  generator: "v0.dev",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "POS DALI",
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="POS DALI" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#1e40af" />
      </head>
      <body className={cn("min-h-screen bg-background font-sans antialiased theme-transition", fontSans.variable)}>
        <ThemeProvider>
          <ClientLayout>{children}</ClientLayout>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
