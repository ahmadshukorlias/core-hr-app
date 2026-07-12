import { getProfile } from '@/lib/auth/getProfile'
import { createClient } from '@/lib/supabase/server'
import { cancelLeaveRequest, approveLeaveRequest, rejectLeaveRequest } from './actions'
import { LeaveCalendarSection } from './LeaveCalendarSection'

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
    .select('id, start_date, end_date, days_requested, is_half_day, reason, status, created_at, leave_types(name), profiles!leave_requests_employee_id_fkey(full_name)')
    .order('created_at', { ascending: false })

  // Own pending/approved events for the calendar (used to highlight booked dates)
  const { data: myLeaveEvents } = await supabase
    .from('leave_requests')
    .select('start_date, end_date, status, is_half_day, leave_types(name)')
    .eq('employee_id', profile.id)
    .in('status', ['pending', 'approved'])

  const { data: holidays } = await supabase
    .from('public_holidays')
    .select('id, name, date')
    .gte('date', `${new Date().getFullYear()}-01-01`)
    .lte('date', `${new Date().getFullYear()}-12-31`)
    .order('date')

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Leave</h1>

        {error && <p className="mt-4 rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>}
        {success && <p className="mt-4 rounded bg-green-50 p-2 text-sm text-green-600">Request {success}.</p>}
      </div>

      {/* My balances */}
      <section>
        <h2 className="text-lg font-semibold">My Leave Balance ({new Date().getFullYear()})</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
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

      {/* Calendar + Request form (click a date to pre-fill the request) */}
      <section>
        <LeaveCalendarSection
          leaveTypes={leaveTypes ?? []}
          myLeaveEvents={(myLeaveEvents as any) ?? []}
          holidays={holidays ?? []}
        />
      </section>

      {/* Requests list */}
      <section>
        <h2 className="text-lg font-semibold">{isManager ? 'All Leave Requests' : 'My Requests'}</h2>

        {/* Desktop table */}
        <table className="mt-3 hidden w-full text-left text-sm md:table">
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
                <td className="py-2">{r.days_requested}{r.is_half_day && ' (half-day)'}</td>
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

        {/* Mobile card list */}
        <div className="mt-3 space-y-3 md:hidden">
          {requests?.map((r: any) => (
            <div key={r.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  {isManager && <p className="font-medium text-gray-900">{r.profiles?.full_name}</p>}
                  <p className="text-sm text-gray-700">{r.leave_types?.name}</p>
                </div>
                <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium capitalize text-gray-700">
                  {r.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-500">{r.start_date} → {r.end_date}</p>
              <p className="text-sm text-gray-500">{r.days_requested} day{r.days_requested === 1 ? '' : 's'}{r.is_half_day && ' (half-day)'}</p>
              {r.reason && <p className="mt-1 text-xs text-gray-400">"{r.reason}"</p>}

              {r.status === 'pending' && !isManager && (
                <form action={cancelLeaveRequest} className="mt-3">
                  <input type="hidden" name="id" value={r.id} />
                  <button className="rounded border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50">Cancel</button>
                </form>
              )}
              {r.status === 'pending' && isManager && (
                <div className="mt-3 flex gap-2">
                  <form action={approveLeaveRequest}>
                    <input type="hidden" name="id" value={r.id} />
                    <button className="rounded border border-green-200 px-3 py-1.5 text-xs text-green-700 hover:bg-green-50">Approve</button>
                  </form>
                  <form action={rejectLeaveRequest}>
                    <input type="hidden" name="id" value={r.id} />
                    <button className="rounded border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50">Reject</button>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>

        {(!requests || requests.length === 0) && (
          <p className="mt-3 text-sm text-gray-500">No requests yet.</p>
        )}
      </section>
    </div>
  )
}
