import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('_test').select('*').limit(1)

  return (
    <main className="p-8">
      <h1 className="text-xl font-bold">Supabase Connection Test</h1>
      <p className="mt-2">
        {error ? `Expected error (no table yet): ${error.message}` : 'Connected!'}
      </p>
    </main>
  )
}