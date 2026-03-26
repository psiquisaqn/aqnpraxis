'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { IndexProfile } from '@/app/session/[sessionId]/report/IndexProfile'
import { ScoresTable } from '@/app/session/[sessionId]/report/ScoresTable'
import { IndicesTable } from '@/app/session/[sessionId]/report/IndicesTable'
import type { WiscScoringResult, SubtestCode, CompositeResult } from '@/lib/wisc5/engine'
import { PdfDownloadButton } from '@/components/PdfDownloadButton'

interface SessionData {
  id: string
  status: string
  started_at: string
  completed_at?: string
  age_years: number
  age_months: number
  age_days: number
  age_group: string
  patient: {
    id: string
    full_name: string
    rut?: string
    birth_date: string
    gender?: string
    school?: string
    grade?: string
    city?: string
  }
  wisc5_scores: WiscDbScores | null
}

interface WiscDbScores {
  cc_raw?: number;  cc_scaled?: number
  an_raw?: number;  an_scaled?: number
  mr_raw?: number;  mr_scaled?: number
  rd_raw?: number;  rd_scaled?: number
  cla_raw?: number; cla_scaled?: number
  voc_raw?: number; voc_scaled?: number
  bal_raw?: number; bal_scaled?: number
  rv_raw?: number;  rv_scaled?: number
  ri_raw?: number;  ri_scaled?: number
  bs_raw?: number;  bs_scaled?: number
  in_raw?: number;  in_scaled?: number
  sln_raw?: number; sln_scaled?: number
  can_raw?: number; can_scaled?: number
  com_raw?: number; com_scaled?: number
  ari_raw?: number; ari_scaled?: number
  icv?: number; icv_percentile?: string; icv_ci90_lo?: number; icv_ci90_hi?: number
  ive?: number; ive_percentile?: string; ive_ci90_lo?: number; ive_ci90_hi?: number
  irf?: number; irf_percentile?: string; irf_ci90_lo?: number; irf_ci90_hi?: number
  imt?: number; imt_percentile?: string; imt_ci90_lo?: number; imt_ci90_hi?: number
  ivp?: number; ivp_percentile?: string; ivp_ci90_lo?: number; ivp_ci90_hi?: number
  cit?: number; cit_percentile?: string; cit_ci90_lo?: number; cit_ci90_hi?: number
  classification?: string
}

// Reconstruye CompositeResult desde columnas flat de la BD
function toComposite(
  score?: number, percentile?: string,
  ci_lo?: number, ci_hi?: number
): CompositeResult | undefined {
  if (!score || !percentile || ci_lo == null || ci_hi == null) return undefined
  const classification =
    score >= 130 ? 'Muy superior' :
    score >= 120 ? 'Superior' :
    score >= 110 ? 'Promedio alto' :
    score >= 90  ? 'Promedio' :
    score >= 80  ? 'Promedio bajo' :
    score >= 70  ? 'Limítrofe' : 'Extremadamente bajo'

  return { score, percentile, ci90: [ci_lo, ci_hi], ci95: [ci_lo - 2, ci_hi + 2], classification, sumScaled: 0 }
}

function dbToScoringResult(db: WiscDbScores): Partial<WiscScoringResult> {
  const scaledScores: Partial<Record<SubtestCode, number>> = {}
  const rawScores: Partial<Record<SubtestCode, number>> = {}

  const MAP: [string, SubtestCode][] = [
    ['cc', 'CC'], ['an', 'AN'], ['mr', 'MR'], ['rd', 'RD'], ['cla', 'CLA'],
    ['voc', 'VOC'], ['bal', 'BAL'], ['rv', 'RV'], ['ri', 'RI'], ['bs', 'BS'],
    ['in', 'IN'], ['sln', 'SLN'], ['can', 'CAN'], ['com', 'COM'], ['ari', 'ARI'],
  ]

  for (const [key, code] of MAP) {
    const raw = (db as any)[`${key}_raw`]
    const scaled = (db as any)[`${key}_scaled`]
    if (raw !== undefined && raw !== null) rawScores[code] = raw
    if (scaled !== undefined && scaled !== null) scaledScores[code] = scaled
  }

  return {
    scaledScores,
    ICV: toComposite(db.icv, db.icv_percentile, db.icv_ci90_lo, db.icv_ci90_hi),
    IVE: toComposite(db.ive, db.ive_percentile, db.ive_ci90_lo, db.ive_ci90_hi),
    IRF: toComposite(db.irf, db.irf_percentile, db.irf_ci90_lo, db.irf_ci90_hi),
    IMT: toComposite(db.imt, db.imt_percentile, db.imt_ci90_lo, db.imt_ci90_hi),
    IVP: toComposite(db.ivp, db.ivp_percentile, db.ivp_ci90_lo, db.ivp_ci90_hi),
    CIT: toComposite(db.cit, db.cit_percentile, db.cit_ci90_lo, db.cit_ci90_hi),
    _rawScores: rawScores,
  } as any
}

const GENDER_LABEL: Record<string, string> = { M: 'Masculino', F: 'Femenino', NB: 'No binario', NS: 'No especifica' }

function formatDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })
}

function getCITColor(score: number): string {
  if (score >= 130) return '#1E40AF'      // Muy superior
  if (score >= 120) return '#2563EB'      // Superior
  if (score >= 110) return '#3B82F6'      // Promedio alto
  if (score >= 90)  return '#10B981'      // Promedio
  if (score >= 80)  return '#F59E0B'      // Promedio bajo
  if (score >= 70)  return '#F97316'      // Limítrofe
  return '#EF4444'                         // Extremadamente bajo
}

function ReportPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session') ?? ''
  const printRef = useRef<HTMLDivElement>(null)

  const [session, setSession] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId) return
    fetch('/api/wisc5/session?sessionId=' + sessionId)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error)
        else setSession(data)
      })
      .catch(() => setError('Error al cargar la sesión'))
      .finally(() => setLoading(false))
  }, [sessionId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin border-blue-500" />
          <p className="text-sm text-gray-500">Cargando resultados…</p>
        </div>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-sm font-medium text-gray-700">No se pudo cargar la sesión</p>
          <button onClick={() => router.back()} className="mt-3 text-sm text-blue-600 hover:text-blue-700">
            ← Volver
          </button>
        </div>
      </div>
    )
  }

  const db = session.wisc5_scores
  if (!db) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">Esta sesión no tiene puntajes registrados.</p>
      </div>
    )
  }

  const scoring = dbToScoringResult(db)
  const rawScores = (scoring as any)._rawScores ?? {}
  const scaledScores = scoring.scaledScores ?? {}

  const INDICES = [
    { code: 'ICV', label: 'Índice de Comprensión Verbal',    result: scoring.ICV },
    { code: 'IVE', label: 'Índice Visuoespacial',            result: scoring.IVE },
    { code: 'IRF', label: 'Índice de Razonamiento Fluido',   result: scoring.IRF },
    { code: 'IMT', label: 'Índice de Memoria de Trabajo',    result: scoring.IMT },
    { code: 'IVP', label: 'Índice de Velocidad de Procesamiento', result: scoring.IVP },
  ]

  const patient = session.patient

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toolbar fijo */}
      <div className="sticky top-0 z-20 border-b px-4 py-3 flex items-center gap-3 bg-white border-gray-200">
        <button
          onClick={() => router.push(`/dashboard/paciente/${patient.id}`)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Ficha del paciente
        </button>

        <div className="flex-1" />

        <span className="text-xs text-gray-400">
          WISC-V · {session.age_group}
        </span>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 transition-colors"
        >
          Imprimir
        </button>
        <PdfDownloadButton
          contentRef={printRef}
          meta={{
            sessionId,
            patientId: patient.id,
            testId: 'wisc5_cl',
            patientName: patient.full_name,
            evalDate: session.started_at,
            content: { cit: scoring?.CIT?.score, classification: scoring?.CIT?.classification },
          }}
        />
      </div>

      {/* Contenido principal */}
      <div ref={printRef} className="max-w-4xl mx-auto px-4 py-6 md:px-6 md:py-8 space-y-6">

        {/* Encabezado del informe */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 md:p-6">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded bg-blue-50 text-blue-600">
                  WISC-V Chile
                </span>
                <span className="text-xs text-gray-400">
                  {session.age_group}
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-medium text-gray-900">
                {patient.full_name}
              </h1>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                <span>{session.age_years} años {session.age_months} meses {session.age_days} días</span>
                {patient.gender && <span>· {GENDER_LABEL[patient.gender] ?? patient.gender}</span>}
                {patient.school && <span>· {patient.school}</span>}
                {patient.grade  && <span>· {patient.grade}</span>}
                {patient.rut    && <span>· RUT: {patient.rut}</span>}
              </div>
            </div>
            <div className="text-right text-sm text-gray-400">
              <div>Fecha de evaluación</div>
              <div className="font-medium text-gray-700">
                {formatDate(session.started_at)}
              </div>
              {session.completed_at && (
                <>
                  <div className="mt-1">Fecha de término</div>
                  <div className="font-medium text-gray-700">
                    {formatDate(session.completed_at)}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* CIT destacado */}
          {scoring.CIT && (
            <div className="mt-5 px-5 py-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div>
                  <p className="text-xs font-medium uppercase tracking-widest mb-0.5 text-gray-400">
                    Cociente Intelectual Total
                  </p>
                  <div className="flex items-baseline gap-3">
                    <span
                      className="text-5xl font-bold"
                      style={{
                        fontFamily: 'var(--font-serif)',
                        color: getCITColor(scoring.CIT.score),
                      }}
                    >
                      {scoring.CIT.score}
                    </span>
                    <div>
                      <div className="text-sm font-semibold" style={{ color: getCITColor(scoring.CIT.score) }}>
                        {scoring.CIT.classification}
                      </div>
                      <div className="text-xs text-gray-400">
                        Percentil {scoring.CIT.percentile}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="h-2 rounded-full overflow-hidden bg-gray-200">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${(scoring.CIT.score / 160) * 100}%`, background: getCITColor(scoring.CIT.score) }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                    <span>40</span><span>70</span><span>85</span><span>100</span><span>115</span><span>130</span><span>160</span>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  IC 90%: {scoring.CIT.ci90[0]}–{scoring.CIT.ci90[1]}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Perfil de índices */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 md:p-6">
          <h2 className="text-sm font-semibold mb-5 uppercase tracking-widest text-gray-400">
            Perfil de índices
          </h2>
          <IndexProfile indices={INDICES} cit={scoring.CIT} />
        </div>

        {/* Tabla de índices */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 md:p-6">
          <h2 className="text-sm font-semibold mb-5 uppercase tracking-widest text-gray-400">
            Puntajes compuestos
          </h2>
          <IndicesTable rows={[
            ...INDICES,
            { code: 'CIT', label: 'Cociente Intelectual Total', result: scoring.CIT },
          ]} />
        </div>

        {/* Tabla de subpruebas */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 md:p-6">
          <h2 className="text-sm font-semibold mb-5 uppercase tracking-widest text-gray-400">
            Puntajes por subprueba
          </h2>
          <ScoresTable rawScores={rawScores} scaledScores={scaledScores} />
        </div>

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-xs text-gray-400">
            Generado por AQN Praxis · Psiquis AQN · Santiago, Chile
            <span className="mx-2">·</span>
            {new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
          <p className="text-xs mt-0.5 text-gray-300">
            Normas: Manual WISC-V CL, Ricardo Rosas D. & Marcelo Pizarro M. · CEDETi UC / PUC Chile
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ReportPage() {
  return (
    <Suspense fallback={null}>
      <ReportPageInner />
    </Suspense>
  )
}
