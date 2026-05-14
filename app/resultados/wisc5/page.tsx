'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { TestResultsLayout } from '@/components/TestResultsLayout'
import { PdfDownloadButton } from '@/components/PdfDownloadButton'

// ============================================================
// CONFIGURACIÓN DE SUBPRUEBAS E ÍNDICES
// ============================================================

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

const INDEX_COMPOSITION: Record<string, { name: string; subtests: string[]; description: string }> = {
  ICV: { name: 'Índice de Comprensión Verbal', subtests: ['AN', 'VOC'], description: 'Evalúa la capacidad de razonamiento verbal, formación de conceptos y conocimiento adquirido.' },
  IVE: { name: 'Índice Visoespacial', subtests: ['CC', 'RV'], description: 'Evalúa la capacidad de razonamiento visoespacial, integración visual y motora.' },
  IRF: { name: 'Índice de Razonamiento Fluido', subtests: ['MR', 'BAL'], description: 'Evalúa la capacidad de razonamiento lógico, resolución de problemas novedosos y pensamiento abstracto.' },
  IMT: { name: 'Índice de Memoria de Trabajo', subtests: ['RD', 'RI'], description: 'Evalúa la capacidad de retención temporal de información y manipulación mental.' },
  IVP: { name: 'Índice de Velocidad de Procesamiento', subtests: ['CLA', 'BS'], description: 'Evalúa la velocidad de procesamiento mental y motor, atención sostenida.' },
  CIT: { name: 'Coeficiente Intelectual Total', subtests: ['CC', 'AN', 'MR', 'RD', 'CLA', 'VOC', 'BAL'], description: 'Estimación global del funcionamiento intelectual general.' }
}

const PRIMARY_SUBTESTS = ['CC', 'AN', 'MR', 'RD', 'CLA', 'VOC', 'BAL']
const SECONDARY_SUBTESTS = ['RV', 'RI', 'BS', 'IN', 'SLN', 'CAN', 'COM', 'ARI']

// ============================================================
// FUNCIONES DE INTERPRETACIÓN
// ============================================================

function getClassification(score: number): string {
  if (score >= 130) return 'Muy superior'
  if (score >= 120) return 'Superior'
  if (score >= 110) return 'Promedio alto'
  if (score >= 90)  return 'Promedio'
  if (score >= 80)  return 'Promedio bajo'
  if (score >= 70)  return 'Limítrofe'
  return 'Extremadamente bajo'
}

function getClassificationColor(score: number): string {
  if (score >= 130) return 'text-purple-700 bg-purple-50'
  if (score >= 120) return 'text-blue-700 bg-blue-50'
  if (score >= 110) return 'text-green-700 bg-green-50'
  if (score >= 90)  return 'text-gray-700 bg-gray-50'
  if (score >= 80)  return 'text-yellow-700 bg-yellow-50'
  if (score >= 70)  return 'text-orange-700 bg-orange-50'
  return 'text-red-700 bg-red-50'
}

function generateInterpretation(indexes: Record<string, any>, scaledScores: Record<string, number>): string[] {
  const interpretations: string[] = []

  if (indexes.CIT) {
    const cit = indexes.CIT
    interpretations.push(`El Coeficiente Intelectual Total (CIT) obtenido es de ${cit.score}, lo que corresponde a una clasificación "${getClassification(cit.score)}" y se ubica en el percentil ${cit.percentile}. Esto indica que el rendimiento intelectual general del evaluado se encuentra en un rango ${getClassification(cit.score).toLowerCase()} en comparación con sus pares de la misma edad.`)
  }

  const indexValues = Object.entries(indexes)
    .filter(([key]) => key !== 'CIT')
    .map(([key, value]: [string, any]) => ({ code: key, name: INDEX_COMPOSITION[key]?.name || key, score: value.score }))
    .filter(v => v.score)

  if (indexValues.length > 0) {
    const scores = indexValues.map(v => v.score)
    const maxScore = Math.max(...scores)
    const minScore = Math.min(...scores)
    const dispersion = maxScore - minScore

    if (dispersion >= 23) {
      interpretations.push(`Se observa una dispersión significativa entre los índices (diferencia de ${dispersion} puntos), lo que sugiere un perfil cognitivo heterogéneo. Se recomienda analizar el rendimiento por dominios específicos en lugar del CIT global.`)
    } else if (dispersion >= 15) {
      interpretations.push(`Existe una dispersión moderada entre los índices (diferencia de ${dispersion} puntos), indicando cierta variabilidad en el perfil cognitivo.`)
    } else {
      interpretations.push(`Los índices muestran un perfil cognitivo relativamente homogéneo, con puntajes que varían dentro de un rango esperado.`)
    }
  }

  if (scaledScores && Object.keys(scaledScores).length > 0) {
    const entries = Object.entries(scaledScores).filter(([_, v]) => v !== undefined && v !== null) as [string, number][]
    if (entries.length > 0) {
      const maxSubtest = entries.reduce((a, b) => a[1] > b[1] ? a : b)
      const minSubtest = entries.reduce((a, b) => a[1] < b[1] ? a : b)
      interpretations.push(`Entre las subpruebas administradas, el mayor rendimiento se observa en ${SUBTEST_LABELS[maxSubtest[0]] || maxSubtest[0]} (PE ${maxSubtest[1]}, "${getClassification(maxSubtest[1])}"), mientras que el menor rendimiento se registra en ${SUBTEST_LABELS[minSubtest[0]] || minSubtest[0]} (PE ${minSubtest[1]}, "${getClassification(minSubtest[1])}").`)
    }
  }

  return interpretations
}

function generateRecommendations(indexes: Record<string, any>, scaledScores: Record<string, number>, patientName: string): string[] {
  const recommendations: string[] = []
  recommendations.push(`Con base en los resultados obtenidos por ${patientName} en la escala WISC-V, se sugieren las siguientes recomendaciones:`)

  if (indexes.CIT) {
    const cit = indexes.CIT.score
    if (cit >= 120) {
      recommendations.push('Dado el alto rendimiento intelectual, se recomienda proporcionar oportunidades de enriquecimiento curricular, actividades de profundización y programas para estudiantes con altas capacidades.')
    } else if (cit >= 90) {
      recommendations.push('Se sugiere continuar con el plan educativo regular, prestando atención a las áreas específicas de mayor y menor rendimiento para optimizar el aprendizaje.')
    } else {
      recommendations.push('Se recomienda implementar un plan de apoyo psicopedagógico individualizado, con adecuaciones curriculares y seguimiento cercano de los avances en las áreas de mayor dificultad.')
    }
  }

  const lowIndexes = Object.entries(indexes).filter(([_, value]: [string, any]) => value.score < 85).map(([key]) => key)
  for (const code of lowIndexes) {
    switch (code) {
      case 'ICV': recommendations.push('Para fortalecer la comprensión verbal: realizar lecturas compartidas, fomentar conversaciones sobre temas variados, enseñar vocabulario nuevo en contexto y practicar la expresión oral de ideas.'); break
      case 'IMT': recommendations.push('Para mejorar la memoria de trabajo: utilizar estrategias de repetición, dividir tareas en pasos más pequeños, usar apoyos visuales y practicar juegos de memoria con números y palabras.'); break
      case 'IVP': recommendations.push('Para potenciar la velocidad de procesamiento: otorgar tiempo adicional en tareas escritas, reducir la cantidad de ejercicios repetitivos y practicar actividades de fluidez.'); break
      case 'IRF': recommendations.push('Para desarrollar el razonamiento fluido: practicar resolución de problemas cotidianos, juegos de lógica, puzzles y actividades que requieran identificar patrones y relaciones.'); break
      case 'IVE': recommendations.push('Para estimular el área visoespacial: realizar actividades de construcción, dibujo, uso de mapas, rompecabezas y juegos que involucren la orientación espacial.'); break
    }
  }

  recommendations.push('Se recomienda realizar un seguimiento del progreso académico y emocional en un plazo de 6 a 12 meses, y considerar una reevaluación si se observan cambios significativos en el rendimiento o en las necesidades del evaluado.')
  return recommendations
}

// ============================================================
// PÁGINA DE RESULTADOS WISC-V
// ============================================================

export default function Wisc5ResultsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session')
  const reportType = searchParams.get('type') || 'brief'
  const contentRef = useRef<HTMLDivElement>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)
  const [patientName, setPatientName] = useState('')
  const [patientId, setPatientId] = useState('')
  const [patientAge, setPatientAge] = useState('')
  const [evalDate, setEvalDate] = useState('')

  useEffect(() => {
    const loadResults = async () => {
      if (!sessionId) { setError('No se especificó una sesión'); setLoading(false); return }

      const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

      try {
        const { data: sessionData, error: sessionError } = await supabase
          .from('sessions').select('*, patients(full_name, birth_date)').eq('id', sessionId).single()

        if (sessionError || !sessionData) { setError('No se encontró la sesión'); setLoading(false); return }

        setPatientName(sessionData.patients?.full_name || 'Paciente')
        setPatientId(sessionData.patient_id || '')
        setEvalDate(sessionData.created_at ? new Date(sessionData.created_at).toLocaleDateString('es-CL') : '')

        if (sessionData.patients?.birth_date) {
          const birth = new Date(sessionData.patients.birth_date)
          const now = new Date()
          let years = now.getFullYear() - birth.getFullYear()
          let months = now.getMonth() - birth.getMonth()
          if (months < 0) { years--; months += 12 }
          setPatientAge(`${years} años, ${months} meses`)
        }

        const { data: wiscData, error: wiscError } = await supabase
          .from('wisc5_scores').select('*').eq('session_id', sessionId).single()

        if (wiscError || !wiscData) { setError('No se encontraron puntajes WISC-V'); setLoading(false); return }

        setData(wiscData)
        setLoading(false)
      } catch (err: any) {
        setError('Error al cargar resultados: ' + err.message)
        setLoading(false)
      }
    }
    loadResults()
  }, [sessionId])

  if (loading) {
    return (
      <TestResultsLayout patientName="..." testName="WISC-V" testCode="wisc5" evalDate="">
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Cargando resultados...</p>
          </div>
        </div>
      </TestResultsLayout>
    )
  }

  if (error || !data) {
    return (
      <TestResultsLayout patientName="Error" testName="WISC-V" testCode="wisc5" evalDate="">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600">{error || 'Error al cargar resultados'}</p>
          <button onClick={() => router.push('/dashboard')} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm">Volver al dashboard</button>
        </div>
      </TestResultsLayout>
    )
  }

  const scaledScores = data.scaled_scores || {}
  const compositeScores = data.composite_scores || {}
  const substitutions = data.substitution_used || null
  const completedSubtests = data.completed_subtests || {}

  const indexes: Record<string, any> = {}
  for (const code of ['ICV', 'IVE', 'IRF', 'IMT', 'IVP', 'CIT']) {
    if (compositeScores[code]) indexes[code] = compositeScores[code]
  }

  const interpretations = generateInterpretation(indexes, scaledScores)
  const recommendations = generateRecommendations(indexes, scaledScores, patientName)

  return (
    <TestResultsLayout
      patientName={patientName}
      patientId={patientId}
      testName="WISC-V"
      testCode="wisc5"
      evalDate={evalDate}
      pdfMeta={{
        sessionId: sessionId || '',
        patientId: patientId,
        testId: 'wisc5',
        patientName: patientName,
        content: { indexes, scaledScores, reportType }
      }}
    >
      <div className="flex justify-end mb-4">
        <PdfDownloadButton
          contentRef={contentRef}
          meta={{
            sessionId: sessionId || '',
            patientId: patientId,
            testId: 'wisc5',
            patientName: patientName,
            content: { indexes, scaledScores, reportType }
          }}
          label="Guardar PDF"
        />
      </div>

      <div ref={contentRef} className="space-y-8">
        {/* Datos del evaluado */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Datos del Evaluado</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-500">Nombre:</span><span className="ml-2 text-gray-800 font-medium">{patientName}</span></div>
            <div><span className="text-gray-500">Edad:</span><span className="ml-2 text-gray-800">{patientAge}</span></div>
            <div><span className="text-gray-500">Fecha de evaluación:</span><span className="ml-2 text-gray-800">{evalDate}</span></div>
            <div><span className="text-gray-500">Tipo de informe:</span><span className="ml-2 text-gray-800">{reportType === 'brief' ? 'Breve (7 subpruebas)' : 'Extendido (15 subpruebas)'}</span></div>
          </div>
        </div>

        {/* Puntajes por subprueba */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Puntajes por Subprueba</h2>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Subpruebas Primarias</h3>
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-gray-600 font-medium">Subprueba</th>
                  <th className="text-center py-2 px-3 text-gray-600 font-medium">Código</th>
                  <th className="text-center py-2 px-3 text-gray-600 font-medium">Puntaje Bruto</th>
                  <th className="text-center py-2 px-3 text-gray-600 font-medium">Puntaje Escala</th>
                  <th className="text-center py-2 px-3 text-gray-600 font-medium">Clasificación</th>
                </tr>
              </thead>
              <tbody>
                {PRIMARY_SUBTESTS.map(code => {
                  const pe = scaledScores[code]
                  const status = completedSubtests[code]
                  const rawScore = data.raw_scores?.[code]
                  if (status === 'not_administered' && code === 'CC') return null
                  return (
                    <tr key={code} className="border-b border-gray-100">
                      <td className="py-2 px-3 text-gray-800">{SUBTEST_LABELS[code] || code}</td>
                      <td className="py-2 px-3 text-center text-gray-500">{code}</td>
                      <td className="py-2 px-3 text-center text-gray-800">{rawScore !== undefined ? rawScore : '-'}</td>
                      <td className="py-2 px-3 text-center">
                        {pe !== undefined && pe !== null ? <span className="font-mono font-bold text-gray-800">{pe}</span> : <span className="text-gray-400">-</span>}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {pe !== undefined && pe !== null ? <span className={`text-xs px-2 py-0.5 rounded-full ${getClassificationColor(pe)}`}>{getClassification(pe)}</span> : <span className="text-gray-400 text-xs">-</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {reportType === 'extended' && (
            <>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Subpruebas Secundarias</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-3 text-gray-600 font-medium">Subprueba</th>
                      <th className="text-center py-2 px-3 text-gray-600 font-medium">Código</th>
                      <th className="text-center py-2 px-3 text-gray-600 font-medium">Puntaje Bruto</th>
                      <th className="text-center py-2 px-3 text-gray-600 font-medium">Puntaje Escala</th>
                      <th className="text-center py-2 px-3 text-gray-600 font-medium">Clasificación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SECONDARY_SUBTESTS.map(code => {
                      const pe = scaledScores[code]
                      const rawScore = data.raw_scores?.[code]
                      const status = completedSubtests[code]
                      if (status !== 'completed' && pe === undefined) return null
                      return (
                        <tr key={code} className="border-b border-gray-100">
                          <td className="py-2 px-3 text-gray-800">{SUBTEST_LABELS[code] || code}</td>
                          <td className="py-2 px-3 text-center text-gray-500">{code}</td>
                          <td className="py-2 px-3 text-center text-gray-800">{rawScore !== undefined ? rawScore : '-'}</td>
                          <td className="py-2 px-3 text-center">
                            {pe !== undefined && pe !== null ? <span className="font-mono font-bold text-gray-800">{pe}</span> : <span className="text-gray-400">-</span>}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {pe !== undefined && pe !== null ? <span className={`text-xs px-2 py-0.5 rounded-full ${getClassificationColor(pe)}`}>{getClassification(pe)}</span> : <span className="text-gray-400 text-xs">-</span>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Índices Compuestos */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Índices Compuestos</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-gray-600 font-medium">Índice</th>
                  <th className="text-center py-2 px-3 text-gray-600 font-medium">Puntaje Compuesto</th>
                  <th className="text-center py-2 px-3 text-gray-600 font-medium">Percentil</th>
                  <th className="text-center py-2 px-3 text-gray-600 font-medium">Clasificación</th>
                </tr>
              </thead>
              <tbody>
                {['ICV', 'IVE', 'IRF', 'IMT', 'IVP', 'CIT'].map(code => {
                  const index = indexes[code]
                  if (!index) return null
                  return (
                    <tr key={code} className={`border-b border-gray-100 ${code === 'CIT' ? 'bg-blue-50' : ''}`}>
                      <td className="py-3 px-3">
                        <span className={`font-medium ${code === 'CIT' ? 'text-blue-700' : 'text-gray-800'}`}>{INDEX_COMPOSITION[code]?.name || code}</span>
                        <span className="text-xs text-gray-400 ml-1">({code})</span>
                      </td>
                      <td className="py-3 px-3 text-center"><span className={`text-lg font-bold font-mono ${code === 'CIT' ? 'text-blue-700' : 'text-gray-800'}`}>{index.score}</span></td>
                      <td className="py-3 px-3 text-center text-gray-700">{index.percentile}</td>
                      <td className="py-3 px-3 text-center"><span className={`text-xs px-2 py-0.5 rounded-full ${getClassificationColor(index.score)}`}>{getClassification(index.score)}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Interpretación */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Interpretación de Resultados</h2>
          <div className="space-y-4">
            {interpretations.map((text, i) => <p key={i} className="text-sm text-gray-700 leading-relaxed">{text}</p>)}
          </div>
        </div>

        {/* Recomendaciones */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recomendaciones</h2>
          <ul className="space-y-3">
            {recommendations.map((text, i) => (
              <li key={i} className="text-sm text-gray-700 leading-relaxed flex gap-2"><span className="text-blue-500 mt-0.5">•</span><span>{text}</span></li>
            ))}
          </ul>
        </div>

        {/* Nota */}
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 leading-relaxed">
            <strong>Nota:</strong> Este informe ha sido generado automáticamente por AQN Praxis. Los resultados deben ser interpretados por un profesional calificado en el contexto de una evaluación integral.
          </p>
        </div>
      </div>
    </TestResultsLayout>
  )
}