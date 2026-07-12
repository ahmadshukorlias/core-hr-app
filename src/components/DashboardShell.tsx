'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Logo } from './Logo'

function getNavItems(profile: { id: string; role: string }) {
  const isManager = profile.role === 'admin' || profile.role === 'hr'

  const items = [
    { href: '/dashboard', label: 'Dashboard' },
    isManager
      ? { href: '/dashboard/employees', label: 'Employees' }
      : { href: `/dashboard/employees/${profile.id}`, label: 'My Profile' },
  ]

  if (isManager) {
    items.push(
      { href: '/dashboard/departments', label: 'Departments' },
      { href: '/dashboard/positions', label: 'Positions' },
    )
  }

  items.push(
    { href: '/dashboard/leave', label: 'Leave' },
    { href: '/dashboard/attendance', label: 'Attendance' },
    { href: '/dashboard/documents', label: 'Documents' },
    { href: '/dashboard/calendar', label: 'Calendar' },
  )

  return items
}

function NavLink({ href, label, onClick }: { href: string; label: string; onClick?: () => void }) {
  const pathname = usePathname()
  const isActive = href === '/dashboard' ? pathname === href : pathname.startsWith(href)

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`group relative block rounded-lg px-3 py-2.5 text-sm transition-colors ${
        isActive ? 'bg-white/10 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'
      }`}
    >
      {label}
      <span
        className={`accent-bar absolute bottom-1 left-3 right-3 h-[2px] rounded-full transition-transform duration-200 ${
          isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
        }`}
      />
    </Link>
  )
}

export function DashboardShell({
  profile,
  logoutAction,
  children,
}: {
  profile: { id: string; full_name: string; role: string }
  logoutAction: () => void
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Close the drawer automatically whenever the route changes
  useEffect(() => setOpen(false), [pathname])

  const navItems = getNavItems(profile)

  const sidebarContent = (
    <>
      <div className="mb-8 flex items-center gap-2 px-1">
        <Logo variant="icon" />
        <div>
          <p className="font-display text-sm font-semibold leading-tight">Synergy</p>
          <p className="text-[11px] leading-tight text-white/60">HR Management</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <NavLink key={item.href} href={item.href} label={item.label} onClick={() => setOpen(false)} />
        ))}
      </nav>

      <div className="mt-auto border-t border-white/10 pt-4">
        <p className="px-1 text-sm font-medium">{profile.full_name}</p>
        <p className="px-1 text-xs uppercase tracking-wide text-white/50">{profile.role}</p>
        <form action={logoutAction} className="mt-3">
          <button className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-white/70 hover:bg-white/10 hover:text-white">
            Log out
          </button>
        </form>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-[#F7F9FA] md:flex">
      {/* Mobile top bar — only visible below md */}
      <header className="flex items-center justify-between border-b border-[#E3E8EB] bg-white px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <Logo variant="icon" />
          <span className="font-display text-sm font-semibold text-[#1E293B]">Synergy</span>
        </div>
        <button
          aria-label="Open menu"
          onClick={() => setOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-[#1E293B] hover:bg-[#F7F9FA] active:scale-95"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {/* Backdrop overlay for mobile drawer */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar: static column on desktop, slide-in drawer on mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[80%] flex-col p-5 text-white transition-transform duration-300 ease-out
          md:static md:z-auto md:w-64 md:max-w-none md:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: 'linear-gradient(180deg, #0E4A56 0%, #17394A 100%)' }}
      >
        <button
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 md:hidden"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        {sidebarContent}
      </aside>

      <main className="flex-1 p-4 md:p-8">{children}</main>
    </div>
  )
}