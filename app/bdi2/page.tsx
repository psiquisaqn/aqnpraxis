'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { TestLayout } from '@/components/TestLayout'
import { PaginationNav } from '@/components/PaginationNav'
import { QuickIndex } from '@/components/QuickIndex'
import { useTestNavigation } from '@/hooks/useTestNavigation'
import { BDI2_ITEMS, scoreBdi2, type BdiResponse, type BdiResponses } from '@/lib/bdi2/engine'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const TOTAL_ITEMS = 21

const RESPONSE_OPTIONS: Array<{ value: BdiResponse; label: string }> = [
  { value: 0, label: '0 - No me siento así' },
  { value: 1, label: '1 - A veces me siento así' },
  { value: 2, label: '2 - Me siento así frecuentemente' },
  { value: 3, label: '3 - Me siento así todo el tiempo' },
]

export default function Bdi2SessionPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string

  const [responses, setResponses] = useState<BdiResponses>({})
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

  const pageItems = BDI2_ITEMS.slice(startIndex, endIndex)
  const completed = Object.keys(responses).length
  const allDone = completed === TOTAL_ITEMS

  useEffect(() => {
    if (!sessionId) return
    supabase.from('sessions').select('patient:patients(full_name)').eq('id', sessionId).single()
      .then(({ data }) => { if (data) setPatientName((data.patient as any)?.full_name ?? '') })
  }, [sessionId])

  const handleResponse = (itemNum: number, value: BdiResponse) => {
    setResponses(prev => ({ ...prev, [itemNum]: value }))
    handleAnswer()
  }

  const handleSubmit = async () => {
    if (!allDone) return
    setSaving(true)
    try {
      const res = await fetch('/api/bdi2/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, responses }),
      })
      if (res.ok) {
        router.push('/resultados/bdi2?session=' + sessionId)
      } else {
        const data = await res.json()
        console.error("Error al guardar:", data.error)
      }
    } finally {
      setSaving(false)
    }
  }

  const partial = completed > 0 ? scoreBdi2(responses) : null

  const getSeverityColor = () => {
    if (!partial) return '#3B82F6'
    switch (partial.severity) {
      case 'grave': return '#A32D2D'
      case 'moderada': return '#993C1D'
      case 'leve': return '#854F0B'
      default: return '#3B6D11'
    }
  }

  const sidebarContent = (
    <>
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider mb-2 text-gray-400">
          Puntaje parcial
        </div>
        {partial ? (
          <div className="text-center py-2">
            <div className="text-4xl font-bold" style={{ color: getSeverityColor() }}>
              {partial.totalScore}
            </div>
            <div className="text-sm font-medium mt-0.5" style={{ color: getSeverityColor() }}>
              {partial.severityLabel}
            </div>
            <div className="text-xs mt-2 text-gray-400">
              {completed}/{TOTAL_ITEMS} ítems
            </div>
          </div>
        ) : (
          <div className="text-3xl font-light text-center py-2 text-gray-300">—</div>
        )}
      </div>

      {partial && partial.suicidalIdeationScore >= 1 && (
        <div className="rounded-lg px-3 py-2 text-sm bg-red-50 border border-red-200 text-red-700">
          <strong>⚠ Atención:</strong> Ítem 9 (ideación suicida) = {partial.suicidalIdeationScore}/3.
          Se requiere evaluación de riesgo inmediata.
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
      testName="BDI-II"
      testCode="bdi-ii"
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
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-mono w-6 shrink-0 text-gray-400">
                      {item.num}
                    </span>
                    <p className="flex-1 text-sm font-medium text-gray-700">
                      {item.label}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3 ml-9">
                    {RESPONSE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => handleResponse(item.num, opt.value)}
                        className="flex-1 min-w-[140px] text-sm font-medium py-2.5 px-3 rounded-lg border transition-all"
                        style={{
                          background: resp === opt.value ? '#3B82F6' : 'white',
                          color: resp === opt.value ? 'white' : '#6B7280',
                          borderColor: resp === opt.value ? 'transparent' : '#E5E7EB',
                        }}
                      >
                        {opt.label}
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