'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'

const CAN_PARTS = [
  { id: 'aleatorio', name: 'Cancelación Aleatoria', maxItems: 64, timeLimit: 45 },
  { id: 'estructurado', name: 'Cancelación Estructurada', maxItems: 64, timeLimit: 45 }
]

function formatTimeDisplay(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return mins.toString().padStart(2, '0') + ':' + secs.toString().padStart(2, '0')
}

// Cronómetro individual por parte
function Stopwatch({ timeLimit, isRunning, onToggle, onTimeEnd, onTimeUpdate, elapsed }: {
  timeLimit: number; isRunning: boolean; onToggle: () => void; onTimeEnd: () => void; onTimeUpdate: (s: number) => void; elapsed: number
}) {
  const [seconds, setSeconds] = useState(elapsed)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setSeconds(elapsed)
  }, [elapsed])

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => {
          const newSeconds = prev + 1
          onTimeUpdate(newSeconds)
          if (newSeconds >= timeLimit) {
            onToggle()
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
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isRunning, timeLimit, onTimeUpdate, onTimeEnd, onToggle])

  const start = () => { setSeconds(0); onToggle() }
  const formatTime = (t: number) => `${Math.floor(t/60).toString().padStart(2,'0')}:${(t%60).toString().padStart(2,'0')}`
  const pct = Math.min((seconds / timeLimit) * 100, 100)
  const critical = seconds >= timeLimit - 5

  if (!isRunning && seconds === 0) {
    return (
      <div className="text-center">
        <div className="text-3xl font-mono font-bold mb-2">{formatTime(0)}</div>
        <button onClick={start} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">Iniciar</button>
        <div className="text-xs text-gray-400 mt-2">Tiempo límite: {formatTime(timeLimit)}</div>
      </div>
    )
  }

  return (
    <div className="text-center">
      <div className={`text-4xl font-mono font-bold mb-2 transition-colors ${critical ? 'text-red-600 animate-pulse' : 'text-gray-800'}`}>{formatTime(seconds)}</div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden"><div className={`h-full transition-all duration-1000 ${critical ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: pct + '%' }} /></div>
      <div className="flex gap-2 justify-center mt-2">
        {isRunning ? (
          <button onClick={onToggle} className="px-3 py-1 bg-yellow-500 text-white rounded text-xs">Pausar</button>
        ) : (
          <button onClick={onToggle} className="px-3 py-1 bg-blue-600 text-white rounded text-xs">Reanudar</button>
        )}
        <button onClick={() => { setSeconds(0); onTimeUpdate(0) }} className="px-3 py-1 bg-gray-500 text-white rounded text-xs">Reiniciar</button>
      </div>
    </div>
  )
}

interface CANInterfaceProps {
  onComplete: (scores: Record<string, number>, rawTotal: number) => void
  onUpdatePatient: (content: any) => void
  patientAge: number
}

export const CANInterface = React.memo(function CANInterface({ onComplete, onUpdatePatient, patientAge }: CANInterfaceProps) {
  // Estados para cada parte
  const [partStates, setPartStates] = useState<Record<string, {
    correct: string; incorrect: string; elapsed: number; running: boolean; ended: boolean
  }>>({
    aleatorio: { correct: '', incorrect: '', elapsed: 0, running: false, ended: false },
    estructurado: { correct: '', incorrect: '', elapsed: 0, running: false, ended: false }
  })
  const [isCompleted, setIsCompleted] = useState(false)
  const [reviewLater, setReviewLater] = useState(false)

  const onCompleteRef = useRef(onComplete)
  const onUpdatePatientRef = useRef(onUpdatePatient)

  useEffect(() => { onCompleteRef.current = onComplete; onUpdatePatientRef.current = onUpdatePatient }, [onComplete, onUpdatePatient])

  useEffect(() => {
    onUpdatePatientRef.current({
      type: 'wisc5_can',
      instruction: 'Tacha los animales que sean iguales al modelo. Trabaja lo más rápido que puedas.',
      part: 'Cancelación',
      partIndex: 1,
      totalParts: 2
    })
  }, [])

  const updatePart = (id: string, updates: Partial<{ correct: string; incorrect: string; elapsed: number; running: boolean; ended: boolean }>) => {
    setPartStates(prev => ({ ...prev, [id]: { ...prev[id], ...updates } }))
  }

  const calculatePartScore = (id: string): number => {
    const part = partStates[id]
    const c = parseInt(part.correct, 10) || 0
    const i = parseInt(part.incorrect, 10) || 0
    return Math.max(0, c - i)
  }

  const bothPartsCompleted = (): boolean => {
    return partStates.aleatorio.ended && partStates.estructurado.ended
  }

  const totalScore = (): number => {
    return calculatePartScore('aleatorio') + calculatePartScore('estructurado')
  }

  const handleComplete = () => {
    if (!bothPartsCompleted()) {
      alert('Ambas partes deben finalizar el tiempo.')
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

  if (isCompleted) {
    const pend = reviewLater
    return (
      <div className={`rounded-lg p-4 text-center ${pend ? 'bg-orange-50' : 'bg-green-50'}`}>
        <p className={`font-medium ${pend ? 'text-orange-700' : 'text-green-700'}`}>{pend ? '⏳ Pendiente de revisión' : 'Subprueba completada'}</p>
        {!pend && (
          <div className="mt-2">
            {CAN_PARTS.map(part => (
              <p key={part.id} className="text-sm text-green-600">{part.name}: {calculatePartScore(part.id)} / {part.maxItems}</p>
            ))}
            <p className="text-sm text-green-600 mt-2 font-medium">Puntaje total: {totalScore()} / 128</p>
          </div>
        )}
        {pend && <p className="text-sm text-orange-600 mt-1">Podrás completar la revisión desde el panel de WISC-V</p>}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-lg p-3">
        <h2 className="text-sm font-semibold text-gray-700">Cancelación</h2>
        <p className="text-xs text-gray-500 mt-1">Completa ambas partes. Cada una tiene 45 segundos.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CAN_PARTS.map(part => {
          const state = partStates[part.id]
          const score = calculatePartScore(part.id)
          return (
            <div key={part.id} className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">{part.name} ({part.maxItems} ítems)</h3>
              
              <div className="mb-4">
                <Stopwatch
                  timeLimit={part.timeLimit}
                  isRunning={state.running}
                  onToggle={() => updatePart(part.id, { running: !state.running })}
                  onTimeEnd={() => updatePart(part.id, { ended: true, running: false })}
                  onTimeUpdate={(s) => updatePart(part.id, { elapsed: s })}
                  elapsed={state.elapsed}
                />
              </div>

              {state.ended && (
                <div className="bg-yellow-50 rounded-lg p-2 text-center mb-3">
                  <p className="text-yellow-700 text-xs">⏰ Tiempo finalizado</p>
                </div>
              )}

              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-green-700 mb-1">✓ Correctas</label>
                  <input type="number" value={state.correct} onChange={e => updatePart(part.id, { correct: e.target.value })}
                    min="0" max={part.maxItems} placeholder="0"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-red-700 mb-1">✗ Incorrectas</label>
                  <input type="number" value={state.incorrect} onChange={e => updatePart(part.id, { incorrect: e.target.value })}
                    min="0" max={part.maxItems} placeholder="0"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
                <div className="bg-blue-50 rounded-lg p-2 text-center">
                  <p className="text-sm font-bold text-blue-700">Puntaje: {score}</p>
                  <p className="text-xs text-blue-600">({state.correct || 0} - {state.incorrect || 0})</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex gap-3">
        <button onClick={handleComplete} disabled={!bothPartsCompleted()}
          className={`flex-1 py-3 rounded-lg font-medium ${bothPartsCompleted() ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}>
          Completar subprueba
        </button>
        <button onClick={handleReviewLater}
          className="flex-1 py-3 bg-orange-50 text-orange-700 rounded-lg text-sm font-medium border border-orange-200 hover:bg-orange-100">
          ⏳ Dejar para revisar después
        </button>
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