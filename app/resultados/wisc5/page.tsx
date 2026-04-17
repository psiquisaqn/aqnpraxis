'use client'
// app/resultados/wisc5/page.tsx
// Página de resultados para WISC-V
// Incluye gráficos de barras, interpretación de índices y conclusión general

import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { PdfDownloadButton } from '@/components/PdfDownloadButton'
import { ReporteHeader } from '@/components/ReporteHeader'
import { ReporteFooter } from '@/components/ReporteFooter'

// Estilos para impresión
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

// Clasificación y colores
const CLASSIFICATION_CONFIG: Record<string, { label: string; color: string; description: string }> = {
  'Muy superior': { label: 'Muy superior', color: '#1B5E20', description: 'El rendimiento se ubica en el rango muy superior, significativamente por encima del promedio.' },
  'Superior': { label: 'Superior', color: '#2E7D32', description: 'El rendimiento se ubica en el rango superior, claramente por encima del promedio.' },
  'Promedio alto': { label: 'Promedio alto', color: '#4CAF50', description: 'El rendimiento se ubica en el rango promedio alto, ligeramente por encima del promedio.' },
  'Promedio': { label: 'Promedio', color: '#9E9E9E', description: 'El rendimiento se ubica en el rango promedio, dentro de lo esperado para la edad.' },
  'Promedio bajo': { label: 'Promedio bajo', color: '#F57C00', description: 'El rendimiento se ubica en el rango promedio bajo, ligeramente por debajo del promedio.' },
  'Limítrofe': { label: 'Limítrofe', color: '#E65100', description: 'El rendimiento se ubica en el rango limítrofe, significativamente por debajo del promedio.' },
  'Extremadamente bajo': { label: 'Extremadamente bajo', color: '#C62828', description: 'El rendimiento se ubica en el rango extremadamente bajo, muy por debajo del promedio.' }
}

// Interpretación de índices
function getInterpretacionIndice(nombre: string, puntaje: number, clasificacion: string): string {
  const descripciones: Record<string, string> = {
    'ICV': 'El Índice de Comprensión Verbal (ICV) evalúa habilidades relacionadas con la formación de conceptos verbales, el razonamiento verbal y el conocimiento adquirido. Refleja la capacidad para comprender y utilizar el lenguaje, así como el bagaje cultural y educativo del evaluado.',
    'IVE': 'El Índice Visoespacial (IVE) evalúa la capacidad para percibir, analizar y sintetizar estímulos visuales y espaciales. Mide la habilidad para construir modelos mentales de estímulos visuales y manipular figuras geométricas mentalmente.',
    'IRF': 'El Índice de Razonamiento Fluido (IRF) evalúa la capacidad para resolver problemas novedosos, identificar patrones y relaciones lógicas. Mide el razonamiento inductivo y deductivo, fundamentales para la inteligencia fluida.',
    'IMT': 'El Índice de Memoria de Trabajo (IMT) evalúa la capacidad para retener, manipular y transformar información en la memoria a corto plazo. Es fundamental para el aprendizaje, la comprensión lectora y el razonamiento matemático.',
    'IVP': 'El Índice de Velocidad de Procesamiento (IVP) evalúa la rapidez con que el evaluado puede procesar información visual y ejecar tareas de manera eficiente. Refleja la velocidad de procesamiento cognitivo y la automatización de habilidades.',
    'CIT': 'El Cociente Intelectual Total (CIT) representa una estimación de la capacidad intelectual global del evaluado. Integra todas las dimensiones cognitivas evaluadas y proporciona una medida general del funcionamiento intelectual.'
  }

  let interpretacion = descripciones[nombre] || ''
  
  if (puntaje >= 130) {
    interpretacion += ` Con un puntaje de ${puntaje}, que corresponde a una clasificación "${clasificacion}", se observa un desempeño excepcionalmente alto en esta área. El evaluado demuestra habilidades cognitivas muy superiores a lo esperado para su edad.`
  } else if (puntaje >= 120) {
    interpretacion += ` Con un puntaje de ${puntaje}, que corresponde a una clasificación "${clasificacion}", se observa un desempeño notablemente alto en esta área. El evaluado demuestra habilidades cognitivas superiores a lo esperado para su edad.`
  } else if (puntaje >= 110) {
    interpretacion += ` Con un puntaje de ${puntaje}, que corresponde a una clasificación "${clasificacion}", se observa un desempeño ligeramente superior al promedio en esta área.`
  } else if (puntaje >= 90) {
    interpretacion += ` Con un puntaje de ${puntaje}, que corresponde a una clasificación "${clasificacion}", se observa un desempeño dentro de lo esperado para su edad en esta área.`
  } else if (puntaje >= 80) {
    interpretacion += ` Con un puntaje de ${puntaje}, que corresponde a una clasificación "${clasificacion}", se observa un desempeño ligeramente inferior al promedio en esta área.`
  } else if (puntaje >= 70) {
    interpretacion += ` Con un puntaje de ${puntaje}, que corresponde a una clasificación "${clasificacion}", se observa un desempeño significativamente inferior al promedio en esta área.`
  } else {
    interpretacion += ` Con un puntaje de ${puntaje}, que corresponde a una clasificación "${clasificacion}", se observa un desempeño extremadamente bajo en esta área, muy por debajo de lo esperado para su edad.`
  }
  
  return interpretacion
}

// Conclusión general
function getConclusionGeneral(scores: Record<string, { score: number; classification: string }>, nombrePaciente: string): string {
  const cit = scores.CIT
  if (!cit) return `${nombrePaciente || 'El evaluado'} ha completado la evaluación WISC-V. Se requiere completar todos los índices para obtener una conclusión completa.`
  
  const config = CLASSIFICATION_CONFIG[cit.classification] || CLASSIFICATION_CONFIG['Promedio']
  
  let conclusion = `${nombrePaciente || 'El evaluado'} obtuvo un Cociente Intelectual Total (CIT) de ${cit.score} puntos, lo que se clasifica como "${cit.classification}". ${config.description} `
  
  // Identificar fortalezas y debilidades
  const indices = Object.entries(scores).filter(([key]) => key !== 'CIT')
  const ordenados = [...indices].sort((a, b) => b[1].score - a[1].score)
  
  if (ordenados.length >= 2) {
    const fortaleza = ordenados[0]
    const debilidad = ordenados[ordenados.length - 1]
    
    if (fortaleza[1].score - debilidad[1].score >= 15) {
      conclusion += `Se observa una diferencia significativa entre sus fortalezas (${fortaleza[0]}: ${fortaleza[1].score}) y debilidades (${debilidad[0]}: ${debilidad[1].score}), lo que sugiere un perfil cognitivo heterogéneo. `
    }
  }
  
  conclusion += `Es importante considerar que los resultados del WISC-V deben interpretarse en el contexto de la historia clínica, educativa y social del evaluado, complementándose con otras fuentes de información para una comprensión integral de su funcionamiento cognitivo.`
  
  return conclusion
}

// Gráfico de barras para índices
function GraficoBarrasIndices({ data }: { data: Array<{ label: string; value: number; classification: string }> }) {
  const maxVal = 160
  const minVal = 40
  
  return (
    <div className="grafico-barras-container" style={{ margin: '20px 0', fontFamily: 'Georgia, Times New Roman, serif', pageBreakInside: 'avoid' }}>
      <div className="grafico-barras" style={{ 
        display: 'flex', 
        justifyContent: 'space-around', 
        alignItems: 'flex-end', 
        minHeight: '280px',
        borderBottom: '1px solid #333',
        borderLeft: '1px solid #333',
        paddingLeft: '10px',
        paddingBottom: '10px',
        position: 'relative'
      }}>
        {/* Bandas de referencia */}
        <div style={{ position: 'absolute', bottom: 10, left: 40, right: 20, height: '200px', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', bottom: '0%', height: '25%', width: '100%', background: 'rgba(198, 40, 40, 0.1)', borderBottom: '1px solid #C62828' }} />
          <div style={{ position: 'absolute', bottom: '25%', height: '12.5%', width: '100%', background: 'rgba(230, 81, 0, 0.1)', borderBottom: '1px solid #E65100' }} />
          <div style={{ position: 'absolute', bottom: '37.5%', height: '12.5%', width: '100%', background: 'rgba(245, 124, 0, 0.1)', borderBottom: '1px solid #F57C00' }} />
          <div style={{ position: 'absolute', bottom: '50%', height: '25%', width: '100%', background: 'rgba(158, 158, 158, 0.1)', borderBottom: '1px solid #9E9E9E' }} />
          <div style={{ position: 'absolute', bottom: '75%', height: '12.5%', width: '100%', background: 'rgba(76, 175, 80, 0.1)', borderBottom: '1px solid #4CAF50' }} />
          <div style={{ position: 'absolute', bottom: '87.5%', height: '12.5%', width: '100%', background: 'rgba(46, 125, 50, 0.1)' }} />
        </div>
        
        {data.map((item, idx) => {
          const alturaRelativa = ((item.value - minVal) / (maxVal - minVal)) * 200
          const color = CLASSIFICATION_CONFIG[item.classification]?.color || '#9E9E9E'
          
          return (
            <div key={idx} style={{ textAlign: 'center', width: '80px', zIndex: 1 }}>
              <div style={{ 
                backgroundColor: color, 
                width: '45px', 
                margin: '0 auto', 
                height: `${Math.max(alturaRelativa, 4)}px`,
                marginBottom: '8px',
                transition: 'height 0.3s ease'
              }} title={`${item.value} - ${item.classification}`} />
              <div style={{ fontSize: '11px', fontWeight: 'bold', fontFamily: 'Georgia, Times New Roman, serif' }}>{item.label}</div>
              <div style={{ fontSize: '10px', color: '#555' }}>{item.value}</div>
            </div>
          )
        })}
      </div>
      <div className="flex justify-between text-[9px] mt-2 px-2" style={{ color: '#9ca3af' }}>
        <span>40</span>
        <span>70</span>
        <span>80</span>
        <span>90</span>
        <span>110</span>
        <span>120</span>
        <span>130</span>
        <span>160</span>
      </div>
      <div className="flex justify-between text-[8px] mt-1 px-2" style={{ color: '#9ca3af' }}>
        <span>Limítrofe</span>
        <span>Promedio bajo</span>
        <span>Promedio</span>
        <span>Promedio alto</span>
        <span>Superior</span>
        <span>Muy superior</span>
      </div>
    </div>
  )
}

function Wisc5ResultsPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session') ?? ''

  const contentRef = useRef<HTMLDivElement>(null)
  const [data, setData] = useState<any>(null)
  const [patientName, setPatientName] = useState('')
  const [patientId, setPatientId] = useState('')
  const [patientRut, setPatientRut] = useState('')
  const [patientBirthDate, setPatientBirthDate] = useState('')
  const [patientAge, setPatientAge] = useState<number | undefined>(undefined)
  const [patientSchool, setPatientSchool] = useState('')
  const [evalDate, setEvalDate] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!sessionId) return

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    async function load() {
      const { data: scores, error } = await supabase
        .from('wisc5_scores')
        .select('*')
        .eq('session_id', sessionId)
        .single()

      if (error || !scores) {
        console.error('Error loading scores:', error)
        setLoading(false)
        return
      }
      setData(scores)

      const { data: session } = await supabase
        .from('sessions')
        .select('started_at, patient:patients(id, full_name, rut, birth_date, school)')
        .eq('id', sessionId)
        .single()

      if (session?.patient) {
        const p = session.patient as any
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
      if (session?.started_at) {
        setEvalDate(new Date(session.started_at).toLocaleDateString('es-CL', {
          day: '2-digit', month: 'long', year: 'numeric'
        }))
      }
      setLoading(false)
    }

    load()
  }, [sessionId])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'white' }}>
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#4a4a4a', borderTopColor: 'transparent' }} />
    </div>
  )

  if (!data) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'white' }}>
      <div className="text-center">
        <p className="text-gray-500 mb-4">No se encontraron resultados para esta sesión.</p>
        <button onClick={() => router.push('/dashboard')} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
          Volver al dashboard
        </button>
      </div>
    </div>
  )

  // Mapear índices disponibles
  const indices = [
    { code: 'icv', label: 'ICV', name: 'Índice de Comprensión Verbal' },
    { code: 'ive', label: 'IVE', name: 'Índice Visoespacial' },
    { code: 'irf', label: 'IRF', name: 'Índice de Razonamiento Fluido' },
    { code: 'imt', label: 'IMT', name: 'Índice de Memoria de Trabajo' },
    { code: 'ivp', label: 'IVP', name: 'Índice de Velocidad de Procesamiento' },
    { code: 'cit', label: 'CIT', name: 'Cociente Intelectual Total' }
  ]

  const scores: Record<string, { score: number; classification: string }> = {}
  indices.forEach(idx => {
    if (data[idx.code] !== null && data[idx.code] !== undefined) {
      scores[idx.label] = {
        score: data[idx.code],
        classification: data[`${idx.code}_classification`] || 
          (data[idx.code] >= 130 ? 'Muy superior' :
           data[idx.code] >= 120 ? 'Superior' :
           data[idx.code] >= 110 ? 'Promedio alto' :
           data[idx.code] >= 90 ? 'Promedio' :
           data[idx.code] >= 80 ? 'Promedio bajo' :
           data[idx.code] >= 70 ? 'Limítrofe' : 'Extremadamente bajo')
      }
    }
  })

  const datosGrafico = indices
    .filter(idx => data[idx.code] !== null)
    .map(idx => ({
      label: idx.label,
      value: data[idx.code],
      classification: scores[idx.label]?.classification || 'Promedio'
    }))

  const citConfig = scores.CIT ? CLASSIFICATION_CONFIG[scores.CIT.classification] : CLASSIFICATION_CONFIG['Promedio']

  return (
    <div className="min-h-screen" style={{ background: 'white' }}>
      <style>{printStyles}</style>
      
      {/* Barra superior - no imprimible */}
      <div className="sticky top-0 z-20 border-b px-6 py-3 flex items-center gap-3 flex-wrap no-print" style={{ background: 'white', borderColor: '#e5e5e0' }}>
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#9ca3af' }}>WISC-V</span>
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
            sessionId: sessionId,
            patientId,
            testId: 'wisc5',
            patientName: patientName,
            content: { scores: scores, ageGroup: data.age_group }
          }}
          label="Guardar PDF"
        />
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
        
        {/* Header con logo y datos del paciente */}
        <ReporteHeader
          patientName={patientName}
          patientRut={patientRut}
          patientBirthDate={patientBirthDate}
          patientAge={patientAge}
          patientSchool={patientSchool}
          evalDate={evalDate}
          testName="WISC-V - Escala de Inteligencia Wechsler para Niños"
        />

        {/* Información del grupo etario */}
        {data.age_group && (
          <div className="mb-6 text-sm text-gray-500">
            Grupo etario de referencia: {data.age_group}
          </div>
        )}

        {/* CIT - resultado principal */}
        {scores.CIT && (
          <div className="mb-6" style={{ pageBreakInside: 'avoid' }}>
            <div className="border-b border-gray-300 pb-2 mb-3">
              <h2 className="text-lg font-semibold uppercase tracking-wide" style={{ color: '#1a1a1a' }}>Cociente Intelectual Total (CIT)</h2>
            </div>
            <div className="text-center mb-4">
              <p className="text-6xl font-bold" style={{ color: citConfig.color }}>{scores.CIT.score}</p>
              <p className="text-xl font-medium mt-1" style={{ color: citConfig.color }}>{scores.CIT.classification}</p>
            </div>
            <p className="text-sm leading-relaxed text-justify" style={{ color: '#4b5563' }}>
              {citConfig.description} El CIT es la medida más global de la capacidad intelectual del evaluado.
            </p>
          </div>
        )}

        {/* Gráfico de barras de índices */}
        {datosGrafico.length > 0 && (
          <div className="mb-6" style={{ pageBreakInside: 'avoid' }}>
            <div className="border-b border-gray-300 pb-2 mb-3">
              <h2 className="text-lg font-semibold uppercase tracking-wide" style={{ color: '#1a1a1a' }}>Perfil de Índices</h2>
            </div>
            <GraficoBarrasIndices data={datosGrafico} />
          </div>
        )}

        {/* Interpretación de índices */}
        <div className="mb-6" style={{ pageBreakBefore: 'avoid', pageBreakInside: 'avoid' }}>
          <div className="border-b border-gray-300 pb-2 mb-3">
            <h2 className="text-lg font-semibold uppercase tracking-wide" style={{ color: '#1a1a1a' }}>Interpretación de Índices</h2>
          </div>
          <div className="space-y-4">
            {indices.map(idx => {
              const score = data[idx.code]
              if (score === null || score === undefined) return null
              const classification = scores[idx.label]?.classification || 'Promedio'
              return (
                <div key={idx.code} className="pb-3" style={{ pageBreakInside: 'avoid' }}>
                  <h3 className="text-md font-semibold mb-1" style={{ color: '#1a1a1a' }}>{idx.name} ({idx.label})</h3>
                  <p className="text-sm leading-relaxed text-justify" style={{ color: '#4b5563' }}>
                    {getInterpretacionIndice(idx.label, score, classification)}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Conclusión general */}
        <div className="mb-6" style={{ pageBreakBefore: 'always', pageBreakInside: 'avoid' }}>
          <div className="border-b border-gray-300 pb-2 mb-3">
            <h2 className="text-lg font-semibold uppercase tracking-wide" style={{ color: '#1a1a1a' }}>Conclusión y Recomendaciones</h2>
          </div>
          <p className="text-sm leading-relaxed text-justify" style={{ color: '#4b5563', textAlign: 'justify' }}>
            {getConclusionGeneral(scores, patientName)}
          </p>
        </div>

        {/* Footer con firma e isotipo */}
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