'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'

// ============================================================
// CONFIGURACIÓN DE ÍTEMS PARA RETENCIÓN DE DÍGITOS (RD)
// ============================================================

type RDPart = 'RD-D' | 'RD-I' | 'RD-S'

interface RDItem {
  part: RDPart
  num: number | string
  trials: number[][]
  isPractice?: boolean
}

// Dígitos en orden directo (RD-D)
const RD_D_ITEMS: RDItem[] = [
  { part: 'RD-D', num: 1, trials: [[2, 9], [5, 4]] },
  { part: 'RD-D', num: 2, trials: [[3, 9, 6], [6, 5, 2]] },
  { part: 'RD-D', num: 3, trials: [[5, 4, 1, 7], [9, 1, 6, 8]] },
  { part: 'RD-D', num: 4, trials: [[8, 2, 1, 9, 6], [7, 2, 3, 4, 9]] },
  { part: 'RD-D', num: 5, trials: [[5, 7, 3, 6, 4, 8], [3, 8, 4, 1, 7, 5]] },
  { part: 'RD-D', num: 6, trials: [[2, 1, 8, 9, 4, 3, 7], [7, 8, 5, 2, 1, 6, 3]] },
  { part: 'RD-D', num: 7, trials: [[1, 8, 4, 2, 7, 5, 3, 6], [2, 7, 9, 6, 3, 1, 4, 8]] },
  { part: 'RD-D', num: 8, trials: [[7, 2, 6, 1, 9, 4, 8, 3, 5], [4, 3, 8, 9, 1, 7, 5, 6, 2]] },
  { part: 'RD-D', num: 9, trials: [[6, 2, 5, 3, 1, 9, 8, 5, 4, 7], [9, 4, 3, 8, 7, 5, 2, 9, 6, 1]] }
]

// Dígitos en orden inverso (RD-I)
const RD_I_ITEMS: RDItem[] = [
  { part: 'RD-I', num: 'P', trials: [[9, 4], [5, 6]], isPractice: true },
  { part: 'RD-I', num: 1, trials: [[2, 1], [1, 3]] },
  { part: 'RD-I', num: 2, trials: [[3, 9], [8, 5]] },
  { part: 'RD-I', num: 3, trials: [[2, 3, 6], [5, 4, 1]] },
  { part: 'RD-I', num: 4, trials: [[4, 5, 8], [2, 7, 5]] },
  { part: 'RD-I', num: 5, trials: [[7, 4, 5, 2], [9, 3, 8, 6]] },
  { part: 'RD-I', num: 6, trials: [[2, 1, 7, 9, 4], [5, 6, 3, 8, 7]] },
  { part: 'RD-I', num: 7, trials: [[1, 6, 4, 7, 5, 8], [6, 3, 7, 2, 9, 1]] },
  { part: 'RD-I', num: 8, trials: [[8, 1, 5, 2, 4, 3, 6], [4, 3, 7, 9, 2, 8, 1]] },
  { part: 'RD-I', num: 9, trials: [[3, 1, 7, 9, 4, 6, 8, 2], [9, 8, 1, 6, 3, 2, 4, 7]] }
]

// Dígitos en orden secuenciado (RD-S)
const RD_S_ITEMS: RDItem[] = [
  { part: 'RD-S', num: 'PA', trials: [[3, 1], [8, 6]], isPractice: true },
  { part: 'RD-S', num: 'PB', trials: [[5, 2, 4], [4, 3, 3]], isPractice: true },
  { part: 'RD-S', num: 1, trials: [[4, 1], [3, 2]] },
  { part: 'RD-S', num: 2, trials: [[5, 2, 7], [1, 8, 6]] },
  { part: 'RD-S', num: 3, trials: [[7, 5, 8, 1], [4, 2, 9, 3]] },
  { part: 'RD-S', num: 4, trials: [[1, 5, 6, 2, 8], [2, 8, 4, 7, 9]] },
  { part: 'RD-S', num: 5, trials: [[3, 3, 6, 1, 5], [4, 9, 4, 6, 9]] },
  { part: 'RD-S', num: 6, trials: [[8, 5, 2, 5, 3, 7], [6, 1, 4, 7, 9, 3]] },
  { part: 'RD-S', num: 7, trials: [[9, 7, 9, 6, 2, 6, 8], [3, 1, 7, 5, 1, 8, 5]] },
  { part: 'RD-S', num: 8, trials: [[6, 9, 6, 2, 1, 3, 7, 9], [1, 4, 8, 5, 4, 8, 7, 4]] },
  { part: 'RD-S', num: 9, trials: [[2, 5, 7, 7, 4, 8, 7, 5, 2], [9, 1, 8, 3, 6, 3, 9, 2, 6]] }
]

const ALL_PARTS: RDPart[] = ['RD-D', 'RD-I', 'RD-S']

const getItemsForPart = (part: RDPart): RDItem[] => {
  switch (part) {
    case 'RD-D': return RD_D_ITEMS
    case 'RD-I': return RD_I_ITEMS
    case 'RD-S': return RD_S_ITEMS
  }
}

const getPartInstruction = (part: RDPart): string => {
  switch (part) {
    case 'RD-D': return 'Voy a decir unos números. Escucha con atención y cuando termine, repítelos en el MISMO orden.'
    case 'RD-I': return 'Ahora voy a decir más números. Esta vez quiero que los repitas AL REVÉS, de atrás hacia adelante.'
    case 'RD-S': return 'Ahora voy a decir otros números. Esta vez quiero que los repitas en orden DE MENOR A MAYOR.'
  }
}

const reverseArray = (arr: number[]): number[] => [...arr].reverse()
const sortAscending = (arr: number[]): number[] => [...arr].sort((a, b) => a - b)

const validateResponse = (part: RDPart, trial: number[], digits: (number | null)[]): boolean => {
  const userDigits = digits.filter(d => d !== null) as number[]
  let expected: number[]
  switch (part) {
    case 'RD-D': expected = trial; break
    case 'RD-I': expected = reverseArray(trial); break
    case 'RD-S': expected = sortAscending(trial); break
    default: return false
  }
  if (userDigits.length !== expected.length) return false
  for (let i = 0; i < userDigits.length; i++) {
    if (userDigits[i] !== expected[i]) return false
  }
  return true
}

// ============================================================
// COMPONENTE DE INPUT DE DÍGITOS (con altura reducida)
// ============================================================

interface DigitInputProps {
  length: number
  value: (number | null)[]
  onChange: (digits: (number | null)[]) => void
  disabled?: boolean
  autoFocus?: boolean
  onSubmit?: () => void
}

function DigitInput({ length, value, onChange, disabled = false, autoFocus = true, onSubmit }: DigitInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (autoFocus && inputRefs.current[0] && !disabled) {
      inputRefs.current[0].focus()
    }
  }, [autoFocus, disabled, length])

  const handleChange = (index: number, newValue: string) => {
    if (disabled) return
    const digit = newValue.replace(/\D/g, '').slice(0, 1)
    const numDigit = digit ? parseInt(digit, 10) : null
    const newDigits = [...value]
    newDigits[index] = numDigit
    onChange(newDigits)
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return
    if (e.key === 'Enter') {
      e.preventDefault()
      const allFilled = value.every(v => v !== null) && !value.some(v => v === null)
      if (allFilled && onSubmit) onSubmit()
    } else if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    if (disabled) return
    e.preventDefault()
    const pastedText = e.clipboardData.getData('text')
    const digits = pastedText.replace(/\D/g, '').split('').map(d => parseInt(d, 10)).slice(0, length)
    const newDigits = [...value]
    digits.forEach((digit, i) => { if (i < length) newDigits[i] = digit })
    onChange(newDigits)
    const nextEmptyIndex = newDigits.findIndex((d, i) => d === null && i >= digits.length)
    if (nextEmptyIndex !== -1) inputRefs.current[nextEmptyIndex]?.focus()
    else if (digits.length < length) inputRefs.current[digits.length]?.focus()
  }

  return (
    <div className="flex justify-center gap-2" onPaste={handlePaste}>
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={el => { inputRefs.current[index] = el }}
          type="text"
          inputMode="numeric"
          pattern="\d*"
          maxLength={1}
          value={value[index] !== null ? value[index]?.toString() : ''}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          disabled={disabled}
          className={`w-10 h-10 text-center text-xl font-mono font-bold border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
            disabled ? 'bg-gray-100 text-gray-500 border-gray-200' : 'border-gray-300 text-gray-800'
          }`}
        />
      ))}
    </div>
  )
}

// ============================================================
// COMPONENTE PRINCIPAL RD
// ============================================================

interface RDInterfaceProps {
  onComplete: (scores: Record<string, number>, rawTotal: number) => void
  onUpdatePatient: (content: any) => void
  patientAge: number
}

export const RDInterface = React.memo(function RDInterface({ onComplete, onUpdatePatient, patientAge }: RDInterfaceProps) {
  const [currentPartIndex, setCurrentPartIndex] = useState<number>(0)
  const [currentItemIndex, setCurrentItemIndex] = useState<number>(0)
  const [currentTrial, setCurrentTrial] = useState<0 | 1>(0)
  const [scores, setScores] = useState<Record<string, number>>({})
  // Contador global de fallos consecutivos para RD-S (se reinicia solo con acierto)
  const [globalConsecutiveZeros, setGlobalConsecutiveZeros] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [digits, setDigits] = useState<(number | null)[]>([])
  const [showResult, setShowResult] = useState<boolean | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [resultTimer, setResultTimer] = useState<NodeJS.Timeout | null>(null)

  const currentPart = ALL_PARTS[currentPartIndex]
  const partItems = getItemsForPart(currentPart)
  const currentItem = partItems[currentItemIndex]
  const isPractice = currentItem?.isPractice || false
  const currentTrialDigits = currentItem?.trials[currentTrial]

  const onCompleteRef = useRef(onComplete)
  const onUpdatePatientRef = useRef(onUpdatePatient)

  useEffect(() => { onCompleteRef.current = onComplete; onUpdatePatientRef.current = onUpdatePatient }, [onComplete, onUpdatePatient])

  useEffect(() => {
    if (currentTrialDigits) {
      setDigits(new Array(currentTrialDigits.length).fill(null))
      setShowResult(null)
      setIsCorrect(null)
    }
  }, [currentPartIndex, currentItemIndex, currentTrial, currentTrialDigits])

  useEffect(() => {
    if (currentItem && !isCompleted) {
      onUpdatePatientRef.current({
        type: 'wisc5_rd',
        part: currentPart,
        partName: currentPart === 'RD-D' ? 'Dígitos en orden directo' : currentPart === 'RD-I' ? 'Dígitos en orden inverso' : 'Dígitos en orden secuenciado',
        instruction: getPartInstruction(currentPart),
        isPractice: currentItem.isPractice || false
      })
    }
  }, [currentPart, currentItem, isCompleted])

  useEffect(() => {
    return () => { if (resultTimer) clearTimeout(resultTimer) }
  }, [resultTimer])

  const getScoreKey = (part: RDPart, itemNum: number | string, trial: number): string => `${part}-${itemNum}-trial${trial}`

  const shouldSuspendDDorDI = (part: RDPart, itemNum: number | string, newScores: Record<string, number>): boolean => {
    if (part === 'RD-S') return false
    return newScores[getScoreKey(part, itemNum, 0)] === 0 && newScores[getScoreKey(part, itemNum, 1)] === 0
  }

  const moveToNextPartOrComplete = (currentScores: Record<string, number>) => {
    if (currentPartIndex + 1 < ALL_PARTS.length) {
      setCurrentPartIndex(currentPartIndex + 1)
      setCurrentItemIndex(0)
      setCurrentTrial(0)
      setGlobalConsecutiveZeros(0)  // Reiniciar contador global al cambiar de parte
      setShowResult(null)
      setIsCorrect(null)
    } else {
      const total = Object.values(currentScores).reduce((a, b) => a + b, 0)
      setIsCompleted(true)
      onCompleteRef.current(currentScores, total)
    }
  }

  const advanceToNext = (newScores: Record<string, number>) => {
    // Verificar suspensión RD-D / RD-I (ambos intentos fallados)
    if ((currentPart === 'RD-D' || currentPart === 'RD-I') && shouldSuspendDDorDI(currentPart, currentItem.num, newScores)) {
      moveToNextPartOrComplete(newScores)
      return
    }

    // Para RD-S: si ya falló el primer intento y aún no se ha hecho el segundo, pasar al segundo intento
    const trial1Key = getScoreKey(currentPart, currentItem.num, 0)
    const trial2Key = getScoreKey(currentPart, currentItem.num, 1)

    if (!isPractice && currentTrial === 0 && newScores[trial1Key] === 0 && newScores[trial2Key] === undefined) {
      setCurrentTrial(1)
      return
    }

    // Avanzar al siguiente ítem
    if (currentItemIndex + 1 < partItems.length) {
      setCurrentItemIndex(currentItemIndex + 1)
      setCurrentTrial(0)
    } else {
      moveToNextPartOrComplete(newScores)
    }
  }

  const handleSubmit = () => {
    if (!currentTrialDigits) return
    if (digits.some(d => d === null)) return

    const correct = validateResponse(currentPart, currentTrialDigits, digits)
    setIsCorrect(correct)
    setShowResult(true)

    const score = correct ? 1 : 0
    const effectiveScore = isPractice ? 0 : score
    const scoreKey = getScoreKey(currentPart, currentItem.num, currentTrial)
    const newScores = { ...scores, [scoreKey]: effectiveScore }
    setScores(newScores)

    // Lógica de suspensión específica para RD-S (global)
    if (currentPart === 'RD-S') {
      if (effectiveScore === 0) {
        const newZeros = globalConsecutiveZeros + 1
        setGlobalConsecutiveZeros(newZeros)
        // Suspender la parte si se alcanzan 2 fallos consecutivos
        if (newZeros >= 2) {
          setTimeout(() => moveToNextPartOrComplete(newScores), 800)
          return
        }
      } else {
        // Acierto → reiniciar contador global
        setGlobalConsecutiveZeros(0)
      }
    }

    const timer = setTimeout(() => advanceToNext(newScores), 800)
    setResultTimer(timer)
  }

  const skipPractice = () => {
    if (currentItemIndex + 1 < partItems.length) {
      setCurrentItemIndex(currentItemIndex + 1)
      setCurrentTrial(0)
      setShowResult(null)
      setIsCorrect(null)
    }
  }

  if (!currentItem) return null

  if (isCompleted) {
    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0)
    const maxScore = 54
    return (
      <div className="bg-green-50 rounded-lg p-4 text-center">
        <p className="text-green-700 font-medium">Subprueba completada</p>
        <p className="text-sm text-green-600 mt-1">Puntaje total: {totalScore} / {maxScore}</p>
        <div className="text-xs text-gray-500 mt-2">
          RD-D: {Object.keys(scores).filter(k => k.startsWith('RD-D')).reduce((a, k) => a + (scores[k] || 0), 0)} / 18 |
          RD-I: {Object.keys(scores).filter(k => k.startsWith('RD-I')).reduce((a, k) => a + (scores[k] || 0), 0)} / 18 |
          RD-S: {Object.keys(scores).filter(k => k.startsWith('RD-S')).reduce((a, k) => a + (scores[k] || 0), 0)} / 18
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">
            {currentPart === 'RD-D' && '📋 Dígitos en orden directo'}
            {currentPart === 'RD-I' && '🔄 Dígitos en orden inverso'}
            {currentPart === 'RD-S' && '🔢 Dígitos en orden secuenciado'}
          </span>
          <span className="text-gray-800 font-medium">
            {isPractice ? 'Práctica' : `Ítem ${currentItem.num}`} / {partItems.filter(i => !i.isPractice).length}
            {!isPractice && ` (Intento ${currentTrial + 1}/2)`}
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${(currentPartIndex / ALL_PARTS.length) * 100}%` }} />
        </div>
        <p className="text-xs text-gray-500 mt-1">Parte {currentPartIndex + 1} de {ALL_PARTS.length}</p>
        {currentPart === 'RD-S' && globalConsecutiveZeros > 0 && (
          <span className="text-xs text-orange-600 ml-2">Fallos consecutivos: {globalConsecutiveZeros}/2</span>
        )}
      </div>

      <div className="bg-blue-50 rounded-lg border border-blue-200 p-6 text-center">
        <p className="text-sm text-blue-700 mb-3">📢 Dígitos para leer al paciente:</p>
        <p className="text-5xl font-mono font-bold tracking-wider text-gray-800">{currentTrialDigits?.join(' - ')}</p>
        {isPractice && <p className="text-xs text-blue-500 mt-3">Ítem de práctica (no suma puntos)</p>}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-3 text-center">✏️ Dígitos que dijo el paciente:</label>
        <DigitInput
          length={currentTrialDigits?.length || 0}
          value={digits}
          onChange={setDigits}
          disabled={showResult === true}
          autoFocus={!showResult}
          onSubmit={handleSubmit}
        />
        <p className="text-xs text-gray-400 mt-3 text-center">⏎ Presiona ENTER para confirmar y avanzar</p>
      </div>

      {showResult && (
        <div className={`rounded-lg p-4 text-center ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <p className={`font-medium text-lg ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
            {isCorrect ? '✓ ¡Correcto!' : '✗ Incorrecto'}
          </p>
          {!isCorrect && currentTrialDigits && (
            <p className="text-sm text-gray-600 mt-2">
              <strong>Respuesta esperada:</strong>{' '}
              <span className="font-mono text-lg">
                {currentPart === 'RD-D' ? currentTrialDigits.join(' - ') :
                 currentPart === 'RD-I' ? reverseArray(currentTrialDigits).join(' - ') :
                 sortAscending(currentTrialDigits).join(' - ')}
              </span>
            </p>
          )}
        </div>
      )}

      {isPractice && !showResult && (
        <button onClick={skipPractice} className="w-full py-2 text-sm text-gray-500 hover:text-gray-700">Saltar práctica</button>
      )}

      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-sm text-gray-600">Puntaje bruto acumulado: {Object.values(scores).reduce((a, b) => a + b, 0)} / 54</p>
        <div className="flex gap-4 text-xs text-gray-500 mt-1">
          <span>RD-D: {Object.keys(scores).filter(k => k.startsWith('RD-D')).reduce((a, k) => a + (scores[k] || 0), 0)} / 18</span>
          <span>RD-I: {Object.keys(scores).filter(k => k.startsWith('RD-I')).reduce((a, k) => a + (scores[k] || 0), 0)} / 18</span>
          <span>RD-S: {Object.keys(scores).filter(k => k.startsWith('RD-S')).reduce((a, k) => a + (scores[k] || 0), 0)} / 18</span>
        </div>
      </div>
    </div>
  )
})