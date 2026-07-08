'use server'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/getProfile'
import { requireRole } from '@/lib/auth/requireRole'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function requestLeave(formData: FormData) {
  const profile = await getProfile()
  const supabase = await createClient()

  const leaveTypeId = formData.get('leave_type_id') as string
  const startDate = formData.get('start_date') as string
  const endDate = formData.get('end_date') as string
  const reason = (formData.get('reason') as string) || null

  const start = new Date(startDate)
  const end = new Date(endDate)

  if (end < start) {
    redirect(`/dashboard/leave?error=${encodeURIComponent('End date must be on or after start date')}`)
  }

  const daysRequested = Math.round((end.getTime() - start.getTime()) / 86400000) + 1
  const year = start.getFullYear()

  // Make sure a balance row exists for this employee/type/year (self-service via RPC)
  await supabase.rpc('ensure_leave_balance', { p_leave_type_id: leaveTypeId, p_year: year })

  const { error } = await supabase.from('leave_requests').insert({
    employee_id: profile.id,
    leave_type_id: leaveTypeId,
    start_date: startDate,
    end_date: endDate,
    days_requested: daysRequested,
    reason,
    status: 'pending',
  })

  if (error) {
    redirect(`/dashboard/leave?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/leave')
  redirect('/dashboard/leave?success=submitted')
}

export async function cancelLeaveRequest(formData: FormData) {
  const profile = await getProfile()
  const supabase = await createClient()
  const id = formData.get('id') as string

  const { error } = await supabase
    .from('leave_requests')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .eq('employee_id', profile.id)
    .eq('status', 'pending')

  if (error) {
    redirect(`/dashboard/leave?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/leave')
  redirect('/dashboard/leave?success=cancelled')
}

export async function approveLeaveRequest(formData: FormData) {
  await requireRole(['admin', 'hr'])
  const supabase = await createClient()
  const id = formData.get('id') as string

  const { error } = await supabase.rpc('approve_leave_request', { request_id: id })

  if (error) {
    redirect(`/dashboard/leave?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/leave')
  redirect('/dashboard/leave?success=approved')
}

export async function rejectLeaveRequest(formData: FormData) {
  const profile = await requireRole(['admin', 'hr'])
  const supabase = await createClient()
  const id = formData.get('id') as string

  const { error } = await supabase
    .from('leave_requests')
    .update({ status: 'rejected', reviewed_by: profile.id, reviewed_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'pending')

  if (error) {
    redirect(`/dashboard/leave?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/leave')
  redirect('/dashboard/leave?success=rejected')
}