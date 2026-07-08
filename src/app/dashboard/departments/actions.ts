'use server'

import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/requireRole'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createDepartment(formData: FormData) {
  await requireRole(['admin', 'hr'])

  const name = formData.get('name') as string
  const description = formData.get('description') as string || null

  const supabase = await createClient()
  const { error } = await supabase.from('departments').insert({ name, description })

  if (error) {
    redirect(`/dashboard/departments?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/departments')
  redirect('/dashboard/departments')
}

export async function updateDepartment(formData: FormData) {
  await requireRole(['admin', 'hr'])

  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const description = formData.get('description') as string || null

  const supabase = await createClient()
  const { error } = await supabase
    .from('departments')
    .update({ name, description })
    .eq('id', id)

  if (error) {
    redirect(`/dashboard/departments?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/departments')
  redirect('/dashboard/departments')
}

export async function deleteDepartment(formData: FormData) {
  await requireRole(['admin', 'hr'])

  const id = formData.get('id') as string
  const supabase = await createClient()
  const { error } = await supabase.from('departments').delete().eq('id', id)

  if (error) {
    // Most common cause: FK constraint (positions or profiles still reference it)
    redirect(`/dashboard/departments?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/departments')
  redirect('/dashboard/departments')
}