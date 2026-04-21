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
  // Determinar el ítem de inicio REAL después de las prácticas
  const getRealStartItem = (): number => {
    if (patientAge <= 8) return 1      // 6-8 años: empezar en ítem 1
    if (patientAge <= 11) return 5     // 9-11 años: empezar en ítem 5
    return 9                            // 12-16 años: empezar en ítem 9
  }

  // Verificar si aplica bonus
  const isBonusEligible = (): boolean => {
    if (patientAge >= 9 && patientAge <= 11) {
      // Bonus para 9-11 años: ítems 5 y 6
      return scores[5] === 1 && scores[6] === 1
    }
    if (patientAge >= 12) {
      // Bonus para 12+ años: ítems 9 y 10
      return scores[9] === 1 && scores[10] === 1
    }
    return false
  }

  const getBonusPoints = (): number => {
    if (patientAge >= 9 && patientAge <= 11) return 4
    if (patientAge >= 12) return 8
    return 0
  }

  // Siempre empezar desde PA (índice 0)
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [scores, setScores] = useState<Record<string | number, number>>({})
  const [consecutiveZeros, setConsecutiveZeros] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [bonusApplied, setBonusApplied] = useState(false)
  const [isGoingBack, setIsGoingBack] = useState(false)

  const currentItem = MR_ITEMS[currentIndex]
  const isPractice = currentItem?.isPractice || false

  // Referencias estables
  const onCompleteRef = useRef(onComplete)
  const onUpdatePatientRef = useRef(onUpdatePatient)

  useEffect(() => {
    onCompleteRef.current = onComplete
    onUpdatePatientRef.current = onUpdatePatient
  }, [onComplete, onUpdatePatient])

  // Enviar estímulo al display
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
  }, [currentItem, isCompleted])

  // Verificar bonus
  useEffect(() => {
    if (!bonusApplied && isBonusEligible()) {
      setBonusApplied(true)
      console.log(`🎉 Bonus de +${getBonusPoints()} puntos aplicado`)
    }
  }, [scores, bonusApplied])

  // Determinar siguiente ítem según reglas de retroceso
  const getNextItemIndex = (currentItemNum: number | string, currentScore: number): number => {
    const currentIdx = MR_ITEMS.findIndex(i => i.num === currentItemNum)
    
    // Si es práctica PA, pasar a PB
    if (currentItemNum === 'PA') return MR_ITEMS.findIndex(i => i.num === 'PB')
    
    // Si es práctica PB, pasar al ítem real de inicio según edad
    if (currentItemNum === 'PB') {
      const realStartItem = getRealStartItem()
      return MR_ITEMS.findIndex(i => i.num === realStartItem)
    }

    const numericItem = typeof currentItemNum === 'number' ? currentItemNum : parseInt(currentItemNum as string)
    
    // Reglas para 9-11 años
    if (patientAge >= 9 && patientAge <= 11) {
      // Si falla el ítem 5 (puntaje 0), retrocede al 4
      if (numericItem === 5 && currentScore === 0) {
        return MR_ITEMS.findIndex(i => i.num === 4)
      }
      // Si acierta el ítem 5 (puntaje 1) y no ha respondido el 4, ir al 4 (para verificar base)
      if (numericItem === 5 && currentScore === 1 && !scores[4]) {
        return MR_ITEMS.findIndex(i => i.num === 4)
      }
      // Si viene del 4 con acierto (1) y ya respondió 5, ir al 6
      if (numericItem === 4 && currentScore === 1 && scores[5] === 1 && !scores[6]) {
        return MR_ITEMS.findIndex(i => i.num === 6)
      }
      // Si falla el 6 (puntaje 0) habiendo acertado 5, retrocede al 4
      if (numericItem === 6 && currentScore === 0 && scores[5] === 1 && !scores[4]) {
        return MR_ITEMS.findIndex(i => i.num === 4)
      }
    }

    // Reglas para 12-16 años
    if (patientAge >= 12) {
      // Si falla el ítem 9 (puntaje 0), retrocede al 8
      if (numericItem === 9 && currentScore === 0) {
        return MR_ITEMS.findIndex(i => i.num === 8)
      }
      // Si acierta el ítem 9 (puntaje 1) y no ha respondido el 8, ir al 8
      if (numericItem === 9 && currentScore === 1 && !scores[8]) {
        return MR_ITEMS.findIndex(i => i.num === 8)
      }
      // Si viene del 8 con acierto (1) y ya respondió 9, ir al 10
      if (numericItem === 8 && currentScore === 1 && scores[9] === 1 && !scores[10]) {
        return MR_ITEMS.findIndex(i => i.num === 10)
      }
      // Si falla el 10 (puntaje 0) habiendo acertado 9, retrocede al 8
      if (numericItem === 10 && currentScore === 0 && scores[9] === 1 && !scores[8]) {
        return MR_ITEMS.findIndex(i => i.num === 8)
      }
    }

    // Avanzar al siguiente ítem no respondido
    let nextIdx = currentIdx + 1
    while (nextIdx < MR_ITEMS.length && scores[MR_ITEMS[nextIdx].num]) {
      nextIdx++
    }
    return nextIdx
  }

  const handleAnswer = (selected: number) => {
    if (scores[currentItem.num]) return

    const isCorrect = selected === currentItem.correctAnswer
    const score = isCorrect ? 1 : 0
    const newScores = { ...scores, [currentItem.num]: score }
    setScores(newScores)
    setSelectedAnswer(null)

    // Actualizar contador de ceros consecutivos
    if (score === 0) {
      const newConsecutiveZeros = consecutiveZeros + 1
      setConsecutiveZeros(newConsecutiveZeros)
      
      // Suspensión después de 3 ceros consecutivos
      if (newConsecutiveZeros >= 3) {
        const total = Object.values(newScores).reduce((a, b) => a + b, 0) + (bonusApplied ? getBonusPoints() : 0)
        setIsCompleted(true)
        onCompleteRef.current(newScores, total)
        return
      }
    } else {
      setConsecutiveZeros(0)
    }

    // Determinar siguiente ítem
    const nextIndex = getNextItemIndex(currentItem.num, score)
    
    if (nextIndex >= MR_ITEMS.length) {
      const total = Object.values(newScores).reduce((a, b) => a + b, 0) + (bonusApplied ? getBonusPoints() : 0)
      setIsCompleted(true)
      onCompleteRef.current(newScores, total)
    } else {
      setCurrentIndex(nextIndex)
      setIsGoingBack(nextIndex < currentIndex)
    }
  }

  if (!currentItem) return null

  if (isCompleted) {
    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0) + (bonusApplied ? getBonusPoints() : 0)
    return (
      <div className="bg-green-50 rounded-lg p-4 text-center">
        <p className="text-green-700 font-medium">Subprueba completada</p>
        <p className="text-sm text-green-600 mt-1">
          Puntaje total: {totalScore} / {MR_ITEMS.filter(i => !i.isPractice).length}
          {bonusApplied && <span className="ml-2 text-blue-600">(incluye +{getBonusPoints()} puntos por bonus)</span>}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Progreso */}
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Matrices de Razonamiento</span>
          <span className="text-gray-800 font-medium">
            {isPractice ? 'Práctica' : `Ítem ${currentItem.num}`} / {MR_ITEMS.filter(i => !i.isPractice).length}
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full" style={{ 
            width: `${(Object.keys(scores).filter(k => !isNaN(Number(k))).length / MR_ITEMS.filter(i => !i.isPractice).length) * 100}%` 
          }} />
        </div>
        {isGoingBack && <p className="text-xs text-orange-600 mt-1">Retrocediendo por reglas de aplicación...</p>}
        {bonusApplied && <p className="text-xs text-blue-600 mt-1">✓ Bonus de +{getBonusPoints()} puntos aplicado</p>}
      </div>

      {/* No mostramos la imagen aquí porque va en el display del paciente */}
      <div className="bg-blue-50 rounded-lg p-3 text-center">
        <p className="text-sm text-blue-700">
          La imagen se muestra en la pantalla del paciente.
          <br />
          Selecciona la respuesta que el paciente indique.
        </p>
      </div>

      {/* Botones de respuesta 1-5 */}
      {!scores[currentItem.num] && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-3">Respuesta del paciente:</p>
          <div className="grid grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map(num => (
              <button
                key={num}
                onClick={() => handleAnswer(num)}
                className={`py-3 rounded-lg text-lg font-medium transition-all ${
                  selectedAnswer === num
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mensaje de ítem ya respondido */}
      {scores[currentItem.num] !== undefined && (
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <p className="text-green-700 text-sm">
            ✓ Ítem respondido - {scores[currentItem.num] === 1 ? 'Correcto' : 'Incorrecto'}
          </p>
        </div>
      )}

      {/* Puntaje acumulado */}
      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-sm text-gray-600">
          Puntaje bruto acumulado: {Object.values(scores).reduce((a, b) => a + b, 0)} / {MR_ITEMS.filter(i => !i.isPractice).length}
          {!bonusApplied && patientAge >= 9 && patientAge <= 11 && scores[5] === 1 && scores[6] !== 1 && (
            <span className="ml-2 text-xs text-blue-600">(Falta ítem 6 para bonus de +4)</span>
          )}
          {!bonusApplied && patientAge >= 12 && scores[9] === 1 && scores[10] !== 1 && (
            <span className="ml-2 text-xs text-blue-600">(Falta ítem 10 para bonus de +8)</span>
          )}
        </p>
      </div>
    </div>
  )
})