'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { DualTestWrapper } from './DualTestWrapper'

// ============================================================
// CONFIGURACIÓN DE SUBPRUEBAS
// ============================================================

// Configuración de ítems para Construcción con Cubos (CC)
const CC_ITEMS_CONFIG = [
  // ítem 1
  { num: 1, timeLimit: 30, twoAttempts: true, maxScore: 2, scores: { first: 2, second: 1, fail: 0 } },
  // ítem 2
  { num: 2, timeLimit: 45, twoAttempts: true, maxScore: 2, scores: { first: 2, second: 1, fail: 0 } },
  // ítem 3
  { num: 3, timeLimit: 45, twoAttempts: true, maxScore: 2, scores: { first: 2, second: 1, fail: 0 } },
  // ítems 4-9 (sin segundos intentos)
  { num: 4, timeLimit: 45, twoAttempts: false, maxScore: 4, scores: { success: 4, fail: 0 } },
  { num: 5, timeLimit: 45, twoAttempts: false, maxScore: 4, scores: { success: 4, fail: 0 } },
  { num: 6, timeLimit: 75, twoAttempts: false, maxScore: 4, scores: { success: 4, fail: 0 } },
  { num: 7, timeLimit: 75, twoAttempts: false, maxScore: 4, scores: { success: 4, fail: 0 } },
  { num: 8, timeLimit: 75, twoAttempts: false, maxScore: 4, scores: { success: 4, fail: 0 } },
  { num: 9, timeLimit: 75, twoAttempts: false, maxScore: 4, scores: { success: 4, fail: 0 } },
  // ítems 10-13 (con puntaje por tiempo)
  { num: 10, timeLimit: 120, twoAttempts: false, maxScore: 7, scoresByTime: [
    { maxTime: 30, score: 7 },
    { maxTime: 60, score: 6 },
    { maxTime: 70, score: 5 },
    { maxTime: 120, score: 4 },
    { maxTime: Infinity, score: 0 }
  ]},
  { num: 11, timeLimit: 120, twoAttempts: false, maxScore: 7, scoresByTime: [
    { maxTime: 30, score: 7 },
    { maxTime: 60, score: 6 },
    { maxTime: 70, score: 5 },
    { maxTime: 120, score: 4 },
    { maxTime: Infinity, score: 0 }
  ]},
  { num: 12, timeLimit: 120, twoAttempts: false, maxScore: 7, scoresByTime: [
    { maxTime: 30, score: 7 },
    { maxTime: 60, score: 6 },
    { maxTime: 70, score: 5 },
    { maxTime: 120, score: 4 },
    { maxTime: Infinity, score: 0 }
  ]},
  { num: 13, timeLimit: 120, twoAttempts: false, maxScore: 7, scoresByTime: [
    { maxTime: 30, score: 7 },
    { maxTime: 60, score: 6 },
    { maxTime: 70, score: 5 },
    { maxTime: 120, score: 4 },
    { maxTime: Infinity, score: 0 }
  ]}
]

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

// ============================================================
// COMPONENTE DE CRONÓMETRO
// ============================================================

interface StopwatchProps {
  timeLimit: number
  onTimeUpdate?: (seconds: number) => void
  onTimeEnd?: () => void
  autoStart?: boolean
  isActive?: boolean
}

function Stopwatch({ timeLimit, onTimeUpdate, onTimeEnd, autoStart = true, isActive = true }: StopwatchProps) {
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(autoStart && isActive)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isRunning && isActive && seconds < timeLimit) {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => {
          const newSeconds = prev + 1
          onTimeUpdate?.(newSeconds)
          if (newSeconds >= timeLimit) {
            setIsRunning(false)
            onTimeEnd?.()
            return timeLimit
          }
          return newSeconds
        })
      }, 1000)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning, isActive, seconds, timeLimit, onTimeUpdate, onTimeEnd])

  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getProgressPercent = (): number => {
    return Math.min((seconds / timeLimit) * 100, 100)
  }

  return (
    <div className="text-center">
      <div className="text-3xl font-mono font-bold mb-2">{formatTime(seconds)}</div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-blue-500 transition-all duration-1000"
          style={{ width: `${getProgressPercent()}%` }}
        />
      </div>
      <div className="text-xs text-gray-400 mt-1">
        Tiempo límite: {formatTime(timeLimit)}
      </div>
    </div>
  )
}

// ============================================================
// INTERFAZ PARA CONSTRUCCIÓN CON CUBOS (CC)
// ============================================================

interface CcInterfaceProps {
  onComplete: (scores: Record<number, number>, rawTotal: number) => void
  onUpdatePatient: (content: any) => void
}

function CcInterface({ onComplete, onUpdatePatient }: CcInterfaceProps) {
  const [currentItemIndex, setCurrentItemIndex] = useState(0)
  const [scores, setScores] = useState<Record<number, number>>({})
  const [attempts, setAttempts] = useState<Record<number, number>>({})
  const [showRetryButton, setShowRetryButton] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [stopwatchKey, setStopwatchKey] = useState(0)
  const [availableScores, setAvailableScores] = useState<number[]>([])
  const [isPaused, setIsPaused] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)

  const currentItem = CC_ITEMS_CONFIG[currentItemIndex]
  const isTwoAttempts = currentItem?.twoAttempts || false
  const currentAttempt = attempts[currentItem?.num] || 1
  const isTimeBased = currentItem?.scoresByTime !== undefined

  // Enviar estímulo al display cuando cambia el ítem
  useEffect(() => {
    if (currentItem && !isCompleted) {
      onUpdatePatient({
        type: 'wisc5_cc',
        stimulusNum: currentItem.num,
        instructions: 'Construye la figura usando los cubos. Observa el modelo y repite la construcción.',
        twoAttempts: isTwoAttempts,
        currentAttempt: currentAttempt,
        totalItems: CC_ITEMS_CONFIG.length
      })
    }
  }, [currentItemIndex, currentItem, isCompleted, onUpdatePatient, isTwoAttempts, currentAttempt])

  // Verificar suspensión (dos puntajes consecutivos de 0)
  const checkSuspension = (newScores: Record<number, number>): boolean => {
    const items = Object.keys(newScores).map(Number).sort((a, b) => a - b)
    if (items.length >= 2) {
      const lastTwo = items.slice(-2)
      if (newScores[lastTwo[0]] === 0 && newScores[lastTwo[1]] === 0) {
        return true
      }
    }
    return false
  }

  // Actualizar botones disponibles según tiempo (para ítems 10-13)
  useEffect(() => {
    if (isTimeBased && currentItem?.scoresByTime && !isPaused && !isCompleted) {
      const available: number[] = []
      for (const tier of currentItem.scoresByTime) {
        if (elapsedTime <= tier.maxTime) {
          available.push(tier.score)
        }
      }
      setAvailableScores(available)
    }
  }, [elapsedTime, isTimeBased, currentItem, isPaused, isCompleted])

  const handleScore = (score: number, timeSeconds?: number) => {
    const newScores = { ...scores, [currentItem.num]: score }
    setScores(newScores)
    
    const suspended = checkSuspension(newScores)
    
    if (suspended || currentItemIndex + 1 >= CC_ITEMS_CONFIG.length) {
      setIsCompleted(true)
      onComplete(newScores, Object.values(newScores).reduce((a, b) => a + b, 0))
      return
    }
    
    // Avanzar al siguiente ítem
    setCurrentItemIndex(prev => prev + 1)
    setElapsedTime(0)
    setStopwatchKey(prev => prev + 1)
    setShowRetryButton(false)
    setIsPaused(false)
    setAvailableScores([])
  }

  const handleRetry = () => {
    setAttempts({ ...attempts, [currentItem.num]: 2 })
    setShowRetryButton(false)
    setElapsedTime(0)
    setStopwatchKey(prev => prev + 1)
    setIsPaused(false)
    setAvailableScores([])
  }

  const handleTimeEnd = () => {
    if (isTwoAttempts && currentAttempt === 1 && !scores[currentItem?.num]) {
      setShowRetryButton(true)
      setIsPaused(true)
    } else {
      handleScore(0, elapsedTime)
    }
  }

  if (!currentItem || isCompleted) return null

  // Obtener puntaje según tiempo (para mostrar en botones)
  const getScoreLabel = (score: number): string => {
    switch (score) {
      case 7: return '7 (≤30s)'
      case 6: return '6 (31-60s)'
      case 5: return '5 (51-70s)'
      case 4: return '4 (71-120s)'
      default: return '0 - No logrado'
    }
  }

  return (
    <div className="space-y-4">
      {/* Progreso */}
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Construcción con Cubos</span>
          <span className="text-gray-800 font-medium">
            Ítem {currentItem.num}/{CC_ITEMS_CONFIG.length}
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(currentItemIndex / CC_ITEMS_CONFIG.length) * 100}%` }} />
        </div>
      </div>

      {/* Vista del examinador (modelo invertido) */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Vista del examinador (modelo invertido)</p>
        <img 
          src={`/wisc5/cc/cubosinv${String(currentItem.num).padStart(3, '0')}.png`}
          alt={`Modelo invertido ${currentItem.num}`}
          className="mx-auto max-w-full h-auto border border-gray-200 rounded-lg"
          onError={(e) => {
            e.currentTarget.src = '/placeholder-image.png'
          }}
        />
        <p className="text-xs text-gray-400 mt-2 text-center">
          Verifica que la construcción del paciente coincida con este modelo
        </p>
      </div>

      {/* Cronómetro */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <Stopwatch
          key={stopwatchKey}
          timeLimit={currentItem.timeLimit}
          onTimeUpdate={setElapsedTime}
          onTimeEnd={handleTimeEnd}
          autoStart={!showRetryButton && !isPaused}
          isActive={!showRetryButton && !isPaused && !scores[currentItem.num]}
        />
      </div>

      {/* Botones de puntaje */}
      {!showRetryButton && !isPaused && !scores[currentItem.num] && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-3">
            Puntaje para el ítem {currentItem.num}:
            {isTwoAttempts && ` (Intento ${currentAttempt} de 2)`}
          </p>
          
          {isTimeBased ? (
            <div className="grid grid-cols-5 gap-2">
              {[7, 6, 5, 4, 0].map(score => {
                const isAvailable = availableScores.includes(score)
                return (
                  <button
                    key={score}
                    onClick={() => handleScore(score, elapsedTime)}
                    disabled={!isAvailable}
                    className={`py-2 rounded-lg text-sm font-medium transition-all ${
                      isAvailable 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {getScoreLabel(score)}
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {currentItem.maxScore === 2 ? (
                <>
                  <button
                    onClick={() => handleScore(0, elapsedTime)}
                    className="py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50"
                  >
                    0 - No logrado
                  </button>
                  <button
                    onClick={() => handleScore(1, elapsedTime)}
                    className="py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50"
                  >
                    1 - Segundo intento
                  </button>
                  <button
                    onClick={() => handleScore(2, elapsedTime)}
                    className="py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50"
                  >
                    2 - Primer intento
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleScore(0, elapsedTime)}
                    className="py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50"
                  >
                    0 - No logrado
                  </button>
                  <button
                    onClick={() => handleScore(currentItem.maxScore, elapsedTime)}
                    className="py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50"
                  >
                    {currentItem.maxScore} - Logrado
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Botón de segundo intento */}
      {showRetryButton && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <p className="text-sm text-gray-600 mb-3">
            No logró el ítem en el primer intento.
          </p>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Segundo intento
          </button>
        </div>
      )}

      {/* Puntaje acumulado */}
      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-sm text-gray-600">
          Puntaje bruto acumulado: {Object.values(scores).reduce((a, b) => a + b, 0)} / 58
        </p>
      </div>
    </div>
  )
}

// ============================================================
// COMPONENTE PRINCIPAL WISC-5 CONTROL
// ============================================================

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
  const [activeSubtest, setActiveSubtest] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const firstItemSent = useRef(false)

  // Calcular edad y grupo etario
  const calculateAge = (birthDate: Date, evalDate: Date): { years: number; months: number; totalMonths: number } => {
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

  const getAgeGroup = (totalMonths: number): string => {
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

  // Actualizar grupo etario cuando cambia la fecha de nacimiento
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

  // Actualizar puntajes escalados
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

  // Actualizar puntajes compuestos
  useEffect(() => {
    const updateIndexScores = async () => {
      // Por ahora solo CC está implementado
      // Los demás índices se agregarán cuando se implementen las subpruebas
    }
    updateIndexScores()
  }, [scaledScores])

  const handleCcComplete = (itemScores: Record<number, number>, rawTotal: number) => {
    setRawScores({ ...rawScores, CC: rawTotal })
    // Calcular puntaje escalado para CC
    if (ageInfo?.group) {
      fetchScaledScore('CC', rawTotal, ageInfo.group).then(scaled => {
        if (scaled) {
          setScaledScores({ ...scaledScores, CC: scaled })
        }
      })
    }
    setActiveSubtest(null)
  }

  const handleStartTest = () => {
    if (!birthDate) {
      setError('Por favor, ingresa la fecha de nacimiento del paciente')
      return
    }
    setShowQuestionZero(false)
    setError(null)
    setActiveSubtest('CC')
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

      const scoreData: any = {
        session_id: sessionId,
        calculated_at: new Date().toISOString(),
        age_group: ageInfo?.group
      }

      // Guardar puntajes brutos y escalados
      for (const [code, raw] of Object.entries(rawScores)) {
        scoreData[`${code.toLowerCase()}_raw`] = raw
        if (scaledScores[code]) {
          scoreData[`${code.toLowerCase()}_scaled`] = scaledScores[code]
        }
      }

      // Guardar índices compuestos
      for (const [indexCode, idxData] of Object.entries(indexScores)) {
        scoreData[indexCode.toLowerCase()] = idxData.score
        scoreData[`${indexCode.toLowerCase()}_classification`] = idxData.classification
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
          recomendaciones: ''
        }, { onConflict: 'session_id' })

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

  const allSubtestsCompleted = () => {
    // Por ahora solo CC
    return rawScores.CC !== undefined
  }

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
                  Edad: {ageInfo.years} años, {ageInfo.months} meses | Grupo: {ageInfo.group}
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

        {/* Subprueba activa: Construcción con Cubos */}
        {activeSubtest === 'CC' && (
          <CcInterface onComplete={handleCcComplete} onUpdatePatient={onUpdatePatient} />
        )}

        {/* Resumen de subpruebas completadas */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Subpruebas completadas</h3>
          <div className="flex flex-wrap gap-2">
            {rawScores.CC !== undefined && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                CC: {rawScores.CC} pts
              </span>
            )}
            {scaledScores.CC !== undefined && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                PE CC: {scaledScores.CC}
              </span>
            )}
          </div>
        </div>

        {allSubtestsCompleted() && (
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