"use client"

import { Badge } from "@/components/ui/badge"
import { TestTube, CheckCircle } from "lucide-react" // Keep Lucide icons for visual

interface DatabaseStatusProps {
  isReady: boolean | null
  isLoading: boolean
}

export default function DatabaseStatus({ isReady, isLoading }: DatabaseStatusProps) {
  if (isLoading) {
    return (
      <Badge variant="secondary" className="flex items-center gap-2">
        <TestTube className="h-3 w-3" />
        Checking database...
      </Badge>
    )
  }

  return (
    <Badge
      variant={isReady ? "default" : "destructive"}
      className={`flex items-center gap-2 ${isReady ? "bg-green-600" : ""}`}
    >
      {isReady ? <CheckCircle className="h-3 w-3" /> : <TestTube className="h-3 w-3" />}
      {isReady ? "Database OK" : "Demo Mode"}
    </Badge>
  )
}
