import { getProfile } from '@/lib/auth/getProfile'
import { createClient } from '@/lib/supabase/server'
import { CalendarView } from '@/components/CalendarView'
import { addHoliday, deleteHoliday } from './actions'

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>
}) {
  const profile = await getProfile()
  const { error, success } = await searchParams
  const isManager = profile.role === 'admin' || profile.role === 'hr'
  const supabase = await createClient()
  const year = new Date().getFullYear()

  const { data: holidays } = await supabase
    .from('public_holidays')
    .select('id, name, date')
    .gte('date', `${year}-01-01`)
    .lte('date', `${year}-12-31`)
    .order('date')

  const { data: leaveRequests } = await supabase
    .from('leave_requests')
    .select('start_date, end_date, leave_types(name), profiles!leave_requests_employee_id_fkey(full_name)')
    .eq('status', 'approved')

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="font-display text-2xl font-bold text-[#1E293B]">Calendar</h1>
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
      {success && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-600">Done.</p>}

      <CalendarView holidays={holidays ?? []} leaveRequests={(leaveRequests as any) ?? []} />

      {isManager && (
        <section className="rounded-xl border border-[#E3E8EB] bg-white p-4">
          <h2 className="font-display text-sm font-semibold text-[#1E293B]">Manage Public Holidays</h2>
          <form action={addHoliday} className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input name="name" placeholder="Holiday name" required className="flex-1 rounded-lg border border-[#E3E8EB] p-2 text-sm" />
            <input name="date" type="date" required className="rounded-lg border border-[#E3E8EB] p-2 text-sm" />
            <button className="rounded-lg bg-[#0E4A56] px-4 py-2 text-sm text-white hover:-translate-y-px">Add</button>
          </form>
          <ul className="mt-4 divide-y divide-[#E3E8EB]">
            {holidays?.map((h) => (
              <li key={h.id} className="flex items-center justify-between py-2 text-sm">
                <span>{h.name} — {h.date}</span>
                <form action={deleteHoliday}>
                  <input type="hidden" name="id" value={h.id} />
                  <button className="text-xs text-red-600 hover:underline">Delete</button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}