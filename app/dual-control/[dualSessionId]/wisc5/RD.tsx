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

// Todas las partes en orden
const ALL_PARTS: RDPart[] = ['RD-D', 'RD-I', 'RD-S']

const getItemsForPart = (part: RDPart): RDItem[] => {
  switch (part) {
    case 'RD-D': return RD_D_ITEMS
    case 'RD-I': return RD_I_ITEMS
    case 'RD-S': return RD_S_ITEMS
  }
}

// ============================================================
// FUNCIONES DE VALIDACIÓN
// ============================================================

/**
 * Invierte un array de números (para RD-I)
 */
const reverseArray = (arr: number[]): number[] => [...arr].reverse()

/**
 * Ordena un array de números de menor a mayor (para RD-S)
 */
const sortAscending = (arr: number[]): number[] => [...arr].sort((a, b) => a - b)

/**
 * Verifica si la respuesta del evaluador coincide con la respuesta correcta
 */
const validateResponse = (part: RDPart, trial: number[], userInput: string): boolean => {
  // Limpiar input: eliminar espacios, guiones, comas y convertir a array de números
  const cleaned = userInput
    .trim()
    .replace(/[,\-\s]+/g, ' ')
    .split(' ')
    .filter(s => s.length > 0)
    .map(s => parseInt(s, 10))
    .filter(n => !isNaN(n))

  let expected: number[]
  switch (part) {
    case 'RD-D':
      expected = trial
      break
    case 'RD-I':
      expected = reverseArray(trial)
      break
    case 'RD-S':
      expected = sortAscending(trial)
      break
  }

  // Comparar arrays
  if (cleaned.length !== expected.length) return false
  for (let i = 0; i < cleaned.length; i++) {
    if (cleaned[i] !== expected[i]) return false
  }
  return true
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
  // Estado de navegación
  const [currentPartIndex, setCurrentPartIndex] = useState<number>(0)
  const [currentItemIndex, setCurrentItemIndex] = useState<number>(0)
  const [currentTrial, setCurrentTrial] = useState<0 | 1>(0)
  
  // Estado de puntuación
  const [scores, setScores] = useState<Record<string, number>>({})
  const [consecutiveZeros, setConsecutiveZeros] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  
  // Estado del input
  const [userInput, setUserInput] = useState('')
  const [showResult, setShowResult] = useState<boolean | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)

  const currentPart = ALL_PARTS[currentPartIndex]
  const partItems = getItemsForPart(currentPart)
  const currentItem = partItems[currentItemIndex]
  const isPractice = currentItem?.isPractice || false
  const currentTrialDigits = currentItem?.trials[currentTrial]

  const onCompleteRef = useRef(onComplete)
  const onUpdatePatientRef = useRef(onUpdatePatient)

  useEffect(() => {
    onCompleteRef.current = onComplete
    onUpdatePatientRef.current = onUpdatePatient
  }, [onComplete, onUpdatePatient])

  // Enviar instrucción al display
  useEffect(() => {
    if (currentItem && !isCompleted) {
      let instruction = ''
      if (currentPart === 'RD-D') {
        instruction = 'Voy a decir unos números. Escucha con atención y cuando termine, repítelos en el MISMO orden.'
      } else if (currentPart === 'RD-I') {
        instruction = 'Ahora voy a decir más números. Esta vez quiero que los repitas AL REVÉS, de atrás hacia adelante.'
      } else if (currentPart === 'RD-S') {
        instruction = 'Ahora voy a decir otros números. Esta vez quiero que los repitas en orden DE MENOR A MAYOR.'
      }

      onUpdatePatientRef.current({
        type: 'wisc5_rd',
        part: currentPart,
        instruction,
        isPractice: currentItem.isPractice || false
      })
    }
  }, [currentPart, currentItem, isCompleted])

  const getScoreKey = (part: RDPart, itemNum: number | string, trial: number): string => {
    return `${part}-${itemNum}-trial${trial}`
  }

  const handleSubmit = () => {
    if (!currentTrialDigits) return

    const correct = validateResponse(currentPart, currentTrialDigits, userInput)
    setIsCorrect(correct)
    setShowResult(true)

    if (!isPractice) {
      const score = correct ? 1 : 0
      const scoreKey = getScoreKey(currentPart, currentItem.num, currentTrial)
      const newScores = { ...scores, [scoreKey]: score }
      setScores(newScores)

      // Verificar reglas de terminación
      if (currentPart === 'RD-S') {
        if (score === 0) {
          const newConsecutiveZeros = consecutiveZeros + 1
          setConsecutiveZeros(newConsecutiveZeros)
          if (newConsecutiveZeros >= 2) {
            moveToNextPartOrComplete(newScores)
            return
          }
        } else {
          setConsecutiveZeros(0)
        }
      }
    }
  }

  const handleContinue = () => {
    setShowResult(null)
    setIsCorrect(null)
    setUserInput('')

    const scoreKey = getScoreKey(currentPart, currentItem.num, currentTrial)
    const currentScore = scores[scoreKey]

    // Determinar siguiente paso
    if (!isPractice && currentScore === 0 && currentTrial === 0) {
      // Falló primer intento, pasar al segundo intento
      setCurrentTrial(1)
      return
    }

    // Avanzar al siguiente ítem
    if (currentItemIndex + 1 < partItems.length) {
      setCurrentItemIndex(currentItemIndex + 1)
      setCurrentTrial(0)
    } else {
      // Fin de la parte actual
      moveToNextPartOrComplete(scores)
    }
  }

  const moveToNextPartOrComplete = (currentScores: Record<string, number>) => {
    if (currentPartIndex + 1 < ALL_PARTS.length) {
      // Pasar a la siguiente parte
      setCurrentPartIndex(currentPartIndex + 1)
      setCurrentItemIndex(0)
      setCurrentTrial(0)
      setConsecutiveZeros(0)
      setShowResult(null)
      setIsCorrect(null)
      setUserInput('')
    } else {
      // Completar la subprueba
      const total = Object.values(currentScores).reduce((a, b) => a + b, 0)
      setIsCompleted(true)
      onCompleteRef.current(currentScores, total)
    }
  }

  // Saltar práctica (solo para ítems de práctica)
  const skipPractice = () => {
    if (currentItemIndex + 1 < partItems.length) {
      setCurrentItemIndex(currentItemIndex + 1)
      setCurrentTrial(0)
      setShowResult(null)
      setIsCorrect(null)
      setUserInput('')
    }
  }

  if (!currentItem) return null

  if (isCompleted) {
    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0)
    const maxScore = 54 // 18 + 18 + 18
    
    return (
      <div className="bg-green-50 rounded-lg p-4 text-center">
        <p className="text-green-700 font-medium">Subprueba completada</p>
        <p className="text-sm text-green-600 mt-1">
          Puntaje total: {totalScore} / {maxScore}
        </p>
        <div className="text-xs text-gray-500 mt-2">
          RD-D: {RD_D_ITEMS.filter(i => !i.isPractice).length * 2} pts max | 
          RD-I: {RD_I_ITEMS.filter(i => !i.isPractice).length * 2} pts max | 
          RD-S: {RD_S_ITEMS.filter(i => !i.isPractice).length * 2} pts max
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Barra de progreso */}
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">
            {currentPart === 'RD-D' && 'Dígitos en orden directo'}
            {currentPart === 'RD-I' && 'Dígitos en orden inverso'}
            {currentPart === 'RD-S' && 'Dígitos en orden secuenciado'}
          </span>
          <span className="text-gray-800 font-medium">
            {isPractice ? 'Práctica' : `Ítem ${currentItem.num}`} / {partItems.filter(i => !i.isPractice).length}
            {!isPractice && ` (Intento ${currentTrial + 1}/2)`}
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 rounded-full" 
            style={{ width: `${(currentPartIndex / ALL_PARTS.length) * 100}%` }} 
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Parte {currentPartIndex + 1} de {ALL_PARTS.length}
        </p>
      </div>

      {/* Dígitos a leer (solo visible para el evaluador) */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-6 text-center">
        <p className="text-sm text-blue-700 mb-3">Dígitos para leer al paciente:</p>
        <p className="text-4xl font-mono font-bold tracking-wider text-gray-800">
          {currentTrialDigits?.join(' - ')}
        </p>
        {isPractice && (
          <p className="text-xs text-blue-500 mt-3">
            Ítem de práctica (no suma puntos)
          </p>
        )}
      </div>

      {/* Campo de entrada para el evaluador */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Dígitos que dijo el paciente:
        </label>
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          disabled={showResult === true}
          placeholder="Ej: 2 9 o 2-9 o 2,9"
          className="w-full px-4 py-3 text-lg font-mono border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !showResult && userInput.trim()) {
              handleSubmit()
            }
          }}
        />
        <p className="text-xs text-gray-400 mt-2">
          Separa los números con espacios, guiones o comas
        </p>
      </div>

      {/* Resultado */}
      {showResult && (
        <div className={`rounded-lg p-4 text-center ${
          isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <p className={`font-medium ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
            {isCorrect ? '✓ ¡Correcto!' : '✗ Incorrecto'}
          </p>
          {!isCorrect && (
            <p className="text-sm text-gray-600 mt-2">
              Respuesta esperada: {
                currentPart === 'RD-D' 
                  ? currentTrialDigits?.join(' - ')
                  : currentPart === 'RD-I'
                    ? reverseArray(currentTrialDigits!).join(' - ')
                    : sortAscending(currentTrialDigits!).join(' - ')
              }
            </p>
          )}
        </div>
      )}

      {/* Botones de acción */}
      {!showResult ? (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <button
            onClick={handleSubmit}
            disabled={!userInput.trim()}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Verificar respuesta
          </button>
          {isPractice && (
            <button
              onClick={skipPractice}
              className="w-full mt-2 py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              Saltar práctica
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <button
            onClick={handleContinue}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Continuar
          </button>
        </div>
      )}

      {/* Puntaje acumulado */}
      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-sm text-gray-600">
          Puntaje bruto acumulado: {Object.values(scores).reduce((a, b) => a + b, 0)} / 54
        </p>
        <div className="flex gap-4 text-xs text-gray-500 mt-1">
          <span>RD-D: {Object.keys(scores).filter(k => k.startsWith('RD-D')).reduce((a, k) => a + (scores[k] || 0), 0)} / 18</span>
          <span>RD-I: {Object.keys(scores).filter(k => k.startsWith('RD-I')).reduce((a, k) => a + (scores[k] || 0), 0)} / 18</span>
          <span>RD-S: {Object.keys(scores).filter(k => k.startsWith('RD-S')).reduce((a, k) => a + (scores[k] || 0), 0)} / 18</span>
        </div>
      </div>
    </div>
  )
})