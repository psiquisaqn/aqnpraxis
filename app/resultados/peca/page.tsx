'use client'
// app/resultados/peca/page.tsx
// FIX #5: Agregar botón "Volver al panel principal" en la barra superior.
// También se migra la carga de datos desde /api/scores/peca (problemático)
// a lectura directa con createBrowserClient, igual que Coopersmith.
// La tabla peca_scores guarda p01-p45, se leen directamente.

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { TestResultsLayout } from '@/components/TestResultsLayout'
import { scorePeca, type PecaResult } from '@/lib/peca/engine'

function PecaResultsPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session') ?? ''

  const [result, setResult]           = useState<PecaResult | null>(null)
  const [patientName, setPatientName] = useState('')
  const [patientId, setPatientId]     = useState('')
  const [evalDate, setEvalDate]       = useState('')
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    if (!sessionId) return

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    async function load() {
      // 1. Leer peca_scores directamente (p01-p45)
      const { data: scores, error: scoresError } = await supabase
        .from('peca_scores')
        .select('*')
        .eq('session_id', sessionId)
        .single()

      if (scoresError || !scores) { setLoading(false); return }

      // 2. Reconstruir respuestas desde p01-p45
      const resp: Record<number, 1 | 2 | 3 | 4> = {}
      for (let i = 1; i <= 45; i++) {
        const key = 'p' + String(i).padStart(2, '0') as keyof typeof scores
        const val = scores[key]
        if (val !== null && val !== undefined) {
          resp[i] = val as 1 | 2 | 3 | 4
        }
      }
      setResult(scorePeca(resp))

      // 3. Leer datos de sesión + paciente
      const { data: sessionData } = await supabase
        .from('sessions')
        .select('started_at, patient:patients(id, full_name)')
        .eq('id', sessionId)
        .single()

      if (sessionData?.patient) {
        const p = sessionData.patient as any
        setPatientName(p.full_name ?? '')
        setPatientId(p.id ?? '')
      }
      if (sessionData?.started_at) {
        setEvalDate(new Date(sessionData.started_at).toLocaleDateString('es-CL', {
          day: '2-digit', month: 'long', year: 'numeric'
        }))
      }

      setLoading(false)
    }

    load()
  }, [sessionId])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 rounded-full border-2 animate-spin border-blue-500 border-t-transparent" />
    </div>
  )

  if (!result) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-sm text-gray-600 mb-3">No se encontraron resultados</p>
        <button onClick={() => router.back()} className="text-sm text-blue-600 hover:text-blue-700">← Volver</button>
      </div>
    </div>
  )

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'Generalizado': return '#A32D2D'
      case 'Extenso':      return '#993C1D'
      case 'Limitado':     return '#854F0B'
      case 'Intermitente': return '#3B6D11'
      default:             return '#166534'
    }
  }

  return (
    <TestResultsLayout
      patientName={patientName}
      patientId={patientId}
      testName="PECA - Prueba de Evaluación de Conducta Adaptativa"
      testCode="PECA"
      evalDate={evalDate}
      // FIX #5: onBack va al dashboard (TestResultsLayout ya tiene el botón "Volver"
      // a la izquierda. Agregamos botón "Panel principal" dentro del slot de acciones)
      pdfMeta={{ sessionId, patientId, testId: 'peca', patientName, content: result }}
    >
      {/* Botón Panel principal — dentro del contenido, visible al inicio */}
      <div className="flex justify-end mb-4 mt-2">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1L1 7l6 6M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Volver al panel principal
        </button>
      </div>

      {/* Nivel de participación */}
      <div className="mt-2 px-5 py-4 rounded-xl bg-gray-50 border border-gray-100">
        <div className="flex flex-col sm:flex-row items-center gap-6 mb-3">
          <div className="text-center sm:text-left">
            <p className="text-xs font-medium uppercase tracking-widest mb-1 text-gray-400">Participación general</p>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold" style={{ fontFamily: 'var(--font-serif)', color: result.participationNeeds ? '#A32D2D' : '#166534' }}>
                {Math.round(result.participationLevel * 100)}%
              </span>
              <div>
                <div className="text-sm font-semibold" style={{ color: result.participationNeeds ? '#A32D2D' : '#166534' }}>
                  {result.participationNeeds ? 'Requiere apoyos' : 'En buen nivel'}
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex h-2 rounded-full overflow-hidden">
              {[
                { color: '#A32D2D', label: 'Extenso' },
                { color: '#993C1D', label: 'Limitado' },
                { color: '#854F0B', label: 'Intermitente' },
                { color: '#166534', label: 'Buen nivel' },
              ].map((range) => (
                <div key={range.label} className="flex-1" style={{ background: `${range.color}30` }} />
              ))}
            </div>
            <div className="relative mt-1">
              <div className="absolute w-3 h-3 rounded-full border-2 border-white shadow -translate-x-1/2"
                style={{ left: `${result.participationLevel * 100}%`, top: 0, background: result.participationNeeds ? '#A32D2D' : '#166534' }} />
            </div>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-gray-600">{result.participationText}</p>
      </div>

      {/* Dimensiones */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold uppercase tracking-widest mb-4 text-gray-400">Dimensiones Adaptativas</h2>
        <div className="space-y-4">
          {result.dimensions.map((dim) => (
            <div key={dim.code}>
              <div className="flex justify-between mb-1.5">
                <span className="text-sm font-medium text-gray-700">{dim.label}</span>
                <span className="text-sm font-bold" style={{ color: getIntensityColor(dim.intensityLabel) }}>{dim.intensityLabel}</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden bg-gray-100">
                <div className="h-full rounded-full transition-all" style={{ width: `${dim.p2 * 100}%`, background: getIntensityColor(dim.intensityLabel) }} />
              </div>
              <p className="text-xs text-gray-400 mt-1">{dim.itemsAnswered}/{dim.itemsTotal} ítems · Puntaje: {Math.round(dim.rawScore * 10) / 10}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Conjuntos AAMR */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold uppercase tracking-widest mb-4 text-gray-400">Conjuntos AAMR</h2>
        <div className="space-y-4">
          {result.aamrSets.map((set) => (
            <div key={set.code}>
              <div className="flex justify-between mb-1.5">
                <span className="text-sm font-medium text-gray-700">{set.label}</span>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: set.needsSupport ? '#FEF3C7' : '#D1FAE5', color: set.needsSupport ? '#92400E' : '#065F46' }}>
                  {set.demandLabel}
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden bg-gray-100">
                <div className="h-full rounded-full transition-all" style={{ width: `${set.p2 * 100}%`, background: set.needsSupport ? '#F59E0B' : '#10B981' }} />
              </div>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">{set.descriptionText}</p>
            </div>
          ))}
        </div>
      </div>
    </TestResultsLayout>
  )
}

export default function PecaResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <PecaResultsPageInner />
    </Suspense>
  )
}
