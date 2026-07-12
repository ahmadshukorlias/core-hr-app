import { getProfile } from '@/lib/auth/getProfile'
import { createClient } from '@/lib/supabase/server'
import { HeadcountWidget } from '@/components/HeadcountWidget'
import { postAnnouncement } from './actions'
import Link from 'next/link'

function StatCard({
  label, value, sub, href, accent,
}: { label: string; value: string | number; sub?: string; href: string; accent: string }) {
  return (
    <Link
      href={href}
      className="min-w-[75%] shrink-0 snap-start rounded-xl border border-[#E3E8EB] bg-white p-4 hover:-translate-y-px hover:shadow-md md:min-w-0"
    >
      <div className="h-1 w-8 rounded-full" style={{ background: accent }} />
      <p className="mt-3 font-display text-2xl font-bold text-[#1E293B]">{value}</p>
      <p className="text-xs text-[#5B6670]">{label}</p>
      {sub && <p className="text-[11px] text-[#5B6670]">{sub}</p>}
    </Link>
  )
}

export default async function DashboardPage() {
  const profile = await getProfile()
  const isManager = profile.role === 'admin' || profile.role === 'hr'
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data: headcountRows } = await supabase.rpc('get_headcount_stats')

  const { data: announcements } = await supabase
    .from('announcements')
    .select('id, title, content, created_at, profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(5)

  const { count: pendingLeaveCount } = isManager
    ? await supabase.from('leave_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending')
    : { count: null }

  const { count: presentTodayCount } = isManager
    ? await supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('date', today)
    : { count: null }

  const { count: myPendingCount } = await supabase
    .from('leave_requests')
    .select('id', { count: 'exact', head: true })
    .eq('employee_id', profile.id)
    .eq('status', 'pending')

  const { data: upcomingHolidays } = await supabase
    .from('public_holidays')
    .select('name, date')
    .gte('date', today)
    .order('date')
    .limit(3)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#1E293B]">
          Welcome back, {profile.full_name.split(' ')[0]}
        </h1>
        <p className="text-sm text-[#5B6670]">Here's what's happening at Synergy Solutions today.</p>
      </div>

      {/* Stat cards: horizontal swipe carousel on mobile, grid on desktop */}
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 md:pb-0">
        {isManager ? (
          <>
            <StatCard label="Pending Leave Requests" value={pendingLeaveCount ?? 0} href="/dashboard/leave" accent="#3D6E93" />
            <StatCard label="Clocked In Today" value={presentTodayCount ?? 0} href="/dashboard/attendance" accent="#4FA3A0" />
            <StatCard label="Next Public Holiday" value={upcomingHolidays?.[0]?.name ?? '—'} sub={upcomingHolidays?.[0]?.date} href="/dashboard/calendar" accent="#0E4A56" />
          </>
        ) : (
          <>
            <StatCard label="My Pending Requests" value={myPendingCount ?? 0} href="/dashboard/leave" accent="#3D6E93" />
            <StatCard label="Next Public Holiday" value={upcomingHolidays?.[0]?.name ?? '—'} sub={upcomingHolidays?.[0]?.date} href="/dashboard/calendar" accent="#4FA3A0" />
            <StatCard label="My Role" value={profile.role.toUpperCase()} href="/dashboard/employees" accent="#0E4A56" />
          </>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-4 md:col-span-2">
          <h2 className="font-display text-lg font-semibold text-[#1E293B]">Company Updates</h2>

          {isManager && (
            <form action={postAnnouncement} className="space-y-2 rounded-xl border border-[#E3E8EB] bg-white p-4">
              <input name="title" placeholder="Announcement title" required className="w-full rounded-lg border border-[#E3E8EB] p-2 text-sm" />
              <textarea name="content" placeholder="Write an update for everyone..." required rows={2} className="w-full rounded-lg border border-[#E3E8EB] p-2 text-sm" />
              <button className="rounded-lg bg-[#0E4A56] px-4 py-2 text-sm text-white hover:-translate-y-px hover:shadow-md">Post Update</button>
            </form>
          )}

          <div className="space-y-3">
            {announcements?.map((a: any) => (
              <div key={a.id} className="rounded-xl border border-[#E3E8EB] bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-medium text-[#1E293B]">{a.title}</h3>
                  <span className="shrink-0 text-[11px] text-[#5B6670]">{new Date(a.created_at).toLocaleDateString()}</span>
                </div>
                <p className="mt-1 text-sm text-[#5B6670]">{a.content}</p>
                <p className="mt-2 text-[11px] text-[#5B6670]">— {a.profiles?.full_name ?? 'HR'}</p>
              </div>
            ))}
            {(!announcements || announcements.length === 0) && (
              <p className="text-sm text-[#5B6670]">No updates yet.</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <HeadcountWidget initial={headcountRows ?? []} />

          <div className="rounded-xl border border-[#E3E8EB] bg-white p-5">
            <h3 className="font-display text-sm font-semibold text-[#1E293B]">Upcoming Holidays</h3>
            <div className="mt-3 space-y-2">
              {upcomingHolidays?.map((h) => (
                <div key={h.date} className="flex justify-between text-sm">
                  <span className="text-[#1E293B]">{h.name}</span>
                  <span className="text-[#5B6670]">{h.date}</span>
                </div>
              ))}
              {(!upcomingHolidays || upcomingHolidays.length === 0) && (
                <p className="text-sm text-[#5B6670]">None scheduled.</p>
              )}
            </div>
            <Link href="/dashboard/calendar" className="mt-3 block text-xs text-[#3D6E93] hover:underline">
              View calendar →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}