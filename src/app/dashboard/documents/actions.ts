'use server'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/getProfile'
import { requireRole } from '@/lib/auth/requireRole'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function uploadDocument(formData: FormData) {
  const profile = await getProfile()
  const supabase = await createClient()

  const file = formData.get('file') as File
  // Admin/HR can upload for any employee; regular employees only for themselves
  const targetEmployeeId = (formData.get('employee_id') as string) || profile.id

  if (!file || file.size === 0) {
    redirect('/dashboard/documents?error=' + encodeURIComponent('No file selected'))
  }

  const isManager = profile.role === 'admin' || profile.role === 'hr'
  const employeeId = isManager ? targetEmployeeId : profile.id

  // Sanitize filename and make it unique to avoid overwriting existing files
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')
  const path = `${employeeId}/${Date.now()}_${safeName}`

  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(path, file, { contentType: file.type });

  if (uploadError) {
    redirect(`/dashboard/documents?error=${encodeURIComponent(uploadError.message)}`)
  }

  const { error: dbError } = await supabase.from('documents').insert({
    employee_id: employeeId,
    file_name: file.name,
    file_path: path,
    file_type: file.type,
    uploaded_by: profile.id,
  })

  if (dbError) {
    // Roll back the uploaded file if the metadata insert fails, so we don't
    // end up with an orphaned file that has no matching row
    await supabase.storage.from('documents').remove([path])
    redirect(`/dashboard/documents?error=${encodeURIComponent(dbError.message)}`)
  }

  revalidatePath('/dashboard/documents')
  redirect('/dashboard/documents?success=uploaded')
}

export async function getDocumentUrl(documentId: string): Promise<string | null> {
  const supabase = await createClient()

  const { data: doc } = await supabase
    .from('documents')
    .select('file_path')
    .eq('id', documentId)
    .single()

  if (!doc) return null

  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(doc.file_path, 60) // valid for 60 seconds

  if (error) return null
  return data.signedUrl
}

export async function deleteDocument(formData: FormData) {
  await requireRole(['admin', 'hr'])
  const supabase = await createClient()
  const id = formData.get('id') as string
  const filePath = formData.get('file_path') as string

  const { error: storageError } = await supabase.storage.from('documents').remove([filePath])
  if (storageError) {
    redirect(`/dashboard/documents?error=${encodeURIComponent(storageError.message)}`)
  }

  const { error: dbError } = await supabase.from('documents').delete().eq('id', id)
  if (dbError) {
    redirect(`/dashboard/documents?error=${encodeURIComponent(dbError.message)}`)
  }

  revalidatePath('/dashboard/documents')
  redirect('/dashboard/documents?success=deleted')
}