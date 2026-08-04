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

// === FUNCIONES DE INTERPRETACIÓN ===

function getInterpretacionSeveridad(puntaje: number): { nivel: string; descripcion: string; recomendacion: string } {
  if (puntaje >= 0 && puntaje <= 13) {
    return {
      nivel: "Depresión Mínima",
      descripcion: "El puntaje obtenido se encuentra dentro del rango de depresión mínima. Esto indica que el evaluado no presenta sintomatología depresiva significativa en el momento de la evaluación. Las puntuaciones en este rango son consideradas normales en la población general y no sugieren la necesidad de intervención clínica por depresión. Es posible que el evaluado experimente algunos síntomas aislados, pero no cumplen con la frecuencia o intensidad para ser considerados clínicamente significativos.",
      recomendacion: "Se recomienda mantener un seguimiento periódico de salud mental como parte del autocuidado general."
    }
  } else if (puntaje >= 14 && puntaje <= 19) {
    return {
      nivel: "Depresión Leve",
      descripcion: "La puntuación se ubica en el rango de depresión leve. Esto sugiere la presencia de algunos síntomas depresivos que pueden estar afectando el estado de ánimo y el funcionamiento diario del evaluado, aunque de manera moderada. Síntomas como tristeza ocasional, pérdida de interés en actividades, fatiga o alteraciones del sueño pueden estar presentes. Aunque no es una condición severa, se recomienda considerar intervenciones psicoeducativas y seguimiento clínico para prevenir la progresión de los síntomas.",
      recomendacion: "Se sugiere intervención psicoeducativa, activación conductual y monitoreo del estado de ánimo cada 2-3 meses."
    }
  } else if (puntaje >= 20 && puntaje <= 28) {
    return {
      nivel: "Depresión Moderada",
      descripcion: "La puntuación total indica un nivel de depresión moderada. Esto refleja una presencia significativa de síntomas depresivos que probablemente están interfiriendo con el funcionamiento cotidiano del evaluado en áreas como el trabajo, los estudios o las relaciones interpersonales. Síntomas como anhedonia (pérdida de placer), alteraciones del sueño y apetito, sentimientos de culpa o inutilidad, y fatiga significativa son comunes en este rango.",
      recomendacion: "Se recomienda encarecidamente una evaluación clínica más profunda y considerar intervenciones psicoterapéuticas estructuradas (como Terapia Cognitivo-Conductual)."
    }
  } else {
    return {
      nivel: "Depresión Grave",
      descripcion: "El puntaje obtenido se encuentra en el rango de depresión grave. Esto indica una sintomatología depresiva severa que está causando un deterioro significativo en múltiples áreas de la vida del evaluado. Los síntomas como ideación suicida, desesperanza, agitación o retraso psicomotor, y una afectación profunda del estado de ánimo son característicos de este nivel.",
      recomendacion: "Se requiere una intervención clínica inmediata e intensiva. Derivar para evaluación psiquiátrica y considerar un plan de tratamiento integral que puede incluir psicoterapia y medicación."
    }
  }
}

function getInterpretacionDimension(nombre: string, puntaje: number, maximo: number): string {
  const porcentaje = (puntaje / maximo) * 100
  if (nombre === "Cognitivo-Afectivo") {
    if (porcentaje >= 60) {
      return `La dimensión Cognitivo-Afectiva (${puntaje}/${maximo}) refleja un procesamiento negativo significativo de uno mismo, del mundo y del futuro. Agrupa síntomas relacionados con el estado de ánimo disfórico (tristeza), la anhedonia (pérdida de placer), la autodesvalorización (culpa, inutilidad), el pesimismo y la ideación suicida. Una puntuación elevada en esta dimensión sugiere un patrón de pensamiento negativo automático que puede perpetuar el malestar emocional.`
    } else if (porcentaje >= 30) {
      return `La dimensión Cognitivo-Afectiva (${puntaje}/${maximo}) muestra un nivel moderado de síntomas. Se observan algunos patrones de pensamiento negativo que podrían estar influyendo en el estado de ánimo, aunque no de manera generalizada.`
    } else {
      return `La dimensión Cognitivo-Afectiva (${puntaje}/${maximo}) se encuentra en un rango bajo, indicando ausencia de pensamientos negativos significativos. El evaluado mantiene una visión equilibrada de sí mismo, el mundo y el futuro.`
    }
  } else if (nombre === "Somático-Motivacional") {
    if (porcentaje >= 60) {
      return `La dimensión Somática (${puntaje}/${maximo}) muestra una alta presencia de manifestaciones físicas de la depresión, como pérdida de energía, alteraciones del sueño, cambios en el apetito y fatiga. Una puntuación elevada en esta dimensión puede indicar la necesidad de una evaluación médica para descartar causas orgánicas.`
    } else if (porcentaje >= 30) {
      return `La dimensión Somática (${puntaje}/${maximo}) muestra un nivel moderado de síntomas físicos. Se recomienda monitorear posibles alteraciones del sueño, apetito y energía.`
    } else {
      return `La dimensión Somática (${puntaje}/${maximo}) se encuentra en un rango bajo, indicando ausencia de manifestaciones físicas significativas asociadas a la depresión.`
    }
  } else {
    if (porcentaje >= 60) {
      return `La puntuación en Ideación Suicida (${puntaje}/${maximo}) es elevada. Esto requiere atención clínica inmediata y evaluación de riesgo.`
    } else if (porcentaje >= 30) {
      return `La puntuación en Ideación Suicida (${puntaje}/${maximo}) es moderada. Se recomienda explorar en profundidad durante la entrevista clínica.`
    } else {
      return `La puntuación en Ideación Suicida (${puntaje}/${maximo}) es baja, indicando ausencia de pensamientos suicidas significativos.`
    }
  }
}

function getConclusionGeneral(puntaje: number, severityLabel: string, nombrePaciente: string): string {
  const interpretacion = getInterpretacionSeveridad(puntaje)
  return `${nombrePaciente || 'El evaluado'} presenta un cuadro de ${interpretacion.nivel.toLowerCase()} según el BDI-II, con una puntuación total de ${puntaje} puntos. ${interpretacion.descripcion} ${interpretacion.recomendacion} Es importante destacar que este instrumento es una medida de tamizaje, no un diagnóstico definitivo. Cualquier plan de intervención debe basarse en una evaluación clínica integral que considere el contexto biopsicosocial del evaluado. El presente informe debe ser interpretado por un profesional de la salud mental capacitado.`
}

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
        console.log('🔍 [BDI‑II] Iniciando carga de datos...')

        const { data: scores, error: scoresError } = await supabase
          .from('bdi2_scores')
          .select('*')
          .eq('session_id', sessionId)
          .single()

        if (scoresError || !scores) {
          console.error('❌ Error cargando scores BDI‑II:', scoresError)
          setLoading(false)
          return
        }

        console.log('✅ Scores BDI‑II cargados:', scores)

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

        console.log('✅ Datos de sesión cargados:', sessionData)

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

        // Cargar plan del usuario
        const { data: { user } } = await supabase.auth.getUser()
        console.log('🔍 Usuario autenticado:', user)

        if (user) {
          const { data: planData } = await supabase.rpc('get_plan_status', { p_user_id: user.id })
          console.log('🔍 planData (RPC):', planData)
          let plan = Array.isArray(planData) ? planData[0] : planData
          if (plan && typeof plan === 'object' && 'is_pro' in plan) {
            console.log('✅ Plan obtenido vía RPC:', plan)
            setPlanStatus(plan)
          } else {
            // Fallback a profiles
            const { data: profile } = await supabase
              .from('profiles')
              .select('plan')
              .eq('id', user.id)
              .single()
            if (profile) {
              const isPro = profile.plan === 'premium' || profile.plan === 'pro'
              setPlanStatus({ is_pro: isPro })
              console.log('✅ Plan obtenido desde profiles, isPro:', isPro)
            } else {
              setPlanStatus({ is_pro: false })
            }
          }
        } else {
          setPlanStatus({ is_pro: false })
        }

      } catch (err) {
        console.error('❌ Error general en load():', err)
      } finally {
        setLoading(false)
        console.log('🔍 Estado final planStatus:', planStatus)
      }
    }
    load()
  }, [sessionId])

  const isPro = planStatus?.is_pro ?? false
  console.log('🔍 isPro calculado:', isPro)

  const handleDownload = (type: 'docx' | 'odt') => {
    if (!result) return
    console.log(`📥 Descargando ${type.toUpperCase()} para BDI‑II`)
    const meta = {
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

      {/* Contenido del informe */}
      <div ref={contentRef} className="reporte-container max-w-4xl mx-auto px-6 py-8" style={{ fontFamily: 'Georgia, Times New Roman, serif', background: 'white' }}>
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
            {getConclusionGeneral(result.totalScore, result.severity || interpretacion.nivel, patientName)}
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