'use server'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/getProfile'
import { requireRole } from '@/lib/auth/requireRole'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const LATE_CUTOFF_HOUR = 9
const LATE_CUTOFF_MINUTE = 15

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

export async function clockIn() {
  const profile = await getProfile()
  const supabase = await createClient()

  const today = todayStr()
  const now = new Date()

  const isLate =
    now.getHours() > LATE_CUTOFF_HOUR ||
    (now.getHours() === LATE_CUTOFF_HOUR && now.getMinutes() > LATE_CUTOFF_MINUTE)

  const { error } = await supabase.from('attendance').insert({
    employee_id: profile.id,
    date: today,
    clock_in: now.toISOString(),
    status: isLate ? 'late' : 'present',
  })

  if (error) {
    // Most common cause: unique constraint (already clocked in today)
    redirect(`/dashboard/attendance?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/attendance')
  redirect('/dashboard/attendance?success=clocked_in')
}

export async function clockOut() {
  const profile = await getProfile()
  const supabase = await createClient()

  const today = todayStr()

  const { error } = await supabase
    .from('attendance')
    .update({ clock_out: new Date().toISOString() })
    .eq('employee_id', profile.id)
    .eq('date', today)

  if (error) {
    redirect(`/dashboard/attendance?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/attendance')
  redirect('/dashboard/attendance?success=clocked_out')
}

// Admin/HR: create or correct any employee's record for any date
export async function upsertAttendance(formData: FormData) {
  await requireRole(['admin', 'hr'])
  const supabase = await createClient()

  const employeeId = formData.get('employee_id') as string
  const date = formData.get('date') as string
  const clockIn = (formData.get('clock_in') as string) || null
  const clockOut = (formData.get('clock_out') as string) || null
  const status = formData.get('status') as string
  const notes = (formData.get('notes') as string) || null

  const { error } = await supabase.from('attendance').upsert(
    {
      employee_id: employeeId,
      date,
      clock_in: clockIn ? new Date(`${date}T${clockIn}`).toISOString() : null,
      clock_out: clockOut ? new Date(`${date}T${clockOut}`).toISOString() : null,
      status,
      notes,
    },
    { onConflict: 'employee_id,date' }
  )

  if (error) {
    redirect(`/dashboard/attendance?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/attendance')
  redirect('/dashboard/attendance?success=saved')
}