import { login } from './actions'
import { Logo } from '@/components/Logo'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F9FA] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo />
        </div>

        <form
          action={login}
          className="space-y-4 rounded-2xl border border-[#E3E8EB] bg-white p-8 shadow-sm"
        >
          <h1 className="font-display text-xl font-semibold text-[#1E293B]">Sign in</h1>

          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>
          )}

          <div>
            <label className="block text-sm font-medium text-[#5B6670]">Email</label>
            <input
              name="email"
              type="email"
              required
              className="mt-1.5 w-full rounded-lg border border-[#E3E8EB] p-2.5 text-sm outline-none focus:border-[#4FA3A0] focus:ring-2 focus:ring-[#4FA3A0]/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#5B6670]">Password</label>
            <input
              name="password"
              type="password"
              required
              className="mt-1.5 w-full rounded-lg border border-[#E3E8EB] p-2.5 text-sm outline-none focus:border-[#4FA3A0] focus:ring-2 focus:ring-[#4FA3A0]/20"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-[#0E4A56] py-2.5 text-sm font-medium text-white hover:-translate-y-px hover:bg-[#0B3B45] hover:shadow-md"
          >
            Sign In
          </button>
        </form>
      </div>
    </main>
  )
}