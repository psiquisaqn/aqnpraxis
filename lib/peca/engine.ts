/**
 * PsyEval / AQN Praxis — Motor PECA
 * Prueba de Evaluación de Conducta Adaptativa
 * Creada por Ps. Antonio Baeza Henríquez — Psiquis AQN
 *
 * Lógica extraída fielmente de Informes_PECA.xlsx:
 *  - 45 ítems con Factor de Sentido (FS): +0.2 o −1.0
 *  - Puntuación: respuesta × FS
 *  - 9 dimensiones adaptativas + 3 conjuntos AAMR + nivel de participación
 *  - Intensidad de apoyos: Generalizado / Extenso / Limitado /
 *    Intermitente / En buen nivel de desarrollo
 */

export const FACTOR_SENTIDO: Record<number, number> = {
  1:0.2, 2:0.2, 3:-1, 4:-1, 5:-1, 6:-1, 7:-1, 8:0.2, 9:-1, 10:0.2,
  11:0.2, 12:0.2, 13:0.2, 14:0.2, 15:0.2, 16:0.2, 17:0.2, 18:-1, 19:0.2, 20:0.2,
  21:0.2, 22:-1, 23:0.2, 24:0.2, 25:0.2, 26:-1, 27:-1, 28:-1, 29:0.2, 30:-1,
  31:-1, 32:-1, 33:-1, 34:-1, 35:-1, 36:-1, 37:0.2, 38:-1, 39:0.2, 40:0.2,
  41:0.2, 42:0.2, 43:-1, 44:0.2, 45:0.2,
}

export const DIMENSIONS: Record<string, { label: string; items: number[] }> = {
  com: { label: 'Comunicación',                  items: [1,2,3,4,5,6,7] },
  aut: { label: 'Autocuidado',                   items: [10,11,12,13,16] },
  avi: { label: 'Actividades de la Vida Diaria', items: [18,19,20,21] },
  hs:  { label: 'Habilidades Sociales',          items: [22,23,24,25,26] },
  haf: { label: 'Hab. Académicas Funcionales',   items: [27,28,29,30] },
  uco: { label: 'Uso de la Comunidad',           items: [33,34,35] },
  adi: { label: 'Autodirección',                 items: [8,9,17,31,32] },
  css: { label: 'Cuidado de Salud y Seguridad',  items: [14,15,36,37,38] },
  aor: { label: 'Ocio y Recreación',             items: [39,40,41,42,43,44,45] },
}

export const AAMR_SETS: Record<string, { label: string; dims: string[] }> = {
  conceptual: { label: 'Habilidades Conceptuales', dims: ['com','haf'] },
  social:     { label: 'Habilidades Sociales',     dims: ['hs','adi'] },
  practical:  { label: 'Habilidades Prácticas',    dims: ['aut','avi','uco','css','aor'] },
}

export type SupportIntensity = 'en_buen_nivel'|'intermitente'|'limitado'|'extenso'|'generalizado'
export type PecaResponses = Partial<Record<number, 1|2|3|4>>

export interface DimensionResult {
  code: string; label: string; rawScore: number; p2: number
  intensity: SupportIntensity; intensityLabel: string
  itemsAnswered: number; itemsTotal: number
}

export interface AamrSetResult {
  code: string; label: string; p2: number; needsSupport: boolean
  demandLabel: string; descriptionText: string
}

export interface PecaResult {
  dimensions: DimensionResult[]; aamrSets: AamrSetResult[]
  participationLevel: number; participationNeeds: boolean
  participationText: string; answeredItems: number
  totalItems: number; isComplete: boolean
}

const INTENSITY_LABELS: Record<SupportIntensity, string> = {
  en_buen_nivel: 'En buen nivel de desarrollo',
  intermitente:  'Intermitente',
  limitado:      'Limitado',
  extenso:       'Extenso',
  generalizado:  'Generalizado',
}

const AAMR_TEXTS: Record<string, {needs:string; ok:string}> = {
  conceptual: {
    needs: 'Estudiante requiere apoyos en el dominio de convenciones culturales y esquemas que le permitan aproximarse de manera equilibrada a la vida social, pues el establecimiento y mantenimiento de vínculos puede verse afectado por la deprivación del acceso a los conceptos del colectivo amplio.',
    ok:    'En buen nivel de desarrollo. Estudiante presenta un manejo adecuado de convenciones culturales y esquemas sobre la vida social que le permiten aproximarse a ella desde preceptos que contribuyen al equilibrio en la forma de vínculo y de participación.',
  },
  social: {
    needs: 'Estudiante requiere apoyos en el modo de vinculación y en la gestión de su participación en situaciones grupales o de enfrentamiento ante personas nuevas en su espacio perceptivo, pues esto puede afectar en la posibilidad de moverse activamente dentro de la trama relacional, con alto riesgo de que sus objetivos no sean soportados por el círculo social sino que dificultados por el mismo.',
    ok:    'En buen nivel de desarrollo. Estudiante maneja modos de vinculación que le permiten equilibrar la propia posición con la de otras/os, gestionar activamente la entrada y salida respecto a grupos y moverse en la trama relacional con posibilidad de conseguir objetivos previamente planteados.',
  },
  practical: {
    needs: 'Estudiante requiere apoyos en la gestión de las actividades diarias relacionadas con el mundo material, los servicios básicos y el alcance efectivo de objetivos, lo cual implica el riesgo de perjudicar la ejecución de tareas en un nivel general y, por consiguiente, un desmedro generalizado de la autonomía en lo cotidiano.',
    ok:    'En buen nivel de desarrollo. Estudiante cuenta con las habilidades necesarias para gestionar su vida diaria en la relación con el mundo material, los servicios básicos y el alcance efectivo de objetivos previamente planteados.',
  },
}

function classifyIntensity(p2: number): SupportIntensity {
  if (p2 >= 0.75) return 'en_buen_nivel'
  if (p2 >= 0.50) return 'intermitente'
  if (p2 >= 0.30) return 'limitado'
  return 'extenso'
}

export function scorePeca(responses: PecaResponses): PecaResult {
  const answeredItems = Object.keys(responses).length

  const dimensions: DimensionResult[] = Object.entries(DIMENSIONS).map(([code, dim]) => {
    const answered = dim.items.filter(i => responses[i] !== undefined)
    const rawScore = answered.reduce((sum, i) => {
      const fs = FACTOR_SENTIDO[i]
      return sum + (responses[i]! * fs)
    }, 0)
    const maxPossible = dim.items.reduce((s, i) => {
      const fs = FACTOR_SENTIDO[i]
      return s + Math.abs(fs > 0 ? 4 * fs : 1 * fs)
    }, 0)
    const p2 = Math.min(1, Math.max(0, maxPossible !== 0 ? Math.abs(rawScore) / Math.abs(maxPossible) : 0))
    const intensity = classifyIntensity(p2)
    return {
      code, label: dim.label, rawScore, p2, intensity,
      intensityLabel: INTENSITY_LABELS[intensity],
      itemsAnswered: answered.length, itemsTotal: dim.items.length,
    }
  })

  const dimMap = Object.fromEntries(dimensions.map(d => [d.code, d]))

  const aamrSets: AamrSetResult[] = Object.entries(AAMR_SETS).map(([code, set]) => {
    const setDims = set.dims.map(d => dimMap[d]).filter(Boolean)
    const avgP2 = setDims.length > 0
      ? setDims.reduce((s, d) => s + d.p2, 0) / setDims.length : 0
    const needsSupport = avgP2 < 0.6
    const texts = AAMR_TEXTS[code]
    return {
      code, label: set.label, p2: avgP2, needsSupport,
      demandLabel: needsSupport ? 'Requiriente de apoyos' : 'En buen nivel',
      descriptionText: needsSupport ? texts.needs : texts.ok,
    }
  })

  const participationLevel = dimensions.reduce((s,d) => s + d.p2, 0) / dimensions.length
  const participationNeeds = participationLevel < 0.61

  return {
    dimensions, aamrSets, participationLevel, participationNeeds,
    participationText: participationNeeds
      ? 'Estudiante requiere apoyos en la generalidad de las habilidades adaptativas necesarias para participar en la vida social (familiar/escolar/comunitaria), pues el desarrollo de ellas es insuficiente y ello se relaciona a un riesgo alto de exclusión de la participación social que puede ser decisivo en el desarrollo personal y el itinerario de vida.'
      : 'En buen nivel de desarrollo. Estudiante presenta una conducta adaptativa general que le permite desenvolverse en la vida social (familiar/escolar/comunitaria) con un nivel de autonomía esperado para su grupo de edad.',
    answeredItems, totalItems: 45, isComplete: answeredItems >= 45,
  }
}
