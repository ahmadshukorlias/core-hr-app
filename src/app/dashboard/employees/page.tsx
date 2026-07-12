import Link from 'next/link'
import { getProfile } from '@/lib/auth/getProfile'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function EmployeesPage() {
  const profile = await getProfile()
  if (profile.role === 'employee') {
  redirect(`/dashboard/employees/${profile.id}`)
}
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

        {/* Desktop table */}
        <table className="mt-6 hidden w-full text-left text-sm md:table">
            <thead className="border-b border-[#E3E8EB] text-[#5B6670]">
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
                <tr key={emp.id} className="border-b border-[#E3E8EB] hover:bg-[#F7F9FA]">
                    <td className="py-2.5">
                    <Link href={`/dashboard/employees/${emp.id}`} className="text-[#3D6E93] hover:underline">
                        {emp.full_name}
                    </Link>
                    </td>
                    <td className="py-2.5">{emp.email}</td>
                    <td className="py-2.5 text-xs uppercase">{emp.role}</td>
                    <td className="py-2.5">{emp.departments?.name ?? '—'}</td>
                    <td className="py-2.5">{emp.positions?.title ?? '—'}</td>
                    <td className="py-2.5">{emp.employment_status}</td>
                </tr>
                ))}
            </tbody>
            </table>

            {/* Mobile card list */}
            <div className="mt-6 space-y-3 md:hidden">
            {employees?.map((emp: any) => (
                <Link
                key={emp.id}
                href={`/dashboard/employees/${emp.id}`}
                className="block rounded-xl border border-[#E3E8EB] bg-white p-4 active:scale-[0.99]"
                >
                <div className="flex items-center justify-between">
                    <p className="font-medium text-[#1E293B]">{emp.full_name}</p>
                    <span className="rounded-full bg-[#4FA3A0]/10 px-2 py-0.5 text-[11px] font-medium uppercase text-[#0E4A56]">
                    {emp.role}
                    </span>
                </div>
                <p className="mt-1 text-sm text-[#5B6670]">{emp.email}</p>
                <div className="mt-2 flex gap-4 text-xs text-[#5B6670]">
                    <span>{emp.departments?.name ?? 'No department'}</span>
                    <span>{emp.positions?.title ?? 'No position'}</span>
                </div>
                </Link>
            ))}
            </div>

      {(!employees || employees.length === 0) && (
        <p className="mt-6 text-gray-500">No employees found.</p>
      )}
    </div>
  )
}