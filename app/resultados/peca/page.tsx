'use client'
// app/resultados/peca/page.tsx
// Versión mejorada con:
// - Fondo blanco, sin recuadros de colores
// - Logo y firma configurables
// - Datos completos del paciente (RUT, edad, fecha nacimiento, colegio)
// - Saltos de página controlados
// - Isotipo AQN Praxis al final

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { TestResultsLayout } from '@/components/TestResultsLayout'
import { scorePeca, type PecaResult } from '@/lib/peca/engine'
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

// Interpretación según nivel de participación
function getInterpretacionParticipacion(porcentaje: number): { nivel: string; descripcion: string; recomendacion: string } {
  if (porcentaje >= 75) {
    return {
      nivel: "Alta Capacidad de Participación",
      descripcion: "El evaluado presenta una alta capacidad de participación y adaptación conductual. Las habilidades adaptativas están bien desarrolladas, permitiendo un funcionamiento independiente en la mayoría de los contextos. El evaluado demuestra autonomía en las actividades de la vida diaria, habilidades sociales apropiadas y capacidad para resolver problemas cotidianos de manera efectiva.",
      recomendacion: "Se recomienda continuar con estrategias de refuerzo positivo y monitoreo periódico. Mantener los apoyos actuales y fomentar la autonomía en nuevas áreas."
    }
  } else if (porcentaje >= 50) {
    return {
      nivel: "Nivel Medio de Participación",
      descripcion: "El evaluado muestra un nivel medio de participación en conductas adaptativas. Presenta habilidades funcionales en varias áreas, aunque requiere apoyo ocasional en tareas más complejas. La autonomía es parcial y existen algunas dificultades en contextos sociales o prácticos que limitan la independencia plena.",
      recomendacion: "Se sugiere trabajar en áreas específicas identificadas en las dimensiones con menor puntuación, mediante actividades estructuradas y seguimiento cercano. Implementar apoyos focalizados en las áreas deficitarias."
    }
  } else if (porcentaje >= 25) {
    return {
      nivel: "Dificultades Significativas",
      descripcion: "El evaluado presenta dificultades significativas en conducta adaptativa. Requiere apoyos sustanciales para desenvolverse en actividades cotidianas, tanto en el ámbito social como en el práctico. Las habilidades de comunicación, socialización o autonomía personal están afectadas de manera importante, limitando la independencia funcional.",
      recomendacion: "Se recomienda intervención multidisciplinaria, entrenamiento en habilidades específicas y reevaluación en 3-6 meses. Implementar un plan de apoyos individualizado con objetivos concretos y medibles."
    }
  } else {
    return {
      nivel: "Requiere Apoyo Intensivo",
      descripcion: "El evaluado requiere apoyo intensivo en conducta adaptativa. Las habilidades para la vida diaria, la interacción social y la resolución de problemas se encuentran severamente afectadas. La dependencia de cuidadores es alta y la autonomía es muy limitada en la mayoría de los contextos.",
      recomendacion: "Se recomienda derivación a especialistas, programa de intervención individualizado y reevaluación en 3 meses. Considerar la implementación de un sistema de apoyos extensos y continuos, con participación de múltiples profesionales."
    }
  }
}

// Interpretación de dimensiones específicas
function getInterpretacionDimension(nombre: string, puntaje: number, intensidad: string): string {
  const baseDescripcion: Record<string, string> = {
    'com': 'Habilidades de comunicación (lenguaje receptivo y expresivo), capacidad para expresar necesidades y comprender instrucciones.',
    'acu': 'Habilidades académicas funcionales, manejo de conceptos numéricos, lectura y escritura básica para la vida diaria.',
    'avd': 'Actividades de la vida diaria como alimentación, aseo, vestimenta, manejo del hogar y uso de la comunidad.',
    'hs': 'Habilidades sociales para interactuar con pares y adultos, seguir normas, respetar turnos y regular emociones.',
    'haf': 'Habilidades de autocuidado, salud y seguridad personal, reconocimiento de situaciones de riesgo.',
    'uco': 'Uso de la comunidad, desplazamiento autónomo, manejo de transporte y recursos comunitarios.',
    'adi': 'Autodirección, toma de decisiones, resolución de problemas y planificación de actividades.',
    'css': 'Conducta social y responsabilidad, respeto por normas sociales y capacidad para trabajar en grupo.',
    'aor': 'Áreas ocupacionales y recreativas, habilidades para el trabajo y uso adecuado del tiempo libre.'
  }
  
  const nivelDescriptivo = intensidad === 'Generalizado' ? 'muy afectada' :
                           intensidad === 'Extenso' ? 'significativamente afectada' :
                           intensidad === 'Limitado' ? 'moderadamente afectada' :
                           'levemente afectada'
  
  return `${nombre}: ${baseDescripcion[nombre] || 'Habilidad adaptativa evaluada.'} Actualmente se encuentra ${nivelDescriptivo}, con un nivel de desempeño ${intensidad.toLowerCase()}.`
}

// Conclusión general
function getConclusionGeneral(result: PecaResult, nombrePaciente: string): string {
  const porcentaje = Math.round(result.participationLevel * 100)
  const interpretacion = getInterpretacionParticipacion(porcentaje)
  
  // Identificar dimensiones más alta y más baja
  let dimensionAlta = { label: '', puntaje: -1 }
  let dimensionBaja = { label: '', puntaje: 101 }
  
  result.dimensions.forEach(dim => {
    const pct = dim.p2 * 100
    if (pct > dimensionAlta.puntaje) {
      dimensionAlta = { label: dim.label, puntaje: pct }
    }
    if (pct < dimensionBaja.puntaje) {
      dimensionBaja = { label: dim.label, puntaje: pct }
    }
  })
  
  return `${nombrePaciente || 'El evaluado'} presenta ${interpretacion.nivel.toLowerCase()} en conducta adaptativa, con un puntaje global de ${porcentaje}%. ${interpretacion.descripcion} Las principales fortalezas se observan en ${dimensionAlta.label} (${Math.round(dimensionAlta.puntaje)}%), mientras que las mayores dificultades se concentran en ${dimensionBaja.label} (${Math.round(dimensionBaja.puntaje)}%). ${interpretacion.recomendacion} Es fundamental que esta evaluación sea complementada con observación directa en contextos naturales y entrevistas con cuidadores o educadores para obtener un perfil completo y preciso del funcionamiento adaptativo del evaluado.`
}

// Función para obtener color según intensidad (solo para texto y gráfico)
function getIntensityColor(intensity: string): string {
  switch (intensity) {
    case 'Generalizado': return '#A32D2D'
    case 'Extenso':      return '#993C1D'
    case 'Limitado':     return '#854F0B'
    case 'Intermitente': return '#3B6D11'
    default:             return '#166534'
  }
}

// Gráfico de barras para dimensiones
function GraficoBarrasDimensiones({ data }: { data: Array<{ label: string; value: number; intensidad: string }> }) {
  const maxVal = 100
  
  return (
    <div className="grafico-barras-container" style={{ margin: '20px 0', fontFamily: 'Georgia, Times New Roman, serif', pageBreakInside: 'avoid' }}>
      <div className="grafico-barras" style={{ 
        display: 'flex', 
        justifyContent: 'space-around', 
        alignItems: 'flex-end', 
        minHeight: '250px',
        borderBottom: '1px solid #333',
        borderLeft: '1px solid #333',
        paddingLeft: '10px',
        paddingBottom: '10px',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        {data.map((item, idx) => {
          const alturaRelativa = (item.value / maxVal) * 180
          const color = getIntensityColor(item.intensidad)
          return (
            <div key={idx} style={{ textAlign: 'center', width: '70px' }}>
              <div style={{ 
                backgroundColor: color, 
                width: '40px', 
                margin: '0 auto', 
                height: `${Math.max(alturaRelativa, 4)}px`,
                marginBottom: '8px',
                transition: 'height 0.3s ease'
              }} title={`${item.value}% - ${item.intensidad}`} />
              <div style={{ fontSize: '10px', fontWeight: 'bold', fontFamily: 'Georgia, Times New Roman, serif' }}>{item.label}</div>
              <div style={{ fontSize: '9px', color: color, marginTop: '2px' }}>{item.intensidad}</div>
              <div style={{ fontSize: '9px', color: '#555' }}>{Math.round(item.value)}%</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PecaResultsPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session') ?? ''

  const [result, setResult] = useState<PecaResult | null>(null)
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
      // 1. Leer peca_scores directamente (p01-p45)
      const { data: scores, error: scoresError } = await supabase
        .from('peca_scores')
        .select('*')
        .eq('session_id', sessionId)
        .single()

      if (scoresError || !scores) { setLoading(false); return }

      // 2. Reconstruir respuestas desde p01-p45
      const resp: Record<number, 1 | 2 | 3 | 4> = {}
      for (let i = 1; i <= 45; i++) {
        const key = 'p' + String(i).padStart(2, '0') as keyof typeof scores
        const val = scores[key]
        if (val !== null && val !== undefined) {
          resp[i] = val as 1 | 2 | 3 | 4
        }
      }
      const calculatedResult = scorePeca(resp)
      setResult(calculatedResult)

      // 3. Leer datos de sesión + paciente
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

      setLoading(false)
    }

    load()
  }, [sessionId])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'white' }}>
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#4a4a4a', borderTopColor: 'transparent' }} />
    </div>
  )

  if (!result) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'white' }}>
      <div className="text-center">
        <p className="text-sm mb-3" style={{ color: '#4b5563' }}>No se encontraron resultados</p>
        <button onClick={() => router.back()} className="text-sm" style={{ color: '#4a4a4a' }}>← Volver</button>
      </div>
    </div>
  )

  const porcentajeParticipacion = Math.round(result.participationLevel * 100)
  const interpretacionParticipacion = getInterpretacionParticipacion(porcentajeParticipacion)
  const nivelColor = result.participationNeeds ? '#A32D2D' : '#166534'

  const datosGrafico = result.dimensions.map(dim => ({
    label: dim.label.substring(0, 12),
    value: dim.p2 * 100,
    intensidad: dim.intensityLabel
  }))

  return (
    <div className="min-h-screen" style={{ background: 'white' }}>
      <style>{printStyles}</style>
      
      {/* Barra superior - no imprimible */}
      <div className="sticky top-0 z-20 border-b px-6 py-3 flex items-center gap-3 flex-wrap no-print" style={{ background: 'white', borderColor: '#e5e5e0' }}>
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#9ca3af' }}>PECA</span>
        <div className="flex-1" />
        <button
          onClick={() => window.print()}
          className="text-xs font-medium px-3 py-1.5 rounded-lg border"
          style={{ color: '#4b5563', borderColor: '#e5e5e0' }}
        >
          Imprimir
        </button>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-4 py-2 rounded-lg text-sm transition-colors"
          style={{ background: '#e5e5e0', color: '#4b5563' }}
        >
          Volver al dashboard
        </button>
      </div>

      {/* Contenido del informe */}
      <div className="reporte-container max-w-4xl mx-auto px-6 py-8" style={{ fontFamily: 'Georgia, Times New Roman, serif', background: 'white' }}>
        
        {/* Header con logo y datos del paciente */}
        <ReporteHeader
          patientName={patientName}
          patientRut={patientRut}
          patientBirthDate={patientBirthDate}
          patientAge={patientAge}
          patientSchool={patientSchool}
          evalDate={evalDate}
          testName="PECA - Prueba de Evaluación de Conducta Adaptativa"
        />

        {/* Nivel de participación */}
        <div className="mb-6" style={{ pageBreakInside: 'avoid' }}>
          <div className="border-b border-gray-300 pb-2 mb-3">
            <h2 className="text-lg font-semibold uppercase tracking-wide" style={{ color: '#1a1a1a' }}>Participación general</h2>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-6 mb-3">
            <div className="text-center sm:text-left">
              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-bold" style={{ fontFamily: 'Georgia, Times New Roman, serif', color: nivelColor }}>
                  {porcentajeParticipacion}%
                </span>
                <div>
                  <div className="text-sm font-semibold" style={{ color: nivelColor }}>
                    {interpretacionParticipacion.nivel}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex h-2 rounded-full overflow-hidden">
                {[
                  { color: '#A32D2D', label: 'Muy bajo' },
                  { color: '#854F0B', label: 'Bajo' },
                  { color: '#639922', label: 'Medio' },
                  { color: '#3B6D11', label: 'Alto' },
                ].map((range) => (
                  <div key={range.label} className="flex-1" style={{ background: `${range.color}30` }} />
                ))}
              </div>
              <div className="relative mt-1">
                <div className="absolute w-3 h-3 rounded-full border-2 border-white shadow -translate-x-1/2"
                  style={{ left: `${Math.min(porcentajeParticipacion, 99)}%`, top: 0, background: nivelColor }} />
              </div>
              <div className="flex justify-between text-[10px] mt-4" style={{ color: '#9ca3af' }}>
                <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
              </div>
            </div>
          </div>
          <p className="text-sm leading-relaxed mb-3" style={{ color: '#4b5563' }}>{interpretacionParticipacion.descripcion}</p>
          <p className="text-sm font-medium" style={{ color: nivelColor }}>Recomendación: {interpretacionParticipacion.recomendacion}</p>
        </div>

        {/* Gráfico de barras de dimensiones */}
        <div className="mb-6" style={{ pageBreakInside: 'avoid' }}>
          <div className="border-b border-gray-300 pb-2 mb-3">
            <h2 className="text-lg font-semibold uppercase tracking-wide" style={{ color: '#1a1a1a' }}>Perfil de Dimensiones Adaptativas</h2>
          </div>
          <GraficoBarrasDimensiones data={datosGrafico} />
        </div>

        {/* Interpretación de dimensiones - con salto de página antes */}
        <div className="mb-6" style={{ pageBreakBefore: 'avoid', pageBreakInside: 'avoid' }}>
          <div className="border-b border-gray-300 pb-2 mb-3">
            <h2 className="text-lg font-semibold uppercase tracking-wide" style={{ color: '#1a1a1a' }}>Interpretación de Dimensiones</h2>
          </div>
          <div className="space-y-4">
            {result.dimensions.map((dim) => (
              <div key={dim.code} className="pb-3" style={{ pageBreakInside: 'avoid' }}>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-md font-semibold" style={{ color: '#1a1a1a' }}>{dim.label}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ 
                    background: `${getIntensityColor(dim.intensityLabel)}20`,
                    color: getIntensityColor(dim.intensityLabel)
                  }}>
                    {dim.intensityLabel}
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden mb-2" style={{ background: '#e5e5e0' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${dim.p2 * 100}%`, background: getIntensityColor(dim.intensityLabel) }} />
                </div>
                <p className="text-sm leading-relaxed" style={{ color: '#4b5563' }}>
                  {getInterpretacionDimension(dim.code, dim.p2, dim.intensityLabel)}
                </p>
                <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>
                  {dim.itemsAnswered}/{dim.itemsTotal} ítems · Puntaje: {Math.round(dim.rawScore * 10) / 10}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Conjuntos AAMR */}
        <div className="mb-6" style={{ pageBreakInside: 'avoid' }}>
          <div className="border-b border-gray-300 pb-2 mb-3">
            <h2 className="text-lg font-semibold uppercase tracking-wide" style={{ color: '#1a1a1a' }}>Conjuntos AAMR</h2>
          </div>
          <div className="space-y-4">
            {result.aamrSets.map((set) => (
              <div key={set.code} className="pb-3" style={{ pageBreakInside: 'avoid' }}>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-md font-semibold" style={{ color: '#1a1a1a' }}>{set.label}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ 
                    background: set.needsSupport ? '#FEF3C7' : '#D1FAE5',
                    color: set.needsSupport ? '#92400E' : '#065F46'
                  }}>
                    {set.demandLabel}
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden mb-2" style={{ background: '#e5e5e0' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${set.p2 * 100}%`, background: set.needsSupport ? '#F59E0B' : '#10B981' }} />
                </div>
                <p className="text-sm leading-relaxed" style={{ color: '#4b5563' }}>{set.descriptionText}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Conclusión general */}
        <div className="mb-6" style={{ pageBreakInside: 'avoid' }}>
          <div className="border-b border-gray-300 pb-2 mb-3">
            <h2 className="text-lg font-semibold uppercase tracking-wide" style={{ color: '#1a1a1a' }}>Conclusión y Recomendaciones</h2>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: '#4b5563', textAlign: 'justify' }}>
            {getConclusionGeneral(result, patientName)}
          </p>
        </div>

        {/* Footer con firma e isotipo */}
        <ReporteFooter showFirma={true} />
      </div>
    </div>
  )
}

export default function PecaResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <PecaResultsPageInner />
    </Suspense>
  )
}