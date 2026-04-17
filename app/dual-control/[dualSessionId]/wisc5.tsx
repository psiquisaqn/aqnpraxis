'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { DualTestWrapper } from './DualTestWrapper'

// ============================================================
// CONFIGURACIÓN DE SUBPRUEBAS WISC-V
// ============================================================

const WISC_SUBTESTS = [
  { code: 'CC', name: 'Construcción con Cubos', primary: true, order: 1, canBeReplaced: true, replaceWith: 'RV', hasInterface: true },
  { code: 'AN', name: 'Analogías', primary: true, order: 2, canBeReplaced: false, hasInterface: false },
  { code: 'MR', name: 'Matrices de Razonamiento', primary: true, order: 3, canBeReplaced: false, hasInterface: false },
  { code: 'RD', name: 'Retención de Dígitos', primary: true, order: 4, canBeReplaced: false, hasInterface: false },
  { code: 'CLA', name: 'Claves', primary: true, order: 5, canBeReplaced: false, hasInterface: false },
  { code: 'VOC', name: 'Vocabulario', primary: true, order: 6, canBeReplaced: false, hasInterface: false },
  { code: 'BAL', name: 'Balanzas', primary: true, order: 7, canBeReplaced: false, hasInterface: false },
  { code: 'RV', name: 'Rompecabezas Visuales', primary: false, order: 8, canBeReplaced: false, hasInterface: false },
  { code: 'RI', name: 'Retención de Imágenes', primary: false, order: 9, canBeReplaced: false, hasInterface: false },
  { code: 'BS', name: 'Búsqueda de Símbolos', primary: false, order: 10, canBeReplaced: false, hasInterface: false },
  { code: 'IN', name: 'Información', primary: false, order: 11, canBeReplaced: false, hasInterface: false },
  { code: 'SLN', name: 'Span Letras y Números', primary: false, order: 12, canBeReplaced: false, hasInterface: false },
  { code: 'CAN', name: 'Cancelación', primary: false, order: 13, canBeReplaced: false, hasInterface: false },
  { code: 'COM', name: 'Comprensión', primary: false, order: 14, canBeReplaced: false, hasInterface: false },
  { code: 'ARI', name: 'Aritmética', primary: false, order: 15, canBeReplaced: false, hasInterface: false }
]

// Configuración de ítems para Construcción con Cubos (CC)
const CC_ITEMS_CONFIG = [
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

const getStartingItem = (years: number): number => years <= 7 ? 1 : 3
const getBonusPoints = (years: number): number => years <= 7 ? 0 : 4

const getNextItemOnFailure = (failedItem: number, currentScores: Record<number, number>): number | null => {
  if (failedItem === 3 && !currentScores[2]) return 2
  if (failedItem === 4 && !currentScores[2]) return 2
  if (failedItem === 2 && !currentScores[1]) return 1
  if (failedItem === 1) {
    for (let i = 5; i <= 13; i++) if (!currentScores[i]) return i
    return null
  }
  const nextItem = failedItem + 1
  if (nextItem <= 13 && !currentScores[nextItem]) return nextItem
  return null
}

// ============================================================
// COMPONENTE DE CRONÓMETRO
// ============================================================

interface StopwatchProps {
  timeLimit: number
  onTimeUpdate?: (seconds: number) => void
  onTimeEnd?: () => void
  autoStart?: boolean
  isActive?: boolean
  onStart?: () => void
}

function Stopwatch({ timeLimit, onTimeUpdate, onTimeEnd, autoStart = true, isActive = true, onStart }: StopwatchProps) {
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
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isRunning, isActive, seconds, timeLimit, onTimeUpdate, onTimeEnd])

  const startTimer = () => { setIsRunning(true); onStart?.() }
  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  const getProgressPercent = (): number => Math.min((seconds / timeLimit) * 100, 100)

  if (!isRunning && !autoStart && seconds === 0) {
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
      <div className="text-3xl font-mono font-bold mb-2">{formatTime(seconds)}</div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${getProgressPercent()}%` }} />
      </div>
      <div className="text-xs text-gray-400 mt-1">Tiempo límite: {formatTime(timeLimit)}</div>
    </div>
  )
}

// ============================================================
// INTERFAZ PARA CONSTRUCCIÓN CON CUBOS (CC)
// ============================================================

interface CcInterfaceProps {
  onComplete: (scores: Record<number, number>, rawTotal: number) => void
  onUpdatePatient: (content: any) => void
  patientAge: number
}

function CcInterface({ onComplete, onUpdatePatient, patientAge }: CcInterfaceProps) {
  const [currentItemNum, setCurrentItemNum] = useState<number | null>(() => getStartingItem(patientAge))
  const [scores, setScores] = useState<Record<number, number>>({})
  const [attempts, setAttempts] = useState<Record<number, number>>({})
  const [showRetryButton, setShowRetryButton] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [stopwatchKey, setStopwatchKey] = useState(0)
  const [availableScores, setAvailableScores] = useState<number[]>([])
  const [isPaused, setIsPaused] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [timerStarted, setTimerStarted] = useState(false)
  const [timeEnded, setTimeEnded] = useState(false)
  const [isGoingBack, setIsGoingBack] = useState(false)

  const currentItem = CC_ITEMS_CONFIG.find(i => i.num === currentItemNum)
  const isTwoAttempts = currentItem?.twoAttempts || false
  const currentAttempt = attempts[currentItem?.num || 0] || 1
  const isTimeBased = currentItem?.scoresByTime !== undefined
  const bonusPoints = getBonusPoints(patientAge)
  const hasBonus = bonusPoints > 0

  useEffect(() => {
    if (currentItem && !isCompleted && timerStarted) {
      onUpdatePatient({
        type: 'wisc5_cc',
        stimulusNum: currentItem.num,
        instructions: 'Construye la figura usando los cubos. Observa el modelo y repite la construcción.',
        twoAttempts: isTwoAttempts,
        currentAttempt: currentAttempt,
        totalItems: CC_ITEMS_CONFIG.length
      })
    }
  }, [currentItemNum, currentItem, isCompleted, timerStarted, onUpdatePatient, isTwoAttempts, currentAttempt])

  const checkSuspension = (newScores: Record<number, number>): boolean => {
    const items = Object.keys(newScores).map(Number).sort((a, b) => a - b)
    if (items.length >= 2) {
      const lastTwo = items.slice(-2)
      if (newScores[lastTwo[0]] === 0 && newScores[lastTwo[1]] === 0) return true
    }
    return false
  }

  useEffect(() => {
    if (isTimeBased && currentItem?.scoresByTime && !isPaused && !isCompleted && timerStarted && !timeEnded) {
      const available: number[] = []
      for (const tier of currentItem.scoresByTime) {
        if (elapsedTime <= tier.maxTime) available.push(tier.score)
      }
      setAvailableScores(available)
    }
  }, [elapsedTime, isTimeBased, currentItem, isPaused, isCompleted, timerStarted, timeEnded])

  const handleScore = (score: number, timeSeconds?: number) => {
    const newScores = { ...scores, [currentItemNum!]: score }
    setScores(newScores)
    if (checkSuspension(newScores)) {
      const total = Object.values(newScores).reduce((a, b) => a + b, 0) + bonusPoints
      setIsCompleted(true)
      onComplete(newScores, total)
      return
    }
    
    let nextItem: number | null = null
    if (score === 0 && patientAge >= 8) {
      nextItem = getNextItemOnFailure(currentItemNum!, newScores)
      if (nextItem) {
        setIsGoingBack(true)
        setCurrentItemNum(nextItem)
        setTimerStarted(false)
        setTimeEnded(false)
        setElapsedTime(0)
        setStopwatchKey(prev => prev + 1)
        setShowRetryButton(false)
        setIsPaused(false)
        setAvailableScores([])
        return
      }
    }
    
    if (!nextItem) {
      nextItem = currentItemNum! + 1
      while (nextItem <= 13 && newScores[nextItem]) nextItem++
    }
    
    if (nextItem > 13) {
      const total = Object.values(newScores).reduce((a, b) => a + b, 0) + bonusPoints
      setIsCompleted(true)
      onComplete(newScores, total)
    } else {
      setCurrentItemNum(nextItem)
      setTimerStarted(false)
      setTimeEnded(false)
      setElapsedTime(0)
      setStopwatchKey(prev => prev + 1)
      setShowRetryButton(false)
      setIsPaused(false)
      setAvailableScores([])
      setIsGoingBack(false)
    }
  }

  const handleRetry = () => {
    setAttempts({ ...attempts, [currentItemNum!]: 2 })
    setShowRetryButton(false)
    setTimerStarted(true)
    setTimeEnded(false)
    setElapsedTime(0)
    setStopwatchKey(prev => prev + 1)
    setIsPaused(false)
    setAvailableScores([])
  }

  const handleTimeEnd = () => setTimeEnded(true)
  const handleStartTimer = () => { setTimerStarted(true); setTimeEnded(false) }

  if (!currentItem) return null

  if (isCompleted) {
    return (
      <div className="bg-green-50 rounded-lg p-4 text-center">
        <p className="text-green-700 font-medium">Subprueba completada</p>
        <p className="text-sm text-green-600 mt-1">
          Puntaje total: {Object.values(scores).reduce((a, b) => a + b, 0) + bonusPoints} / 58
          {hasBonus && ` (incluye ${bonusPoints} puntos por edad)`}
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

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Construcción con Cubos</span>
          <span className="text-gray-800 font-medium">Ítem {currentItem.num}/{CC_ITEMS_CONFIG.length}</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${((currentItemNum! - 1) / CC_ITEMS_CONFIG.length) * 100}%` }} />
        </div>
        {hasBonus && !isGoingBack && <p className="text-xs text-blue-600 mt-1">Bonus por edad: +{bonusPoints} puntos</p>}
        {isGoingBack && <p className="text-xs text-orange-600 mt-1">Retrocediendo por fallo...</p>}
      </div>

      {/* Vista del examinador (modelo invertido) */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Vista del examinador (modelo invertido)</p>
        <img 
          src={`/wisc5/cc/cubosinv${String(currentItem.num).padStart(3, '0')}.png`}
          alt={`Modelo invertido ${currentItem.num}`}
          className="mx-auto max-w-full h-auto border border-gray-200 rounded-lg"
          onError={(e) => { e.currentTarget.src = '/placeholder-image.png' }}
        />
        <p className="text-xs text-gray-400 mt-2 text-center">Verifica que la construcción del paciente coincida con este modelo</p>
      </div>

      {/* Cronómetro */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <Stopwatch
          key={stopwatchKey}
          timeLimit={currentItem.timeLimit}
          onTimeUpdate={setElapsedTime}
          onTimeEnd={handleTimeEnd}
          autoStart={false}
          isActive={!showRetryButton && !isPaused && !scores[currentItem.num] && timerStarted && !timeEnded}
          onStart={handleStartTimer}
        />
      </div>

      {timeEnded && (
        <div className="bg-yellow-50 rounded-lg p-3 text-center border border-yellow-200">
          <p className="text-yellow-700 text-sm">⏰ Tiempo finalizado. Solo puede registrar puntaje 0.</p>
        </div>
      )}

      {!showRetryButton && !isPaused && !scores[currentItem.num] && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-3">
            Puntaje para el ítem {currentItem.num}:
            {isTwoAttempts && ` (Intento ${currentAttempt} de 2)`}
          </p>
          {isTimeBased ? (
            <div className="grid grid-cols-5 gap-2">
              {[7, 6, 5, 4, 0].map(score => (
                <button key={score} onClick={() => handleScore(score, elapsedTime)} disabled={isScoreDisabled(score)}
                  className={`py-2 rounded-lg text-sm font-medium transition-all ${!isScoreDisabled(score) ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                  {getScoreLabel(score)}
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {currentItem.maxScore === 2 ? (
                <>
                  <button onClick={() => handleScore(0, elapsedTime)} className="py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50">0 - No logrado</button>
                  <button onClick={() => handleScore(1, elapsedTime)} disabled={timeEnded} className={`py-2 rounded-lg border border-gray-200 text-sm ${timeEnded ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}>1 - Segundo intento</button>
                  <button onClick={() => handleScore(2, elapsedTime)} disabled={timeEnded} className={`py-2 rounded-lg border border-gray-200 text-sm ${timeEnded ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}>2 - Primer intento</button>
                </>
              ) : (
                <>
                  <button onClick={() => handleScore(0, elapsedTime)} className="py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50">0 - No logrado</button>
                  <button onClick={() => handleScore(currentItem.maxScore, elapsedTime)} disabled={timeEnded} className={`py-2 rounded-lg border border-gray-200 text-sm ${timeEnded ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}>{currentItem.maxScore} - Logrado</button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {showRetryButton && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <p className="text-sm text-gray-600 mb-3">No logró el ítem en el primer intento.</p>
          <button onClick={handleRetry} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Segundo intento</button>
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-sm text-gray-600">Puntaje bruto acumulado: {Object.values(scores).reduce((a, b) => a + b, 0)} / 58{hasBonus && ` (sin bonus: +${bonusPoints} al final)`}</p>
      </div>
    </div>
  )
}

// ============================================================
// PANEL DE SUBPRUEBAS
// ============================================================

interface SubtestPanelProps {
  subtestStatus: Record<string, 'pending' | 'completed' | 'not_administered'>
  onSelectSubtest: (code: string) => void
  onToggleSubstitution: (useRV: boolean) => void
  substitutionUsed: boolean
  onGenerateBriefReport: () => void
  onGenerateExtendedReport: () => void
  canGenerateBrief: boolean
  canGenerateExtended: boolean
}

function SubtestPanel({ 
  subtestStatus, onSelectSubtest, onToggleSubstitution, substitutionUsed,
  onGenerateBriefReport, onGenerateExtendedReport, canGenerateBrief, canGenerateExtended
}: SubtestPanelProps) {
  const primarySubtests = WISC_SUBTESTS.filter(s => s.primary)
  const secondarySubtests = WISC_SUBTESTS.filter(s => !s.primary)

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-md font-semibold text-gray-800 mb-3">Subpruebas WISC-V</h3>
      
      {/* Sustitución CC → RV */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={substitutionUsed}
            onChange={(e) => onToggleSubstitution(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span>Reemplazar Construcción con Cubos por Rompecabezas Visuales</span>
        </label>
        <p className="text-xs text-gray-500 mt-1">Permite omitir CC y usar RV para el cálculo del CIT</p>
      </div>

      {/* Subpruebas primarias */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Subpruebas primarias (7)</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {primarySubtests.map(subtest => {
            const effectiveCode = (subtest.code === 'CC' && substitutionUsed) ? 'RV' : subtest.code
            const status = subtestStatus[effectiveCode] || subtestStatus[subtest.code] || 'pending'
            const isCompleted = status === 'completed'
            const isNotAdministered = status === 'not_administered'
            return (
              <button
                key={subtest.code}
                onClick={() => onSelectSubtest(subtest.code)}
                disabled={isCompleted}
                className={`p-2 rounded-lg text-left text-sm transition-all ${
                  isCompleted ? 'bg-green-100 text-green-700 border border-green-300 cursor-default' :
                  isNotAdministered ? 'bg-gray-100 text-gray-400 line-through' :
                  'bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer'
                }`}
              >
                <div className="font-medium">{subtest.name}</div>
                <div className="text-xs">
                  {isCompleted ? '✓ Completada' : isNotAdministered ? 'No administrada' : 'Pendiente'}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Subpruebas secundarias */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Subpruebas secundarias (8)</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {secondarySubtests.map(subtest => {
            const status = subtestStatus[subtest.code] || 'pending'
            const isCompleted = status === 'completed'
            const isNotAdministered = status === 'not_administered'
            return (
              <button
                key={subtest.code}
                onClick={() => onSelectSubtest(subtest.code)}
                disabled={isCompleted}
                className={`p-2 rounded-lg text-left text-sm transition-all ${
                  isCompleted ? 'bg-green-100 text-green-700 border border-green-300 cursor-default' :
                  isNotAdministered ? 'bg-gray-100 text-gray-400 line-through' :
                  'bg-gray-50 text-gray-700 hover:bg-gray-100 cursor-pointer border border-gray-200'
                }`}
              >
                <div className="font-medium">{subtest.name}</div>
                <div className="text-xs">
                  {isCompleted ? '✓ Completada' : isNotAdministered ? 'No administrada' : 'Pendiente'}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Botones de generación de informes */}
      <div className="flex gap-3 mt-4 pt-3 border-t border-gray-200">
        <button
          onClick={onGenerateBriefReport}
          disabled={!canGenerateBrief}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            canGenerateBrief ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Generar informe breve (7 subpruebas)
        </button>
        <button
          onClick={onGenerateExtendedReport}
          disabled={!canGenerateExtended}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            canGenerateExtended ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Generar informe extendido (15 subpruebas)
        </button>
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
  const [subtestStatus, setSubtestStatus] = useState<Record<string, 'pending' | 'completed' | 'not_administered'>>({})
  const [substitutionUsed, setSubstitutionUsed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [showQuestionZero, setShowQuestionZero] = useState(true)
  const [activeSubtest, setActiveSubtest] = useState<string | null>(null)
  const [showSubtestPanel, setShowSubtestPanel] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar estado guardado
  useEffect(() => {
    const loadSavedState = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { data } = await supabase
        .from('wisc5_scores')
        .select('status, substitution_used, completed_subtests, report_type')
        .eq('session_id', sessionId)
        .single()
      
      if (data) {
        if (data.substitution_used === 'RV') setSubstitutionUsed(true)
        if (data.completed_subtests) setSubtestStatus(data.completed_subtests)
        if (data.status === 'completed_brief' || data.status === 'completed_extended') {
          setShowSubtestPanel(false)
        }
      }
    }
    if (sessionId) loadSavedState()
  }, [sessionId])

  const calculateAge = (birthDate: Date, evalDate: Date): { years: number; months: number; totalMonths: number } => {
    let years = evalDate.getFullYear() - birthDate.getFullYear()
    let months = evalDate.getMonth() - birthDate.getMonth()
    let days = evalDate.getDate() - birthDate.getDate()
    if (days < 0) months--
    if (months < 0) { years--; months += 12 }
    return { years, months, totalMonths: years * 12 + months }
  }

  const getAgeGroup = (totalMonths: number): string => {
    const groups = [
      { min: 72, max: 77, label: '6:0-6:5' }, { min: 78, max: 83, label: '6:6-6:11' },
      { min: 84, max: 89, label: '7:0-7:5' }, { min: 90, max: 95, label: '7:6-7:11' },
      { min: 96, max: 101, label: '8:0-8:5' }, { min: 102, max: 107, label: '8:6-8:11' },
      { min: 108, max: 113, label: '9:0-9:5' }, { min: 114, max: 119, label: '9:6-9:11' },
      { min: 120, max: 125, label: '10:0-10:5' }, { min: 126, max: 131, label: '10:6-10:11' },
      { min: 132, max: 137, label: '11:0-11:5' }, { min: 138, max: 143, label: '11:6-11:11' },
      { min: 144, max: 149, label: '12:0-12:5' }, { min: 150, max: 155, label: '12:6-12:11' },
      { min: 156, max: 161, label: '13:0-13:5' }, { min: 162, max: 167, label: '13:6-13:11' },
      { min: 168, max: 173, label: '14:0-14:5' }, { min: 174, max: 179, label: '14:6-14:11' },
      { min: 180, max: 185, label: '15:0-15:5' }, { min: 186, max: 191, label: '15:6-15:11' },
      { min: 192, max: 197, label: '16:0-16:5' }, { min: 198, max: 203, label: '16:6-16:11' }
    ]
    const group = groups.find(g => totalMonths >= g.min && totalMonths <= g.max)
    return group?.label || '6:0-6:5'
  }

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
    if (error || !data) return null
    return (data as any).scaled_score
  }

  const saveState = async (status: string, reportType?: string) => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    await supabase
      .from('wisc5_scores')
      .upsert({
        session_id: sessionId,
        status,
        substitution_used: substitutionUsed ? 'RV' : null,
        completed_subtests: subtestStatus,
        report_type: reportType || null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'session_id' })
  }

  const handleCcComplete = (itemScores: Record<number, number>, rawTotal: number) => {
    const effectiveCode = substitutionUsed ? 'RV' : 'CC'
    setRawScores({ ...rawScores, [effectiveCode]: rawTotal })
    setSubtestStatus(prev => ({ ...prev, [effectiveCode]: 'completed' }))
    if (ageInfo?.group) {
      fetchScaledScore(effectiveCode, rawTotal, ageInfo.group).then(scaled => {
        if (scaled) setScaledScores({ ...scaledScores, [effectiveCode]: scaled })
      })
    }
    saveState('in_progress')
    setActiveSubtest(null)
    setShowSubtestPanel(true)
  }

  const handleSelectSubtest = (code: string) => {
    // Por ahora solo CC tiene interfaz
    if (code === 'CC' || (code === 'RV' && substitutionUsed)) {
      setActiveSubtest('CC')
      setShowSubtestPanel(false)
    } else {
      alert(`La subprueba ${code} está en desarrollo. Próximamente disponible.`)
    }
  }

  const handleToggleSubstitution = (useRV: boolean) => {
    setSubstitutionUsed(useRV)
    if (useRV && subtestStatus['CC'] === 'completed') {
      if (rawScores.CC) setRawScores({ ...rawScores, RV: rawScores.CC, CC: undefined })
      if (scaledScores.CC) setScaledScores({ ...scaledScores, RV: scaledScores.CC, CC: undefined })
      setSubtestStatus(prev => ({ ...prev, RV: prev.CC, CC: 'not_administered' }))
    } else if (!useRV && subtestStatus['RV'] === 'completed') {
      if (rawScores.RV) setRawScores({ ...rawScores, CC: rawScores.RV, RV: undefined })
      if (scaledScores.RV) setScaledScores({ ...scaledScores, CC: scaledScores.RV, RV: undefined })
      setSubtestStatus(prev => ({ ...prev, CC: prev.RV, RV: 'not_administered' }))
    }
    saveState('in_progress')
  }

  const arePrimarySubtestsCompleted = (): boolean => {
    const primaryCodes = WISC_SUBTESTS.filter(s => s.primary).map(s => s.code)
    const effectivePrimary = substitutionUsed 
      ? primaryCodes.filter(c => c !== 'CC').concat(['RV'])
      : primaryCodes
    return effectivePrimary.every(code => subtestStatus[code] === 'completed')
  }

  const areAllSubtestsCompleted = (): boolean => {
    return WISC_SUBTESTS.every(s => subtestStatus[s.code] === 'completed')
  }

  const generateBriefReport = async () => {
    if (!arePrimarySubtestsCompleted()) return
    await saveState('completed_brief', 'brief')
    router.push(`/resultados/wisc5?session=${sessionId}&type=brief`)
  }

  const generateExtendedReport = async () => {
    if (!areAllSubtestsCompleted()) return
    await saveState('completed_extended', 'extended')
    router.push(`/resultados/wisc5?session=${sessionId}&type=extended`)
  }

  const handleStartTest = () => {
    if (!birthDate) { setError('Por favor, ingresa la fecha de nacimiento del paciente'); return }
    setShowQuestionZero(false)
    setError(null)
    setShowSubtestPanel(true)
  }

  const wiscItemsList = Array.from({ length: 15 }, (_, i) => ({ num: i + 1 }))

  if (showQuestionZero) {
    return (
      <div className="h-screen flex flex-col bg-gray-50">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-md w-full text-center shadow-lg">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Evaluación WISC-V</h2>
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <p className="text-blue-800 text-sm mb-2">Ingresa los datos del paciente para comenzar</p>
              <label className="block text-left text-sm font-medium text-gray-700 mb-1">Fecha de nacimiento</label>
              <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" max={new Date().toISOString().split('T')[0]} />
              {ageInfo && <p className="text-xs text-gray-500 mt-2">Edad: {ageInfo.years} años, {ageInfo.months} meses | Grupo: {ageInfo.group}</p>}
            </div>
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            <button onClick={handleStartTest} className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm">Comenzar evaluación</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <DualTestWrapper title="Evaluación WISC-V - Escala Wechsler" totalItems={15} currentItem={1} completed={Object.keys(rawScores).length} onItemSelect={() => {}} items={wiscItemsList} showQuestionZero={false} onStart={() => {}}>
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-600">Edad: {ageInfo?.years} años, {ageInfo?.months} meses | Grupo: {ageInfo?.group}</p>
        </div>

        {activeSubtest === 'CC' && ageInfo && (
          <CcInterface onComplete={handleCcComplete} onUpdatePatient={onUpdatePatient} patientAge={ageInfo.years} />
        )}

        {showSubtestPanel && (
          <SubtestPanel 
            subtestStatus={subtestStatus}
            onSelectSubtest={handleSelectSubtest}
            onToggleSubstitution={handleToggleSubstitution}
            substitutionUsed={substitutionUsed}
            onGenerateBriefReport={generateBriefReport}
            onGenerateExtendedReport={generateExtendedReport}
            canGenerateBrief={arePrimarySubtestsCompleted()}
            canGenerateExtended={areAllSubtestsCompleted()}
          />
        )}

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Progreso</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(subtestStatus).map(([code, status]) => (
              <span key={code} className={`text-xs px-2 py-1 rounded-full ${status === 'completed' ? 'bg-green-100 text-green-700' : status === 'not_administered' ? 'bg-gray-100 text-gray-400' : 'bg-yellow-100 text-yellow-700'}`}>
                {code}: {status === 'completed' ? '✓' : status === 'not_administered' ? '✗' : '○'}
              </span>
            ))}
          </div>
        </div>
      </div>
    </DualTestWrapper>
  )
}