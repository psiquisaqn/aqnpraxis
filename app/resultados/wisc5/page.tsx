'use client'

import React, { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { TestResultsLayout } from '@/components/TestResultsLayout'
import { PdfDownloadButton } from '@/components/PdfDownloadButton'
import { useReportDownload } from '@/hooks/useReportDownload'

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
          .select('*, patients(full_name, birth_date)')
          .eq('id', sessionId)
          .eq('psychologist_id', user.id)
          .single()

        if (sessionError || !sessionData) { setError('Sesión no encontrada o sin permiso'); setLoading(false); return }
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

        // Obtener estado del plan
        const { data: plan } = await supabase.rpc('get_plan_status', { p_user_id: user.id })
        setPlanStatus(plan)
        setLoading(false)
      } catch (err: any) { setError('Error: ' + err.message); setLoading(false) }
    }
    load()
  }, [sessionId])

  if (loading) {
    return (
      <TestResultsLayout patientName="..." testName="WISC-V" testCode="wisc5" evalDate="">
        <div className="flex items-center justify-center py-16"><div className="text-center"><div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" /><p className="text-gray-500">Cargando resultados...</p></div></div>
      </TestResultsLayout>
    )
  }

  if (error || !data) {
    return (
      <TestResultsLayout patientName="Error" testName="WISC-V" testCode="wisc5" evalDate="">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center"><p className="text-red-600">{error || 'Error'}</p><button onClick={() => router.push('/dashboard')} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm">Volver</button></div>
      </TestResultsLayout>
    )
  }

  const scaledScores = data.scaled_scores || {}
  const compositeScores = data.composite_scores || {}
  const completedSubtests = data.completed_subtests || {}
  const indexes: Record<string, any> = {}
  for (const code of ['ICV', 'IVE', 'IRF', 'IMT', 'IVP', 'CIT']) {
    if (compositeScores[code]) indexes[code] = compositeScores[code]
  }

  const isAdmin = planStatus?.plan === 'admin' || planStatus?.role === 'admin'
  const isPro = planStatus?.is_pro
  const canDownloadDocxOdt = isPro || isAdmin
  const canGenerateReport = planStatus?.can_export || isPro || isAdmin

  const reportData = {
    patientName, patientAge, evalDate, reportType,
    scaledScores, indexes,
    subtestLabels: SUBTEST_LABELS, indexLabels: INDEX_COMPOSITION
  }

  return (
    <TestResultsLayout
      patientName={patientName} patientId={patientId}
      testName="WISC-V" testCode="wisc5" evalDate={evalDate}
      pdfMeta={{
        sessionId: sessionId || '', patientId, testId: 'wisc5',
        patientName, content: { indexes, scaledScores, reportType }
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
          meta={{ sessionId: sessionId || '', patientId, testId: 'wisc5', patientName, content: { indexes, scaledScores, reportType } }}
          label="Descargar PDF"
        />
        {canDownloadDocxOdt && (
          <>
            <button onClick={() => downloadDocx(reportData as any, `WISC-V_${patientName.replace(/\s+/g, '_')}`)} disabled={generating}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
              {generating ? 'Generando...' : 'Descargar DOCX'}
            </button>
            <button onClick={() => downloadOdt(reportData as any, `WISC-V_${patientName.replace(/\s+/g, '_')}`)} disabled={generating}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50">
              Descargar ODT
            </button>
          </>
        )}
        {!canDownloadDocxOdt && (
          <span className="text-xs text-gray-400 self-center">Actualiza a Premium para descargar en DOCX/ODT</span>
        )}
      </div>

      <div ref={contentRef} className="space-y-8">
        {/* Datos del evaluado */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Datos del Evaluado</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-500">Nombre:</span><span className="ml-2 text-gray-800 font-medium">{patientName}</span></div>
            <div><span className="text-gray-500">Edad:</span><span className="ml-2 text-gray-800">{patientAge}</span></div>
            <div><span className="text-gray-500">Fecha:</span><span className="ml-2 text-gray-800">{evalDate}</span></div>
            <div><span className="text-gray-500">Tipo:</span><span className="ml-2 text-gray-800">{reportType === 'brief' ? 'Breve (7)' : 'Extendido (15)'}</span></div>
          </div>
        </div>

        {/* Subpruebas primarias */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Puntajes por Subprueba</h2>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Primarias</h3>
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-200"><th className="text-left py-2 px-3">Subprueba</th><th className="text-center py-2 px-3">Código</th><th className="text-center py-2 px-3">Bruto</th><th className="text-center py-2 px-3">Escala</th><th className="text-center py-2 px-3">Clasificación</th></tr></thead>
              <tbody>
                {PRIMARY_SUBTESTS.map(code => {
                  const pe = scaledScores[code]; const rawScore = data.raw_scores?.[code]
                  if (completedSubtests[code] === 'not_administered' && code === 'CC') return null
                  return (
                    <tr key={code} className="border-b border-gray-100">
                      <td className="py-2 px-3">{SUBTEST_LABELS[code]}</td><td className="py-2 px-3 text-center text-gray-500">{code}</td>
                      <td className="py-2 px-3 text-center">{rawScore ?? '-'}</td>
                      <td className="py-2 px-3 text-center">{pe != null ? <span className="font-mono font-bold">{pe}</span> : '-'}</td>
                      <td className="py-2 px-3 text-center">{pe != null ? <span className={`text-xs px-2 py-0.5 rounded-full ${getClassificationColor(pe)}`}>{getClassification(pe)}</span> : '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {reportType === 'extended' && (
            <>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Secundarias</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-200"><th className="text-left py-2 px-3">Subprueba</th><th className="text-center py-2 px-3">Código</th><th className="text-center py-2 px-3">Bruto</th><th className="text-center py-2 px-3">Escala</th><th className="text-center py-2 px-3">Clasificación</th></tr></thead>
                  <tbody>
                    {SECONDARY_SUBTESTS.map(code => {
                      const pe = scaledScores[code]; const rawScore = data.raw_scores?.[code]
                      if (completedSubtests[code] !== 'completed' && pe == null) return null
                      return (
                        <tr key={code} className="border-b border-gray-100">
                          <td className="py-2 px-3">{SUBTEST_LABELS[code]}</td><td className="py-2 px-3 text-center text-gray-500">{code}</td>
                          <td className="py-2 px-3 text-center">{rawScore ?? '-'}</td>
                          <td className="py-2 px-3 text-center">{pe != null ? <span className="font-mono font-bold">{pe}</span> : '-'}</td>
                          <td className="py-2 px-3 text-center">{pe != null ? <span className={`text-xs px-2 py-0.5 rounded-full ${getClassificationColor(pe)}`}>{getClassification(pe)}</span> : '-'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Índices */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Índices Compuestos</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-200"><th className="text-left py-2 px-3">Índice</th><th className="text-center py-2 px-3">Puntaje</th><th className="text-center py-2 px-3">Percentil</th><th className="text-center py-2 px-3">Clasificación</th></tr></thead>
              <tbody>
                {['ICV', 'IVE', 'IRF', 'IMT', 'IVP', 'CIT'].map(code => {
                  const idx = indexes[code]; if (!idx) return null
                  return (
                    <tr key={code} className={`border-b border-gray-100 ${code === 'CIT' ? 'bg-blue-50' : ''}`}>
                      <td className="py-3 px-3"><span className={`font-medium ${code === 'CIT' ? 'text-blue-700' : 'text-gray-800'}`}>{INDEX_COMPOSITION[code]?.name}</span><span className="text-xs text-gray-400 ml-1">({code})</span></td>
                      <td className="py-3 px-3 text-center"><span className="text-lg font-bold font-mono">{idx.score}</span></td>
                      <td className="py-3 px-3 text-center text-gray-700">{idx.percentile}</td>
                      <td className="py-3 px-3 text-center"><span className={`text-xs px-2 py-0.5 rounded-full ${getClassificationColor(idx.score)}`}>{getClassification(idx.score)}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Botón para generar informe detallado */}
        {!showFullReport && (
          <div className="text-center">
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
              <p className="text-xs text-gray-400 mt-2">Límite de informes alcanzado ({planStatus.reports_used}/{planStatus.reports_limit}). Actualiza a Premium para más.</p>
            )}
          </div>
        )}

        {/* Interpretación detallada y recomendaciones (solo si showFullReport) */}
        {showFullReport && (
          <>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Interpretación de Resultados</h2>
              <div className="space-y-4">
                <p className="text-sm text-gray-700">El Coeficiente Intelectual Total (CIT) obtenido es de {indexes.CIT?.score || 'N/A'}, clasificación "{getClassification(indexes.CIT?.score || 0)}", percentil {indexes.CIT?.percentile || 'N/A'}.</p>
                {/* (resto de la interpretación) */}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Recomendaciones</h2>
              <ul className="space-y-3">
                <li className="text-sm text-gray-700 flex gap-2"><span className="text-blue-500">•</span>Basado en los resultados, se sugiere continuar con el plan educativo regular y monitorear el progreso.</li>
                {/* (resto de recomendaciones) */}
              </ul>
            </div>
          </>
        )}

        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Nota: Los resultados simples son de libre acceso. El informe detallado con interpretación y recomendaciones está sujeto a los límites de tu plan.</p>
        </div>
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