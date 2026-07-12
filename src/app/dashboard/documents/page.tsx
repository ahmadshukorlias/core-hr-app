import { getProfile } from '@/lib/auth/getProfile'
import { createClient } from '@/lib/supabase/server'
import { uploadDocument, deleteDocument } from './actions'

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>
}) {
  const profile = await getProfile()
  const { error, success } = await searchParams
  const isManager = profile.role === 'admin' || profile.role === 'hr'

  const supabase = await createClient()

  // RLS: employees see only their own docs, admin/hr see all
  const { data: documents } = await supabase
    .from('documents')
    .select('id, file_name, file_type, uploaded_at, employee_id, file_path, profiles!documents_employee_id_fkey(full_name)')
    .order('uploaded_at', { ascending: false })

  const { data: employees } = isManager
    ? await supabase.from('profiles').select('id, full_name').order('full_name')
    : { data: null }

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Documents</h1>
        {error && <p className="mt-4 rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>}
        {success && <p className="mt-4 rounded bg-green-50 p-2 text-sm text-green-600">Done.</p>}
      </div>

      <section>
        <h2 className="text-lg font-semibold">Upload Document</h2>
        <form action={uploadDocument} className="mt-3 space-y-3 rounded border border-gray-200 p-4">
          {isManager && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Employee</label>
              <select name="employee_id" required className="mt-1 w-full rounded border border-gray-300 p-2 text-sm">
                {employees?.map((e) => (
                  <option key={e.id} value={e.id}>{e.full_name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700">File</label>
            <input name="file" type="file" required className="mt-1 w-full rounded border border-gray-300 p-2 text-sm" />
          </div>
          <button type="submit" className="rounded bg-black px-4 py-2 text-sm text-white hover:bg-gray-800">
            Upload
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-semibold">{isManager ? 'All Documents' : 'My Documents'}</h2>
        <table className="mt-3 w-full text-left text-sm">
          <thead className="border-b border-gray-200 text-gray-500">
            <tr>
              {isManager && <th className="py-2">Employee</th>}
              <th className="py-2">File Name</th>
              <th className="py-2">Uploaded</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents?.map((doc: any) => (
              <tr key={doc.id} className="border-b border-gray-100">
                {isManager && <td className="py-2">{doc.profiles?.full_name}</td>}
                <td className="py-2">{doc.file_name}</td>
                <td className="py-2">{new Date(doc.uploaded_at).toLocaleDateString()}</td>
                <td className="py-2">
                  <div className="flex flex-col gap-3 md:flex-row">
                    <a
                      href={`/dashboard/documents/${doc.id}/download`}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Download
                    </a>
                    {isManager && (
                      <form action={deleteDocument}>
                        <input type="hidden" name="id" value={doc.id} />
                        <input type="hidden" name="file_path" value={doc.file_path} />
                        <button className="text-xs text-red-600 hover:underline">Delete</button>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!documents || documents.length === 0) && (
          <p className="mt-3 text-sm text-gray-500">No documents yet.</p>
        )}
      </section>
    </div>
  )
}