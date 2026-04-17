'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { DualTestWrapper } from './DualTestWrapper'

// Tipos de subpruebas por índice
const SUBTESTS_BY_INDEX = {
  ICV: [
    { code: 'AN', name: 'Analogías', rawMax: 46, scaledRange: [1, 19] },
    { code: 'VOC', name: 'Vocabulario', rawMax: 54, scaledRange: [1, 19] }
  ],
  IVE: [
    { code: 'CC', name: 'Construcción con Cubos', rawMax: 58, scaledRange: [1, 19] },
    { code: 'RV', name: 'Rompecabezas Visuales', rawMax: 29, scaledRange: [1, 19] }
  ],
  IRF: [
    { code: 'MR', name: 'Matrices de Razonamiento', rawMax: 32, scaledRange: [1, 19] },
    { code: 'BAL', name: 'Balanzas', rawMax: 34, scaledRange: [1, 19] }
  ],
  IMT: [
    { code: 'RD', name: 'Retención de Dígitos', rawMax: 54, scaledRange: [1, 19] },
    { code: 'RI', name: 'Retención de Imágenes', rawMax: 49, scaledRange: [1, 19] }
  ],
  IVP: [
    { code: 'CLA', name: 'Claves', rawMax: 117, scaledRange: [1, 19] },
    { code: 'BS', name: 'Búsqueda de Símbolos', rawMax: 60, scaledRange: [1, 19] }
  ],
  CIT: [
    { code: 'CC', name: 'Construcción con Cubos', rawMax: 58, scaledRange: [1, 19] },
    { code: 'AN', name: 'Analogías', rawMax: 46, scaledRange: [1, 19] },
    { code: 'MR', name: 'Matrices de Razonamiento', rawMax: 32, scaledRange: [1, 19] },
    { code: 'RD', name: 'Retención de Dígitos', rawMax: 54, scaledRange: [1, 19] },
    { code: 'CLA', name: 'Claves', rawMax: 117, scaledRange: [1, 19] },
    { code: 'VOC', name: 'Vocabulario', rawMax: 54, scaledRange: [1, 19] },
    { code: 'BAL', name: 'Balanzas', rawMax: 34, scaledRange: [1, 19] }
  ]
}

// Subpruebas complementarias (para sustitución)
const SUPPLEMENTAL_SUBTESTS = [
  { code: 'RV', name: 'Rompecabezas Visuales', belongsTo: 'IVE' },
  { code: 'RI', name: 'Retención de Imágenes', belongsTo: 'IMT' },
  { code: 'BS', name: 'Búsqueda de Símbolos', belongsTo: 'IVP' },
  { code: 'IN', name: 'Información', belongsTo: null },
  { code: 'SLN', name: 'Span Letras y Números', belongsTo: null },
  { code: 'CAN', name: 'Cancelación', belongsTo: null },
  { code: 'COM', name: 'Comprensión', belongsTo: null },
  { code: 'ARI', name: 'Aritmética', belongsTo: null }
]

// Clasificación según puntaje compuesto
function getClassification(score: number): string {
  if (score >= 130) return 'Muy superior'
  if (score >= 120) return 'Superior'
  if (score >= 110) return 'Promedio alto'
  if (score >= 90) return 'Promedio'
  if (score >= 80) return 'Promedio bajo'
  if (score >= 70) return 'Limítrofe'
  return 'Extremadamente bajo'
}

// Calcular edad en años y meses
function calculateAge(birthDate: Date, evalDate: Date): { years: number; months: number; totalMonths: number } {
  let years = evalDate.getFullYear() - birthDate.getFullYear()
  let months = evalDate.getMonth() - birthDate.getMonth()
  let days = evalDate.getDate() - birthDate.getDate()

  if (days < 0) {
    months--
  }
  if (months < 0) {
    years--
    months += 12
  }

  const totalMonths = years * 12 + months
  return { years, months, totalMonths }
}

// Determinar grupo etario según edad en meses
function getAgeGroup(totalMonths: number): string {
  // WISC-V Chile: grupos de 6 meses desde 6:0 hasta 16:11
  const groups = [
    { min: 72, max: 77, label: '6:0-6:5' },
    { min: 78, max: 83, label: '6:6-6:11' },
    { min: 84, max: 89, label: '7:0-7:5' },
    { min: 90, max: 95, label: '7:6-7:11' },
    { min: 96, max: 101, label: '8:0-8:5' },
    { min: 102, max: 107, label: '8:6-8:11' },
    { min: 108, max: 113, label: '9:0-9:5' },
    { min: 114, max: 119, label: '9:6-9:11' },
    { min: 120, max: 125, label: '10:0-10:5' },
    { min: 126, max: 131, label: '10:6-10:11' },
    { min: 132, max: 137, label: '11:0-11:5' },
    { min: 138, max: 143, label: '11:6-11:11' },
    { min: 144, max: 149, label: '12:0-12:5' },
    { min: 150, max: 155, label: '12:6-12:11' },
    { min: 156, max: 161, label: '13:0-13:5' },
    { min: 162, max: 167, label: '13:6-13:11' },
    { min: 168, max: 173, label: '14:0-14:5' },
    { min: 174, max: 179, label: '14:6-14:11' },
    { min: 180, max: 185, label: '15:0-15:5' },
    { min: 186, max: 191, label: '15:6-15:11' },
    { min: 192, max: 197, label: '16:0-16:5' },
    { min: 198, max: 203, label: '16:6-16:11' }
  ]
  
  const group = groups.find(g => totalMonths >= g.min && totalMonths <= g.max)
  return group?.label || '6:0-6:5'
}

interface Wisc5ControlProps {
  dualSessionId: string
  sessionId: string
  onUpdatePatient: (content: any) => void
  onSaveResponse: (item: number, value: any) => void
  displayReady?: boolean
}

export function Wisc5Control({ dualSessionId, sessionId, onUpdatePatient, onSaveResponse, displayReady = false }: Wisc5ControlProps) {
  const router = useRouter()
  const [birthDate, setBirthDate] = useState<string>('')
  const [evalDate, setEvalDate] = useState<string>(() => new Date().toISOString().split('T')[0])
  const [ageInfo, setAgeInfo] = useState<{ years: number; months: number; group: string } | null>(null)
  const [rawScores, setRawScores] = useState<Record<string, number>>({})
  const [scaledScores, setScaledScores] = useState<Record<string, number>>({})
  const [indexScores, setIndexScores] = useState<Record<string, { score: number; classification: string; sumScaled: number }>>({})
  const [loading, setLoading] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [showQuestionZero, setShowQuestionZero] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const firstItemSent = useRef(false)

  // Calcular grupo etario cuando cambia la fecha de nacimiento
  useEffect(() => {
    if (birthDate && evalDate) {
      const birth = new Date(birthDate)
      const evalDt = new Date(evalDate)
      if (birth && evalDt && !isNaN(birth.getTime()) && !isNaN(evalDt.getTime())) {
        const { years, months, totalMonths } = calculateAge(birth, evalDt)
        const group = getAgeGroup(totalMonths)
        setAgeInfo({ years, months, group })
      }
    }
  }, [birthDate, evalDate])

  // Consultar puntaje escalado para una subprueba
  const fetchScaledScore = async (subtestCode: string, rawScore: number, ageGroup: string) => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data, error } = await supabase
      .from('wisc5_norms_subtest')
      .select('scaled_score')
      .eq('age_group', ageGroup)
      .eq('subtest_code', subtestCode)
      .lte('raw_score_min', rawScore)
      .gte('raw_score_max', rawScore)
      .single()

    if (error || !data) {
      console.error(`Error fetching scaled score for ${subtestCode}:`, error)
      return null
    }
    return (data as any).scaled_score
  }

  // Consultar puntaje compuesto para un índice
  const fetchCompositeScore = async (indexCode: string, sumScaled: number) => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data, error } = await supabase
      .from('wisc5_norms_composite')
      .select('composite_score, percentile, ci90_lo, ci90_hi')
      .eq('index_code', indexCode)
      .lte('sum_scaled_min', sumScaled)
      .gte('sum_scaled_max', sumScaled)
      .single()

    if (error || !data) {
      console.error(`Error fetching composite score for ${indexCode}:`, error)
      return null
    }
    return data
  }

  // Actualizar puntajes escalados cuando cambian los puntajes brutos o el grupo etario
  useEffect(() => {
    const updateScaledScores = async () => {
      if (!ageInfo?.group) return

      const newScaledScores: Record<string, number> = {}
      for (const [code, raw] of Object.entries(rawScores)) {
        if (raw !== undefined && raw !== null) {
          const scaled = await fetchScaledScore(code, raw, ageInfo.group)
          if (scaled !== null) {
            newScaledScores[code] = scaled
          }
        }
      }
      setScaledScores(newScaledScores)
    }
    updateScaledScores()
  }, [rawScores, ageInfo?.group])

  // Actualizar puntajes compuestos cuando cambian los puntajes escalados
  useEffect(() => {
    const updateIndexScores = async () => {
      const newIndexScores: Record<string, { score: number; classification: string; sumScaled: number }> = {}
      
      // Calcular cada índice
      for (const [indexCode, subtests] of Object.entries(SUBTESTS_BY_INDEX)) {
        const sumScaled = subtests.reduce((sum, sub) => {
          return sum + (scaledScores[sub.code] || 0)
        }, 0)
        
        if (sumScaled > 0 && subtests.every(sub => scaledScores[sub.code] !== undefined)) {
          const composite = await fetchCompositeScore(indexCode, sumScaled)
          if (composite) {
            newIndexScores[indexCode] = {
              score: composite.composite_score,
              classification: getClassification(composite.composite_score),
              sumScaled
            }
          }
        }
      }
      setIndexScores(newIndexScores)
    }
    updateIndexScores()
  }, [scaledScores])

  const handleRawScoreChange = (subtestCode: string, value: string) => {
    const numValue = parseInt(value, 10)
    if (isNaN(numValue)) {
      const newRaw = { ...rawScores }
      delete newRaw[subtestCode]
      setRawScores(newRaw)
    } else {
      setRawScores({ ...rawScores, [subtestCode]: numValue })
    }
  }

  const handleStartTest = () => {
    if (!birthDate) {
      setError('Por favor, ingresa la fecha de nacimiento del paciente')
      return
    }
    setShowQuestionZero(false)
    setError(null)
  }

  const handleFinish = async () => {
    setFinishing(true)
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuario no autenticado')

      // Guardar resultados en wisc5_scores
      const scoreData: any = {
        session_id: sessionId,
        calculated_at: new Date().toISOString()
      }

      // Guardar puntajes brutos
      for (const [code, raw] of Object.entries(rawScores)) {
        scoreData[`${code.toLowerCase()}_raw`] = raw
      }

      // Guardar puntajes escalados
      for (const [code, scaled] of Object.entries(scaledScores)) {
        scoreData[`${code.toLowerCase()}_scaled`] = scaled
      }

      // Guardar índices compuestos
      if (indexScores.ICV) {
        scoreData.icv = indexScores.ICV.score
        scoreData.icv_classification = indexScores.ICV.classification
        scoreData.sum_icv = indexScores.ICV.sumScaled
      }
      if (indexScores.IVE) {
        scoreData.ive = indexScores.IVE.score
        scoreData.ive_classification = indexScores.IVE.classification
        scoreData.sum_ive = indexScores.IVE.sumScaled
      }
      if (indexScores.IRF) {
        scoreData.irf = indexScores.IRF.score
        scoreData.irf_classification = indexScores.IRF.classification
        scoreData.sum_irf = indexScores.IRF.sumScaled
      }
      if (indexScores.IMT) {
        scoreData.imt = indexScores.IMT.score
        scoreData.imt_classification = indexScores.IMT.classification
        scoreData.sum_imt = indexScores.IMT.sumScaled
      }
      if (indexScores.IVP) {
        scoreData.ivp = indexScores.IVP.score
        scoreData.ivp_classification = indexScores.IVP.classification
        scoreData.sum_ivp = indexScores.IVP.sumScaled
      }
      if (indexScores.CIT) {
        scoreData.cit = indexScores.CIT.score
        scoreData.cit_classification = indexScores.CIT.classification
        scoreData.sum_cit = indexScores.CIT.sumScaled
      }

      const { error: saveError } = await supabase
        .from('wisc5_scores')
        .upsert(scoreData, { onConflict: 'session_id' })

      if (saveError) throw saveError

      // Guardar informe
      await supabase
        .from('informes')
        .upsert({
          session_id: sessionId,
          patient_id: null,
          psychologist_id: user.id,
          test_id: 'wisc5',
          titulo: 'WISC-V - Escala de Inteligencia Wechsler para Niños',
          contenido: JSON.stringify({
            ageGroup: ageInfo?.group,
            rawScores,
            scaledScores,
            indexScores
          }),
          puntaje_total: indexScores.CIT?.score || null,
          nivel: indexScores.CIT?.classification || null,
          recomendaciones: generarRecomendacionesWISC(indexScores)
        }, { onConflict: 'session_id' })

      // Actualizar sesión
      await supabase
        .from('sessions')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', sessionId)

      router.push(`/resultados/wisc5?session=${sessionId}`)
    } catch (e: any) {
      console.error('Error guardando resultados:', e)
      setError(e.message)
      setFinishing(false)
    }
  }

  const generarRecomendacionesWISC = (scores: typeof indexScores): string => {
    const citScore = scores.CIT?.score
    if (!citScore) return "Completar la evaluación para obtener recomendaciones."
    
    if (citScore >= 130) {
      return "El evaluado presenta habilidades cognitivas muy superiores. Se recomienda ofrecer enriquecimiento académico y desafíos apropiados a su nivel."
    } else if (citScore >= 120) {
      return "El evaluado presenta habilidades cognitivas superiores. Se recomienda estimular su desarrollo con actividades que desafíen sus capacidades."
    } else if (citScore >= 110) {
      return "El evaluado presenta habilidades cognitivas promedio alto. Se recomienda mantener un ambiente de estimulación continua."
    } else if (citScore >= 90) {
      return "El evaluado presenta habilidades cognitivas promedio. Se recomienda seguimiento estándar en el ámbito escolar."
    } else if (citScore >= 80) {
      return "El evaluado presenta habilidades cognitivas promedio bajo. Se recomienda identificar áreas específicas para reforzar."
    } else if (citScore >= 70) {
      return "El evaluado presenta habilidades cognitivas limítrofes. Se recomienda evaluación complementaria e intervención temprana."
    } else {
      return "El evaluado presenta habilidades cognitivas extremadamente bajas. Se recomienda derivación a especialistas y programa de apoyo intensivo."
    }
  }

  const allCITSubtestsCompleted = () => {
    const citSubtests = SUBTESTS_BY_INDEX.CIT.map(s => s.code)
    return citSubtests.every(code => scaledScores[code] !== undefined)
  }

  // Lista de ítems para DualTestWrapper (placeholder)
  const wiscItemsList = Array.from({ length: 15 }, (_, i) => ({ num: i + 1 }))

  if (showQuestionZero) {
    return (
      <div className="h-screen flex flex-col bg-gray-50">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-md w-full text-center shadow-lg">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Evaluación WISC-V
            </h2>
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <p className="text-blue-800 text-sm mb-2">
                Ingresa los datos del paciente para comenzar
              </p>
              <label className="block text-left text-sm font-medium text-gray-700 mb-1">
                Fecha de nacimiento
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                max={new Date().toISOString().split('T')[0]}
              />
              {ageInfo && (
                <p className="text-xs text-gray-500 mt-2">
                  Edad: {ageInfo.years} años, {ageInfo.months} meses
                </p>
              )}
            </div>
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            <button
              onClick={handleStartTest}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
            >
              Comenzar evaluación
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <DualTestWrapper
      title="Evaluación WISC-V - Escala Wechsler"
      totalItems={15}
      currentItem={1}
      completed={Object.keys(rawScores).length}
      onItemSelect={() => {}}
      items={wiscItemsList}
      showQuestionZero={false}
      onStart={() => {}}
    >
      <div className="space-y-4">
        {/* Información del paciente */}
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-600">
            Edad: {ageInfo?.years} años, {ageInfo?.months} meses | Grupo: {ageInfo?.group}
          </p>
        </div>

        {/* Índices */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Object.entries(SUBTESTS_BY_INDEX).map(([indexCode, subtests]) => {
            if (indexCode === 'CIT') return null
            const score = indexScores[indexCode]
            return (
              <div key={indexCode} className="bg-white rounded-lg border border-gray-200 p-3">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">{indexCode}</h3>
                <div className="space-y-2">
                  {subtests.map(sub => (
                    <div key={sub.code} className="flex items-center gap-2">
                      <label className="text-xs text-gray-600 w-20">{sub.name}</label>
                      <input
                        type="number"
                        value={rawScores[sub.code] ?? ''}
                        onChange={(e) => handleRawScoreChange(sub.code, e.target.value)}
                        placeholder="PD"
                        className="w-16 px-2 py-1 text-xs border border-gray-200 rounded"
                      />
                      {scaledScores[sub.code] !== undefined && (
                        <span className="text-xs font-medium text-green-600">
                          PE: {scaledScores[sub.code]}
                        </span>
                      )}
                    </div>
                  ))}
                  {score && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-xs font-bold text-blue-600">
                        {indexCode}: {score.score} ({score.classification})
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* CIT (índice principal) */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-md font-semibold text-gray-800 mb-3">CIT - Cociente Intelectual Total</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {SUBTESTS_BY_INDEX.CIT.map(sub => (
              <div key={sub.code} className="flex items-center gap-2">
                <label className="text-xs text-gray-600 w-16">{sub.name}</label>
                <input
                  type="number"
                  value={rawScores[sub.code] ?? ''}
                  onChange={(e) => handleRawScoreChange(sub.code, e.target.value)}
                  placeholder="PD"
                  className="w-16 px-2 py-1 text-xs border border-gray-200 rounded"
                />
                {scaledScores[sub.code] !== undefined && (
                  <span className="text-xs font-medium text-green-600">{scaledScores[sub.code]}</span>
                )}
              </div>
            ))}
          </div>
          {indexScores.CIT && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-blue-700">{indexScores.CIT.score}</p>
              <p className="text-sm text-gray-600">{indexScores.CIT.classification}</p>
              <p className="text-xs text-gray-500">Suma PE: {indexScores.CIT.sumScaled}</p>
            </div>
          )}
        </div>

        {allCITSubtestsCompleted() && (
          <button
            onClick={handleFinish}
            disabled={finishing}
            className="w-full py-3 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {finishing ? 'Finalizando...' : 'Finalizar evaluación WISC-V'}
          </button>
        )}
      </div>
    </DualTestWrapper>
  )
}