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
// FUNCIÓN DE SUGERENCIA DE PUNTUAJE - MEJORADA
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
}

function suggestScore(response: string, word1: string, word2: string, isPractice: boolean): SuggestionResult {
  if (isPractice) {
    return { suggestedScore: 0, confidence: 'low', reason: 'Ítem de práctica - registrar manualmente' }
  }

  const normalizedResponse = normalizeText(response)
  if (!normalizedResponse) {
    return { suggestedScore: 0, confidence: 'low', reason: 'Respuesta vacía' }
  }

  const highKeywords: Record<string, string[]> = {
    'Manzana-Plátano': ['fruta', 'frutas', 'alimento', 'comida', 'alimenticio', 'vegetal'],
    'Muñeca-Pelota': ['juguete', 'juguetes', 'entretención', 'juego', 'recreación', 'entretenimiento'],
    'Camisa-Zapato': ['ropa', 'vestimenta', 'prenda', 'vestir', 'indumentaria', 'atuendo'],
    'Agua-Leche': ['bebida', 'líquido', 'bebible', 'hidratante', 'bebestible'],
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
    'Agua-Leche': ['blanco', 'beber', 'tomar', 'líquido', 'hidratar'],
    'Mariposa-Abeja': ['vuela', 'alas', 'polen', 'color', 'vuelan'],
    'Abuelo-Primo': ['persona', 'hombre', 'mayor', 'menor', 'familiares'],
    'Auto-Avión': ['rueda', 'volar', 'conducir', 'moverse', 'trasladar'],
    'Invierno-Verano': ['frío', 'calor', 'sol', 'lluvia', 'temperatura'],
    'Natación-Atletismo': ['competencia', 'correr', 'nadar', 'piscina', 'estadio'],
    'Enojo-Alegría': ['feliz', 'triste', 'enojado', 'contento', 'emoción']
  }

  const key = `${word1}-${word2}`
  
  const keywords = highKeywords[key] || []
  for (const kw of keywords) {
    if (normalizedResponse.includes(kw)) {
      return { suggestedScore: 2, confidence: 'high', reason: `Palabra clave "${kw}" detectada` }
    }
  }

  const mediumKw = mediumKeywords[key] || []
  for (const kw of mediumKw) {
    if (normalizedResponse.includes(kw)) {
      return { suggestedScore: 1, confidence: 'medium', reason: `Palabra clave "${kw}" detectada` }
    }
  }

  if (normalizedResponse.split(' ').length >= 3) {
    return { suggestedScore: 1, confidence: 'low', reason: 'Respuesta elaborada, pero sin palabras clave' }
  }

  return { suggestedScore: 0, confidence: 'low', reason: 'Respuesta insuficiente' }
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
  // Determinar los ítems de inicio según edad
  const getStartItems = (): { first: number; second: number } => {
    if (patientAge <= 7) return { first: 1, second: 2 }
    if (patientAge <= 11) return { first: 5, second: 6 }
    return { first: 8, second: 9 }
  }

  // Verificar si se aplica bonus (ambos primeros ítems con puntaje 2)
  const checkBonusEligibility = (scores: Record<string | number, number>): boolean => {
    const { first, second } = getStartItems()
    return scores[first] === 2 && scores[second] === 2
  }

  const getBonusPoints = (): number => {
    if (patientAge >= 8 && patientAge <= 11) return 8
    return 0
  }

  // Obtener el ítem al que saltar después del retroceso
  const getJumpItemAfterBacktrack = (failedItem: number): number => {
    if (patientAge <= 7) {
      if (failedItem === 1) return 3
      if (failedItem === 2) return 4
      return failedItem + 1
    }
    if (patientAge <= 11) {
      if (failedItem === 5) return 7
      if (failedItem === 6) return 8
      return failedItem + 1
    }
    if (failedItem === 8) return 11
    if (failedItem === 9) return 12
    return failedItem + 1
  }

  // Siempre empezar desde PA (índice 0)
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

  const currentItem = AN_ITEMS[currentIndex]
  const isPractice = currentItem?.isPractice || false
  const { first: firstStartItem, second: secondStartItem } = getStartItems()

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
      console.log(`🎉 Bonus de +${getBonusPoints()} puntos aplicado por acertar ${firstStartItem} y ${secondStartItem}`)
    }
  }, [scores, bonusApplied, firstStartItem, secondStartItem])

  const getNextItemIndex = (currentItemNum: number | string, currentScore: number): number => {
    const currentIdx = AN_ITEMS.findIndex(i => i.num === currentItemNum)
    
    if (currentItemNum === 'PA') return AN_ITEMS.findIndex(i => i.num === 'PB')
    if (currentItemNum === 'PB') {
      return AN_ITEMS.findIndex(i => i.num === firstStartItem)
    }

    const numericItem = typeof currentItemNum === 'number' ? currentItemNum : parseInt(currentItemNum as string)
    
    if (backtrackMode) {
      if (currentScore === 2) {
        const prevItem = numericItem - 1
        if (prevItem >= 1 && !scores[prevItem]) {
          return AN_ITEMS.findIndex(i => i.num === prevItem)
        }
        setBacktrackMode(false)
        const jumpItem = getJumpItemAfterBacktrack(failedStartItem || firstStartItem)
        const jumpIndex = AN_ITEMS.findIndex(i => i.num === jumpItem)
        return jumpIndex >= 0 ? jumpIndex : currentIdx + 1
      } else {
        const prevItem = numericItem - 1
        if (prevItem >= 1 && !scores[prevItem]) {
          return AN_ITEMS.findIndex(i => i.num === prevItem)
        }
        setBacktrackMode(false)
        const jumpItem = getJumpItemAfterBacktrack(failedStartItem || firstStartItem)
        const jumpIndex = AN_ITEMS.findIndex(i => i.num === jumpItem)
        return jumpIndex >= 0 ? jumpIndex : currentIdx + 1
      }
    }

    if (numericItem === firstStartItem && currentScore !== 2) {
      setBacktrackMode(true)
      setFailedStartItem(numericItem)
      const prevItem = numericItem - 1
      if (prevItem >= 1 && !scores[prevItem]) {
        return AN_ITEMS.findIndex(i => i.num === prevItem)
      }
    }

    if (numericItem === secondStartItem && scores[firstStartItem] === 2 && currentScore !== 2) {
      setBacktrackMode(true)
      setFailedStartItem(firstStartItem)
      const prevItem = firstStartItem - 1
      if (prevItem >= 1 && !scores[prevItem]) {
        return AN_ITEMS.findIndex(i => i.num === prevItem)
      }
    }

    let nextIdx = currentIdx + 1
    while (nextIdx < AN_ITEMS.length && scores[AN_ITEMS[nextIdx].num]) {
      nextIdx++
    }
    return nextIdx
  }

  const handleScore = (score: number) => {
    if (scores[currentItem.num]) return

    const effectiveScore = isPractice ? 0 : score
    const newScores = { ...scores, [currentItem.num]: effectiveScore }
    setScores(newScores)
    setResponse('')
    setSuggestion(null)

    if (!isPractice) {
      if (effectiveScore === 0) {
        const newConsecutiveZeros = consecutiveZeros + 1
        setConsecutiveZeros(newConsecutiveZeros)
        if (newConsecutiveZeros >= 3) {
          const total = Object.values(newScores).reduce((a, b) => a + b, 0) + (bonusApplied ? getBonusPoints() : 0)
          setIsCompleted(true)
          onCompleteRef.current(newScores, total)
          return
        }
      } else {
        setConsecutiveZeros(0)
      }
    }

    const nextIndex = getNextItemIndex(currentItem.num, score)
    
    if (nextIndex >= AN_ITEMS.length) {
      const total = Object.values(newScores).reduce((a, b) => a + b, 0) + (bonusApplied ? getBonusPoints() : 0)
      setIsCompleted(true)
      onCompleteRef.current(newScores, total)
    } else {
      setCurrentIndex(nextIndex)
      setIsGoingBack(nextIndex < currentIndex)
    }
  }

  const applySuggestion = () => {
    if (suggestion && !scores[currentItem.num]) {
      handleScore(suggestion.suggestedScore)
    }
  }

  if (!currentItem) return null

  if (isCompleted) {
    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0) + (bonusApplied ? getBonusPoints() : 0)
    return (
      <div className="bg-green-50 rounded-lg p-4 text-center">
        <p className="text-green-700 font-medium">Subprueba completada</p>
        <p className="text-sm text-green-600 mt-1">
          Puntaje total: {totalScore} / 46
          {bonusApplied && <span className="ml-2 text-blue-600">(incluye +{getBonusPoints()} puntos por bonus)</span>}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Analogías</span>
          <span className="text-gray-800 font-medium">
            {isPractice ? 'Práctica' : `Ítem ${currentItem.num}`} / {AN_ITEMS.filter(i => !i.isPractice).length}
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full" style={{ 
            width: `${(Object.keys(scores).filter(k => !isNaN(Number(k))).length / AN_ITEMS.filter(i => !i.isPractice).length) * 100}%` 
          }} />
        </div>
        {isGoingBack && <p className="text-xs text-orange-600 mt-1">Retrocediendo para verificar nivel basal...</p>}
        {backtrackMode && <p className="text-xs text-orange-600 mt-1">Modo retroceso activo</p>}
        {bonusApplied && <p className="text-xs text-blue-600 mt-1">✓ Bonus de +{getBonusPoints()} puntos aplicado</p>}
      </div>

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
        {isPractice && <p className="text-xs text-gray-400 mt-3">Ítem de práctica (no suma puntos)</p>}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Respuesta del paciente</label>
        <textarea
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          disabled={!!scores[currentItem.num]}
          placeholder="Escribe la respuesta del paciente..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
        />
        
        {suggestion && !scores[currentItem.num] && !isPractice && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-blue-700">
                  <strong>Sugerencia de puntaje:</strong> {suggestion.suggestedScore}
                  <span className="text-xs ml-2 text-blue-500">
                    ({suggestion.confidence === 'high' ? 'Alta confianza' : suggestion.confidence === 'medium' ? 'Confianza media' : 'Baja confianza'})
                  </span>
                </p>
                {suggestion.reason && <p className="text-xs text-blue-600 mt-1">{suggestion.reason}</p>}
              </div>
              <button onClick={applySuggestion} className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Aplicar</button>
            </div>
          </div>
        )}
      </div>

      {!scores[currentItem.num] && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-3">
            Puntaje para este ítem:
            {isPractice && <span className="ml-2 text-xs text-gray-400">(no suma puntos)</span>}
          </p>
          <div className="grid grid-cols-3 gap-3">
            <button onClick={() => handleScore(0)} className="py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50">0 - No logrado</button>
            <button onClick={() => handleScore(1)} className="py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50">1 - Respuesta parcial</button>
            <button onClick={() => handleScore(2)} className="py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50">2 - Respuesta correcta</button>
          </div>
        </div>
      )}

      {scores[currentItem.num] !== undefined && (
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <p className="text-green-700 text-sm">
            ✓ Ítem respondido con puntaje {scores[currentItem.num]}
            {isPractice && <span className="ml-2 text-xs">(no suma al total)</span>}
          </p>
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-sm text-gray-600">
          Puntaje bruto acumulado: {Object.values(scores).reduce((a, b) => a + b, 0)} / 46
          {!bonusApplied && patientAge >= 8 && patientAge <= 11 && scores[firstStartItem] === 2 && scores[secondStartItem] !== 2 && (
            <span className="ml-2 text-xs text-blue-600">(Falta ítem {secondStartItem} para bonus de +8)</span>
          )}
        </p>
      </div>
    </div>
  )
})