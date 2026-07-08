import { getProfile } from './getProfile'
import { redirect } from 'next/navigation'

export async function requireRole(allowedRoles: Array<'admin' | 'hr' | 'employee'>) {
  const profile = await getProfile()
  if (!allowedRoles.includes(profile.role)) {
    redirect('/dashboard?error=unauthorized')
  }
  return profile
}