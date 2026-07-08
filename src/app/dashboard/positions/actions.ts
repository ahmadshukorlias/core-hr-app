'use server'

import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/requireRole'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createPosition(formData: FormData) {
  await requireRole(['admin', 'hr'])

  const title = formData.get('title') as string
  const departmentId = (formData.get('department_id') as string) || null

  const supabase = await createClient()
  const { error } = await supabase.from('positions').insert({ title, department_id: departmentId })

  if (error) {
    redirect(`/dashboard/positions?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/positions')
  redirect('/dashboard/positions')
}

export async function updatePosition(formData: FormData) {
  await requireRole(['admin', 'hr'])

  const id = formData.get('id') as string
  const title = formData.get('title') as string
  const departmentId = (formData.get('department_id') as string) || null

  const supabase = await createClient()
  const { error } = await supabase
    .from('positions')
    .update({ title, department_id: departmentId })
    .eq('id', id)

  if (error) {
    redirect(`/dashboard/positions?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/positions')
  redirect('/dashboard/positions')
}

export async function deletePosition(formData: FormData) {
  await requireRole(['admin', 'hr'])

  const id = formData.get('id') as string
  const supabase = await createClient()
  const { error } = await supabase.from('positions').delete().eq('id', id)

  if (error) {
    redirect(`/dashboard/positions?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/positions')
  redirect('/dashboard/positions')
}