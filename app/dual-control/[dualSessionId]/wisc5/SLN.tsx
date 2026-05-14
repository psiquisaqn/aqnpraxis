'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'

// ============================================================
// CONFIGURACIÓN DE ÍTEMS PARA SECUENCIACIÓN DE LETRAS Y NÚMEROS (SLN)
// ============================================================

interface SLNItem {
  num: number | string
  trials: string[][]
  correctAnswers: string[][]
  isPractice: boolean
  isExample: boolean
  type: 'qualifying' | 'simple' | 'complex'
}

const SLN_ITEMS: SLNItem[] = [
  // Ítems de calificación (solo 6-7 años)
  { num: 'QC', trials: [['Contar hasta 3'], ['Recitar alfabeto hasta C']], correctAnswers: [['1,2,3'], ['A,B,C']], isPractice: true, isExample: true, type: 'qualifying' },
  // Ejemplo A y Práctica A (1 número + 1 letra)
  { num: 'EA', trials: [['A', '2']], correctAnswers: [['2', 'A']], isPractice: true, isExample: true, type: 'simple' },
  { num: 'PA', trials: [['B', '1']], correctAnswers: [['1', 'B']], isPractice: true, isExample: false, type: 'simple' },
  // Ítems 1-2 (1 número + 1 letra)
  { num: 1, trials: [['A', '3'], ['1', 'C'], ['B', '2']], correctAnswers: [['3', 'A'], ['1', 'C'], ['2', 'B']], isPractice: false, isExample: false, type: 'simple' },
  { num: 2, trials: [['5', 'E'], ['C', '4'], ['1', 'D']], correctAnswers: [['5', 'E'], ['C', '4'], ['1', 'D']], isPractice: false, isExample: false, type: 'simple' },
  // Ejemplo B y Práctica B (varios números + letras)
  { num: 'EB', trials: [['3', 'F', '2']], correctAnswers: [['2', '3', 'F']], isPractice: true, isExample: true, type: 'complex' },
  { num: 'PB', trials: [['E', '5', 'A']], correctAnswers: [['5', 'A', 'E']], isPractice: true, isExample: false, type: 'complex' },
  // Ítems 3-10 (varios números + letras)
  { num: 3, trials: [['A', '3', '2'], ['4', '1', 'C'], ['F', 'D', '5']], 
    correctAnswers: [['2', '3', 'A', 'A', '2', '3'], ['1', '4', 'C', 'C', '1', '4'], ['5', 'D', 'F', 'D', 'F', '5']], 
    isPractice: false, isExample: false, type: 'complex' },
  { num: 4, trials: [['Z', 'U', '9'], ['8', '2', 'D'], ['C', '5', 'U']], 
    correctAnswers: [['9', 'U', 'Z', 'U', 'Z', '9'], ['2', '8', 'D', 'D', '2', '8'], ['5', 'C', 'U', 'C', 'U', '5']], 
    isPractice: false, isExample: false, type: 'complex' },
  { num: 5, trials: [['9', 'H', '3'], ['J', '6', 'N'], ['5', 'E', '8']], 
    correctAnswers: [['3', '9', 'H', 'H', '3', '9'], ['6', 'J', 'N', 'J', 'N', '6'], ['5', '8', 'E', 'E', '5', '8']], 
    isPractice: false, isExample: false, type: 'complex' },
  { num: 6, trials: [['1', 'Z', '4', 'J'], ['T', '8', 'M', '9'], ['5', 'A', '2', 'G']], 
    correctAnswers: [['1', '4', 'J', 'Z', 'J', 'Z', '1', '4'], ['8', '9', 'M', 'T', 'M', 'T', '8', '9'], ['2', '5', 'A', 'G', 'A', 'G', '2', '5']], 
    isPractice: false, isExample: false, type: 'complex' },
  { num: 7, trials: [['U', '1', 'G', '7', 'X'], ['8', 'D', '2', 'R', '7'], ['S', '6', 'K', '3', 'M']], 
    correctAnswers: [['1', '7', 'G', 'U', 'X', 'G', 'U', 'X', '1', '7'], ['2', '7', '8', 'D', 'R', 'D', 'R', '2', '7', '8'], ['3', '6', 'K', 'M', 'S', 'K', 'M', 'S', '3', '6']], 
    isPractice: false, isExample: false, type: 'complex' },
  { num: 8, trials: [['1', 'E', '4', 'F', '9', 'H'], ['J', '2', 'P', '5', 'F', '6'], ['7', 'U', '6', 'M', '3', 'T']], 
    correctAnswers: [['1', '4', '9', 'E', 'F', 'H', 'E', 'F', 'H', '1', '4', '9'], ['2', '5', '6', 'F', 'J', 'P', 'F', 'J', 'P', '2', '5', '6'], ['3', '6', '7', 'M', 'T', 'U', 'M', 'T', 'U', '3', '6', '7']], 
    isPractice: false, isExample: false, type: 'complex' },
  { num: 9, trials: [['S', '2', 'K', '4', 'U', '1', 'G'], ['7', 'S', '9', 'K', '1', 'T', '6'], ['N', '2', 'J', '6', 'R', '8', 'D']], 
    correctAnswers: [['1', '2', '4', 'G', 'K', 'S', 'U', 'G', 'K', 'S', 'U', '1', '2', '4'], ['1', '6', '7', '9', 'K', 'S', 'T', 'K', 'S', 'T', '1', '6', '7', '9'], ['2', '6', '8', 'D', 'J', 'N', 'R', 'D', 'J', 'N', 'R', '2', '6', '8']], 
    isPractice: false, isExample: false, type: 'complex' },
  { num: 10, trials: [['4', 'X', '9', 'R', '1', 'M', '7', 'H'], ['D', '2', 'X', '9', 'A', '6', 'Z', '4'], ['2', 'P', '1', 'U', '4', 'K', '7', 'D']], 
    correctAnswers: [['1', '4', '7', '9', 'H', 'M', 'R', 'X', 'H', 'M', 'R', 'X', '1', '4', '7', '9'], ['2', '4', '6', '9', 'A', 'D', 'X', 'Z', 'A', 'D', 'X', 'Z', '2', '4', '6', '9'], ['1', '2', '4', '7', 'D', 'K', 'P', 'U', 'D', 'K', 'P', 'U', '1', '2', '4', '7']], 
    isPractice: false, isExample: false, type: 'complex' }
]

// ============================================================
// FUNCIONES AUXILIARES
// ============================================================

const normalizeAnswer = (input: string): string[] => {
  return input
    .trim()
    .toUpperCase()
    .replace(/[,\-\s]+/g, ' ')
    .split(' ')
    .filter(s => s.length > 0)
}

const validateResponse = (userInput: string, correctAnswersList: string[][]): boolean => {
  const userAnswers = normalizeAnswer(userInput)
  if (userAnswers.length === 0) return false

  // Verificar si coincide con alguna de las respuestas correctas
  for (const correct of correctAnswersList) {
    if (JSON.stringify(userAnswers) === JSON.stringify(correct)) {
      return true
    }
  }
  return false
}

// ============================================================
// COMPONENTE DE INPUT (SIMILAR A RD)
// ============================================================

interface DigitInputProps {
  length: number
  value: string[]
  onChange: (values: string[]) => void
  disabled?: boolean
  autoFocus?: boolean
}

function DigitInput({ length, value, onChange, disabled = false, autoFocus = true }: DigitInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (autoFocus && inputRefs.current[0] && !disabled) {
      inputRefs.current[0].focus()
    }
  }, [autoFocus, disabled, length])

  const handleChange = (index: number, newValue: string) => {
    if (disabled) return
    
    const char = newValue.replace(/[^A-Za-z0-9]/g, '').slice(0, 1).toUpperCase()
    const newValues = [...value]
    newValues[index] = char
    onChange(newValues)
    
    if (char && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return
    
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  return (
    <div className="flex justify-center gap-2 flex-wrap">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={el => { inputRefs.current[index] = el }}
          type="text"
          maxLength={1}
          value={value[index] || ''}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          disabled={disabled}
          className={'w-10 h-12 text-center text-lg font-mono font-bold border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ' + (
            disabled ? 'bg-gray-100 text-gray-500 border-gray-200' : 'border-gray-300 text-gray-800'
          )}
        />
      ))}
    </div>
  )
}

// ============================================================
// COMPONENTE PRINCIPAL SLN
// ============================================================

interface SLNInterfaceProps {
  onComplete: (scores: Record<string | number, number>, rawTotal: number) => void
  onUpdatePatient: (content: any) => void
  patientAge: number
}

export const SLNInterface = React.memo(function SLNInterface({ onComplete, onUpdatePatient, patientAge }: SLNInterfaceProps) {
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const [currentTrial, setCurrentTrial] = useState<0 | 1 | 2>(0)
  const [userInput, setUserInput] = useState<string[]>([])
  const [scores, setScores] = useState<Record<string, number>>({})
  const [isCompleted, setIsCompleted] = useState(false)
  const [showResult, setShowResult] = useState<boolean | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [qualifyingPassed, setQualifyingPassed] = useState<boolean | null>(null)
  const [showQualifying, setShowQualifying] = useState(patientAge <= 7)
  const [countingOK, setCountingOK] = useState<boolean | null>(null)
  const [alphabetOK, setAlphabetOK] = useState<boolean | null>(null)
  const [zeroInItem, setZeroInItem] = useState(0)

  const currentItem = SLN_ITEMS[currentIndex]
  const currentTrialData = currentItem?.trials[currentTrial]
  const currentCorrectAnswers = currentItem?.correctAnswers[currentTrial]
  const isPractice = currentItem?.isPractice || false
  const isExample = currentItem?.isExample || false

  const onCompleteRef = useRef(onComplete)
  const onUpdatePatientRef = useRef(onUpdatePatient)

  useEffect(() => {
    onCompleteRef.current = onComplete
    onUpdatePatientRef.current = onUpdatePatient
  }, [onComplete, onUpdatePatient])

  // Reiniciar input al cambiar de ítem/intento
  useEffect(() => {
    if (currentTrialData) {
      setUserInput(new Array(currentTrialData.length).fill(''))
      setShowResult(null)
      setIsCorrect(null)
    }
  }, [currentIndex, currentTrial])

  // Enviar instrucción al display
  useEffect(() => {
    if (currentItem && !isCompleted) {
      let instruction = ''
      if (currentItem.type === 'qualifying') {
        instruction = 'Vamos a hacer unos ejercicios. Primero, cuenta hasta 3. Luego, recita el alfabeto hasta la letra C.'
      } else if (currentItem.type === 'simple') {
        instruction = 'Te voy a decir un número y una letra. Quiero que me los digas en orden: primero el número y después la letra.'
      } else {
        instruction = 'Ahora te voy a decir más números y letras. Quiero que los ordenes: primero los números de menor a mayor y luego las letras en orden alfabético.'
      }

      onUpdatePatientRef.current({
        type: 'wisc5_sln',
        instruction,
        itemNum: currentItem.num,
        isPractice: currentItem.isPractice,
        isExample: currentItem.isExample
      })
    }
  }, [currentItem, isCompleted])

  const handleQualifyingAnswer = (type: 'counting' | 'alphabet', passed: boolean) => {
    if (type === 'counting') {
      setCountingOK(passed)
    } else {
      setAlphabetOK(passed)
    }
    
    // Si ambos respondidos
    if ((type === 'alphabet' && countingOK !== null) || (type === 'counting' && alphabetOK !== null)) {
      const finalPassed = (type === 'counting' ? passed : countingOK!) && (type === 'alphabet' ? passed : alphabetOK!)
      setQualifyingPassed(finalPassed)
      
      if (finalPassed) {
        // Avanzar al siguiente ítem
        setTimeout(() => {
          const nextIdx = SLN_ITEMS.findIndex(i => i.num === 'EA')
          if (nextIdx >= 0) {
            setCurrentIndex(nextIdx)
            setCurrentTrial(0)
          }
        }, 1000)
      } else {
        setIsCompleted(true)
        onCompleteRef.current({}, 0)
      }
    }
  }

  const handleSubmit = () => {
    if (!currentCorrectAnswers) return
    if (userInput.some(v => !v)) {
      alert('Por favor, completa todos los caracteres')
      return
    }

    const userAnswerStr = userInput.join(' ')
    const correct = validateResponse(userAnswerStr, [currentCorrectAnswers])
    setIsCorrect(correct)
    setShowResult(true)
  }

  const getScoreKey = (itemNum: number | string, trial: number): string => {
    return itemNum + '-trial' + trial
  }

  const handleContinue = () => {
    const scoreKey = getScoreKey(currentItem.num, currentTrial)
    const score = isCorrect ? 1 : 0
    const effectiveScore = (isPractice || isExample) ? 0 : score
    const newScores = { ...scores, [scoreKey]: effectiveScore }
    setScores(newScores)
    setShowResult(null)
    setIsCorrect(null)

    if (!isPractice && !isExample && effectiveScore === 0) {
      const newZeros = zeroInItem + 1
      setZeroInItem(newZeros)
      
      if (newZeros >= 3) {
        // 3 intentos fallados en este ítem → suspender
        const total = Object.values(newScores).reduce((a, b) => a + b, 0)
        setIsCompleted(true)
        onCompleteRef.current(newScores, total)
        return
      }
    }

    // Avanzar al siguiente intento o ítem
    if (currentTrial < 2) {
      setCurrentTrial((currentTrial + 1) as 0 | 1 | 2)
    } else {
      setZeroInItem(0)
      let nextIdx = currentIndex + 1
      while (nextIdx < SLN_ITEMS.length && newScores[getScoreKey(SLN_ITEMS[nextIdx].num, 0)] !== undefined) {
        nextIdx++
      }
      
      if (nextIdx >= SLN_ITEMS.length) {
        const total = Object.values(newScores).reduce((a, b) => a + b, 0)
        setIsCompleted(true)
        onCompleteRef.current(newScores, total)
      } else {
        setCurrentIndex(nextIdx)
        setCurrentTrial(0)
      }
    }
  }

  if (!currentItem) return null

  // Pantalla de calificación (solo 6-7 años)
  if (showQualifying && currentItem.type === 'qualifying') {
    return (
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <h3 className="text-sm font-semibold text-gray-700">Ítems de Calificación</h3>
          <p className="text-xs text-gray-500 mt-1">Verifica que el evaluado tenga los conocimientos necesarios</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          <p className="text-lg font-medium text-gray-800 mb-4">¿El evaluado cuenta correctamente al menos hasta 3?</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => handleQualifyingAnswer('counting', true)}
              className="px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700">Sí</button>
            <button onClick={() => handleQualifyingAnswer('counting', false)}
              className="px-8 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700">No</button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          <p className="text-lg font-medium text-gray-800 mb-4">¿El evaluado recita el alfabeto correctamente al menos hasta la letra C?</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => handleQualifyingAnswer('alphabet', true)}
              className="px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700">Sí</button>
            <button onClick={() => handleQualifyingAnswer('alphabet', false)}
              className="px-8 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700">No</button>
          </div>
        </div>

        {qualifyingPassed === false && (
          <div className="bg-red-50 rounded-lg p-4 text-center border border-red-200">
            <p className="text-red-700 font-medium">El evaluado no cumple con los requisitos mínimos.</p>
            <p className="text-sm text-red-600 mt-1">No se debe administrar esta subprueba.</p>
          </div>
        )}
      </div>
    )
  }

  if (isCompleted) {
    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0)
    const maxScore = 30

    return (
      <div className="bg-green-50 rounded-lg p-4 text-center">
        <p className="text-green-700 font-medium">Subprueba completada</p>
        <p className="text-sm text-green-600 mt-1">
          Puntaje total: {totalScore} / {maxScore}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Barra de progreso */}
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Secuenciación de Letras y Números</span>
          <span className="text-gray-800 font-medium">
            {isExample ? 'Ejemplo ' + currentItem.num : isPractice ? 'Práctica ' + currentItem.num : 'Ítem ' + currentItem.num}
            {' - Intento ' + (currentTrial + 1) + '/3'}
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full" style={{
            width: (Object.keys(scores).length / 30) * 100 + '%'
          }} />
        </div>
        {isExample && <p className="text-xs text-gray-400 mt-1">Ítem de ejemplo (no suma puntos)</p>}
        {isPractice && <p className="text-xs text-gray-400 mt-1">Ítem de práctica (no suma puntos)</p>}
      </div>

      {/* Estímulo (visible para el evaluador) */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-6 text-center">
        <p className="text-sm text-blue-700 mb-3">Secuencia para leer al evaluado (1 por segundo):</p>
        <p className="text-4xl font-mono font-bold tracking-wider text-gray-800">
          {currentTrialData?.join(' - ')}
        </p>
        {currentItem.type === 'simple' && (
          <p className="text-xs text-blue-500 mt-3">El evaluado debe decir primero el número y luego la letra</p>
        )}
        {currentItem.type === 'complex' && (
          <p className="text-xs text-blue-500 mt-3">El evaluado debe ordenar números de menor a mayor y letras en orden alfabético</p>
        )}
      </div>

      {/* Campo de entrada */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
          ✏️ Respuesta del evaluado:
        </label>
        
        <DigitInput
          length={currentTrialData?.length || 0}
          value={userInput}
          onChange={setUserInput}
          disabled={showResult === true}
          autoFocus={!showResult}
        />
        
        <p className="text-xs text-gray-400 mt-4 text-center">
          Ingresa un carácter por casilla (números y letras)
        </p>
      </div>

      {/* Resultado */}
      {showResult && (
        <div className={'rounded-lg p-4 text-center border ' + (isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200')}>
          <p className={'font-medium text-lg ' + (isCorrect ? 'text-green-700' : 'text-red-700')}>
            {isCorrect ? '✓ ¡Correcto!' : '✗ Incorrecto'}
          </p>
        </div>
      )}

      {/* Botones */}
      {!showResult ? (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <button
            onClick={handleSubmit}
            disabled={userInput.some(v => !v)}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Verificar respuesta
          </button>
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
          Puntaje bruto acumulado: {Object.values(scores).reduce((a, b) => a + b, 0)} / 30
        </p>
      </div>

      {/* Instrucciones */}
      <div className="bg-blue-50 rounded-lg p-3">
        <p className="text-xs text-blue-700">
          <strong>Importante:</strong> Lea cada ítem a un ritmo de un número o letra por segundo. 
          No repita ningún intento. Si el evaluado se autocorrige, registre la respuesta final.
        </p>
      </div>
    </div>
  )
})