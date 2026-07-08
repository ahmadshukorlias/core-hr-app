import { notFound } from 'next/navigation'
import { getProfile } from '@/lib/auth/getProfile'
import { createClient } from '@/lib/supabase/server'
import { updateEmployee } from '../actions'

export default async function EmployeeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string; success?: string }>
}) {
  const { id } = await params
  const { error, success } = await searchParams
  const viewer = await getProfile()

  const supabase = await createClient()
  const { data: employee } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  // If RLS blocked it (not found) or it genuinely doesn't exist
  if (!employee) notFound()

  const isManager = viewer.role === 'admin' || viewer.role === 'hr'
  const isSelf = viewer.id === employee.id

  const { data: departments } = await supabase.from('departments').select('id, name').order('name')
  const { data: positions } = await supabase.from('positions').select('id, title').order('title')

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold">{employee.full_name}</h1>
      <p className="text-sm text-gray-500">{employee.email}</p>

      {error && (
        <p className="mt-4 rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>
      )}
      {success && (
        <p className="mt-4 rounded bg-green-50 p-2 text-sm text-green-600">Profile updated.</p>
      )}

      <form action={updateEmployee} className="mt-6 space-y-4">
        <input type="hidden" name="id" value={employee.id} />

        <div>
          <label className="block text-sm font-medium text-gray-700">Full Name</label>
          <input
            name="full_name"
            defaultValue={employee.full_name}
            required
            className="mt-1 w-full rounded border border-gray-300 p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Phone</label>
          <input
            name="phone"
            defaultValue={employee.phone ?? ''}
            className="mt-1 w-full rounded border border-gray-300 p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
          <input
            name="date_of_birth"
            type="date"
            defaultValue={employee.date_of_birth ?? ''}
            className="mt-1 w-full rounded border border-gray-300 p-2"
          />
        </div>

        {isManager && (
          <>
            <hr className="border-gray-200" />
            <p className="text-xs font-semibold uppercase text-gray-400">Admin / HR Only</p>

            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <select name="role" defaultValue={employee.role} className="mt-1 w-full rounded border border-gray-300 p-2">
                <option value="employee">Employee</option>
                <option value="hr">HR</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Department</label>
              <select name="department_id" defaultValue={employee.department_id ?? ''} className="mt-1 w-full rounded border border-gray-300 p-2">
                <option value="">— None —</option>
                {departments?.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Position</label>
              <select name="position_id" defaultValue={employee.position_id ?? ''} className="mt-1 w-full rounded border border-gray-300 p-2">
                <option value="">— None —</option>
                {positions?.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Employment Status</label>
              <select name="employment_status" defaultValue={employee.employment_status} className="mt-1 w-full rounded border border-gray-300 p-2">
                <option value="active">Active</option>
                <option value="on_leave">On Leave</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>
          </>
        )}

        {!isManager && !isSelf ? null : (
          <button type="submit" className="rounded bg-black px-4 py-2 text-white hover:bg-gray-800">
            Save Changes
          </button>
        )}
      </form>
    </div>
  )
}