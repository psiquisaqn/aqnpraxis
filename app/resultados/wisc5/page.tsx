'use client'
// app/resultados/wisc5/page.tsx
// Versión mejorada con tipado correcto

import { useEffect, useState, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { PdfDownloadButton } from '@/components/PdfDownloadButton'
import { ReporteHeader } from '@/components/ReporteHeader'
import { ReporteFooter } from '@/components/ReporteFooter'
import { useReportDocx } from '@/hooks/useReportDocx'

// ============================================================
// TIPOS
// ============================================================

interface WiscData {
  scaled_scores: Record<string, number>
  composite_scores: Record<string, { score: number; percentile: number; classification?: string }>
  raw_scores: Record<string, number>
}

// ============================================================
// ESTILOS DE IMPRESIÓN
// ============================================================

const printStyles = `
  @media print {
    body { margin: 0; padding: 0; background: white; }
    .no-print { display: none; }
    .reporte-container { padding: 1.5cm; width: 100%; }
    .page-break-before { page-break-before: always; }
    .page-break-inside { page-break-inside: avoid; }
    h2, h3, .grafico-container { page-break-inside: avoid; }
  }
`

// ============================================================
// FUNCIONES DE CLASIFICACIÓN
// ============================================================

function getClassification(score: number): string {
  if (score >= 130) return 'Muy Superior'
  if (score >= 120) return 'Superior'
  if (score >= 110) return 'Normal Alto'
  if (score >= 90) return 'Normal Promedio'
  if (score >= 80) return 'Normal Lento'
  if (score >= 70) return 'Funcionamiento Intelectual Limítrofe'
  return 'Extremadamente Bajo'
}

function getScaledClassification(score: number): string {
  if (score >= 16) return 'Muy Superior'
  if (score >= 14) return 'Superior'
  if (score >= 12) return 'Normal Alto'
  if (score >= 8) return 'Normal Promedio'
  if (score >= 6) return 'Normal Lento'
  if (score >= 4) return 'Funcionamiento Intelectual Limítrofe'
  return 'Extremadamente Bajo'
}

function getColorForScore(score: number, isScaled: boolean = false): string {
  const thresholds = isScaled ? [16, 14, 12, 8, 6, 4] : [130, 120, 110, 90, 80, 70]
  const colors = ['#1E3A5F', '#2B6B9E', '#4A90A4', '#6B8C5C', '#A68B4A', '#B55A3B', '#8B3A3A']
  let idx = colors.length - 1
  for (let i = 0; i < thresholds.length; i++) {
    if (score >= thresholds[i]) { idx = i; break }
  }
  return colors[idx]
}

// ============================================================
// GRÁFICO DE BARRAS (genérico)
// ============================================================

function GraficoBarras({ 
  data, 
  minVal = 40, 
  maxVal = 160,
  showValues = true
}: { 
  data: Array<{ label: string; score: number }>
  minVal?: number
  maxVal?: number
  showValues?: boolean
}) {
  return (
    <div className="grafico-container" style={{ margin: '20px 0', fontFamily: 'Georgia, Times New Roman, serif', pageBreakInside: 'avoid' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'flex-end', 
        minHeight: '200px',
        borderBottom: '1px solid #333',
        borderLeft: '1px solid #333',
        paddingLeft: '10px',
        paddingBottom: '10px',
        gap: '6px',
        flexWrap: 'wrap'
      }}>
        {data.map((item, idx) => {
          const score = item.score
          const alturaRelativa = ((score - minVal) / (maxVal - minVal)) * 150
          const color = getColorForScore(score, maxVal <= 19)
          
          return (
            <div key={idx} style={{ textAlign: 'center', width: '45px' }}>
              <div style={{ 
                backgroundColor: color, 
                width: '28px', 
                margin: '0 auto', 
                height: `${Math.max(alturaRelativa, 4)}px`,
                marginBottom: '4px',
                borderRadius: '2px 2px 0 0',
              }} />
              <div style={{ fontSize: '7px', fontWeight: 'normal', fontFamily: 'Georgia, Times New Roman, serif' }}>
                {item.label}
              </div>
              {showValues && (
                <div style={{ fontSize: '8px', color: color, marginTop: '1px', fontWeight: 'bold' }}>
                  {score}
                </div>
              )}
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '7px', color: '#9ca3af', padding: '0 10px' }}>
        <span>{minVal}</span>
        <span>{(minVal + maxVal) / 4}</span>
        <span>{(minVal + maxVal) / 2}</span>
        <span>{((minVal + maxVal) * 3) / 4}</span>
        <span>{maxVal}</span>
      </div>
    </div>
  )
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

function Wisc5ResultsPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session') ?? ''
  const reportType = searchParams.get('type') || 'brief'

  const contentRef = useRef<HTMLDivElement>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<WiscData | null>(null)
  const [plan, setPlan] = useState<any>(null)
  const [patient, setPatient] = useState<any>(null)
  const [patientName, setPatientName] = useState('')
  const [patientId, setPatientId] = useState('')
  const [patientRut, setPatientRut] = useState('')
  const [patientBirthDate, setPatientBirthDate] = useState('')
  const [patientAge, setPatientAge] = useState<number | undefined>(undefined)
  const [patientSchool, setPatientSchool] = useState('')
  const [evalDate, setEvalDate] = useState('')

  const { generateDocx } = useReportDocx()

  useEffect(() => {
    if (!sessionId) return

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    async function load() {
      try {
        // 1. Obtener sesión y paciente
        const { data: sessionData, error: sessionError } = await supabase
          .from('sessions')
          .select('*, patients(id, full_name, rut, birth_date, school)')
          .eq('id', sessionId)
          .single()

        if (sessionError || !sessionData) {
          setError('Sesión no encontrada')
          setLoading(false)
          return
        }

        const p = sessionData.patients as any
        setPatient(p)
        setPatientName(p?.full_name ?? '')
        setPatientId(p?.id ?? '')
        setPatientRut(p?.rut ?? '')
        setPatientSchool(p?.school ?? '')
        if (p?.birth_date) {
          setPatientBirthDate(new Date(p.birth_date).toLocaleDateString('es-CL'))
          const age = new Date().getFullYear() - new Date(p.birth_date).getFullYear()
          setPatientAge(age)
        }
        if (sessionData.created_at) {
          setEvalDate(new Date(sessionData.created_at).toLocaleDateString('es-CL', {
            day: '2-digit', month: 'long', year: 'numeric'
          }))
        }

        // 2. Obtener puntajes WISC-V
        const { data: wiscData, error: wiscError } = await supabase
          .from('wisc5_scores')
          .select('*')
          .eq('session_id', sessionId)
          .maybeSingle()

        if (wiscError || !wiscData) {
          setError('No se encontraron puntajes WISC-V')
          setLoading(false)
          return
        }

        // Tipar los datos
        const typedData: WiscData = {
          scaled_scores: wiscData.scaled_scores || {},
          composite_scores: wiscData.composite_scores || {},
          raw_scores: wiscData.raw_scores || {},
        }
        setData(typedData)

        // 3. Obtener plan del usuario
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: planData } = await supabase.rpc('get_plan_status', { p_user_id: user.id })
          setPlan(planData)
        }

        setLoading(false)
      } catch (err: any) {
        setError(err.message)
        setLoading(false)
      }
    }

    load()
  }, [sessionId])

  const isPro = plan?.is_pro || false

  // Handlers para descarga
  const handleDownload = (type: 'docx' | 'odt') => {
    if (!data) return
    const meta = {
      sessionId,
      patientId,
      testId: 'wisc5',
      patientName,
      content: {
        indexes: data.composite_scores,
        scaledScores: data.scaled_scores,
        reportType,
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

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'white' }}>
        <div className="text-center">
          <p className="text-sm mb-3" style={{ color: '#4b5563' }}>{error || 'No se encontraron resultados'}</p>
          <button onClick={() => router.push('/dashboard')} className="text-sm" style={{ color: '#4a4a4a' }}>← Volver al dashboard</button>
        </div>
      </div>
    )
  }

  const scaledScores = data.scaled_scores
  const compositeScores = data.composite_scores
  const rawScores = data.raw_scores

  // Datos para gráficos
  const indexCodes = ['ICV', 'IVE', 'IRF', 'IMT', 'IVP', 'CIT']
  const indexLabels: Record<string, string> = {
    ICV: 'Comprensión Verbal',
    IVE: 'Visoespacial',
    IRF: 'Razonamiento Fluido',
    IMT: 'Memoria de Trabajo',
    IVP: 'Velocidad de Procesamiento',
    CIT: 'CIT'
  }

  const datosIndices = indexCodes
    .map(code => ({
      label: indexLabels[code] || code,
      score: compositeScores[code]?.score || 0,
    }))
    .filter(d => d.score > 0)

  const subtestLabels: Record<string, string> = {
    CC: 'Construcción con Cubos',
    AN: 'Analogías',
    MR: 'Matrices de Razonamiento',
    RD: 'Retención de Dígitos',
    CLA: 'Claves',
    VOC: 'Vocabulario',
    BAL: 'Balanzas',
    RV: 'Rompecabezas Visuales',
    RI: 'Retención de Imágenes',
    BS: 'Búsqueda de Símbolos',
    IN: 'Información',
    SLN: 'Secuenciación de Letras y Números',
    CAN: 'Cancelación',
    COM: 'Comprensión',
    ARI: 'Aritmética'
  }

  const datosSubpruebas = Object.entries(scaledScores)
    .filter(([_, pe]) => pe != null)
    .map(([code, pe]) => ({
      label: subtestLabels[code] || code,
      score: pe,
    }))
    .sort((a, b) => a.label.localeCompare(b.label))

  return (
    <div className="min-h-screen" style={{ background: 'white' }}>
      <style>{printStyles}</style>

      {/* Barra superior - no imprimible */}
      <div className="sticky top-0 z-20 border-b px-6 py-3 flex items-center gap-3 flex-wrap no-print" style={{ background: 'white', borderColor: '#e5e5e0' }}>
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#9ca3af' }}>WISC-V</span>
        <span className="text-xs text-gray-400">{reportType === 'brief' ? 'Breve (7)' : 'Extendido (15)'}</span>
        <div className="flex-1" />
        
        <button
          onClick={() => window.print()}
          className="text-xs font-medium px-3 py-1.5 rounded-lg border"
          style={{ color: '#4b5563', borderColor: '#e5e5e0' }}
        >
          Imprimir
        </button>
        
        <PdfDownloadButton
          contentRef={contentRef}
          meta={{
            sessionId,
            patientId,
            testId: 'wisc5',
            patientName,
            content: {
              indexes: compositeScores,
              scaledScores,
              reportType,
            }
          }}
          label="PDF"
        />

        {/* Botones DOCX y ODT solo para Premium */}
        {isPro && (
          <>
            <button
              onClick={() => handleDownload('docx')}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border bg-blue-50 text-blue-700 border-blue-200"
            >
              DOCX
            </button>
            <button
              onClick={() => handleDownload('odt')}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border bg-green-50 text-green-700 border-green-200"
            >
              ODT
            </button>
          </>
        )}

        <button
          onClick={() => router.push('/dashboard')}
          className="px-4 py-2 rounded-lg text-sm transition-colors"
          style={{ background: '#e5e5e0', color: '#4b5563' }}
        >
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
          testName="WISC-V - Escala de Inteligencia de Wechsler para Niños"
        />

        {/* GRÁFICO 1: SUBPRUEBAS */}
        {datosSubpruebas.length > 0 && (
          <div className="mb-6" style={{ pageBreakInside: 'avoid' }}>
            <div className="border-b border-gray-300 pb-2 mb-3">
              <h2 className="text-lg font-semibold uppercase tracking-wide" style={{ color: '#1a1a1a' }}>Perfil de Subpruebas</h2>
            </div>
            <GraficoBarras 
              data={datosSubpruebas} 
              minVal={0} 
              maxVal={19}
              showValues={true}
            />
            <p className="text-xs text-gray-400 mt-2 italic">
              Gráfico de puntajes escalares (PE) por subprueba. Cada barra representa el desempeño en una subprueba específica.
            </p>
          </div>
        )}

        {/* GRÁFICO 2: ÍNDICES COMPUESTOS */}
        {datosIndices.length > 0 && (
          <div className="mb-6" style={{ pageBreakInside: 'avoid' }}>
            <div className="border-b border-gray-300 pb-2 mb-3">
              <h2 className="text-lg font-semibold uppercase tracking-wide" style={{ color: '#1a1a1a' }}>Perfil de Índices Compuestos</h2>
            </div>
            <GraficoBarras 
              data={datosIndices} 
              minVal={40} 
              maxVal={160}
              showValues={true}
            />
            <p className="text-xs text-gray-400 mt-2 italic">
              Gráfico de índices compuestos del WISC-V. El CIT es el índice global.
            </p>
          </div>
        )}

        {/* INTERPRETACIÓN EN PÁRRAFOS */}
        <div className="mb-6">
          <div className="border-b border-gray-300 pb-2 mb-3">
            <h2 className="text-lg font-semibold uppercase tracking-wide" style={{ color: '#1a1a1a' }}>Interpretación de Resultados</h2>
          </div>

          {/* CIT */}
          {compositeScores.CIT && (
            <div className="mb-4">
              <h3 className="text-md font-semibold" style={{ color: '#1a1a1a' }}>
                Coeficiente Intelectual Total (CIT)
              </h3>
              <p className="text-sm leading-relaxed text-justify" style={{ color: '#4b5563' }}>
                El evaluado obtuvo un CIT de <strong>{compositeScores.CIT.score}</strong>, 
                clasificado como <strong>{getClassification(compositeScores.CIT.score)}</strong> 
                (percentil {compositeScores.CIT.percentile}). 
                {compositeScores.CIT.score >= 110 
                  ? ' Este puntaje indica un desarrollo cognitivo superior al promedio, lo que sugiere buenas capacidades para el aprendizaje y la resolución de problemas complejos.' 
                  : compositeScores.CIT.score >= 90 
                    ? ' Este puntaje se encuentra dentro del rango esperado para la población general, indicando un funcionamiento cognitivo acorde a su edad.' 
                    : ' Este puntaje se encuentra por debajo del promedio, lo que sugiere la necesidad de apoyos específicos en el ámbito académico y/o cognitivo.'}
              </p>
            </div>
          )}

          {/* Índices */}
          {['ICV', 'IVE', 'IRF', 'IMT', 'IVP'].map(code => {
            const idx = compositeScores[code]
            if (!idx) return null
            const label = indexLabels[code] || code
            return (
              <div key={code} className="mb-3">
                <h3 className="text-md font-semibold" style={{ color: '#1a1a1a' }}>
                  {label} ({idx.score})
                </h3>
                <p className="text-sm leading-relaxed text-justify" style={{ color: '#4b5563' }}>
                  {idx.score >= 110 
                    ? `El evaluado muestra un desempeño superior en el índice ${label}, lo que evidencia fortalezas en las habilidades cognitivas asociadas a este dominio.`
                    : idx.score >= 90 
                      ? `El desempeño en el índice ${label} se encuentra dentro de lo esperado para su edad, con un desarrollo adecuado de las habilidades cognitivas asociadas.`
                      : `Se observan dificultades en el índice ${label}, lo que sugiere la necesidad de intervención o apoyo en las habilidades cognitivas relacionadas.`}
                  {' '}{(() => {
                    const desc: Record<string, string> = {
                      ICV: 'Este índice evalúa la capacidad de razonamiento verbal, la formación de conceptos y el conocimiento léxico.',
                      IVE: 'Este índice evalúa la percepción de detalles visuales, la comprensión de relaciones espaciales y la integración visomotora.',
                      IRF: 'Este índice mide la capacidad de detectar reglas lógicas y relaciones conceptuales, así como el pensamiento abstracto.',
                      IMT: 'Este índice evalúa la capacidad de registrar, mantener y manipular información activa en la conciencia.',
                      IVP: 'Este índice mide la rapidez en identificación visual y toma de decisiones, así como la eficiencia en tareas de rastreo visual.'
                    }
                    return desc[code] || ''
                  })()}
                </p>
              </div>
            )
          })}

          {/* Descripción cualitativa de subpruebas */}
          <div className="mt-4">
            <h3 className="text-md font-semibold" style={{ color: '#1a1a1a' }}>
              Análisis Cualitativo por Subprueba
            </h3>
            {Object.entries(scaledScores)
              .filter(([_, pe]) => pe != null)
              .map(([code, pe]) => {
                const label = subtestLabels[code] || code
                const descripcion = pe >= 12 
                  ? 'destaca positivamente, mostrando un desempeño sobresaliente.'
                  : pe >= 8 
                    ? 'se encuentra dentro del rango esperado, con un desarrollo adecuado.'
                    : 'muestra dificultades significativas que podrían requerir atención específica.'
                return (
                  <p key={code} className="text-sm leading-relaxed text-justify" style={{ color: '#4b5563' }}>
                    <strong>{label}:</strong> PE {pe} – {descripcion}
                  </p>
                )
              })}
          </div>
        </div>

        {/* RECOMENDACIONES */}
        <div className="mb-6" style={{ pageBreakBefore: 'always', pageBreakInside: 'avoid' }}>
          <div className="border-b border-gray-300 pb-2 mb-3">
            <h2 className="text-lg font-semibold uppercase tracking-wide" style={{ color: '#1a1a1a' }}>Recomendaciones</h2>
          </div>
          <p className="text-sm leading-relaxed text-justify" style={{ color: '#4b5563' }}>
            Con base en los resultados obtenidos, se sugieren las siguientes orientaciones:
          </p>
          <ul className="text-sm leading-relaxed list-disc pl-5 space-y-2 mt-2" style={{ color: '#4b5563' }}>
            <li>
              <strong>Áreas de Fortaleza:</strong> Se recomienda potenciar las habilidades destacadas mediante actividades desafiantes que mantengan el interés y promuevan el desarrollo de habilidades superiores. Por ejemplo, si el evaluado destaca en razonamiento verbal, se sugiere fomentar la lectura crítica y la discusión de textos complejos.
            </li>
            <li>
              <strong>Áreas de Debilidad:</strong> Implementar apoyos específicos según los índices más bajos. Si hay debilidad en memoria de trabajo, se recomienda entrenamiento con ejercicios de retención y manipulación de información, así como el uso de ayudas visuales y organización de tareas.
            </li>
            <li>
              <strong>Contexto Educativo:</strong> Adaptar el entorno escolar reduciendo la carga cognitiva en tareas que demanden memoria de trabajo o velocidad de procesamiento. Proporcionar instrucciones claras y segmentadas, y utilizar materiales visuales que faciliten la comprensión.
            </li>
            <li>
              <strong>Seguimiento:</strong> Se sugiere una reevaluación en 12 a 18 meses para monitorear la evolución del perfil cognitivo y ajustar las intervenciones según sea necesario. Además, se recomienda una evaluación complementaria en áreas específicas si se identifican necesidades particulares.
            </li>
          </ul>
          <p className="text-sm leading-relaxed text-justify mt-3" style={{ color: '#4b5563' }}>
            Los resultados deben interpretarse en el contexto de la historia personal, educativa y familiar del evaluado. Se recomienda integrar esta información con otras fuentes de evaluación (observación, entrevistas, etc.) para una comprensión integral.
          </p>
        </div>

        <ReporteFooter showFirma={true} />
      </div>
    </div>
  )
}

export default function Wisc5ResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <Wisc5ResultsPageInner />
    </Suspense>
  )
}