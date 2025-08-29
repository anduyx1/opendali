"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Database, ExternalLink, Copy, Check } from "lucide-react"

export default function SetupInstructions() {
  const [copied, setCopied] = useState(false)

  const envContent = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key`

  const copyToClipboard = () => {
    navigator.clipboard.writeText(envContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Cấu hình Database
        </CardTitle>
        <CardDescription>
          Hệ thống ��ang chạy ở <Badge variant="secondary">Demo Mode</Badge> với dữ liệu mẫu
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            Để sử dụng database thực, bạn cần cấu hình Supabase. Nếu không, hệ thống sẽ sử dụng dữ liệu mẫu để demo.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <h3 className="font-medium">Bước 1: Tạo Supabase Project</h3>
          <Button variant="outline" asChild>
            <a href="https://database.new" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Tạo Supabase Project
            </a>
          </Button>
        </div>

        <div className="space-y-3">
          <h3 className="font-medium">Bước 2: Tạo file .env.local</h3>
          <div className="relative">
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">{envContent}</pre>
            <Button variant="outline" size="sm" className="absolute top-2 right-2" onClick={copyToClipboard}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-medium">Bước 3: Chạy SQL Scripts</h3>
          <p className="text-sm text-muted-foreground">
            Sau khi cấu hình, chạy các SQL scripts trong thư mục scripts/ để tạo bảng và dữ liệu mẫu.
          </p>
        </div>

        <Alert>
          <AlertDescription>
            <strong>Lưu ý:</strong> Hệ thống sẽ tự động chuyển sang database thực sau khi cấu hình xong và restart ứng
            dụng.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
