'use server'

import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/requireRole'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function addHoliday(formData: FormData) {
  await requireRole(['admin', 'hr'])
  const supabase = await createClient()
  const { error } = await supabase.from('public_holidays').insert({
    name: formData.get('name') as string,
    date: formData.get('date') as string,
  })
  if (error) redirect(`/dashboard/calendar?error=${encodeURIComponent(error.message)}`)
  revalidatePath('/dashboard/calendar')
  redirect('/dashboard/calendar?success=added')
}

export async function deleteHoliday(formData: FormData) {
  await requireRole(['admin', 'hr'])
  const supabase = await createClient()
  const { error } = await supabase.from('public_holidays').delete().eq('id', formData.get('id') as string)
  if (error) redirect(`/dashboard/calendar?error=${encodeURIComponent(error.message)}`)
  revalidatePath('/dashboard/calendar')
  redirect('/dashboard/calendar?success=deleted')
}