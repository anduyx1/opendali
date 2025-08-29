"use server"

import { revalidatePath } from "next/cache"

export async function deleteCustomer(id: number): Promise<{ success: boolean; message: string }> {
  try {
    // TODO: Implement actual customer deletion logic
    // const result = await deleteCustomerFromDatabase(id)
    
    revalidatePath("/customers")
    return { success: true, message: "Khách hàng đã được xóa thành công" }
  } catch (error) {
    console.error("Error deleting customer:", error)
    return { success: false, message: "Có lỗi xảy ra khi xóa khách hàng" }
  }
}
