'use client'
// app/resultados/coopersmith/page.tsx
// Versión mejorada con gráficos de barras, textos dinámicos y optimización para impresión

import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { PdfDownloadButton } from '@/components/PdfDownloadButton'
import { scoreCoopersmith, type CooperResult } from '@/lib/coopersmith/engine'

// Estilos para impresión y gráficos
const printStyles = `
  @media print {
    body { margin: 0; padding: 0; }
    .no-print { display: none; }
    .reporte-container { padding: 1.5cm; width: 100%; }
    .page-break { page-break-before: avoid; page-break-inside: avoid; }
  }
`

// Función para obtener texto interpretativo según percentil
function getInterpretacionSubescala(puntaje: number, maximo: number, nombre: string): string {
  const porcentaje = (puntaje / maximo) * 100
  if (porcentaje >= 75) {
    return `${nombre}: El evaluado muestra una percepción muy alta de sí mismo en esta área. Se siente competente, valorado y aceptado, lo que contribuye positivamente a su autoestima general. No se detectan dificultades significativas en este dominio.`
  } else if (porcentaje >= 50) {
    return `${nombre}: La autopercepción del evaluado en esta área es media-alta. Generalmente se siente adecuado, aunque puede experimentar inseguridades en situaciones específicas que requieren mayor exigencia. Se recomienda reforzar las áreas de fortaleza.`
  } else if (porcentaje >= 25) {
    return `${nombre}: Se observa una autopercepción baja en esta área. El evaluado tiende a subestimar sus capacidades y puede experimentar sentimientos de incompetencia o de no ser "suficientemente bueno" en comparación con otros. Es un área que podría beneficiarse de intervención focalizada.`
  } else {
    return `${nombre}: La autopercepción es muy baja. Existe un patrón consistente de autodescalificación, lo que sugiere que esta área es una fuente significativa de malestar y requiere intervención prioritaria. Se recomienda trabajo psicoterapéutico específico para fortalecer la autoestima en este dominio.`
  }
}

// Función para generar conclusión general
function getConclusionGeneral(result: CooperResult, nombrePaciente: string): string {
  const nivel = result.levelLabel
  const puntaje = result.totalScaled
  
  let conclusion = ""
  
  if (puntaje >= 75) {
    conclusion = `Los resultados del Coopersmith SEI indican que ${nombrePaciente || 'el evaluado'} presenta una autoestima ${nivel.toLowerCase()}. Con un puntaje total de ${puntaje} puntos (sobre 100), se ubica en el percentil superior, lo que refleja una percepción positiva y bien consolidada de sí mismo. `
  } else if (puntaje >= 50) {
    conclusion = `Los resultados del Coopersmith SEI indican que ${nombrePaciente || 'el evaluado'} presenta una autoestima ${nivel.toLowerCase()}. Con un puntaje total de ${puntaje} puntos (sobre 100), se ubica en un rango medio-alto, mostrando una percepción generalmente positiva de sí mismo, aunque con algunas áreas de inseguridad. `
  } else if (puntaje >= 25) {
    conclusion = `Los resultados del Coopersmith SEI indican que ${nombrePaciente || 'el evaluado'} presenta una autoestima ${nivel.toLowerCase()}. Con un puntaje total de ${puntaje} puntos (sobre 100), se observan dificultades significativas en la percepción de autoeficacia y valía personal. `
  } else {
    conclusion = `Los resultados del Coopersmith SEI indican que ${nombrePaciente || 'el evaluado'} presenta una autoestima ${nivel.toLowerCase()}. Con un puntaje total de ${puntaje} puntos (sobre 100), se evidencia un patrón consistente de autodescalificación que requiere intervención prioritaria. `
  }
  
  conclusion += `Las subescalas permiten identificar áreas específicas de fortaleza y vulnerabilidad. `
  
  if (result.lieScaleInvalid) {
    conclusion += `⚠️ Precaución: La puntuación en la escala de mentira (${result.lieScaleRaw}/8) sugiere una tendencia a responder de manera socialmente deseable, por lo que los resultados deben interpretarse con cautela. `
  }
  
  conclusion += `Se recomienda utilizar estos resultados como base para un plan de intervención focalizado en las áreas deficitarias, fortaleciendo los recursos existentes y promoviendo una autopercepción más realista y positiva. La autoestima es un constructo dinámico que puede modificarse a través de intervenciones psicosociales y psicoterapéuticas adecuadas.`
  
  return conclusion
}

// Componente de gráfico de barras verticales
function GraficoBarras({ data, maxValue = 100 }: { data: Array<{ label: string; value: number; max: number }>; maxValue?: number }) {
  const maxVal = Math.max(...data.map(d => d.value), maxValue)
  
  return (
    <div className="grafico-barras-container" style={{ margin: '20px 0', fontFamily: 'Georgia, Times New Roman, serif' }}>
      <div className="grafico-barras" style={{ 
        display: 'flex', 
        justifyContent: 'space-around', 
        alignItems: 'flex-end', 
        minHeight: '220px',
        borderBottom: '2px solid #333',
        borderLeft: '2px solid #333',
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
                marginBottom: '8px',
                transition: 'height 0.3s ease'
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
  const [evalDate, setEvalDate] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!sessionId) return

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    async function load() {
      const { data: scores, error: scoresError } = await supabase
        .from('coopersmith_scores')
        .select('*')
        .eq('session_id', sessionId)
        .single()

      if (scoresError || !scores) { setLoading(false); return }

      const built = buildResultFromDb(scores)
      setResult(built)

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

  if (loading) return <Spinner />
  if (!result)  return <Error onBack={() => router.back()} />

  const datosGrafico = result.subscales.map(s => ({
    label: s.label,
    value: s.scaledScore,
    max: s.maxScaled
  }))

  return (
    <div className="min-h-screen" style={{ background: '#f5f5f0' }}>
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
        {result && (
          <PdfDownloadButton contentRef={contentRef}
            meta={{ sessionId, patientId, testId: 'coopersmith', patientName, content: { total: result.totalScaled, level: result.level } }} />
        )}
        <button onClick={() => router.push('/dashboard')}
          className="text-xs font-medium px-3 py-1.5 rounded-lg text-white"
          style={{ background: '#2563eb', border: 'none' }}>
          Panel principal
        </button>
      </div>

      <div ref={contentRef} className="reporte-container max-w-4xl mx-auto px-6 py-8 space-y-6" style={{ fontFamily: 'Georgia, Times New Roman, serif' }}>
        {/* Encabezado */}
        <div className="rounded-2xl border p-6" style={{ background: 'white', borderColor: '#e5e5e0' }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded" style={{ background: '#e8e8e3', color: '#4a4a4a' }}>Coopersmith SEI</span>
              <h1 className="text-2xl font-medium mt-2" style={{ fontFamily: 'Georgia, Times New Roman, serif', color: '#1a1a1a' }}>{patientName || 'Paciente'}</h1>
            </div>
            <div className="text-right text-sm" style={{ color: '#9ca3af' }}>
              <div>Fecha</div>
              <div className="font-medium" style={{ color: '#4b5563' }}>{evalDate || '—'}</div>
            </div>
          </div>

          {/* Puntaje total */}
          <div className="mt-5 px-5 py-4 rounded-xl" style={{ background: '#fafaf5', border: '1px solid #e8e8e3' }}>
            <div className="flex flex-col sm:flex-row items-center gap-6 mb-3">
              <div className="text-center sm:text-left">
                <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: '#9ca3af' }}>Puntaje total</p>
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-bold" style={{ fontFamily: 'Georgia, Times New Roman, serif', color: result.levelColor }}>{result.totalScaled}</span>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: result.levelColor }}>{result.levelLabel}</div>
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
                    style={{ left: `${Math.min(result.totalScaled, 99)}%`, top: 0, background: result.levelColor }} />
                </div>
                <div className="flex justify-between text-[10px] mt-4" style={{ color: '#9ca3af' }}>
                  <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
                </div>
              </div>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: '#4b5563' }}>{result.levelDescription}</p>
          </div>

          {result.lieScaleInvalid && (
            <div className="mt-3 px-4 py-3 rounded-xl text-sm" style={{ background: '#fef3c7', border: '1px solid #fde68a', color: '#92400e' }}>
              <strong>⚠ Escala de mentira:</strong> {result.lieScaleRaw}/8. Un puntaje ≥ 5 sugiere tendencia a responder en forma socialmente deseable.
            </div>
          )}
        </div>

        {/* Gráfico de barras */}
        <div className="rounded-2xl border p-6" style={{ background: 'white', borderColor: '#e5e5e0' }}>
          <h2 className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: '#9ca3af' }}>Perfil de Subescalas</h2>
          <GraficoBarras data={datosGrafico} />
        </div>

        {/* Subescalas con interpretación */}
        <div className="rounded-2xl border p-6" style={{ background: 'white', borderColor: '#e5e5e0' }}>
          <h2 className="text-sm font-semibold uppercase tracking-widest mb-5" style={{ color: '#9ca3af' }}>Interpretación de Subescalas</h2>
          <div className="space-y-4">
            {result.subscales.map(s => (
              <div key={s.code}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium" style={{ color: '#4b5563' }}>{s.label}</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-bold" style={{ color: result.levelColor }}>{s.scaledScore}</span>
                    <span className="text-xs" style={{ color: '#9ca3af' }}>/ {s.maxScaled}</span>
                  </div>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: '#f3f4f6' }}>
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${s.pct * 100}%`, background: result.levelColor }} />
                </div>
                <p className="text-xs leading-relaxed mt-2" style={{ color: '#6b7280' }}>
                  {getInterpretacionSubescala(s.scaledScore, s.maxScaled, s.label.split(' ')[0])}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Conclusión general */}
        <div className="rounded-2xl border p-6" style={{ background: '#fafaf5', borderColor: '#e5e5e0' }}>
          <h2 className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: '#9ca3af' }}>Conclusión y Recomendaciones</h2>
          <p className="text-sm leading-relaxed" style={{ color: '#4b5563', textAlign: 'justify' }}>
            {getConclusionGeneral(result, patientName)}
          </p>
        </div>

        <div className="text-center py-4">
          <p className="text-xs" style={{ color: '#9ca3af' }}>
            Generado por AQN Praxis · Brinkmann, Segure & Solar (1989) · U. de Concepción
          </p>
        </div>
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f5f5f0' }}>
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#4a4a4a', borderTopColor: 'transparent' }} />
    </div>
  )
}

function Error({ onBack }: { onBack?: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f5f5f0' }}>
      <div className="text-center">
        <p className="text-sm font-medium mb-3" style={{ color: '#4b5563' }}>No se encontraron resultados.</p>
        <button onClick={onBack ?? (() => window.history.back())} className="text-sm" style={{ color: '#4a4a4a' }}>← Volver</button>
      </div>
    </div>
  )
}

export default function CoopersmithReportPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <CoopersmithReportPageInner />
    </Suspense>
  )
}