'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { TestLayout } from '@/components/TestLayout'
import { PaginationNav } from '@/components/PaginationNav'
import { COOPERSMITH_ITEMS, scoreCoopersmith, type CooperResponse, type CooperResponses } from '@/lib/coopersmith/engine'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function CoopersmithSessionPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string

  const [responses, setResponses] = useState<CooperResponses>({})
  const [patientName, setPatientName] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [saving, setSaving] = useState(false)
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024)

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isMobile = windowWidth < 768
  const isTablet = windowWidth >= 768 && windowWidth < 1024

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
  const allDone = completed === 58

  useEffect(() => {
    if (!sessionId) return
    supabase.from('sessions').select('patient:patients(full_name)').eq('id', sessionId).single()
      .then(({ data }) => { if (data) setPatientName((data.patient as any)?.full_name ?? '') })
  }, [sessionId])

  const handleResponse = (item: number, val: CooperResponse) => {
    setResponses((prev) => ({ ...prev, [item]: val }))
    if (isMobile && currentIndex < COOPERSMITH_ITEMS.length - 1) {
      setTimeout(() => setCurrentIndex(prev => prev + 1), 200)
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

  const partial = completed > 0 ? scoreCoopersmith(responses) : null

  const sidebarContent = (
    <>
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider mb-2 text-gray-400">
          Puntaje parcial
        </div>
        {partial ? (
          <div className="text-center py-2">
            <div className="text-4xl font-bold text-blue-600">
              {partial.totalScaled}
            </div>
            <div className="text-sm font-medium mt-0.5" style={{ color: partial.levelColor }}>
              {partial.levelLabel}
            </div>
            <div className="text-xs mt-2 text-gray-400">
              {completed}/58 ítems
            </div>
          </div>
        ) : (
          <div className="text-3xl font-light text-center py-2 text-gray-300">—</div>
        )}
      </div>

      {partial && partial.lieScaleInvalid && (
        <div className="rounded-lg px-3 py-2 text-xs bg-yellow-50 border border-yellow-200 text-yellow-800">
          <strong>⚠ Escala de mentira:</strong> {partial.lieScaleRaw}/8
        </div>
      )}

      {!isMobile && (
        <div className="mt-2">
          <div className="text-xs font-semibold uppercase tracking-wider mb-2 text-gray-400">
            Índice rápido
          </div>
          <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
            {COOPERSMITH_ITEMS.map((item) => (
              <button
                key={item.num}
                onClick={() => setCurrentIndex(item.num - 1)}
                className="text-xs w-7 h-7 rounded flex items-center justify-center transition-all"
                style={{
                  background: responses[item.num] ? '#EFF6FF' : '#F3F4F6',
                  color: responses[item.num] ? '#3B82F6' : '#6B7280',
                  fontWeight: currentIndex + 1 === item.num ? 'bold' : 'normal',
                  border: currentIndex + 1 === item.num ? '1px solid #3B82F6' : 'none'
                }}
              >
                {item.num}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  )

  return (
    <TestLayout
      sessionId={sessionId}
      patientName={patientName}
      testName="Coopersmith SEI"
      testCode="coopersmith"
      totalItems={58}
      completed={completed}
      currentIndex={currentIndex}
      onNavigate={setCurrentIndex}
      onSubmit={handleSubmit}
      saving={saving}
      sidebarContent={sidebarContent}
    >
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="mb-4 flex justify-between items-center text-xs text-gray-400">
          <span>Pregunta {currentIndex + 1} de {COOPERSMITH_ITEMS.length}</span>
        </div>

        <div className="space-y-3">
          {pageItems.map((item) => {
            const resp = responses[item.num]
            const isCurrent = isMobile && item.num === currentIndex + 1
            
            return (
              <div
                key={item.num}
                className={`rounded-lg border transition-all ${isMobile && !isCurrent ? 'hidden' : ''}`}
                style={{
                  background: resp ? 'white' : '#F9FAFB',
                  borderColor: resp ? '#E5E7EB' : '#F3F4F6',
                }}
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-mono w-6 shrink-0 text-gray-400">
                      {item.num}
                    </span>
                    <p className="flex-1 text-sm leading-relaxed text-gray-700">
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
                          background: resp === val ? (val === 'igual' ? '#3B82F6' : '#6B7280') : 'white',
                          color: resp === val ? 'white' : '#6B7280',
                          borderColor: resp === val ? 'transparent' : '#E5E7EB',
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

        <PaginationNav
          currentPage={currentPage}
          totalPages={totalPages}
          onPrev={goPrev}
          onNext={goNext}
          isMobile={isMobile}
        />
      </div>
    </TestLayout>
  )
}
