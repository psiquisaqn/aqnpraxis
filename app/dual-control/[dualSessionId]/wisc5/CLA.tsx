'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'

const PLANTILLA_CONFIG = {
  A: { cols: 10, pairs: 8, firstPairCols: 5, maxScore: 75 },
  B: { cols: 18, pairs: 7, firstPairCols: 9, maxScore: 117 }
}

// ============================================================
// CRONOMETRO
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
  const critical = seconds >= timeLimit - 10

  if (!isRunning && seconds === 0) {
    return (
      <div className="text-center">
        <div className="text-4xl font-mono font-bold mb-2 text-gray-800">{formatTime(0)}</div>
        <button onClick={startTimer} className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-base font-medium">
          Iniciar prueba (120 segundos)
        </button>
        <div className="text-xs text-gray-400 mt-2">Tiempo limite: 2 minutos</div>
      </div>
    )
  }

  const timeColor = critical ? 'text-red-600 animate-pulse' : 'text-gray-800'
  const barColor = critical ? 'bg-red-500' : 'bg-blue-500'

  return (
    <div className="text-center">
      <div className={'text-5xl font-mono font-bold mb-2 transition-colors ' + timeColor}>{formatTime(seconds)}</div>
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
        {seconds >= timeLimit ? 'Tiempo finalizado' : 'Restan ' + formatTime(timeLimit - seconds)}
      </div>
    </div>
  )
}

// ============================================================
// COMPONENTE PRINCIPAL CLA
// ============================================================
interface CLAInterfaceProps {
  onComplete: (s: Record<string, number>, t: number) => void
  onUpdatePatient: (c: any) => void
  patientAge: number
}

export const CLAInterface = React.memo(function CLAInterface({ onComplete, onUpdatePatient, patientAge }: CLAInterfaceProps) {
  const [raw, setRaw] = useState('')
  const [done, setDone] = useState(false)
  const [secs, setSecs] = useState(0)
  const [run, setRun] = useState(false)
  const [ended, setEnded] = useState(false)
  const [later, setLater] = useState(false)

  const CFG = patientAge <= 7 ? PLANTILLA_CONFIG.A : PLANTILLA_CONFIG.B
  const max = CFG.maxScore
  const oc = useRef(onComplete)
  const op = useRef(onUpdatePatient)
  useEffect(() => { oc.current = onComplete; op.current = onUpdatePatient }, [onComplete, onUpdatePatient])
  useEffect(() => {
    op.current({
      type: 'wisc5_cla',
      instruction: 'Copia los simbolos. Tienes 2 minutos.',
      isRunning: run,
      timeRemaining: run ? 120 - secs : 120
    })
  }, [run, secs])

  const tu = useCallback((s: number) => setSecs(s), [])
  const te = useCallback(() => { setEnded(true); setRun(false) }, [])
  const tog = useCallback(() => setRun(p => !p), [])

  const complete = () => {
    const s = parseInt(raw, 10)
    if (isNaN(s) || s < 0) { alert('Puntaje invalido'); return }
    if (s > max) { alert('Maximo es ' + max); return }
    setDone(true)
    oc.current({ CLA: s }, s)
  }

  const reviewLater = () => { setLater(true); setDone(true); oc.current({ CLA: -1 }, -1) }

  if (done) {
    const pend = later
    const bgColor = pend ? 'bg-orange-50' : 'bg-green-50'
    const textColor = pend ? 'text-orange-700' : 'text-green-700'
    return (
      <div className={'rounded-lg p-4 text-center ' + bgColor}>
        <p className={'font-medium ' + textColor}>{pend ? 'Pendiente de revision' : 'Completada'}</p>
        {!pend && <p className="text-sm text-green-600 mt-1">Puntaje: {raw} / {max}</p>}
        {pend && <p className="text-sm text-orange-600 mt-1">Podras revisar desde el panel WISC-V</p>}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Claves {patientAge <= 7 ? 'A' : 'B'}</span>
          <span className="text-gray-800 font-medium">Tiempo limite: 2 min</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: (secs / 120) * 100 + '%' }} />
        </div>
        <p className="text-xs text-gray-500 mt-2">{CFG.pairs} pares x {CFG.cols} cols | Max: {max}</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <Stopwatch timeLimit={120} onTimeUpdate={tu} onTimeEnd={te} isRunning={run} onToggleRunning={tog} />
      </div>

      {ended && (
        <div className="bg-yellow-50 rounded-lg p-3 text-center border border-yellow-200">
          <p className="text-yellow-700 text-sm">Tiempo finalizado. Ingresa el puntaje.</p>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Puntaje bruto total</label>
        <div className="flex gap-3">
          <input type="number" value={raw} onChange={e => setRaw(e.target.value)} min="0" max={max}
            placeholder={'0-' + max} className="flex-1 px-4 py-2 text-lg border rounded-lg" disabled={later} />
          <button onClick={complete} disabled={!raw || later}
            className={'px-6 py-2 rounded-lg font-medium ' + (raw && !later ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-300 cursor-not-allowed')}>
            Completar
          </button>
        </div>
        <div className="mt-4 pt-3 border-t">
          {!later ? (
            <button onClick={reviewLater}
              className="w-full py-2 bg-orange-50 text-orange-700 rounded-lg text-sm border border-orange-200">
              Dejar para revisar despues
            </button>
          ) : (
            <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-orange-700">Pendiente</p>
                  <p className="text-xs text-orange-600">Revisable desde el panel</p>
                </div>
                <button onClick={() => setLater(false)}
                  className="px-3 py-1.5 bg-white text-orange-700 rounded text-xs border">Revisar ahora</button>
              </div>
            </div>
          )}
        </div>
        {!ended && !later && <p className="text-xs text-gray-400 mt-2">Espera a que termine el tiempo</p>}
      </div>

      <div className="bg-blue-50 rounded-lg p-3">
        <p className="text-xs text-blue-700">Entrega la hoja al paciente. Di: Copia los simbolos en las casillas. Tienes 2 minutos.</p>
      </div>
    </div>
  )
})