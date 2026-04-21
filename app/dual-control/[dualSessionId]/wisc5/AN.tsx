'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'

// ============================================================
// CONFIGURACIÓN DE ÍTEMS PARA ANALOGÍAS (AN)
// ============================================================

interface ANItem {
  num: number | string
  words: [string, string]
  isPractice: boolean
  maxScore: 2
}

const AN_ITEMS: ANItem[] = [
  { num: 'PA', words: ['Tres', 'Cuatro'], isPractice: true, maxScore: 2 },
  { num: 'PB', words: ['Jirafa', 'Elefante'], isPractice: true, maxScore: 2 },
  { num: 1, words: ['Manzana', 'Plátano'], isPractice: false, maxScore: 2 },
  { num: 2, words: ['Muñeca', 'Pelota'], isPractice: false, maxScore: 2 },
  { num: 3, words: ['Camisa', 'Zapato'], isPractice: false, maxScore: 2 },
  { num: 4, words: ['Agua', 'Leche'], isPractice: false, maxScore: 2 },
  { num: 5, words: ['Mariposa', 'Abeja'], isPractice: false, maxScore: 2 },
  { num: 6, words: ['Abuelo', 'Primo'], isPractice: false, maxScore: 2 },
  { num: 7, words: ['Auto', 'Avión'], isPractice: false, maxScore: 2 },
  { num: 8, words: ['Invierno', 'Verano'], isPractice: false, maxScore: 2 },
  { num: 9, words: ['Natación', 'Atletismo'], isPractice: false, maxScore: 2 },
  { num: 10, words: ['Enojo', 'Alegría'], isPractice: false, maxScore: 2 },
  { num: 11, words: ['Ácido', 'Salado'], isPractice: false, maxScore: 2 },
  { num: 12, words: ['Codo', 'Rodilla'], isPractice: false, maxScore: 2 },
  { num: 13, words: ['Ternero', 'Potrillo'], isPractice: false, maxScore: 2 },
  { num: 14, words: ['Reloj', 'Termómetro'], isPractice: false, maxScore: 2 },
  { num: 15, words: ['Escultura', 'Poema'], isPractice: false, maxScore: 2 },
  { num: 16, words: ['Hielo', 'Vapor'], isPractice: false, maxScore: 2 },
  { num: 17, words: ['Esperanza', 'Deseo'], isPractice: false, maxScore: 2 },
  { num: 18, words: ['Montaña', 'Lago'], isPractice: false, maxScore: 2 },
  { num: 19, words: ['Primero', 'Último'], isPractice: false, maxScore: 2 },
  { num: 20, words: ['Luz', 'Sonido'], isPractice: false, maxScore: 2 },
  { num: 21, words: ['Estatura', 'Peso'], isPractice: false, maxScore: 2 },
  { num: 22, words: ['Libertad', 'Justicia'], isPractice: false, maxScore: 2 },
  { num: 23, words: ['Tiempo', 'Espacio'], isPractice: false, maxScore: 2 }
]

// ============================================================
// FUNCIÓN DE SUGERENCIA DE PUNTUAJE
// ============================================================

const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

interface SuggestionResult {
  suggestedScore: 0 | 1 | 2
  confidence: 'low' | 'medium' | 'high'
  reason?: string
  disclaimer?: string
}

function suggestScore(response: string, word1: string, word2: string, isPractice: boolean): SuggestionResult {
  const disclaimer = "⚠️ Esta sugerencia es automática. Consulte el manual del WISC-V y aplique su criterio profesional para la asignación definitiva del puntaje."

  if (isPractice) {
    return { 
      suggestedScore: 0, 
      confidence: 'low', 
      reason: 'Ítem de práctica - registrar manualmente',
      disclaimer 
    }
  }

  const normalizedResponse = normalizeText(response)
  if (!normalizedResponse) {
    return { 
      suggestedScore: 0, 
      confidence: 'low', 
      reason: 'Respuesta vacía',
      disclaimer 
    }
  }

  const highKeywords: Record<string, string[]> = {
    'Manzana-Plátano': ['fruta', 'frutas', 'alimento', 'comida', 'alimenticio', 'vegetal'],
    'Muñeca-Pelota': ['juguete', 'juguetes', 'entretención', 'juego', 'recreación', 'entretenimiento'],
    'Camisa-Zapato': ['ropa', 'vestimenta', 'prenda', 'vestir', 'indumentaria', 'atuendo'],
    'Agua-Leche': ['bebida', 'líquido', 'liquido', 'bebible', 'hidratante', 'bebestible', 'lacteo', 'lácteo'],
    'Mariposa-Abeja': ['insecto', 'insectos', 'bicho', 'animal volador', 'polinizador'],
    'Abuelo-Primo': ['familia', 'familiar', 'parentesco', 'pariente', 'familiares'],
    'Auto-Avión': ['transporte', 'vehículo', 'medio transporte', 'movilidad', 'vehiculo'],
    'Invierno-Verano': ['estación', 'estaciones', 'clima', 'temporada', 'época', 'periodo'],
    'Natación-Atletismo': ['deporte', 'deportes', 'actividad física', 'competencia'],
    'Enojo-Alegría': ['emoción', 'emociones', 'sentimiento', 'estado ánimo', 'afecto'],
    'Ácido-Salado': ['sabor', 'gusto', 'sabores', 'gustativo'],
    'Codo-Rodilla': ['articulación', 'parte cuerpo', 'extremidad', 'miembro'],
    'Ternero-Potrillo': ['cría', 'animal bebé', 'animal joven', 'cachorro'],
    'Reloj-Termómetro': ['medición', 'instrumento', 'medir', 'aparato', 'dispositivo'],
    'Escultura-Poema': ['arte', 'obra', 'creación artística', 'expresión', 'artístico'],
    'Hielo-Vapor': ['agua', 'estado', 'fase', 'líquido transformado', 'agregación'],
    'Esperanza-Deseo': ['sentimiento', 'emoción', 'anhelo', 'aspiración', 'deseo'],
    'Montaña-Lago': ['naturaleza', 'paisaje', 'geografía', 'accidente geográfico', 'relieve'],
    'Primero-Último': ['posición', 'orden', 'secuencia', 'número ordinal', 'lugar'],
    'Luz-Sonido': ['onda', 'fenómeno', 'energía', 'física', 'percepción'],
    'Estatura-Peso': ['medida', 'dimensión', 'característica física', 'medición'],
    'Libertad-Justicia': ['valor', 'principio', 'derecho', 'ideal', 'concepto'],
    'Tiempo-Espacio': ['concepto', 'dimensión', 'física', 'magnitud', 'medida']
  }

  const mediumKeywords: Record<string, string[]> = {
    'Manzana-Plátano': ['dulce', 'cáscara', 'semilla', 'color', 'amarillo', 'rojo', 'verde'],
    'Muñeca-Pelota': ['niño', 'infancia', 'divertido', 'jugar', 'entretenido'],
    'Camisa-Zapato': ['tela', 'cuero', 'usar', 'vestir', 'calzar'],
    'Agua-Leche': ['blanco', 'beber', 'tomar', 'hidratar', 'agua', 'leche'],
    'Mariposa-Abeja': ['vuela', 'alas', 'polen', 'color', 'vuelan'],
    'Abuelo-Primo': ['persona', 'hombre', 'mayor', 'menor', 'familiares'],
    'Auto-Avión': ['rueda', 'volar', 'conducir', 'moverse', 'trasladar'],
    'Invierno-Verano': ['frío', 'calor', 'sol', 'lluvia', 'temperatura'],
    'Natación-Atletismo': ['competencia', 'correr', 'nadar', 'piscina', 'estadio'],
    'Enojo-Alegría': ['feliz', 'triste', 'enojado', 'contento', 'emoción'],
    'Ácido-Salado': ['ácido', 'sal', 'sabor fuerte', 'condimento'],
    'Codo-Rodilla': ['hueso', 'brazo', 'pierna', 'extremidad'],
    'Ternero-Potrillo': ['vaca', 'caballo', 'animal', 'bebé animal'],
    'Reloj-Termómetro': ['tiempo', 'temperatura', 'medición', 'aparato'],
    'Escultura-Poema': ['belleza', 'creatividad', 'expresión artística', 'obra'],
    'Hielo-Vapor': ['frío', 'calor', 'agua', 'cambio', 'transformación'],
    'Esperanza-Deseo': ['futuro', 'anhelar', 'querer', 'ilusionarse'],
    'Montaña-Lago': ['alto', 'profundo', 'agua', 'tierra', 'paisaje'],
    'Primero-Último': ['inicio', 'final', 'comienzo', 'termino'],
    'Luz-Sonido': ['ver', 'oír', 'sentido', 'percepción'],
    'Estatura-Peso': ['alto', 'bajo', 'gordo', 'flaco', 'físico'],
    'Libertad-Justicia': ['igualdad', 'derecho', 'ética', 'moral'],
    'Tiempo-Espacio': ['duración', 'distancia', 'medida', 'extensión']
  }

  const key = `${word1}-${word2}`
  
  const keywords = highKeywords[key] || []
  for (const kw of keywords) {
    if (normalizedResponse.includes(kw)) {
      return { suggestedScore: 2, confidence: 'high', reason: `Palabra clave "${kw}" detectada`, disclaimer }
    }
  }

  const mediumKw = mediumKeywords[key] || []
  for (const kw of mediumKw) {
    if (normalizedResponse.includes(kw)) {
      return { suggestedScore: 1, confidence: 'medium', reason: `Palabra clave "${kw}" detectada`, disclaimer }
    }
  }

  if (normalizedResponse.split(' ').length >= 3) {
    return { suggestedScore: 1, confidence: 'low', reason: 'Respuesta elaborada, pero sin palabras clave', disclaimer }
  }

  return { suggestedScore: 0, confidence: 'low', reason: 'Respuesta insuficiente', disclaimer }
}

// ============================================================
// COMPONENTE PRINCIPAL ANALOGÍAS
// ============================================================

interface ANInterfaceProps {
  onComplete: (scores: Record<string | number, number>, rawTotal: number) => void
  onUpdatePatient: (content: any) => void
  patientAge: number
}

export const ANInterface = React.memo(function ANInterface({ onComplete, onUpdatePatient, patientAge }: ANInterfaceProps) {
  // Determinar ítems de inicio según edad (WISC-V Chile)
  const getStartItems = (): { first: number; second: number; jumpAfterBacktrack: number } => {
    if (patientAge <= 7) {
      // 6-7 años: empiezan en ítem 1, sin retroceso
      return { first: 1, second: 2, jumpAfterBacktrack: 0 }
    }
    if (patientAge <= 11) {
      // 8-11 años: empiezan en ítem 5
      return { first: 5, second: 6, jumpAfterBacktrack: 7 }
    }
    // 12-16 años: empiezan en ítem 8
    return { first: 8, second: 9, jumpAfterBacktrack: 10 }
  }

  /**
   * Calcula los puntos bonus según el manual WISC-V.
   * Si el niño acierta los dos primeros ítems administrados,
   * se otorgan los puntos correspondientes a los ítems no administrados.
   * Cada ítem no administrado vale 2 puntos.
   */
  const calculateBonusPoints = (): number => {
    const { first } = getStartItems()
    
    // Niños de 6-7 años no tienen bonus (empiezan en ítem 1)
    if (patientAge <= 7) return 0
    
    // Número de ítems no administrados = first - 1
    // (si empieza en 5, hay 4 ítems no administrados: 1,2,3,4)
    const unadministeredCount = first - 1
    
    // Cada ítem no administrado vale 2 puntos
    return unadministeredCount * 2
  }

  /**
   * Verifica si el niño es elegible para recibir puntos bonus.
   * Condición: Debe haber acertado (puntaje 2) en AMBOS primeros ítems administrados.
   */
  const checkBonusEligibility = (scores: Record<string | number, number>): boolean => {
    const { first, second } = getStartItems()
    
    // Niños de 6-7 años no aplican bonus
    if (patientAge <= 7) return false
    
    // Debe tener puntaje 2 en ambos ítems de inicio
    return scores[first] === 2 && scores[second] === 2
  }

  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const [response, setResponse] = useState('')
  const [suggestion, setSuggestion] = useState<SuggestionResult | null>(null)
  const [scores, setScores] = useState<Record<string | number, number>>({})
  const [consecutiveZeros, setConsecutiveZeros] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [bonusApplied, setBonusApplied] = useState(false)
  const [isGoingBack, setIsGoingBack] = useState(false)
  const [backtrackMode, setBacktrackMode] = useState(false)
  const [failedStartItem, setFailedStartItem] = useState<number | null>(null)
  const [consecutiveSuccessesInBacktrack, setConsecutiveSuccessesInBacktrack] = useState(0)

  const currentItem = AN_ITEMS[currentIndex]
  const isPractice = currentItem?.isPractice || false
  const { first: firstStartItem, second: secondStartItem, jumpAfterBacktrack } = getStartItems()
  const hasBacktrack = patientAge >= 8  // Solo niños ≥ 8 años tienen secuencia inversa

  const onCompleteRef = useRef(onComplete)
  const onUpdatePatientRef = useRef(onUpdatePatient)

  useEffect(() => {
    onCompleteRef.current = onComplete
    onUpdatePatientRef.current = onUpdatePatient
  }, [onComplete, onUpdatePatient])

  useEffect(() => {
    if (currentItem && !isCompleted) {
      onUpdatePatientRef.current({
        type: 'wisc5_an',
        word1: currentItem.words[0],
        word2: currentItem.words[1],
        itemNum: currentItem.num,
        isPractice: currentItem.isPractice
      })
    }
  }, [currentItem, isCompleted])

  useEffect(() => {
    if (currentItem && response.trim().length > 0 && !scores[currentItem.num]) {
      const suggestionResult = suggestScore(response, currentItem.words[0], currentItem.words[1], isPractice)
      setSuggestion(suggestionResult)
    } else {
      setSuggestion(null)
    }
  }, [response, currentItem, isPractice])

  useEffect(() => {
    if (!bonusApplied && checkBonusEligibility(scores)) {
      setBonusApplied(true)
      const bonusPoints = calculateBonusPoints()
      console.log(`🎉 Bonus de +${bonusPoints} puntos aplicado por acertar ítems ${firstStartItem} y ${secondStartItem}`)
    }
  }, [scores, bonusApplied, firstStartItem, secondStartItem])

  /**
   * Marca los ítems no administrados como correctos (puntaje 2).
   * Se usa cuando el niño obtiene dos aciertos consecutivos en secuencia inversa.
   * @param newScores - Objeto de puntajes actual
   * @param fromItem - Ítem donde comenzó el retroceso (el ítem de inicio que falló)
   * @param toItem - Ítem donde terminó el retroceso (último ítem con puntaje 2)
   */
  const markSkippedItemsAsCorrect = (
    newScores: Record<string | number, number>, 
    fromItem: number, 
    toItem: number
  ): Record<string | number, number> => {
    const updatedScores = { ...newScores }
    
    // Marcar todos los ítems ENTRE toItem+1 y fromItem-1 como correctos
    // (porque esos ítems NO fueron administrados y se asume que los habría acertado)
    for (let i = toItem + 1; i < fromItem; i++) {
      if (updatedScores[i] === undefined) {
        updatedScores[i] = 2
        console.log(`✓ Ítem ${i} no administrado - se asigna puntaje 2 automáticamente`)
      }
    }
    return updatedScores
  }

  const getNextItemIndex = (currentItemNum: number | string, currentScore: number): { nextIndex: number; updatedScores: Record<string | number, number> } => {
    let updatedScores = { ...scores }
    const currentIdx = AN_ITEMS.findIndex(i => i.num === currentItemNum)
    
    // Ítems de práctica
    if (currentItemNum === 'PA') {
      return { nextIndex: AN_ITEMS.findIndex(i => i.num === 'PB'), updatedScores }
    }
    if (currentItemNum === 'PB') {
      return { nextIndex: AN_ITEMS.findIndex(i => i.num === firstStartItem), updatedScores }
    }

    // Si es menor de 8 años (sin retroceso), avanzar correlativamente
    if (!hasBacktrack) {
      let nextIdx = currentIdx + 1
      while (nextIdx < AN_ITEMS.length && updatedScores[AN_ITEMS[nextIdx].num] !== undefined) {
        nextIdx++
      }
      return { nextIndex: nextIdx, updatedScores }
    }

    const numericItem = typeof currentItemNum === 'number' ? currentItemNum : parseInt(currentItemNum as string)
    
    // ============================================================
    // MODO RETROCESO ACTIVO
    // ============================================================
    if (backtrackMode) {
      if (currentScore === 2) {
        // Incrementar contador de éxitos consecutivos
        const newConsecutiveSuccesses = consecutiveSuccessesInBacktrack + 1
        setConsecutiveSuccessesInBacktrack(newConsecutiveSuccesses)
        
        // Verificar si tenemos DOS aciertos consecutivos
        if (newConsecutiveSuccesses >= 2) {
          // ¡Dos aciertos consecutivos! Salir del retroceso
          setBacktrackMode(false)
          setConsecutiveSuccessesInBacktrack(0)
          
          // Marcar ítems no administrados como correctos
          // fromItem = ítem que falló al inicio, toItem = ítem actual (último con puntaje 2)
          updatedScores = markSkippedItemsAsCorrect(updatedScores, failedStartItem!, numericItem)
          
          // Saltar al ítem después del punto de inicio original
          const jumpIndex = AN_ITEMS.findIndex(i => i.num === jumpAfterBacktrack)
          return { nextIndex: jumpIndex >= 0 ? jumpIndex : currentIdx + 1, updatedScores }
        }
        
        // Solo un acierto hasta ahora - continuar retrocediendo
        const prevItem = numericItem - 1
        if (prevItem >= 1 && updatedScores[prevItem] === undefined) {
          return { nextIndex: AN_ITEMS.findIndex(i => i.num === prevItem), updatedScores }
        }
      } else {
        // Fallo (0 o 1) en modo retroceso - reiniciar contador de éxitos consecutivos
        setConsecutiveSuccessesInBacktrack(0)
        
        // Continuar retrocediendo
        const prevItem = numericItem - 1
        if (prevItem >= 1 && updatedScores[prevItem] === undefined) {
          return { nextIndex: AN_ITEMS.findIndex(i => i.num === prevItem), updatedScores }
        }
      }
      
      // Si no hay más ítems para retroceder, salir del modo retroceso
      setBacktrackMode(false)
      setConsecutiveSuccessesInBacktrack(0)
    }

    // ============================================================
    // VERIFICAR SI SE DEBE ACTIVAR SECUENCIA INVERSA
    // Regla WISC-V: Si el niño obtiene puntaje < 2 en CUALQUIERA de los
    // dos primeros ítems administrados, se aplica secuencia inversa.
    // ============================================================
    const isFirstTwoAdministered = (numericItem === firstStartItem) || (numericItem === secondStartItem)
    const isFailure = currentScore < 2  // 0 o 1 se considera fallo para activar retroceso
    
    if (isFirstTwoAdministered && isFailure) {
      setBacktrackMode(true)
      setFailedStartItem(numericItem)
      setConsecutiveSuccessesInBacktrack(0)
      
      const prevItem = numericItem - 1
      if (prevItem >= 1 && updatedScores[prevItem] === undefined) {
        return { nextIndex: AN_ITEMS.findIndex(i => i.num === prevItem), updatedScores }
      }
    }

    // Avanzar al siguiente ítem no respondido
    let nextIdx = currentIdx + 1
    while (nextIdx < AN_ITEMS.length && updatedScores[AN_ITEMS[nextIdx].num] !== undefined) {
      nextIdx++
    }
    return { nextIndex: nextIdx, updatedScores }
  }

  const handleScore = (score: number) => {
    if (scores[currentItem.num] !== undefined) return

    const effectiveScore = isPractice ? 0 : score
    let newScores = { ...scores, [currentItem.num]: effectiveScore }
    setScores(newScores)
    setResponse('')
    setSuggestion(null)

    if (!isPractice) {
      if (effectiveScore === 0) {
        const newConsecutiveZeros = consecutiveZeros + 1
        setConsecutiveZeros(newConsecutiveZeros)
        
        // Regla de terminación: 3 fallos consecutivos (puntaje 0)
        if (newConsecutiveZeros >= 3) {
          const bonusPoints = bonusApplied ? calculateBonusPoints() : 0
          const total = Object.values(newScores).reduce((a, b) => a + b, 0) + bonusPoints
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
    
    if (nextIndex >= AN_ITEMS.length) {
      const bonusPoints = bonusApplied || checkBonusEligibility(newScores) ? calculateBonusPoints() : 0
      const total = Object.values(newScores).reduce((a, b) => a + b, 0) + bonusPoints
      setIsCompleted(true)
      onCompleteRef.current(newScores, total)
    } else {
      setCurrentIndex(nextIndex)
      setIsGoingBack(nextIndex < currentIndex)
    }
  }

  const applySuggestion = () => {
    if (suggestion && scores[currentItem.num] === undefined) {
      handleScore(suggestion.suggestedScore)
    }
  }

  if (!currentItem) return null

  if (isCompleted) {
    const bonusPoints = bonusApplied ? calculateBonusPoints() : 0
    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0) + bonusPoints
    const maxPossible = 46
    
    return (
      <div className="bg-green-50 rounded-lg p-4 text-center">
        <p className="text-green-700 font-medium">Subprueba completada</p>
        <p className="text-sm text-green-600 mt-1">
          Puntaje total: {totalScore} / {maxPossible}
          {bonusApplied && (
            <span className="ml-2 text-blue-600">
              (incluye +{bonusPoints} puntos por bonus de {calculateBonusPoints() / 2} ítems no administrados)
            </span>
          )}
        </p>
      </div>
    )
  }

  const bonusPoints = calculateBonusPoints()
  const currentRawScore = Object.values(scores).reduce((a, b) => a + b, 0)
  const displayScore = bonusApplied ? currentRawScore + bonusPoints : currentRawScore

  return (
    <div className="space-y-4">
      {/* Barra de progreso */}
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Analogías</span>
          <span className="text-gray-800 font-medium">
            {isPractice ? 'Práctica' : `Ítem ${currentItem.num}`} / {AN_ITEMS.filter(i => !i.isPractice).length}
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full" style={{ 
            width: `${(Object.keys(scores).filter(k => k !== 'PA' && k !== 'PB').length / AN_ITEMS.filter(i => !i.isPractice).length) * 100}%` 
          }} />
        </div>
        {isGoingBack && (
          <p className="text-xs text-orange-600 mt-1">↩️ Retrocediendo para verificar nivel basal...</p>
        )}
        {backtrackMode && (
          <p className="text-xs text-orange-600 mt-1">
            🔄 Modo retroceso activo - Éxitos consecutivos: {consecutiveSuccessesInBacktrack}/2
          </p>
        )}
        {bonusApplied && (
          <p className="text-xs text-blue-600 mt-1">
            ✓ Bonus de +{bonusPoints} puntos aplicado ({calculateBonusPoints() / 2} ítems no administrados)
          </p>
        )}
      </div>

      {/* Estímulo */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
        <div className="flex justify-center items-center gap-8">
          <span className="text-2xl md:text-3xl font-bold text-gray-800" style={{ fontFamily: 'Georgia, Times New Roman, serif' }}>
            {currentItem.words[0]}
          </span>
          <span className="text-xl text-gray-400">—</span>
          <span className="text-2xl md:text-3xl font-bold text-gray-800" style={{ fontFamily: 'Georgia, Times New Roman, serif' }}>
            {currentItem.words[1]}
          </span>
        </div>
        {isPractice && (
          <p className="text-xs text-gray-400 mt-3">Ítem de práctica (no suma puntos)</p>
        )}
      </div>

      {/* Campo de respuesta */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Respuesta del paciente
        </label>
        <textarea
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          disabled={scores[currentItem.num] !== undefined}
          placeholder="Escribe la respuesta del paciente..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] disabled:bg-gray-100 disabled:text-gray-500"
        />
        
        {/* Sugerencia de puntaje */}
        {suggestion && scores[currentItem.num] === undefined && !isPractice && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex justify-between items-start gap-3">
              <div className="flex-1">
                <p className="text-sm text-blue-700">
                  <strong>Sugerencia de puntaje:</strong> {suggestion.suggestedScore}
                  <span className="text-xs ml-2 text-blue-500">
                    ({suggestion.confidence === 'high' ? 'Alta confianza' : 
                      suggestion.confidence === 'medium' ? 'Confianza media' : 'Baja confianza'})
                  </span>
                </p>
                {suggestion.reason && (
                  <p className="text-xs text-blue-600 mt-1">{suggestion.reason}</p>
                )}
                <p className="text-xs text-orange-600 mt-2">{suggestion.disclaimer}</p>
              </div>
              <button 
                onClick={applySuggestion} 
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 whitespace-nowrap"
              >
                Aplicar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Botones de puntaje */}
      {scores[currentItem.num] === undefined && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-3">
            Puntaje para este ítem:
            {isPractice && <span className="ml-2 text-xs text-gray-400">(no suma puntos)</span>}
          </p>
          <div className="grid grid-cols-3 gap-3">
            <button 
              onClick={() => handleScore(0)} 
              className="py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50 transition-colors"
            >
              0 - No logrado
            </button>
            <button 
              onClick={() => handleScore(1)} 
              className="py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50 transition-colors"
            >
              1 - Respuesta parcial
            </button>
            <button 
              onClick={() => handleScore(2)} 
              className="py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50 transition-colors"
            >
              2 - Respuesta correcta
            </button>
          </div>
        </div>
      )}

      {/* Confirmación de ítem respondido */}
      {scores[currentItem.num] !== undefined && (
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <p className="text-green-700 text-sm">
            ✓ Ítem respondido con puntaje {scores[currentItem.num]}
            {isPractice && <span className="ml-2 text-xs">(no suma al total)</span>}
          </p>
        </div>
      )}

      {/* Puntaje acumulado */}
      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-sm text-gray-600">
          Puntaje bruto acumulado: {displayScore} / 46
          {!bonusApplied && patientAge >= 8 && (
            <span className="ml-2 text-xs text-gray-500">
              (Bonus potencial: +{bonusPoints} pts si acierta ítems {firstStartItem} y {secondStartItem})
            </span>
          )}
        </p>
      </div>
    </div>
  )
})