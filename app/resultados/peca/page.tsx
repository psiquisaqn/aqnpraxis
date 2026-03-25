'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { TestResultsLayout } from '@/components/TestResultsLayout'
import { scorePeca, type PecaResult, DIMENSIONS, AAMR_SETS } from '@/lib/peca/engine'

function PecaResultsPageInner() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session') ?? ''

  const [result, setResult] = useState<PecaResult | null>(null)
  const [patientName, setPatientName] = useState('')
  const [patientId, setPatientId] = useState('')
  const [evalDate, setEvalDate] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!sessionId) return
    fetch('/api/scores/peca?session=' + sessionId)
      .then(r => r.json())
      .then((data) => {
        if (!data || data.error) { setLoading(false); return }
        
        // Reconstruir respuestas
        const resp: Record<number, 1 | 2 | 3 | 4> = {}
        for (let i = 1; i <= 45; i++) {
          const key = `item_${i}` as keyof typeof data
          if (data[key] !== null && data[key] !== undefined) {
            resp[i] = data[key] as 1 | 2 | 3 | 4
          }
        }
        
        const scored = scorePeca(resp)
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

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'Generalizado': return '#A32D2D'
      case 'Extenso': return '#993C1D'
      case 'Limitado': return '#854F0B'
      case 'Intermitente': return '#3B6D11'
      default: return '#166534'
    }
  }

  return (
    <TestResultsLayout
      patientName={patientName}
      patientId={patientId}
      testName="PECA - Prueba de Evaluación de Conducta Adaptativa"
      testCode="PECA"
      evalDate={evalDate}
      pdfMeta={{
        sessionId,
        patientId,
        testId: 'peca',
        patientName,
        content: result
      }}
    >
      {/* Nivel de participación */}
      <div className="mt-5 px-5 py-4 rounded-xl bg-gray-50 border border-gray-100">
        <div className="flex flex-col sm:flex-row items-center gap-6 mb-3">
          <div className="text-center sm:text-left">
            <p className="text-xs font-medium uppercase tracking-widest mb-1 text-gray-400">
              Participación general
            </p>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold" style={{ 
                fontFamily: 'var(--font-serif)', 
                color: result.participationNeeds ? '#A32D2D' : '#166534' 
              }}>
                {Math.round(result.participationLevel * 100)}%
              </span>
              <div>
                <div className="text-sm font-semibold" style={{ 
                  color: result.participationNeeds ? '#A32D2D' : '#166534' 
                }}>
                  {result.participationNeeds ? 'Requiere apoyos' : 'En buen nivel'}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex h-2 rounded-full overflow-hidden">
              {[
                { max: 0.3, color: '#A32D2D', label: 'Extenso' },
                { max: 0.5, color: '#993C1D', label: 'Limitado' },
                { max: 0.75, color: '#854F0B', label: 'Intermitente' },
                { max: 1, color: '#166534', label: 'Buen nivel' },
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
                style={{ left: `${result.participationLevel * 100}%`, top: 0, 
                  background: result.participationNeeds ? '#A32D2D' : '#166534' }}
              />
            </div>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-gray-600">
          {result.participationText}
        </p>
      </div>

      {/* Dimensiones */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold uppercase tracking-widest mb-4 text-gray-400">
          Dimensiones Adaptativas
        </h2>
        <div className="space-y-4">
          {result.dimensions.map((dim) => (
            <div key={dim.code}>
              <div className="flex justify-between mb-1.5">
                <span className="text-sm font-medium text-gray-700">{dim.label}</span>
                <span className="text-sm font-bold" style={{ color: getIntensityColor(dim.intensityLabel) }}>
                  {dim.intensityLabel}
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden bg-gray-100">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${dim.p2 * 100}%`, background: getIntensityColor(dim.intensityLabel) }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {dim.itemsAnswered}/{dim.itemsTotal} ítems · Puntaje: {Math.round(dim.rawScore * 10) / 10}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Conjuntos AAMR */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold uppercase tracking-widest mb-4 text-gray-400">
          Conjuntos AAMR
        </h2>
        <div className="space-y-4">
          {result.aamrSets.map((set) => (
            <div key={set.code}>
              <div className="flex justify-between mb-1.5">
                <span className="text-sm font-medium text-gray-700">{set.label}</span>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{
                  background: set.needsSupport ? '#FEF3C7' : '#D1FAE5',
                  color: set.needsSupport ? '#92400E' : '#065F46'
                }}>
                  {set.demandLabel}
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden bg-gray-100">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${set.p2 * 100}%`, background: set.needsSupport ? '#F59E0B' : '#10B981' }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                {set.descriptionText}
              </p>
            </div>
          ))}
        </div>
      </div>
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

export default function PecaResultsPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <PecaResultsPageInner />
    </Suspense>
  )
}
