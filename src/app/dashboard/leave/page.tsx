import { getProfile } from '@/lib/auth/getProfile'
import { createClient } from '@/lib/supabase/server'
import { requestLeave, cancelLeaveRequest, approveLeaveRequest, rejectLeaveRequest } from './actions'

export default async function LeavePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>
}) {
  const profile = await getProfile()
  const { error, success } = await searchParams
  const isManager = profile.role === 'admin' || profile.role === 'hr'

  const supabase = await createClient()

  const { data: leaveTypes } = await supabase
    .from('leave_types')
    .select('id, name')
    .order('name')

  const { data: myBalances } = await supabase
    .from('leave_balances')
    .select('leave_type_id, total_days, used_days, year, leave_types(name)')
    .eq('employee_id', profile.id)
    .eq('year', new Date().getFullYear())

  // Employees see only their own requests; admin/hr see everyone's (RLS enforces this automatically)
  const { data: requests } = await supabase
    .from('leave_requests')
    .select('id, start_date, end_date, days_requested, reason, status, created_at, leave_types(name), profiles!leave_requests_employee_id_fkey(full_name)')
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Leave</h1>

        {error && <p className="mt-4 rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>}
        {success && <p className="mt-4 rounded bg-green-50 p-2 text-sm text-green-600">Request {success}.</p>}
      </div>

      {/* My balances */}
      <section>
        <h2 className="text-lg font-semibold">My Leave Balance ({new Date().getFullYear()})</h2>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {myBalances?.map((b: any) => (
            <div key={b.leave_type_id} className="rounded border border-gray-200 p-3">
              <p className="text-sm text-gray-500">{b.leave_types?.name}</p>
              <p className="text-lg font-bold">{b.total_days - b.used_days} <span className="text-sm font-normal text-gray-500">/ {b.total_days} days left</span></p>
            </div>
          ))}
          {(!myBalances || myBalances.length === 0) && (
            <p className="col-span-3 text-sm text-gray-500">No balance records yet — submit a request to initialize one.</p>
          )}
        </div>
      </section>

      {/* Request form */}
      <section>
        <h2 className="text-lg font-semibold">Request Leave</h2>
        <form action={requestLeave} className="mt-3 space-y-3 rounded border border-gray-200 p-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Leave Type</label>
            <select name="leave_type_id" required className="mt-1 w-full rounded border border-gray-300 p-2 text-sm">
              {leaveTypes?.map((lt) => (
                <option key={lt.id} value={lt.id}>{lt.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input name="start_date" type="date" required className="mt-1 w-full rounded border border-gray-300 p-2 text-sm" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <input name="end_date" type="date" required className="mt-1 w-full rounded border border-gray-300 p-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Reason (optional)</label>
            <textarea name="reason" rows={2} className="mt-1 w-full rounded border border-gray-300 p-2 text-sm" />
          </div>
          <button type="submit" className="rounded bg-black px-4 py-2 text-sm text-white hover:bg-gray-800">
            Submit Request
          </button>
        </form>
      </section>

      {/* Requests list */}
      <section>
        <h2 className="text-lg font-semibold">{isManager ? 'All Leave Requests' : 'My Requests'}</h2>
        <table className="mt-3 w-full text-left text-sm">
          <thead className="border-b border-gray-200 text-gray-500">
            <tr>
              {isManager && <th className="py-2">Employee</th>}
              <th className="py-2">Type</th>
              <th className="py-2">Dates</th>
              <th className="py-2">Days</th>
              <th className="py-2">Status</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests?.map((r: any) => (
              <tr key={r.id} className="border-b border-gray-100">
                {isManager && <td className="py-2">{r.profiles?.full_name}</td>}
                <td className="py-2">{r.leave_types?.name}</td>
                <td className="py-2">{r.start_date} → {r.end_date}</td>
                <td className="py-2">{r.days_requested}</td>
                <td className="py-2 capitalize">{r.status}</td>
                <td className="py-2">
                  {r.status === 'pending' && !isManager && (
                    <form action={cancelLeaveRequest}>
                      <input type="hidden" name="id" value={r.id} />
                      <button className="text-xs text-red-600 hover:underline">Cancel</button>
                    </form>
                  )}
                  {r.status === 'pending' && isManager && (
                    <div className="flex gap-2">
                      <form action={approveLeaveRequest}>
                        <input type="hidden" name="id" value={r.id} />
                        <button className="rounded border border-green-200 px-2 py-1 text-xs text-green-700 hover:bg-green-50">Approve</button>
                      </form>
                      <form action={rejectLeaveRequest}>
                        <input type="hidden" name="id" value={r.id} />
                        <button className="rounded border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50">Reject</button>
                      </form>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!requests || requests.length === 0) && (
          <p className="mt-3 text-sm text-gray-500">No requests yet.</p>
        )}
      </section>
    </div>
  )
}