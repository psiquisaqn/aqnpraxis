'use client'
// app/bdi2/[sessionId]/report/page.tsx
// Versión mejorada con gráficos de barras, textos dinámicos según rangos

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { PdfDownloadButton } from '@/components/PdfDownloadButton'

// Estilos para impresión
const printStyles = `
  @media print {
    body { margin: 0; padding: 0; }
    .no-print { display: none; }
    .reporte-container { padding: 1.5cm; width: 100%; }
  }
`

// Interpretación según rango de severidad
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

// Interpretación de dimensiones
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

// Conclusión general
function getConclusionGeneral(puntaje: number, severityLabel: string, nombrePaciente: string): string {
  const interpretacion = getInterpretacionSeveridad(puntaje)
  
  return `${nombrePaciente || 'El evaluado'} presenta un cuadro de ${interpretacion.nivel.toLowerCase()} según el BDI-II, con una puntuación total de ${puntaje} puntos. ${interpretacion.descripcion.substring(0, 200)} ${interpretacion.recomendacion} Es importante destacar que este instrumento es una medida de tamizaje, no un diagnóstico definitivo. Cualquier plan de intervención debe basarse en una evaluación clínica integral que considere el contexto biopsicosocial del evaluado. El presente informe debe ser interpretado por un profesional de la salud mental capacitado.`
}

// Gráfico de barras
function GraficoBarras({ data }: { data: Array<{ label: string; value: number; max: number }> }) {
  const maxVal = Math.max(...data.map(d => d.value), 30)
  
  return (
    <div className="grafico-barras-container" style={{ margin: '20px 0', fontFamily: 'Georgia, Times New Roman, serif' }}>
      <div className="grafico-barras" style={{ 
        display: 'flex', 
        justifyContent: 'space-around', 
        alignItems: 'flex-end', 
        minHeight: '200px',
        borderBottom: '2px solid #333',
        borderLeft: '2px solid #333',
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

export default function Bdi2ReportPage() {
  const { sessionId } = useParams()
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [patient, setPatient] = useState<any>(null)
  const [patientId, setPatientId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { data: score, error } = await supabase
        .from('bdi2_scores')
        .select('*')
        .eq('session_id', sessionId as string)
        .single()

      if (error || !score) { setLoading(false); return }
      setData(score)

      const { data: session } = await supabase
        .from('sessions')
        .select('patient:patients(id, full_name, birth_date)')
        .eq('id', sessionId as string)
        .single()

      if (session?.patient) {
        const p = session.patient as any
        setPatient(p)
        setPatientId(p.id ?? '')
      }
      setLoading(false)
    }
    load()
  }, [sessionId])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f5f5f0' }}>
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#4a4a4a', borderTopColor: 'transparent' }} />
    </div>
  )

  if (!data) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f5f5f0' }}>
      <div className="text-center">
        <p className="text-gray-500 mb-4">No se encontraron resultados.</p>
        <button onClick={() => router.push('/dashboard')} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
          Volver al dashboard
        </button>
      </div>
    </div>
  )

  const interpretacion = getInterpretacionSeveridad(data.total_score)
  
  const severityColors: Record<string, { bg: string; text: string; border: string }> = {
    minima:   { bg: '#e8f5e9', text: '#2e7d32', border: '#a5d6a7' },
    leve:     { bg: '#fff3e0', text: '#e65100', border: '#ffcc80' },
    moderada: { bg: '#fff3e0', text: '#e65100', border: '#ffcc80' },
    grave:    { bg: '#ffebee', text: '#c62828', border: '#ef9a9a' },
  }
  
  const severityKey = data.severity || (data.total_score <= 13 ? 'minima' : data.total_score <= 19 ? 'leve' : data.total_score <= 28 ? 'moderada' : 'grave')
  const sev = severityColors[severityKey] ?? { bg: '#e8f5e9', text: '#2e7d32', border: '#a5d6a7' }

  const datosGrafico = [
    { label: 'Cognitivo-Afectivo', value: data.cognitive_affective_score || 0, max: 42 },
    { label: 'Somático-Motivacional', value: data.somatic_motivational_score || 0, max: 21 },
    { label: 'Ideación Suicida', value: data.suicidal_ideation_score || 0, max: 6 },
  ]

  return (
    <div className="min-h-screen" style={{ background: '#f5f5f0' }}>
      <style>{printStyles}</style>
      
      {/* Barra superior - no imprimible */}
      <div className="sticky top-0 z-20 border-b px-6 py-3 flex items-center gap-3 flex-wrap no-print" style={{ background: 'white', borderColor: '#e5e5e0' }}>
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#9ca3af' }}>BDI-II</span>
        <div className="flex-1" />
        <PdfDownloadButton
          contentRef={contentRef}
          meta={{
            sessionId: sessionId as string,
            patientId,
            testId: 'beck_bdi2',
            patientName: patient?.full_name ?? '',
            content: { totalScore: data.total_score, severity: data.severity_label }
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

      {/* Contenido imprimible */}
      <div ref={contentRef} className="reporte-container max-w-3xl mx-auto p-6" style={{ fontFamily: 'Georgia, Times New Roman, serif' }}>
        <div className="rounded-xl p-6 mb-6" style={{ background: 'white', border: '1px solid #e5e5e0' }}>
          <div className="mb-6">
            <h1 className="text-2xl font-bold" style={{ color: '#1a1a1a' }}>Inventario de Depresión de Beck (BDI-II)</h1>
            <p className="mt-1" style={{ color: '#4b5563' }}>Paciente: {patient?.full_name || 'Sin nombre'}</p>
            <p className="text-sm" style={{ color: '#9ca3af' }}>
              Fecha: {data.calculated_at
                ? new Date(data.calculated_at).toLocaleDateString('es-CL')
                : new Date().toLocaleDateString('es-CL')}
            </p>
          </div>

          {/* Puntaje total */}
          <div className={`rounded-xl p-6 mb-6 text-center`} style={{ background: sev.bg, border: `1px solid ${sev.border}` }}>
            <p className="text-sm mb-1" style={{ color: sev.text }}>Puntaje Total</p>
            <p className="text-5xl font-bold" style={{ color: sev.text }}>{data.total_score}</p>
            <p className="text-lg font-medium mt-2" style={{ color: sev.text }}>{data.severity_label || interpretacion.nivel}</p>
            <p className="text-sm mt-3" style={{ color: '#4b5563' }}>{interpretacion.descripcion}</p>
            <p className="text-sm mt-2 font-medium" style={{ color: sev.text }}>Recomendación: {interpretacion.recomendacion}</p>
          </div>

          {/* Gráfico de barras */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: '#9ca3af' }}>Perfil de Dimensiones</h2>
            <GraficoBarras data={datosGrafico} />
          </div>

          {/* Dimensiones con interpretación */}
          <div className="space-y-4">
            <div className="rounded-lg p-4" style={{ background: '#fafaf5', border: '1px solid #e8e8e3' }}>
              <h3 className="text-md font-semibold mb-2" style={{ color: '#1a1a1a' }}>Dimensión Cognitivo-Afectiva</h3>
              <p className="text-sm" style={{ color: '#4b5563' }}>
                {getInterpretacionDimension("Cognitivo-Afectivo", data.cognitive_affective_score || 0, 42)}
              </p>
            </div>
            <div className="rounded-lg p-4" style={{ background: '#fafaf5', border: '1px solid #e8e8e3' }}>
              <h3 className="text-md font-semibold mb-2" style={{ color: '#1a1a1a' }}>Dimensión Somático-Motivacional</h3>
              <p className="text-sm" style={{ color: '#4b5563' }}>
                {getInterpretacionDimension("Somático-Motivacional", data.somatic_motivational_score || 0, 21)}
              </p>
            </div>
            <div className="rounded-lg p-4" style={{ background: '#fafaf5', border: '1px solid #e8e8e3' }}>
              <h3 className="text-md font-semibold mb-2" style={{ color: '#1a1a1a' }}>Ideación Suicida</h3>
              <p className="text-sm" style={{ color: '#4b5563' }}>
                {getInterpretacionDimension("Ideación Suicida", data.suicidal_ideation_score || 0, 6)}
              </p>
            </div>
          </div>

          {/* Conclusión general */}
          <div className="mt-6 rounded-lg p-4" style={{ background: '#f0f0eb', border: '1px solid #e0e0d8' }}>
            <h2 className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: '#9ca3af' }}>Conclusión y Recomendaciones</h2>
            <p className="text-sm leading-relaxed" style={{ color: '#4b5563', textAlign: 'justify' }}>
              {getConclusionGeneral(data.total_score, data.severity_label || interpretacion.nivel, patient?.full_name)}
            </p>
          </div>
        </div>

        <div className="text-center py-4">
          <p className="text-xs" style={{ color: '#9ca3af' }}>
            Generado por AQN Praxis · Beck, Steer & Brown (1996)
          </p>
        </div>
      </div>
    </div>
  )
}