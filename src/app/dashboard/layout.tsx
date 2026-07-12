import { getProfile } from '@/lib/auth/getProfile'
import { logout } from '@/app/logout/actions'
import { DashboardShell } from '@/components/DashboardShell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getProfile()

  return (
    <DashboardShell profile={profile} logoutAction={logout}>
      {children}
    </DashboardShell>
  )
}