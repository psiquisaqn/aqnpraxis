'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'

// ============================================================
// CONFIGURACIÓN DE ÍTEMS PARA RETENCIÓN DE IMÁGENES (RI)
// ============================================================

interface RIItem {
  num: number | string
  correctAnswers: string[]
  totalOptions: number
  maxScore: number
  isPractice: boolean
}

const RI_ITEMS: RIItem[] = [
  { num: 'PA', correctAnswers: ['B'], totalOptions: 2, maxScore: 1, isPractice: true },
  { num: 1, correctAnswers: ['A'], totalOptions: 2, maxScore: 1, isPractice: false },
  { num: 2, correctAnswers: ['C'], totalOptions: 4, maxScore: 1, isPractice: false },
  { num: 3, correctAnswers: ['E'], totalOptions: 5, maxScore: 1, isPractice: false },
  { num: 'PB', correctAnswers: ['B', 'A'], totalOptions: 2, maxScore: 2, isPractice: true },
  { num: 'PC', correctAnswers: ['D', 'A'], totalOptions: 5, maxScore: 2, isPractice: true },
  { num: 4, correctAnswers: ['C', 'D'], totalOptions: 4, maxScore: 2, isPractice: false },
  { num: 5, correctAnswers: ['B', 'A'], totalOptions: 4, maxScore: 2, isPractice: false },
  { num: 6, correctAnswers: ['A', 'E'], totalOptions: 6, maxScore: 2, isPractice: false },
  { num: 7, correctAnswers: ['F', 'B'], totalOptions: 6, maxScore: 2, isPractice: false },
  { num: 8, correctAnswers: ['A', 'B', 'E'], totalOptions: 5, maxScore: 2, isPractice: false },
  { num: 9, correctAnswers: ['B', 'E', 'D'], totalOptions: 6, maxScore: 2, isPractice: false },
  { num: 10, correctAnswers: ['D', 'F', 'C'], totalOptions: 6, maxScore: 2, isPractice: false },
  { num: 11, correctAnswers: ['A', 'F', 'E'], totalOptions: 6, maxScore: 2, isPractice: false },
  { num: 12, correctAnswers: ['F', 'C', 'B'], totalOptions: 6, maxScore: 2, isPractice: false },
  { num: 13, correctAnswers: ['B', 'H', 'C'], totalOptions: 8, maxScore: 2, isPractice: false },
  { num: 14, correctAnswers: ['A', 'C', 'E', 'F'], totalOptions: 6, maxScore: 2, isPractice: false },
  { num: 15, correctAnswers: ['B', 'C', 'F', 'D'], totalOptions: 6, maxScore: 2, isPractice: false },
  { num: 16, correctAnswers: ['G', 'B', 'D', 'F'], totalOptions: 8, maxScore: 2, isPractice: false },
  { num: 17, correctAnswers: ['G', 'D', 'B', 'A'], totalOptions: 8, maxScore: 2, isPractice: false },
  { num: 18, correctAnswers: ['C', 'B', 'I', 'H'], totalOptions: 10, maxScore: 2, isPractice: false },
  { num: 19, correctAnswers: ['D', 'G', 'A', 'I'], totalOptions: 10, maxScore: 2, isPractice: false },
  { num: 20, correctAnswers: ['E', 'F', 'H', 'B', 'A'], totalOptions: 8, maxScore: 2, isPractice: false },
  { num: 21, correctAnswers: ['E', 'G', 'B', 'C', 'H'], totalOptions: 8, maxScore: 2, isPractice: false },
  { num: 22, correctAnswers: ['F', 'B', 'I', 'H', 'D'], totalOptions: 10, maxScore: 2, isPractice: false },
  { num: 23, correctAnswers: ['A', 'C', 'F', 'H', 'K', 'E'], totalOptions: 12, maxScore: 2, isPractice: false },
  { num: 24, correctAnswers: ['L', 'B', 'H', 'I', 'J', 'D'], totalOptions: 12, maxScore: 2, isPractice: false },
  { num: 25, correctAnswers: ['H', 'B', 'L', 'G', 'C', 'E', 'J'], totalOptions: 12, maxScore: 2, isPractice: false },
  { num: 26, correctAnswers: ['G', 'A', 'K', 'C', 'F', 'D', 'I', 'B'], totalOptions: 12, maxScore: 2, isPractice: false }
]

// ============================================================
// FUNCIONES AUXILIARES
// ============================================================

const getOptionLetters = (total: number): string[] => {
  return 'ABCDEFGHIJKL'.slice(0, total).split('')
}

const getStimulusPath = (num: number | string): string => {
  if (typeof num === 'string') {
    return '/wisc5/ri/ri' + num.toLowerCase() + 'e.png'
  }
  return '/wisc5/ri/ri' + String(num).padStart(3, '0') + 'e.png'
}

const getOptionsPath = (num: number | string): string => {
  if (typeof num === 'string') {
    return '/wisc5/ri/ri' + num.toLowerCase() + 'o.png'
  }
  return '/wisc5/ri/ri' + String(num).padStart(3, '0') + 'o.png'
}

// ============================================================
// COMPONENTE PRINCIPAL RETENCIÓN DE IMÁGENES
// ============================================================

interface RIInterfaceProps {
  onComplete: (scores: Record<string | number, number>, rawTotal: number) => void
  onUpdatePatient: (content: any) => void
  patientAge: number
}

export const RIInterface = React.memo(function RIInterface({ onComplete, onUpdatePatient, patientAge }: RIInterfaceProps) {
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const [phase, setPhase] = useState<'ready' | 'showing' | 'answering'>('ready')
  const [showTimer, setShowTimer] = useState(5)
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([])
  const [scores, setScores] = useState<Record<string | number, number>>({})
  const [consecutiveZeros, setConsecutiveZeros] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  const currentItem = RI_ITEMS[currentIndex]
  const isPractice = currentItem?.isPractice || false
  const options = getOptionLetters(currentItem?.totalOptions || 2)

  const onCompleteRef = useRef(onComplete)
  const onUpdatePatientRef = useRef(onUpdatePatient)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    onCompleteRef.current = onComplete
    onUpdatePatientRef.current = onUpdatePatient
  }, [onComplete, onUpdatePatient])

  // Reiniciar selección al cambiar de ítem
  useEffect(() => {
    setSelectedAnswers([])
    setPhase('ready')
    setShowConfirmation(false)
  }, [currentIndex])

  // Enviar instrucciones al display según la fase
  useEffect(() => {
    if (currentItem && !isCompleted) {
      onUpdatePatientRef.current({
        type: 'wisc5_ri',
        itemNum: currentItem.num,
        phase: phase,
        stimulusImage: phase === 'showing' ? getStimulusPath(currentItem.num) : null,
        optionsImage: phase === 'answering' ? getOptionsPath(currentItem.num) : null,
        isPractice: currentItem.isPractice,
        totalOptions: currentItem.totalOptions,
        timeRemaining: phase === 'showing' ? showTimer : 0
      })
    }
  }, [currentItem, phase, showTimer, isCompleted])

  // Manejar cuenta regresiva de 5 segundos
  useEffect(() => {
    if (phase === 'showing' && showTimer > 0) {
      timerRef.current = setTimeout(() => {
        setShowTimer(prev => prev - 1)
      }, 1000)
    } else if (phase === 'showing' && showTimer === 0) {
      setPhase('answering')
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [phase, showTimer])

  const handleStartShow = () => {
    setShowTimer(5)
    setPhase('showing')
  }

  const toggleAnswer = (letter: string) => {
    if (phase !== 'answering' || showConfirmation) return

    setSelectedAnswers(prev => {
      if (prev.includes(letter)) {
        return prev.filter(l => l !== letter)
      }
      return [...prev, letter]
    })
  }

  const calculateScore = (item: RIItem, answers: string[]): number => {
    if (item.maxScore === 1) {
      // Ítems 1-3: 1 punto si selecciona la correcta
      return answers.length === 1 && answers[0] === item.correctAnswers[0] ? 1 : 0
    }

    // Ítems 4-26: hasta 2 puntos
    const correctSet = [...item.correctAnswers].sort().join(',')
    const answerSet = [...answers].sort().join(',')

    if (correctSet === answerSet) {
      // Mismas respuestas, verificar orden
      if (JSON.stringify(answers) === JSON.stringify(item.correctAnswers)) {
        return 2 // Orden correcto
      }
      return 1 // Orden incorrecto
    }
    return 0 // Faltan o sobran respuestas
  }

  const handleConfirm = () => {
    if (selectedAnswers.length === 0) return

    const score = calculateScore(currentItem, selectedAnswers)
    const effectiveScore = isPractice ? 0 : score
    const itemNum = currentItem.num
    const newScores = { ...scores, [itemNum]: effectiveScore }
    setScores(newScores)
    setShowConfirmation(true)

    if (!isPractice) {
      if (effectiveScore === 0) {
        const newZeros = consecutiveZeros + 1
        setConsecutiveZeros(newZeros)
        if (newZeros >= 3) {
          setTimeout(() => {
            const total = Object.values(newScores).reduce((a, b) => a + b, 0)
            setIsCompleted(true)
            onCompleteRef.current(newScores, total)
          }, 1500)
          return
        }
      } else {
        setConsecutiveZeros(0)
      }
    }
  }

  const handleNext = () => {
    let nextIdx = currentIndex + 1
    while (nextIdx < RI_ITEMS.length && scores[RI_ITEMS[nextIdx].num] !== undefined) {
      nextIdx++
    }

    if (nextIdx >= RI_ITEMS.length) {
      const total = Object.values(scores).reduce((a, b) => a + b, 0)
      setIsCompleted(true)
      onCompleteRef.current(scores, total)
    } else {
      setCurrentIndex(nextIdx)
    }
  }

  if (!currentItem) return null

  if (isCompleted) {
    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0)
    const maxScore = 49

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
          <span className="text-gray-600">Retención de Imágenes</span>
          <span className="text-gray-800 font-medium">
            {isPractice ? 'Práctica ' + currentItem.num : 'Ítem ' + currentItem.num} / {RI_ITEMS.filter(i => !i.isPractice).length}
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full" style={{
            width: (Object.keys(scores).filter(k => k !== 'PA' && k !== 'PB' && k !== 'PC').length / RI_ITEMS.filter(i => !i.isPractice).length) * 100 + '%'
          }} />
        </div>
        <div className="flex gap-2 mt-1">
          {isPractice && <span className="text-xs text-gray-400">Ítem de práctica (no suma puntos)</span>}
          {!isPractice && (
            <span className="text-xs text-gray-500">
              {currentItem.maxScore === 1
                ? 'Selecciona la imagen correcta (1 punto)'
                : 'Selecciona las ' + currentItem.correctAnswers.length + ' imágenes correctas (2 puntos si orden correcto, 1 punto si orden incorrecto)'}
            </span>
          )}
        </div>
      </div>

      {/* Fase: Listo para mostrar */}
      {phase === 'ready' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-700 font-medium mb-2">
              📋 Instrucciones para el evaluador:
            </p>
            <p className="text-sm text-blue-600">
              Presiona el botón para mostrar los estímulos durante <strong>5 segundos</strong> al evaluado. 
              La imagen aparecerá en el display del paciente. Cuando el tiempo termine, 
              automáticamente se mostrarán las opciones de respuesta.
            </p>
          </div>
          <div className="text-center">
            <button
              onClick={handleStartShow}
              className="px-8 py-4 bg-blue-600 text-white rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors shadow-md"
            >
              ▶ Mostrar estímulos al evaluado (5 segundos)
            </button>
            <p className="text-xs text-gray-400 mt-3">
              Imagen: {getStimulusPath(currentItem.num)}
            </p>
          </div>
        </div>
      )}

      {/* Fase: Mostrando estímulos */}
      {phase === 'showing' && (
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-6 text-center">
          <p className="text-sm text-blue-600 mb-3">⏱ Mostrando estímulos en el display del evaluado...</p>
          <div className="text-6xl font-mono font-bold text-blue-700 mb-3">{showTimer}</div>
          <p className="text-blue-600 text-sm">segundos restantes</p>
          <div className="h-2 bg-blue-200 rounded-full overflow-hidden mt-4">
            <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: ((5 - showTimer) / 5) * 100 + '%' }} />
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Imagen: {getStimulusPath(currentItem.num)}
          </p>
        </div>
      )}

      {/* Fase: Respondiendo */}
      {phase === 'answering' && !showConfirmation && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="bg-green-50 rounded-lg p-3 mb-4">
            <p className="text-sm text-green-700">
              ✅ Los estímulos ya fueron mostrados. El display ahora muestra las opciones de respuesta.
            </p>
            <p className="text-xs text-green-600 mt-1">
              El evaluado debe señalar {currentItem.correctAnswers.length === 1 ? 'la imagen correcta' : 'las ' + currentItem.correctAnswers.length + ' imágenes correctas'} 
              {currentItem.maxScore === 2 ? ' en el orden en que aparecieron' : ''}.
            </p>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Selecciona las respuestas del evaluado ({currentItem.correctAnswers.length} de {currentItem.totalOptions}):
          </p>
          <div className="grid grid-cols-4 md:grid-cols-6 gap-2 mb-4">
            {options.map(letter => (
              <button
                key={letter}
                onClick={() => toggleAnswer(letter)}
                className={'py-3 rounded-lg text-lg font-bold transition-all ' + (
                  selectedAnswers.includes(letter)
                    ? 'bg-blue-600 text-white shadow-md scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                {letter}
              </button>
            ))}
          </div>
          <button
            onClick={handleConfirm}
            disabled={selectedAnswers.length === 0}
            className={'w-full py-3 rounded-lg font-medium transition-colors ' + (
              selectedAnswers.length > 0
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            )}
          >
            {selectedAnswers.length === 0
              ? 'Selecciona al menos una opción'
              : 'Confirmar respuesta (' + selectedAnswers.length + ' seleccionada' + (selectedAnswers.length > 1 ? 's' : '') + ')'}
          </button>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Opciones: {getOptionsPath(currentItem.num)}
          </p>
        </div>
      )}

      {/* Confirmación de puntuación */}
      {showConfirmation && (
        <div className={'rounded-lg p-4 text-center border ' + (
          scores[currentItem.num] === 2 ? 'bg-green-50 border-green-200' :
          scores[currentItem.num] === 1 ? 'bg-yellow-50 border-yellow-200' :
          'bg-red-50 border-red-200'
        )}>
          <p className={'text-lg font-medium ' + (
            scores[currentItem.num] === 2 ? 'text-green-700' :
            scores[currentItem.num] === 1 ? 'text-yellow-700' :
            'text-red-700'
          )}>
            {scores[currentItem.num] === 2 ? '✓ 2 puntos (Orden correcto)' :
             scores[currentItem.num] === 1 ? '1 punto (Orden incorrecto)' :
             '✗ 0 puntos (Incorrecto)'}
            {isPractice && <span className="ml-2 text-xs">(no suma al total)</span>}
          </p>
          {scores[currentItem.num] < 2 && (
            <p className="text-sm text-gray-600 mt-2">
              <strong>Respuestas correctas:</strong> {currentItem.correctAnswers.join(' → ')}
            </p>
          )}
          <button
            onClick={handleNext}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Continuar
          </button>
        </div>
      )}

      {/* Puntaje acumulado */}
      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-sm text-gray-600">
          Puntaje bruto acumulado: {Object.values(scores).reduce((a, b) => a + b, 0)} / 49
          {consecutiveZeros > 0 && (
            <span className="ml-2 text-xs text-orange-600">
              (Fallos consecutivos: {consecutiveZeros}/3)
            </span>
          )}
        </p>
      </div>
    </div>
  )
})