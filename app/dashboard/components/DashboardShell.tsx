'use client'

import { useState, useEffect } from 'react'
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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) {
        setSidebarOpen(false)
      }
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const initials = profile?.full_name
    ?.split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() ?? '?'

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Botón hamburguesa para móvil */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-md border border-gray-200"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-gray-600">
          <path d="M3 5h14M3 10h14M3 15h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Sidebar - overlay en móvil, fijo en desktop */}
      <aside
        className={`
          fixed md:sticky top-0 left-0 h-screen z-40
          transition-transform duration-300 ease-in-out
          bg-white border-r border-gray-200
          ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'}
          ${isMobile ? 'w-64 shadow-xl' : 'w-64'}
        `}
      >
        {/* Header con logo */}
        <div className="flex items-center justify-between px-4 border-b border-gray-200 py-3">
          <div className="w-full flex justify-center">
          <img 
  src="/isotipoaqnpraxis.png" 
  alt="AQN Praxis" 
  className="w-auto h-10 object-contain"
  style={{ filter: 'brightness(0.9) sepia(1) hue-rotate(170deg) saturate(3)' }}
/>
          </div>
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-lg hover:bg-gray-100 absolute right-4"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-gray-500">
                <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>

        {/* Navegación */}
        <nav className="flex-1 py-3 px-2 space-y-0.5">
          {NAV.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => isMobile && setSidebarOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150"
                style={{
                  color: active ? '#3B82F6' : '#6B7280',
                  background: active ? '#EFF6FF' : 'transparent',
                }}
              >
                <span className="shrink-0">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Perfil + logout */}
        <div className="border-t border-gray-200 p-3">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white bg-blue-600">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-800 truncate">
                {profile?.full_name}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {profile?.plan === 'free' ? 'Plan gratuito' : `Plan ${profile?.plan}`}
              </p>
            </div>
          </div>

          <form action={logout} className="mt-1">
            <button
              type="submit"
              className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-all duration-150"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
                <path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3M10.5 11l3-3-3-3M13.5 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Salir</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Overlay para móvil */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-auto pt-16 md:pt-0">
        {children}
      </main>
    </div>
  )
}