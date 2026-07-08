import { getProfile } from '@/lib/auth/getProfile'
import { logout } from '@/app/logout/actions'
import { Logo } from '@/components/Logo'
import Link from 'next/link'

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/employees', label: 'Employees' },
  { href: '/dashboard/departments', label: 'Departments' },
  { href: '/dashboard/positions', label: 'Positions' },
  { href: '/dashboard/leave', label: 'Leave' },
  { href: '/dashboard/attendance', label: 'Attendance' },
  { href: '/dashboard/documents', label: 'Documents' },
]

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getProfile()

  return (
    <div className="flex min-h-screen bg-[#F7F9FA]">
      <aside
        className="flex w-64 flex-col p-5 text-white"
        style={{ background: 'linear-gradient(180deg, #0E4A56 0%, #17394A 100%)' }}
      >
        <div className="mb-8 flex items-center gap-2 px-1">
          <Logo variant="icon" />
          <div>
            <p className="font-display text-sm font-semibold leading-tight">Synergy</p>
            <p className="text-[11px] leading-tight text-white/60">HR Management</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group relative block rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white"
            >
              {item.label}
              <span className="accent-bar absolute bottom-1 left-3 right-3 h-[2px] scale-x-0 rounded-full transition-transform duration-200 group-hover:scale-x-100" />
            </Link>
          ))}
        </nav>

        <div className="mt-auto border-t border-white/10 pt-4">
          <p className="px-1 text-sm font-medium">{profile.full_name}</p>
          <p className="px-1 text-xs uppercase tracking-wide text-white/50">{profile.role}</p>
          <form action={logout} className="mt-3">
            <button className="w-full rounded-lg px-3 py-2 text-left text-sm text-white/70 hover:bg-white/10 hover:text-white">
              Log out
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}