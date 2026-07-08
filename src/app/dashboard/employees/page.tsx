import Link from 'next/link'
import { getProfile } from '@/lib/auth/getProfile'
import { createClient } from '@/lib/supabase/server'

export default async function EmployeesPage() {
  const profile = await getProfile()
  const supabase = await createClient()

  const { data: employees } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, employment_status, departments(name), positions(title)')
    .order('full_name')

  const canManage = profile.role === 'admin' || profile.role === 'hr'

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Employees</h1>
        {canManage && (
          <Link
            href="/dashboard/employees/new"
            className="rounded bg-black px-4 py-2 text-sm text-white hover:bg-gray-800"
          >
            + Add Employee
          </Link>
        )}
      </div>

      <table className="mt-6 w-full text-left text-sm">
        <thead className="border-b border-gray-200 text-gray-500">
          <tr>
            <th className="py-2">Name</th>
            <th className="py-2">Email</th>
            <th className="py-2">Role</th>
            <th className="py-2">Department</th>
            <th className="py-2">Position</th>
            <th className="py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {employees?.map((emp: any) => (
            <tr key={emp.id} className="border-b border-gray-100">
              <td className="py-2">
                <Link href={`/dashboard/employees/${emp.id}`} className="text-blue-600 hover:underline">
                  {emp.full_name}
                </Link>
              </td>
              <td className="py-2">{emp.email}</td>
              <td className="py-2 uppercase text-xs">{emp.role}</td>
              <td className="py-2">{emp.departments?.name ?? '—'}</td>
              <td className="py-2">{emp.positions?.title ?? '—'}</td>
              <td className="py-2">{emp.employment_status}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {(!employees || employees.length === 0) && (
        <p className="mt-6 text-gray-500">No employees found.</p>
      )}
    </div>
  )
}