'use client'
// app/resultados/wisc5/page.tsx
// Versión final con todas las correcciones solicitadas:
// - Título: "Informe de Evaluación de Funcionamiento Cognitivo"
// - Interpretaciones de subpruebas ampliadas
// - Recomendaciones en párrafo
// - Gráficos con etiquetas en el eje X
// - Corrección de plan Premium para mostrar DOCX y ODT

import { useEffect, useState, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { PdfDownloadButton } from '@/components/PdfDownloadButton'
import { ReporteHeader } from '@/components/ReporteHeader'
import { ReporteFooter } from '@/components/ReporteFooter'
import { useReportDocx } from '@/hooks/useReportDocx'

// ============================================================
// TIPOS (agregado para mayor seguridad)
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
// GRÁFICO DE BARRAS (mejorado: etiquetas en el eje X)
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
        paddingBottom: '5px',
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
                marginBottom: '2px',
                borderRadius: '2px 2px 0 0',
              }} />
              <div style={{ fontSize: '7px', fontWeight: 'normal', fontFamily: 'Georgia, Times New Roman, serif', marginTop: '2px' }}>
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
// MARCO INTERPRETATIVO PARA SUBPRUEBAS (ampliado)
// ============================================================

const SUBTEST_INTERPRETATIONS: Record<string, { Bajo: string; Suficiente: string; Alto: string }> = {
  CC: {
    Bajo: 'Existe confusión o extravío en el mapeo visual de superficies y su división en coordenadas, lo que afecta la coordinación entre representación, percepción y movimiento. Suele presentar dificultades para reproducir modelos a partir de estímulos visuales, con errores de rotación o inversión, y requiere apoyo externo o ensayo-error constante.',
    Suficiente: 'Nivel suficiente: logra reproducir los modelos con precisión aceptable, aunque puede mostrar alguna lentitud o mínimos errores en patrones complejos. La coordinación visomotora es adecuada para tareas cotidianas.',
    Alto: 'Desempeño notable: demuestra una capacidad excepcional para analizar y replicar estructuras geométricas, con rapidez y precisión. Maneja con soltura la rotación mental y la segmentación de superficies.'
  },
  AN: {
    Bajo: 'Presenta dificultades significativas para identificar relaciones semánticas entre conceptos, mostrando escasa capacidad de síntesis y abstracción. Suele responder con asociaciones concretas o tangenciales, y requiere apoyos visuales o ejemplos para establecer comparaciones.',
    Suficiente: 'Capacidad suficiente: identifica relaciones lógicas entre conceptos de uso común y puede establecer categorías básicas. Su pensamiento abstracto está en desarrollo y le permite resolver analogías simples con cierta fluidez.',
    Alto: 'Alto rendimiento: demuestra un pensamiento abstracto refinado, captando relaciones complejas y sutiles entre conceptos. Su razonamiento analógico es rápido, preciso y enriquece su discurso con comparaciones elaboradas.'
  },
  MR: {
    Bajo: 'Confusión en la identificación de secuencias y series, así como en la ilación de elementos en ejes de sentido. Falla al percibir patrones de cambio (tamaño, color, orientación) y tiende a responder al azar o por ensayo-error sin estrategia.',
    Suficiente: 'Manejo suficiente: reconoce patrones visuales y secuencias lógicas en matrices de dificultad moderada. Puede resolver la mayoría de los ítems, aunque con lentitud o dudas en los más complejos.',
    Alto: 'Alto desarrollo: identifica con rapidez y precisión las reglas subyacentes en matrices complejas, incluso con múltiples atributos. Su razonamiento inductivo es muy eficiente.'
  },
  RD: {
    Bajo: 'Confusión o bloqueo en el uso de la memoria de trabajo, con dificultades para retener y manipular secuencias numéricas. Muestra pérdida de información en tareas de atención sostenida y se ve superado fácilmente por la longitud de los estímulos.',
    Suficiente: 'Manejo suficiente: retiene y ordena dígitos en orden directo e inverso con un desempeño acorde a su edad. Aunque puede cometer algún error en secuencias largas, mantiene una estrategia eficaz de repaso.',
    Alto: 'Alto desempeño: exhibe una memoria de trabajo excepcional, manejando secuencias largas con precisión y sin esfuerzo. Además, es capaz de reorganizar la información mentalmente con gran agilidad.'
  },
  CLA: {
    Bajo: 'Desmedro significativo en la velocidad de operatoria mental, lo que repercute en la coordinación visomotora y en la rapidez para procesar estímulos simples. Puede presentar lentitud motriz o fatiga precoz, afectando el número de ítems completados.',
    Suficiente: 'Desempeño suficiente: velocidad de procesamiento adecuada para la edad, completando la tarea en un tiempo razonable y con pocos errores. Mantiene un ritmo constante durante toda la prueba.',
    Alto: 'Manejo notable: gran rapidez y precisión en la copia de símbolos, con una excelente coordinación ojo-mano. Su velocidad de procesamiento está por encima de la media, lo que le permite realizar tareas rutinarias con eficiencia.'
  },
  VOC: {
    Bajo: 'Bloqueo o desinterés en el manejo del repertorio léxico y semántico del medio cultural. Dificultad para definir palabras o para encontrar el término exacto, con discurso telegráfico o impreciso. Muestra poca riqueza expresiva.',
    Suficiente: 'Manejo suficiente: posee un vocabulario funcional para la comunicación diaria, define palabras comunes con precisión y comprende el significado de términos abstractos básicos. Su discurso es coherente y fluido.',
    Alto: 'Alto nivel: dominio léxico amplio y preciso, con capacidad para definir términos complejos y utilizar un lenguaje rico en matices. Su discurso es elaborado, con buen uso de sinónimos y estructuras gramaticales avanzadas.'
  },
  BAL: {
    Bajo: 'Dificultades significativas en la percepción visual de relaciones de equilibrio y equivalencia, con tendencia a saturarse perceptivamente ante estímulos que requieren comparación de pesos. Errores frecuentes al juzgar si dos conjuntos son equivalentes.',
    Suficiente: 'Rendimiento suficiente: percibe correctamente relaciones de equilibrio en la mayoría de los ítems, aunque puede dudar en los que requieren mayor razonamiento cuantitativo. No presenta saturación perceptiva relevante.',
    Alto: 'Manejo notable: percepción visual muy aguda para relaciones de equivalencia, resuelve con rapidez y precisión, incluso en configuraciones complejas. Muestra una excelente comprensión de la conservación de la masa.'
  },
  RV: {
    Bajo: 'Confusión o extravío en la división y rearticulación geométrica regular e irregular de elementos visuales. Dificultad para descomponer mentalmente figuras y volver a ensamblarlas, con errores de orientación o traslape.',
    Suficiente: 'Nivel suficiente: es capaz de segmentar y recomponer figuras geométricas de complejidad moderada, aunque puede necesitar más tiempo o ensayos en ítems difíciles. Su razonamiento espacial es adecuado.',
    Alto: 'Manejo notable: gran habilidad para analizar y reconstruir mentalmente figuras, incluso con formas irregulares. Su razonamiento visoespacial es rápido y preciso, destacando en tareas de rotación y traslación.'
  },
  RI: {
    Bajo: 'Presenta dificultades para retener y reconocer estímulos visuales complejos después de una breve exposición. Muestra olvidos frecuentes, confusión entre distractores y baja capacidad de almacenamiento visual a corto plazo.',
    Suficiente: 'Desempeño suficiente: recuerda correctamente la mayoría de las imágenes presentadas, con un reconocimiento acorde a su edad. Puede fallar en algunos detalles, pero en general mantiene una memoria visual funcional.',
    Alto: 'Alta capacidad: demuestra una memoria visual excepcional, reteniendo detalles finos y distinguiendo con precisión entre estímulos similares. Su almacenamiento visual es rápido y duradero.'
  },
  BS: {
    Bajo: 'Dificultades en la velocidad de operatoria mental, la agudeza y organización de búsqueda, y la concentración en tareas de esfuerzo visual. Tiende a perderse entre distractores, con alto número de omisiones o errores.',
    Suficiente: 'Desempeño suficiente: realiza la búsqueda de símbolos con velocidad y precisión adecuadas para su edad, aunque puede disminuir el ritmo en ítems más largos. Mantiene una buena atención visual.',
    Alto: 'Notable desarrollo: altísima velocidad y precisión en la búsqueda, con una organización visual muy eficiente. Su capacidad de atención sostenida es sobresaliente, completando la tarea con pocos errores.'
  },
  IN: {
    Bajo: 'Bloqueo o desinterés en el acceso a la información del medio cultural amplio. Muestra lagunas en conocimientos generales básicos, con respuestas evasivas o "no sé" frecuentes.',
    Suficiente: 'Nivel suficiente: posee un bagaje de conocimientos generales acorde a su edad y entorno, respondiendo correctamente a preguntas de cultura general sin dificultad.',
    Alto: 'Alto nivel: demuestra una gran curiosidad y un amplio repertorio de información cultural, respondiendo con precisión y detalles a preguntas complejas. Su memoria a largo plazo para hechos es excelente.'
  },
  SLN: {
    Bajo: 'Dificultad para alternar entre categorías (letras y números) y para retener el orden secuencial. Muestra confusión al reorganizar la información, con errores de omisión o inversión.',
    Suficiente: 'Manejo suficiente: logra ordenar correctamente secuencias mixtas de letras y números en tareas de dificultad media, aunque puede necesitar más tiempo en las más largas.',
    Alto: 'Alto rendimiento: ejecuta con rapidez y sin errores la reorganización de secuencias alfanuméricas, demostrando una excelente flexibilidad cognitiva y memoria de trabajo.'
  },
  CAN: {
    Bajo: 'Dificultad para mantener la atención selectiva y para escanear estímulos visuales de forma organizada. Omite muchos blancos o comete errores por impulsividad, con baja velocidad de procesamiento.',
    Suficiente: 'Desempeño suficiente: realiza la tarea de cancelación con un nivel de atención y organización adecuado, aunque puede tener algún error en estímulos muy densos.',
    Alto: 'Alta precisión: mantiene una atención selectiva sobresaliente, escaneando rápidamente y marcando todos los blancos sin errores. Su control inhibitorio es muy eficaz.'
  },
  COM: {
    Bajo: 'Poca densidad en la habilidad de análisis, la reflexividad y la descripción detallada de elementos complejos. Responde de manera superficial o con respuestas concretas, sin profundizar en causas o implicaciones.',
    Suficiente: 'Nivel suficiente: comprende y explica situaciones sociales o conceptuales con un grado de detalle adecuado, mostrando capacidad de análisis moderada y reflexiva.',
    Alto: 'Alto desarrollo: demuestra un pensamiento crítico refinado, con análisis detallado de situaciones complejas, identificando múltiples perspectivas y consecuencias. Su discurso es reflexivo y rico en matices.'
  },
  ARI: {
    Bajo: 'Dificultades en el cálculo mental inmediato y en el espacio disponible en la memoria de trabajo. Comete errores por pérdida de información intermedia o por falta de estrategias de cálculo.',
    Suficiente: 'Desempeño suficiente: resuelve problemas aritméticos mentales con precisión en un tiempo razonable, utilizando estrategias básicas y manteniendo la información en memoria de trabajo.',
    Alto: 'Notable manejo: realiza cálculos mentales complejos con gran rapidez y exactitud, demostrando un excelente uso de la memoria de trabajo y un razonamiento cuantitativo muy desarrollado.'
  }
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

        setData(wiscData as Wisc5Data)

        // 3. Obtener plan del usuario (CORREGIDO: extraer primer elemento si es array)
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: planData } = await supabase.rpc('get_plan_status', { p_user_id: user.id })
          // La RPC devuelve un array con un solo objeto
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

  // Handlers para descarga DOCX/ODT
  const handleDownload = (type: 'docx' | 'odt') => {
    if (!data) return
    const meta = {
      sessionId,
      patientId,
      testId: 'wisc5',
      patientName,
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
      score: pe as number,
    }))
    .sort((a, b) => a.label.localeCompare(b.label))

  // Función para obtener la interpretación de una subprueba
  function getSubtestInterpretation(code: string, pe: number): string {
    const entry = SUBTEST_INTERPRETATIONS[code]
    if (!entry) return 'No disponible.'
    if (pe >= 12) return entry.Alto
    if (pe >= 8) return entry.Suficiente
    return entry.Bajo
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
          testName="Informe de Evaluación de Funcionamiento Cognitivo"
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
                (Rango {compositeScores.CIT.score - 15} – {compositeScores.CIT.score + 15}, Percentil {compositeScores.CIT.percentile}).
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

          {/* Descripción cualitativa de subpruebas (ampliada) */}
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

        {/* RECOMENDACIONES (en párrafo fluido) */}
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