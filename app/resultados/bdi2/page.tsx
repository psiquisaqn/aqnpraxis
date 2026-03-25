'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { TestResultsLayout } from '@/components/TestResultsLayout'
import { scoreBdi2, type BdiResult, BDI2_SEVERITY_COLORS } from '@/lib/bdi2/engine'

function Bdi2ResultsPageInner() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session') ?? ''

  const [result, setResult] = useState<BdiResult | null>(null)
  const [patientName, setPatientName] = useState('')
  const [patientId, setPatientId] = useState('')
  const [evalDate, setEvalDate] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!sessionId) return
    fetch('/api/scores/bdi2?session=' + sessionId)
      .then(r => r.json())
      .then((data) => {
        if (!data || data.error) { setLoading(false); return }
        
        // Reconstruir respuestas
        const resp: Record<number, 0 | 1 | 2 | 3> = {}
        for (let i = 1; i <= 21; i++) {
          const key = `item_${i}` as keyof typeof data
          if (data[key] !== null && data[key] !== undefined) {
            resp[i] = data[key] as 0 | 1 | 2 | 3
          }
        }
        
        const scored = scoreBdi2(resp)
        setResult(scored)
        setPatientName((data.session as any)?.patient?.full_name ?? '')
        setPatientId((data.session as any)?.patient?.id ?? '')
        const d = (data.session as any)?.started_at
        if (d) setEvalDate(new Date(d).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' }))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [sessionId])

  if (loading) return <Spinner />
  if (!result) return <Error />

  const severityColor = BDI2_SEVERITY_COLORS[result.severity]

  return (
    <TestResultsLayout
      patientName={patientName}
      patientId={patientId}
      testName="BDI-II - Inventario de Depresión de Beck"
      testCode="BDI-II"
      evalDate={evalDate}
      pdfMeta={{
        sessionId,
        patientId,
        testId: 'bdi2',
        patientName,
        content: result
      }}
    >
      <div className="mt-5 px-5 py-4 rounded-xl bg-gray-50 border border-gray-100">
        <div className="flex flex-col sm:flex-row items-center gap-6 mb-3">
          <div className="text-center sm:text-left">
            <p className="text-xs font-medium uppercase tracking-widest mb-1 text-gray-400">
              Puntaje total
            </p>
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-bold" style={{ fontFamily: 'var(--font-serif)', color: severityColor }}>
                {result.totalScore}
              </span>
              <div>
                <div className="text-sm font-semibold" style={{ color: severityColor }}>
                  {result.severityLabel}
                </div>
                <div className="text-xs text-gray-400">de 63 puntos</div>
              </div>
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex h-2 rounded-full overflow-hidden">
              {[
                { max: 13, color: '#3B6D11', label: 'Mínima' },
                { max: 19, color: '#854F0B', label: 'Leve' },
                { max: 28, color: '#993C1D', label: 'Moderada' },
                { max: 63, color: '#A32D2D', label: 'Grave' },
              ].map((range) => (
                <div
                  key={range.label}
                  className="flex-1"
                  style={{ background: `${range.color}30` }}
                />
              ))}
            </div>
            <div className="relative mt-1">
              <div
                className="absolute w-3 h-3 rounded-full border-2 border-white shadow -translate-x-1/2"
                style={{ left: `${(result.totalScore / 63) * 100}%`, top: 0, background: severityColor }}
              />
            </div>
            <div className="flex justify-between text-[10px] mt-4 text-gray-400">
              <span>0</span><span>13</span><span>20</span><span>29</span><span>63</span>
            </div>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-gray-600">
          {result.severityDescription}
        </p>
      </div>

      {result.suicidalIdeationScore >= 1 && (
        <div className="mt-3 px-4 py-3 rounded-xl text-sm bg-red-50 border border-red-200 text-red-700">
          <strong>⚠ Alerta de seguridad:</strong> El ítem 9 (ideación suicida) presenta puntaje {result.suicidalIdeationScore}/3.
          Se requiere evaluación de riesgo inmediata por profesional de salud mental.
        </div>
      )}

      {/* Subescalas */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold uppercase tracking-widest mb-4 text-gray-400">
          Subescalas
        </h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1.5">
              <span className="text-sm font-medium text-gray-700">Cognitivo-afectiva</span>
              <span className="text-sm font-bold" style={{ color: severityColor }}>
                {result.cognitiveAffectiveScore}
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden bg-gray-100">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${(result.cognitiveAffectiveScore / 39) * 100}%`, background: severityColor }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Ítems 1-13 · Máximo 39 puntos</p>
          </div>
          <div>
            <div className="flex justify-between mb-1.5">
              <span className="text-sm font-medium text-gray-700">Somático-motivacional</span>
              <span className="text-sm font-bold" style={{ color: severityColor }}>
                {result.somaticMotivationalScore}
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden bg-gray-100">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${(result.somaticMotivationalScore / 24) * 100}%`, background: severityColor }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Ítems 14-21 · Máximo 24 puntos</p>
          </div>
        </div>
      </div>

      {result.flaggedItems.length > 0 && (
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-widest mb-3 text-gray-400">
            Ítems con puntaje relevante (≥ 2)
          </h2>
          <div className="flex flex-wrap gap-2">
            {result.flaggedItems.map(item => (
              <span
                key={item}
                className="px-2 py-1 text-xs rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200"
              >
                Ítem {item}
              </span>
            ))}
          </div>
        </div>
      )}
    </TestResultsLayout>
  )
}

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 rounded-full border-2 animate-spin border-blue-500 border-t-transparent" />
    </div>
  )
}

function Error() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-sm text-gray-600">No se encontraron resultados</p>
        <button
          onClick={() => window.history.back()}
          className="mt-3 text-sm text-blue-600 hover:text-blue-700"
        >
          ← Volver
        </button>
      </div>
    </div>
  )
}

export default function Bdi2ResultsPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <Bdi2ResultsPageInner />
    </Suspense>
  )
}
