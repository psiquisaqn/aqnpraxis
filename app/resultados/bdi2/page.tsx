'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@supabase/supabase-js'
import { PdfDownloadButton } from '@/components/PdfDownloadButton'
import { scoreBdi2, BDI2_ITEMS, BDI2_SEVERITY_COLORS, type BdiResult } from '@/lib/bdi2/engine'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
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
      {/* Barra segmentada */}
      <div className="flex h-3 rounded-full overflow-hidden mb-1">
        {zones.map((z) => (
          <div key={z.label} style={{ width: z.width, background: `${z.color}30` }} />
        ))}
      </div>
      {/* Marcador */}
      <div className="relative h-4">
        <div
          className="absolute w-3 h-3 rounded-full border-2 border-white shadow -translate-x-1/2"
          style={{ left: `${pct}%`, background: color, top: 0 }}
        />
      </div>
      {/* Etiquetas */}
      <div className="flex text-[10px] mt-1" style={{ color: 'var(--stone-400)' }}>
        <span style={{ width: '21%' }}>Mínima<br/>0–13</span>
        <span style={{ width: '10%' }}>Leve<br/>14–19</span>
        <span style={{ width: '14%' }}>Mod.<br/>20–28</span>
        <span style={{ width: '55%' }}>Grave<br/>29–63</span>
      </div>
    </div>
  )
}

function BdiReportPageInner() {
  const router    = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session') ?? ''

  const contentRef = useRef<HTMLDivElement>(null)
  const [result, setResult]         = useState<BdiResult | null>(null)
  const [responses, setResponses]   = useState<Record<number, number>>({})
  const [patientName, setPatientName] = useState('')
  const [evalDate, setEvalDate]     = useState('')
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    if (!sessionId) return
    fetch('/api/scores/bdi2?session=' + sessionId)
      .then(r => r.json())
      .then((data) => {
        if (!data || data.error) { setLoading(false); return }
        // Reconstruir respuestas desde columnas i01..i21
        const resp: Record<number, number> = {}
        for (let i = 1; i <= 21; i++) {
          const key = `i${String(i).padStart(2, '0')}` as keyof typeof data
          if (data[key] !== null && data[key] !== undefined) resp[i] = data[key] as number
        }
        setResponses(resp)
        setResult(scoreBdi2(resp as any))
        setPatientName((data.session as any)?.patient?.full_name ?? '')
        const d = (data.session as any)?.started_at
        if (d) setEvalDate(new Date(d).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' }))
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
        {/* Encabezado + puntaje */}
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

          {/* Resultado principal */}
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

          {/* Alerta ideación suicida */}
          {result.suicidalIdeationScore >= 1 && (
            <div className="mt-4 px-4 py-3 rounded-xl text-sm" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' }}>
              <strong>⚠ Ítem 9 — Pensamientos o deseos suicidas:</strong> Puntaje {result.suicidalIdeationScore}/3.
              Se recomienda evaluación clínica inmediata del riesgo suicida.
            </div>
          )}
        </div>

        {/* Subescalas */}
        <div className="rounded-2xl border p-6" style={{ background: 'white', borderColor: 'var(--stone-200)' }}>
          <h2 className="text-sm font-semibold uppercase tracking-widest mb-5" style={{ color: 'var(--stone-400)' }}>Subescalas</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Cognitivo-afectiva', score: result.cognitiveAffectiveScore,  max: 39, items: 'Ítems 1–13' },
              { label: 'Somático-motivacional', score: result.somaticMotivationalScore, max: 24, items: 'Ítems 14–21' },
            ].map((sub) => {
              const subPct = (sub.score / sub.max) * 100
              return (
                <div key={sub.label} className="rounded-xl p-4" style={{ background: 'var(--stone-50)', border: '1px solid var(--stone-100)' }}>
                  <p className="text-xs font-medium" style={{ color: 'var(--stone-500)' }}>{sub.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--stone-400)' }}>{sub.items}</p>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-bold" style={{ color, fontFamily: 'var(--font-serif)' }}>{sub.score}</span>
                    <span className="text-xs" style={{ color: 'var(--stone-400)' }}>/ {sub.max}</span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--stone-200)' }}>
                    <div className="h-full rounded-full" style={{ width: `${subPct}%`, background: color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Ítems con puntaje alto */}
        {result.flaggedItems.length > 0 && (
          <div className="rounded-2xl border p-6" style={{ background: 'white', borderColor: 'var(--stone-200)' }}>
            <h2 className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--stone-400)' }}>Síntomas relevantes (puntaje ≥ 2)</h2>
            <div className="space-y-2">
              {result.flaggedItems.map((n) => {
                const item   = BDI2_ITEMS.find((i) => i.num === n)
                const score  = responses[n]
                const isSuic = n === 9
                return (
                  <div key={n} className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: isSuic ? '#fef2f2' : 'var(--stone-50)', border: `1px solid ${isSuic ? '#fecaca' : 'var(--stone-100)'}` }}>
                    <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 text-white" style={{ background: color }}>{n}</span>
                    <span className="flex-1 text-sm" style={{ color: isSuic ? '#991b1b' : 'var(--stone-700)' }}>{item?.label}</span>
                    <span className="text-sm font-bold" style={{ color }}>{score}/3</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Tabla completa */}
        <div className="rounded-2xl border overflow-hidden" style={{ background: 'white', borderColor: 'var(--stone-200)' }}>
          <table className="w-full text-sm">
            <thead style={{ background: 'var(--stone-50)', borderBottom: '1px solid var(--stone-200)' }}>
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-semibold" style={{ color: 'var(--stone-500)' }}>Ítem</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold" style={{ color: 'var(--stone-500)' }}>Dimensión</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold" style={{ color: 'var(--stone-500)' }}>Puntaje</th>
              </tr>
            </thead>
            <tbody>
              {BDI2_ITEMS.map((item, idx) => {
                const score   = responses[item.num] ?? 0
                const flagged = score >= 2
                return (
                  <tr key={item.num} style={{ borderBottom: idx < 20 ? '1px solid var(--stone-50)' : 'none', background: flagged ? `${color}06` : 'white' }}>
                    <td className="px-4 py-2.5 text-xs font-mono" style={{ color: 'var(--stone-400)' }}>{item.num}</td>
                    <td className="px-4 py-2.5" style={{ color: 'var(--stone-700)' }}>{item.label}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className="text-sm font-semibold" style={{ color: score >= 2 ? color : score >= 1 ? '#92400e' : 'var(--stone-400)' }}>
                        {score}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="text-center py-4">
          <p className="text-xs" style={{ color: 'var(--stone-400)' }}>Generado por AQN Praxis · Beck, Steer & Brown (1996) · BDI-II Manual</p>
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

export default function BdiReportPage() {
  return (
    <Suspense fallback={null}>
      <BdiReportPageInner />
    </Suspense>
  )
}
