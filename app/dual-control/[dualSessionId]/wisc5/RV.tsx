'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'

// ============================================================
// CONFIGURACIÓN DE ÍTEMS PARA ROMPECABEZAS VISUALES (RV)
// ============================================================

interface RVItem {
  num: number | string
  correctAnswers: number[]  // 3 opciones correctas
  isPractice: boolean
  timeLimit: number
}

const RV_ITEMS: RVItem[] = [
  { num: 'E', correctAnswers: [1, 2, 6], isPractice: true, timeLimit: 20 },
  { num: 'P', correctAnswers: [3, 4, 5], isPractice: true, timeLimit: 20 },
  { num: 1, correctAnswers: [2, 3, 5], isPractice: false, timeLimit: 20 },
  { num: 2, correctAnswers: [2, 4, 5], isPractice: false, timeLimit: 20 },
  { num: 3, correctAnswers: [2, 3, 4], isPractice: false, timeLimit: 20 },
  { num: 4, correctAnswers: [1, 3, 5], isPractice: false, timeLimit: 20 },
  { num: 5, correctAnswers: [1, 4, 5], isPractice: false, timeLimit: 20 },
  { num: 6, correctAnswers: [1, 2, 6], isPractice: false, timeLimit: 20 },
  { num: 7, correctAnswers: [2, 4, 5], isPractice: false, timeLimit: 20 },
  { num: 8, correctAnswers: [3, 5, 6], isPractice: false, timeLimit: 20 },
  { num: 9, correctAnswers: [1, 2, 5], isPractice: false, timeLimit: 30 },
  { num: 10, correctAnswers: [3, 4, 5], isPractice: false, timeLimit: 30 },
  { num: 11, correctAnswers: [2, 5, 6], isPractice: false, timeLimit: 30 },
  { num: 12, correctAnswers: [1, 3, 6], isPractice: false, timeLimit: 30 },
  { num: 13, correctAnswers: [3, 4, 6], isPractice: false, timeLimit: 30 },
  { num: 14, correctAnswers: [2, 3, 5], isPractice: false, timeLimit: 30 },
  { num: 15, correctAnswers: [2, 3, 4], isPractice: false, timeLimit: 30 },
  { num: 16, correctAnswers: [1, 3, 5], isPractice: false, timeLimit: 30 },
  { num: 17, correctAnswers: [1, 4, 6], isPractice: false, timeLimit: 30 },
  { num: 18, correctAnswers: [1, 2, 4], isPractice: false, timeLimit: 30 },
  { num: 19, correctAnswers: [3, 4, 6], isPractice: false, timeLimit: 30 },
  { num: 20, correctAnswers: [1, 2, 5], isPractice: false, timeLimit: 30 },
  { num: 21, correctAnswers: [2, 5, 6], isPractice: false, timeLimit: 30 },
  { num: 22, correctAnswers: [1, 3, 4], isPractice: false, timeLimit: 30 },
  { num: 23, correctAnswers: [2, 4, 6], isPractice: false, timeLimit: 30 },
  { num: 24, correctAnswers: [3, 5, 6], isPractice: false, timeLimit: 30 },
  { num: 25, correctAnswers: [2, 3, 6], isPractice: false, timeLimit: 30 },
  { num: 26, correctAnswers: [1, 4, 5], isPractice: false, timeLimit: 30 },
  { num: 27, correctAnswers: [1, 4, 6], isPractice: false, timeLimit: 30 },
  { num: 28, correctAnswers: [1, 2, 4], isPractice: false, timeLimit: 30 },
  { num: 29, correctAnswers: [1, 3, 6], isPractice: false, timeLimit: 30 }
]

// ============================================================
// COMPONENTE DE CRONÓMETRO
// ============================================================

interface StopwatchProps {
  timeLimit: number
  onTimeUpdate: (seconds: number) => void
  onTimeEnd: () => void
  onStart?: () => void
  isRunning: boolean
  onToggleRunning: () => void
}

function Stopwatch({ timeLimit, onTimeUpdate, onTimeEnd, onStart, isRunning, onToggleRunning }: StopwatchProps) {
  const [seconds, setSeconds] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => {
          const newSeconds = prev + 1
          onTimeUpdate(newSeconds)
          if (newSeconds >= timeLimit) {
            onToggleRunning()
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
  }, [isRunning, timeLimit, onTimeUpdate, onTimeEnd, onToggleRunning])

  const startTimer = () => {
    setSeconds(0)
    onToggleRunning()
    onStart?.()
  }

  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return mins.toString().padStart(2, '0') + ':' + secs.toString().padStart(2, '0')
  }

  const getProgressPercent = (): number => Math.min((seconds / timeLimit) * 100, 100)
  const isTimeCritical = seconds >= timeLimit - 5

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
      <div className={'text-4xl font-mono font-bold mb-2 transition-colors ' + (isTimeCritical ? 'text-red-600 animate-pulse' : 'text-gray-800')}>
        {formatTime(seconds)}
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={'h-full transition-all duration-1000 ' + (isTimeCritical ? 'bg-red-500' : 'bg-blue-500')}
          style={{ width: getProgressPercent() + '%' }} />
      </div>
      <div className="text-xs text-gray-400 mt-1">Tiempo límite: {formatTime(timeLimit)}</div>
    </div>
  )
}

// ============================================================
// COMPONENTE PRINCIPAL ROMPECABEZAS VISUALES
// ============================================================

interface RVInterfaceProps {
  onComplete: (scores: Record<string | number, number>, rawTotal: number) => void
  onUpdatePatient: (content: any) => void
  patientAge: number
}

export const RVInterface = React.memo(function RVInterface({ onComplete, onUpdatePatient, patientAge }: RVInterfaceProps) {
  // Determinar ítems de inicio según edad
  const getStartItems = (): { first: number; second: number; jumpAfterBacktrack: number } => {
    if (patientAge <= 8) {
      return { first: 1, second: 2, jumpAfterBacktrack: 3 }
    }
    return { first: 5, second: 6, jumpAfterBacktrack: 7 }
  }

  const calculateBonusPoints = (): number => {
    const { first } = getStartItems()
    if (patientAge <= 8) return 0
    return (first - 1)
  }

  const checkBonusEligibility = (scores: Record<string | number, number>): boolean => {
    const { first, second } = getStartItems()
    if (patientAge <= 8) return false
    return scores[first] === 1 && scores[second] === 1
  }

  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    const { first } = getStartItems()
    // Saltar ítems de práctica y encontrar el primer ítem puntuable
    const idx = RV_ITEMS.findIndex(i => i.num === first)
    return idx >= 0 ? idx : 2  // 0=E, 1=P, 2=1
  })
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([])
  const [scores, setScores] = useState<Record<string | number, number>>({})
  const [consecutiveZeros, setConsecutiveZeros] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [cronometroKey, setCronometroKey] = useState(0)
  const [timeEnded, setTimeEnded] = useState(false)
  const [bonusApplied, setBonusApplied] = useState(false)
  const [isGoingBack, setIsGoingBack] = useState(false)
  const [backtrackMode, setBacktrackMode] = useState(false)
  const [failedStartItem, setFailedStartItem] = useState<number | null>(null)
  const [consecutiveSuccessesInBacktrack, setConsecutiveSuccessesInBacktrack] = useState(0)

  const currentItem = RV_ITEMS[currentIndex]
  const isPractice = currentItem?.isPractice || false
  const { first: firstStartItem, second: secondStartItem, jumpAfterBacktrack } = getStartItems()
  const hasBacktrack = patientAge >= 9

  const onCompleteRef = useRef(onComplete)
  const onUpdatePatientRef = useRef(onUpdatePatient)

  useEffect(() => {
    onCompleteRef.current = onComplete
    onUpdatePatientRef.current = onUpdatePatient
  }, [onComplete, onUpdatePatient])

  // Reiniciar selección al cambiar de ítem
  useEffect(() => {
    setSelectedAnswers([])
  }, [currentIndex])

  // Enviar estímulo al display
  useEffect(() => {
    if (currentItem && !isCompleted) {
      const imageName = isPractice
        ? 'rv' + currentItem.num.toString().toLowerCase() + '.png'
        : 'rv' + String(currentItem.num).padStart(3, '0') + '.png'

      onUpdatePatientRef.current({
        type: 'wisc5_rv',
        itemNum: currentItem.num,
        imagePath: '/wisc5/rv/' + imageName,
        isPractice: currentItem.isPractice
      })
    }
  }, [currentItem, isCompleted])

  // Verificar bonus
  useEffect(() => {
    if (!bonusApplied && checkBonusEligibility(scores)) {
      setBonusApplied(true)
      const bonus = calculateBonusPoints()
      console.log('🎉 Bonus de +' + bonus + ' puntos aplicado')
    }
  }, [scores, bonusApplied, firstStartItem, secondStartItem])

  const handleTimeUpdate = useCallback((seconds: number) => {
    setElapsedTime(seconds)
  }, [])

  const handleTimeEnd = useCallback(() => {
    setTimeEnded(true)
  }, [])

  const toggleAnswer = (num: number) => {
    if (scores[currentItem.num] !== undefined || timeEnded) return

    setSelectedAnswers(prev => {
      if (prev.includes(num)) {
        return prev.filter(n => n !== num)
      }
      if (prev.length < 3) {
        return [...prev, num]
      }
      return prev
    })
  }

  const markSkippedItemsAsCorrect = (
    newScores: Record<string | number, number>,
    fromItem: number,
    toItem: number
  ): Record<string | number, number> => {
    const updatedScores = { ...newScores }
    for (let i = toItem + 1; i < fromItem; i++) {
      if (updatedScores[i] === undefined && i >= 1 && !isNaN(i)) {
        updatedScores[i] = 1
        console.log('✓ Ítem ' + i + ' no administrado - se asigna puntaje 1 automáticamente')
      }
    }
    return updatedScores
  }

  const getNextItemIndex = (currentItemNum: number | string, currentScore: number): { nextIndex: number; updatedScores: Record<string | number, number> } => {
    let updatedScores = { ...scores }
    const currentIdx = RV_ITEMS.findIndex(i => i.num === currentItemNum)

    if (!hasBacktrack) {
      let nextIdx = currentIdx + 1
      while (nextIdx < RV_ITEMS.length && updatedScores[RV_ITEMS[nextIdx].num] !== undefined) {
        nextIdx++
      }
      return { nextIndex: nextIdx, updatedScores }
    }

    const numericItem = typeof currentItemNum === 'number' ? currentItemNum : parseInt(currentItemNum as string)

    // Modo retroceso activo
    if (backtrackMode) {
      if (currentScore === 1) {
        const newSuccesses = consecutiveSuccessesInBacktrack + 1
        setConsecutiveSuccessesInBacktrack(newSuccesses)

        if (newSuccesses >= 2) {
          setBacktrackMode(false)
          setConsecutiveSuccessesInBacktrack(0)
          updatedScores = markSkippedItemsAsCorrect(updatedScores, failedStartItem!, numericItem)
          const jumpIndex = RV_ITEMS.findIndex(i => i.num === jumpAfterBacktrack)
          return { nextIndex: jumpIndex >= 0 ? jumpIndex : currentIdx + 1, updatedScores }
        }

        let prevItem = numericItem - 1
        while (prevItem >= 1 && updatedScores[prevItem] !== undefined) {
          prevItem--
        }
        if (prevItem >= 1) {
          return { nextIndex: RV_ITEMS.findIndex(i => i.num === prevItem), updatedScores }
        }
      } else {
        setConsecutiveSuccessesInBacktrack(0)
        let prevItem = numericItem - 1
        while (prevItem >= 1 && updatedScores[prevItem] !== undefined) {
          prevItem--
        }
        if (prevItem >= 1) {
          return { nextIndex: RV_ITEMS.findIndex(i => i.num === prevItem), updatedScores }
        }
      }
      setBacktrackMode(false)
      setConsecutiveSuccessesInBacktrack(0)
    }

    // Verificar si se debe activar secuencia inversa
    const isFirstTwo = numericItem === firstStartItem || numericItem === secondStartItem
    const isFailure = currentScore === 0

    if (isFirstTwo && isFailure) {
      setBacktrackMode(true)
      setFailedStartItem(numericItem)
      setConsecutiveSuccessesInBacktrack(0)

      let prevItem = numericItem - 1
      while (prevItem >= 1 && updatedScores[prevItem] !== undefined) {
        prevItem--
      }
      if (prevItem >= 1) {
        return { nextIndex: RV_ITEMS.findIndex(i => i.num === prevItem), updatedScores }
      }
    }

    let nextIdx = currentIdx + 1
    while (nextIdx < RV_ITEMS.length && updatedScores[RV_ITEMS[nextIdx].num] !== undefined) {
      nextIdx++
    }
    return { nextIndex: nextIdx, updatedScores }
  }

  const handleVerify = () => {
    if (selectedAnswers.length !== 3 || scores[currentItem.num] !== undefined) return

    const currentItemNum = currentItem.num

    // Verificar si las 3 seleccionadas son correctas
    const correct = currentItem.correctAnswers.sort().join(',') === selectedAnswers.sort().join(',')
    const score = correct ? 1 : 0
    const effectiveScore = isPractice ? 0 : score
    let newScores = { ...scores, [currentItemNum]: effectiveScore }
    setScores(newScores)

    if (!isPractice) {
      if (effectiveScore === 0) {
        const newZeros = consecutiveZeros + 1
        setConsecutiveZeros(newZeros)
        if (newZeros >= 3) {
          const total = Object.values(newScores).reduce((a, b) => a + b, 0)
          setIsCompleted(true)
          onCompleteRef.current(newScores, total)
          return
        }
      } else {
        setConsecutiveZeros(0)
      }
    }

    const { nextIndex, updatedScores } = getNextItemIndex(currentItemNum, effectiveScore)
    newScores = updatedScores
    setScores(newScores)

    if (nextIndex >= RV_ITEMS.length) {
      const bonus = bonusApplied || checkBonusEligibility(newScores) ? calculateBonusPoints() : 0
      const total = Object.values(newScores).reduce((a, b) => a + b, 0) + bonus
      setIsCompleted(true)
      onCompleteRef.current(newScores, total)
    } else {
      setCurrentIndex(nextIndex)
      setIsGoingBack(nextIndex < currentIndex)
      setTimeEnded(false)
      setElapsedTime(0)
      setCronometroKey(prev => prev + 1)
    }
  }

  const handleTimeExpired = () => {
    if (scores[currentItem.num] !== undefined) return

    const currentItemNum = currentItem.num
    const newScores = { ...scores, [currentItemNum]: 0 }
    setScores(newScores)

    const newZeros = consecutiveZeros + 1
    setConsecutiveZeros(newZeros)
    if (newZeros >= 3) {
      const total = Object.values(newScores).reduce((a, b) => a + b, 0)
      setIsCompleted(true)
      onCompleteRef.current(newScores, total)
      return
    }

    const { nextIndex, updatedScores } = getNextItemIndex(currentItemNum, 0)
    setScores(updatedScores)

    if (nextIndex >= RV_ITEMS.length) {
      const bonus = bonusApplied || checkBonusEligibility(updatedScores) ? calculateBonusPoints() : 0
      const total = Object.values(updatedScores).reduce((a, b) => a + b, 0) + bonus
      setIsCompleted(true)
      onCompleteRef.current(updatedScores, total)
    } else {
      setCurrentIndex(nextIndex)
      setIsGoingBack(nextIndex < currentIndex)
      setTimeEnded(false)
      setElapsedTime(0)
      setCronometroKey(prev => prev + 1)
    }
  }

  if (!currentItem) return null

  if (isCompleted) {
    const bonus = bonusApplied ? calculateBonusPoints() : 0
    const total = Object.values(scores).reduce((a, b) => a + b, 0) + bonus
    const maxScore = RV_ITEMS.filter(i => !i.isPractice).length

    return (
      <div className="bg-green-50 rounded-lg p-4 text-center">
        <p className="text-green-700 font-medium">Subprueba completada</p>
        <p className="text-sm text-green-600 mt-1">
          Puntaje total: {total} / {maxScore}
          {bonusApplied && (
            <span className="ml-2 text-blue-600">(incluye +{bonus} puntos por bonus)</span>
          )}
        </p>
      </div>
    )
  }

  const bonusPts = calculateBonusPoints()
  const currentRaw = Object.values(scores).reduce((a, b) => a + b, 0)
  const displayScore = bonusApplied ? currentRaw + bonusPts : currentRaw

  return (
    <div className="space-y-4">
      {/* Barra de progreso */}
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Rompecabezas Visuales</span>
          <span className="text-gray-800 font-medium">
            {isPractice ? 'Práctica' : 'Ítem ' + currentItem.num} / {RV_ITEMS.filter(i => !i.isPractice).length}
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full" style={{
            width: (Object.keys(scores).filter(k => k !== 'E' && k !== 'P').length / RV_ITEMS.filter(i => !i.isPractice).length) * 100 + '%'
          }} />
        </div>
        {isGoingBack && <p className="text-xs text-orange-600 mt-1">↩️ Retrocediendo para verificar nivel basal...</p>}
        {backtrackMode && (
          <p className="text-xs text-orange-600 mt-1">🔄 Modo retroceso activo - Éxitos consecutivos: {consecutiveSuccessesInBacktrack}/2</p>
        )}
        {bonusApplied && <p className="text-xs text-blue-600 mt-1">✓ Bonus de +{bonusPts} puntos aplicado</p>}
        {timeEnded && <p className="text-xs text-red-600 mt-1">⏰ Tiempo finalizado</p>}
      </div>

      {/* Cronómetro */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <Stopwatch
          key={cronometroKey}
          timeLimit={currentItem.timeLimit}
          onTimeUpdate={handleTimeUpdate}
          onTimeEnd={handleTimeEnd}
          isRunning={!timeEnded && scores[currentItem.num] === undefined}
          onToggleRunning={() => {}}
        />
      </div>

      {/* Info de respuesta correcta (solo visible para el evaluador) */}
      <div className="bg-blue-50 rounded-lg p-3 text-center">
        <p className="text-sm text-blue-700">
          La imagen se muestra en la pantalla del evaluado. Debe seleccionar 3 opciones.
          <br />
          <strong>Respuestas correctas: {currentItem.correctAnswers.join(', ')}</strong>
        </p>
      </div>

      {/* Botones de selección múltiple (2 filas × 3 columnas) */}
      {scores[currentItem.num] === undefined && !timeEnded && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-3">
            Selecciona las 3 respuestas del evaluado:
            {isPractice && <span className="ml-2 text-xs text-gray-400">(no suma puntos)</span>}
          </p>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[1, 2, 3, 4, 5, 6].map(num => (
              <button
                key={num}
                onClick={() => toggleAnswer(num)}
                className={'py-4 rounded-lg text-xl font-bold transition-all ' + (
                  selectedAnswers.includes(num)
                    ? 'bg-blue-600 text-white shadow-md scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                {num}
              </button>
            ))}
          </div>
          <button
            onClick={handleVerify}
            disabled={selectedAnswers.length !== 3}
            className={'w-full py-3 rounded-lg font-medium transition-colors ' + (
              selectedAnswers.length === 3
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            )}
          >
            {selectedAnswers.length === 0
              ? 'Selecciona 3 opciones'
              : selectedAnswers.length < 3
                ? 'Faltan ' + (3 - selectedAnswers.length) + ' opciones'
                : 'Verificar respuesta'}
          </button>
        </div>
      )}

      {/* Botón para registrar tiempo finalizado */}
      {timeEnded && scores[currentItem.num] === undefined && (
        <div className="bg-yellow-50 rounded-lg p-3 text-center border border-yellow-200">
          <p className="text-yellow-700 text-sm mb-3">⏰ Tiempo finalizado. Respuesta incorrecta.</p>
          <button
            onClick={handleTimeExpired}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm"
          >
            Registrar como incorrecto
          </button>
        </div>
      )}

      {/* Confirmación de ítem respondido */}
      {scores[currentItem.num] !== undefined && (
        <div className={'rounded-lg p-3 text-center ' + (scores[currentItem.num] === 1 ? 'bg-green-50' : 'bg-red-50')}>
          <p className={'text-sm ' + (scores[currentItem.num] === 1 ? 'text-green-700' : 'text-red-700')}>
            ✓ Ítem respondido - {scores[currentItem.num] === 1 ? 'Correcto' : 'Incorrecto'}
            {!isPractice && scores[currentItem.num] === 0 && (
              <span className="ml-2">(Correctas: {currentItem.correctAnswers.join(', ')})</span>
            )}
            {isPractice && <span className="ml-2 text-xs">(no suma al total)</span>}
          </p>
        </div>
      )}

      {/* Puntaje acumulado */}
      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-sm text-gray-600">
          Puntaje bruto acumulado: {displayScore} / {RV_ITEMS.filter(i => !i.isPractice).length}
          {!bonusApplied && patientAge >= 9 && (
            <span className="ml-2 text-xs text-gray-500">
              (Bonus potencial: +{bonusPts} pts si acierta ítems {firstStartItem} y {secondStartItem})
            </span>
          )}
        </p>
      </div>
    </div>
  )
})