/**
 * /session/[sessionId] — Panel del psicólogo (ScoringPanel)
 *
 * Interfaz principal del psicólogo durante la aplicación del WISC-V.
 * - Navegación por subpruebas en orden estándar
 * - Registro de puntajes ítem a ítem
 * - Cálculo automático de PE al ingresar el PD
 * - Pronóstico en tiempo real del CIT
 * - Control de la pantalla del evaluado (TestDisplay)
 * - Criterio de suspensión automático
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter }                      from 'next/navigation'
import { supabase }                              from '@supabase/supabase-js'
import { CancelSessionButton } from '@/components/CancelSession'
import { useSessionRealtime }                        from '@/hooks/useSessionRealtime'
import type { WiscScoringResult, SubtestCode }       from '@/lib/wisc5/engine'

const supabase = supabase(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ─── Configuración de subpruebas ─────────────────────────────

interface SubtestConfig {
  code: SubtestCode
  label: string
  maxItems: number
  maxRaw: number
  suspensionRule: string
  isPartOfCIT: boolean
  indexLabel: string
}

const SUBTESTS: SubtestConfig[] = [
  { code: 'CC',  label: 'Construcción con Cubos',     maxItems: 13, maxRaw: 58,  suspensionRule: '3 consecutivos = 0',  isPartOfCIT: true,  indexLabel: 'IVE / CIT' },
  { code: 'AN',  label: 'Analogías',                  maxItems: 23, maxRaw: 46,  suspensionRule: '5 consecutivos = 0',  isPartOfCIT: true,  indexLabel: 'ICV / CIT' },
  { code: 'MR',  label: 'Matrices de Razonamiento',   maxItems: 32, maxRaw: 32,  suspensionRule: '5 consecutivos = 0',  isPartOfCIT: true,  indexLabel: 'IRF / CIT' },
  { code: 'RD',  label: 'Retención de Dígitos',       maxItems: 54, maxRaw: 54,  suspensionRule: 'Ver criterio manual', isPartOfCIT: true,  indexLabel: 'IMT / CIT' },
  { code: 'CLA', label: 'Claves',                     maxItems: 75, maxRaw: 75,  suspensionRule: 'Límite de tiempo',    isPartOfCIT: true,  indexLabel: 'IVP / CIT' },
  { code: 'VOC', label: 'Vocabulario',                maxItems: 27, maxRaw: 54,  suspensionRule: '5 consecutivos = 0',  isPartOfCIT: true,  indexLabel: 'ICV / CIT' },
  { code: 'BAL', label: 'Balanzas',                   maxItems: 34, maxRaw: 34,  suspensionRule: '4 consecutivos = 0',  isPartOfCIT: true,  indexLabel: 'IRF / CIT' },
  { code: 'RV',  label: 'Rompecabezas Visuales',      maxItems: 29, maxRaw: 29,  suspensionRule: '5 consecutivos = 0',  isPartOfCIT: false, indexLabel: 'IVE (compl.)' },
  { code: 'RI',  label: 'Retención de Imágenes',      maxItems: 49, maxRaw: 49,  suspensionRule: 'Ver criterio manual', isPartOfCIT: false, indexLabel: 'IMT (compl.)' },
  { code: 'BS',  label: 'Búsqueda de Símbolos',       maxItems: 42, maxRaw: 42,  suspensionRule: 'Límite de tiempo',    isPartOfCIT: false, indexLabel: 'IVP (compl.)' },
  { code: 'IN',  label: 'Información',                maxItems: 31, maxRaw: 31,  suspensionRule: '5 consecutivos = 0',  isPartOfCIT: false, indexLabel: 'ICV (compl.)' },
  { code: 'SLN', label: 'Span Letras y Números',      maxItems: 30, maxRaw: 30,  suspensionRule: 'Ver criterio manual', isPartOfCIT: false, indexLabel: 'IMT (compl.)' },
  { code: 'CAN', label: 'Cancelación',                maxItems: 128,maxRaw: 128, suspensionRule: 'Límite de tiempo',    isPartOfCIT: false, indexLabel: 'VP (compl.)'  },
  { code: 'COM', label: 'Comprensión',                maxItems: 20, maxRaw: 40,  suspensionRule: '4 consecutivos = 0',  isPartOfCIT: false, indexLabel: 'ICV (compl.)' },
  { code: 'ARI', label: 'Aritmética',                 maxItems: 34, maxRaw: 34,  suspensionRule: '4 consecutivos = 0',  isPartOfCIT: false, indexLabel: 'IMT (compl.)' },
]

type RawScores = Partial<Record<SubtestCode, number>>

// ─── Componentes UI ───────────────────────────────────────────

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${color}`}>
      {label}
    </span>
  )
}

function IndexCard({
  code, score, percentile, ci90, classification, sumScaled
}: {
  code: string; score?: number; percentile?: string; ci90?: [number, number]
  classification?: string; sumScaled?: number
}) {
  if (!score) {
    return (
      <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col gap-1 opacity-40">
        <div className="text-xs font-semibold text-slate-400 tracking-wider">{code}</div>
        <div className="text-2xl font-light text-slate-300">—</div>
      </div>
    )
  }
  const classColor =
    score >= 130 ? 'text-violet-600' :
    score >= 120 ? 'text-blue-600' :
    score >= 110 ? 'text-emerald-600' :
    score >= 90  ? 'text-slate-700' :
    score >= 80  ? 'text-amber-600' :
    score >= 70  ? 'text-orange-600' : 'text-red-600'

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-1 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 tracking-wider">{code}</span>
        {sumScaled !== undefined && (
          <span className="text-xs text-slate-300">Σ={sumScaled}</span>
        )}
      </div>
      <div className={`text-3xl font-semibold ${classColor}`}>{score}</div>
      <div className="text-xs text-slate-400">
        P{percentile} · IC90: {ci90?.[0]}–{ci90?.[1]}
      </div>
      <div className={`text-xs font-medium mt-0.5 ${classColor}`}>{classification}</div>
    </div>
  )
}

function PredictionBanner({ prediction }: { prediction: WiscScoringResult['realtimePrediction'] }) {
  if (!prediction || !prediction.estimatedCIT) return null

  const { estimatedCIT, estimatedClassification, confidence, progressPercent } = prediction

  const confidenceLabel = confidence === 'high' ? 'Alta' : confidence === 'medium' ? 'Media' : 'Baja'
  const confidenceColor = confidence === 'high'
    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
    : confidence === 'medium'
    ? 'bg-amber-50 border-amber-200 text-amber-800'
    : 'bg-slate-50 border-slate-200 text-slate-500'

  return (
    <div className={`rounded-xl border px-4 py-3 flex items-center gap-4 ${confidenceColor}`}>
      <div className="flex-1">
        <div className="text-xs font-medium opacity-70 mb-0.5">Pronóstico CIT ({progressPercent}% completado)</div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold">~{estimatedCIT}</span>
          <span className="text-sm">{estimatedClassification}</span>
        </div>
      </div>
      <div className="text-right">
        <div className="text-xs opacity-60">Confianza</div>
        <div className="text-sm font-medium">{confidenceLabel}</div>
      </div>
      <div className="w-16">
        <div className="text-xs opacity-60 mb-1 text-right">{progressPercent}%</div>
        <div className="h-1.5 bg-black/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-current rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────

export default function ScoringPanel() {
  const params    = useParams()
  const router    = useRouter()
  const sessionId = params.sessionId as string

  const [channelName, setChannelName]       = useState<string | null>(null)
  const [patientName, setPatientName]       = useState('')
  const [ageLabel, setAgeLabel]             = useState('')
  const [activeSubtest, setActiveSubtest]   = useState<SubtestCode>('CC')
  const [rawScores, setRawScores]           = useState<RawScores>({})
  const [scoring, setScoring]               = useState<WiscScoringResult | null>(null)
  const [saving, setSaving]                 = useState(false)
  const [itemScores, setItemScores]         = useState<Record<string, number[]>>({})
  const [patientId, setPatientId]           = useState<string>('')

  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const { state, sendDisplayCommand, sendSessionControl } = useSessionRealtime(channelName)

  // Cargar datos de la sesión
  useEffect(() => {
    if (!sessionId) return
    fetch('/api/sessions/' + sessionId)
      .then(r => r.json())
      .then(data => {
        if (!data || data.error) return
        setChannelName(data.realtime_channel)
        setPatientName((data.patient as any)?.full_name ?? '')
        setPatientId((data.patient as any)?.id ?? '')
        const ay = data.age_years, am = data.age_months
        if (ay !== null && am !== null) setAgeLabel(ay + ' años ' + am + ' meses')
      })
  }, [sessionId])

  // Sincronizar scoring desde Realtime
  useEffect(() => {
    if (state.scoring) setScoring(state.scoring)
  }, [state.scoring])

  // Enviar puntajes al backend con debounce (500ms)
  const submitScore = useCallback((scores: RawScores) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSaving(true)
      try {
        const res = await fetch('/api/wisc5/score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, rawScores: scores }),
        })
        if (res.ok) {
          const result: WiscScoringResult = await res.json()
          setScoring(result)
        }
      } finally {
        setSaving(false)
      }
    }, 500)
  }, [sessionId])

  // Actualizar puntaje bruto de una subprueba
  const handleRawScore = useCallback((subtest: SubtestCode, value: string) => {
    const num = value === '' ? undefined : parseInt(value, 10)
    setRawScores(prev => {
      const next = { ...prev, [subtest]: num }
      if (num !== undefined && !isNaN(num)) submitScore(next)
      return next
    })
  }, [submitScore])

  // Avanzar ítem en la pantalla del evaluado
  const handleShowItem = useCallback((subtest: SubtestCode, item: number) => {
    sendDisplayCommand({
      type: 'show_item',
      subtest,
      itemNumber: item,
      text: `Ítem ${item}`,  // En producción, aquí vendría el texto/imagen real
    })
  }, [sendDisplayCommand])

  // Terminar sesión
  const handleEndSession = useCallback(async () => {
    await sendSessionControl('end_session')
    await fetch('/api/sessions/' + sessionId, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed', completed_at: new Date().toISOString() }),
    })
    router.push('/resultados/wisc5?session=' + sessionId)
  }, [sessionId, router, sendSessionControl])

  const activeConfig = SUBTESTS.find(s => s.code === activeSubtest)!

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-4">
        <div className="flex-1">
          <div className="font-medium text-slate-800">{patientName || 'Cargando…'}</div>
          <div className="text-xs text-slate-400">{ageLabel} · WISC-V Chile · Sesión {sessionId.slice(0,8)}</div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 text-xs ${state.connected ? 'text-emerald-600' : 'text-slate-400'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${state.connected ? 'bg-emerald-400' : 'bg-slate-300'}`} />
            {state.connected ? 'Pantalla conectada' : 'Sin conexión'}
          </div>
          {saving && <span className="text-xs text-indigo-400 animate-pulse">Guardando…</span>}
          <CancelSessionButton sessionId={sessionId} patientId={patientId} />
          <button
            onClick={handleEndSession}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
          >
            Finalizar sesión
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar: lista de subpruebas */}
        <aside className="w-56 bg-white border-r border-slate-100 flex flex-col py-3 overflow-y-auto">
          <div className="px-4 pb-2 text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
            Subpruebas
          </div>
          {SUBTESTS.map(s => {
            const hasScore  = rawScores[s.code] !== undefined
            const isActive  = s.code === activeSubtest
            return (
              <button
                key={s.code}
                onClick={() => setActiveSubtest(s.code)}
                className={`w-full text-left px-4 py-2.5 flex items-center gap-2.5 transition-colors
                  ${isActive
                    ? 'bg-indigo-50 text-indigo-700 border-r-2 border-indigo-500'
                    : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold flex-shrink-0
                  ${hasScore ? 'bg-indigo-500 text-white' : isActive ? 'bg-indigo-100 text-indigo-500' : 'bg-slate-100 text-slate-400'}`}>
                  {s.code.length <= 2 ? s.code : s.code.slice(0,2)}
                </span>
                <span className="text-xs truncate">{s.label}</span>
                {s.isPartOfCIT && (
                  <span className="ml-auto w-1 h-1 rounded-full bg-indigo-300 flex-shrink-0" title="Subprueba CIT" />
                )}
              </button>
            )
          })}
        </aside>

        {/* Panel central: subprueba activa */}
        <main className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">

          {/* Header de subprueba */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="text-lg font-medium text-slate-800">{activeConfig.label}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge label={activeConfig.indexLabel} color="bg-indigo-50 text-indigo-600" />
                  <Badge
                    label={activeConfig.isPartOfCIT ? 'CIT' : 'Complementaria'}
                    color={activeConfig.isPartOfCIT ? 'bg-violet-50 text-violet-600' : 'bg-slate-100 text-slate-500'}
                  />
                </div>
              </div>
              <div className="text-right text-xs text-slate-400">
                <div>Puntaje máx.: {activeConfig.maxRaw}</div>
                <div className="mt-1">{activeConfig.suspensionRule}</div>
              </div>
            </div>

            {/* Input de puntaje bruto */}
            <div className="flex items-end gap-4 mt-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                  Puntaje Bruto Total (PD)
                </label>
                <input
                  type="number"
                  min={0}
                  max={activeConfig.maxRaw}
                  value={rawScores[activeSubtest] ?? ''}
                  onChange={e => handleRawScore(activeSubtest, e.target.value)}
                  className="w-full text-2xl font-light px-4 py-3 rounded-xl border border-slate-200
                             focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100
                             text-slate-800 bg-slate-50 transition-all"
                  placeholder="0"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                  Puntaje Escala (PE)
                </label>
                <div className={`text-2xl font-semibold px-4 py-3 rounded-xl border
                  ${scoring?.scaledScores?.[activeSubtest]
                    ? 'bg-white border-indigo-200 text-indigo-700'
                    : 'bg-slate-50 border-slate-100 text-slate-300'}`}>
                  {scoring?.scaledScores?.[activeSubtest] ?? '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Control de pantalla del evaluado */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-slate-700">Control de pantalla (evaluado)</h3>
              <button
                onClick={() => sendDisplayCommand({ type: 'show_instructions', subtest: activeSubtest, text: `Ahora vamos a hacer ${activeConfig.label}.` })}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Mostrar instrucciones
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: Math.min(activeConfig.maxItems, 20) }, (_, i) => i + 1).map(item => (
                <button
                  key={item}
                  onClick={() => handleShowItem(activeSubtest, item)}
                  className={`w-9 h-9 text-xs rounded-lg border transition-colors font-medium
                    ${state.currentItem === item && state.currentSubtest === activeSubtest
                      ? 'bg-indigo-500 border-indigo-500 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600'}`}
                >
                  {item}
                </button>
              ))}
              {activeConfig.maxItems > 20 && (
                <span className="text-xs text-slate-400 self-center px-1">
                  +{activeConfig.maxItems - 20} más…
                </span>
              )}
            </div>
          </div>

        </main>

        {/* Panel derecho: índices y pronóstico */}
        <aside className="w-72 bg-white border-l border-slate-100 p-4 overflow-y-auto flex flex-col gap-4">

          {/* Pronóstico */}
          <PredictionBanner prediction={scoring?.realtimePrediction} />

          {/* Índices principales */}
          <div>
            <div className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase mb-3">
              Índices principales
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(['ICV', 'IVE', 'IRF', 'IMT', 'IVP'] as const).map(idx => (
                <IndexCard
                  key={idx}
                  code={idx}
                  score={scoring?.[idx]?.score}
                  percentile={scoring?.[idx]?.percentile}
                  ci90={scoring?.[idx]?.ci90}
                  classification={scoring?.[idx]?.classification}
                  sumScaled={scoring?.[idx]?.sumScaled}
                />
              ))}
            </div>
          </div>

          {/* CIT */}
          <div>
            <div className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase mb-2">
              Cociente Intelectual Total
            </div>
            <IndexCard
              code="CIT"
              score={scoring?.CIT?.score}
              percentile={scoring?.CIT?.percentile}
              ci90={scoring?.CIT?.ci90}
              classification={scoring?.CIT?.classification}
              sumScaled={scoring?.CIT?.sumScaled}
            />
          </div>

          {/* Progreso */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Progreso
            </div>
            <div className="space-y-1.5">
              {SUBTESTS.filter(s => s.isPartOfCIT).map(s => (
                <div key={s.code} className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0
                    ${rawScores[s.code] !== undefined ? 'bg-indigo-500' : 'bg-slate-200'}`} />
                  <span className="text-xs text-slate-500 truncate flex-1">{s.label}</span>
                  {rawScores[s.code] !== undefined && (
                    <span className="text-xs font-medium text-indigo-600">
                      PD {rawScores[s.code]} · PE {scoring?.scaledScores?.[s.code] ?? '…'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

        </aside>
      </div>
    </div>
  )
}
