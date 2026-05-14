'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'

// ============================================================
// CONFIGURACIÓN DE ÍTEMS PARA COMPRENSIÓN (COM)
// ============================================================

interface COMItem {
  num: number
  question: string
  tips?: string
  conceptGeneral?: string
}

const COM_ITEMS: COMItem[] = [
  { num: 4, question: '¿Qué deberías hacer si ves que sale humo de la casa de tu vecino?', 
    tips: 'Si no da respuesta de 2 puntos, diga: "Si ves que sale humo de la casa de tu vecino, deberías llamar a algún servicio de emergencias y avisar a algún adulto". Si da cuenta de solo un concepto general, pida una segunda respuesta diciendo: "Dime qué otra cosa deberías hacer si ves que sale humo de la casa de tu vecino".',
    conceptGeneral: 'Concepto 1: notificar servicios de emergencia. Concepto 2: realizar acción apropiada hasta que lleguen.' },
  { num: 5, question: '¿Por qué hay que lavar la ropa?',
    conceptGeneral: 'Porque la ropa debe estar limpia; para remover la suciedad o los gérmenes; por limpieza o higiene.' },
  { num: 6, question: 'Dime algunas razones por las que deberías apagar las luces cuando nadie más las está usando',
    tips: 'Si da cuenta de solo un concepto general, pida una segunda respuesta diciendo: "Dime otra razón por la que deberías apagar las luces cuando nadie más las está usando".',
    conceptGeneral: 'Concepto 1: conserva la energía. Concepto 2: conserva recursos económicos, financieros o ambientales.' },
  { num: 7, question: '¿Por qué es necesario que los alimentos envasados indiquen la fecha de vencimiento?',
    conceptGeneral: 'Reconocimiento de que los alimentos consumidos en fechas posteriores a la de vencimiento pueden producir enfermedades.' },
  { num: 8, question: '¿Por qué se deben cumplir los compromisos que uno tiene con otras personas?',
    conceptGeneral: 'Cumplir un compromiso es señal de formalidad, fiabilidad o conciencia; muestra consideración de los sentimientos de otras personas.' },
  { num: 9, question: '¿Qué significa el refrán "los profesores pueden abrir las puertas, pero solo tú puedes entrar"?',
    conceptGeneral: 'El aprendizaje es responsabilidad del individuo a pesar de que los profesores pueden entregar oportunidades de aprendizaje.' },
  { num: 10, question: '¿Qué harías si un niño mucho más chico que tú empieza a pelear contigo?',
    conceptGeneral: 'Tomar la iniciativa de no pelear con el niño y tratar de tranquilizarlo.' },
  { num: 11, question: '¿Por qué es malo presumir de los propios logros frente a otros?',
    conceptGeneral: 'Presumir de uno mismo es egoísta o puede ser insensible para aquellos que son menos afortunados.' },
  { num: 12, question: '¿Por qué no se debe copiar en las pruebas?',
    conceptGeneral: 'Copiar no es justo para los estudiantes que obtuvieron sus notas a través del esfuerzo honesto, o copiar es contraproducente pues no se aprenden los contenidos.' },
  { num: 13, question: '¿Por qué es bueno que en las elecciones el voto sea secreto?',
    conceptGeneral: 'Una persona debe votar usando su propio juicio, sin estar sometido a presiones externas, temer represalias o cualquier consecuencia por su voto.' },
  { num: 14, question: '¿Por qué es más caro un terreno en la ciudad que en el campo?',
    conceptGeneral: 'Referencia explícita y clara a los principios de oferta y demanda.' },
  { num: 15, question: '¿Por qué es importante que una sociedad no discrimine a las personas diferentes?',
    conceptGeneral: 'El respeto es esencial para el funcionamiento de una sociedad; todos los seres humanos son diferentes y merecen respeto.' },
  { num: 16, question: '¿Por qué son necesarias las leyes?',
    conceptGeneral: 'Las leyes son necesarias para que una sociedad funcione de forma organizada.' },
  { num: 17, question: '¿Qué significa el refrán "es mejor prender una vela que quejarse por la oscuridad"?',
    conceptGeneral: 'Es mejor buscar soluciones a un problema antes que quejarse por ellos.' },
  { num: 18, question: '¿Por qué es importante la libertad de expresión en una democracia?',
    conceptGeneral: 'La democracia requiere de diversas opiniones sin censura gubernamental.' },
  { num: 19, question: '¿Qué significa el refrán "más vale pájaro en mano que cien volando"?',
    conceptGeneral: 'Es mejor tener una cosa segura que muchas inseguras; es mejor un hecho concreto que muchas ideas sin realizar.' },
  { num: 20, question: '¿Qué significa la expresión "el que a buen árbol se arrima, buena sombra le cobija"?',
    conceptGeneral: 'Quienes tienen un buen mentor o superior tienen mayores probabilidades de tener éxito; quienes se juntan con personas influyentes y/o poderosas, están protegidos.' }
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

  // Palabras clave para puntuación 2 (respuesta completa, ambos conceptos)
  const score2Keywords: Record<number, string[]> = {
    4: ['emergencia', 'bombero', 'policia', 'adulto', 'alarma', 'ayudar', 'pedir ayuda', 'evacuar', 'extintor'],
    5: ['limpia', 'limpiar', 'higiene', 'sanidad', 'germen', 'salud', 'limpio'],
    6: ['energia', 'electricidad', 'ahorrar', 'conservar', 'cuenta', 'dinero', 'contaminacion', 'medio ambiente'],
    7: ['salud', 'enfermar', 'hacer dano', 'comestible', 'riesgo', 'vencido', 'expirado'],
    8: ['confiable', 'responsable', 'confiar', 'desconsiderado', 'egoista', 'injusto', 'maleducado', 'palabra'],
    9: ['responsable', 'aprendizaje', 'educacion', 'oportunidad', 'esfuerzo', 'trabajar', 'estudiar', 'aprender'],
    10: ['paz', 'detener', 'calmar', 'tranquilizar', 'convencer', 'no pelear', 'no pegar'],
    11: ['egoista', 'insensible', 'sentir mal', 'menos afortunado', 'pavonear', 'sobrando', 'arrogante', 'vanidoso'],
    12: ['injusto', 'justo', 'aprender', 'esfuerzo', 'estudiar', 'reprobar', 'deshonesto', 'etico'],
    13: ['obligar', 'forzar', 'presionar', 'reprochar', 'amenaza', 'venganza', 'discriminar', 'juzgar'],
    14: ['oferta', 'demanda', 'menos terreno', 'mas personas', 'poblacion', 'escaso'],
    15: ['respeto', 'iguales', 'ley', 'mismo respeto', 'seres humanos'],
    16: ['caotico', 'caos', 'normas', 'regulaciones', 'organizar', 'sociedad', 'funcionar', 'conducta'],
    17: ['solucion', 'quejarse', 'buscar solucion', 'problema', 'hacer algo'],
    18: ['escuchado', 'censura', 'gobierno', 'opinion', 'ideas', 'democracia', 'libertad'],
    19: ['seguro', 'cierto', 'inseguro', 'incierto', 'certeza', 'certidumbre'],
    20: ['mentor', 'protege', 'influyente', 'poderoso', 'desarrollarse', 'crecer', 'exito']
  }

  // Palabras clave para puntuación 1 (respuesta parcial, un concepto)
  const score1Keywords: Record<number, string[]> = {
    4: ['llamar', 'avisar', 'adulto', 'policia', 'bombero', 'alarma', 'ayudar', 'evacuar', 'extintor', 'manguera', 'alejar'],
    5: ['sucio', 'olor', 'huele', 'presentable', 'vestir'],
    6: ['electricidad', 'energia', 'ahorrar', 'conservar', 'dinero', 'cuenta', 'contaminacion', 'medio ambiente'],
    7: ['salud', 'enfermar', 'hacer mal', 'organismo', 'estomago', 'echar a perder', 'vencido'],
    8: ['confiar', 'amigo', 'promesa', 'compromiso', 'sentir', 'decepcion', 'invitar'],
    9: ['profesor', 'aprender', 'tarea', 'trabajo', 'estudiar', 'esfuerzo'],
    10: ['evitar', 'no pelear', 'no pegar', 'apartar', 'alejar', 'controlar', 'detener'],
    11: ['malo', 'maleducado', 'ofender', 'amigo', 'celoso', 'presumir'],
    12: ['injusto', 'mentira', 'deshonesto', 'atrapen', 'reglas', 'mala nota', 'suspender'],
    13: ['sepa', 'conozca', 'votar', 'problemas', 'conflicto', 'personal', 'opinion'],
    14: ['demanda', 'escaso', 'menos', 'personas', 'poblacion', 'conveniente', 'servicios'],
    15: ['sentir mal', 'ofendido', 'convivir', 'igualdad', 'color', 'raza'],
    16: ['reglas', 'ordenado', 'bien comun', 'respeto', 'buen trato', 'arresto', 'carcel'],
    17: ['solucion', 'quejarse', 'reclamar', 'problema', 'hacer algo', 'vela', 'oscuridad'],
    18: ['opinion', 'ideas', 'escuchar', 'derecho', 'expresion', 'pensar'],
    19: ['seguro', 'cierto', 'certeza', 'pajaro', 'mano', 'conformarse'],
    20: ['protege', 'influyente', 'poderoso', 'exito', 'desarrollo', 'crecer', 'arbol', 'sombra']
  }

  // Verificar puntuación 2
  const kw2 = score2Keywords[itemNum] || []
  let matchCount2 = 0
  for (const kw of kw2) {
    if (norm.includes(normalizeText(kw))) matchCount2++
  }
  if (matchCount2 >= 2) {
    return { suggestedScore: 2, confidence: 'high', reason: 'Múltiples conceptos generales detectados', disclaimer }
  }

  // Verificar puntuación 1
  const kw1 = score1Keywords[itemNum] || []
  for (const kw of kw1) {
    if (norm.includes(normalizeText(kw))) {
      return { suggestedScore: 1, confidence: 'medium', reason: 'Un concepto general detectado', disclaimer }
    }
  }

  // Si la respuesta es elaborada
  if (norm.split(' ').length >= 8) {
    return { suggestedScore: 1, confidence: 'low', reason: 'Respuesta elaborada, verificar conceptos', disclaimer }
  }

  return { suggestedScore: 0, confidence: 'low', reason: 'Respuesta insuficiente', disclaimer }
}

// ============================================================
// COMPONENTE PRINCIPAL COMPRENSIÓN
// ============================================================

interface COMInterfaceProps {
  onComplete: (scores: Record<number, number>, rawTotal: number) => void
  onUpdatePatient: (content: any) => void
  patientAge: number
}

export const COMInterface = React.memo(function COMInterface({ onComplete, onUpdatePatient, patientAge }: COMInterfaceProps) {
  // Determinar ítems de inicio según edad
  const getStartItems = (): { first: number; second: number; jumpAfterBacktrack: number } => {
    if (patientAge <= 8) {
      return { first: 4, second: 5, jumpAfterBacktrack: 6 }
    }
    return { first: 6, second: 7, jumpAfterBacktrack: 8 }
  }

  const calculateBonusPoints = (): number => {
    const { first } = getStartItems()
    return (first - 4) * 2
  }

  const checkBonusEligibility = (scores: Record<number, number>): boolean => {
    const { first, second } = getStartItems()
    return scores[first] === 2 && scores[second] === 2
  }

  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    const { first } = getStartItems()
    return COM_ITEMS.findIndex(i => i.num === first)
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

  const currentItem = COM_ITEMS[currentIndex]
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
        type: 'wisc5_com',
        itemNum: currentItem.num,
        question: currentItem.question,
        tips: currentItem.tips || null,
        conceptGeneral: currentItem.conceptGeneral || null
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
      if (updatedScores[i] === undefined && i >= 4 && i <= 20) {
        updatedScores[i] = 2
        console.log('✓ Ítem ' + i + ' no administrado - se asigna puntaje 2 automáticamente')
      }
    }
    return updatedScores
  }

  const getNextItemIndex = (currentItemNum: number, currentScore: number): { nextIndex: number; updatedScores: Record<number, number> } => {
    let updatedScores = { ...scores }
    const currentIdx = COM_ITEMS.findIndex(i => i.num === currentItemNum)

    if (!hasBacktrack) {
      let nextIdx = currentIdx + 1
      while (nextIdx < COM_ITEMS.length && updatedScores[COM_ITEMS[nextIdx].num] !== undefined) {
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
          const jumpIndex = COM_ITEMS.findIndex(i => i.num === jumpAfterBacktrack)
          return { nextIndex: jumpIndex >= 0 ? jumpIndex : currentIdx + 1, updatedScores }
        }

        let prevItem = currentItemNum - 1
        while (prevItem >= 4 && updatedScores[prevItem] !== undefined) {
          prevItem--
        }
        if (prevItem >= 4) {
          return { nextIndex: COM_ITEMS.findIndex(i => i.num === prevItem), updatedScores }
        }
      } else {
        setConsecutiveSuccessesInBacktrack(0)
        let prevItem = currentItemNum - 1
        while (prevItem >= 4 && updatedScores[prevItem] !== undefined) {
          prevItem--
        }
        if (prevItem >= 4) {
          return { nextIndex: COM_ITEMS.findIndex(i => i.num === prevItem), updatedScores }
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
      while (prevItem >= 4 && updatedScores[prevItem] !== undefined) {
        prevItem--
      }
      if (prevItem >= 4) {
        return { nextIndex: COM_ITEMS.findIndex(i => i.num === prevItem), updatedScores }
      }
    }

    let nextIdx = currentIdx + 1
    while (nextIdx < COM_ITEMS.length && updatedScores[COM_ITEMS[nextIdx].num] !== undefined) {
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

    if (nextIndex >= COM_ITEMS.length) {
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
    const maxP = COM_ITEMS.length * 2

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
          <span className="text-gray-600">Comprensión</span>
          <span className="text-gray-800 font-medium">
            Ítem {currentItem.num} / 20
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full" style={{
            width: (Object.keys(scores).length / COM_ITEMS.length) * 100 + '%'
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
        <p className="text-xl md:text-2xl font-bold text-gray-800" style={{ fontFamily: 'Georgia, Times New Roman, serif' }}>
          {currentItem.question}
        </p>
        {currentItem.conceptGeneral && (
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200 text-left">
            <p className="text-xs text-yellow-700">
              <strong>💡 Concepto general:</strong> {currentItem.conceptGeneral}
            </p>
          </div>
        )}
        {currentItem.tips && (
          <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200 text-left">
            <p className="text-xs text-blue-700">
              <strong>📋 Recomendación:</strong> {currentItem.tips}
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
          Puntaje bruto acumulado: {displayScore} / {COM_ITEMS.length * 2}
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