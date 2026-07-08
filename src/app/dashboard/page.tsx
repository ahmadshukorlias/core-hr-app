import { getProfile } from '@/lib/auth/getProfile'

export default async function DashboardPage() {
  const profile = await getProfile()

  return (
    <div>
      <h1 className="text-2xl font-bold">Welcome, {profile.full_name}</h1>
      <p className="mt-2 text-gray-600">Role: {profile.role}</p>
    </div>
  )
}