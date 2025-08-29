"use client"

import { useNetworkStatus } from "@/hooks/use-network-status"
import { useToast } from "@/hooks/use-toast"

/**
 * Wrapper utility for server actions with offline handling
 */
export function useServerActionWrapper() {
  const { isOnline } = useNetworkStatus()
  const { toast } = useToast()

  const wrapServerAction = async <T extends unknown[], R>(
    action: (...args: T) => Promise<R>,
    offlineFallback?: (...args: T) => Promise<R> | R,
    actionName?: string,
  ) => {
    return async (...args: T): Promise<R | null> => {
      if (!isOnline) {
        if (offlineFallback) {
          toast({
            title: "Chế độ offline",
            description: `${actionName || "Thao tác"} được thực hiện offline.`,
            variant: "warning",
          })
          return await offlineFallback(...args)
        } else {
          toast({
            title: "Không có kết nối mạng",
            description: `Không thể thực hiện ${actionName || "thao tác này"} khi offline.`,
            variant: "destructive",
          })
          return null
        }
      }

      try {
        return await action(...args)
      } catch (error) {
        console.error(`Server action failed: ${actionName}`, error)

        const errorMessage = error instanceof Error ? error.message : String(error)
        if (errorMessage.includes("fetch") || errorMessage.includes("network")) {
          if (offlineFallback) {
            toast({
              title: "Lỗi kết nối",
              description: `Chuyển sang chế độ offline cho ${actionName || "thao tác này"}.`,
              variant: "warning",
            })
            return await offlineFallback(...args)
          } else {
            toast({
              title: "Lỗi kết nối",
              description: "Vui lòng kiểm tra kết nối internet và thử lại.",
              variant: "destructive",
            })
          }
        } else {
          toast({
            title: "Lỗi server",
            description: `Không thể thực hiện ${actionName || "thao tác"}. Vui lòng thử lại.`,
            variant: "destructive",
          })
        }

        throw error
      }
    }
  }

  return { wrapServerAction, isOnline }
}
