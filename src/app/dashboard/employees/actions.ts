'use server'

import { getProfile } from '@/lib/auth/getProfile'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/requireRole'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createEmployee(formData: FormData) {
  // Only admin/hr can create employees
  await requireRole(['admin', 'hr'])

  const fullName = formData.get('full_name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const role = formData.get('role') as string
  const departmentId = formData.get('department_id') as string || null
  const positionId = formData.get('position_id') as string || null

  const adminClient = createAdminClient()

  // Step 1: create the auth user — this fires the handle_new_user trigger,
  // which creates a basic profiles row automatically
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // skip email verification for MVP
    user_metadata: {
      full_name: fullName,
      role,
    },
  })

  if (authError || !authData.user) {
    redirect(`/dashboard/employees/new?error=${encodeURIComponent(authError?.message ?? 'Failed to create user')}`)
  }

  // Step 2: fill in the extra fields the trigger doesn't set
  // (trigger only sets id, full_name, email, role)
  const supabase = await createClient()
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      department_id: departmentId,
      position_id: positionId,
    })
    .eq('id', authData.user.id)

  if (updateError) {
    redirect(`/dashboard/employees/new?error=${encodeURIComponent(updateError.message)}`)
  }

  revalidatePath('/dashboard/employees')
  redirect('/dashboard/employees')
}

export async function updateEmployee(formData: FormData) {
  const profile = await getProfile()
  const targetId = formData.get('id') as string

  const isSelf = profile.id === targetId
  const isManager = profile.role === 'admin' || profile.role === 'hr'

  if (!isSelf && !isManager) {
    redirect('/dashboard/employees?error=unauthorized')
  }

  const supabase = await createClient()

  // Fields anyone (including self) can edit
  const updates: Record<string, any> = {
    full_name: formData.get('full_name') as string,
    phone: formData.get('phone') as string || null,
    date_of_birth: formData.get('date_of_birth') as string || null,
  }

  // Fields only admin/hr can edit
  if (isManager) {
    updates.role = formData.get('role') as string
    updates.department_id = (formData.get('department_id') as string) || null
    updates.position_id = (formData.get('position_id') as string) || null
    updates.employment_status = formData.get('employment_status') as string
  }

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', targetId)

  if (error) {
    redirect(`/dashboard/employees/${targetId}?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/employees')
  revalidatePath(`/dashboard/employees/${targetId}`)
  redirect(`/dashboard/employees/${targetId}?success=1`)
}