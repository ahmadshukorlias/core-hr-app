import { getProfile } from '@/lib/auth/getProfile'
import { logout } from '@/app/logout/actions'
import Link from 'next/link'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getProfile()

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-gray-900 p-4 text-white">
        <h2 className="mb-6 text-lg font-bold">Core HR</h2>
        <p className="mb-4 text-sm text-gray-400">
          {profile.full_name} · <span className="uppercase">{profile.role}</span>
        </p>
        <nav className="space-y-2 text-sm">
          <Link href="/dashboard" className="block hover:text-white">Dashboard</Link>
          <Link href="/dashboard/employees" className="block hover:text-white">Employees</Link>
          <Link href="/dashboard/departments" className="block hover:text-white">Departments</Link>
          <Link href="/dashboard/positions" className="block hover:text-white">Positions</Link>
          <Link href="/dashboard/leave" className="block hover:text-white">Leave</Link>
          <Link href="/dashboard/attendance" className="block hover:text-white">Attendance</Link>
          <Link href="/dashboard/documents" className="block hover:text-white">Documents</Link>
          </nav>
        <form action={logout} className="mt-8">
          <button className="text-sm text-gray-400 hover:text-white">
            Log out
          </button>
        </form>
      </aside>
      <main className="flex-1 bg-gray-50 p-8">{children}</main>
    </div>
  )
}