'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'

// ============================================================
// CONFIGURACIÓN DE ÍTEMS PARA MATRICES DE RAZONAMIENTO (MR)
// ============================================================

interface MRItem {
  num: number | string
  correctAnswer: number
  isPractice: boolean
}

const MR_ITEMS: MRItem[] = [
  { num: 'PA', correctAnswer: 3, isPractice: true },
  { num: 'PB', correctAnswer: 1, isPractice: true },
  { num: 1, correctAnswer: 3, isPractice: false },
  { num: 2, correctAnswer: 4, isPractice: false },
  { num: 3, correctAnswer: 4, isPractice: false },
  { num: 4, correctAnswer: 3, isPractice: false },
  { num: 5, correctAnswer: 5, isPractice: false },
  { num: 6, correctAnswer: 2, isPractice: false },
  { num: 7, correctAnswer: 2, isPractice: false },
  { num: 8, correctAnswer: 1, isPractice: false },
  { num: 9, correctAnswer: 5, isPractice: false },
  { num: 10, correctAnswer: 5, isPractice: false },
  { num: 11, correctAnswer: 1, isPractice: false },
  { num: 12, correctAnswer: 2, isPractice: false },
  { num: 13, correctAnswer: 4, isPractice: false },
  { num: 14, correctAnswer: 1, isPractice: false },
  { num: 15, correctAnswer: 5, isPractice: false },
  { num: 16, correctAnswer: 2, isPractice: false },
  { num: 17, correctAnswer: 3, isPractice: false },
  { num: 18, correctAnswer: 2, isPractice: false },
  { num: 19, correctAnswer: 1, isPractice: false },
  { num: 20, correctAnswer: 5, isPractice: false },
  { num: 21, correctAnswer: 3, isPractice: false },
  { num: 22, correctAnswer: 4, isPractice: false },
  { num: 23, correctAnswer: 5, isPractice: false },
  { num: 24, correctAnswer: 2, isPractice: false },
  { num: 25, correctAnswer: 1, isPractice: false },
  { num: 26, correctAnswer: 3, isPractice: false },
  { num: 27, correctAnswer: 3, isPractice: false },
  { num: 28, correctAnswer: 4, isPractice: false },
  { num: 29, correctAnswer: 3, isPractice: false },
  { num: 30, correctAnswer: 1, isPractice: false },
  { num: 31, correctAnswer: 5, isPractice: false },
  { num: 32, correctAnswer: 4, isPractice: false }
]

// ============================================================
// COMPONENTE PRINCIPAL MATRICES DE RAZONAMIENTO
// ============================================================

interface MRInterfaceProps {
  onComplete: (scores: Record<string | number, number>, rawTotal: number) => void
  onUpdatePatient: (content: any) => void
  patientAge: number
}

export const MRInterface = React.memo(function MRInterface({ onComplete, onUpdatePatient, patientAge }: MRInterfaceProps) {
  const getStartItems = (): { first: number; second: number } => {
    if (patientAge <= 8) return { first: 1, second: 2 }
    if (patientAge <= 11) return { first: 5, second: 6 }
    return { first: 9, second: 10 }
  }

  const checkBonusEligibility = (scores: Record<string | number, number>): boolean => {
    const { first, second } = getStartItems()
    return scores[first] === 1 && scores[second] === 1
  }

  const getBonusPoints = (): number => {
    if (patientAge >= 9 && patientAge <= 11) return 4
    if (patientAge >= 12) return 8
    return 0
  }

  const getJumpItemAfterBacktrack = (failedItem: number): number => {
    if (patientAge <= 8) {
      if (failedItem === 1) return 3
      if (failedItem === 2) return 4
      return failedItem + 1
    }
    if (patientAge <= 11) {
      if (failedItem === 5) return 7
      if (failedItem === 6) return 8
      return failedItem + 1
    }
    if (failedItem === 9) return 11
    if (failedItem === 10) return 12
    return failedItem + 1
  }

  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [scores, setScores] = useState<Record<string | number, number>>({})
  const [consecutiveZeros, setConsecutiveZeros] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [bonusApplied, setBonusApplied] = useState(false)
  const [isGoingBack, setIsGoingBack] = useState(false)
  const [backtrackMode, setBacktrackMode] = useState(false)
  const [failedStartItem, setFailedStartItem] = useState<number | null>(null)
  const [consecutiveSuccessesInBacktrack, setConsecutiveSuccessesInBacktrack] = useState(0)
  const [hasSentFirstItem, setHasSentFirstItem] = useState(false)

  const currentItem = MR_ITEMS[currentIndex]
  const isPractice = currentItem?.isPractice || false
  const { first: firstStartItem, second: secondStartItem } = getStartItems()

  const onCompleteRef = useRef(onComplete)
  const onUpdatePatientRef = useRef(onUpdatePatient)

  useEffect(() => {
    onCompleteRef.current = onComplete
    onUpdatePatientRef.current = onUpdatePatient
  }, [onComplete, onUpdatePatient])

  // Enviar el estímulo actual al display (se ejecuta al montar y cada vez que cambia currentItem)
  useEffect(() => {
    if (currentItem && !isCompleted) {
      const imageName = isPractice 
        ? `matrices${currentItem.num.toString().toLowerCase()}.png`
        : `matrices${String(currentItem.num).padStart(3, '0')}.png`
      
      onUpdatePatientRef.current({
        type: 'wisc5_mr',
        itemNum: currentItem.num,
        imagePath: `/wisc5/mr/${imageName}`,
        isPractice: currentItem.isPractice
      })
    }
  }, [currentItem, isCompleted, isPractice])

  // Efecto adicional para asegurar que el primer ítem se envíe incluso si el efecto anterior no se dispara por alguna razón
  useEffect(() => {
    if (!hasSentFirstItem && currentItem && !isCompleted) {
      setHasSentFirstItem(true)
      // El envío ya se hace en el efecto anterior, pero forzamos una re-ejecución si es necesario
    }
  }, [currentItem, hasSentFirstItem, isCompleted])

  // Bonus
  useEffect(() => {
    if (!bonusApplied && checkBonusEligibility(scores)) {
      setBonusApplied(true)
    }
  }, [scores, bonusApplied, firstStartItem, secondStartItem])

  const markSkippedItemsAsCorrect = (
    newScores: Record<string | number, number>, fromItem: number, toItem: number
  ): Record<string | number, number> => {
    const updatedScores = { ...newScores }
    for (let i = toItem + 1; i < fromItem; i++) {
      if (updatedScores[i] === undefined && i >= 1 && !isNaN(i)) {
        updatedScores[i] = 1
      }
    }
    return updatedScores
  }

  const getNextItemIndex = (currentItemNum: number | string, currentScore: number): { nextIndex: number; updatedScores: Record<string | number, number> } => {
    let updatedScores = { ...scores }
    const currentIdx = MR_ITEMS.findIndex(i => i.num === currentItemNum)
    
    if (currentItemNum === 'PA') return { nextIndex: MR_ITEMS.findIndex(i => i.num === 'PB'), updatedScores }
    if (currentItemNum === 'PB') return { nextIndex: MR_ITEMS.findIndex(i => i.num === firstStartItem), updatedScores }

    const numericItem = typeof currentItemNum === 'number' ? currentItemNum : parseInt(currentItemNum as string)
    
    if (backtrackMode) {
      if (currentScore === 1) {
        const newSuccesses = consecutiveSuccessesInBacktrack + 1
        setConsecutiveSuccessesInBacktrack(newSuccesses)
        if (newSuccesses >= 2) {
          setBacktrackMode(false)
          setConsecutiveSuccessesInBacktrack(0)
          updatedScores = markSkippedItemsAsCorrect(updatedScores, failedStartItem!, numericItem)
          const jumpItem = getJumpItemAfterBacktrack(failedStartItem!)
          const jumpIndex = MR_ITEMS.findIndex(i => i.num === jumpItem)
          return { nextIndex: jumpIndex >= 0 ? jumpIndex : currentIdx + 1, updatedScores }
        }
        let prevItem = numericItem - 1
        while (prevItem >= 1 && updatedScores[prevItem] !== undefined) prevItem--
        if (prevItem >= 1) return { nextIndex: MR_ITEMS.findIndex(i => i.num === prevItem), updatedScores }
      } else {
        setConsecutiveSuccessesInBacktrack(0)
        let prevItem = numericItem - 1
        while (prevItem >= 1 && updatedScores[prevItem] !== undefined) prevItem--
        if (prevItem >= 1) return { nextIndex: MR_ITEMS.findIndex(i => i.num === prevItem), updatedScores }
      }
      setBacktrackMode(false)
      setConsecutiveSuccessesInBacktrack(0)
    }

    const isFirstTwo = numericItem === firstStartItem || numericItem === secondStartItem
    if (isFirstTwo && currentScore === 0) {
      setBacktrackMode(true)
      setFailedStartItem(numericItem)
      setConsecutiveSuccessesInBacktrack(0)
      let prevItem = numericItem - 1
      while (prevItem >= 1 && updatedScores[prevItem] !== undefined) prevItem--
      if (prevItem >= 1) return { nextIndex: MR_ITEMS.findIndex(i => i.num === prevItem), updatedScores }
    }

    let nextIdx = currentIdx + 1
    while (nextIdx < MR_ITEMS.length && updatedScores[MR_ITEMS[nextIdx].num] !== undefined) nextIdx++
    return { nextIndex: nextIdx, updatedScores }
  }

  const handleAnswer = (selected: number) => {
    if (scores[currentItem.num] !== undefined) return

    const isCorrect = selected === currentItem.correctAnswer
    const score = isCorrect ? 1 : 0
    const effectiveScore = isPractice ? 0 : score
    let newScores = { ...scores, [currentItem.num]: effectiveScore }
    setScores(newScores)
    setSelectedAnswer(null)

    if (!isPractice) {
      if (effectiveScore === 0) {
        const newZeros = consecutiveZeros + 1
        setConsecutiveZeros(newZeros)
        if (newZeros >= 3) {
          const total = Object.values(newScores).reduce((a, b) => a + b, 0) + (bonusApplied ? getBonusPoints() : 0)
          setIsCompleted(true)
          onCompleteRef.current(newScores, total)
          return
        }
      } else {
        setConsecutiveZeros(0)
      }
    }

    const { nextIndex, updatedScores } = getNextItemIndex(currentItem.num, effectiveScore)
    newScores = updatedScores
    setScores(newScores)
    
    if (nextIndex >= MR_ITEMS.length) {
      const total = Object.values(newScores).reduce((a, b) => a + b, 0) + (bonusApplied ? getBonusPoints() : 0)
      setIsCompleted(true)
      onCompleteRef.current(newScores, total)
    } else {
      setCurrentIndex(nextIndex)
      setIsGoingBack(nextIndex < currentIndex)
    }
  }

  const getCurrentImagePath = (): string => {
    if (!currentItem) return ''
    const imageName = isPractice 
      ? `matrices${currentItem.num.toString().toLowerCase()}.png`
      : `matrices${String(currentItem.num).padStart(3, '0')}.png`
    return `/wisc5/mr/${imageName}`
  }

  if (!currentItem) return null

  if (isCompleted) {
    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0) + (bonusApplied ? getBonusPoints() : 0)
    return (
      <div className="bg-green-50 rounded-lg p-3 text-center">
        <p className="text-green-700 font-medium text-sm">Subprueba completada</p>
        <p className="text-xs text-green-600 mt-1">
          Puntaje total: {totalScore} / {MR_ITEMS.filter(i => !i.isPractice).length}
          {bonusApplied && <span className="ml-2 text-blue-600">(incluye +{getBonusPoints()} puntos por bonus)</span>}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Barra de progreso con número de ítem */}
      <div className="bg-gray-50 rounded-lg p-2">
        <div className="flex justify-between items-center mb-1">
          <span className="text-gray-600 text-xs">Matrices de Razonamiento</span>
          <span className="text-2xl font-bold text-gray-800">
            {isPractice ? 'Práctica' : currentItem.num}
          </span>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Ítem actual</span>
          <span>de {MR_ITEMS.filter(i => !i.isPractice).length}</span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(Object.keys(scores).filter(k => !isNaN(Number(k))).length / MR_ITEMS.filter(i => !i.isPractice).length) * 100}%` }} />
        </div>
        {isGoingBack && <p className="text-xs text-orange-600 mt-1">↩️ Retrocediendo...</p>}
        {backtrackMode && <p className="text-xs text-orange-600 mt-1">🔄 Modo retroceso activo - Éxitos: {consecutiveSuccessesInBacktrack}/2</p>}
        {bonusApplied && <p className="text-xs text-blue-600 mt-1">✓ Bonus de +{getBonusPoints()} puntos aplicado</p>}
      </div>

      {/* Imagen de estímulo (miniatura) */}
      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <p className="text-xs font-medium text-gray-700 mb-1 text-center">📷 Estímulo (miniatura):</p>
        <img 
          src={getCurrentImagePath()} 
          alt={`Matriz ${currentItem.num}`}
          className="mx-auto max-h-32 object-contain border border-gray-200 rounded-lg"
          onError={(e) => { e.currentTarget.src = '/placeholder-image.png' }}
        />
        <div className="mt-2 p-1.5 bg-blue-50 rounded text-center">
          <p className="text-xs text-blue-700"><strong>Respuesta correcta: {currentItem.correctAnswer}</strong></p>
        </div>
      </div>

      {/* Botones de respuesta */}
      {scores[currentItem.num] === undefined && (
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <p className="text-sm text-gray-600 mb-2">
            Respuesta del evaluado:
            {isPractice && <span className="ml-2 text-xs text-gray-400">(no suma puntos)</span>}
          </p>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map(num => (
              <button
                key={num}
                onClick={() => handleAnswer(num)}
                className={`py-2 rounded-lg text-base font-medium transition-all ${
                  selectedAnswer === num ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      )}

      {scores[currentItem.num] !== undefined && (
        <div className={`rounded-lg p-2 text-center ${scores[currentItem.num] === 1 ? 'bg-green-50' : 'bg-red-50'}`}>
          <p className={`text-xs ${scores[currentItem.num] === 1 ? 'text-green-700' : 'text-red-700'}`}>
            ✓ Ítem respondido - {scores[currentItem.num] === 1 ? 'Correcto' : 'Incorrecto'}
            {isPractice && <span className="ml-2 text-xs">(no suma al total)</span>}
          </p>
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-2">
        <p className="text-xs text-gray-600">
          Puntaje bruto acumulado: {Object.values(scores).reduce((a, b) => a + b, 0)} / {MR_ITEMS.filter(i => !i.isPractice).length}
          {!bonusApplied && ((patientAge >= 9 && patientAge <= 11 && scores[firstStartItem] === 1 && scores[secondStartItem] !== 1) ||
            (patientAge >= 12 && scores[firstStartItem] === 1 && scores[secondStartItem] !== 1)) && (
            <span className="ml-2 text-xs text-blue-600">(Falta ítem {secondStartItem} para bonus de +{getBonusPoints()})</span>
          )}
        </p>
      </div>
    </div>
  )
})