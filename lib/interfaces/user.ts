export interface User {
  id: number
  email: string
  name: string
  role: string
  branch_id?: number
  branch_name?: string
  staff_id?: number
  staff_name?: string
  permissions?: string[]
  created_at: Date
  updated_at: Date
}
