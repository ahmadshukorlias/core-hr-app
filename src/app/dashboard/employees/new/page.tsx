import { requireRole } from '@/lib/auth/requireRole'
import { createClient } from '@/lib/supabase/server'
import { createEmployee } from '../actions'

export default async function NewEmployeePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  await requireRole(['admin', 'hr'])
  const { error } = await searchParams

  const supabase = await createClient()
  const { data: departments } = await supabase.from('departments').select('id, name').order('name')
  const { data: positions } = await supabase.from('positions').select('id, title').order('title')

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold">Add Employee</h1>

      {error && (
        <p className="mt-4 rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>
      )}

      <form action={createEmployee} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Full Name</label>
          <input name="full_name" required className="mt-1 w-full rounded border border-gray-300 p-2" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input name="email" type="email" required className="mt-1 w-full rounded border border-gray-300 p-2" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Temporary Password</label>
          <input name="password" type="text" required minLength={6} className="mt-1 w-full rounded border border-gray-300 p-2" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Role</label>
          <select name="role" required className="mt-1 w-full rounded border border-gray-300 p-2">
            <option value="employee">Employee</option>
            <option value="hr">HR</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Department</label>
          <select name="department_id" className="mt-1 w-full rounded border border-gray-300 p-2">
            <option value="">— None —</option>
            {departments?.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Position</label>
          <select name="position_id" className="mt-1 w-full rounded border border-gray-300 p-2">
            <option value="">— None —</option>
            {positions?.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>

        <button type="submit" className="rounded bg-black px-4 py-2 text-white hover:bg-gray-800">
          Create Employee
        </button>
      </form>
    </div>
  )
}