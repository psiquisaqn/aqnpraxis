'use client'
// app/resultados/wisc5/page.tsx
// Versión elegante con:
// - Fondo blanco, tipografía Georgia
// - Logo y firma configurables
// - Datos completos del paciente (RUT, edad, fecha nacimiento, colegio)
// - Saltos de página controlados
// - Botón Imprimir y Guardar PDF
// - Gráfico de barras para índices compuestos
// - Interpretación completa del WISC-V

import { useEffect, useState, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { PdfDownloadButton } from '@/components/PdfDownloadButton'
import { ReporteHeader } from '@/components/ReporteHeader'
import { ReporteFooter } from '@/components/ReporteFooter'

// Estilos para impresión (mismos que PECA)
const printStyles = `
  @media print {
    body { margin: 0; padding: 0; background: white; }
    .no-print { display: none; }
    .reporte-container { padding: 1.5cm; width: 100%; }
    .page-break-before { page-break-before: always; }
    .page-break-inside { page-break-inside: avoid; }
    h2, h3, .grafico-barras-container { page-break-inside: avoid; }
  }
`

// ============================================================
// FUNCIONES DE CLASIFICACIÓN (CHILENAS)
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
// GRÁFICO DE BARRAS PARA ÍNDICES COMPUESTOS
// ============================================================

function GraficoBarrasIndices({ data }: { data: Array<{ label: string; score: number; classification: string }> }) {
  const maxVal = 160
  const minVal = 40

  return (
    <div className="grafico-barras-container" style={{ margin: '20px 0', fontFamily: 'Georgia, Times New Roman, serif', pageBreakInside: 'avoid' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'flex-end', 
        minHeight: '220px',
        borderBottom: '1px solid #333',
        borderLeft: '1px solid #333',
        paddingLeft: '10px',
        paddingBottom: '10px',
        gap: '8px',
        flexWrap: 'wrap'
      }}>
        {data.map((item, idx) => {
          const alturaRelativa = ((item.score - minVal) / (maxVal - minVal)) * 160
          const color = getColorForScore(item.score)
          const isCIT = item.label === 'CIT'
          
          return (
            <div key={idx} style={{ textAlign: 'center', width: '60px' }}>
              <div style={{ 
                backgroundColor: color, 
                width: '36px', 
                margin: '0 auto', 
                height: `${Math.max(alturaRelativa, 4)}px`,
                marginBottom: '6px',
                borderRadius: '2px 2px 0 0',
                opacity: isCIT ? 1 : 0.85,
                border: isCIT ? '2px solid #1E3A5F' : 'none'
              }} title={`${item.score} - ${item.classification}`} />
              <div style={{ fontSize: '8px', fontWeight: isCIT ? 'bold' : 'normal', fontFamily: 'Georgia, Times New Roman, serif' }}>
                {item.label}
              </div>
              <div style={{ fontSize: '9px', color: color, marginTop: '1px', fontWeight: 'bold' }}>
                {item.score}
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '7px', color: '#9ca3af', padding: '0 10px' }}>
        <span>40</span>
        <span>70</span>
        <span>90</span>
        <span>110</span>
        <span>130</span>
        <span>160</span>
      </div>
    </div>
  )
}

// ============================================================
// INTERPRETACIONES
// ============================================================

function getInterpretacionCIT(score: number): string {
  if (score >= 130) return 'Capacidades excepcionales; alta eficiencia para resolver problemas complejos. El evaluado presenta un funcionamiento intelectual significativamente superior al promedio, con gran potencial para el aprendizaje y la resolución de problemas novedosos.'
  if (score >= 120) return 'Desempeño significativamente superior a sus pares. Potencial académico elevado y buena capacidad para abordar tareas complejas con autonomía.'
  if (score >= 110) return 'Desempeño por sobre el promedio. Buena base de recursos cognitivos que permite un aprendizaje eficiente y adaptación a demandas académicas moderadas.'
  if (score >= 90) return 'Desarrollo acorde a la norma poblacional. Funcionamiento esperado para la edad, con recursos cognitivos adecuados para el desempeño en la vida diaria y escolar.'
  if (score >= 80) return 'Desempeño levemente inferior al promedio. Puede requerir apoyos puntuales en áreas específicas, pero mantiene un funcionamiento general dentro de lo funcional.'
  if (score >= 70) return 'Debilidad normativa significativa. Riesgo de dificultades en el aprendizaje que requieren intervención temprana y apoyo sistemático.'
  return 'Limitación intelectual severa; requiere evaluación profunda de conducta adaptativa y apoyo integral.'
}

function getInterpretacionIndice(code: string, score: number): string {
  const base = {
    ICV: 'mide el razonamiento verbal, la formación de conceptos y el conocimiento léxico. Evalúa la capacidad para acceder y utilizar información almacenada en la memoria a largo plazo.',
    IVE: 'evalúa la percepción de detalles visuales, la comprensión de relaciones espaciales y la integración visomotora.',
    IRF: 'mide la capacidad de detectar reglas lógicas y relaciones conceptuales, así como el pensamiento abstracto.',
    IMT: 'evalúa la capacidad de registrar, mantener y manipular información activa en la conciencia.',
    IVP: 'mide la rapidez en identificación visual y toma de decisiones, así como la eficiencia en tareas de rastreo visual.'
  }
  const desc = base[code as keyof typeof base] || ''
  if (score >= 110) return `Rendimiento superior o muy superior, indicando un desarrollo robusto en esta área. ${desc}`
  if (score >= 90) return `Rendimiento dentro del promedio esperado para la edad. ${desc}`
  return `Rendimiento por debajo del promedio, sugiriendo debilidades en este dominio cognitivo. ${desc}`
}

function getSubtestDescription(code: string, pe: number): string {
  const desc: Record<string, Record<string, string>> = {
    AN: { Bajo: 'Dificultades en la identificación de clases y en la síntesis de conceptos.', Suficiente: 'Nivel suficiente de desarrollo de la identificación de clases y la síntesis de conceptos.', Alto: 'Alto rendimiento en la identificación de clases y la síntesis de conceptos.' },
    VOC: { Bajo: 'Bloqueo o desinterés en el manejo del repertorio léxico y semántico.', Suficiente: 'Manejo suficiente del repertorio léxico y semántico.', Alto: 'Alto nivel de manejo del repertorio léxico y semántico.' },
    IN: { Bajo: 'Bloqueo o desinterés en el acceso a la información del medio cultural amplio.', Suficiente: 'Nivel suficiente de acceso a la información del medio cultural amplio.', Alto: 'Alto nivel de acceso a la información del medio cultural amplio.' },
    COM: { Bajo: 'Poca densidad en la habilidad de análisis, reflexividad y descripción detallada.', Suficiente: 'Nivel suficiente de densidad en la habilidad de análisis, reflexividad y descripción detallada.', Alto: 'Alto nivel de desarrollo de la densidad en la habilidad de análisis, reflexividad y descripción detallada.' },
    CC: { Bajo: 'Confusión o extravío en el mapeo visual de superficies y su división en coordenadas.', Suficiente: 'Nivel suficiente de desarrollo en el mapeo visual de superficies y su división en coordenadas.', Alto: 'Notable manejo en el mapeo visual de superficies y su división en coordenadas.' },
    RV: { Bajo: 'Confusión o extravío en la división y rearticulación geométrica regular e irregular de elementos visuales.', Suficiente: 'Nivel suficiente de desarrollo en la división y rearticulación geométrica regular e irregular de elementos visuales.', Alto: 'Notable manejo en la división y rearticulación geométrica regular e irregular de elementos visuales.' },
    MR: { Bajo: 'Confusión o extravío en la identificación de secuencias y series, así como en la ilación de elementos en ejes de sentido.', Suficiente: 'Manejo suficiente en la identificación de secuencias y series.', Alto: 'Alto nivel de desarrollo en la identificación de secuencias y series.' },
    BAL: { Bajo: 'Dificultades significativas en la percepción visual de relaciones de equilibrio y equivalencia.', Suficiente: 'Rendimiento suficiente en la percepción visual de relaciones de equilibrio y equivalencia.', Alto: 'Notable manejo en la percepción visual de relaciones de equilibrio y equivalencia.' },
    ARI: { Bajo: 'Dificultades en el cálculo mental inmediato y en el espacio disponible en la memoria de trabajo.', Suficiente: 'Desempeño suficiente en el cálculo mental inmediato y en el espacio disponible en la memoria de trabajo.', Alto: 'Notable manejo en el cálculo mental inmediato y en el espacio disponible en la memoria de trabajo.' },
    RD: { Bajo: 'Confusión o bloqueo en el uso de la memoria de trabajo, con dificultades para aprovechar el total de su espacio disponible.', Suficiente: 'Manejo suficiente en el uso de la memoria de trabajo.', Alto: 'Alto nivel de desempeño en el uso de la memoria de trabajo.' },
    RI: { Bajo: 'Dificultades en la memoria visual de corto plazo, con interferencia visual y baja capacidad de registro.', Suficiente: 'Capacidad suficiente de registro visual y reconocimiento.', Alto: 'Excelente capacidad de registro visual y reconocimiento, con buena resistencia a la interferencia.' },
    SLN: { Bajo: 'Fallas en la flexibilidad cognitiva auditiva y en la manipulación mental compleja de estímulos auditivos.', Suficiente: 'Desempeño adecuado en el procesamiento secuencial y manipulación mental de estímulos auditivos.', Alto: 'Muy buena capacidad de procesamiento secuencial y flexibilidad cognitiva auditiva.' },
    CLA: { Bajo: 'Desmedro de la velocidad de la operatoria mental, influyendo en la coordinación entre representación, percepción y movimiento.', Suficiente: 'Desempeño suficiente en la velocidad de la operatoria mental.', Alto: 'Notable manejo en la velocidad de la operatoria mental.' },
    BS: { Bajo: 'Dificultades en la velocidad de la operatoria mental, la agudeza y organización de búsqueda y la concentración en tareas de esfuerzo visual.', Suficiente: 'Desempeño suficiente en la velocidad de la operatoria mental y agudeza de búsqueda.', Alto: 'Notable desarrollo en la velocidad de la operatoria mental y organización de búsqueda.' },
    CAN: { Bajo: 'Dificultades de inhibición de respuesta o descontrol gráfico, afectando la atención selectiva y vigilancia visual.', Suficiente: 'Atención selectiva y vigilancia visual adecuadas.', Alto: 'Excelente atención selectiva, con rápida identificación de estímulos relevantes en ambientes estructurados y aleatorios.' }
  }
  const nivel = pe >= 12 ? 'Alto' : pe >= 8 ? 'Suficiente' : 'Bajo'
  return desc[code]?.[nivel] || 'No disponible'
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
  const [data, setData] = useState<any>(null)
  const [patientName, setPatientName] = useState('')
  const [patientId, setPatientId] = useState('')
  const [patientRut, setPatientRut] = useState('')
  const [patientBirthDate, setPatientBirthDate] = useState('')
  const [patientAge, setPatientAge] = useState<number | undefined>(undefined)
  const [patientSchool, setPatientSchool] = useState('')
  const [evalDate, setEvalDate] = useState('')

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

        setData(wiscData)
        setLoading(false)
      } catch (err: any) {
        setError(err.message)
        setLoading(false)
      }
    }

    load()
  }, [sessionId])

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
          <button onClick={() => router.back()} className="text-sm" style={{ color: '#4a4a4a' }}>← Volver</button>
        </div>
      </div>
    )
  }

  const scaledScores = data.scaled_scores || {}
  const compositeScores = data.composite_scores || {}
  const rawScores = data.raw_scores || {}

  const indexes: Record<string, any> = {}
  for (const code of ['ICV', 'IVE', 'IRF', 'IMT', 'IVP', 'CIT']) {
    if (compositeScores[code]) indexes[code] = compositeScores[code]
  }

  // Datos para el gráfico
  const datosGrafico = ['ICV', 'IVE', 'IRF', 'IMT', 'IVP', 'CIT'].map(code => {
    const idx = indexes[code]
    return {
      label: code,
      score: idx?.score ?? 0,
      classification: idx?.classification ?? ''
    }
  }).filter(d => d.score > 0)

  // Subpruebas primarias y secundarias
  const primaryCodes = ['CC', 'AN', 'MR', 'RD', 'CLA', 'VOC', 'BAL']
  const secondaryCodes = ['RV', 'RI', 'BS', 'IN', 'SLN', 'CAN', 'COM', 'ARI']

  const SUBTEST_LABELS: Record<string, string> = {
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

  const INDEX_LABELS: Record<string, string> = {
    ICV: 'Comprensión Verbal',
    IVE: 'Visoespacial',
    IRF: 'Razonamiento Fluido',
    IMT: 'Memoria de Trabajo',
    IVP: 'Velocidad de Procesamiento',
    CIT: 'Coeficiente Intelectual Total'
  }

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
            sessionId: sessionId,
            patientId,
            testId: 'wisc5',
            patientName: patientName,
            content: { indexes, scaledScores, reportType }
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
          testName="WISC-V - Escala de Inteligencia de Wechsler para Niños"
        />

        {/* Gráfico de índices */}
        {datosGrafico.length > 0 && (
          <div className="mb-6" style={{ pageBreakInside: 'avoid' }}>
            <div className="border-b border-gray-300 pb-2 mb-3">
              <h2 className="text-lg font-semibold uppercase tracking-wide" style={{ color: '#1a1a1a' }}>Perfil de Índices Compuestos</h2>
            </div>
            <GraficoBarrasIndices data={datosGrafico} />
          </div>
        )}

        {/* Tabla de Índices Compuestos */}
        <div className="mb-6" style={{ pageBreakInside: 'avoid' }}>
          <div className="border-b border-gray-300 pb-2 mb-3">
            <h2 className="text-lg font-semibold uppercase tracking-wide" style={{ color: '#1a1a1a' }}>Índices Compuestos</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 font-semibold" style={{ color: '#1a1a1a' }}>Índice</th>
                  <th className="text-center py-2 px-2 font-semibold" style={{ color: '#1a1a1a' }}>Puntaje</th>
                  <th className="text-center py-2 px-2 font-semibold" style={{ color: '#1a1a1a' }}>Percentil</th>
                  <th className="text-center py-2 px-2 font-semibold" style={{ color: '#1a1a1a' }}>Clasificación</th>
                </tr>
              </thead>
              <tbody>
                {['ICV', 'IVE', 'IRF', 'IMT', 'IVP', 'CIT'].map(code => {
                  const idx = indexes[code]
                  if (!idx) return null
                  return (
                    <tr key={code} className={`border-b border-gray-100 ${code === 'CIT' ? 'bg-gray-50' : ''}`}>
                      <td className="py-2 px-2 font-medium" style={{ color: code === 'CIT' ? '#1E3A5F' : '#1a1a1a' }}>
                        {INDEX_LABELS[code]}
                      </td>
                      <td className="py-2 px-2 text-center font-mono font-bold">{idx.score}</td>
                      <td className="py-2 px-2 text-center">{idx.percentile}</td>
                      <td className="py-2 px-2 text-center">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{
                          background: `${getColorForScore(idx.score)}20`,
                          color: getColorForScore(idx.score)
                        }}>
                          {getClassification(idx.score)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Interpretación del CIT */}
        {indexes.CIT && (
          <div className="mb-6" style={{ pageBreakInside: 'avoid' }}>
            <div className="border-b border-gray-300 pb-2 mb-3">
              <h2 className="text-lg font-semibold uppercase tracking-wide" style={{ color: '#1a1a1a' }}>Interpretación del CIT</h2>
            </div>
            <p className="text-sm leading-relaxed text-justify" style={{ color: '#4b5563' }}>
              El Coeficiente Intelectual Total (CIT) obtenido es de <strong>{indexes.CIT.score}</strong>, lo que se clasifica como <strong>{getClassification(indexes.CIT.score)}</strong> y se ubica en el percentil <strong>{indexes.CIT.percentile}</strong>.
              {' '}{getInterpretacionCIT(indexes.CIT.score)}
            </p>
          </div>
        )}

        {/* Interpretación de Índices */}
        <div className="mb-6" style={{ pageBreakInside: 'avoid' }}>
          <div className="border-b border-gray-300 pb-2 mb-3">
            <h2 className="text-lg font-semibold uppercase tracking-wide" style={{ color: '#1a1a1a' }}>Interpretación de Índices</h2>
          </div>
          {['ICV', 'IVE', 'IRF', 'IMT', 'IVP'].map(code => {
            const idx = indexes[code]
            if (!idx) return null
            return (
              <div key={code} className="mb-3">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-md font-semibold" style={{ color: '#1a1a1a' }}>{INDEX_LABELS[code]}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{
                    background: `${getColorForScore(idx.score)}20`,
                    color: getColorForScore(idx.score)
                  }}>
                    {idx.score} · {getClassification(idx.score)}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-justify" style={{ color: '#4b5563' }}>
                  {getInterpretacionIndice(code, idx.score)}
                </p>
              </div>
            )
          })}
        </div>

        {/* Tabla de Subpruebas - salto de página antes */}
        <div className="mb-6" style={{ pageBreakBefore: 'always', pageBreakInside: 'avoid' }}>
          <div className="border-b border-gray-300 pb-2 mb-3">
            <h2 className="text-lg font-semibold uppercase tracking-wide" style={{ color: '#1a1a1a' }}>Puntajes por Subprueba</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 font-semibold" style={{ color: '#1a1a1a' }}>Subprueba</th>
                  <th className="text-center py-2 px-2 font-semibold" style={{ color: '#1a1a1a' }}>Bruto</th>
                  <th className="text-center py-2 px-2 font-semibold" style={{ color: '#1a1a1a' }}>Escala (PE)</th>
                  <th className="text-center py-2 px-2 font-semibold" style={{ color: '#1a1a1a' }}>Clasificación</th>
                </tr>
              </thead>
              <tbody>
                {[...primaryCodes, ...secondaryCodes].map(code => {
                  const pe = scaledScores[code]
                  const raw = rawScores[code]
                  if (pe == null && raw == null) return null
                  return (
                    <tr key={code} className="border-b border-gray-100">
                      <td className="py-2 px-2">{SUBTEST_LABELS[code] || code}</td>
                      <td className="py-2 px-2 text-center">{raw != null ? raw : '-'}</td>
                      <td className="py-2 px-2 text-center font-mono font-bold">{pe != null ? pe : '-'}</td>
                      <td className="py-2 px-2 text-center">
                        {pe != null ? (
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{
                            background: `${getColorForScore(pe, true)}20`,
                            color: getColorForScore(pe, true)
                          }}>
                            {getScaledClassification(pe)}
                          </span>
                        ) : '-'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Interpretación de Subpruebas */}
        <div className="mb-6" style={{ pageBreakInside: 'avoid' }}>
          <div className="border-b border-gray-300 pb-2 mb-3">
            <h2 className="text-lg font-semibold uppercase tracking-wide" style={{ color: '#1a1a1a' }}>Interpretación de Subpruebas</h2>
          </div>
          <div className="space-y-3">
            {[...primaryCodes, ...secondaryCodes].map(code => {
              const pe = scaledScores[code]
              if (pe == null) return null
              return (
                <div key={code} className="pb-2" style={{ pageBreakInside: 'avoid' }}>
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-sm font-semibold" style={{ color: '#1a1a1a' }}>{SUBTEST_LABELS[code] || code}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{
                      background: `${getColorForScore(pe, true)}20`,
                      color: getColorForScore(pe, true)
                    }}>
                      PE {pe}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-justify" style={{ color: '#4b5563' }}>
                    {getSubtestDescription(code, pe)}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Conclusión y Recomendaciones */}
        <div className="mb-6" style={{ pageBreakBefore: 'always', pageBreakInside: 'avoid' }}>
          <div className="border-b border-gray-300 pb-2 mb-3">
            <h2 className="text-lg font-semibold uppercase tracking-wide" style={{ color: '#1a1a1a' }}>Conclusión y Recomendaciones</h2>
          </div>
          <p className="text-sm leading-relaxed text-justify mb-3" style={{ color: '#4b5563' }}>
            Basado en los resultados obtenidos en el WISC-V, {patientName || 'el evaluado'} presenta un perfil cognitivo que se caracteriza por:
          </p>
          <ul className="text-sm leading-relaxed list-disc pl-5 space-y-1" style={{ color: '#4b5563' }}>
            <li><strong>Áreas de Fortaleza:</strong> Se sugiere potenciar mediante actividades desafiantes que mantengan el interés y promuevan el desarrollo de habilidades superiores.</li>
            <li><strong>Áreas de Debilidad:</strong> Se recomienda implementar apoyos específicos, como entrenamiento en memoria de trabajo, estrategias de organización visual o reducción de la velocidad de procesamiento en evaluaciones.</li>
            <li><strong>Contexto Educativo:</strong> Adaptar el entorno escolar para reducir la carga cognitiva, proporcionar instrucciones claras y segmentadas, y utilizar materiales visuales que faciliten la comprensión.</li>
            <li><strong>Seguimiento:</strong> Se recomienda una reevaluación en 12–18 meses para monitorear la evolución del perfil cognitivo y ajustar las intervenciones según sea necesario.</li>
          </ul>
          <p className="text-sm leading-relaxed text-justify mt-3" style={{ color: '#4b5563' }}>
            Los resultados deben interpretarse en el contexto de la historia personal, educativa y familiar del evaluado.
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