'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/auth/actions'

interface Props {
  profile: {
    full_name: string
    email: string
    plan: string
    specialty?: string
    avatar_url?: string
  } | null
  children: React.ReactNode
}

const NAV = [
  {
    href: '/dashboard',
    label: 'Pacientes',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M9 9a3.5 3.5 0 100-7 3.5 3.5 0 000 7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M2 16c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/agenda',
    label: 'Agenda',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="2" y="3.5" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M6 2v3M12 2v3M2 7.5h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="6" cy="11" r="1" fill="currentColor"/>
        <circle cx="9" cy="11" r="1" fill="currentColor"/>
        <circle cx="12" cy="11" r="1" fill="currentColor"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/informes',
    label: 'Informes',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M4 2h7l4 4v10a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M11 2v4h4M6 9h6M6 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
]

export function DashboardShell({ profile, children }: Props) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const initials = profile?.full_name
    ?.split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() ?? '?'

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--stone-100)' }}>
      {/* Sidebar */}
      <aside
        className="flex flex-col sticky top-0 h-screen shrink-0 transition-all duration-200 border-r"
        style={{
          width: collapsed ? '64px' : '220px',
          background: 'var(--stone-900)',
          borderColor: 'rgba(255,255,255,0.06)',
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-4 border-b"
          style={{
            height: '60px',
            borderColor: 'rgba(255,255,255,0.06)',
            overflow: 'hidden',
          }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'var(--teal-600)' }}
          >
            <svg width="16" height="16" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="2" fill="white"/>
              <path d="M11 6v5.5l3.5 2" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          {!collapsed && (
            <span
              className="font-semibold text-sm text-white truncate"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              AQN Praxis
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5">
          {NAV.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150"
                style={{
                  color: active ? 'white' : 'rgba(255,255,255,0.5)',
                  background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                }}
              >
                <span className="shrink-0">{item.icon}</span>
                {!collapsed && item.label}
              </Link>
            )
          })}
        </nav>

        {/* Perfil + logout */}
        <div
          className="border-t p-3"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-3 px-2 py-2 overflow-hidden">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white"
              style={{ background: 'var(--teal-700)' }}
            >
              {initials}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">
                  {profile?.full_name}
                </p>
                <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {profile?.plan === 'free' ? 'Plan gratuito' : `Plan ${profile?.plan}`}
                </p>
              </div>
            )}
          </div>

          <form action={logout} className="mt-1">
            <button
              type="submit"
              className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm transition-all duration-150"
              style={{ color: 'rgba(255,255,255,0.4)', overflow: 'hidden', whiteSpace: 'nowrap' }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
                <path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3M10.5 11l3-3-3-3M13.5 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {!collapsed && 'Salir'}
            </button>
          </form>
        </div>

        {/* Toggle collapse */}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="absolute -right-3 top-[72px] w-6 h-6 rounded-full border flex items-center justify-center"
          style={{
            background: 'var(--stone-900)',
            borderColor: 'rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.5)',
          }}
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
          >
            <path d="M6.5 2L3.5 5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  )
}
