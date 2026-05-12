'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'

// ============================================================
// CONFIGURACIÓN DE ÍTEMS PARA VOCABULARIO (VOC)
// ============================================================

interface VOCItem {
  num: number
  word: string
  hasImage: boolean
  imagePath?: string
  instruction?: string
}

const VOC_ITEMS: VOCItem[] = [
  { num: 1, word: 'Flor', hasImage: true, imagePath: '/wisc5/voc/voc001.png', instruction: '¿Qué es esto?' },
  { num: 2, word: 'Sol', hasImage: true, imagePath: '/wisc5/voc/voc002.png', instruction: '¿Qué es esto?' },
  { num: 3, word: 'Pera', hasImage: true, imagePath: '/wisc5/voc/voc003.png', instruction: '¿Qué es esto?' },
  { num: 4, word: 'Balde', hasImage: true, imagePath: '/wisc5/voc/voc004.png', instruction: '¿Qué es esto?' },
  { num: 5, word: 'Vaca', hasImage: false, instruction: '¿Qué es una vaca?' },
  { num: 6, word: 'Alegrar', hasImage: false, instruction: '¿Qué significa alegrar?' },
  { num: 7, word: 'Engañar', hasImage: false, instruction: '¿Qué significa engañar?' },
  { num: 8, word: 'Cachorro', hasImage: false, instruction: '¿Qué es un cachorro?' },
  { num: 9, word: 'Eterno', hasImage: false, instruction: '¿Qué significa eterno?' },
  { num: 10, word: 'Extraviado', hasImage: false, instruction: '¿Qué significa extraviado?' },
  { num: 11, word: 'Bus', hasImage: false, instruction: '¿Qué es un bus?' },
  { num: 12, word: 'Diccionario', hasImage: false, instruction: '¿Qué es un diccionario?' },
  { num: 13, word: 'Promesa', hasImage: false, instruction: '¿Qué es una promesa?' },
  { num: 14, word: 'Científico', hasImage: false, instruction: '¿Qué es un científico?' },
  { num: 15, word: 'Tolerar', hasImage: false, instruction: '¿Qué significa tolerar?' },
  { num: 16, word: 'Encantador', hasImage: false, instruction: '¿Qué significa encantador?' },
  { num: 17, word: 'Suficiente', hasImage: false, instruction: '¿Qué significa suficiente?' },
  { num: 18, word: 'Prófugo', hasImage: false, instruction: '¿Qué es un prófugo?' },
  { num: 19, word: 'Abreviado', hasImage: false, instruction: '¿Qué significa abreviado?' },
  { num: 20, word: 'Fugaz', hasImage: false, instruction: '¿Qué significa fugaz?' },
  { num: 21, word: 'Rebelde', hasImage: false, instruction: '¿Qué significa rebelde?' },
  { num: 22, word: 'Sofisticado', hasImage: false, instruction: '¿Qué significa sofisticado?' },
  { num: 23, word: 'Urbano', hasImage: false, instruction: '¿Qué significa urbano?' },
  { num: 24, word: 'Transgredir', hasImage: false, instruction: '¿Qué significa transgredir?' },
  { num: 25, word: 'Unilateral', hasImage: false, instruction: '¿Qué significa unilateral?' },
  { num: 26, word: 'Nocivo', hasImage: false, instruction: '¿Qué significa nocivo?' },
  { num: 27, word: 'Utopía', hasImage: false, instruction: '¿Qué es una utopía?' },
  { num: 28, word: 'Susceptible', hasImage: false, instruction: '¿Qué significa susceptible?' },
  { num: 29, word: 'Propiciar', hasImage: false, instruction: '¿Qué significa propiciar?' }
]

// ============================================================
// FUNCIÓN DE SUGERENCIA DE PUNTUAJE
// ============================================================

const normalizeText = (text: string): string => {
  return text.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

interface SuggestionResult {
  suggestedScore: 0 | 1 | 2
  confidence: 'low' | 'medium' | 'high'
  reason?: string
  disclaimer?: string
}

function suggestScore(response: string, itemNum: number): SuggestionResult {
  const disclaimer = '⚠️ Esta sugerencia es automática. Consulte el manual del WISC-V y aplique su criterio profesional.'

  if (!response || response.trim().length === 0) {
    return { suggestedScore: 0, confidence: 'low', reason: 'Respuesta vacía', disclaimer }
  }

  const norm = normalizeText(response)

  // Palabras clave para puntuación 2 (definición completa y precisa)
  const score2Keywords: Record<number, string[]> = {
    1: ['flor', 'girasol', 'margarita'],
    2: ['sol'],
    3: ['pera'],
    4: ['balde', 'cubo', 'cubeta'],
    5: ['animal', 'mamifero', 'vaca', 'bovino', 'vacuno', 'leche', 'muge'],
    6: ['feliz', 'contento', 'alegre', 'animar', 'animo', 'hacer reir', 'transmitir felicidad'],
    7: ['mentir', 'mentira', 'hacer creer', 'no es verdad', 'falso'],
    8: ['cria', 'perro bebe', 'recien nacido', 'mamifero'],
    9: ['para siempre', 'nunca termina', 'nunca acaba', 'eterno'],
    10: ['perdido', 'desaparecido', 'perder', 'rumbo', 'extraviado'],
    11: ['vehiculo', 'transporte', 'publico', 'micro', 'autobus', 'mucha gente', 'furgon'],
    12: ['significado', 'definicion', 'palabras', 'diccionario', 'libro'],
    13: ['cumplir', 'compromiso', 'acuerdo', 'juramento', 'palabra', 'contrato'],
    14: ['ciencia', 'cientifico', 'investigador', 'metodo cientifico', 'experimento', 'descubrimiento'],
    15: ['respetar', 'aguantar', 'soportar', 'tolerar', 'ideas', 'distintas', 'paciencia'],
    16: ['simpatico', 'agradable', 'amable', 'cae bien', 'hechicero', 'brujo'],
    17: ['suficiente', 'bastante', 'adecuado', 'necesario', 'basta'],
    18: ['fugitivo', 'escapo', 'escapa', 'justicia', 'ley', 'ladron', 'profugo'],
    19: ['acortado', 'resumido', 'abreviado', 'breve', 'corto', 'version'],
    20: ['breve', 'instante', 'poco tiempo', 'fugaz', 'rapido', 'veloz'],
    21: ['desafia', 'normas', 'reglas', 'leyes', 'transgresor', 'rebelde', 'disconforme'],
    22: ['complejo', 'elegante', 'refinado', 'sofisticado', 'lujo'],
    23: ['ciudad', 'citadino', 'urbano', 'cortes', 'educado'],
    24: ['romper', 'quebrar', 'saltarse', 'normas', 'reglas', 'ley', 'transgredir'],
    25: ['unilateral', 'una parte', 'un lado', 'considera'],
    26: ['dañino', 'perjudicial', 'nocivo', 'malo', 'hace mal'],
    27: ['utopia', 'sociedad', 'ideal', 'futura', 'paraiso'],
    28: ['sensible', 'fragil', 'susceptible', 'molesta', 'facilmente'],
    29: ['propiciar', 'condiciones', 'favorecer', 'facilitar', 'generar']
  }

  // Palabras clave para puntuación 1 (definición parcial o ejemplo)
  const score1Keywords: Record<number, string[]> = {
    1: ['planta', 'crece'],
    2: ['brilla', 'estrella', 'circulo'],
    3: ['fruta', 'comida', 'dulce', 'manzana'],
    4: ['lata', 'tarro', 'canasta', 'caja', 'agua', 'limpiar', 'trapear'],
    5: ['leche', 'pasto', 'granja', 'campo', 'cuernos', 'herbivoro'],
    6: ['divertir', 'regalo', 'buena noticia', 'siente bien'],
    7: ['ocultar', 'verdad', 'traicionar', 'abuso', 'confianza', 'pareja'],
    8: ['animal', 'mascota', 'perro', 'perrito', 'pequeño', 'chico'],
    9: ['mucho tiempo', 'nunca cambia', 'largo'],
    10: ['olvidado', 'perdido', 'desaparecido'],
    11: ['vehiculo', 'transporte', 'viaje', 'escuela', 'pasajeros'],
    12: ['significado', 'palabras', 'aprender', 'traducir', 'ordenadas'],
    13: ['decir', 'hacer', 'cumplir', 'responsable', 'verdad'],
    14: ['descubre', 'inventa', 'investigador', 'experimento', 'biologo', 'fisico', 'quimico'],
    15: ['respetar', 'paciencia', 'aceptar', 'admitir', 'empatia'],
    16: ['bonita', 'educado', 'lindo', 'hermoso', 'bello', 'tierno', 'alegre'],
    17: ['bien', 'justo', 'lleno', 'no quiero mas'],
    18: ['escapar', 'buscado', 'escondido'],
    19: ['breve', 'corto', 'rapido', 'resumen'],
    20: ['rapido', 'veloz'],
    21: ['indignado', 'disconforme', 'desobedece', 'contrario'],
    22: ['complejo', 'dificil', 'exclusivo', 'culto', 'mejor'],
    23: ['ciudad', 'habitado', 'viven', 'estilo', 'moda'],
    24: ['inadecuado', 'agredir', 'pegar', 'golpear'],
    25: ['un lado', 'lateral', 'parte'],
    26: ['disgusta', 'molesto', 'desagradable', 'incomodo'],
    27: ['sociedad', 'futuro', 'paraiso', 'ideal', 'dificil'],
    28: ['influenciable', 'inseguro'],
    29: ['dar', 'entregar', 'generar', 'ofrecer']
  }

  // Verificar puntuación 2
  const kw2 = score2Keywords[itemNum] || []
  for (const kw of kw2) {
    if (norm.includes(normalizeText(kw))) {
      return { suggestedScore: 2, confidence: 'high', reason: 'Palabra clave de puntuación 2 detectada: ' + kw, disclaimer }
    }
  }

  // Verificar puntuación 1
  const kw1 = score1Keywords[itemNum] || []
  for (const kw of kw1) {
    if (norm.includes(normalizeText(kw))) {
      return { suggestedScore: 1, confidence: 'medium', reason: 'Palabra clave de puntuación 1 detectada: ' + kw, disclaimer }
    }
  }

  // Si la respuesta es elaborada pero sin palabras clave
  if (norm.split(' ').length >= 5) {
    return { suggestedScore: 1, confidence: 'low', reason: 'Respuesta elaborada, pero sin palabras clave específicas', disclaimer }
  }

  return { suggestedScore: 0, confidence: 'low', reason: 'Respuesta insuficiente o incorrecta', disclaimer }
}

// ============================================================
// COMPONENTE PRINCIPAL VOCABULARIO
// ============================================================

interface VOCInterfaceProps {
  onComplete: (scores: Record<number, number>, rawTotal: number) => void
  onUpdatePatient: (content: any) => void
  patientAge: number
}

export const VOCInterface = React.memo(function VOCInterface({ onComplete, onUpdatePatient, patientAge }: VOCInterfaceProps) {
  // Determinar ítems de inicio según edad
  const getStartItems = (): { first: number; second: number; jumpAfterBacktrack: number } => {
    if (patientAge <= 8) {
      return { first: 1, second: 2, jumpAfterBacktrack: 3 }
    }
    if (patientAge <= 11) {
      return { first: 5, second: 6, jumpAfterBacktrack: 7 }
    }
    return { first: 10, second: 11, jumpAfterBacktrack: 12 }
  }

  const calculateBonusPoints = (): number => {
    const { first } = getStartItems()
    if (patientAge <= 8) return 0
    return (first - 1) * 2
  }

  const checkBonusEligibility = (scores: Record<number, number>): boolean => {
    const { first, second } = getStartItems()
    if (patientAge <= 8) return false
    return scores[first] === 2 && scores[second] === 2
  }

  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    const { first } = getStartItems()
    return VOC_ITEMS.findIndex(i => i.num === first)
  })
  const [response, setResponse] = useState('')
  const [suggestion, setSuggestion] = useState<SuggestionResult | null>(null)
  const [scores, setScores] = useState<Record<number, number>>({})
  const [consecutiveZeros, setConsecutiveZeros] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [bonusApplied, setBonusApplied] = useState(false)
  const [isGoingBack, setIsGoingBack] = useState(false)
  const [backtrackMode, setBacktrackMode] = useState(false)
  const [failedStartItem, setFailedStartItem] = useState<number | null>(null)
  const [consecutiveSuccessesInBacktrack, setConsecutiveSuccessesInBacktrack] = useState(0)

  const currentItem = VOC_ITEMS[currentIndex]
  const { first: firstStartItem, second: secondStartItem, jumpAfterBacktrack } = getStartItems()
  const hasBacktrack = patientAge >= 9

  const onCompleteRef = useRef(onComplete)
  const onUpdatePatientRef = useRef(onUpdatePatient)

  useEffect(() => {
    onCompleteRef.current = onComplete
    onUpdatePatientRef.current = onUpdatePatient
  }, [onComplete, onUpdatePatient])

  // Enviar estímulo al display
  useEffect(() => {
    if (currentItem && !isCompleted) {
      onUpdatePatientRef.current({
        type: 'wisc5_voc',
        itemNum: currentItem.num,
        word: currentItem.word,
        instruction: currentItem.instruction,
        hasImage: currentItem.hasImage,
        imagePath: currentItem.imagePath || null
      })
    }
  }, [currentItem, isCompleted])

  // Sugerencia en tiempo real
  useEffect(() => {
    if (currentItem && response.trim().length > 0 && scores[currentItem.num] === undefined) {
      const result = suggestScore(response, currentItem.num)
      setSuggestion(result)
    } else {
      setSuggestion(null)
    }
  }, [response, currentItem])

  // Verificar bonus
  useEffect(() => {
    if (!bonusApplied && checkBonusEligibility(scores)) {
      setBonusApplied(true)
      const bonus = calculateBonusPoints()
      console.log('🎉 Bonus de +' + bonus + ' puntos aplicado')
    }
  }, [scores, bonusApplied, firstStartItem, secondStartItem])

  const markSkippedItemsAsCorrect = (
    newScores: Record<number, number>,
    fromItem: number,
    toItem: number
  ): Record<number, number> => {
    const updatedScores = { ...newScores }
    for (let i = toItem + 1; i < fromItem; i++) {
      if (updatedScores[i] === undefined) {
        updatedScores[i] = 2
        console.log('✓ Ítem ' + i + ' no administrado - se asigna puntaje 2 automáticamente')
      }
    }
    return updatedScores
  }

  const getNextItemIndex = (currentItemNum: number, currentScore: number): { nextIndex: number; updatedScores: Record<number, number> } => {
    let updatedScores = { ...scores }
    const currentIdx = VOC_ITEMS.findIndex(i => i.num === currentItemNum)

    if (!hasBacktrack) {
      let nextIdx = currentIdx + 1
      while (nextIdx < VOC_ITEMS.length && updatedScores[VOC_ITEMS[nextIdx].num] !== undefined) {
        nextIdx++
      }
      return { nextIndex: nextIdx, updatedScores }
    }

    // Modo retroceso activo
    if (backtrackMode) {
      if (currentScore === 2) {
        const newSuccesses = consecutiveSuccessesInBacktrack + 1
        setConsecutiveSuccessesInBacktrack(newSuccesses)

        if (newSuccesses >= 2) {
          setBacktrackMode(false)
          setConsecutiveSuccessesInBacktrack(0)
          updatedScores = markSkippedItemsAsCorrect(updatedScores, failedStartItem!, currentItemNum)
          const jumpIndex = VOC_ITEMS.findIndex(i => i.num === jumpAfterBacktrack)
          return { nextIndex: jumpIndex >= 0 ? jumpIndex : currentIdx + 1, updatedScores }
        }

        let prevItem = currentItemNum - 1
        while (prevItem >= 1 && updatedScores[prevItem] !== undefined) {
          prevItem--
        }
        if (prevItem >= 1) {
          return { nextIndex: VOC_ITEMS.findIndex(i => i.num === prevItem), updatedScores }
        }
      } else {
        setConsecutiveSuccessesInBacktrack(0)
        let prevItem = currentItemNum - 1
        while (prevItem >= 1 && updatedScores[prevItem] !== undefined) {
          prevItem--
        }
        if (prevItem >= 1) {
          return { nextIndex: VOC_ITEMS.findIndex(i => i.num === prevItem), updatedScores }
        }
      }
      setBacktrackMode(false)
      setConsecutiveSuccessesInBacktrack(0)
    }

    // Verificar si se debe activar secuencia inversa
    const isFirstTwo = currentItemNum === firstStartItem || currentItemNum === secondStartItem
    const isFailure = currentScore < 2

    if (isFirstTwo && isFailure) {
      setBacktrackMode(true)
      setFailedStartItem(currentItemNum)
      setConsecutiveSuccessesInBacktrack(0)

      let prevItem = currentItemNum - 1
      while (prevItem >= 1 && updatedScores[prevItem] !== undefined) {
        prevItem--
      }
      if (prevItem >= 1) {
        return { nextIndex: VOC_ITEMS.findIndex(i => i.num === prevItem), updatedScores }
      }
    }

    let nextIdx = currentIdx + 1
    while (nextIdx < VOC_ITEMS.length && updatedScores[VOC_ITEMS[nextIdx].num] !== undefined) {
      nextIdx++
    }
    return { nextIndex: nextIdx, updatedScores }
  }

  const handleScore = (score: number) => {
    if (scores[currentItem.num] !== undefined) return

    let newScores = { ...scores, [currentItem.num]: score }
    setScores(newScores)
    setResponse('')
    setSuggestion(null)

    if (score === 0) {
      const newZeros = consecutiveZeros + 1
      setConsecutiveZeros(newZeros)
      if (newZeros >= 3) {
        const bonus = bonusApplied ? calculateBonusPoints() : 0
        const total = Object.values(newScores).reduce((a, b) => a + b, 0) + bonus
        setIsCompleted(true)
        onCompleteRef.current(newScores, total)
        return
      }
    } else {
      setConsecutiveZeros(0)
    }

    const { nextIndex, updatedScores } = getNextItemIndex(currentItem.num, score)
    newScores = updatedScores
    setScores(newScores)

    if (nextIndex >= VOC_ITEMS.length) {
      const bonus = bonusApplied || checkBonusEligibility(newScores) ? calculateBonusPoints() : 0
      const total = Object.values(newScores).reduce((a, b) => a + b, 0) + bonus
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
    const bonus = bonusApplied ? calculateBonusPoints() : 0
    const total = Object.values(scores).reduce((a, b) => a + b, 0) + bonus
    const maxP = VOC_ITEMS.length * 2

    return (
      <div className="bg-green-50 rounded-lg p-4 text-center">
        <p className="text-green-700 font-medium">Subprueba completada</p>
        <p className="text-sm text-green-600 mt-1">
          Puntaje total: {total} / {maxP}
          {bonusApplied && (
            <span className="ml-2 text-blue-600">(incluye +{bonus} puntos por bonus)</span>
          )}
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
          <span className="text-gray-600">Vocabulario</span>
          <span className="text-gray-800 font-medium">
            Ítem {currentItem.num} / {VOC_ITEMS.length}
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full" style={{
            width: (Object.keys(scores).length / VOC_ITEMS.length) * 100 + '%'
          }} />
        </div>
        {isGoingBack && <p className="text-xs text-orange-600 mt-1">↩️ Retrocediendo para verificar nivel basal...</p>}
        {backtrackMode && (
          <p className="text-xs text-orange-600 mt-1">🔄 Modo retroceso activo - Éxitos consecutivos: {consecutiveSuccessesInBacktrack}/2</p>
        )}
        {bonusApplied && <p className="text-xs text-blue-600 mt-1">✓ Bonus de +{bonusPts} puntos aplicado</p>}
      </div>

      {/* Estímulo (imagen o palabra) */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
        {currentItem.hasImage && currentItem.imagePath ? (
          <div>
            <p className="text-sm text-blue-700 mb-3">{currentItem.instruction}</p>
            <img
              src={currentItem.imagePath}
              alt={'Ítem ' + currentItem.num}
              className="mx-auto max-h-64 object-contain rounded-lg border border-gray-200"
              onError={(e) => { e.currentTarget.src = '/placeholder-image.png' }}
            />
          </div>
        ) : (
          <div>
            <p className="text-sm text-blue-700 mb-3">{currentItem.instruction}</p>
            <p className="text-3xl md:text-4xl font-bold text-gray-800" style={{ fontFamily: 'Georgia, Times New Roman, serif' }}>
              {currentItem.word}
            </p>
          </div>
        )}
      </div>

      {/* Campo de respuesta */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Respuesta del evaluado</label>
        <textarea
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          disabled={scores[currentItem.num] !== undefined}
          placeholder="Escribe la respuesta del evaluado..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] disabled:bg-gray-100 disabled:text-gray-500"
        />

        {suggestion && scores[currentItem.num] === undefined && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex justify-between items-start gap-3">
              <div className="flex-1">
                <p className="text-sm text-blue-700">
                  <strong>Sugerencia de puntaje:</strong> {suggestion.suggestedScore}
                  <span className="text-xs ml-2 text-blue-500">
                    ({suggestion.confidence === 'high' ? 'Alta' : suggestion.confidence === 'medium' ? 'Media' : 'Baja'} confianza)
                  </span>
                </p>
                {suggestion.reason && <p className="text-xs text-blue-600 mt-1">{suggestion.reason}</p>}
                <p className="text-xs text-orange-600 mt-2">{suggestion.disclaimer}</p>
              </div>
              <button onClick={applySuggestion}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 whitespace-nowrap">
                Aplicar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Botones de puntaje */}
      {scores[currentItem.num] === undefined && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-3">Puntaje para este ítem:</p>
          <div className="grid grid-cols-3 gap-3">
            <button onClick={() => handleScore(0)}
              className="py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50 transition-colors">
              0 - Incorrecto
            </button>
            <button onClick={() => handleScore(1)}
              className="py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50 transition-colors">
              1 - Parcial
            </button>
            <button onClick={() => handleScore(2)}
              className="py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50 transition-colors">
              2 - Correcto
            </button>
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
          Puntaje bruto acumulado: {displayScore} / {VOC_ITEMS.length * 2}
          {!bonusApplied && patientAge >= 9 && (
            <span className="ml-2 text-xs text-gray-500">
              (Bonus potencial: +{bonusPts} pts si acierta ítems {firstStartItem} y {secondStartItem})
            </span>
          )}
        </p>
      </div>
    </div>
  )
})