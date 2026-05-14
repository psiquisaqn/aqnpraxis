'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'

// ============================================================
// CONFIGURACIÓN DE ÍTEMS PARA INFORMACIÓN (IN)
// ============================================================

interface INItem {
  num: number
  question: string
  tips?: string
}

const IN_ITEMS: INItem[] = [
  { num: 1, question: 'Señálame tu nariz', tips: 'Si no da respuesta de 1 punto, señale la nariz del niño y diga: "Esta es tu nariz".' },
  { num: 2, question: 'Señálame tu oreja', tips: 'Si no da respuesta de 1 punto, señale la oreja del niño y diga: "Esta es tu oreja".' },
  { num: 3, question: 'Nombra un tipo de pájaro' },
  { num: 4, question: '¿Qué día viene inmediatamente después del jueves?', tips: 'Si dice "ayer", "hoy" o "mañana", pregunte: "¿Cómo se llama ese día?".' },
  { num: 5, question: 'Nombra algo con cuerdas que se utilice para hacer música' },
  { num: 6, question: '¿Qué mes viene inmediatamente después de junio?', tips: 'Si dice "el mes anterior", "el mes pasado", "el mes próximo" o "este mes", diga: "Sí, pero ¿cómo se llama ese mes?".' },
  { num: 7, question: 'Nombra un tipo de árbol' },
  { num: 8, question: '¿Cuántas horas tiene un día?' },
  { num: 9, question: 'Nombra una tecnología que haya cambiado la forma en que los humanos se comunican', tips: 'Si no da respuesta de 1 punto, diga: "Los computadores son una tecnología que ha cambiado la forma en que los humanos se comunican".' },
  { num: 10, question: 'Dime el nombre de dos océanos' },
  { num: 11, question: '¿De qué país es originaria la pizza?' },
  { num: 12, question: '¿En qué país está la Torre Eiffel?' },
  { num: 13, question: '¿Cuáles son los cuatro puntos cardinales?', tips: 'Si dice menos de cuatro, diga: "Dime otro de los puntos cardinales" hasta que haya intentado decir los cuatro.' },
  { num: 14, question: '¿Qué hace el corazón en nuestros cuerpos?' },
  { num: 15, question: '¿Cuál es la causa de los terremotos?', tips: 'Si nombra una figura mítica o religiosa, diga: "¿Qué cosa de la naturaleza causa los terremotos?".' },
  { num: 16, question: '¿Quiénes fueron los Beatles?' },
  { num: 17, question: '¿Cuál es la montaña más alta del mundo?', tips: 'Si dice "Chimborazo", diga: "Sí, pero ¿cuál es la montaña más alta del mundo desde el nivel del mar?".' },
  { num: 18, question: '¿Cuántos días hay en un año?', tips: 'Si dice "366", diga: "¿Cuántos días hay en la mayoría de los años?".' },
  { num: 19, question: '¿Para qué sirve un satélite?' },
  { num: 20, question: '¿En qué continente está Polonia?', tips: 'Si contesta "América del Sur", diga: "Sí, pero ¿en qué continente está el país llamado Polonia?".' },
  { num: 21, question: '¿Qué continente tiene la mayor cantidad de personas?' },
  { num: 22, question: '¿Quién pintó la Mona Lisa?' },
  { num: 23, question: '¿Quiénes fueron los Mayas?' },
  { num: 24, question: '¿Cuántos países hay en el mundo?', tips: 'Si dice el número de continentes, repita la palabra enfatizando "países". Si dice "No sé", diga: "¿Pero cuántos crees que son aproximadamente?".' },
  { num: 25, question: '¿En qué lugares del mundo existen noches de 24 horas?', tips: 'Si nombra un país con reclamo sobre los polos, diga: "Sí, pero ¿en qué parte específicamente de [país]?".' },
  { num: 26, question: '¿Quién fue Stephen Hawking?' },
  { num: 27, question: '¿Quién es Quetzalcoatl?' },
  { num: 28, question: '¿Cuántos kilómetros tiene América del Sur desde el extremo norte al extremo sur?', tips: 'Si dice "No sé", diga: "¿Pero cuántos crees que son aproximadamente?".' },
  { num: 29, question: 'Dime alguna obra que haya hecho Miguel Ángel' },
  { num: 30, question: '¿Por qué se eleva el aire caliente?' },
  { num: 31, question: '¿Quién fue Ícaro?' }
]

// ============================================================
// FUNCIÓN DE SUGERENCIA DE PUNTUAJE
// ============================================================

const normalizeText = (text: string): string => {
  return text.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

interface SuggestionResult {
  suggestedScore: 0 | 1
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

  // Palabras clave para puntuación 1
  const score1Keywords: Record<number, string[]> = {
    1: ['nariz'],
    2: ['oreja'],
    3: ['colibri', 'paloma', 'gaviota', 'codorniz', 'tucan', 'buho', 'pajaro', 'carpintero', 'mirlo', 'sialia', 'cardenal', 'pinguino', 'avestruz', 'dodo', 'aguila', 'halcon', 'condor', 'canario', 'cacatua', 'loro', 'catita'],
    4: ['viernes'],
    5: ['guitarra', 'banjo', 'bajo', 'violin', 'viola', 'chelo', 'citara', 'mandolina', 'arpa', 'piano', 'dulcimer', 'cuerda'],
    6: ['julio'],
    7: ['roble', 'cedro', 'picea', 'olmo', 'alamo', 'sauce', 'abedul', 'pino', 'arce', 'algarrobo', 'abeto', 'secoya', 'nogal', 'cipres', 'castano', 'manzano', 'peral', 'naranjo', 'melocotonero', 'duraznero', 'palmera', 'cocotero', 'siempreverde', 'caducifolio', 'conifero'],
    8: ['24', 'veinticuatro'],
    9: ['computador', 'notebook', 'telefono', 'celular', 'television', 'televisor'],
    10: ['pacifico', 'indico', 'atlantico', 'artico', 'antartico'],
    11: ['italia'],
    12: ['francia'],
    13: ['norte', 'sur', 'este', 'oeste'],
    14: ['bombea', 'sangre', 'vasos', 'venas', 'oxigeno', 'pulmones', 'circulando', 'fluyendo'],
    15: ['tectonico', 'placas', 'presion', 'corteza', 'volcan', 'magma', 'lava', 'sismico', 'fallas', 'conveccion'],
    16: ['banda', 'grupo', 'musica', 'musico', 'cantante', 'beatle'],
    17: ['everest'],
    18: ['365'],
    19: ['comunicar', 'transmitir', 'señal', 'observar', 'investigar', 'galaxia', 'espiar', 'satelite'],
    20: ['europa'],
    21: ['asia'],
    22: ['da vinci', 'leonardo'],
    23: ['maya', 'precolombino', 'originario', 'civilizacion', 'mexicana', 'latinoamericana'],
    24: ['155', '160', '170', '180', '190', '200', '210', '220', '230', '235'],
    25: ['polo', 'circunferencia polar', 'alaska'],
    26: ['cientifico', 'silla de ruedas', 'agujero negro', 'teoria', 'hawking'],
    27: ['dios', 'serpiente', 'emplumada', 'mesoamericano', 'prehispanico', 'maya', 'azteca', 'quetzalcoatl'],
    28: ['5000', '6000', '7000', '8000', '9000', '10000'],
    29: ['david', 'capilla sixtina', 'piedad', 'moises', 'baco'],
    30: ['denso', 'ligero', 'pesa menos', 'expandir', 'molecula', 'atomo', 'caliente'],
    31: ['icaro', 'mitologia', 'griega', 'alas', 'sol', 'cera', 'escapar', 'laberinto']
  }

  // Palabras clave para puntuación 0 (respuestas incorrectas típicas)
  const score0Keywords: Record<number, string[]> = {
    3: ['azul', 'rojo', 'negro', 'cafe', 'rosado', 'naranjo', 'dorado', 'verde', 'pato donald'],
    4: ['ayer', 'hoy', 'mañana', 'lunes', 'martes', 'miercoles', 'sabado', 'domingo'],
    5: ['tambor', 'timbal', 'campana', 'xilofono', 'pito', 'castañuela', 'acordeon', 'armonica', 'flauta', 'voz', 'canto', 'organo', 'teclado'],
    8: ['12', 'doce'],
    11: ['europa', 'nueva york'],
    12: ['paris', 'estados unidos'],
    13: ['arriba', 'abajo', 'derecha', 'izquierda', 'adelante', 'atras'],
    14: ['sangre', 'late', 'organo', 'ama', 'rompe', 'ataque'],
    15: ['tsunami', 'ola', 'tornado', 'huracan', 'tormenta', 'asteroide', 'cometa', 'meteorito'],
    17: ['chimborazo', 'andes'],
    18: ['366'],
    21: ['china', 'india'],
    22: ['van gogh', 'picasso', 'miguel angel'],
    25: ['chile', 'argentina', 'colombia', 'china', 'ecuador'],
    30: ['evapora', 'viento', 'gas'],
    31: ['dios', 'fabula']
  }

  // Verificar puntuación 1
  const kw1 = score1Keywords[itemNum] || []
  for (const kw of kw1) {
    if (norm.includes(normalizeText(kw))) {
      return { suggestedScore: 1, confidence: 'high', reason: 'Palabra clave de puntuación 1 detectada: ' + kw, disclaimer }
    }
  }

  // Verificar puntuación 0
  const kw0 = score0Keywords[itemNum] || []
  for (const kw of kw0) {
    if (norm.includes(normalizeText(kw))) {
      return { suggestedScore: 0, confidence: 'medium', reason: 'Respuesta típica de 0 puntos detectada', disclaimer }
    }
  }

  return { suggestedScore: 0, confidence: 'low', reason: 'Respuesta insuficiente o no reconocida', disclaimer }
}

// ============================================================
// COMPONENTE PRINCIPAL INFORMACIÓN
// ============================================================

interface INInterfaceProps {
  onComplete: (scores: Record<number, number>, rawTotal: number) => void
  onUpdatePatient: (content: any) => void
  patientAge: number
}

export const INInterface = React.memo(function INInterface({ onComplete, onUpdatePatient, patientAge }: INInterfaceProps) {
  // Determinar ítems de inicio según edad
  const getStartItems = (): { first: number; second: number; jumpAfterBacktrack: number } => {
    if (patientAge <= 8) {
      return { first: 1, second: 2, jumpAfterBacktrack: 3 }
    }
    return { first: 8, second: 9, jumpAfterBacktrack: 10 }
  }

  const calculateBonusPoints = (): number => {
    const { first } = getStartItems()
    if (patientAge <= 8) return 0
    return first - 1
  }

  const checkBonusEligibility = (scores: Record<number, number>): boolean => {
    const { first, second } = getStartItems()
    if (patientAge <= 8) return false
    return scores[first] === 1 && scores[second] === 1
  }

  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    const { first } = getStartItems()
    return IN_ITEMS.findIndex(i => i.num === first)
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

  const currentItem = IN_ITEMS[currentIndex]
  const { first: firstStartItem, second: secondStartItem, jumpAfterBacktrack } = getStartItems()
  const hasBacktrack = patientAge >= 9

  const onCompleteRef = useRef(onComplete)
  const onUpdatePatientRef = useRef(onUpdatePatient)

  useEffect(() => {
    onCompleteRef.current = onComplete
    onUpdatePatientRef.current = onUpdatePatient
  }, [onComplete, onUpdatePatient])

  // Enviar pregunta al display
  useEffect(() => {
    if (currentItem && !isCompleted) {
      onUpdatePatientRef.current({
        type: 'wisc5_in',
        itemNum: currentItem.num,
        question: currentItem.question,
        tips: currentItem.tips || null
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
        updatedScores[i] = 1
        console.log('✓ Ítem ' + i + ' no administrado - se asigna puntaje 1 automáticamente')
      }
    }
    return updatedScores
  }

  const getNextItemIndex = (currentItemNum: number, currentScore: number): { nextIndex: number; updatedScores: Record<number, number> } => {
    let updatedScores = { ...scores }
    const currentIdx = IN_ITEMS.findIndex(i => i.num === currentItemNum)

    if (!hasBacktrack) {
      let nextIdx = currentIdx + 1
      while (nextIdx < IN_ITEMS.length && updatedScores[IN_ITEMS[nextIdx].num] !== undefined) {
        nextIdx++
      }
      return { nextIndex: nextIdx, updatedScores }
    }

    // Modo retroceso activo
    if (backtrackMode) {
      if (currentScore === 1) {
        const newSuccesses = consecutiveSuccessesInBacktrack + 1
        setConsecutiveSuccessesInBacktrack(newSuccesses)

        if (newSuccesses >= 2) {
          setBacktrackMode(false)
          setConsecutiveSuccessesInBacktrack(0)
          updatedScores = markSkippedItemsAsCorrect(updatedScores, failedStartItem!, currentItemNum)
          const jumpIndex = IN_ITEMS.findIndex(i => i.num === jumpAfterBacktrack)
          return { nextIndex: jumpIndex >= 0 ? jumpIndex : currentIdx + 1, updatedScores }
        }

        let prevItem = currentItemNum - 1
        while (prevItem >= 1 && updatedScores[prevItem] !== undefined) {
          prevItem--
        }
        if (prevItem >= 1) {
          return { nextIndex: IN_ITEMS.findIndex(i => i.num === prevItem), updatedScores }
        }
      } else {
        setConsecutiveSuccessesInBacktrack(0)
        let prevItem = currentItemNum - 1
        while (prevItem >= 1 && updatedScores[prevItem] !== undefined) {
          prevItem--
        }
        if (prevItem >= 1) {
          return { nextIndex: IN_ITEMS.findIndex(i => i.num === prevItem), updatedScores }
        }
      }
      setBacktrackMode(false)
      setConsecutiveSuccessesInBacktrack(0)
    }

    // Verificar si se debe activar secuencia inversa
    const isFirstTwo = currentItemNum === firstStartItem || currentItemNum === secondStartItem
    const isFailure = currentScore === 0

    if (isFirstTwo && isFailure) {
      setBacktrackMode(true)
      setFailedStartItem(currentItemNum)
      setConsecutiveSuccessesInBacktrack(0)

      let prevItem = currentItemNum - 1
      while (prevItem >= 1 && updatedScores[prevItem] !== undefined) {
        prevItem--
      }
      if (prevItem >= 1) {
        return { nextIndex: IN_ITEMS.findIndex(i => i.num === prevItem), updatedScores }
      }
    }

    let nextIdx = currentIdx + 1
    while (nextIdx < IN_ITEMS.length && updatedScores[IN_ITEMS[nextIdx].num] !== undefined) {
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

    if (nextIndex >= IN_ITEMS.length) {
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
    const maxP = IN_ITEMS.length

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
          <span className="text-gray-600">Información</span>
          <span className="text-gray-800 font-medium">
            Ítem {currentItem.num} / {IN_ITEMS.length}
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full" style={{
            width: (Object.keys(scores).length / IN_ITEMS.length) * 100 + '%'
          }} />
        </div>
        {isGoingBack && <p className="text-xs text-orange-600 mt-1">↩️ Retrocediendo para verificar nivel basal...</p>}
        {backtrackMode && (
          <p className="text-xs text-orange-600 mt-1">🔄 Modo retroceso activo - Éxitos consecutivos: {consecutiveSuccessesInBacktrack}/2</p>
        )}
        {bonusApplied && <p className="text-xs text-blue-600 mt-1">✓ Bonus de +{bonusPts} puntos aplicado</p>}
      </div>

      {/* Pregunta */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
        <p className="text-sm text-blue-700 mb-3">Pregunta para el evaluado:</p>
        <p className="text-2xl md:text-3xl font-bold text-gray-800" style={{ fontFamily: 'Georgia, Times New Roman, serif' }}>
          {currentItem.question}
        </p>
        {currentItem.tips && (
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200 text-left">
            <p className="text-xs text-yellow-700">
              <strong>💡 Recomendación:</strong> {currentItem.tips}
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
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => handleScore(0)}
              className="py-3 rounded-lg border border-gray-200 text-sm hover:bg-gray-50 transition-colors">
              0 - Incorrecto
            </button>
            <button onClick={() => handleScore(1)}
              className="py-3 rounded-lg border border-gray-200 text-sm hover:bg-gray-50 transition-colors">
              1 - Correcto
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
          Puntaje bruto acumulado: {displayScore} / {IN_ITEMS.length}
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