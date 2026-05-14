'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'

// ============================================================
// CONFIGURACIÓN DE BÚSQUEDA DE SÍMBOLOS (BS)
// ============================================================

const BS_CONFIG = {
  A: {
    name: 'Forma A (6-7 años)',
    totalItems: 40,
    maxScore: 42,
    hasBonus: true,
  },
  B: {
    name: 'Forma B (8-16 años)',
    totalItems: 60,
    maxScore: 60,
    hasBonus: false,
  }
}

// ============================================================
// COMPONENTE DE CRONÓMETRO (120 SEGUNDOS)
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
  const isTimeCritical = seconds >= timeLimit - 10

  if (!isRunning && seconds === 0) {
    return (
      <div className="text-center">
        <div className="text-4xl font-mono font-bold mb-2 text-gray-800">{formatTime(0)}</div>
        <button onClick={startTimer} className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-base font-medium">
          Iniciar prueba (120 segundos)
        </button>
        <div className="text-xs text-gray-400 mt-2">Tiempo límite: 2 minutos</div>
      </div>
    )
  }

  const timeColor = isTimeCritical ? 'text-red-600 animate-pulse' : 'text-gray-800'
  const barColor = isTimeCritical ? 'bg-red-500' : 'bg-blue-500'

  return (
    <div className="text-center">
      <div className={'text-5xl font-mono font-bold mb-2 transition-colors ' + timeColor}>{formatTime(seconds)}</div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
        <div className={'h-full transition-all duration-1000 ' + barColor} style={{ width: getProgressPercent() + '%' }} />
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
// COMPONENTE PRINCIPAL BÚSQUEDA DE SÍMBOLOS
// ============================================================

interface BSInterfaceProps {
  onComplete: (scores: Record<string, number>, rawTotal: number) => void
  onUpdatePatient: (content: any) => void
  patientAge: number
}

export const BSInterface = React.memo(function BSInterface({ onComplete, onUpdatePatient, patientAge }: BSInterfaceProps) {
  const [correct, setCorrect] = useState('')
  const [incorrect, setIncorrect] = useState('')
  const [isCompleted, setIsCompleted] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [timeEnded, setTimeEnded] = useState(false)
  const [reviewLater, setReviewLater] = useState(false)
  const [finalTime, setFinalTime] = useState(0)

  const CONFIG = patientAge <= 7 ? BS_CONFIG.A : BS_CONFIG.B
  const maxScore = CONFIG.maxScore

  const onCompleteRef = useRef(onComplete)
  const onUpdatePatientRef = useRef(onUpdatePatient)

  useEffect(() => {
    onCompleteRef.current = onComplete
    onUpdatePatientRef.current = onUpdatePatient
  }, [onComplete, onUpdatePatient])

  // Enviar instrucción al display
  useEffect(() => {
    onUpdatePatientRef.current({
      type: 'wisc5_bs',
      instruction: 'Busca los símbolos iguales al modelo y márcalos. Trabaja lo más rápido que puedas. Tienes 2 minutos.',
      form: patientAge <= 7 ? 'A' : 'B',
      totalItems: CONFIG.totalItems,
      isRunning,
      timeRemaining: isRunning ? 120 - elapsedTime : 120
    })
  }, [isRunning, elapsedTime])

  const handleTimeUpdate = useCallback((seconds: number) => {
    setElapsedTime(seconds)
  }, [])

  const handleTimeEnd = useCallback(() => {
    setTimeEnded(true)
    setIsRunning(false)
    setFinalTime(elapsedTime)
  }, [elapsedTime])

  const toggleRunning = useCallback(() => {
    setIsRunning(prev => !prev)
  }, [])

  // Calcular bonus por tiempo (solo Forma A)
  const calculateTimeBonus = (totalCorrect: number, timeSeconds: number): number => {
    if (!CONFIG.hasBonus) return 0
    if (totalCorrect !== CONFIG.totalItems) return 0 // Solo si es perfecto

    if (timeSeconds <= 110) return 2
    if (timeSeconds <= 119) return 1
    return 0 // ≥ 120 segundos
  }

  const calculateRawScore = (): number => {
    const c = parseInt(correct, 10) || 0
    const i = parseInt(incorrect, 10) || 0
    const baseScore = c - i

    if (baseScore <= 0) return 0

    // Aplicar bonus por tiempo (solo Forma A con ejecución perfecta)
    const bonus = calculateTimeBonus(c, finalTime || elapsedTime)
    return Math.min(baseScore + bonus, maxScore)
  }

  const handleComplete = () => {
    const c = parseInt(correct, 10)
    const i = parseInt(incorrect, 10)

    if (isNaN(c) || c < 0) {
      alert('Por favor, ingresa una cantidad válida de respuestas correctas')
      return
    }
    if (isNaN(i) || i < 0) {
      alert('Por favor, ingresa una cantidad válida de respuestas incorrectas')
      return
    }

    const total = c + i
    if (total > CONFIG.totalItems) {
      alert('La suma de correctas e incorrectas no puede superar ' + CONFIG.totalItems + ' ítems totales')
      return
    }

    // Guardar tiempo final
    if (!timeEnded) {
      setFinalTime(elapsedTime)
    }

    const rawScore = calculateRawScore()
    setIsCompleted(true)
    onCompleteRef.current({ BS: rawScore }, rawScore)
  }

  const handleReviewLater = () => {
    setReviewLater(true)
    setIsCompleted(true)
    onCompleteRef.current({ BS: -1 }, -1)
  }

  if (isCompleted) {
    const pend = reviewLater
    const bgColor = pend ? 'bg-orange-50' : 'bg-green-50'
    const textColor = pend ? 'text-orange-700' : 'text-green-700'
    const rawScore = calculateRawScore()
    const bonus = calculateTimeBonus(parseInt(correct, 10) || 0, finalTime || elapsedTime)

    return (
      <div className={'rounded-lg p-4 text-center ' + bgColor}>
        <p className={'font-medium ' + textColor}>
          {pend ? '⏳ Pendiente de revisión' : 'Subprueba completada'}
        </p>
        {!pend && (
          <div className="mt-2">
            <p className="text-sm text-green-600">
              Correctas: {correct || 0} | Incorrectas: {incorrect || 0}
            </p>
            {bonus > 0 && (
              <p className="text-sm text-blue-600 mt-1">
                ⚡ Bonus por tiempo: +{bonus} puntos (ejecución perfecta en ≤ {bonus === 2 ? '110' : '119'}s)
              </p>
            )}
            <p className="text-sm text-green-600 mt-1">
              Puntaje bruto total: {rawScore} / {maxScore}
            </p>
          </div>
        )}
        {pend && (
          <p className="text-sm text-orange-600 mt-1">
            Podrás completar la revisión desde el panel de WISC-V
          </p>
        )}
      </div>
    )
  }

  const rawScorePreview = calculateRawScore()
  const bonusPreview = calculateTimeBonus(parseInt(correct, 10) || 0, elapsedTime)

  return (
    <div className="space-y-4">
      {/* Barra de progreso */}
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Búsqueda de Símbolos - {CONFIG.name}</span>
          <span className="text-gray-800 font-medium">Tiempo límite: 2 minutos</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: (elapsedTime / 120) * 100 + '%' }} />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Total de ítems: {CONFIG.totalItems} | Puntaje bruto = Correctas - Incorrectas
          {CONFIG.hasBonus ? ' + Bonus por tiempo (si ejecución perfecta)' : ''}
          {CONFIG.hasBonus && <span className="ml-1 text-blue-600">| Máx: {maxScore}</span>}
        </p>
      </div>

      {/* Cronómetro */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <Stopwatch
          timeLimit={120}
          onTimeUpdate={handleTimeUpdate}
          onTimeEnd={handleTimeEnd}
          isRunning={isRunning}
          onToggleRunning={toggleRunning}
        />
      </div>

      {/* Aviso de tiempo finalizado */}
      {timeEnded && (
        <div className="bg-yellow-50 rounded-lg p-3 text-center border border-yellow-200">
          <p className="text-yellow-700 text-sm">⏰ ¡Tiempo finalizado! Ingresa las cantidades.</p>
        </div>
      )}

      {/* Campos de ingreso */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-sm font-medium text-gray-700 mb-4">
          Ingresa los resultados de la prueba ({CONFIG.totalItems} ítems totales):
        </p>

        <div className="space-y-4">
          {/* Respuestas correctas */}
          <div>
            <label className="block text-sm font-medium text-green-700 mb-2">
              ✓ Respuestas correctas
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={correct}
                onChange={(e) => setCorrect(e.target.value)}
                min="0"
                max={CONFIG.totalItems}
                placeholder="0"
                disabled={reviewLater}
                className="w-32 px-4 py-2 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
              />
              <span className="text-sm text-gray-500">de {CONFIG.totalItems} ítems</span>
            </div>
          </div>

          {/* Respuestas incorrectas */}
          <div>
            <label className="block text-sm font-medium text-red-700 mb-2">
              ✗ Respuestas incorrectas
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={incorrect}
                onChange={(e) => setIncorrect(e.target.value)}
                min="0"
                max={CONFIG.totalItems}
                placeholder="0"
                disabled={reviewLater}
                className="w-32 px-4 py-2 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100"
              />
              <span className="text-sm text-gray-500">de {CONFIG.totalItems} ítems</span>
            </div>
          </div>

          {/* Resumen de ítems */}
          {(correct || incorrect) && (
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total respondidos:</span>
                <span className={'font-medium ' + ((parseInt(correct || '0') + parseInt(incorrect || '0')) > CONFIG.totalItems ? 'text-red-600' : 'text-gray-800')}>
                  {(parseInt(correct || '0') + parseInt(incorrect || '0'))} / {CONFIG.totalItems}
                  {(parseInt(correct || '0') + parseInt(incorrect || '0')) > CONFIG.totalItems && (
                    <span className="ml-2 text-xs">⚠️ Supera el máximo</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-600">No respondidos:</span>
                <span className="text-gray-800">
                  {Math.max(0, CONFIG.totalItems - (parseInt(correct || '0') + parseInt(incorrect || '0')))} / {CONFIG.totalItems}
                </span>
              </div>
            </div>
          )}

          {/* Puntaje bruto calculado */}
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <p className="text-sm text-blue-700 mb-1">Puntaje bruto calculado:</p>
            <p className="text-3xl font-bold text-blue-700">{rawScorePreview}</p>
            <p className="text-xs text-blue-600 mt-1">
              ({correct || 0} correctas - {incorrect || 0} incorrectas
              {bonusPreview > 0 ? ' + ' + bonusPreview + ' bonus por tiempo' : ''})
              {rawScorePreview === 0 && (parseInt(correct || '0') - parseInt(incorrect || '0')) <= 0 && (
                <span className="ml-1">(mínimo 0)</span>
              )}
            </p>
            {CONFIG.hasBonus && parseInt(correct || '0') === CONFIG.totalItems && bonusPreview > 0 && (
              <p className="text-xs text-blue-600 mt-1">⚡ ¡Ejecución perfecta! Bonus por tiempo aplicado</p>
            )}
          </div>
        </div>

        {/* Botón de completar */}
        <div className="mt-4 flex gap-3">
          <button
            onClick={handleComplete}
            disabled={(!correct && !incorrect) || reviewLater}
            className={'flex-1 py-3 rounded-lg font-medium transition-colors ' + (
              (correct || incorrect) && !reviewLater
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            )}
          >
            Completar
          </button>
        </div>

        {/* Opción revisar después */}
        <div className="mt-4 pt-3 border-t border-gray-200">
          {!reviewLater ? (
            <button
              onClick={handleReviewLater}
              className="w-full py-2 bg-orange-50 text-orange-700 rounded-lg text-sm font-medium border border-orange-200 hover:bg-orange-100 transition-colors"
            >
              ⏳ Dejar para revisar después
            </button>
          ) : (
            <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-orange-700">⏳ Pendiente de revisión</p>
                  <p className="text-xs text-orange-600 mt-1">Podrás completar esta evaluación desde el panel de WISC-V</p>
                </div>
                <button
                  onClick={() => setReviewLater(false)}
                  className="px-3 py-1.5 bg-white text-orange-700 rounded-lg text-xs hover:bg-orange-50 border border-orange-300"
                >
                  Revisar ahora
                </button>
              </div>
            </div>
          )}
        </div>

        {!timeEnded && !reviewLater && (
          <p className="text-xs text-gray-400 mt-2">
            Debes esperar a que termine el tiempo (o pausar el cronómetro) para completar
          </p>
        )}
      </div>

      {/* Instrucciones para el evaluador */}
      <div className="bg-blue-50 rounded-lg p-3">
        <p className="text-xs text-blue-700">
          <strong>Instrucciones para el evaluador:</strong> Entrega la hoja de Búsqueda de Símbolos al evaluado.
          Di: &ldquo;Busca los símbolos iguales al modelo y márcalos. Trabaja lo más rápido que puedas. Tienes 2 minutos.&rdquo;
        </p>
      </div>
    </div>
  )
})