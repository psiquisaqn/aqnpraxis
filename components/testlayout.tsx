'use client'

import { ReactNode, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CancelSessionButton } from '@/components/CancelSession'

interface TestLayoutProps {
  sessionId: string
  patientName: string
  testName: string
  testCode: string
  totalItems: number
  completed: number
  currentIndex: number
  onNavigate: (index: number) => void
  onSubmit: () => void
  saving?: boolean
  children: ReactNode
  sidebarContent?: ReactNode
}

export function TestLayout({
  sessionId,
  patientName,
  testName,
  testCode,
  totalItems,
  completed,
  currentIndex,
  onNavigate,
  onSubmit,
  saving = false,
  children,
  sidebarContent
}: TestLayoutProps) {
  const router = useRouter()
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isMobile = windowWidth < 768
  const isTablet = windowWidth >= 768 && windowWidth < 1024
  const pct = Math.round((completed / totalItems) * 100)
  const allDone = completed === totalItems

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b px-4 py-2 flex items-center gap-3 bg-white border-gray-200">
        <button
          onClick={() => router.back()}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-gray-500">
            <path d="M12 15L7 10L12 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-gray-900 truncate">
            {patientName || 'Cargando…'}
          </div>
          <div className="text-xs flex items-center gap-2 text-gray-400">
            <span>{testName}</span>
            <span>•</span>
            <span>{completed}/{totalItems}</span>
            <div className="flex-1 max-w-24">
              <div className="h-1.5 rounded-full overflow-hidden bg-gray-100">
                <div className="h-full rounded-full transition-all bg-blue-500" style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>
        </div>
        
        {isMobile && (
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-gray-600">
              <path d="M4 5h12M4 10h12M4 15h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        )}
        
        <button
          onClick={onSubmit}
          disabled={!allDone || saving}
          className="text-xs font-medium px-3 py-1.5 rounded-lg text-white whitespace-nowrap transition-colors"
          style={{ background: allDone && !saving ? '#3B82F6' : '#E5E7EB' }}
        >
          {saving ? 'Calculando…' : allDone ? 'Ver resultados' : `${totalItems - completed} restantes`}
        </button>
        <CancelSessionButton sessionId={sessionId} />
      </header>

      <div className="flex flex-1 relative">
        {/* Main content */}
        <main className={`flex-1 transition-all ${isMobile && sidebarOpen ? 'blur-sm pointer-events-none' : ''}`}>
          {children}
        </main>

        {/* Sidebar */}
        <aside className={`
          ${isMobile ? `
            fixed top-0 right-0 h-full w-72 z-30 transform transition-transform duration-300 ease-in-out shadow-xl bg-white
            ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}
          ` : 'w-72 border-l relative bg-gray-50'}
          flex flex-col gap-4 p-4
        `}>
          {isMobile && (
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <span className="font-medium text-sm text-gray-900">Progreso</span>
              <button onClick={() => setSidebarOpen(false)} className="p-1">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-gray-400">
                  <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          )}
          
          {sidebarContent}
        </aside>

        {isMobile && sidebarOpen && (
          <div className="fixed inset-0 bg-black/30 z-20" onClick={() => setSidebarOpen(false)} />
        )}
      </div>
    </div>
  )
}
