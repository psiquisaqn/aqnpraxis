'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { PdfDownloadButton } from '@/components/PdfDownloadButton'
import { ReporteHeader } from '@/components/ReporteHeader'
import { ReporteFooter } from '@/components/ReporteFooter'
import { useReportDocx } from '@/hooks/useReportDocx'

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

// === FUNCIONES DE INTERPRETACIÓN (importadas desde lib) ===
import {
  getInterpretacionSeveridad,
  getInterpretacionDimension,
  getConclusionGeneral,
} from '@/lib/interpretaciones/bdi2'

// Componente de gráfico de barras
function GraficoBarras({ data }: { data: Array<{ label: string; value: number; max: number }> }) {
  const maxVal = Math.max(...data.map(d => d.value), 30)
  return (
    <div className="grafico-barras-container" style={{ margin: '20px 0', fontFamily: 'Georgia, Times New Roman, serif', pageBreakInside: 'avoid' }}>
      <div className="grafico-barras" style={{ 
        display: 'flex', 
        justifyContent: 'space-around', 
        alignItems: 'flex-end', 
        minHeight: '200px',
        borderBottom: '1px solid #333',
        borderLeft: '1px solid #333',
        paddingLeft: '10px',
        paddingBottom: '10px'
      }}>
        {data.map((item, idx) => {
          const alturaRelativa = (item.value / maxVal) * 140
          return (
            <div key={idx} style={{ textAlign: 'center', width: '100px' }}>
              <div style={{ 
                backgroundColor: '#4a4a4a', 
                width: '50px', 
                margin: '0 auto', 
                height: `${Math.max(alturaRelativa, 4)}px`,
                marginBottom: '8px'
              }} />
              <div style={{ fontSize: '11px', fontWeight: 'bold', fontFamily: 'Georgia, Times New Roman, serif' }}>{item.label}</div>
              <div style={{ fontSize: '10px', color: '#555' }}>{item.value}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// === COMPONENTE PRINCIPAL ===
function Bdi2ResultsPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session') ?? ''
  const contentRef = useRef<HTMLDivElement>(null)

  const [result, setResult] = useState<any>(null)
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

    const load = async () => {
      try {
        const { data: scores, error: scoresError } = await supabase
          .from('bdi2_scores')
          .select('*')
          .eq('session_id', sessionId)
          .single()

        if (scoresError || !scores) {
          setLoading(false)
          return
        }

        const responses: Record<number, number> = {}
        for (let i = 1; i <= 21; i++) {
          const key = 'item_' + i
          if (scores[key] !== undefined && scores[key] !== null) {
            responses[i] = scores[key]
          }
        }

        setResult({
          totalScore: scores.total_score || 0,
          severity: scores.severity_label || 'No clasificado',
          cognitiveAffectiveScore: scores.cognitive_affective_score || 0,
          somaticMotivationalScore: scores.somatic_motivational_score || 0,
          suicidalIdeationScore: scores.suicidal_ideation_score || 0,
          responses,
        })

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
          let plan = Array.isArray(planData) ? planData[0] : planData
          if (plan && typeof plan === 'object' && 'is_pro' in plan) {
            setPlanStatus(plan)
          } else {
            const { data: profile } = await supabase
              .from('profiles')
              .select('plan')
              .eq('id', user.id)
              .single()
            if (profile) {
              const isPro = profile.plan === 'premium' || profile.plan === 'pro'
              setPlanStatus({ is_pro: isPro })
            } else {
              setPlanStatus({ is_pro: false })
            }
          }
        } else {
          setPlanStatus({ is_pro: false })
        }

      } catch (err) {
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [sessionId])

  const isPro = planStatus?.is_pro ?? false

  const handleDownload = (type: 'docx' | 'odt') => {
    if (!result) return
    const meta = {
      sessionId,
      patientId,
      testId: 'bdi2',
      patientName,
      patientRut,
      patientBirthDate,
      patientAge,
      patientSchool,
      evalDate,
      content: {
        totalScore: result.totalScore,
        severity: result.severity,
        cognitiveAffectiveScore: result.cognitiveAffectiveScore,
        somaticMotivationalScore: result.somaticMotivationalScore,
        suicidalIdeationScore: result.suicidalIdeationScore,
        responses: result.responses,
      }
    }
    generateDocx(contentRef, meta, type)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'white' }}>
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#4a4a4a', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'white' }}>
        <div className="text-center">
          <p className="text-sm mb-3" style={{ color: '#4b5563' }}>No se encontraron resultados</p>
          <button onClick={() => router.back()} className="text-sm" style={{ color: '#4a4a4a' }}>← Volver</button>
        </div>
      </div>
    )
  }

  const interpretacion = getInterpretacionSeveridad(result.totalScore)
  const severityColor = result.totalScore <= 13 ? '#2e7d32' : result.totalScore <= 19 ? '#e65100' : result.totalScore <= 28 ? '#e65100' : '#c62828'

  const datosGrafico = [
    { label: 'Cognitivo-Afectivo', value: result.cognitiveAffectiveScore, max: 42 },
    { label: 'Somático-Motivacional', value: result.somaticMotivationalScore, max: 21 },
    { label: 'Ideación Suicida', value: result.suicidalIdeationScore, max: 6 },
  ]

  return (
    <div className="min-h-screen" style={{ background: 'white' }}>
      <style>{printStyles}</style>

      {/* Barra superior - no imprimible */}
      <div className="sticky top-0 z-20 border-b px-6 py-3 flex items-center gap-3 flex-wrap no-print" style={{ background: 'white', borderColor: '#e5e5e0' }}>
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#9ca3af' }}>BDI-II</span>
        <div className="flex-1" />
        <button onClick={() => window.print()} className="text-xs font-medium px-3 py-1.5 rounded-lg border" style={{ color: '#4b5563', borderColor: '#e5e5e0' }}>
          Imprimir
        </button>
        <PdfDownloadButton
          contentRef={contentRef}
          meta={{
            sessionId,
            patientId,
            testId: 'bdi2',
            patientName,
            content: {
              totalScore: result.totalScore,
              severity: result.severity,
              cognitiveAffectiveScore: result.cognitiveAffectiveScore,
              somaticMotivationalScore: result.somaticMotivationalScore,
              suicidalIdeationScore: result.suicidalIdeationScore,
              responses: result.responses,
            }
          }}
          label="PDF"
        />
        {isPro ? (
          <>
            <button onClick={() => handleDownload('docx')} className="text-xs font-medium px-3 py-1.5 rounded-lg border bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">
              DOCX
            </button>
            <button onClick={() => handleDownload('odt')} className="text-xs font-medium px-3 py-1.5 rounded-lg border bg-green-50 text-green-700 border-green-200 hover:bg-green-100">
              ODT
            </button>
          </>
        ) : (
          <span className="text-xs text-gray-400 italic">(Descarga DOCX/ODT disponible en plan premium)</span>
        )}
        <button onClick={() => router.push('/dashboard')} className="px-4 py-2 rounded-lg text-sm transition-colors" style={{ background: '#e5e5e0', color: '#4b5563' }}>
          Volver al dashboard
        </button>
      </div>

      {/* Contenido del informe con padding inferior para PDF */}
      <div ref={contentRef} className="reporte-container max-w-4xl mx-auto px-6 py-8 pb-12" style={{ fontFamily: 'Georgia, Times New Roman, serif', background: 'white' }}>
        <ReporteHeader
          patientName={patientName}
          patientRut={patientRut}
          patientBirthDate={patientBirthDate}
          patientAge={patientAge}
          patientSchool={patientSchool}
          evalDate={evalDate}
          testName="BDI-II - Inventario de Depresión de Beck"
        />

        {/* Puntaje total */}
        <div className="mb-6" style={{ pageBreakInside: 'avoid' }}>
          <div className="border-b border-gray-300 pb-2 mb-3">
            <h2 className="text-lg font-semibold uppercase tracking-wide" style={{ color: '#1a1a1a' }}>Puntaje total</h2>
          </div>
          <div className="text-center mb-4">
            <p className="text-5xl font-bold" style={{ color: severityColor }}>{result.totalScore}</p>
            <p className="text-lg font-medium mt-1" style={{ color: severityColor }}>{result.severity || interpretacion.nivel}</p>
          </div>
          <p className="text-sm leading-relaxed mb-3 text-justify" style={{ color: '#4b5563' }}>{interpretacion.descripcion}</p>
          <p className="text-sm font-medium" style={{ color: severityColor }}>Recomendación: {interpretacion.recomendacion}</p>
        </div>

        {/* Gráfico de barras */}
        <div className="mb-6" style={{ pageBreakInside: 'avoid' }}>
          <div className="border-b border-gray-300 pb-2 mb-3">
            <h2 className="text-lg font-semibold uppercase tracking-wide" style={{ color: '#1a1a1a' }}>Perfil de Dimensiones</h2>
          </div>
          <GraficoBarras data={datosGrafico} />
        </div>

        {/* Interpretación de dimensiones */}
        <div className="mb-6" style={{ pageBreakInside: 'avoid' }}>
          <div className="border-b border-gray-300 pb-2 mb-3">
            <h2 className="text-lg font-semibold uppercase tracking-wide" style={{ color: '#1a1a1a' }}>Interpretación de Dimensiones</h2>
          </div>
          <div className="space-y-4">
            <div className="pb-3" style={{ pageBreakInside: 'avoid' }}>
              <h3 className="text-md font-semibold mb-2" style={{ color: '#1a1a1a' }}>Dimensión Cognitivo-Afectiva</h3>
              <p className="text-sm leading-relaxed text-justify" style={{ color: '#4b5563' }}>
                {getInterpretacionDimension("Cognitivo-Afectivo", result.cognitiveAffectiveScore, 42)}
              </p>
            </div>
            <div className="pb-3" style={{ pageBreakInside: 'avoid' }}>
              <h3 className="text-md font-semibold mb-2" style={{ color: '#1a1a1a' }}>Dimensión Somático-Motivacional</h3>
              <p className="text-sm leading-relaxed text-justify" style={{ color: '#4b5563' }}>
                {getInterpretacionDimension("Somático-Motivacional", result.somaticMotivationalScore, 21)}
              </p>
            </div>
            <div className="pb-3" style={{ pageBreakInside: 'avoid' }}>
              <h3 className="text-md font-semibold mb-2" style={{ color: '#1a1a1a' }}>Ideación Suicida</h3>
              <p className="text-sm leading-relaxed text-justify" style={{ color: '#4b5563' }}>
                {getInterpretacionDimension("Ideación Suicida", result.suicidalIdeationScore, 6)}
              </p>
            </div>
          </div>
        </div>

        {/* Conclusión con salto de página */}
        <div className="mb-6" style={{ pageBreakBefore: 'always', pageBreakInside: 'avoid' }}>
          <div className="border-b border-gray-300 pb-2 mb-3">
            <h2 className="text-lg font-semibold uppercase tracking-wide" style={{ color: '#1a1a1a' }}>Conclusión y Recomendaciones</h2>
          </div>
          <p className="text-sm leading-relaxed text-justify" style={{ color: '#4b5563', textAlign: 'justify' }}>
            {getConclusionGeneral(result.totalScore, result.severity, patientName)}
          </p>
        </div>

        <ReporteFooter showFirma={true} />
      </div>
    </div>
  )
}

export default function Bdi2ResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <Bdi2ResultsPageInner />
    </Suspense>
  )
}