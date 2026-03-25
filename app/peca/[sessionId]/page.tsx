'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { TestLayout } from '@/components/TestLayout'
import { PaginationNav } from '@/components/PaginationNav'
import { QuickIndex } from '@/components/QuickIndex'
import { useTestNavigation } from '@/hooks/useTestNavigation'
import { PECA_ITEMS, scorePeca, type PecaResponses } from '@/lib/peca/engine'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const TOTAL_ITEMS = 45

const RESPONSE_OPTIONS = [
  { value: 1, label: '1 - Siempre la izquierda', position: 'left' },
  { value: 2, label: '2 - Generalmente la izquierda', position: 'left' },
  { value: 3, label: '3 - Generalmente la derecha', position: 'right' },
  { value: 4, label: '4 - Siempre la derecha', position: 'right' },
]

export default function PecaSessionPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string

  const [responses, setResponses] = useState<PecaResponses>({})
  const [patientName, setPatientName] = useState('')
  const [saving, setSaving] = useState(false)

  const {
    isMobile,
    isTablet,
    itemsPerPage,
    totalPages,
    currentPage,
    currentIndex,
    startIndex,
    endIndex,
    goNext,
    goPrev,
    goToIndex,
    handleAnswer
  } = useTestNavigation({
    totalItems: TOTAL_ITEMS,
    mobileItemsPerPage: 1,
    tabletItemsPerPage: 5,
    desktopItemsPerPage: 10
  })

  const pageItems = PECA_ITEMS.slice(startIndex, endIndex)
  const completed = Object.keys(responses).length
  const allDone = completed === TOTAL_ITEMS

  useEffect(() => {
    if (!sessionId) return
    supabase.from('sessions').select('patient:patients(full_name)').eq('id', sessionId).single()
      .then(({ data }) => { if (data) setPatientName((data.patient as any)?.full_name ?? '') })
  }, [sessionId])

  const handleResponse = (itemNum: number, value: number) => {
    setResponses(prev => ({ ...prev, [itemNum]: value as 1 | 2 | 3 | 4 }))
    handleAnswer()
  }

  const handleSubmit = async () => {
    if (!allDone) return
    setSaving(true)
    try {
      const res = await fetch('/api/peca/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, responses }),
      })
      if (res.ok) router.push('/resultados/peca?session=' + sessionId)
    } finally {
      setSaving(false)
    }
  }

  const partial = completed > 0 ? scorePeca(responses) : null

  const sidebarContent = (
    <>
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider mb-2 text-gray-400">
          Progreso
        </div>
        <div className="text-center py-2">
          <div className="text-4xl font-bold text-blue-600">
            {completed}/{TOTAL_ITEMS}
          </div>
          <div className="text-xs mt-2 text-gray-400">
            {Math.round((completed / TOTAL_ITEMS) * 100)}% completado
          </div>
        </div>
      </div>

      {partial && partial.participationNeeds && (
        <div className="rounded-lg px-3 py-2 text-xs bg-yellow-50 border border-yellow-200 text-yellow-800">
          <strong>⚠ Requiere apoyos:</strong> Nivel de participación bajo.
        </div>
      )}

      {!isMobile && (
        <QuickIndex
          totalItems={TOTAL_ITEMS}
          currentIndex={currentIndex}
          responses={responses}
          onSelect={goToIndex}
        />
      )}
    </>
  )

  return (
    <TestLayout
      sessionId={sessionId}
      patientName={patientName}
      testName="PECA"
      testCode="peca"
      totalItems={TOTAL_ITEMS}
      completed={completed}
      currentIndex={currentIndex}
      onNavigate={goToIndex}
      onSubmit={handleSubmit}
      saving={saving}
      sidebarContent={sidebarContent}
    >
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="mb-4 flex justify-between items-center text-xs text-gray-400">
          <span>Ítem {currentIndex + 1} de {TOTAL_ITEMS}</span>
          {!isMobile && (
            <div className="flex gap-1">
              {Array.from({ length: Math.min(TOTAL_ITEMS, totalPages) }, (_, i) => (
                <button
                  key={i}
                  onClick={() => goToIndex(i * itemsPerPage)}
                  className="h-1 rounded-full transition-all"
                  style={{
                    width: currentPage === i ? '16px' : '6px',
                    background: currentPage === i ? '#3B82F6' : '#E5E7EB'
                  }}
                />
              ))}
            </div>
          )}
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
                  background: resp !== undefined ? 'white' : '#F9FAFB',
                  borderColor: resp !== undefined ? '#E5E7EB' : '#F3F4F6',
                }}
              >
                <div className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-xs font-mono w-6 shrink-0 text-gray-400">
                      {item.num}
                    </span>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-700">{item.leftPhrase}</span>
                        <span className="text-gray-500 mx-2">← →</span>
                        <span className="text-gray-700">{item.rightPhrase}</span>
                      </div>
                      <div className="relative mt-4">
                        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                          <span>Siempre izquierda</span>
                          <span>Generalmente izquierda</span>
                          <span>Generalmente derecha</span>
                          <span>Siempre derecha</span>
                        </div>
                        <div className="flex gap-1">
                          {RESPONSE_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => handleResponse(item.num, opt.value)}
                              className="flex-1 text-xs font-medium py-2 rounded-lg border transition-all"
                              style={{
                                background: resp === opt.value ? '#3B82F6' : 'white',
                                color: resp === opt.value ? 'white' : '#6B7280',
                                borderColor: resp === opt.value ? 'transparent' : '#E5E7EB',
                              }}
                            >
                              {opt.value}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
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
