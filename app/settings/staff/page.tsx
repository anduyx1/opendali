import { getUsersWithRoles, getRoles } from "@/lib/services/users"
import StaffTable from "./_components/staff-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const dynamic = "force-dynamic"

export default async function StaffPage() {
  const users = await getUsersWithRoles()
  const roles = await getRoles()

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Nhân viên và Phân quyền</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Quản lý nhân viên</CardTitle>
          <CardDescription>Xem, thêm, chỉnh sửa và xóa tài khoản nhân viên và vai trò của họ.</CardDescription>
        </CardHeader>
        <CardContent>
          <StaffTable users={users} roles={roles} />
        </CardContent>
      </Card>
    </div>
  )
}
