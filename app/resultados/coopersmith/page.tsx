'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { PdfDownloadButton } from '@/components/PdfDownloadButton'
import { useReportDocx } from '@/hooks/useReportDocx'
import { scoreCoopersmith, type CooperResult } from '@/lib/coopersmith/engine'
import { ReporteHeader } from '@/components/ReporteHeader'
import { ReporteFooter } from '@/components/ReporteFooter'

// Importar interpretaciones desde lib
import { getInterpretacionSubescala, getConclusionGeneral } from '@/lib/interpretaciones/coopersmith'

const printStyles = `
  @media print {
    body { margin: 0; padding: 0; background: white; }
    .no-print { display: none; }
    .reporte-container { padding: 1.5cm; width: 100%; }
    .page-break-before { page-break-before: avoid; }
    .page-break-inside { page-break-inside: avoid; }
    h2, h3, .grafico-barras-container { page-break-inside: avoid; }
  }
`

function GraficoBarras({ data, maxValue = 100 }: { data: Array<{ label: string; value: number; max: number }>; maxValue?: number }) {
  const maxVal = Math.max(...data.map(d => d.value), maxValue)
  return (
    <div className="grafico-barras-container" style={{ margin: '20px 0', fontFamily: 'Georgia, Times New Roman, serif', pageBreakInside: 'avoid' }}>
      <div className="grafico-barras" style={{ 
        display: 'flex', 
        justifyContent: 'space-around', 
        alignItems: 'flex-end', 
        minHeight: '220px',
        borderBottom: '1px solid #333',
        borderLeft: '1px solid #333',
        paddingLeft: '10px',
        paddingBottom: '10px',
        margin: '10px 0'
      }}>
        {data.map((item, idx) => {
          const alturaRelativa = (item.value / maxVal) * 150
          return (
            <div key={idx} style={{ textAlign: 'center', width: '70px' }}>
              <div style={{ 
                backgroundColor: '#4a4a4a', 
                width: '40px', 
                margin: '0 auto', 
                height: `${Math.max(alturaRelativa, 4)}px`,
                marginBottom: '8px'
              }} title={`${item.value} / ${item.max}`} />
              <div style={{ fontSize: '11px', fontWeight: 'bold', fontFamily: 'Georgia, Times New Roman, serif' }}>{item.label}</div>
              <div style={{ fontSize: '10px', color: '#555' }}>{item.value}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function buildResultFromDb(db: any): CooperResult | null {
  if (!db) return null
  const resp: Record<number, 'igual' | 'diferente'> = {}
  for (let i = 1; i <= 58; i++) {
    const key = `r${String(i).padStart(2, '0')}`
    if (db[key] !== null && db[key] !== undefined) {
      resp[i] = db[key] as 'igual' | 'diferente'
    }
  }
  if (Object.keys(resp).length > 0) {
    return scoreCoopersmith(resp)
  }

  const totalScaled = db.total_scaled ?? 0
  if (totalScaled === 0 && !db.level_label) return null

  let level: 'muy_alta' | 'alta' | 'media_alta' | 'media_baja' | 'baja' | 'muy_baja'
  let levelLabel: string
  let levelColor: string
  let levelDescription: string

  if (db.level_label) {
    levelLabel = db.level_label
  } else {
    levelLabel = totalScaled >= 75 ? 'Alta' : totalScaled >= 50 ? 'Media alta' : totalScaled >= 25 ? 'Media baja' : 'Baja'
  }

  if (totalScaled >= 75) {
    level = 'alta'; levelColor = '#3B6D11'
    levelDescription = 'El evaluado presenta una autoestima alta y bien consolidada, con una percepción positiva de sí mismo.'
  } else if (totalScaled >= 50) {
    level = 'media_alta'; levelColor = '#639922'
    levelDescription = 'El evaluado presenta una autoestima en rango medio-alto, mostrando una percepción generalmente positiva.'
  } else if (totalScaled >= 25) {
    level = 'media_baja'; levelColor = '#854F0B'
    levelDescription = 'El evaluado presenta una autoestima en rango medio-bajo, con dificultades en algunas áreas específicas.'
  } else {
    level = 'baja'; levelColor = '#A32D2D'
    levelDescription = 'El evaluado presenta una autoestima baja, con un patrón consistente de autodescalificación.'
  }

  if (db.level_color) levelColor = db.level_color

  const subscales = [
    { code: 'general', label: 'General (G)', rawScore: 0, scaledScore: db.score_general ?? 0, maxScaled: 26, pct: (db.score_general ?? 0) / 26 },
    { code: 'social',  label: 'Social (S)',  rawScore: 0, scaledScore: db.score_social  ?? 0, maxScaled: 8,  pct: (db.score_social  ?? 0) / 8  },
    { code: 'hogar',   label: 'Hogar (H)',   rawScore: 0, scaledScore: db.score_hogar   ?? 0, maxScaled: 8,  pct: (db.score_hogar   ?? 0) / 8  },
    { code: 'escolar', label: 'Escolar (E)', rawScore: 0, scaledScore: db.score_escolar ?? 0, maxScaled: 8,  pct: (db.score_escolar ?? 0) / 8  },
  ]

  return {
    totalRaw:        db.total_raw ?? 0,
    totalScaled,
    level,
    levelLabel,
    levelColor,
    levelDescription,
    lieScaleRaw:     db.lie_scale_raw     ?? 0,
    lieScaleInvalid: db.lie_scale_invalid ?? false,
    subscales,
  } as CooperResult
}

function CoopersmithReportPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session') ?? ''

  const contentRef = useRef<HTMLDivElement>(null)
  const [result, setResult] = useState<CooperResult | null>(null)
  const [patientName, setPatientName] = useState('')
  const [patientId, setPatientId] = useState('')
  const [patientRut, setPatientRut] = useState('')
  const [patientBirthDate, setPatientBirthDate] = useState('')
  const [patientAge, setPatientAge] = useState<number | undefined>(undefined)
  const [patientSchool, setPatientSchool] = useState('')
  const [evalDate, setEvalDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [planStatus, setPlanStatus] = useState<any>(null)

  const { generateDocx } = useReportDocx()

  useEffect(() => {
    if (!sessionId) return

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    async function load() {
      try {
        const { data: scores, error: scoresError } = await supabase
          .from('coopersmith_scores')
          .select('*')
          .eq('session_id', sessionId)
          .single()

        if (scoresError || !scores) {
          setLoading(false)
          return
        }

        const built = buildResultFromDb(scores)
        setResult(built)

        const { data: sessionData } = await supabase
          .from('sessions')
          .select('started_at, patient:patients(id, full_name, rut, birth_date, school)')
          .eq('id', sessionId)
          .single()

        if (sessionData?.patient) {
          const p = sessionData.patient as any
          setPatientName(p.full_name ?? '')
          setPatientId(p.id ?? '')
          setPatientRut(p.rut ?? '')
          setPatientSchool(p.school ?? '')
          if (p.birth_date) {
            setPatientBirthDate(new Date(p.birth_date).toLocaleDateString('es-CL'))
            const age = new Date().getFullYear() - new Date(p.birth_date).getFullYear()
            setPatientAge(age)
          }
        }
        if (sessionData?.started_at) {
          setEvalDate(new Date(sessionData.started_at).toLocaleDateString('es-CL', {
            day: '2-digit', month: 'long', year: 'numeric'
          }))
        }

        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: planData } = await supabase.rpc('get_plan_status', { p_user_id: user.id })
          const plan = Array.isArray(planData) ? planData[0] : planData
          setPlanStatus(plan)
        }

      } catch (err) {
        console.error('Error cargando datos:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [sessionId])

  const isPro = planStatus?.is_pro || false

  const handleDownload = (type: 'docx' | 'odt') => {
    if (!result) return
    const subscales = result.subscales.reduce((acc, s) => {
      acc[s.code] = s.scaledScore
      return acc
    }, {} as Record<string, number>)

    const meta = {
      sessionId,
      patientId,
      testId: 'coopersmith',
      patientName,
      patientRut,
      patientBirthDate,
      patientAge,
      patientSchool,
      evalDate,
      content: {
        totalScore: result.totalScaled,
        level: result.level,
        general: subscales.general || 0,
        social: subscales.social || 0,
        familiar: subscales.hogar || 0,
        academico: subscales.escolar || 0,
      }
    }
    generateDocx(contentRef, meta, type)
  }

  if (loading) return <Spinner />
  if (!result)  return <Error onBack={() => router.back()} />

  const datosGrafico = result.subscales.map(s => ({
    label: s.label,
    value: s.scaledScore,
    max: s.maxScaled
  }))

  const levelColorHex = result.levelColor

  return (
    <div className="min-h-screen" style={{ background: 'white' }}>
      <style>{printStyles}</style>
      
      <div className="sticky top-0 z-20 border-b px-6 py-3 flex items-center gap-3 flex-wrap no-print" style={{ background: 'white', borderColor: '#e5e5e0' }}>
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm" style={{ color: '#6b7280' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Volver
        </button>
        <div className="flex-1" />
        <span className="text-xs" style={{ color: '#9ca3af' }}>Coopersmith SEI — Inventario de Autoestima</span>
        {patientId && (
          <button onClick={() => router.push(`/dashboard/paciente/${patientId}`)}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border"
            style={{ color: '#4b5563', borderColor: '#e5e5e0' }}>
            Ver ficha del paciente
          </button>
        )}
        <button onClick={() => window.print()} className="text-xs font-medium px-3 py-1.5 rounded-lg border" style={{ color: '#4b5563', borderColor: '#e5e5e0' }}>
          Imprimir
        </button>
        <PdfDownloadButton
          contentRef={contentRef}
          meta={{ sessionId, patientId, testId: 'coopersmith', patientName, content: { total: result.totalScaled, level: result.level } }}
          label="PDF"
        />
        {isPro && (
          <>
            <button
              onClick={() => handleDownload('docx')}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
            >
              DOCX
            </button>
            <button
              onClick={() => handleDownload('odt')}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
            >
              ODT
            </button>
          </>
        )}
        <button onClick={() => router.push('/dashboard')}
          className="text-xs font-medium px-3 py-1.5 rounded-lg text-white"
          style={{ background: '#2563eb', border: 'none' }}>
          Panel principal
        </button>
      </div>

      <div ref={contentRef} className="reporte-container max-w-4xl mx-auto px-6 py-8 pb-12" style={{ fontFamily: 'Georgia, Times New Roman, serif', background: 'white' }}>
        
        <ReporteHeader
          patientName={patientName}
          patientRut={patientRut}
          patientBirthDate={patientBirthDate}
          patientAge={patientAge}
          patientSchool={patientSchool}
          evalDate={evalDate}
          testName="Coopersmith SEI - Inventario de Autoestima"
        />

        {/* Puntaje total */}
        <div className="mb-6" style={{ pageBreakInside: 'avoid' }}>
          <div className="border-b border-gray-300 pb-2 mb-3">
            <h2 className="text-lg font-semibold uppercase tracking-wide" style={{ color: '#1a1a1a' }}>Puntaje total</h2>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-6 mb-3">
            <div className="text-center sm:text-left">
              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-bold" style={{ fontFamily: 'Georgia, Times New Roman, serif', color: levelColorHex }}>{result.totalScaled}</span>
                <div>
                  <div className="text-sm font-semibold" style={{ color: levelColorHex }}>{result.levelLabel}</div>
                  <div className="text-xs" style={{ color: '#9ca3af' }}>de 100 puntos</div>
                </div>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex h-2 rounded-full overflow-hidden">
                {[
                  { color: '#A32D2D', label: 'Baja' },
                  { color: '#854F0B', label: 'Media baja' },
                  { color: '#639922', label: 'Media alta' },
                  { color: '#3B6D11', label: 'Alta' },
                ].map(z => <div key={z.label} className="flex-1" style={{ background: `${z.color}30` }} />)}
              </div>
              <div className="relative mt-1">
                <div className="absolute w-3 h-3 rounded-full border-2 border-white shadow -translate-x-1/2"
                  style={{ left: `${Math.min(result.totalScaled, 99)}%`, top: 0, background: levelColorHex }} />
              </div>
              <div className="flex justify-between text-[10px] mt-4" style={{ color: '#9ca3af' }}>
                <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
              </div>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-justify" style={{ color: '#4b5563' }}>{result.levelDescription}</p>
          
          {result.lieScaleInvalid && (
            <div className="mt-3 px-4 py-3 rounded-xl text-sm" style={{ background: '#fef3c7', border: '1px solid #fde68a', color: '#92400e' }}>
              <strong>⚠ Escala de mentira:</strong> {result.lieScaleRaw}/8. Un puntaje ≥ 5 sugiere tendencia a responder en forma socialmente deseable.
            </div>
          )}
        </div>

        {/* Gráfico de barras */}
        <div className="mb-6" style={{ pageBreakInside: 'avoid' }}>
          <div className="border-b border-gray-300 pb-2 mb-3">
            <h2 className="text-lg font-semibold uppercase tracking-wide" style={{ color: '#1a1a1a' }}>Perfil de Subescalas</h2>
          </div>
          <GraficoBarras data={datosGrafico} />
        </div>

        {/* Interpretación de subescalas */}
        <div className="mb-6" style={{ pageBreakInside: 'avoid' }}>
          <div className="border-b border-gray-300 pb-2 mb-3">
            <h2 className="text-lg font-semibold uppercase tracking-wide" style={{ color: '#1a1a1a' }}>Interpretación de Subescalas</h2>
          </div>
          <div className="space-y-4">
            {result.subscales.map(s => (
              <div key={s.code} style={{ pageBreakInside: 'avoid' }}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium" style={{ color: '#1a1a1a' }}>{s.label}</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-bold" style={{ color: levelColorHex }}>{s.scaledScore}</span>
                    <span className="text-xs" style={{ color: '#9ca3af' }}>/ {s.maxScaled}</span>
                  </div>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: '#f3f4f6' }}>
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${s.pct * 100}%`, background: levelColorHex }} />
                </div>
                <p className="text-xs leading-relaxed mt-2 text-justify" style={{ color: '#6b7280' }}>
                  {getInterpretacionSubescala(s.scaledScore, s.maxScaled, s.label.split(' ')[0])}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Conclusión general */}
        <div className="mb-6" style={{ pageBreakBefore: 'always', pageBreakInside: 'avoid' }}>
          <div className="border-b border-gray-300 pb-2 mb-3">
            <h2 className="text-lg font-semibold uppercase tracking-wide" style={{ color: '#1a1a1a' }}>Conclusión y Recomendaciones</h2>
          </div>
          <p className="text-sm leading-relaxed text-justify" style={{ color: '#4b5563', textAlign: 'justify' }}>
            {getConclusionGeneral({
              totalScaled: result.totalScaled,
              levelLabel: result.levelLabel,
              lieScaleInvalid: result.lieScaleInvalid,
              lieScaleRaw: result.lieScaleRaw,
              subscales: result.subscales.map(s => ({ ...s, code: s.code, label: s.label, scaledScore: s.scaledScore, maxScaled: s.maxScaled, pct: s.pct }))
            }, patientName)}
          </p>
        </div>

        <ReporteFooter showFirma={true} />
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'white' }}>
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#4a4a4a', borderTopColor: 'transparent' }} />
    </div>
  )
}

function Error({ onBack }: { onBack?: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'white' }}>
      <div className="text-center">
        <p className="text-sm font-medium mb-3" style={{ color: '#4b5563' }}>No se encontraron resultados.</p>
        <button onClick={onBack ?? (() => window.history.back())} className="text-sm" style={{ color: '#4a4a4a' }}>← Volver</button>
      </div>
    </div>
  )
}

export default function CoopersmithReportPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <CoopersmithReportPageInner />
    </Suspense>
  )
}