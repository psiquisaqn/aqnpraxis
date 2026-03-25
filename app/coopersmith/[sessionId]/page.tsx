'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { CancelSessionButton } from '@/components/CancelSession'
import { COOPERSMITH_ITEMS, scoreCoopersmith, type CooperResponse, type CooperResponses } from '@/lib/coopersmith/engine'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function CoopersmithSessionPage() {
  const params    = useParams()
  const router    = useRouter()
  const sessionId = params.sessionId as string

  const [responses, setResponses]     = useState<CooperResponses>({})
  const [patientName, setPatientName] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [saving, setSaving]           = useState(false)
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Detectar tamaño de pantalla
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isMobile = windowWidth < 768
  const isTablet = windowWidth >= 768 && windowWidth < 1024

  // Determinar cuántos ítems mostrar por página
  const getItemsPerPage = () => {
    if (isMobile) return 1
    if (isTablet) return 4
    return 10
  }

  const itemsPerPage = getItemsPerPage()
  const totalPages = Math.ceil(COOPERSMITH_ITEMS.length / itemsPerPage)
  const currentPage = Math.floor(currentIndex / itemsPerPage)
  
  const pageItems = COOPERSMITH_ITEMS.slice(
    currentPage * itemsPerPage, 
    (currentPage + 1) * itemsPerPage
  )
  
  const completed = Object.keys(responses).length
  const pct = Math.round((completed / 58) * 100)
  const allDone = completed === 58

  useEffect(() => {
    if (!sessionId) return
    supabase.from('sessions').select('patient:patients(full_name)').eq('id', sessionId).single()
      .then(({ data }) => { if (data) setPatientName((data.patient as any)?.full_name ?? '') })
  }, [sessionId])

  const handleResponse = (item: number, val: CooperResponse) => {
    setResponses((prev) => ({ ...prev, [item]: val }))
    // En móvil, avanzar automáticamente después de responder
    if (isMobile && currentIndex < COOPERSMITH_ITEMS.length - 1) {
      setTimeout(() => setCurrentIndex(prev => prev + 1), 300)
    }
  }

  const handleSubmit = async () => {
    if (!allDone) return
    setSaving(true)
    try {
      const res = await fetch('/api/coopersmith/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, responses }),
      })
      if (res.ok) router.push('/resultados/coopersmith?session=' + sessionId)
    } finally {
      setSaving(false)
    }
  }

  const partial = completed > 0 ? scoreCoopersmith(responses) : null

  // Navegación
  const goNext = () => {
    if (currentPage < totalPages - 1) {
      setCurrentIndex((currentPage + 1) * itemsPerPage)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const goPrev = () => {
    if (currentPage > 0) {
      setCurrentIndex((currentPage - 1) * itemsPerPage)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const goToQuestion = (index: number) => {
    setCurrentIndex(index)
    if (isMobile) setSidebarOpen(false)
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--stone-50)' }}>
      {/* Header mejorado */}
      <header className="sticky top-0 z-20 border-b px-4 py-2 flex items-center gap-3" style={{ background: 'white', borderColor: 'var(--stone-200)' }}>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate" style={{ color: 'var(--stone-800)' }}>
            {patientName || 'Cargando…'}
          </div>
          <div className="text-xs flex items-center gap-2" style={{ color: 'var(--stone-400)' }}>
            <span>Coopersmith SEI</span>
            <span>•</span>
            <span>{completed}/58</span>
            <div className="flex-1 max-w-24">
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--stone-100)' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: 'var(--teal-500)' }} />
              </div>
            </div>
          </div>
        </div>
        
        {/* Botón para abrir sidebar en móvil */}
        {isMobile && (
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg"
            style={{ background: sidebarOpen ? 'var(--stone-100)' : 'transparent' }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ color: 'var(--stone-600)' }}>
              <path d="M4 5h12M4 10h12M4 15h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        )}
        
        <button
          onClick={handleSubmit}
          disabled={!allDone || saving}
          className="text-xs font-medium px-3 py-1.5 rounded-xl text-white whitespace-nowrap"
          style={{ background: allDone && !saving ? 'var(--teal-600)' : 'var(--stone-300)' }}
        >
          {saving ? 'Calculando…' : allDone ? 'Ver resultados' : `${58 - completed} restantes`}
        </button>
        <CancelSessionButton sessionId={sessionId} />
      </header>

      <div className="flex flex-1 relative">
        {/* Panel principal */}
        <main className={`flex-1 transition-all ${isMobile && sidebarOpen ? 'blur-sm pointer-events-none' : ''}`}>
          <div className="max-w-3xl mx-auto px-4 py-6">
            {/* Indicador de progreso visual */}
            <div className="mb-4 flex justify-between items-center text-xs" style={{ color: 'var(--stone-400)' }}>
              <span>Pregunta {currentIndex + 1} de {COOPERSMITH_ITEMS.length}</span>
              <div className="flex gap-1">
                {!isMobile && Array.from({ length: Math.min(58, totalPages) }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i * itemsPerPage)}
                    className="h-1 rounded-full transition-all"
                    style={{
                      width: currentPage === i ? '16px' : '6px',
                      background: currentPage === i ? 'var(--teal-500)' : 'var(--stone-300)'
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Preguntas */}
            <div className="space-y-3">
              {pageItems.map((item) => {
                const resp = responses[item.num]
                const isCurrent = isMobile && item.num === currentIndex + 1
                
                return (
                  <div
                    key={item.num}
                    className={`rounded-xl border transition-all ${
                      isMobile && !isCurrent ? 'hidden' : ''
                    }`}
                    style={{
                      background: resp ? 'white' : 'var(--stone-50)',
                      borderColor: resp ? 'var(--stone-200)' : 'var(--stone-100)',
                    }}
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <span className="text-xs font-mono w-6 shrink-0" style={{ color: 'var(--stone-400)' }}>
                          {item.num}
                        </span>
                        <p className="flex-1 text-sm leading-relaxed" style={{ color: 'var(--stone-700)' }}>
                          {item.text}
                        </p>
                      </div>
                      <div className="flex gap-2 mt-3 ml-9">
                        {(['igual', 'diferente'] as CooperResponse[]).map((val) => (
                          <button
                            key={val}
                            onClick={() => handleResponse(item.num, val)}
                            className="flex-1 text-sm font-medium py-2.5 rounded-lg border transition-all"
                            style={{
                              background: resp === val ? (val === 'igual' ? 'var(--teal-600)' : 'var(--stone-700)') : 'white',
                              color: resp === val ? 'white' : 'var(--stone-500)',
                              borderColor: resp === val ? 'transparent' : 'var(--stone-200)',
                            }}
                          >
                            {val === 'igual' ? '✓ Igual que yo' : '✗ No es como yo'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Navegación entre páginas */}
            <div className="flex items-center justify-between gap-3 mt-6">
              <button
                onClick={goPrev}
                disabled={currentPage === 0}
                className="flex-1 text-sm py-2.5 rounded-xl border"
                style={{ color: 'var(--stone-500)', borderColor: 'var(--stone-200)', background: 'white', opacity: currentPage === 0 ? 0.4 : 1 }}
              >
                ← Anterior
              </button>
              {!isMobile && (
                <div className="text-xs" style={{ color: 'var(--stone-400)' }}>
                  Página {currentPage + 1} de {totalPages}
                </div>
              )}
              <button
                onClick={goNext}
                disabled={currentPage === totalPages - 1}
                className="flex-1 text-sm py-2.5 rounded-xl border"
                style={{ color: 'var(--stone-500)', borderColor: 'var(--stone-200)', background: 'white', opacity: currentPage === totalPages - 1 ? 0.4 : 1 }}
              >
                Siguiente →
              </button>
            </div>
          </div>
        </main>

        {/* Sidebar - en móvil es un overlay deslizable */}
        <aside className={`
          ${isMobile ? `
            fixed top-0 right-0 h-full w-72 z-30 transform transition-transform duration-300 ease-in-out shadow-xl
            ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}
          ` : 'w-64 border-l relative'}
          flex flex-col gap-4 p-4
        `} style={{ background: 'white', borderColor: 'var(--stone-100)' }}>
          {isMobile && (
            <div className="flex justify-between items-center pb-3 border-b" style={{ borderColor: 'var(--stone-100)' }}>
              <span className="font-medium text-sm">Progreso</span>
              <button onClick={() => setSidebarOpen(false)} className="p-1">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ color: 'var(--stone-400)' }}>
                  <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          )}
          
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--stone-400)' }}>
              Puntaje parcial
            </div>
            {partial ? (
              <div className="text-center py-2">
                <div className="text-4xl font-bold" style={{ color: partial.levelColor, fontFamily: 'var(--font-serif)' }}>
                  {partial.totalScaled}
                </div>
                <div className="text-xs font-medium mt-0.5" style={{ color: partial.levelColor }}>
                  {partial.levelLabel}
                </div>
                <div className="text-xs mt-2" style={{ color: 'var(--stone-400)' }}>
                  {completed}/58 ítems
                </div>
              </div>
            ) : (
              <div className="text-3xl font-light text-center py-2" style={{ color: 'var(--stone-300)' }}>—</div>
            )}
          </div>

          {partial && partial.lieScaleInvalid && (
            <div className="rounded-xl px-3 py-2 text-xs" style={{ background: '#fef3c7', border: '1px solid #fde68a', color: '#92400e' }}>
              <strong>⚠ Escala de mentira:</strong> {partial.lieScaleRaw}/8
            </div>
          )}

          {/* Mini índice de preguntas (solo escritorio/tablet) */}
          {!isMobile && (
            <div className="mt-2">
              <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--stone-400)' }}>
                Índice rápido
              </div>
              <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
                {COOPERSMITH_ITEMS.map((item) => (
                  <button
                    key={item.num}
                    onClick={() => goToQuestion(item.num - 1)}
                    className="text-xs w-7 h-7 rounded flex items-center justify-center transition-all"
                    style={{
                      background: responses[item.num] ? 'var(--teal-100)' : 'var(--stone-100)',
                      color: responses[item.num] ? 'var(--teal-700)' : 'var(--stone-500)',
                      fontWeight: currentIndex + 1 === item.num ? 'bold' : 'normal',
                      border: currentIndex + 1 === item.num ? '1px solid var(--teal-500)' : 'none'
                    }}
                  >
                    {item.num}
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Overlay para móvil cuando sidebar está abierto */}
        {isMobile && sidebarOpen && (
          <div className="fixed inset-0 bg-black/30 z-20" onClick={() => setSidebarOpen(false)} />
        )}
      </div>
    </div>
  )
}
