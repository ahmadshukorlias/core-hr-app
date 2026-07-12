'use server'

import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/requireRole'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function postAnnouncement(formData: FormData) {
  const profile = await requireRole(['admin', 'hr'])
  const supabase = await createClient()

  const { error } = await supabase.from('announcements').insert({
    title: formData.get('title') as string,
    content: formData.get('content') as string,
    created_by: profile.id,
  })

  if (error) redirect(`/dashboard?error=${encodeURIComponent(error.message)}`)
  revalidatePath('/dashboard')
  redirect('/dashboard?success=posted')
}