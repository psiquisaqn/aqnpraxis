'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'

// ============================================================
// CONFIGURACIÓN DE ÍTEMS PARA CONSTRUCCIÓN CON CUBOS (CC)
// ============================================================

interface CCItem {
  num: number
  timeLimit: number
  twoAttempts: boolean
  maxScore: number
  scores?: { first?: number; second?: number; fail?: number; success?: number }
  scoresByTime?: Array<{ maxTime: number; score: number }>
}

const CC_ITEMS_CONFIG: CCItem[] = [
  { num: 1, timeLimit: 30, twoAttempts: true, maxScore: 2, scores: { first: 2, second: 1, fail: 0 } },
  { num: 2, timeLimit: 45, twoAttempts: true, maxScore: 2, scores: { first: 2, second: 1, fail: 0 } },
  { num: 3, timeLimit: 45, twoAttempts: true, maxScore: 2, scores: { first: 2, second: 1, fail: 0 } },
  { num: 4, timeLimit: 45, twoAttempts: false, maxScore: 4, scores: { success: 4, fail: 0 } },
  { num: 5, timeLimit: 45, twoAttempts: false, maxScore: 4, scores: { success: 4, fail: 0 } },
  { num: 6, timeLimit: 75, twoAttempts: false, maxScore: 4, scores: { success: 4, fail: 0 } },
  { num: 7, timeLimit: 75, twoAttempts: false, maxScore: 4, scores: { success: 4, fail: 0 } },
  { num: 8, timeLimit: 75, twoAttempts: false, maxScore: 4, scores: { success: 4, fail: 0 } },
  { num: 9, timeLimit: 75, twoAttempts: false, maxScore: 4, scores: { success: 4, fail: 0 } },
  { num: 10, timeLimit: 120, twoAttempts: false, maxScore: 7, scoresByTime: [
    { maxTime: 30, score: 7 }, { maxTime: 60, score: 6 }, { maxTime: 70, score: 5 },
    { maxTime: 120, score: 4 }, { maxTime: Infinity, score: 0 }
  ]},
  { num: 11, timeLimit: 120, twoAttempts: false, maxScore: 7, scoresByTime: [
    { maxTime: 30, score: 7 }, { maxTime: 60, score: 6 }, { maxTime: 70, score: 5 },
    { maxTime: 120, score: 4 }, { maxTime: Infinity, score: 0 }
  ]},
  { num: 12, timeLimit: 120, twoAttempts: false, maxScore: 7, scoresByTime: [
    { maxTime: 30, score: 7 }, { maxTime: 60, score: 6 }, { maxTime: 70, score: 5 },
    { maxTime: 120, score: 4 }, { maxTime: Infinity, score: 0 }
  ]},
  { num: 13, timeLimit: 120, twoAttempts: false, maxScore: 7, scoresByTime: [
    { maxTime: 30, score: 7 }, { maxTime: 60, score: 6 }, { maxTime: 70, score: 5 },
    { maxTime: 120, score: 4 }, { maxTime: Infinity, score: 0 }
  ]}
]

// ============================================================
// FUNCIONES DE APOYO
// ============================================================

/**
 * Determina el ítem de inicio según edad (WISC-V Chile)
 * 6-7 años: Ítem 1
 * 8-16 años: Ítem 3
 */
const getStartingItem = (years: number): number => years <= 7 ? 1 : 3

/**
 * Verifica si el niño es elegible para puntos bonus.
 * El bonus se otorga solo si:
 * - Tiene ≥8 años (empieza en ítem 3)
 * - Acierta los ítems 3 y 4 con puntuación máxima
 * El bonus representa los ítems 1 y 2 no administrados (2 pts cada uno = 4 pts)
 */
const checkBonusEligibility = (scores: Record<number, number>, patientAge: number): boolean => {
  if (patientAge <= 7) return false
  // Ítem 3 vale 2 puntos máximo, Ítem 4 vale 4 puntos máximo
  return scores[3] === 2 && scores[4] === 4
}

/**
 * Calcula los puntos bonus (4 puntos para niños ≥8 años que aciertan ítems 3 y 4)
 */
const getBonusPoints = (scores: Record<number, number>, patientAge: number): number => {
  return checkBonusEligibility(scores, patientAge) ? 4 : 0
}

/**
 * Determina el siguiente ítem cuando hay un fallo (puntaje 0)
 * Implementa la secuencia inversa según manual WISC-V
 */
const getNextItemOnFailure = (failedItem: number, currentScores: Record<number, number>): number | null => {
  // Si falla ítem 3 o 4, retroceder a ítem 2
  if ((failedItem === 3 || failedItem === 4) && currentScores[2] === undefined) {
    return 2
  }
  // Si falla ítem 2, retroceder a ítem 1
  if (failedItem === 2 && currentScores[1] === undefined) {
    return 1
  }
  // Si falla ítem 1 o ya completó retroceso, saltar a ítem 5
  if (failedItem === 1 || failedItem === 2 || failedItem === 3 || failedItem === 4) {
    // Buscar el siguiente ítem no administrado desde 5 en adelante
    for (let i = 5; i <= 13; i++) {
      if (currentScores[i] === undefined) return i
    }
    return null
  }
  // Para ítems ≥5, avanzar normalmente
  const nextItem = failedItem + 1
  if (nextItem <= 13 && currentScores[nextItem] === undefined) return nextItem
  return null
}

/**
 * Marca ítems no administrados como correctos cuando el niño acredita en retroceso
 */
const markSkippedItemsAsCorrect = (
  currentScores: Record<number, number>,
  successItem: number,
  originalFailedItem: number
): Record<number, number> => {
  const updatedScores = { ...currentScores }
  
  // Si acreditó ítem 2 después de fallar ítem 3/4, marcar ítem 1 como correcto
  if (successItem === 2 && (originalFailedItem === 3 || originalFailedItem === 4)) {
    if (updatedScores[1] === undefined) {
      updatedScores[1] = 2
      console.log('✓ Ítem 1 no administrado - se asigna puntaje 2 automáticamente')
    }
  }
  
  return updatedScores
}

// ============================================================
// COMPONENTE DE CRONÓMETRO (INLINE)
// ============================================================

interface StopwatchProps {
  timeLimit: number
  onTimeUpdate: (seconds: number) => void
  onTimeEnd: () => void
  onStart?: () => void
}

function Stopwatch({ timeLimit, onTimeUpdate, onTimeEnd, onStart }: StopwatchProps) {
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => {
          const newSeconds = prev + 1
          onTimeUpdate(newSeconds)
          if (newSeconds >= timeLimit) {
            setIsRunning(false)
            onTimeEnd()
            return timeLimit
          }
          return newSeconds
        })
      }, 1000)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning, timeLimit, onTimeUpdate, onTimeEnd])

  const startTimer = () => {
    setSeconds(0)
    setIsRunning(true)
    onStart?.()
  }

  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getProgressPercent = (): number => Math.min((seconds / timeLimit) * 100, 100)

  if (!isRunning && seconds === 0) {
    return (
      <div className="text-center">
        <div className="text-3xl font-mono font-bold mb-2">{formatTime(0)}</div>
        <button onClick={startTimer} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
          Iniciar tiempo
        </button>
        <div className="text-xs text-gray-400 mt-2">Tiempo límite: {formatTime(timeLimit)}</div>
      </div>
    )
  }

  return (
    <div className="text-center">
      <div className="text-3xl font-mono font-bold mb-2">{formatTime(seconds)}</div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${getProgressPercent()}%` }} />
      </div>
      <div className="text-xs text-gray-400 mt-1">Tiempo límite: {formatTime(timeLimit)}</div>
    </div>
  )
}

// ============================================================
// COMPONENTE PRINCIPAL CC
// ============================================================

interface CCInterfaceProps {
  onComplete: (scores: Record<number, number>, rawTotal: number) => void
  onUpdatePatient: (content: any) => void
  patientAge: number
}

export const CCInterface = React.memo(function CCInterface({ onComplete, onUpdatePatient, patientAge }: CCInterfaceProps) {
  const [currentItemNum, setCurrentItemNum] = useState<number | null>(() => getStartingItem(patientAge))
  const [scores, setScores] = useState<Record<number, number>>({})
  const [attempts, setAttempts] = useState<Record<number, number>>({})
  const [showRetryButton, setShowRetryButton] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [cronometroKey, setCronometroKey] = useState(0)
  const [availableScores, setAvailableScores] = useState<number[]>([])
  const [isPaused, setIsPaused] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [timeEnded, setTimeEnded] = useState(false)
  const [isGoingBack, setIsGoingBack] = useState(false)
  const [bonusApplied, setBonusApplied] = useState(false)
  const [failedStartItem, setFailedStartItem] = useState<number | null>(null)
  
  // Referencias estables
  const sentItemsRef = useRef<Set<number>>(new Set())
  const onCompleteRef = useRef(onComplete)
  const onUpdatePatientRef = useRef(onUpdatePatient)

  useEffect(() => {
    onCompleteRef.current = onComplete
    onUpdatePatientRef.current = onUpdatePatient
  }, [onComplete, onUpdatePatient])

  const currentItem = CC_ITEMS_CONFIG.find(i => i.num === currentItemNum)
  const isTwoAttempts = currentItem?.twoAttempts || false
  const currentAttempt = attempts[currentItem?.num || 0] || 1
  const isTimeBased = currentItem?.scoresByTime !== undefined

  // Verificar bonus al actualizar scores
  useEffect(() => {
    if (!bonusApplied && checkBonusEligibility(scores, patientAge)) {
      setBonusApplied(true)
      console.log('🎉 Bonus de +4 puntos aplicado por acertar ítems 3 y 4')
    }
  }, [scores, bonusApplied, patientAge])

  const handleTimeUpdate = useCallback((seconds: number) => {
    setElapsedTime(seconds)
  }, [])

  const handleTimeEnd = useCallback(() => {
    setTimeEnded(true)
  }, [])

  const sendStimulus = useCallback(() => {
    if (currentItem && !sentItemsRef.current.has(currentItem.num)) {
      sentItemsRef.current.add(currentItem.num)
      onUpdatePatientRef.current({
        type: 'wisc5_cc',
        stimulusNum: currentItem.num,
        instructions: 'Construye la figura usando los cubos. Observa el modelo y repite la construcción.',
        twoAttempts: isTwoAttempts,
        currentAttempt: currentAttempt,
        totalItems: CC_ITEMS_CONFIG.length
      })
    }
  }, [currentItem, isTwoAttempts, currentAttempt])

  const checkSuspension = (newScores: Record<number, number>): boolean => {
    const items = Object.keys(newScores).map(Number).sort((a, b) => a - b)
    if (items.length >= 2) {
      const lastTwo = items.slice(-2)
      if (newScores[lastTwo[0]] === 0 && newScores[lastTwo[1]] === 0) return true
    }
    return false
  }

  useEffect(() => {
    if (isTimeBased && currentItem?.scoresByTime && !isPaused && !isCompleted && !timeEnded) {
      const available: number[] = []
      for (const tier of currentItem.scoresByTime) {
        if (elapsedTime <= tier.maxTime) available.push(tier.score)
      }
      setAvailableScores(available)
    }
  }, [elapsedTime, isTimeBased, currentItem, isPaused, isCompleted, timeEnded])

  const handleScore = (score: number, timeSeconds?: number) => {
    let newScores = { ...scores, [currentItemNum!]: score }
    
    // Verificar suspensión (2 fallos consecutivos)
    if (checkSuspension(newScores)) {
      setScores(newScores)
      const bonusPoints = getBonusPoints(newScores, patientAge)
      const total = Object.values(newScores).reduce((a, b) => a + b, 0) + bonusPoints
      setIsCompleted(true)
      onCompleteRef.current(newScores, total)
      return
    }
    
    let nextItem: number | null = null
    let shouldMarkSkipped = false
    
    // Lógica de retroceso y avance
    if (score === 0 && patientAge >= 8) {
      // Fallo - verificar si necesita retroceso
      const failureNext = getNextItemOnFailure(currentItemNum!, newScores)
      
      if (failureNext && failureNext < currentItemNum!) {
        // Está retrocediendo
        setIsGoingBack(true)
        setFailedStartItem(currentItemNum!)
        nextItem = failureNext
      } else {
        // Avance normal
        nextItem = failureNext
        setIsGoingBack(false)
      }
    } else if (score > 0 && isGoingBack && patientAge >= 8) {
      // Éxito durante retroceso
      shouldMarkSkipped = true
      
      // Marcar ítems no administrados como correctos
      if (failedStartItem) {
        newScores = markSkippedItemsAsCorrect(newScores, currentItemNum!, failedStartItem)
      }
      
      // Después de acreditar en retroceso, saltar al ítem 5
      nextItem = 5
      setIsGoingBack(false)
      setFailedStartItem(null)
    } else {
      // Avance normal
      nextItem = currentItemNum! + 1
      while (nextItem <= 13 && newScores[nextItem] !== undefined) {
        nextItem++
      }
      setIsGoingBack(false)
    }
    
    setScores(newScores)
    
    // Verificar finalización
    if (!nextItem || nextItem > 13) {
      const bonusPoints = getBonusPoints(newScores, patientAge)
      const total = Object.values(newScores).reduce((a, b) => a + b, 0) + bonusPoints
      setIsCompleted(true)
      onCompleteRef.current(newScores, total)
    } else {
      setCurrentItemNum(nextItem)
      setTimeEnded(false)
      setElapsedTime(0)
      setCronometroKey(prev => prev + 1)
      setShowRetryButton(false)
      setIsPaused(false)
      setAvailableScores([])
    }
  }

  const handleRetry = () => {
    setAttempts({ ...attempts, [currentItemNum!]: 2 })
    setShowRetryButton(false)
    setTimeEnded(false)
    setElapsedTime(0)
    setCronometroKey(prev => prev + 1)
    setIsPaused(false)
    setAvailableScores([])
  }

  if (!currentItem) return null

  if (isCompleted) {
    const bonusPoints = getBonusPoints(scores, patientAge)
    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0) + bonusPoints
    
    return (
      <div className="bg-green-50 rounded-lg p-4 text-center">
        <p className="text-green-700 font-medium">Subprueba completada</p>
        <p className="text-sm text-green-600 mt-1">
          Puntaje total: {totalScore} / 58
          {bonusPoints > 0 && (
            <span className="ml-2 text-blue-600">
              (incluye +{bonusPoints} puntos por bonus de ítems 1-2)
            </span>
          )}
        </p>
      </div>
    )
  }

  const getScoreLabel = (score: number): string => {
    switch (score) {
      case 7: return '7 (≤30s)'
      case 6: return '6 (31-60s)'
      case 5: return '5 (51-70s)'
      case 4: return '4 (71-120s)'
      default: return '0 - No logrado'
    }
  }

  const isScoreDisabled = (score: number): boolean => {
    if (timeEnded && score !== 0) return true
    if (isTimeBased && !availableScores.includes(score)) return true
    return false
  }

  const bonusPoints = getBonusPoints(scores, patientAge)
  const currentTotal = Object.values(scores).reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-4">
      {/* Barra de progreso */}
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Construcción con Cubos</span>
          <span className="text-gray-800 font-medium">Ítem {currentItem.num}/{CC_ITEMS_CONFIG.length}</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full" style={{ 
            width: `${((currentItemNum! - 1) / CC_ITEMS_CONFIG.length) * 100}%` 
          }} />
        </div>
        {patientAge >= 8 && !bonusApplied && (
          <p className="text-xs text-gray-500 mt-1">
            Bonus potencial: +4 pts si acierta ítems 3 y 4
          </p>
        )}
        {bonusApplied && (
          <p className="text-xs text-blue-600 mt-1">✓ Bonus de +4 puntos aplicado</p>
        )}
        {isGoingBack && (
          <p className="text-xs text-orange-600 mt-1">↩️ Retrocediendo por fallo en ítem {failedStartItem}...</p>
        )}
      </div>

      {/* Imagen del modelo */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Vista del examinador (modelo invertido)</p>
        <img 
          src={`/wisc5/cc/cubosinv${String(currentItem.num).padStart(3, '0')}.png`}
          alt={`Modelo invertido ${currentItem.num}`}
          className="mx-auto max-w-full h-auto border border-gray-200 rounded-lg"
          onError={(e) => { e.currentTarget.src = '/placeholder-image.png' }}
        />
        <p className="text-xs text-gray-400 mt-2 text-center">
          Verifica que la construcción del paciente coincida con este modelo
        </p>
      </div>

      {/* Cronómetro */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <Stopwatch
          key={cronometroKey}
          timeLimit={currentItem.timeLimit}
          onTimeUpdate={handleTimeUpdate}
          onTimeEnd={handleTimeEnd}
          onStart={sendStimulus}
        />
      </div>

      {/* Aviso de tiempo finalizado */}
      {timeEnded && (
        <div className="bg-yellow-50 rounded-lg p-3 text-center border border-yellow-200">
          <p className="text-yellow-700 text-sm">⏰ Tiempo finalizado. Solo puede registrar puntaje 0.</p>
        </div>
      )}

      {/* Botones de puntaje */}
      {!showRetryButton && !isPaused && scores[currentItem.num] === undefined && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-3">
            Puntaje para el ítem {currentItem.num}:
            {isTwoAttempts && ` (Intento ${currentAttempt} de 2)`}
          </p>
          {isTimeBased ? (
            <div className="grid grid-cols-5 gap-2">
              {[7, 6, 5, 4, 0].map(score => (
                <button 
                  key={score} 
                  onClick={() => handleScore(score, elapsedTime)} 
                  disabled={isScoreDisabled(score)}
                  className={`py-2 rounded-lg text-sm font-medium transition-all ${
                    !isScoreDisabled(score) 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {getScoreLabel(score)}
                </button>
              ))}
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
                    disabled={timeEnded} 
                    className={`py-2 rounded-lg border border-gray-200 text-sm ${
                      timeEnded ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                    }`}
                  >
                    1 - Segundo intento
                  </button>
                  <button 
                    onClick={() => handleScore(2, elapsedTime)} 
                    disabled={timeEnded} 
                    className={`py-2 rounded-lg border border-gray-200 text-sm ${
                      timeEnded ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                    }`}
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
                    disabled={timeEnded} 
                    className={`py-2 rounded-lg border border-gray-200 text-sm ${
                      timeEnded ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                    }`}
                  >
                    {currentItem.maxScore} - Logrado
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Botón de reintento (segundo intento) */}
      {showRetryButton && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <p className="text-sm text-gray-600 mb-3">No logró el ítem en el primer intento.</p>
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
          Puntaje bruto acumulado: {currentTotal} / 58
          {patientAge >= 8 && !bonusApplied && (
            <span className="ml-2 text-xs text-gray-500">
              (Bonus potencial: +4 pts)
            </span>
          )}
          {bonusApplied && (
            <span className="ml-2 text-xs text-blue-600">
              (+4 bonus = {currentTotal + 4} total)
            </span>
          )}
        </p>
      </div>
    </div>
  )
})