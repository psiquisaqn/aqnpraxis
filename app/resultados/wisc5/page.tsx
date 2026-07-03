'use client'

import React, { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { TestResultsLayout } from '@/components/TestResultsLayout'
import { PdfDownloadButton } from '@/components/PdfDownloadButton'
import { useReportDownload } from '@/hooks/useReportDownload'

// ============================================================
// CONFIGURACIÓN
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
// FUNCIONES DE INTERPRETACIÓN (CHILENAS)
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

function getClassificationColor(score: number, isScaled: boolean = false): string {
  if (score >= 130 || (isScaled && score >= 16)) return 'text-purple-700 bg-purple-50'
  if (score >= 120 || (isScaled && score >= 14)) return 'text-blue-700 bg-blue-50'
  if (score >= 110 || (isScaled && score >= 12)) return 'text-green-700 bg-green-50'
  if (score >= 90 || (isScaled && score >= 8)) return 'text-gray-700 bg-gray-50'
  if (score >= 80 || (isScaled && score >= 6)) return 'text-yellow-700 bg-yellow-50'
  if (score >= 70 || (isScaled && score >= 4)) return 'text-orange-700 bg-orange-50'
  return 'text-red-700 bg-red-50'
}

// ============================================================
// COMPONENTE INTERNO
// ============================================================

function Wisc5ResultsContent() {
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
  const [psychologistName, setPsychologistName] = useState('')
  const [planStatus, setPlanStatus] = useState<any>(null)
  const [showFullReport, setShowFullReport] = useState(false)

  const { generating, downloadDocx, downloadOdt } = useReportDownload()

  useEffect(() => {
    const load = async () => {
      if (!sessionId) { setError('No se especificó una sesión'); setLoading(false); return }
      const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setError('No autenticado'); setLoading(false); return }

        const { data: sessionData, error: sessionError } = await supabase
          .from('sessions')
          .select('*, patients(full_name, birth_date), profiles(full_name)')
          .eq('id', sessionId)
          .eq('psychologist_id', user.id)
          .single()

        if (sessionError || !sessionData) { setError('Sesión no encontrada o sin permiso'); setLoading(false); return }
        setPatientName(sessionData.patients?.full_name || 'Paciente')
        setPatientId(sessionData.patient_id || '')
        setEvalDate(sessionData.created_at ? new Date(sessionData.created_at).toLocaleDateString('es-CL') : '')
        setPsychologistName(sessionData.profiles?.full_name || '')
        if (sessionData.patients?.birth_date) {
          const birth = new Date(sessionData.patients.birth_date)
          const now = new Date()
          let years = now.getFullYear() - birth.getFullYear()
          let months = now.getMonth() - birth.getMonth()
          if (months < 0) { years--; months += 12 }
          setPatientAge(`${years} años, ${months} meses`)
        }

        const { data: wiscData, error: wiscError } = await supabase
          .from('wisc5_scores')
          .select('*')
          .eq('session_id', sessionId)
          .maybeSingle()

        if (wiscError) {
          console.error('Error al cargar wisc5_scores:', wiscError)
          setError('Error al cargar los puntajes')
          setLoading(false)
          return
        }

        if (!wiscData) {
          setError('No se encontraron puntajes WISC-V para esta sesión')
          setLoading(false)
          return
        }

        setData(wiscData)

        const { data: plan } = await supabase.rpc('get_plan_status', { p_user_id: user.id })
        setPlanStatus(plan)
        setLoading(false)
      } catch (err: any) {
        console.error('Error:', err)
        setError('Error: ' + err.message)
        setLoading(false)
      }
    }
    load()
  }, [sessionId])

  // ============================================================
  // UTILIDADES PARA EL INFORME
  // ============================================================

  const getSubtestInterpretation = (code: string, pe: number): string => {
    if (pe == null) return 'No disponible'
    if (pe >= 12) return 'Alto'
    if (pe >= 8) return 'Suficiente'
    return 'Bajo'
  }

  const getSubtestDescription = (code: string, pe: number): string => {
    const level = getSubtestInterpretation(code, pe)
    const descriptions: Record<string, Record<string, string>> = {
      AN: {
        Bajo: 'Dificultades en la identificación de clases y en la síntesis de conceptos.',
        Suficiente: 'Nivel suficiente de desarrollo de la identificación de clases y la síntesis de conceptos.',
        Alto: 'Alto rendimiento en la identificación de clases y la síntesis de conceptos.'
      },
      VOC: {
        Bajo: 'Bloqueo o desinterés en el manejo del repertorio léxico y semántico.',
        Suficiente: 'Manejo suficiente del repertorio léxico y semántico.',
        Alto: 'Alto nivel de manejo del repertorio léxico y semántico.'
      },
      IN: {
        Bajo: 'Bloqueo o desinterés en el acceso a la información del medio cultural amplio.',
        Suficiente: 'Nivel suficiente de acceso a la información del medio cultural amplio.',
        Alto: 'Alto nivel de acceso a la información del medio cultural amplio.'
      },
      COM: {
        Bajo: 'Poca densidad en la habilidad de análisis, reflexividad y descripción detallada.',
        Suficiente: 'Nivel suficiente de densidad en la habilidad de análisis, reflexividad y descripción detallada.',
        Alto: 'Alto nivel de desarrollo de la densidad en la habilidad de análisis, reflexividad y descripción detallada.'
      },
      CC: {
        Bajo: 'Confusión o extravío en el mapeo visual de superficies y su división en coordenadas.',
        Suficiente: 'Nivel suficiente de desarrollo en el mapeo visual de superficies y su división en coordenadas.',
        Alto: 'Notable manejo en el mapeo visual de superficies y su división en coordenadas.'
      },
      RV: {
        Bajo: 'Confusión o extravío en la división y rearticulación geométrica regular e irregular de elementos visuales.',
        Suficiente: 'Nivel suficiente de desarrollo en la división y rearticulación geométrica regular e irregular de elementos visuales.',
        Alto: 'Notable manejo en la división y rearticulación geométrica regular e irregular de elementos visuales.'
      },
      MR: {
        Bajo: 'Confusión o extravío en la identificación de secuencias y series, así como en la ilación de elementos en ejes de sentido.',
        Suficiente: 'Manejo suficiente en la identificación de secuencias y series.',
        Alto: 'Alto nivel de desarrollo en la identificación de secuencias y series.'
      },
      BAL: {
        Bajo: 'Dificultades significativas en la percepción visual de relaciones de equilibrio y equivalencia.',
        Suficiente: 'Rendimiento suficiente en la percepción visual de relaciones de equilibrio y equivalencia.',
        Alto: 'Notable manejo en la percepción visual de relaciones de equilibrio y equivalencia.'
      },
      ARI: {
        Bajo: 'Dificultades en el cálculo mental inmediato y en el espacio disponible en la memoria de trabajo.',
        Suficiente: 'Desempeño suficiente en el cálculo mental inmediato y en el espacio disponible en la memoria de trabajo.',
        Alto: 'Notable manejo en el cálculo mental inmediato y en el espacio disponible en la memoria de trabajo.'
      },
      RD: {
        Bajo: 'Confusión o bloqueo en el uso de la memoria de trabajo, con dificultades para aprovechar el total de su espacio disponible.',
        Suficiente: 'Manejo suficiente en el uso de la memoria de trabajo.',
        Alto: 'Alto nivel de desempeño en el uso de la memoria de trabajo.'
      },
      RI: {
        Bajo: 'Dificultades en la memoria visual de corto plazo, con interferencia visual y baja capacidad de registro.',
        Suficiente: 'Capacidad suficiente de registro visual y reconocimiento.',
        Alto: 'Excelente capacidad de registro visual y reconocimiento, con buena resistencia a la interferencia.'
      },
      SLN: {
        Bajo: 'Fallas en la flexibilidad cognitiva auditiva y en la manipulación mental compleja de estímulos auditivos.',
        Suficiente: 'Desempeño adecuado en el procesamiento secuencial y manipulación mental de estímulos auditivos.',
        Alto: 'Muy buena capacidad de procesamiento secuencial y flexibilidad cognitiva auditiva.'
      },
      CLA: {
        Bajo: 'Desmedro de la velocidad de la operatoria mental, influyendo en la coordinación entre representación, percepción y movimiento.',
        Suficiente: 'Desempeño suficiente en la velocidad de la operatoria mental.',
        Alto: 'Notable manejo en la velocidad de la operatoria mental.'
      },
      BS: {
        Bajo: 'Dificultades en la velocidad de la operatoria mental, la agudeza y organización de búsqueda y la concentración en tareas de esfuerzo visual.',
        Suficiente: 'Desempeño suficiente en la velocidad de la operatoria mental y agudeza de búsqueda.',
        Alto: 'Notable desarrollo en la velocidad de la operatoria mental y organización de búsqueda.'
      },
      CAN: {
        Bajo: 'Dificultades de inhibición de respuesta o descontrol gráfico, afectando la atención selectiva y vigilancia visual.',
        Suficiente: 'Atención selectiva y vigilancia visual adecuadas.',
        Alto: 'Excelente atención selectiva, con rápida identificación de estímulos relevantes en ambientes estructurados y aleatorios.'
      }
    }
    return descriptions[code]?.[level] || 'No disponible'
  }

  // ============================================================
  // LOADING Y ERROR
  // ============================================================

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
          <p className="text-red-600">{error || 'Error al cargar los datos'}</p>
          <button onClick={() => router.push('/dashboard')} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm">
            Volver
          </button>
        </div>
      </TestResultsLayout>
    )
  }

  // ============================================================
  // DATOS
  // ============================================================

  const scaledScores = data.scaled_scores || {}
  const compositeScores = data.composite_scores || {}
  const rawScores = data.raw_scores || {}
  const completedSubtests = data.completed_subtests || {}

  const indexes: Record<string, any> = {}
  for (const code of ['ICV', 'IVE', 'IRF', 'IMT', 'IVP', 'CIT']) {
    if (compositeScores[code]) indexes[code] = compositeScores[code]
  }

  // Calcular PIP (Promedio de Índices Principales)
  const indexCodes = ['ICV', 'IVE', 'IRF', 'IMT', 'IVP']
  const validIndexes = indexCodes.filter(code => indexes[code]?.score != null)
  const pip = validIndexes.length > 0
    ? validIndexes.reduce((sum, code) => sum + indexes[code].score, 0) / validIndexes.length
    : null

  const isAdmin = planStatus?.plan === 'admin' || planStatus?.role === 'admin'
  const isPro = planStatus?.is_pro
  const canDownloadDocxOdt = isPro || isAdmin
  const canGenerateReport = planStatus?.can_export || isPro || isAdmin

  const reportData = {
    patientName, patientAge, evalDate, reportType,
    scaledScores, indexes,
    subtestLabels: SUBTEST_LABELS, indexLabels: INDEX_COMPOSITION
  }

  // ============================================================
  // RENDER PRINCIPAL
  // ============================================================

  return (
    <TestResultsLayout
      patientName={patientName}
      patientId={patientId}
      testName="WISC-V"
      testCode="wisc5"
      evalDate={evalDate}
      pdfMeta={{
        sessionId: sessionId || '',
        patientId,
        testId: 'wisc5',
        patientName,
        content: { indexes, scaledScores, reportType }
      }}
    >
      {/* Indicador del plan */}
      {planStatus && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${isPro || isAdmin ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-600 border border-gray-200'}`}>
          <span className="font-medium">Plan {isAdmin ? 'Administrador' : isPro ? 'Premium' : 'Gratuito'}</span>
          {!isPro && !isAdmin && (
            <span className="ml-2">— Resultados simples ilimitados. Informes disponibles: {planStatus.reports_limit - planStatus.reports_used} de {planStatus.reports_limit}.</span>
          )}
          {isPro && <span className="ml-2">— Informes ilimitados y descarga en DOCX/ODT.</span>}
          {isAdmin && <span className="ml-2">— Acceso completo sin restricciones.</span>}
        </div>
      )}

      {/* Botones de descarga */}
      <div className="flex justify-end gap-2 mb-4">
        <PdfDownloadButton
          contentRef={contentRef}
          meta={{
            sessionId: sessionId || '',
            patientId,
            testId: 'wisc5',
            patientName,
            content: { indexes, scaledScores, reportType }
          }}
          label="Descargar PDF"
        />
        {canDownloadDocxOdt && (
          <>
            <button
              onClick={() => downloadDocx(reportData as any, `WISC-V_${patientName.replace(/\s+/g, '_')}`)}
              disabled={generating}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {generating ? 'Generando...' : 'Descargar DOCX'}
            </button>
            <button
              onClick={() => downloadOdt(reportData as any, `WISC-V_${patientName.replace(/\s+/g, '_')}`)}
              disabled={generating}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
            >
              Descargar ODT
            </button>
          </>
        )}
        {!canDownloadDocxOdt && (
          <span className="text-xs text-gray-400 self-center">Actualiza a Premium para descargar en DOCX/ODT</span>
        )}
      </div>

      {/* ============================================================ */}
      {/* CONTENIDO DEL INFORME (dentro de contentRef) */}
      {/* ============================================================ */}
      <div ref={contentRef} className="bg-white p-8" style={{ fontFamily: 'Arial, sans-serif' }}>
        {/* Cabecera */}
        <div className="text-center border-b-2 border-gray-300 pb-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Informe de Evaluación WISC-V</h1>
          <p className="text-sm text-gray-500">{evalDate}</p>
        </div>

        {/* Datos del evaluado */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-1 mb-3">Datos del Evaluado</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="font-medium">Nombre:</span> {patientName}</div>
            <div><span className="font-medium">Edad:</span> {patientAge}</div>
            <div><span className="font-medium">Fecha de evaluación:</span> {evalDate}</div>
            <div><span className="font-medium">Evaluador:</span> {psychologistName || 'No registrado'}</div>
          </div>
        </section>

        {/* Resumen de puntajes */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-1 mb-3">Resumen de Puntajes</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">Subprueba</th>
                  <th className="border p-2 text-center">Bruto</th>
                  <th className="border p-2 text-center">Escala (PE)</th>
                  <th className="border p-2 text-center">Clasificación</th>
                </tr>
              </thead>
              <tbody>
                {[...PRIMARY_SUBTESTS, ...SECONDARY_SUBTESTS].map(code => {
                  const pe = scaledScores[code]
                  const raw = rawScores[code]
                  if (pe == null && raw == null) return null
                  return (
                    <tr key={code} className="hover:bg-gray-50">
                      <td className="border p-2">{SUBTEST_LABELS[code]}</td>
                      <td className="border p-2 text-center">{raw != null ? raw : '-'}</td>
                      <td className="border p-2 text-center font-mono font-bold">{pe != null ? pe : '-'}</td>
                      <td className="border p-2 text-center">
                        {pe != null ? (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getClassificationColor(pe, true)}`}>
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
        </section>

        {/* Índices Compuestos */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-1 mb-3">Índices Compuestos</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">Índice</th>
                  <th className="border p-2 text-center">Puntaje</th>
                  <th className="border p-2 text-center">Percentil</th>
                  <th className="border p-2 text-center">Clasificación</th>
                  <th className="border p-2 text-center">IC 90%</th>
                  <th className="border p-2 text-center">IC 95%</th>
                </tr>
              </thead>
              <tbody>
                {['ICV', 'IVE', 'IRF', 'IMT', 'IVP', 'CIT'].map(code => {
                  const idx = indexes[code]
                  if (!idx) return null
                  return (
                    <tr key={code} className={`hover:bg-gray-50 ${code === 'CIT' ? 'bg-blue-50' : ''}`}>
                      <td className="border p-2 font-medium">{INDEX_COMPOSITION[code]?.name}</td>
                      <td className="border p-2 text-center font-mono font-bold">{idx.score}</td>
                      <td className="border p-2 text-center">{idx.percentile}</td>
                      <td className="border p-2 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getClassificationColor(idx.score)}`}>
                          {getClassification(idx.score)}
                        </span>
                      </td>
                      <td className="border p-2 text-center text-xs">
                        {idx.ci90 ? `${idx.ci90[0]} - ${idx.ci90[1]}` : '-'}
                      </td>
                      <td className="border p-2 text-center text-xs">
                        {idx.ci95 ? `${idx.ci95[0]} - ${idx.ci95[1]}` : '-'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Interpretación del CIT */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-1 mb-3">Interpretación del Cociente Intelectual Total (CIT)</h2>
          {indexes.CIT ? (
            <>
              <p className="text-sm text-gray-700 mb-2">
                El CIT obtenido es de <strong>{indexes.CIT.score}</strong>, lo que se clasifica como <strong>{getClassification(indexes.CIT.score)}</strong> y se ubica en el percentil <strong>{indexes.CIT.percentile}</strong>.
              </p>
              <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
                {indexes.CIT.score >= 130 && <li>Capacidades excepcionales; alta eficiencia para resolver problemas complejos.</li>}
                {indexes.CIT.score >= 120 && indexes.CIT.score < 130 && <li>Desempeño significativamente superior a sus pares; potencial académico elevado.</li>}
                {indexes.CIT.score >= 110 && indexes.CIT.score < 120 && <li>Desempeño por sobre el promedio; buena base de recursos cognitivos.</li>}
                {indexes.CIT.score >= 90 && indexes.CIT.score < 110 && <li>Desarrollo acorde a la norma poblacional; funcionamiento esperado para la edad.</li>}
                {indexes.CIT.score >= 80 && indexes.CIT.score < 90 && <li>Desempeño levemente inferior al promedio; puede requerir apoyos puntuales.</li>}
                {indexes.CIT.score >= 70 && indexes.CIT.score < 80 && <li>Debilidad normativa significativa; riesgo de dificultades en el aprendizaje.</li>}
                {indexes.CIT.score < 70 && <li>Limitación intelectual severa; requiere evaluación profunda de conducta adaptativa.</li>}
              </ul>
            </>
          ) : (
            <p className="text-sm text-gray-500">No disponible</p>
          )}
        </section>

        {/* Interpretación de Índices Principales */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-1 mb-3">Interpretación de Índices Principales</h2>
          {['ICV', 'IVE', 'IRF', 'IMT', 'IVP'].map(code => {
            const idx = indexes[code]
            if (!idx) return null
            return (
              <div key={code} className="mb-3">
                <h3 className="text-sm font-semibold text-gray-800">{INDEX_COMPOSITION[code]?.name} – {idx.score} ({getClassification(idx.score)})</h3>
                <p className="text-sm text-gray-600">{INDEX_COMPOSITION[code]?.description}</p>
                <p className="text-sm text-gray-700 mt-1">
                  <span className="font-medium">Interpretación:</span>{' '}
                  {idx.score >= 110 ? 'Rendimiento superior o muy superior, indicando un desarrollo robusto en esta área.' :
                   idx.score >= 90 ? 'Rendimiento dentro del promedio esperado para la edad.' :
                   'Rendimiento por debajo del promedio, sugiriendo debilidades en este dominio cognitivo.'}
                </p>
              </div>
            )
          })}
        </section>

        {/* Interpretación de Subpruebas */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-1 mb-3">Interpretación de Subpruebas</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">Subprueba</th>
                  <th className="border p-2 text-center">PE</th>
                  <th className="border p-2 text-left">Descripción según rendimiento</th>
                </tr>
              </thead>
              <tbody>
                {[...PRIMARY_SUBTESTS, ...SECONDARY_SUBTESTS].map(code => {
                  const pe = scaledScores[code]
                  if (pe == null) return null
                  return (
                    <tr key={code} className="hover:bg-gray-50">
                      <td className="border p-2 font-medium">{SUBTEST_LABELS[code]}</td>
                      <td className="border p-2 text-center font-mono">{pe}</td>
                      <td className="border p-2 text-sm">{getSubtestDescription(code, pe)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Índices Secundarios */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-1 mb-3">Índices Secundarios</h2>
          <p className="text-sm text-gray-600 mb-2">
            <strong>Índice de Capacidad General (ICG):</strong> No disponible en esta versión.
          </p>
          <p className="text-sm text-gray-600 mb-2">
            <strong>Índice de Competencia Cognitiva (ICC):</strong> No disponible en esta versión.
          </p>
          <p className="text-sm text-gray-600 mb-2">
            <strong>Índice No Verbal (INV):</strong> No disponible en esta versión.
          </p>
          <p className="text-xs text-gray-400">* Estos índices requieren subpruebas complementarias que no siempre están disponibles.</p>
        </section>

        {/* Análisis de Perfiles Intrasujeto */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-1 mb-3">Análisis de Perfiles Intrasujeto</h2>
          {pip != null ? (
            <>
              <p className="text-sm text-gray-600 mb-2">
                <strong>Promedio de Índices Principales (PIP):</strong> {pip.toFixed(1)}
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2 text-left">Índice</th>
                      <th className="border p-2 text-center">Puntaje</th>
                      <th className="border p-2 text-center">Diferencia vs PIP</th>
                      <th className="border p-2 text-center">Clasificación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {['ICV', 'IVE', 'IRF', 'IMT', 'IVP'].map(code => {
                      const idx = indexes[code]
                      if (!idx) return null
                      const diff = idx.score - pip
                      let label = 'Promedio'
                      let color = 'text-gray-600'
                      if (diff >= 10) { label = 'Fortaleza Personal'; color = 'text-green-700' }
                      else if (diff <= -10) { label = 'Debilidad Personal'; color = 'text-red-700' }
                      return (
                        <tr key={code} className="hover:bg-gray-50">
                          <td className="border p-2 font-medium">{INDEX_COMPOSITION[code]?.name}</td>
                          <td className="border p-2 text-center font-mono">{idx.score}</td>
                          <td className={`border p-2 text-center ${color}`}>{diff > 0 ? '+' : ''}{diff.toFixed(1)}</td>
                          <td className="border p-2 text-center">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${color} bg-gray-50`}>{label}</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500">No se puede calcular el PIP porque faltan índices.</p>
          )}
        </section>

        {/* Recomendaciones */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-1 mb-3">Recomendaciones Generales</h2>
          <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
            <li><strong>Áreas de Fortaleza:</strong> Potenciar mediante actividades desafiantes que mantengan el interés y promuevan el desarrollo de habilidades superiores.</li>
            <li><strong>Áreas de Debilidad:</strong> Implementar apoyos específicos, como entrenamiento en memoria de trabajo, estrategias de organización visual o reducción de la velocidad de procesamiento en evaluaciones.</li>
            <li><strong>Contexto Educativo:</strong> Adaptar el entorno escolar para reducir la carga cognitiva, proporcionar instrucciones claras y segmentadas, y utilizar materiales visuales que faciliten la comprensión.</li>
            <li><strong>Seguimiento:</strong> Se recomienda una reevaluación en 12–18 meses para monitorear la evolución del perfil cognitivo y ajustar las intervenciones según sea necesario.</li>
          </ul>
        </section>

        {/* Observaciones finales */}
        <section className="mt-6 pt-4 border-t border-gray-300">
          <p className="text-xs text-gray-500">
            Los resultados obtenidos deben interpretarse en el contexto de la historia personal, educativa y familiar del evaluado.
            Se sugiere integrar esta evaluación con otras fuentes de información (observación clínica, entrevistas, rendimiento académico)
            para obtener una visión integral del funcionamiento del evaluado.
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Informe generado automáticamente por AQN Praxis. Firma del profesional: {psychologistName || '_________________'}
          </p>
        </section>
      </div>

      {/* Botón para generar informe detallado (solo si no está visible) */}
      {!showFullReport && (
        <div className="text-center mt-6">
          <button
            onClick={() => {
              if (!canGenerateReport) {
                alert('Has alcanzado el límite de 3 informes gratuitos. Actualiza a Premium para generar más.')
                return
              }
              setShowFullReport(true)
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Generar informe detallado
          </button>
          {!canGenerateReport && planStatus && (
            <p className="text-xs text-gray-400 mt-2">
              Límite de informes alcanzado ({planStatus.reports_used}/{planStatus.reports_limit}). Actualiza a Premium para más.
            </p>
          )}
        </div>
      )}

      {/* Nota final */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 mt-6">
        <p className="text-xs text-gray-500">
          Nota: Los resultados simples son de libre acceso. El informe detallado con interpretación y recomendaciones está sujeto a los límites de tu plan.
        </p>
      </div>
    </TestResultsLayout>
  )
}

// ============================================================
// PÁGINA PRINCIPAL
// ============================================================
export default function Wisc5ResultsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Cargando resultados...</p>
        </div>
      </div>
    }>
      <Wisc5ResultsContent />
    </Suspense>
  )
}