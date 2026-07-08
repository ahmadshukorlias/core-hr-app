import { getProfile } from '@/lib/auth/getProfile'
import { createClient } from '@/lib/supabase/server'
import { createDepartment, updateDepartment, deleteDepartment } from './actions'

export default async function DepartmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const profile = await getProfile()
  const { error } = await searchParams
  const canManage = profile.role === 'admin' || profile.role === 'hr'

  const supabase = await createClient()
  const { data: departments } = await supabase
    .from('departments')
    .select('id, name, description')
    .order('name')

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold">Departments</h1>

      {error && (
        <p className="mt-4 rounded bg-red-50 p-2 text-sm text-red-600">
          {error.includes('foreign key')
            ? 'Cannot delete: employees or positions are still assigned to this department.'
            : error}
        </p>
      )}

      {canManage && (
        <form action={createDepartment} className="mt-6 flex gap-2">
          <input
            name="name"
            placeholder="Department name"
            required
            className="flex-1 rounded border border-gray-300 p-2 text-sm"
          />
          <input
            name="description"
            placeholder="Description (optional)"
            className="flex-1 rounded border border-gray-300 p-2 text-sm"
          />
          <button type="submit" className="rounded bg-black px-4 py-2 text-sm text-white hover:bg-gray-800">
            Add
          </button>
        </form>
      )}

      <ul className="mt-6 divide-y divide-gray-200">
        {departments?.map((dept) => (
          <li key={dept.id} className="py-3">
            {canManage ? (
              <form action={updateDepartment} className="flex items-center gap-2">
                <input type="hidden" name="id" value={dept.id} />
                <input
                  name="name"
                  defaultValue={dept.name}
                  className="flex-1 rounded border border-gray-300 p-2 text-sm"
                />
                <input
                  name="description"
                  defaultValue={dept.description ?? ''}
                  className="flex-1 rounded border border-gray-300 p-2 text-sm"
                />
                <button type="submit" className="rounded border px-3 py-2 text-xs hover:bg-gray-50">
                  Save
                </button>
                <button
                  type="submit"
                  formAction={deleteDepartment}
                  className="rounded border border-red-200 px-3 py-2 text-xs text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </form>
            ) : (
              <div>
                <p className="font-medium">{dept.name}</p>
                <p className="text-sm text-gray-500">{dept.description}</p>
              </div>
            )}
          </li>
        ))}
      </ul>

      {(!departments || departments.length === 0) && (
        <p className="mt-6 text-gray-500">No departments yet.</p>
      )}
    </div>
  )
}