import { getProfile } from '@/lib/auth/getProfile'
import { createClient } from '@/lib/supabase/server'
import { createPosition, updatePosition, deletePosition } from './actions'

export default async function PositionsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const profile = await getProfile()
  const { error } = await searchParams
  const canManage = profile.role === 'admin' || profile.role === 'hr'

  const supabase = await createClient()
  const { data: positions } = await supabase
    .from('positions')
    .select('id, title, department_id, departments(name)')
    .order('title')

  const { data: departments } = await supabase
    .from('departments')
    .select('id, name')
    .order('name')

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold">Positions</h1>

      {error && (
        <p className="mt-4 rounded bg-red-50 p-2 text-sm text-red-600">
          {error.includes('foreign key')
            ? 'Cannot delete: employees are still assigned to this position.'
            : error}
        </p>
      )}

      {canManage && (
        <form action={createPosition} className="mt-6 flex gap-2">
          <input
            name="title"
            placeholder="Position title"
            required
            className="flex-1 rounded border border-gray-300 p-2 text-sm"
          />
          <select name="department_id" className="rounded border border-gray-300 p-2 text-sm">
            <option value="">— No department —</option>
            {departments?.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <button type="submit" className="rounded bg-black px-4 py-2 text-sm text-white hover:bg-gray-800">
            Add
          </button>
        </form>
      )}

      <ul className="mt-6 divide-y divide-gray-200">
        {positions?.map((pos: any) => (
          <li key={pos.id} className="py-3">
            {canManage ? (
              <form action={updatePosition} className="flex items-center gap-2">
                <input type="hidden" name="id" value={pos.id} />
                <input
                  name="title"
                  defaultValue={pos.title}
                  className="flex-1 rounded border border-gray-300 p-2 text-sm"
                />
                <select
                  name="department_id"
                  defaultValue={pos.department_id ?? ''}
                  className="rounded border border-gray-300 p-2 text-sm"
                >
                  <option value="">— No department —</option>
                  {departments?.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                <button type="submit" className="rounded border px-3 py-2 text-xs hover:bg-gray-50">
                  Save
                </button>
                <button
                  type="submit"
                  formAction={deletePosition}
                  className="rounded border border-red-200 px-3 py-2 text-xs text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </form>
            ) : (
              <div>
                <p className="font-medium">{pos.title}</p>
                <p className="text-sm text-gray-500">{pos.departments?.name ?? 'No department'}</p>
              </div>
            )}
          </li>
        ))}
      </ul>

      {(!positions || positions.length === 0) && (
        <p className="mt-6 text-gray-500">No positions yet.</p>
      )}
    </div>
  )
}