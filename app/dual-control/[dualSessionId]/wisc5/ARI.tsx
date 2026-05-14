'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'

// ============================================================
// CONFIGURACIÓN DE ÍTEMS PARA ARITMÉTICA (ARI)
// ============================================================

interface ARIItem {
  num: number
  question: string
  answer: number | string
  hasImage: boolean
  imagePath?: string
  isLearning?: boolean
  tips?: string
}

const ARI_ITEMS: ARIItem[] = [
  { num: 1, question: 'Cuenta estos perros con tu dedo. Hazlo en voz alta.', answer: '3 (contar 1-2-3)', hasImage: true, imagePath: '/wisc5/ari/ari001.png', isLearning: true,
    tips: 'Si contesta incorrectamente, diga: "Hay tres perros" y señale cada perro contando en voz alta.' },
  { num: 2, question: 'Cuenta estos pollitos con tu dedo. Hazlo en voz alta.', answer: '5 (contar 1-2-3-4-5)', hasImage: true, imagePath: '/wisc5/ari/ari002.png', isLearning: true,
    tips: 'Si contesta incorrectamente, diga: "Hay cinco pollitos" y señale cada pollito contando en voz alta.' },
  { num: 3, question: 'Cuenta estos árboles con tu dedo. Hazlo en voz alta.', answer: '10 (contar 1-10)', hasImage: true, imagePath: '/wisc5/ari/ari003.png', isLearning: true,
    tips: 'Si contesta incorrectamente, diga: "Hay diez árboles" y señale cada árbol contando en voz alta.' },
  { num: 4, question: '¿Cuántas mariposas y grillos hay? Suma las mariposas y los grillos y dime cuántos hay en total.', answer: 9, hasImage: true, imagePath: '/wisc5/ari/ari004.png' },
  { num: 5, question: '¿Cuántas nueces quedarán si cada ardilla se come una?', answer: 2, hasImage: true, imagePath: '/wisc5/ari/ari005.png' },
  { num: 6, question: 'Ana tiene 6 libros. Si pierde 1, ¿cuántos libros le quedan?', answer: 5, hasImage: false },
  { num: 7, question: 'Igna tiene 5 manzanas. Si le da 1 a Marce y 1 a Sole, ¿cuántas manzanas le quedan?', answer: 3, hasImage: false },
  { num: 8, question: 'Daniel tiene 2 juguetes. Si le regalan 3 más, ¿cuántos juguetes va a tener en total?', answer: 5, hasImage: false },
  { num: 9, question: 'Carlos tiene 4 lápices. Su mamá le da 3 más. ¿Cuántos lápices tiene ahora en total?', answer: 7, hasImage: false },
  { num: 10, question: 'María tiene 3 uvas en cada mano. ¿Cuántas uvas tiene en total?', answer: 6, hasImage: false },
  { num: 11, question: 'Marcos tiene 12 amigos y hace 3 más. ¿Cuántos amigos tiene en total?', answer: 15, hasImage: false },
  { num: 12, question: 'Ale tiene 8 muñecas y le dan 6 más. ¿Cuántas muñecas tiene en total?', answer: 14, hasImage: false },
  { num: 13, question: 'Jorge tiene 11 globos y pierde 3. ¿Cuántos globos le quedan?', answer: 8, hasImage: false },
  { num: 14, question: 'Luis jugó 10 partidos el lunes y 15 partidos el martes. ¿Cuántos partidos jugó en total?', answer: 25, hasImage: false },
  { num: 15, question: 'Dentro de una laguna hay 3 ranas. Si llegan 4 ranas más que se meten a la laguna y luego 2 se salen, ¿cuántas ranas quedan en la laguna?', answer: 5, hasImage: false },
  { num: 16, question: 'Hay 8 pájaros en la tierra. Si 4 salen volando y otros 2 aterrizan, ¿cuántos pájaros hay en la tierra ahora?', answer: 6, hasImage: false },
  { num: 17, question: 'Tom tiene 12 boletos y su tío le da 2 más. Si vende 5, ¿cuántos le quedan?', answer: 9, hasImage: false },
  { num: 18, question: 'Pablo tiene 100 lápices. Si le da 40 lápices a cada uno de sus 2 hermanos, ¿cuántos lápices le quedan?', answer: 20, hasImage: false },
  { num: 19, question: 'Karen contó 17 postes de luz en una calle y 15 en otra. ¿Cuántos postes de luz contó en total?', answer: 32, hasImage: false },
  { num: 20, question: 'Cata tiene 30 minutos de tiempo libre, pero dedica la mitad de este tiempo para limpiar su cuarto. Si 1 canción dura 5 minutos, ¿cuántas canciones alcanza a escuchar en el tiempo libre que le queda?', answer: 3, hasImage: false },
  { num: 21, question: 'Cada niño corre 1 sola vuelta en una carrera que tiene 8 vueltas. Si tres niños corren juntos en cada vuelta, ¿cuántos niños están participando en total en la carrera?', answer: 24, hasImage: false },
  { num: 22, question: 'Un club de fútbol tiene 30 niños. Después de una semana, 11 niños dejan el club y se unen 2 nuevos. ¿Cuántos niños hay en el club?', answer: 21, hasImage: false },
  { num: 23, question: 'Rosa le da 2 anillos a cada una de sus 3 amigas. A su mamá le da 7 anillos. ¿Cuántos anillos le quedan si al principio tenía 20?', answer: 7, hasImage: false },
  { num: 24, question: 'En una escuela hay 25 estudiantes en cada sala. Si hay 500 estudiantes en toda la escuela, ¿cuántas salas de clases hay?', answer: 20, hasImage: false },
  { num: 25, question: 'Pame pasa 3 horas armando un puzle el día lunes. El martes, ella lo termina luego de armarlo por 2 horas más. El puzle tiene 300 piezas. En promedio, ¿cuántas piezas colocó correctamente cada hora?', answer: 60, hasImage: false },
  { num: 26, question: 'Román prepara 12 pasteles entre las 4 y las 8 am. Luego prepara 9 pasteles entre 8 y 11 am. En promedio, ¿cuántos pasteles prepara cada hora?', answer: 3, hasImage: false },
  { num: 27, question: 'Elisa tiene dos tercios del número de revistas que tiene Ramón. Si Elisa tiene 20 revistas, ¿cuántas revistas tiene Ramón?', answer: 30, hasImage: false },
  { num: 28, question: 'Hay 71 niños en un bus. En la primera parada se bajan 17, en la siguiente se bajan 11 y en la última se bajan 32. ¿Cuántos niños quedan en el bus?', answer: 11, hasImage: false },
  { num: 29, question: 'Un estudiante escribió 14 informes. Otro estudiante escribió 11 informes. Luego, otros 25 estudiantes escribieron 5 informes cada uno, y otros 2 estudiantes escribieron 1 informe cada uno. ¿Cuántos informes escribieron todos los estudiantes?', answer: 152, hasImage: false },
  { num: 30, question: 'Si 6 personas pueden lavar 40 autos en 4 días, ¿cuántas personas se necesitan para lavar 40 autos en medio día?', answer: 48, hasImage: false },
  { num: 31, question: 'En un curso de 40 estudiantes, el 15% son mujeres. ¿Cuántos estudiantes son hombres?', answer: 34, hasImage: false,
    tips: 'Si dice "85%", diga: "Sí, ¿pero cuántos hombres son?".' },
  { num: 32, question: 'Lucas comienza a plantar semillas 1 hora antes que Vale. Lucas planta 40 semillas cada hora y Vale planta 60 cada hora. Si ya han pasado 5 horas desde que Lucas empezó a plantar, ¿cuántas semillas más ha plantado Vale que Lucas?', answer: 40, hasImage: false },
  { num: 33, question: 'Nico tiene una rutina de ejercicios para los sábados. Esta rutina incluye natación, bicicleta y trote. Primero nada por 25 minutos, luego hace elongaciones por 10 minutos y luego vuelve a nadar por otros 45 minutos. Después de un descanso de 5 minutos, anda en bicicleta cuesta arriba por 20, en terreno plano por 45 y luego en bajada por 15 minutos. Después de una pausa de 5 minutos, trota por 120 minutos y corre intensamente por 10 minutos más. Si Nico comienza su ejercicio a las 6:30, ¿qué hora será cuando termine?', answer: '11:30', hasImage: false },
  { num: 34, question: 'Un juego tiene 20 niveles. Joaquín debe obtener 300 puntos para pasar de nivel y debe superar cada nivel para poder continuar con el siguiente. Si Joaquín obtiene 1.500 puntos por hora y juega sin parar durante 2 horas y 15 minutos, ¿cuántos niveles le quedarán para terminar el juego?', answer: '9 u 8.75', hasImage: false }
]

// ============================================================
// COMPONENTE DE CRONÓMETRO (30 SEGUNDOS)
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
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isRunning, timeLimit, onTimeUpdate, onTimeEnd, onToggleRunning])

  const startTimer = () => { setSeconds(0); onToggleRunning(); onStart?.() }

  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return mins.toString().padStart(2, '0') + ':' + secs.toString().padStart(2, '0')
  }

  const getProgressPercent = (): number => Math.min((seconds / timeLimit) * 100, 100)
  const isTimeCritical = seconds >= 20

  if (!isRunning && seconds === 0) {
    return (
      <div className="text-center">
        <div className="text-3xl font-mono font-bold mb-2">{formatTime(0)}</div>
        <button onClick={startTimer} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
          Iniciar tiempo (30s)
        </button>
        <div className="text-xs text-gray-400 mt-2">Tiempo límite: 30 segundos</div>
      </div>
    )
  }

  return (
    <div className="text-center">
      <div className={'text-4xl font-mono font-bold mb-2 transition-colors ' + (isTimeCritical ? 'text-red-600 animate-pulse' : 'text-gray-800')}>
        {formatTime(seconds)}
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={'h-full transition-all duration-1000 ' + (isTimeCritical ? 'bg-red-500' : 'bg-blue-500')}
          style={{ width: getProgressPercent() + '%' }} />
      </div>
      <div className="flex gap-2 justify-center mt-2">
        {isRunning ? (
          <button onClick={onToggleRunning} className="px-3 py-1 bg-yellow-500 text-white rounded text-xs">Pausar</button>
        ) : (
          <button onClick={onToggleRunning} className="px-3 py-1 bg-blue-600 text-white rounded text-xs">Reanudar</button>
        )}
        <button onClick={() => { setSeconds(0); onTimeUpdate(0) }} className="px-3 py-1 bg-gray-500 text-white rounded text-xs">Reiniciar</button>
      </div>
    </div>
  )
}

// ============================================================
// COMPONENTE PRINCIPAL ARITMÉTICA
// ============================================================

interface ARIInterfaceProps {
  onComplete: (scores: Record<number, number>, rawTotal: number) => void
  onUpdatePatient: (content: any) => void
  patientAge: number
}

export const ARIInterface = React.memo(function ARIInterface({ onComplete, onUpdatePatient, patientAge }: ARIInterfaceProps) {
  // Determinar ítems de inicio según edad
  const getStartItems = (): { first: number; second: number; jumpAfterBacktrack: number } => {
    if (patientAge <= 7) return { first: 3, second: 4, jumpAfterBacktrack: 5 }
    if (patientAge <= 9) return { first: 8, second: 9, jumpAfterBacktrack: 10 }
    return { first: 11, second: 12, jumpAfterBacktrack: 13 }
  }

  const calculateBonusPoints = (): number => {
    const { first } = getStartItems()
    return first - 1
  }

  const checkBonusEligibility = (scores: Record<number, number>): boolean => {
    const { first, second } = getStartItems()
    return scores[first] === 1 && scores[second] === 1
  }

  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    const { first } = getStartItems()
    return ARI_ITEMS.findIndex(i => i.num === first)
  })
  const [response, setResponse] = useState('')
  const [scores, setScores] = useState<Record<number, number>>({})
  const [consecutiveZeros, setConsecutiveZeros] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [bonusApplied, setBonusApplied] = useState(false)
  const [isGoingBack, setIsGoingBack] = useState(false)
  const [backtrackMode, setBacktrackMode] = useState(false)
  const [failedStartItem, setFailedStartItem] = useState<number | null>(null)
  const [consecutiveSuccessesInBacktrack, setConsecutiveSuccessesInBacktrack] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [cronometroKey, setCronometroKey] = useState(0)
  const [timeEnded, setTimeEnded] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)

  const currentItem = ARI_ITEMS[currentIndex]
  const { first: firstStartItem, second: secondStartItem, jumpAfterBacktrack } = getStartItems()
  const hasBacktrack = patientAge >= 6

  const onCompleteRef = useRef(onComplete)
  const onUpdatePatientRef = useRef(onUpdatePatient)

  useEffect(() => { onCompleteRef.current = onComplete; onUpdatePatientRef.current = onUpdatePatient }, [onComplete, onUpdatePatient])

  // Enviar estímulo al display
  useEffect(() => {
    if (currentItem && !isCompleted) {
      onUpdatePatientRef.current({
        type: 'wisc5_ari',
        itemNum: currentItem.num,
        question: currentItem.question,
        hasImage: currentItem.hasImage,
        imagePath: currentItem.imagePath || null,
        isLearning: currentItem.isLearning || false
      })
    }
  }, [currentItem, isCompleted])

  // Verificar bonus
  useEffect(() => {
    if (!bonusApplied && checkBonusEligibility(scores)) {
      setBonusApplied(true)
      console.log('🎉 Bonus de +' + calculateBonusPoints() + ' puntos aplicado')
    }
  }, [scores, bonusApplied, firstStartItem, secondStartItem])

  const handleTimeUpdate = useCallback((seconds: number) => { setElapsedTime(seconds) }, [])
  const handleTimeEnd = useCallback(() => { setTimeEnded(true); setIsRunning(false) }, [])
  const [isRunning, setIsRunning] = useState(false)
  const toggleRunning = useCallback(() => setIsRunning(prev => !prev), [])

  const checkAnswer = (userAnswer: string): boolean => {
    const correctAnswer = currentItem.answer
    const userNum = parseFloat(userAnswer.replace(',', '.').trim())
    
    if (typeof correctAnswer === 'number') {
      return !isNaN(userNum) && userNum === correctAnswer
    }
    // Para respuestas tipo string (ej: '11:30', '9 u 8.75')
    const cleanUser = userAnswer.toLowerCase().trim()
    const cleanCorrect = String(correctAnswer).toLowerCase()
    
    // Manejar casos especiales como "9 u 8.75"
    const parts = cleanCorrect.split(' o ')
    return parts.some(p => cleanUser.includes(p.trim()))
  }

  const markSkippedItemsAsCorrect = (
    newScores: Record<number, number>, fromItem: number, toItem: number
  ): Record<number, number> => {
    const updatedScores = { ...newScores }
    for (let i = toItem + 1; i < fromItem; i++) {
      if (updatedScores[i] === undefined && i >= 1 && i <= 34) {
        updatedScores[i] = 1
        console.log('✓ Ítem ' + i + ' no administrado - se asigna puntaje 1 automáticamente')
      }
    }
    return updatedScores
  }

  const getNextItemIndex = (currentItemNum: number, currentScore: number): { nextIndex: number; updatedScores: Record<number, number> } => {
    let updatedScores = { ...scores }
    const currentIdx = ARI_ITEMS.findIndex(i => i.num === currentItemNum)

    if (!hasBacktrack) {
      let nextIdx = currentIdx + 1
      while (nextIdx < ARI_ITEMS.length && updatedScores[ARI_ITEMS[nextIdx].num] !== undefined) nextIdx++
      return { nextIndex: nextIdx, updatedScores }
    }

    if (backtrackMode) {
      if (currentScore === 1) {
        const newSuccesses = consecutiveSuccessesInBacktrack + 1
        setConsecutiveSuccessesInBacktrack(newSuccesses)
        if (newSuccesses >= 2) {
          setBacktrackMode(false); setConsecutiveSuccessesInBacktrack(0)
          updatedScores = markSkippedItemsAsCorrect(updatedScores, failedStartItem!, currentItemNum)
          const jumpIndex = ARI_ITEMS.findIndex(i => i.num === jumpAfterBacktrack)
          return { nextIndex: jumpIndex >= 0 ? jumpIndex : currentIdx + 1, updatedScores }
        }
        let prevItem = currentItemNum - 1
        while (prevItem >= 1 && updatedScores[prevItem] !== undefined) prevItem--
        if (prevItem >= 1) return { nextIndex: ARI_ITEMS.findIndex(i => i.num === prevItem), updatedScores }
      } else {
        setConsecutiveSuccessesInBacktrack(0)
        let prevItem = currentItemNum - 1
        while (prevItem >= 1 && updatedScores[prevItem] !== undefined) prevItem--
        if (prevItem >= 1) return { nextIndex: ARI_ITEMS.findIndex(i => i.num === prevItem), updatedScores }
      }
      setBacktrackMode(false); setConsecutiveSuccessesInBacktrack(0)
    }

    const isFirstTwo = currentItemNum === firstStartItem || currentItemNum === secondStartItem
    if (isFirstTwo && currentScore === 0) {
      setBacktrackMode(true); setFailedStartItem(currentItemNum); setConsecutiveSuccessesInBacktrack(0)
      let prevItem = currentItemNum - 1
      while (prevItem >= 1 && updatedScores[prevItem] !== undefined) prevItem--
      if (prevItem >= 1) return { nextIndex: ARI_ITEMS.findIndex(i => i.num === prevItem), updatedScores }
    }

    let nextIdx = currentIdx + 1
    while (nextIdx < ARI_ITEMS.length && updatedScores[ARI_ITEMS[nextIdx].num] !== undefined) nextIdx++
    return { nextIndex: nextIdx, updatedScores }
  }

  const handleScore = (score: number) => {
    if (scores[currentItem.num] !== undefined) return

    const isLearning = currentItem.isLearning || false
    const effectiveScore = isLearning ? 1 : score
    let newScores = { ...scores, [currentItem.num]: effectiveScore }
    setScores(newScores)
    setResponse('')
    setShowAnswer(false)
    setIsCorrect(null)

    if (score === 0 && !isLearning) {
      const newZeros = consecutiveZeros + 1
      setConsecutiveZeros(newZeros)
      if (newZeros >= 3) {
        const bonus = bonusApplied ? calculateBonusPoints() : 0
        const total = Object.values(newScores).reduce((a, b) => a + b, 0) + bonus
        setIsCompleted(true); onCompleteRef.current(newScores, total)
        return
      }
    } else {
      setConsecutiveZeros(0)
    }

    const { nextIndex, updatedScores } = getNextItemIndex(currentItem.num, score)
    newScores = updatedScores
    setScores(newScores)

    if (nextIndex >= ARI_ITEMS.length) {
      const bonus = bonusApplied || checkBonusEligibility(newScores) ? calculateBonusPoints() : 0
      const total = Object.values(newScores).reduce((a, b) => a + b, 0) + bonus
      setIsCompleted(true); onCompleteRef.current(newScores, total)
    } else {
      setCurrentIndex(nextIndex)
      setIsGoingBack(nextIndex < currentIndex)
      setTimeEnded(false)
      setElapsedTime(0)
      setCronometroKey(prev => prev + 1)
    }
  }

  const handleVerify = () => {
    if (!response.trim()) return
    const correct = checkAnswer(response)
    setIsCorrect(correct)
    setShowAnswer(true)
  }

  if (!currentItem) return null

  if (isCompleted) {
    const bonus = bonusApplied ? calculateBonusPoints() : 0
    const total = Object.values(scores).reduce((a, b) => a + b, 0) + bonus
    const maxP = 34
    return (
      <div className="bg-green-50 rounded-lg p-4 text-center">
        <p className="text-green-700 font-medium">Subprueba completada</p>
        <p className="text-sm text-green-600 mt-1">
          Puntaje total: {total} / {maxP}
          {bonusApplied && <span className="ml-2 text-blue-600">(incluye +{bonus} puntos por bonus)</span>}
        </p>
      </div>
    )
  }

  const bonusPts = calculateBonusPoints()
  const currentRaw = Object.values(scores).reduce((a, b) => a + b, 0)
  const displayScore = bonusApplied ? currentRaw + bonusPts : currentRaw

  return (
    <div className="space-y-4">
      {/* Barra de progreso */}
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Aritmética</span>
          <span className="text-gray-800 font-medium">Ítem {currentItem.num} / 34</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full" style={{ width: (Object.keys(scores).length / 34) * 100 + '%' }} />
        </div>
        {isGoingBack && <p className="text-xs text-orange-600 mt-1">↩️ Retrocediendo...</p>}
        {backtrackMode && <p className="text-xs text-orange-600 mt-1">🔄 Retroceso activo - Éxitos: {consecutiveSuccessesInBacktrack}/2</p>}
        {bonusApplied && <p className="text-xs text-blue-600 mt-1">✓ Bonus de +{bonusPts} pts aplicado</p>}
        {currentItem.isLearning && <p className="text-xs text-gray-400 mt-1">Ítem de aprendizaje</p>}
      </div>

      {/* Cronómetro */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <Stopwatch key={cronometroKey} timeLimit={30} onTimeUpdate={handleTimeUpdate} onTimeEnd={handleTimeEnd}
          isRunning={isRunning && !timeEnded && scores[currentItem.num] === undefined} onToggleRunning={toggleRunning} />
      </div>

      {/* Tiempo finalizado */}
      {timeEnded && scores[currentItem.num] === undefined && (
        <div className="bg-yellow-50 rounded-lg p-3 text-center border border-yellow-200">
          <p className="text-yellow-700 text-sm">⏰ ¡Tiempo finalizado!</p>
          <button onClick={() => handleScore(0)} className="mt-2 px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm">
            Registrar como incorrecto
          </button>
        </div>
      )}

      {/* Estímulo y respuesta correcta */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
        {currentItem.hasImage && currentItem.imagePath ? (
          <div>
            <p className="text-sm text-blue-700 mb-3">{currentItem.question}</p>
            <img src={currentItem.imagePath} alt={'Ítem ' + currentItem.num}
              className="mx-auto max-h-48 object-contain rounded-lg border border-gray-200"
              onError={(e) => { e.currentTarget.src = '/placeholder-image.png' }} />
          </div>
        ) : (
          <div>
            <p className="text-sm text-blue-700 mb-1">Problema para leer al evaluado:</p>
            <p className="text-lg md:text-xl font-medium text-gray-800">{currentItem.question}</p>
          </div>
        )}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700"><strong>Respuesta correcta:</strong> {currentItem.answer}</p>
        </div>
        {currentItem.tips && (
          <div className="mt-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200 text-left">
            <p className="text-xs text-yellow-700"><strong>💡 Tips:</strong> {currentItem.tips}</p>
          </div>
        )}
      </div>

      {/* Campo de respuesta */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Respuesta del evaluado:</label>
        <div className="flex gap-3">
          <input type="text" value={response} onChange={(e) => setResponse(e.target.value)}
            disabled={scores[currentItem.num] !== undefined || timeEnded}
            placeholder="Escribe la respuesta..."
            className="flex-1 px-4 py-2 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100" />
          <button onClick={handleVerify} disabled={!response.trim() || scores[currentItem.num] !== undefined}
            className={'px-6 py-2 rounded-lg font-medium ' + (response.trim() && scores[currentItem.num] === undefined ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed')}>
            Verificar
          </button>
        </div>

        {/* Resultado de verificación */}
        {showAnswer && (
          <div className={'mt-3 p-3 rounded-lg ' + (isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200')}>
            <p className={'text-sm font-medium ' + (isCorrect ? 'text-green-700' : 'text-red-700')}>
              {isCorrect ? '✓ ¡Correcto!' : '✗ Incorrecto'}
            </p>
            {!isCorrect && <p className="text-xs text-gray-600 mt-1">Respuesta correcta: {currentItem.answer}</p>}
          </div>
        )}
      </div>

      {/* Botones de puntaje */}
      {scores[currentItem.num] === undefined && !timeEnded && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-3">Asignar puntaje:</p>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => handleScore(0)}
              className="py-3 rounded-lg border border-gray-200 text-sm hover:bg-gray-50 transition-colors">0 - Incorrecto</button>
            <button onClick={() => handleScore(1)}
              className="py-3 rounded-lg border border-gray-200 text-sm hover:bg-gray-50 transition-colors">1 - Correcto</button>
          </div>
        </div>
      )}

      {/* Confirmación */}
      {scores[currentItem.num] !== undefined && (
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <p className="text-green-700 text-sm">✓ Ítem respondido con puntaje {scores[currentItem.num]}</p>
        </div>
      )}

      {/* Puntaje acumulado */}
      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-sm text-gray-600">
          Puntaje bruto acumulado: {displayScore} / 34
          {!bonusApplied && patientAge >= 6 && (
            <span className="ml-2 text-xs text-gray-500">(Bonus potencial: +{bonusPts} pts)</span>
          )}
        </p>
      </div>

      {/* Instrucciones */}
      <div className="bg-blue-50 rounded-lg p-3">
        <p className="text-xs text-blue-700">
          <strong>📋 Recordatorio:</strong> Tiempo límite 30 segundos por ítem. No repetir ítems 1-19. 
          Repeticiones permitidas en ítems 20-34 (pausar cronómetro). Notificar a los 20 segundos si no hay respuesta.
        </p>
      </div>
    </div>
  )
})