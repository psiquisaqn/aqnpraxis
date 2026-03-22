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

// ─── Ítems para el cuestionario (leftPhrase / rightPhrase) ──────────
export const PECA_ITEMS: Array<{
  num: number
  leftPhrase: string
  rightPhrase: string
}> = [
  { num:1,  leftPhrase:'Usa oraciones completas al hablar',           rightPhrase:'Le cuesta expresarse con oraciones' },
  { num:2,  leftPhrase:'Sigue instrucciones de varios pasos',         rightPhrase:'Solo sigue instrucciones simples' },
  { num:3,  leftPhrase:'Interrumpe conversaciones frecuentemente',    rightPhrase:'Escucha antes de hablar' },
  { num:4,  leftPhrase:'Habla de manera inapropiada en público',      rightPhrase:'Adapta su lenguaje al contexto' },
  { num:5,  leftPhrase:'Tiene problemas para comunicarse',            rightPhrase:'Se comunica con facilidad' },
  { num:6,  leftPhrase:'No comprende chistes ni ironías',             rightPhrase:'Entiende el lenguaje figurado' },
  { num:7,  leftPhrase:'Dice cosas ofensivas sin darse cuenta',       rightPhrase:'Considera el impacto de sus palabras' },
  { num:8,  leftPhrase:'Se viste solo/a sin ayuda',                   rightPhrase:'Necesita ayuda para vestirse' },
  { num:9,  leftPhrase:'Tiene dificultades con su higiene personal',  rightPhrase:'Mantiene buena higiene personal' },
  { num:10, leftPhrase:'Puede prepararse alimentos simples',          rightPhrase:'No puede preparar alimentos solo/a' },
  { num:11, leftPhrase:'Cuida sus pertenencias',                      rightPhrase:'Pierde u olvida sus cosas' },
  { num:12, leftPhrase:'Reconoce cuando necesita ayuda médica',       rightPhrase:'No identifica cuándo necesita atención médica' },
  { num:13, leftPhrase:'Mantiene orden en su espacio personal',       rightPhrase:'Su espacio personal está desorganizado' },
  { num:14, leftPhrase:'Maneja su tiempo con eficacia',               rightPhrase:'Tiene dificultades para manejar su tiempo' },
  { num:15, leftPhrase:'Puede usar transporte público solo/a',        rightPhrase:'Necesita acompañamiento para transportarse' },
  { num:16, leftPhrase:'Realiza las tareas del hogar asignadas',      rightPhrase:'Evita o no cumple tareas del hogar' },
  { num:17, leftPhrase:'Organiza sus materiales escolares',           rightPhrase:'Pierde u olvida materiales escolares' },
  { num:18, leftPhrase:'Habla mal de otros a sus espaldas',           rightPhrase:'Mantiene confidencialidad con sus pares' },
  { num:19, leftPhrase:'Inicia conversaciones con otros',             rightPhrase:'Espera que otros inicien conversación' },
  { num:20, leftPhrase:'Sabe pedir disculpas cuando se equivoca',     rightPhrase:'Le cuesta reconocer sus errores' },
  { num:21, leftPhrase:'Ayuda a otros cuando lo necesitan',           rightPhrase:'Generalmente no ofrece ayuda' },
  { num:22, leftPhrase:'Reacciona agresivamente ante conflictos',     rightPhrase:'Resuelve conflictos de forma pacífica' },
  { num:23, leftPhrase:'Respeta las normas grupales',                 rightPhrase:'Desafía las normas del grupo' },
  { num:24, leftPhrase:'Mantiene amistades duraderas',                rightPhrase:'Sus amistades son breves o superficiales' },
  { num:25, leftPhrase:'Participa activamente en grupos',             rightPhrase:'Se aísla o evita participar en grupos' },
  { num:26, leftPhrase:'Copia las respuestas de otros en evaluaciones', rightPhrase:'Trabaja de forma independiente en evaluaciones' },
  { num:27, leftPhrase:'Lee con comprensión para su nivel',           rightPhrase:'Tiene dificultades de comprensión lectora' },
  { num:28, leftPhrase:'Resuelve problemas matemáticos básicos',      rightPhrase:'No resuelve operaciones básicas' },
  { num:29, leftPhrase:'Entiende el valor del dinero',                rightPhrase:'No comprende el valor del dinero' },
  { num:30, leftPhrase:'Tiene dificultades para escribir',            rightPhrase:'Escribe con fluidez para su nivel' },
  { num:31, leftPhrase:'Identifica riesgos en su entorno',            rightPhrase:'No identifica situaciones de riesgo' },
  { num:32, leftPhrase:'No pide permiso antes de tomar decisiones',   rightPhrase:'Consulta antes de tomar decisiones importantes' },
  { num:33, leftPhrase:'Sabe cómo actuar en una emergencia',          rightPhrase:'No sabe qué hacer en una emergencia' },
  { num:34, leftPhrase:'No respeta semáforos ni señales de tránsito', rightPhrase:'Respeta las normas de tránsito' },
  { num:35, leftPhrase:'Se pierde en lugares nuevos',                 rightPhrase:'Se orienta bien en lugares desconocidos' },
  { num:36, leftPhrase:'Usa servicios de la comunidad (banco, farmacia)', rightPhrase:'No sabe usar servicios de la comunidad' },
  { num:37, leftPhrase:'Planifica actividades con anticipación',      rightPhrase:'Actúa sin planificación previa' },
  { num:38, leftPhrase:'Se distrae con facilidad durante actividades', rightPhrase:'Se concentra bien en las actividades' },
  { num:39, leftPhrase:'Participa en actividades de ocio',            rightPhrase:'No participa en actividades recreativas' },
  { num:40, leftPhrase:'Tiene hobbies o intereses definidos',         rightPhrase:'No tiene intereses o hobbies claros' },
  { num:41, leftPhrase:'Disfruta actividades con otros',              rightPhrase:'Prefiere estar solo/a siempre' },
  { num:42, leftPhrase:'Elige libremente sus actividades recreativas', rightPhrase:'Espera que le digan qué hacer en su tiempo libre' },
  { num:43, leftPhrase:'Sus actividades recreativas son siempre las mismas', rightPhrase:'Varía sus actividades de ocio' },
  { num:44, leftPhrase:'Usa tecnología para entretenerse adecuadamente', rightPhrase:'No sabe usar tecnología para el ocio' },
  { num:45, leftPhrase:'Regula el tiempo dedicado al ocio',           rightPhrase:'No regula cuánto tiempo dedica al ocio' },
]

// ─── Validación de respuestas ────────────────────────────────────────
export function validatePecaResponses(responses: Record<number, number>): {
  valid: boolean
  missing: number[]
  invalid: number[]
} {
  const allItems = Array.from({ length: 45 }, (_, i) => i + 1)
  const missing = allItems.filter((i) => responses[i] === undefined)
  const invalid = Object.entries(responses)
    .filter(([, v]) => v < 1 || v > 4 || !Number.isInteger(v))
    .map(([k]) => Number(k))
  return { valid: missing.length === 0 && invalid.length === 0, missing, invalid }
}
