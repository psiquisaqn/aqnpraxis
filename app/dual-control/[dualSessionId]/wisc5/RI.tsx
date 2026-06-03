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

const getOptionLetters = (total: number): string[] => 'ABCDEFGHIJKL'.slice(0, total).split('')

const getStimulusPath = (num: number | string): string => {
  if (typeof num === 'string') return `/wisc5/ri/ri${num.toLowerCase()}e.png`
  return `/wisc5/ri/ri${String(num).padStart(3, '0')}e.png`
}

const getOptionsPath = (num: number | string): string => {
  if (typeof num === 'string') return `/wisc5/ri/ri${num.toLowerCase()}o.png`
  return `/wisc5/ri/ri${String(num).padStart(3, '0')}o.png`
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

  useEffect(() => { onCompleteRef.current = onComplete; onUpdatePatientRef.current = onUpdatePatient }, [onComplete, onUpdatePatient])
  useEffect(() => { setSelectedAnswers([]); setPhase('ready'); setShowConfirmation(false) }, [currentIndex])

  // Enviar display inmediatamente al cambiar de fase
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

  // Temporizador de 5 segundos
  useEffect(() => {
    if (phase === 'showing' && showTimer > 0) {
      timerRef.current = setTimeout(() => setShowTimer(prev => prev - 1), 1000)
    } else if (phase === 'showing' && showTimer === 0) {
      setPhase('answering')
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [phase, showTimer])

  const handleStartShow = () => { setShowTimer(5); setPhase('showing') }

  const toggleAnswer = (letter: string) => {
    if (phase !== 'answering' || showConfirmation) return
    setSelectedAnswers(prev => prev.includes(letter) ? prev.filter(l => l !== letter) : [...prev, letter])
  }

  const calculateScore = (item: RIItem, answers: string[]): number => {
    if (item.maxScore === 1) return answers.length === 1 && answers[0] === item.correctAnswers[0] ? 1 : 0
    const correctSet = new Set(item.correctAnswers)
    const answerSet = new Set(answers)
    if (correctSet.size !== answerSet.size) return 0
    for (const a of answerSet) if (!correctSet.has(a)) return 0
    // Coinciden en contenido, verificar orden
    return JSON.stringify(answers) === JSON.stringify(item.correctAnswers) ? 2 : 1
  }

  const handleConfirm = () => {
    if (selectedAnswers.length === 0) return
    const score = calculateScore(currentItem, selectedAnswers)
    const effectiveScore = isPractice ? 0 : score
    const newScores = { ...scores, [currentItem.num]: effectiveScore }
    setScores(newScores)
    setShowConfirmation(true)

    if (!isPractice) {
      if (effectiveScore === 0) {
        const newZeros = consecutiveZeros + 1
        setConsecutiveZeros(newZeros)
        if (newZeros >= 3) {
          setTimeout(() => { setIsCompleted(true); onCompleteRef.current(newScores, Object.values(newScores).reduce((a, b) => a + b, 0)) }, 1000)
          return
        }
      } else { setConsecutiveZeros(0) }
    }
  }

  const handleNext = () => {
    let nextIdx = currentIndex + 1
    while (nextIdx < RI_ITEMS.length && scores[RI_ITEMS[nextIdx].num] !== undefined) nextIdx++
    if (nextIdx >= RI_ITEMS.length) { setIsCompleted(true); onCompleteRef.current(scores, Object.values(scores).reduce((a, b) => a + b, 0)) }
    else setCurrentIndex(nextIdx)
  }

  if (!currentItem) return null

  if (isCompleted) {
    return (
      <div className="bg-green-50 rounded-lg p-4 text-center">
        <p className="text-green-700 font-medium">Subprueba completada</p>
        <p className="text-sm text-green-600 mt-1">Puntaje total: {Object.values(scores).reduce((a, b) => a + b, 0)} / 49</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Barra de progreso */}
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-gray-600 text-sm">Retención de Imágenes</span>
          <span className="text-3xl font-bold text-gray-800">{isPractice ? currentItem.num : currentItem.num}</span>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{isPractice ? 'Práctica' : 'Ítem actual'}</span>
          <span>de {RI_ITEMS.filter(i => !i.isPractice).length}</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(Object.keys(scores).filter(k => k !== 'PA' && k !== 'PB' && k !== 'PC').length / RI_ITEMS.filter(i => !i.isPractice).length) * 100}%` }} />
        </div>
      </div>

      {/* Miniatura del estímulo (siempre visible) */}
      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <p className="text-xs font-medium text-gray-700 mb-2 text-center">📷 Estímulo (miniatura):</p>
        <img 
          src={getStimulusPath(currentItem.num)} 
          alt="Estímulo" 
          className="mx-auto max-h-24 object-contain border border-gray-200 rounded-lg"
          onError={(e) => { e.currentTarget.src = '/placeholder-image.png' }}
        />
      </div>

      {/* Fase: Listo para mostrar */}
      {phase === 'ready' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-700 font-medium mb-2">📋 Instrucciones:</p>
            <p className="text-sm text-blue-600">Presiona el botón para mostrar los estímulos durante <strong>5 segundos</strong> al evaluado.</p>
          </div>
          <div className="text-center">
            <button onClick={handleStartShow} className="px-8 py-4 bg-blue-600 text-white rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors shadow-md">▶ Mostrar estímulos (5 segundos)</button>
          </div>
        </div>
      )}

      {/* Fase: Mostrando estímulos (imagen grande) */}
      {phase === 'showing' && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-700 mb-2 text-center">📷 Estímulo mostrado al evaluado:</p>
          <img 
            src={getStimulusPath(currentItem.num)} 
            alt="Estímulo" 
            className="mx-auto max-w-full h-auto border border-gray-200 rounded-lg"
            onError={(e) => { e.currentTarget.src = '/placeholder-image.png' }}
          />
          <div className="mt-3 p-2 bg-blue-50 rounded text-center">
            <p className="text-4xl font-bold text-blue-700">{showTimer}</p>
            <p className="text-sm text-blue-600">segundos restantes</p>
          </div>
        </div>
      )}

      {/* Fase: Respondiendo */}
      {phase === 'answering' && !showConfirmation && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-700 mb-2 text-center">📷 Opciones mostradas al evaluado:</p>
          <img 
            src={getOptionsPath(currentItem.num)} 
            alt="Opciones" 
            className="mx-auto max-w-full h-auto border border-gray-200 rounded-lg mb-4"
            onError={(e) => { e.currentTarget.src = '/placeholder-image.png' }}
          />
          <div className="bg-green-50 rounded-lg p-3 mb-4">
            <p className="text-sm text-green-700">✅ El display ahora muestra las opciones.</p>
            <p className="text-xs text-green-600 mt-1">Selecciona {currentItem.correctAnswers.length === 1 ? 'la imagen correcta' : `las ${currentItem.correctAnswers.length} imágenes correctas`} en el orden indicado por el evaluado.</p>
          </div>
          <p className="text-sm text-gray-600 mb-3">Respuestas ({currentItem.correctAnswers.length} de {currentItem.totalOptions}):</p>
          <div className="grid grid-cols-4 md:grid-cols-6 gap-2 mb-4">
            {options.map(letter => {
              const orderIndex = selectedAnswers.indexOf(letter)
              const isSelected = orderIndex !== -1
              return (
                <button key={letter} onClick={() => toggleAnswer(letter)}
                  className={`py-3 rounded-lg text-lg font-bold transition-all relative ${isSelected ? 'bg-blue-600 text-white shadow-md scale-105' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  {letter}
                  {isSelected && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 text-white text-xs rounded-full flex items-center justify-center">{orderIndex + 1}</span>
                  )}
                </button>
              )
            })}
          </div>
          <button onClick={handleConfirm} disabled={selectedAnswers.length === 0}
            className={`w-full py-3 rounded-lg font-medium transition-colors ${selectedAnswers.length > 0 ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}>
            Confirmar respuesta ({selectedAnswers.length} seleccionada{selectedAnswers.length > 1 ? 's' : ''})
          </button>
        </div>
      )}

      {/* Confirmación de puntuación */}
      {showConfirmation && (
        <div className={`rounded-lg p-4 text-center border ${isPractice ? 'bg-gray-50 border-gray-200' : scores[currentItem.num] === 2 ? 'bg-green-50 border-green-200' : scores[currentItem.num] === 1 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`}>
          <p className={`text-lg font-medium ${isPractice ? 'text-gray-600' : scores[currentItem.num] === 2 ? 'text-green-700' : scores[currentItem.num] === 1 ? 'text-yellow-700' : 'text-red-700'}`}>
            {isPractice 
              ? 'Ítem de práctica (no suma puntos)' 
              : scores[currentItem.num] === 2 
                ? '✓ 2 puntos (Orden correcto)' 
                : scores[currentItem.num] === 1 
                  ? '1 punto (Orden incorrecto)' 
                  : '✗ 0 puntos (Incorrecto)'}
          </p>
          {!isPractice && scores[currentItem.num] < 2 && (
            <p className="text-sm text-gray-600 mt-2"><strong>Correctas:</strong> {currentItem.correctAnswers.join(' → ')}</p>
          )}
          <button onClick={handleNext} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Continuar</button>
        </div>
      )}

      {/* Puntaje acumulado */}
      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-sm text-gray-600">
          Puntaje bruto acumulado: {Object.values(scores).reduce((a, b) => a + b, 0)} / 49
          {consecutiveZeros > 0 && <span className="ml-2 text-xs text-orange-600">(Fallos consecutivos: {consecutiveZeros}/3)</span>}
        </p>
      </div>
    </div>
  )
})