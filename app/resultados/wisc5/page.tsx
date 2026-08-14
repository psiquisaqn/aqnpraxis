'use client'
// app/resultados/wisc5/page.tsx

import { useEffect, useState, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { PdfDownloadButton } from '@/components/PdfDownloadButton'
import { ReporteHeader } from '@/components/ReporteHeader'
import { ReporteFooter } from '@/components/ReporteFooter'
import { useReportDocx } from '@/hooks/useReportDocx'
import { type SubtestCode } from '@/lib/wisc5/engine'

// Importar interpretaciones desde lib
import {
  getClassification,
  getScaledClassification,
  getSubtestInterpretation,
  getInterpretacionIndice,
  SUBTEST_INTERPRETATIONS,
} from '@/lib/interpretaciones/wisc5'

// ============================================================
// TIPOS
// ============================================================

interface Wisc5Data {
  composite_scores: {
    CIT?: { score: number; percentile: number }
    ICV?: { score: number; percentile: number }
    IVE?: { score: number; percentile: number }
    IRF?: { score: number; percentile: number }
    IMT?: { score: number; percentile: number }
    IVP?: { score: number; percentile: number }
  }
  scaled_scores: Record<string, number>
  raw_scores: Record<string, any>
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
// FUNCIONES DE CLASIFICACIÓN (ahora importadas desde lib)
// ============================================================

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
// GRÁFICO DE BARRAS
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
  const barWidth = 28
  const itemWidth = 45
  const maxHeight = 150

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
        paddingBottom: '0px',
        gap: '6px',
        flexWrap: 'wrap'
      }}>
        {data.map((item, idx) => {
          const score = item.score
          const alturaRelativa = ((score - minVal) / (maxVal - minVal)) * maxHeight
          const color = getColorForScore(score, maxVal <= 19)

          return (
            <div key={idx} style={{ width: `${itemWidth}px`, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' }}>
              <div style={{
                backgroundColor: color,
                width: `${barWidth}px`,
                height: `${Math.max(alturaRelativa, 4)}px`,
                borderRadius: '2px 2px 0 0',
              }} />
              {showValues && (
                <div style={{ fontSize: '8px', color: color, marginTop: '1px', fontWeight: 'bold' }}>
                  {score}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        paddingLeft: '10px',
        gap: '6px',
        flexWrap: 'wrap',
        marginTop: '2px'
      }}>
        {data.map((item, idx) => (
          <div key={idx} style={{ width: `${itemWidth}px`, textAlign: 'center', fontSize: '7px', fontWeight: 'normal', fontFamily: 'Georgia, Times New Roman, serif' }}>
            {item.label}
          </div>
        ))}
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
  const [data, setData] = useState<Wisc5Data | null>(null)
  const [planStatus, setPlanStatus] = useState<any>(null)
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

        setData(wiscData as Wisc5Data)

        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: planData } = await supabase.rpc('get_plan_status', { p_user_id: user.id })
          const plan = Array.isArray(planData) ? planData[0] : planData
          setPlanStatus(plan)
        }

        setLoading(false)
      } catch (err: any) {
        setError(err.message)
        setLoading(false)
      }
    }

    load()
  }, [sessionId])

  const isPro = planStatus?.is_pro || false

  const handleDownload = (type: 'docx' | 'odt') => {
    if (!data) return
    const meta = {
      sessionId,
      patientId,
      testId: 'wisc5',
      patientName,
      patientRut,
      patientBirthDate,
      patientAge,
      patientSchool,
      evalDate,
      content: {
        indexes: data.composite_scores || {},
        scaledScores: data.scaled_scores || {},
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

  const scaledScores = data.scaled_scores || {}
  const compositeScores = data.composite_scores || {}
  const rawScores = data.raw_scores || {}

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
      code: code as SubtestCode,
      label: subtestLabels[code] || code,
      score: pe as number,
    }))
    .sort((a, b) => a.label.localeCompare(b.label))

  const primaryCodes: SubtestCode[] = ['CC', 'AN', 'MR', 'RD', 'CLA', 'VOC', 'BAL']
  const datosPrimarias = datosSubpruebas.filter(item => primaryCodes.includes(item.code))
  const datosSecundarias = datosSubpruebas.filter(item => !primaryCodes.includes(item.code))

  return (
    <div className="min-h-screen" style={{ background: 'white' }}>
      <style>{printStyles}</style>

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

      <div ref={contentRef} className="reporte-container max-w-4xl mx-auto px-6 py-8 pb-12" style={{ fontFamily: 'Georgia, Times New Roman, serif', background: 'white' }}>

        <ReporteHeader
          patientName={patientName}
          patientRut={patientRut}
          patientBirthDate={patientBirthDate}
          patientAge={patientAge}
          patientSchool={patientSchool}
          evalDate={evalDate}
          testName="Informe de Evaluación de Funcionamiento Cognitivo"
        />

        {/* GRÁFICO DE SUBPRUEBAS */}
        {datosSubpruebas.length > 0 && (
          <div className="mb-6" style={{ pageBreakInside: 'avoid' }}>
            {reportType === 'extended' ? (
              <>
                <div className="border-b border-gray-300 pb-2 mb-3">
                  <h2 className="text-lg font-semibold uppercase tracking-wide" style={{ color: '#1a1a1a' }}>Subpruebas Primarias</h2>
                </div>
                {datosPrimarias.length > 0 && (
                  <>
                    <GraficoBarras
                      data={datosPrimarias}
                      minVal={0}
                      maxVal={19}
                      showValues={true}
                    />
                    <p className="text-xs text-gray-400 mt-2 italic">
                      Gráfico de puntajes escalares (PE) de las 7 subpruebas primarias del WISC-V.
                    </p>
                  </>
                )}

                <div className="border-b border-gray-300 pb-2 mt-6 mb-3">
                  <h2 className="text-lg font-semibold uppercase tracking-wide" style={{ color: '#1a1a1a' }}>Subpruebas Secundarias</h2>
                </div>
                {datosSecundarias.length > 0 && (
                  <>
                    <GraficoBarras
                      data={datosSecundarias}
                      minVal={0}
                      maxVal={19}
                      showValues={true}
                    />
                    <p className="text-xs text-gray-400 mt-2 italic">
                      Gráfico de puntajes escalares (PE) de las subpruebas complementarias.
                    </p>
                  </>
                )}
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        )}

        {/* GRÁFICO DE ÍNDICES COMPUESTOS */}
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

          {compositeScores.CIT && (
            <div className="mb-4">
              <h3 className="text-md font-semibold" style={{ color: '#1a1a1a' }}>
                Coeficiente Intelectual Total (CIT)
              </h3>
              <p className="text-sm leading-relaxed text-justify" style={{ color: '#4b5563' }}>
                {getInterpretacionIndice('CIT', compositeScores.CIT.score)}
                {' '}El rango de confianza es {compositeScores.CIT.score - 15} – {compositeScores.CIT.score + 15} (Percentil {compositeScores.CIT.percentile}).
              </p>
            </div>
          )}

          {['ICV', 'IVE', 'IRF', 'IMT', 'IVP'].map(code => {
            const idx = compositeScores[code]
            if (!idx) return null
            return (
              <div key={code} className="mb-3">
                <h3 className="text-md font-semibold" style={{ color: '#1a1a1a' }}>
                  {indexLabels[code]} ({idx.score})
                </h3>
                <p className="text-sm leading-relaxed text-justify" style={{ color: '#4b5563' }}>
                  {getInterpretacionIndice(code, idx.score)}
                </p>
              </div>
            )
          })}

          <div className="mt-4">
            <h3 className="text-md font-semibold" style={{ color: '#1a1a1a' }}>
              Análisis Cualitativo por Subprueba
            </h3>
            {Object.entries(scaledScores)
              .filter(([_, pe]) => pe != null)
              .map(([code, pe]) => {
                const label = subtestLabels[code] || code
                const interpretation = getSubtestInterpretation(code, pe as number)
                return (
                  <p key={code} className="text-sm leading-relaxed text-justify" style={{ color: '#4b5563' }}>
                    <strong>{label}:</strong> PE {pe as number} – {interpretation}
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
            Con base en los resultados obtenidos, se sugiere potenciar las áreas de fortaleza identificadas mediante actividades desafiantes que mantengan el interés y promuevan el desarrollo de habilidades superiores. Por ejemplo, si el evaluado destaca en razonamiento verbal, se recomienda fomentar la lectura crítica y la discusión de textos complejos. En las áreas de debilidad, se deben implementar apoyos específicos según los índices más bajos; si hay debilidad en memoria de trabajo, se sugiere entrenamiento con ejercicios de retención y manipulación de información, así como el uso de ayudas visuales y organización de tareas. En el contexto educativo, se recomienda adaptar el entorno escolar reduciendo la carga cognitiva en tareas que demanden memoria de trabajo o velocidad de procesamiento, proporcionar instrucciones claras y segmentadas, y utilizar materiales visuales que faciliten la comprensión. Finalmente, se sugiere una reevaluación en 12 a 18 meses para monitorear la evolución del perfil cognitivo y ajustar las intervenciones según sea necesario; además, se recomienda una evaluación complementaria en áreas específicas si se identifican necesidades particulares. Los resultados deben interpretarse en el contexto de la historia personal, educativa y familiar del evaluado, integrando esta información con otras fuentes de evaluación (observación, entrevistas, etc.) para una comprensión integral.
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