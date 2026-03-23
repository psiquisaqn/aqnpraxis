'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@supabase/supabase-js'
import { PdfDownloadButton } from '@/components/PdfDownloadButton'
import { scoreCoopersmith, COOPER_KEY, type CooperResult } from '@/lib/coopersmith/engine'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function CoopersmithReportPageInner() {
  const router    = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session') ?? ''

  const contentRef = useRef<HTMLDivElement>(null)
  const [result, setResult]           = useState<CooperResult | null>(null)
  const [patientName, setPatientName] = useState('')
  const [evalDate, setEvalDate]       = useState('')
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    if (!sessionId) return
    supabase
      .from('coopersmith_scores')
      .select('*, session:sessions(started_at, patient:patients(full_name))')
      .eq('session_id', sessionId)
      .single()
      .then(({ data }) => {
        if (!data) { setLoading(false); return }
        // Reconstruir respuestas desde columnas r01..r58
        const resp: Record<number, 'igual' | 'diferente'> = {}
        for (let i = 1; i <= 58; i++) {
          const key = `r${String(i).padStart(2, '0')}` as keyof typeof data
          if (data[key] !== null && data[key] !== undefined) {
            resp[i] = data[key] as 'igual' | 'diferente'
          }
        }
        setResult(scoreCoopersmith(resp))
        setPatientName((data.session as any)?.patient?.full_name ?? '')
        const d = (data.session as any)?.started_at
        if (d) setEvalDate(new Date(d).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' }))
        setLoading(false)
      })
  }, [sessionId])

  if (loading) return <Spinner />
  if (!result)  return <Error onBack={() => router.back()} />

  const { levelColor } = result

  return (
    <div className="min-h-screen" style={{ background: 'var(--stone-100)' }}>
      {/* Toolbar */}
      <div className="sticky top-0 z-20 border-b px-6 py-3 flex items-center gap-3" style={{ background: 'white', borderColor: 'var(--stone-200)' }}>
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--stone-500)' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Volver
        </button>
        <div className="flex-1" />
        <span className="text-xs" style={{ color: 'var(--stone-400)' }}>Coopersmith SEI — Inventario de Autoestima</span>
        <button onClick={() => window.print()} className="text-xs font-medium px-3 py-1.5 rounded-lg border" style={{ color: 'var(--stone-600)', borderColor: 'var(--stone-200)' }}>
          Imprimir
        </button>
        {result && (
          <PdfDownloadButton
            contentRef={contentRef}
            meta={{ sessionId, patientId: '', testId: 'coopersmith', patientName, content: { total: result.totalScaled, level: result.level } }}
          />
        )}
      </div>

      <div ref={contentRef} className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Encabezado */}
        <div className="rounded-2xl border p-6" style={{ background: 'white', borderColor: 'var(--stone-200)' }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded" style={{ background: 'rgba(3,105,161,0.08)', color: '#0369a1' }}>Coopersmith</span>
              <h1 className="text-2xl font-medium mt-2" style={{ fontFamily: 'var(--font-serif)', color: 'var(--stone-900)' }}>{patientName || 'Paciente'}</h1>
            </div>
            <div className="text-right text-sm" style={{ color: 'var(--stone-400)' }}>
              <div>Fecha</div>
              <div className="font-medium" style={{ color: 'var(--stone-700)' }}>{evalDate || '—'}</div>
            </div>
          </div>

          {/* Puntaje total */}
          <div className="mt-5 px-5 py-4 rounded-xl" style={{ background: 'var(--stone-50)', border: '1px solid var(--stone-100)' }}>
            <div className="flex items-center gap-6 mb-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: 'var(--stone-400)' }}>Puntaje total</p>
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-bold" style={{ fontFamily: 'var(--font-serif)', color: levelColor }}>{result.totalScaled}</span>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: levelColor }}>{result.levelLabel}</div>
                    <div className="text-xs" style={{ color: 'var(--stone-400)' }}>de 100 puntos</div>
                  </div>
                </div>
              </div>
              {/* Barra de nivel */}
              <div className="flex-1">
                <div className="flex h-2 rounded-full overflow-hidden">
                  {[
                    { min: 0, max: 25, color: '#A32D2D', label: 'Baja' },
                    { min: 25, max: 50, color: '#854F0B', label: 'Media baja' },
                    { min: 50, max: 75, color: '#639922', label: 'Media alta' },
                    { min: 75, max: 100, color: '#3B6D11', label: 'Alta' },
                  ].map((z) => (
                    <div key={z.label} className="flex-1" style={{ background: `${z.color}30` }} />
                  ))}
                </div>
                <div className="relative mt-1">
                  <div
                    className="absolute w-3 h-3 rounded-full border-2 border-white shadow -translate-x-1/2"
                    style={{ left: `${result.totalScaled}%`, top: 0, background: levelColor }}
                  />
                </div>
                <div className="flex justify-between text-[10px] mt-4" style={{ color: 'var(--stone-400)' }}>
                  <span>0 Baja</span><span>25</span><span>50</span><span>75</span><span>100 Alta</span>
                </div>
              </div>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--stone-600)' }}>{result.levelDescription}</p>
          </div>

          {result.lieScaleInvalid && (
            <div className="mt-3 px-4 py-3 rounded-xl text-sm" style={{ background: '#fef3c7', border: '1px solid #fde68a', color: '#92400e' }}>
              <strong>⚠ Escala de mentira:</strong> {result.lieScaleRaw}/8. Un puntaje ≥ 5 sugiere tendencia a responder en forma socialmente deseable. Considerar la validez del protocolo.
            </div>
          )}
        </div>

        {/* Subescalas */}
        <div className="rounded-2xl border p-6" style={{ background: 'white', borderColor: 'var(--stone-200)' }}>
          <h2 className="text-sm font-semibold uppercase tracking-widest mb-5" style={{ color: 'var(--stone-400)' }}>Subescalas</h2>
          <div className="space-y-4">
            {result.subscales.map((s) => (
              <div key={s.code}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium" style={{ color: 'var(--stone-700)' }}>{s.label}</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-bold" style={{ color: levelColor }}>{s.scaledScore}</span>
                    <span className="text-xs" style={{ color: 'var(--stone-400)' }}>/ {s.maxScaled}</span>
                  </div>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--stone-100)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${s.pct * 100}%`, background: levelColor }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center py-4">
          <p className="text-xs" style={{ color: 'var(--stone-400)' }}>
            Generado por AQN Praxis · Brinkmann, Segure & Solar (1989) · U. de Concepción
          </p>
        </div>
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--stone-50)' }}>
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--teal-500)', borderTopColor: 'transparent' }} />
    </div>
  )
}
function Error({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--stone-50)' }}>
      <div className="text-center">
        <p className="text-sm" style={{ color: 'var(--stone-600)' }}>No se encontraron resultados</p>
        <button onClick={onBack} className="mt-3 text-sm" style={{ color: 'var(--teal-600)' }}>← Volver</button>
      </div>
    </div>
  )
}

export default function CoopersmithReportPage() {
  return (
    <Suspense fallback={null}>
      <CoopersmithReportPageInner />
    </Suspense>
  )
}
