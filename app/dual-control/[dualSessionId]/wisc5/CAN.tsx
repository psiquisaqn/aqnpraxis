'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'

const CAN_PARTS = [
  { id: 'aleatorio', name: 'Cancelación Aleatoria', maxItems: 64, timeLimit: 45 },
  { id: 'estructurado', name: 'Cancelación Estructurada', maxItems: 64, timeLimit: 45 }
]

function formatTimeDisplay(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// ============================================================
// COMPONENTE DE CRONÓMETRO POR PARTE (INDEPENDIENTE)
// ============================================================

interface PartStopwatchProps {
  timeLimit: number
  onTimeEnd: () => void
  onTimeUpdate: (seconds: number) => void
}

function PartStopwatch({ timeLimit, onTimeEnd, onTimeUpdate }: PartStopwatchProps) {
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const start = () => {
    setSeconds(0)
    setIsRunning(true)
  }

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => {
          const next = prev + 1
          onTimeUpdate(next)
          if (next >= timeLimit) {
            clearInterval(intervalRef.current!)
            setIsRunning(false)
            onTimeEnd()
            return timeLimit
          }
          return next
        })
      }, 1000)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning, timeLimit, onTimeEnd, onTimeUpdate])

  const percent = Math.min((seconds / timeLimit) * 100, 100)
  const isCritical = seconds >= timeLimit - 5

  if (!isRunning && seconds === 0) {
    return (
      <div className="text-center">
        <button
          onClick={start}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          Iniciar tiempo
        </button>
        <div className="text-xs text-gray-400 mt-1">Tiempo límite: {formatTimeDisplay(timeLimit)}</div>
      </div>
    )
  }

  return (
    <div className="text-center">
      <div className={`text-2xl font-mono font-bold ${isCritical ? 'text-red-600 animate-pulse' : 'text-gray-800'}`}>
        {formatTimeDisplay(seconds)}
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mt-1">
        <div className={`h-full transition-all ${isCritical ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${percent}%` }} />
      </div>
      <div className="text-xs text-gray-400 mt-1">Tiempo límite: {formatTimeDisplay(timeLimit)}</div>
    </div>
  )
}

// ============================================================
// COMPONENTE PRINCIPAL CAN
// ============================================================

interface CANInterfaceProps {
  onComplete: (scores: Record<string, number>, rawTotal: number) => void
  onUpdatePatient: (content: any) => void
  patientAge: number
}

export const CANInterface = React.memo(function CANInterface({ onComplete, onUpdatePatient, patientAge }: CANInterfaceProps) {
  // Estado por cada parte
  const [parts, setParts] = useState(() => {
    const init: Record<string, { correct: number; incorrect: number; elapsed: number; ended: boolean }> = {}
    CAN_PARTS.forEach(part => {
      init[part.id] = { correct: 0, incorrect: 0, elapsed: 0, ended: false }
    })
    return init
  })

  const [isCompleted, setIsCompleted] = useState(false)
  const [reviewLater, setReviewLater] = useState(false)

  const onCompleteRef = useRef(onComplete)
  const onUpdatePatientRef = useRef(onUpdatePatient)

  useEffect(() => {
    onCompleteRef.current = onComplete
    onUpdatePatientRef.current = onUpdatePatient
  }, [onComplete, onUpdatePatient])

  useEffect(() => {
    onUpdatePatientRef.current({
      type: 'wisc5_can',
      instruction: 'Tacha los animales que sean iguales al modelo. Trabaja lo más rápido que puedas.',
      part: 'Cancelación',
      partIndex: 1,
      totalParts: 2
    })
  }, [])

  const updatePart = (id: string, updates: Partial<{ correct: number; incorrect: number; elapsed: number; ended: boolean }>) => {
    setParts(prev => ({ ...prev, [id]: { ...prev[id], ...updates } }))
  }

  const calculateScore = (id: string): number => {
    const part = parts[id]
    const raw = part.correct - part.incorrect
    return Math.max(0, raw)
  }

  const bothPartsEnded = (): boolean => {
    return CAN_PARTS.every(part => parts[part.id].ended === true)
  }

  const totalScore = (): number => {
    return CAN_PARTS.reduce((sum, part) => sum + calculateScore(part.id), 0)
  }

  const handleComplete = () => {
    if (!bothPartsEnded()) {
      alert('Debes completar el tiempo en ambas partes antes de finalizar.')
      return
    }
    const total = totalScore()
    setIsCompleted(true)
    onCompleteRef.current({ CAN: total }, total)
  }

  const handleReviewLater = () => {
    setReviewLater(true)
    setIsCompleted(true)
    onCompleteRef.current({ CAN: -1 }, -1)
  }

  // ============================================================
  // RENDER
  // ============================================================

  if (isCompleted) {
    return (
      <div className={`rounded-lg p-4 text-center ${reviewLater ? 'bg-orange-50' : 'bg-green-50'}`}>
        <p className={`font-medium ${reviewLater ? 'text-orange-700' : 'text-green-700'}`}>
          {reviewLater ? '⏳ Pendiente de revisión' : 'Subprueba completada'}
        </p>
        {!reviewLater && (
          <div className="mt-2 text-sm text-green-600">
            {CAN_PARTS.map(part => (
              <p key={part.id}>{part.name}: {calculateScore(part.id)} / {part.maxItems}</p>
            ))}
            <p className="mt-1 font-medium">Puntaje total: {totalScore()} / 128</p>
          </div>
        )}
        {reviewLater && (
          <p className="text-sm text-orange-600 mt-1">Podrás completar la revisión desde el panel de WISC-V</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-lg p-3">
        <h2 className="text-sm font-semibold text-gray-700">Cancelación</h2>
        <p className="text-xs text-gray-500">Completa ambas partes. Cada una tiene 45 segundos.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CAN_PARTS.map(part => {
          const state = parts[part.id]
          const score = calculateScore(part.id)
          return (
            <div key={part.id} className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">{part.name} ({part.maxItems} ítems)</h3>

              <div className="mb-3">
                <PartStopwatch
                  timeLimit={part.timeLimit}
                  onTimeEnd={() => updatePart(part.id, { ended: true })}
                  onTimeUpdate={(elapsed) => updatePart(part.id, { elapsed })}
                />
              </div>

              {state.ended && (
                <div className="bg-yellow-50 rounded p-2 text-center mb-3">
                  <p className="text-yellow-700 text-xs">⏰ Tiempo finalizado</p>
                </div>
              )}

              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-green-700 mb-1">✓ Correctas</label>
                  <input
                    type="number"
                    value={state.correct}
                    onChange={e => {
                      let val = parseInt(e.target.value) || 0
                      if (val < 0) val = 0
                      if (val > part.maxItems) val = part.maxItems
                      updatePart(part.id, { correct: val })
                    }}
                    disabled={state.ended}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-red-700 mb-1">✗ Incorrectas</label>
                  <input
                    type="number"
                    value={state.incorrect}
                    onChange={e => {
                      let val = parseInt(e.target.value) || 0
                      if (val < 0) val = 0
                      if (val > part.maxItems) val = part.maxItems
                      updatePart(part.id, { incorrect: val })
                    }}
                    disabled={state.ended}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100 disabled:text-gray-400"
                  />
                </div>
                <div className="bg-blue-50 rounded p-2 text-center">
                  <p className="text-sm font-bold text-blue-700">Puntaje: {score}</p>
                  <p className="text-xs text-blue-600">({state.correct} - {state.incorrect})</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleComplete}
          disabled={!bothPartsEnded()}
          className={`flex-1 py-2 rounded-lg font-medium text-sm ${
            bothPartsEnded()
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Completar subprueba
        </button>
        <button
          onClick={handleReviewLater}
          className="flex-1 py-2 bg-orange-50 text-orange-700 rounded-lg text-sm font-medium border border-orange-200 hover:bg-orange-100"
        >
          ⏳ Dejar para revisar después
        </button>
      </div>

      <div className="bg-blue-50 rounded-lg p-3">
        <p className="text-xs text-blue-700">
          <strong>Instrucciones:</strong> Entrega la hoja de Cancelación al evaluado.
          Di: “Tacha los animales que sean iguales al modelo. Trabaja lo más rápido que puedas.”
        </p>
      </div>
    </div>
  )
})