import { getProfile } from '@/lib/auth/getProfile'
import { createClient } from '@/lib/supabase/server'
import { clockIn, clockOut, upsertAttendance } from './actions'

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function formatTime(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>
}) {
  const profile = await getProfile()
  const { error, success } = await searchParams
  const isManager = profile.role === 'admin' || profile.role === 'hr'
  const today = todayStr()

  const supabase = await createClient()

  // My today's record
  const { data: myToday } = await supabase
    .from('attendance')
    .select('*')
    .eq('employee_id', profile.id)
    .eq('date', today)
    .maybeSingle()

  // My recent history (last 14 records)
  const { data: myHistory } = await supabase
    .from('attendance')
    .select('*')
    .eq('employee_id', profile.id)
    .order('date', { ascending: false })
    .limit(14)

  // Admin/HR: everyone's records for today
  const { data: todayAll } = isManager
    ? await supabase
        .from('attendance')
        .select('id, employee_id, date, clock_in, clock_out, status, notes, profiles(full_name)')
        .eq('date', today)
        .order('clock_in')
    : { data: null }

  const { data: employees } = isManager
    ? await supabase.from('profiles').select('id, full_name').order('full_name')
    : { data: null }

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Attendance</h1>
        {error && <p className="mt-4 rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>}
        {success && <p className="mt-4 rounded bg-green-50 p-2 text-sm text-green-600">Saved.</p>}
      </div>

      {/* My clock in/out */}
      <section className="rounded border border-gray-200 p-4">
        <h2 className="text-lg font-semibold">Today — {today}</h2>
        <p className="mt-1 text-sm text-gray-500">
          Clock in: {formatTime(myToday?.clock_in)} · Clock out: {formatTime(myToday?.clock_out)}
          {myToday?.status && <span className="ml-2 capitalize">({myToday.status})</span>}
        </p>
        <div className="mt-3 flex gap-2">
          {!myToday && (
            <form action={clockIn}>
              <button className="rounded bg-black px-4 py-2 text-sm text-white hover:bg-gray-800">
                Clock In
              </button>
            </form>
          )}
          {myToday && !myToday.clock_out && (
            <form action={clockOut}>
              <button className="rounded bg-black px-4 py-2 text-sm text-white hover:bg-gray-800">
                Clock Out
              </button>
            </form>
          )}
          {myToday?.clock_out && (
            <p className="text-sm text-gray-500">You've completed attendance for today.</p>
          )}
        </div>
      </section>

      {/* My history */}
      <section>
        <h2 className="text-lg font-semibold">My Recent History</h2>
        <table className="mt-3 w-full text-left text-sm">
          <thead className="border-b border-gray-200 text-gray-500">
            <tr>
              <th className="py-2">Date</th>
              <th className="py-2">Clock In</th>
              <th className="py-2">Clock Out</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {myHistory?.map((rec) => (
              <tr key={rec.id} className="border-b border-gray-100">
                <td className="py-2">{rec.date}</td>
                <td className="py-2">{formatTime(rec.clock_in)}</td>
                <td className="py-2">{formatTime(rec.clock_out)}</td>
                <td className="py-2 capitalize">{rec.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!myHistory || myHistory.length === 0) && (
          <p className="mt-3 text-sm text-gray-500">No records yet.</p>
        )}
      </section>

      {/* Admin/HR: today's overview + correction form */}
      {isManager && (
        <>
          <section>
            <h2 className="text-lg font-semibold">Today — All Employees</h2>
            <table className="mt-3 w-full text-left text-sm">
              <thead className="border-b border-gray-200 text-gray-500">
                <tr>
                  <th className="py-2">Employee</th>
                  <th className="py-2">Clock In</th>
                  <th className="py-2">Clock Out</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {todayAll?.map((rec: any) => (
                  <tr key={rec.id} className="border-b border-gray-100">
                    <td className="py-2">{rec.profiles?.full_name}</td>
                    <td className="py-2">{formatTime(rec.clock_in)}</td>
                    <td className="py-2">{formatTime(rec.clock_out)}</td>
                    <td className="py-2 capitalize">{rec.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!todayAll || todayAll.length === 0) && (
              <p className="mt-3 text-sm text-gray-500">No one has clocked in yet today.</p>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold">Add / Correct Attendance Record</h2>
            <form action={upsertAttendance} className="mt-3 space-y-3 rounded border border-gray-200 p-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Employee</label>
                <select name="employee_id" required className="mt-1 w-full rounded border border-gray-300 p-2 text-sm">
                  {employees?.map((e) => (
                    <option key={e.id} value={e.id}>{e.full_name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <input name="date" type="date" required defaultValue={today} className="mt-1 w-full rounded border border-gray-300 p-2 text-sm" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">Clock In</label>
                  <input name="clock_in" type="time" className="mt-1 w-full rounded border border-gray-300 p-2 text-sm" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">Clock Out</label>
                  <input name="clock_out" type="time" className="mt-1 w-full rounded border border-gray-300 p-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select name="status" required className="mt-1 w-full rounded border border-gray-300 p-2 text-sm">
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                  <option value="on_leave">On Leave</option>
                  <option value="half_day">Half Day</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Notes (optional)</label>
                <input name="notes" className="mt-1 w-full rounded border border-gray-300 p-2 text-sm" />
              </div>
              <button type="submit" className="rounded bg-black px-4 py-2 text-sm text-white hover:bg-gray-800">
                Save
              </button>
            </form>
          </section>
        </>
      )}
    </div>
  )
}