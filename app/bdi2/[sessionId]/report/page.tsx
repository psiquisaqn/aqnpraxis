// @ts-nocheck
'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@supabase/supabase-js'
import { PdfDownloadButton } from '@/components/PdfDownloadButton'
import { scoreBdi2, BDI2_SEVERITY_COLORS, type BdiResult } from '@/lib/bdi2/engine'

const supabase = supabase(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function SeverityGauge({ score, severity }: { score: number; severity: string }) {
  const color = BDI2_SEVERITY_COLORS[severity as keyof typeof BDI2_SEVERITY_COLORS] ?? '#374151'
  const pct   = Math.min(100, (score / 63) * 100)

  const zones = [
    { label: 'Mínima',   width: '21%',  color: '#3B6D11' },
    { label: 'Leve',     width: '10%',  color: '#854F0B' },
    { label: 'Moderada', width: '14%',  color: '#993C1D' },
    { label: 'Grave',    width: '55%',  color: '#A32D2D' },
  ]

  return (
    <div>
      <div className="flex h-3 rounded-full overflow-hidden mb-1">
        {zones.map((z) => (
          <div key={z.label} style={{ width: z.width, background: `${z.color}30` }} />
        ))}
      </div>
      <div className="relative h-4">
        <div
          className="absolute w-3 h-3 rounded-full border-2 border-white shadow -translate-x-1/2"
          style={{ left: `${pct}%`, background: color, top: 0 }}
        />
      </div>
      <div className="flex text-[10px] mt-1" style={{ color: 'var(--stone-400)' }}>
        <span style={{ width: '21%' }}>Mínima<br/>0–13</span>
        <span style={{ width: '10%' }}>Leve<br/>14–19</span>
        <span style={{ width: '14%' }}>Mod.<br/>20–28</span>
        <span style={{ width: '55%' }}>Grave<br/>29–63</span>
      </div>
    </div>
  )
}

export default function BdiReportPage() {
  const params    = useParams()
  const router    = useRouter()
  const sessionId = params.sessionId as string

  const contentRef = useRef<HTMLDivElement>(null)
  const [result, setResult]         = useState<BdiResult | null>(null)
  const [responses, setResponses]   = useState<Record<number, number>>({})
  const [patientName, setPatientName] = useState('')
  const [evalDate, setEvalDate]     = useState('')
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    if (!sessionId) return
    supabase
      .from('bdi2_scores')
      .select('*, session:sessions(started_at, patient:patients(full_name))')
      .eq('session_id', sessionId)
      .single()
      .then(({ data }) => {
        if (!data) { setLoading(false); return }
        const resp: Record<number, number> = {}
        for (let i = 1; i <= 21; i++) {
          const key = `item_${i}`
          // @ts-ignore → ignorar tipado en este acceso
          const value = data[key]
          if (value !== null && value !== undefined) {
            resp[i] = value as number
          }
        }
        setResponses(resp)
        setResult(scoreBdi2(resp))
        // @ts-ignore → ignorar tipado en acceso a session
        setPatientName(data.session?.patient?.full_name ?? '')
        // @ts-ignore → ignorar tipado en acceso a session
        const started = data.session?.started_at
        if (started) {
          setEvalDate(new Date(started).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' }))
        }
        setLoading(false)
      })
  }, [sessionId])

  if (loading) return <Spinner />
  if (!result)  return <Error onBack={() => router.back()} />

  const color = BDI2_SEVERITY_COLORS[result.severity]

  return (
    <div className="min-h-screen" style={{ background: 'var(--stone-100)' }}>
      {/* Toolbar */}
      <div className="sticky top-0 z-20 border-b px-6 py-3 flex items-center gap-3" style={{ background: 'white', borderColor: 'var(--stone-200)' }}>
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--stone-500)' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Volver
        </button>
        <div className="flex-1" />
        <span className="text-xs" style={{ color: 'var(--stone-400)' }}>BDI-II — Inventario de Depresión de Beck</span>
        <button onClick={() => window.print()} className="text-xs font-medium px-3 py-1.5 rounded-lg border" style={{ color: 'var(--stone-600)', borderColor: 'var(--stone-200)' }}>
          Imprimir
        </button>
        {result && (
          <PdfDownloadButton
            contentRef={contentRef}
            meta={{ sessionId, patientId: '', testId: 'beck_bdi2', patientName, content: { total: result.totalScore, severity: result.severity } }}
          />
        )}
      </div>

      <div ref={contentRef} className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <div className="rounded-2xl border p-6" style={{ background: 'white', borderColor: 'var(--stone-200)' }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded" style={{ background: 'rgba(180,83,9,0.08)', color: '#b45309' }}>BDI-II</span>
              <h1 className="text-2xl font-medium mt-2" style={{ fontFamily: 'var(--font-serif)', color: 'var(--stone-900)' }}>{patientName || 'Paciente'}</h1>
            </div>
            <div className="text-right text-sm" style={{ color: 'var(--stone-400)' }}>
              <div>Fecha</div>
              <div className="font-medium" style={{ color: 'var(--stone-700)' }}>{evalDate || '—'}</div>
            </div>
          </div>

          <div className="mt-5 px-5 py-4 rounded-xl" style={{ background: 'var(--stone-50)', border: '1px solid var(--stone-100)' }}>
            <div className="flex items-center gap-6 mb-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: 'var(--stone-400)' }}>Puntaje total</p>
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-bold" style={{ fontFamily: 'var(--font-serif)', color }}>{result.totalScore}</span>
                  <div>
                    <div className="text-sm font-semibold" style={{ color }}>{result.severityLabel}</div>
                    <div className="text-xs" style={{ color: 'var(--stone-400)' }}>de 63 puntos posibles</div>
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <SeverityGauge score={result.totalScore} severity={result.severity} />
              </div>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--stone-600)' }}>{result.severityDescription}</p>
          </div>
        </div>
      </div>
    </div>
  )
}