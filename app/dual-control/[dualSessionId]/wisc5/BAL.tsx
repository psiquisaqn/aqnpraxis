'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'

// ============================================================
// CONFIGURACIÓN DE ÍTEMS PARA BALANZAS (BAL)
// ============================================================

interface BALItem {
  num: number | string
  correctAnswer: number
  isPractice: boolean
  timeLimit: number
}

const BAL_ITEMS: BALItem[] = [
  { num: 'PA', correctAnswer: 2, isPractice: true, timeLimit: 30 },
  { num: 1, correctAnswer: 3, isPractice: false, timeLimit: 30 },
  { num: 2, correctAnswer: 1, isPractice: false, timeLimit: 30 },
  { num: 3, correctAnswer: 4, isPractice: false, timeLimit: 30 },
  { num: 'PB', correctAnswer: 2, isPractice: true, timeLimit: 30 },
  { num: 4, correctAnswer: 5, isPractice: false, timeLimit: 30 },
  { num: 5, correctAnswer: 3, isPractice: false, timeLimit: 30 },
  { num: 6, correctAnswer: 3, isPractice: false, timeLimit: 30 },
  { num: 7, correctAnswer: 4, isPractice: false, timeLimit: 30 },
  { num: 8, correctAnswer: 4, isPractice: false, timeLimit: 30 },
  { num: 9, correctAnswer: 1, isPractice: false, timeLimit: 30 },
  { num: 10, correctAnswer: 3, isPractice: false, timeLimit: 30 },
  { num: 11, correctAnswer: 4, isPractice: false, timeLimit: 30 },
  { num: 12, correctAnswer: 5, isPractice: false, timeLimit: 30 },
  { num: 13, correctAnswer: 2, isPractice: false, timeLimit: 30 },
  { num: 14, correctAnswer: 2, isPractice: false, timeLimit: 30 },
  { num: 15, correctAnswer: 3, isPractice: false, timeLimit: 30 },
  { num: 16, correctAnswer: 1, isPractice: false, timeLimit: 30 },
  { num: 17, correctAnswer: 5, isPractice: false, timeLimit: 30 },
  { num: 18, correctAnswer: 2, isPractice: false, timeLimit: 30 },
  { num: 19, correctAnswer: 3, isPractice: false, timeLimit: 30 },
  { num: 20, correctAnswer: 4, isPractice: false, timeLimit: 30 },
  { num: 21, correctAnswer: 4, isPractice: false, timeLimit: 30 },
  { num: 22, correctAnswer: 2, isPractice: false, timeLimit: 30 },
  { num: 23, correctAnswer: 1, isPractice: false, timeLimit: 30 },
  { num: 24, correctAnswer: 5, isPractice: false, timeLimit: 30 },
  { num: 25, correctAnswer: 2, isPractice: false, timeLimit: 30 },
  { num: 26, correctAnswer: 1, isPractice: false, timeLimit: 30 },
  { num: 27, correctAnswer: 5, isPractice: false, timeLimit: 30 },
  { num: 28, correctAnswer: 3, isPractice: false, timeLimit: 30 },
  { num: 29, correctAnswer: 5, isPractice: false, timeLimit: 30 },
  { num: 30, correctAnswer: 1, isPractice: false, timeLimit: 30 },
  { num: 31, correctAnswer: 4, isPractice: false, timeLimit: 30 },
  { num: 32, correctAnswer: 1, isPractice: false, timeLimit: 30 },
  { num: 33, correctAnswer: 4, isPractice: false, timeLimit: 30 },
  { num: 34, correctAnswer: 5, isPractice: false, timeLimit: 30 }
]

// ============================================================
// COMPONENTE DE CRONÓMETRO (30 SEGUNDOS)
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
          if (newSeconds >= timeLimit) { onToggleRunning(); onTimeEnd(); return timeLimit }
          return newSeconds
        })
      }, 1000)
    } else if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isRunning, timeLimit, onTimeUpdate, onTimeEnd, onToggleRunning])

  const startTimer = () => { setSeconds(0); onToggleRunning(); onStart?.() }
  const formatTime = (t: number) => `${Math.floor(t/60).toString().padStart(2,'0')}:${(t%60).toString().padStart(2,'0')}`
  const pct = Math.min((seconds / timeLimit) * 100, 100)
  const critical = seconds >= timeLimit - 5

  if (!isRunning && seconds === 0) {
    return (
      <div className="text-center">
        <div className="text-3xl font-mono font-bold mb-2">{formatTime(0)}</div>
        <button onClick={startTimer} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">Iniciar tiempo</button>
        <div className="text-xs text-gray-400 mt-2">Tiempo límite: {formatTime(timeLimit)}</div>
      </div>
    )
  }

  return (
    <div className="text-center">
      <div className={`text-4xl font-mono font-bold mb-2 transition-colors ${critical ? 'text-red-600 animate-pulse' : 'text-gray-800'}`}>{formatTime(seconds)}</div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden"><div className={`h-full transition-all duration-1000 ${critical ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: pct + '%' }} /></div>
      <div className="text-xs text-gray-400 mt-1">Tiempo límite: {formatTime(timeLimit)}</div>
    </div>
  )
}

// ============================================================
// COMPONENTE PRINCIPAL BALANZAS
// ============================================================

interface BALInterfaceProps {
  onComplete: (scores: Record<string | number, number>, rawTotal: number) => void
  onUpdatePatient: (content: any) => void
  patientAge: number
}

export const BALInterface = React.memo(function BALInterface({ onComplete, onUpdatePatient, patientAge }: BALInterfaceProps) {
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [scores, setScores] = useState<Record<string | number, number>>({})
  const [consecutiveZeros, setConsecutiveZeros] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [cronometroKey, setCronometroKey] = useState(0)
  const [timeEnded, setTimeEnded] = useState(false)

  const currentItem = BAL_ITEMS[currentIndex]
  const isPractice = currentItem?.isPractice || false

  const onCompleteRef = useRef(onComplete)
  const onUpdatePatientRef = useRef(onUpdatePatient)

  useEffect(() => { onCompleteRef.current = onComplete; onUpdatePatientRef.current = onUpdatePatient }, [onComplete, onUpdatePatient])

  useEffect(() => {
    if (currentItem && !isCompleted) {
      const imageName = isPractice ? `bal${currentItem.num.toString().toLowerCase()}.png` : `bal${String(currentItem.num).padStart(3, '0')}.png`
      onUpdatePatientRef.current({
        type: 'wisc5_bal', itemNum: currentItem.num, imagePath: `/wisc5/bal/${imageName}`, isPractice: currentItem.isPractice
      })
    }
  }, [currentItem, isCompleted])

  const handleTimeUpdate = useCallback((s: number) => setElapsedTime(s), [])
  const handleTimeEnd = useCallback(() => setTimeEnded(true), [])

  const getCurrentImagePath = (): string => {
    if (!currentItem) return ''
    const imageName = isPractice ? `bal${currentItem.num.toString().toLowerCase()}.png` : `bal${String(currentItem.num).padStart(3, '0')}.png`
    return `/wisc5/bal/${imageName}`
  }

  const handleAnswer = (selected: number) => {
    if (scores[currentItem.num] !== undefined) return
    const isCorrect = selected === currentItem.correctAnswer
    const score = isCorrect ? 1 : 0
    const effectiveScore = isPractice ? 0 : score
    const newScores = { ...scores, [currentItem.num]: effectiveScore }
    setScores(newScores)
    setSelectedAnswer(null)

    if (!isPractice) {
      if (effectiveScore === 0) {
        const newZeros = consecutiveZeros + 1
        setConsecutiveZeros(newZeros)
        if (newZeros >= 3) { setIsCompleted(true); onCompleteRef.current(newScores, Object.values(newScores).reduce((a, b) => a + b, 0)); return }
      } else { setConsecutiveZeros(0) }
    }

    let nextIdx = currentIndex + 1
    while (nextIdx < BAL_ITEMS.length && newScores[BAL_ITEMS[nextIdx].num] !== undefined) nextIdx++
    if (nextIdx >= BAL_ITEMS.length) { setIsCompleted(true); onCompleteRef.current(newScores, Object.values(newScores).reduce((a, b) => a + b, 0)) }
    else { setCurrentIndex(nextIdx); setTimeEnded(false); setElapsedTime(0); setCronometroKey(prev => prev + 1) }
  }

  if (!currentItem) return null

  if (isCompleted) {
    return (
      <div className="bg-green-50 rounded-lg p-4 text-center">
        <p className="text-green-700 font-medium">Subprueba completada</p>
        <p className="text-sm text-green-600 mt-1">Puntaje total: {Object.values(scores).reduce((a, b) => a + b, 0)} / {BAL_ITEMS.filter(i => !i.isPractice).length}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Barra de progreso con número de ítem grande */}
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-gray-600 text-sm">Balanzas</span>
          <span className="text-3xl font-bold text-gray-800">
            {isPractice ? currentItem.num : currentItem.num}
          </span>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{isPractice ? 'Práctica' : 'Ítem actual'}</span>
          <span>de {BAL_ITEMS.filter(i => !i.isPractice).length}</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(Object.keys(scores).filter(k => k !== 'PA' && k !== 'PB').length / BAL_ITEMS.filter(i => !i.isPractice).length) * 100}%` }} />
        </div>
        {timeEnded && <p className="text-xs text-red-600 mt-1">⏰ Tiempo finalizado</p>}
      </div>

      {/* Cronómetro */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <Stopwatch key={cronometroKey} timeLimit={currentItem.timeLimit} onTimeUpdate={handleTimeUpdate} onTimeEnd={handleTimeEnd}
          isRunning={!timeEnded && scores[currentItem.num] === undefined} onToggleRunning={() => {}} />
      </div>

      {/* Imagen de estímulo (visible para el evaluador) */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-sm font-medium text-gray-700 mb-3 text-center">📷 Estímulo visual (misma imagen que ve el evaluado):</p>
        <img 
          src={getCurrentImagePath()} 
          alt={`Balanza ${currentItem.num}`}
          className="mx-auto max-w-full h-auto border border-gray-200 rounded-lg shadow-sm"
          onError={(e) => { e.currentTarget.src = '/placeholder-image.png' }}
        />
        <div className="mt-3 p-2 bg-blue-50 rounded text-center">
          <p className="text-sm text-blue-700"><strong>Respuesta correcta: {currentItem.correctAnswer}</strong></p>
        </div>
      </div>

      {/* Botones de respuesta */}
      {scores[currentItem.num] === undefined && !timeEnded && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-3">Respuesta del evaluado:{isPractice && <span className="ml-2 text-xs text-gray-400">(no suma puntos)</span>}</p>
          <div className="grid grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map(num => (
              <button key={num} onClick={() => handleAnswer(num)}
                className={`py-3 rounded-lg text-lg font-medium transition-all ${selectedAnswer === num ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{num}</button>
            ))}
          </div>
        </div>
      )}

      {timeEnded && scores[currentItem.num] === undefined && (
        <div className="bg-yellow-50 rounded-lg p-3 text-center border border-yellow-200">
          <p className="text-yellow-700 text-sm mb-3">⏰ Tiempo finalizado. Respuesta incorrecta.</p>
          <button onClick={() => handleAnswer(-1)} className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm">Registrar como incorrecto</button>
        </div>
      )}

      {scores[currentItem.num] !== undefined && (
        <div className={`rounded-lg p-3 text-center ${scores[currentItem.num] === 1 ? 'bg-green-50' : 'bg-red-50'}`}>
          <p className={`text-sm ${scores[currentItem.num] === 1 ? 'text-green-700' : 'text-red-700'}`}>
            ✓ Ítem respondido - {scores[currentItem.num] === 1 ? 'Correcto' : 'Incorrecto'}
            {isPractice && <span className="ml-2 text-xs">(no suma al total)</span>}
          </p>
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-sm text-gray-600">Puntaje bruto acumulado: {Object.values(scores).reduce((a, b) => a + b, 0)} / {BAL_ITEMS.filter(i => !i.isPractice).length}</p>
      </div>
    </div>
  )
})