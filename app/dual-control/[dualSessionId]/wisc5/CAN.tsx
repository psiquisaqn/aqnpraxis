'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'

// ============================================================
// CONFIGURACIÓN DE CANCELACIÓN (CAN)
// ============================================================

const CAN_PARTS = [
  { id: 'aleatorio', name: 'Cancelación Aleatoria', maxItems: 64, timeLimit: 45 },
  { id: 'estructurado', name: 'Cancelación Estructurada', maxItems: 64, timeLimit: 45 }
]

// ============================================================
// FUNCIÓN AUXILIAR
// ============================================================

function formatTimeDisplay(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return mins.toString().padStart(2, '0') + ':' + secs.toString().padStart(2, '0')
}

// ============================================================
// COMPONENTE DE CRONÓMETRO (45 SEGUNDOS)
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

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60).toString().padStart(2, '0')
    const s = (t % 60).toString().padStart(2, '0')
    return m + ':' + s
  }
  const pct = Math.min((seconds / timeLimit) * 100, 100)
  const critical = seconds >= timeLimit - 5

  if (!isRunning && seconds === 0) {
    return (
      <div className="text-center">
        <div className="text-3xl font-mono font-bold mb-2 text-gray-800">{formatTime(0)}</div>
        <button onClick={startTimer} className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-base font-medium">
          Iniciar prueba ({formatTime(timeLimit)})
        </button>
        <div className="text-xs text-gray-400 mt-2">Tiempo límite: {formatTime(timeLimit)}</div>
      </div>
    )
  }

  const timeColor = critical ? 'text-red-600 animate-pulse' : 'text-gray-800'
  const barColor = critical ? 'bg-red-500' : 'bg-blue-500'

  return (
    <div className="text-center">
      <div className={'text-4xl font-mono font-bold mb-2 transition-colors ' + timeColor}>{formatTime(seconds)}</div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
        <div className={'h-full transition-all duration-1000 ' + barColor} style={{ width: pct + '%' }} />
      </div>
      <div className="flex gap-2 justify-center">
        {isRunning ? (
          <button onClick={onToggleRunning} className="px-4 py-1.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-sm">Pausar</button>
        ) : (
          <button onClick={onToggleRunning} className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">Reanudar</button>
        )}
        <button onClick={() => { setSeconds(0); onTimeUpdate(0) }} className="px-4 py-1.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm">Reiniciar</button>
      </div>
      <div className="text-xs text-gray-400 mt-2">
        {seconds >= timeLimit ? '⏰ ¡Tiempo finalizado!' : 'Restan ' + formatTime(timeLimit - seconds)}
      </div>
    </div>
  )
}

// ============================================================
// COMPONENTE PRINCIPAL CANCELACIÓN
// ============================================================

interface CANInterfaceProps {
  onComplete: (scores: Record<string, number>, rawTotal: number) => void
  onUpdatePatient: (content: any) => void
  patientAge: number
}

export const CANInterface = React.memo(function CANInterface({ onComplete, onUpdatePatient, patientAge }: CANInterfaceProps) {
  const [currentPartIndex, setCurrentPartIndex] = useState(0)
  const [correct, setCorrect] = useState('')
  const [incorrect, setIncorrect] = useState('')
  const [isCompleted, setIsCompleted] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [timeEnded, setTimeEnded] = useState(false)
  const [reviewLater, setReviewLater] = useState(false)
  const [partScores, setPartScores] = useState<Record<string, number>>({})

  const currentPart = CAN_PARTS[currentPartIndex]
  const onCompleteRef = useRef(onComplete)
  const onUpdatePatientRef = useRef(onUpdatePatient)

  useEffect(() => { onCompleteRef.current = onComplete; onUpdatePatientRef.current = onUpdatePatient }, [onComplete, onUpdatePatient])

  useEffect(() => {
    onUpdatePatientRef.current({
      type: 'wisc5_can',
      instruction: 'Tacha los animales que sean iguales al modelo. Trabaja lo más rápido que puedas.',
      part: currentPart.name,
      partIndex: currentPartIndex + 1,
      totalParts: CAN_PARTS.length,
      isRunning,
      timeRemaining: isRunning ? currentPart.timeLimit - elapsedTime : currentPart.timeLimit
    })
  }, [isRunning, elapsedTime, currentPartIndex])

  const handleTimeUpdate = useCallback((s: number) => setElapsedTime(s), [])
  const handleTimeEnd = useCallback(() => { setTimeEnded(true); setIsRunning(false) }, [])
  const toggleRunning = useCallback(() => setIsRunning(prev => !prev), [])

  const calculatePartScore = (): number => {
    const c = parseInt(correct, 10) || 0
    const i = parseInt(incorrect, 10) || 0
    return Math.max(0, c - i)
  }

  const handleNextPart = () => {
    const c = parseInt(correct, 10)
    const i = parseInt(incorrect, 10)
    if (isNaN(c) || c < 0) { alert('Ingresa una cantidad válida de correctas'); return }
    if (isNaN(i) || i < 0) { alert('Ingresa una cantidad válida de incorrectas'); return }
    const total = c + i
    if (total > currentPart.maxItems) { alert('La suma no puede superar ' + currentPart.maxItems); return }

    const score = calculatePartScore()
    const newScores = { ...partScores, [currentPart.id]: score }
    setPartScores(newScores)

    if (currentPartIndex < CAN_PARTS.length - 1) {
      setCurrentPartIndex(currentPartIndex + 1)
      setCorrect(''); setIncorrect(''); setElapsedTime(0); setTimeEnded(false); setIsRunning(false)
    } else {
      const totalScore = Object.values(newScores).reduce((a, b) => a + b, 0)
      setIsCompleted(true)
      onCompleteRef.current({ CAN: totalScore }, totalScore)
    }
  }

  const handleReviewLater = () => { setReviewLater(true); setIsCompleted(true); onCompleteRef.current({ CAN: -1 }, -1) }

  if (isCompleted) {
    const pend = reviewLater
    const totalScore = Object.values(partScores).reduce((a, b) => a + b, 0)
    return (
      <div className={'rounded-lg p-4 text-center ' + (pend ? 'bg-orange-50' : 'bg-green-50')}>
        <p className={'font-medium ' + (pend ? 'text-orange-700' : 'text-green-700')}>{pend ? '⏳ Pendiente de revisión' : 'Subprueba completada'}</p>
        {!pend && (
          <div className="mt-2">
            {CAN_PARTS.map(part => (
              <p key={part.id} className="text-sm text-green-600">{part.name}: {partScores[part.id] || 0} / {part.maxItems}</p>
            ))}
            <p className="text-sm text-green-600 mt-2 font-medium">Puntaje total: {totalScore} / 128</p>
          </div>
        )}
        {pend && <p className="text-sm text-orange-600 mt-1">Podrás completar la revisión desde el panel de WISC-V</p>}
      </div>
    )
  }

  const rawScorePreview = calculatePartScore()

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Cancelación - {currentPart.name}</span>
          <span className="text-gray-800 font-medium">Parte {currentPartIndex + 1}/{CAN_PARTS.length} | Tiempo: {formatTimeDisplay(currentPart.timeLimit)}</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-1">
          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: (elapsedTime / currentPart.timeLimit) * 100 + '%' }} />
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>Total ítems: {currentPart.maxItems}</span>
          <span>Puntaje = Correctas - Incorrectas</span>
        </div>
        {Object.keys(partScores).length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              {CAN_PARTS.filter((_, i) => i < currentPartIndex).map(p => p.name + ': ' + (partScores[p.id] || 0)).join(' | ')}
            </p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <Stopwatch timeLimit={currentPart.timeLimit} onTimeUpdate={handleTimeUpdate} onTimeEnd={handleTimeEnd}
          isRunning={isRunning} onToggleRunning={toggleRunning} />
      </div>

      {timeEnded && (
        <div className="bg-yellow-50 rounded-lg p-3 text-center border border-yellow-200">
          <p className="text-yellow-700 text-sm">⏰ ¡Tiempo finalizado! Ingresa las cantidades.</p>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-sm font-medium text-gray-700 mb-4">{currentPart.name} ({currentPart.maxItems} ítems):</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-green-700 mb-2">✓ Respuestas correctas</label>
            <div className="flex items-center gap-2">
              <input type="number" value={correct} onChange={e => setCorrect(e.target.value)} min="0" max={currentPart.maxItems}
                placeholder="0" disabled={reviewLater}
                className="w-32 px-4 py-2 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100" />
              <span className="text-sm text-gray-500">de {currentPart.maxItems}</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-red-700 mb-2">✗ Respuestas incorrectas</label>
            <div className="flex items-center gap-2">
              <input type="number" value={incorrect} onChange={e => setIncorrect(e.target.value)} min="0" max={currentPart.maxItems}
                placeholder="0" disabled={reviewLater}
                className="w-32 px-4 py-2 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100" />
              <span className="text-sm text-gray-500">de {currentPart.maxItems}</span>
            </div>
          </div>
          {(correct || incorrect) && (
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total respondidos:</span>
                <span className={'font-medium ' + ((parseInt(correct || '0') + parseInt(incorrect || '0')) > currentPart.maxItems ? 'text-red-600' : 'text-gray-800')}>
                  {(parseInt(correct || '0') + parseInt(incorrect || '0'))} / {currentPart.maxItems}
                </span>
              </div>
            </div>
          )}
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <p className="text-sm text-blue-700 mb-1">Puntaje de esta parte:</p>
            <p className="text-3xl font-bold text-blue-700">{rawScorePreview}</p>
            <p className="text-xs text-blue-600 mt-1">({correct || 0} correctas - {incorrect || 0} incorrectas)</p>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          <button onClick={handleNextPart} disabled={(!correct && !incorrect) || reviewLater}
            className={'w-full py-3 rounded-lg font-medium ' + ((correct || incorrect) && !reviewLater ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-300 cursor-not-allowed')}>
            {currentPartIndex < CAN_PARTS.length - 1 ? 'Siguiente parte →' : 'Completar subprueba'}
          </button>
          <div className="pt-3 border-t border-gray-200">
            {!reviewLater ? (
              <button onClick={handleReviewLater} className="w-full py-2 bg-orange-50 text-orange-700 rounded-lg text-sm border border-orange-200">
                ⏳ Dejar para revisar después
              </button>
            ) : (
              <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                <div className="flex justify-between items-center">
                  <div><p className="text-sm font-medium text-orange-700">⏳ Pendiente</p><p className="text-xs text-orange-600">Revisable desde el panel</p></div>
                  <button onClick={() => setReviewLater(false)} className="px-3 py-1.5 bg-white text-orange-700 rounded text-xs border">Revisar ahora</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-3">
        <p className="text-xs text-blue-700">
          <strong>Instrucciones:</strong> Entrega la hoja de Cancelación al evaluado.
          Di: &ldquo;Tacha los animales que sean iguales al modelo. Trabaja lo más rápido que puedas.&rdquo;
        </p>
      </div>
    </div>
  )
})