'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { PdfDownloadButton } from '@/components/PdfDownloadButton'
import { scorePeca, DIMENSIONS, AAMR_SETS, type PecaResult, type SupportIntensity } from '@/lib/peca/engine'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ── Colores por intensidad ──────────────────────────────────────────
const INTENSITY_STYLE: Record<SupportIntensity, { bg: string; text: string; bar: string }> = {
  en_buen_nivel: { bg: 'rgba(20,184,166,0.09)',  text: '#0f766e', bar: '#14b8a6' },
  intermitente:  { bg: 'rgba(234,179,8,0.10)',   text: '#92400e', bar: '#f59e0b' },
  limitado:      { bg: 'rgba(249,115,22,0.10)',  text: '#9a3412', bar: '#f97316' },
  extenso:       { bg: 'rgba(239,68,68,0.10)',   text: '#991b1b', bar: '#ef4444' },
  generalizado:  { bg: 'rgba(139,92,246,0.10)',  text: '#5b21b6', bar: '#8b5cf6' },
}

function DimensionBar({ label, p2, intensity }: { label: string; p2: number; intensity: SupportIntensity }) {
  const style = INTENSITY_STYLE[intensity]
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs w-52 shrink-0 truncate" style={{ color: 'var(--stone-600)' }}>{label}</span>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--stone-100)' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${p2 * 100}%`, background: style.bar }}
        />
      </div>
      <span className="text-xs w-20 shrink-0 text-right font-medium px-2 py-0.5 rounded-full" style={{ background: style.bg, color: style.text }}>
        {(p2 * 100).toFixed(0)}%
      </span>
    </div>
  )
}

export default function PecaReportPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session') ?? ''

  const contentRef = useRef<HTMLDivElement>(null)
  const [result, setResult] = useState<PecaResult | null>(null)
  const [patientName, setPatientName] = useState('')
  const [evalDate, setEvalDate] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!sessionId) return
    supabase
      .from('peca_scores')
      .select('*, session:sessions(started_at, patient:patients(full_name))')
      .eq('session_id', sessionId)
      .single()
      .then(({ data }) => {
        if (!data) { setLoading(false); return }
        // Reconstruir respuestas desde columnas p01..p45
        const responses: Record<number, number> = {}
        for (let i = 1; i <= 45; i++) {
          const key = `p${String(i).padStart(2, '0')}` as keyof typeof data
          if (data[key] !== null && data[key] !== undefined) {
            responses[i] = data[key] as number
          }
        }
        const scored = scorePeca(responses as Partial<Record<number, 1|2|3|4>>)
        setResult(scored)
        setPatientName((data.session as any)?.patient?.full_name ?? '')
        const d = (data.session as any)?.started_at
        if (d) setEvalDate(new Date(d).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' }))
        setLoading(false)
      })
  }, [sessionId])

  if (loading) return <LoadingScreen />
  if (!result)  return <ErrorScreen onBack={() => router.back()} />

  return (
    <div className="min-h-screen" style={{ background: 'var(--stone-100)' }}>
      {/* Toolbar */}
      <div className="sticky top-0 z-20 border-b px-6 py-3 flex items-center gap-3" style={{ background: 'white', borderColor: 'var(--stone-200)' }}>
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--stone-500)' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Volver
        </button>
        <div className="flex-1" />
        <span className="text-xs" style={{ color: 'var(--stone-400)' }}>PECA — Conducta Adaptativa</span>
        <button onClick={() => window.print()} className="text-xs font-medium px-3 py-1.5 rounded-lg border" style={{ color: 'var(--stone-600)', borderColor: 'var(--stone-200)' }}>
          Imprimir
        </button>
        {result && (
          <PdfDownloadButton
            contentRef={contentRef}
            meta={{ sessionId, patientId: '', testId: 'peca_aqn', patientName }}
          />
        )}
      </div>

      <div ref={contentRef} className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Encabezado */}
        <div className="rounded-2xl border p-6" style={{ background: 'white', borderColor: 'var(--stone-200)' }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded" style={{ background: 'rgba(124,58,237,0.08)', color: '#7c3aed' }}>PECA</span>
              <h1 className="text-2xl font-medium mt-2" style={{ fontFamily: 'var(--font-serif)', color: 'var(--stone-900)' }}>{patientName || 'Paciente'}</h1>
              <p className="text-sm mt-0.5" style={{ color: 'var(--stone-400)' }}>Prueba de Evaluación de Conducta Adaptativa</p>
            </div>
            <div className="text-right text-sm" style={{ color: 'var(--stone-400)' }}>
              <div>Fecha de evaluación</div>
              <div className="font-medium" style={{ color: 'var(--stone-700)' }}>{evalDate || '—'}</div>
            </div>
          </div>

          {/* Nivel de participación */}
          <div className="mt-5 px-5 py-4 rounded-xl" style={{ background: 'var(--stone-50)', border: '1px solid var(--stone-100)' }}>
            <p className="text-xs font-medium uppercase tracking-widest mb-2" style={{ color: 'var(--stone-400)' }}>Nivel de participación global</p>
            <div className="flex items-center gap-4">
              <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: 'var(--stone-200)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${result.participationLevel * 100}%`, background: result.participationNeeds ? '#f97316' : '#14b8a6' }}
                />
              </div>
              <span className="text-2xl font-bold shrink-0" style={{ color: result.participationNeeds ? '#9a3412' : '#0f766e', fontFamily: 'var(--font-serif)' }}>
                {(result.participationLevel * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-xs mt-3 leading-relaxed" style={{ color: 'var(--stone-600)' }}>{result.participationText}</p>
          </div>
        </div>

        {/* Conjuntos AAMR */}
        <div className="rounded-2xl border p-6" style={{ background: 'white', borderColor: 'var(--stone-200)' }}>
          <h2 className="text-sm font-semibold uppercase tracking-widest mb-5" style={{ color: 'var(--stone-400)' }}>Dominios AAMR</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {result.aamrSets.map((s) => {
              const color = s.needsSupport ? '#f97316' : '#14b8a6'
              const bg    = s.needsSupport ? 'rgba(249,115,22,0.08)' : 'rgba(20,184,166,0.08)'
              return (
                <div key={s.code} className="rounded-xl p-4 border" style={{ borderColor: 'var(--stone-100)', background: bg }}>
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color }}>{s.label}</p>
                  <p className="text-2xl font-bold mt-1" style={{ color, fontFamily: 'var(--font-serif)' }}>
                    {(s.p2 * 100).toFixed(0)}%
                  </p>
                  <p className="text-xs mt-1 font-medium" style={{ color }}>{s.demandLabel}</p>
                  <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--stone-500)', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {s.descriptionText}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Perfil de dimensiones */}
        <div className="rounded-2xl border p-6" style={{ background: 'white', borderColor: 'var(--stone-200)' }}>
          <h2 className="text-sm font-semibold uppercase tracking-widest mb-5" style={{ color: 'var(--stone-400)' }}>Perfil por dimensión</h2>
          <div className="space-y-3">
            {result.dimensions.map((d) => (
              <DimensionBar key={d.code} label={d.label} p2={d.p2} intensity={d.intensity} />
            ))}
          </div>
          {/* Leyenda */}
          <div className="flex flex-wrap gap-3 mt-5 pt-4 border-t" style={{ borderColor: 'var(--stone-100)' }}>
            {(Object.entries(INTENSITY_STYLE) as [SupportIntensity, typeof INTENSITY_STYLE[SupportIntensity]][]).map(([key, style]) => (
              <div key={key} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: style.bar }} />
                <span className="text-xs capitalize" style={{ color: 'var(--stone-500)' }}>
                  {key === 'en_buen_nivel' ? 'Buen nivel' : key.charAt(0).toUpperCase() + key.slice(1)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Tabla detallada */}
        <div className="rounded-2xl border overflow-hidden" style={{ background: 'white', borderColor: 'var(--stone-200)' }}>
          <table className="w-full text-sm">
            <thead style={{ background: 'var(--stone-50)' }}>
              <tr style={{ borderBottom: '1px solid var(--stone-200)' }}>
                {['Dimensión', 'Ítems', '% Logro', 'Intensidad de apoyo'].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold" style={{ color: 'var(--stone-500)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.dimensions.map((d, i) => {
                const style = INTENSITY_STYLE[d.intensity]
                return (
                  <tr key={d.code} style={{ borderBottom: i < result.dimensions.length - 1 ? '1px solid var(--stone-100)' : 'none' }}>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--stone-700)' }}>{d.label}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--stone-400)' }}>{d.itemsAnswered}/{d.itemsTotal}</td>
                    <td className="px-4 py-3 font-semibold" style={{ color: style.text }}>{(d.p2 * 100).toFixed(0)}%</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: style.bg, color: style.text }}>
                        {d.intensityLabel}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <Footer />
      </div>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--stone-50)' }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--teal-500)', borderTopColor: 'transparent' }} />
        <p className="text-sm" style={{ color: 'var(--stone-500)' }}>Cargando resultados…</p>
      </div>
    </div>
  )
}
function ErrorScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--stone-50)' }}>
      <div className="text-center">
        <p className="text-sm font-medium" style={{ color: 'var(--stone-700)' }}>No se encontraron resultados</p>
        <button onClick={onBack} className="mt-3 text-sm" style={{ color: 'var(--teal-600)' }}>← Volver</button>
      </div>
    </div>
  )
}
function Footer() {
  return (
    <div className="text-center py-4">
      <p className="text-xs" style={{ color: 'var(--stone-400)' }}>
        Generado por AQN Praxis · Ps. Antonio Baeza H. · Psiquis AQN
      </p>
    </div>
  )
}
