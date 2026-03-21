/**
 * AQN Praxis — Motor Inventario de Autoestima de Coopersmith
 * Forma Escolar (SEI — School Form), 58 ítems
 *
 * Adaptación chilena: Brinkmann, Segure & Solar (1989)
 * Universidad de Concepción. Revista Latinoamericana de Psicología.
 *
 * Puntuación:
 *   Cada ítem = 1 punto si la respuesta coincide con la clave (Igual que yo)
 *   Excepto ítem 8 (escala de mentira) y 58 (escala de mentira)
 *   Puntaje final = suma × 2  → rango 0–100
 *
 * Subescalas:
 *   General (G): 26 ítems — autoestima global
 *   Social (S):  8 ítems  — pares y amigos
 *   Hogar (H):   8 ítems  — familia
 *   Escolar (E): 8 ítems  — desempeño académico
 *   Mentira (M): 8 ítems  — validez de la prueba
 *
 * Rangos (adaptación chilena, Brinkmann et al.):
 *   ≥ 75  → Autoestima alta
 *   50–74 → Autoestima media alta
 *   25–49 → Autoestima media baja
 *   < 25  → Autoestima baja
 */

export type CooperResponse = 'igual' | 'diferente'
export type CooperResponses = Partial<Record<number, CooperResponse>>
export type CooperLevel = 'alta' | 'media_alta' | 'media_baja' | 'baja'

// Clave de corrección: valor esperado para sumar 1 punto
// 'igual' = "Igual que yo",  'diferente' = "No es como yo"
export const COOPER_KEY: Record<number, CooperResponse> = {
  1:'igual',   2:'diferente', 3:'igual',    4:'diferente', 5:'igual',
  6:'diferente',7:'igual',    8:'igual',    9:'diferente', 10:'igual',
  11:'diferente',12:'igual',  13:'diferente',14:'igual',   15:'diferente',
  16:'diferente',17:'diferente',18:'igual', 19:'diferente',20:'igual',
  21:'diferente',22:'diferente',23:'diferente',24:'igual', 25:'diferente',
  26:'igual',  27:'diferente',28:'diferente',29:'igual',   30:'diferente',
  31:'igual',  32:'diferente',33:'igual',   34:'diferente',35:'diferente',
  36:'igual',  37:'diferente',38:'igual',   39:'diferente',40:'igual',
  41:'diferente',42:'igual',  43:'diferente',44:'igual',   45:'diferente',
  46:'igual',  47:'diferente',48:'igual',   49:'diferente',50:'igual',
  51:'diferente',52:'igual',  53:'diferente',54:'igual',   55:'diferente',
  56:'igual',  57:'diferente',58:'igual',
}

// Subescalas — distribución de ítems según manual original
export const COOPER_SUBSCALES: Record<string, { label: string; items: number[] }> = {
  general: {
    label: 'General',
    items: [1,2,3,8,9,10,15,16,17,22,23,24,29,30,31,36,37,38,43,44,45,50,51,52,57,58],
  },
  social: {
    label: 'Social — Pares',
    items: [4,5,11,12,18,19,25,26,32,33,39,40,46,47,53,54],
  },
  hogar: {
    label: 'Hogar — Padres',
    items: [6,7,13,14,20,21,27,28,34,35,41,42,48,49,55,56],
  },
  escolar: {
    label: 'Escolar',
    items: [16,17,18,19,20,21,22,23],
  },
  mentira: {
    label: 'Escala de mentira',
    items: [8,16,24,32,40,48,56,58],
  },
}

export interface CooperSubscaleResult {
  code: string
  label: string
  rawScore: number
  scaledScore: number   // × 2
  maxScaled: number
  pct: number
}

export interface CooperResult {
  totalRaw: number
  totalScaled: number    // ×2, rango 0–100
  level: CooperLevel
  levelLabel: string
  levelDescription: string
  levelColor: string
  subscales: CooperSubscaleResult[]
  lieScaleRaw: number
  lieScaleInvalid: boolean  // ≥ 5 en escala mentira = posible sesgo
  answeredItems: number
  totalItems: 58
  isComplete: boolean
}

const LEVELS: Array<{ min: number; level: CooperLevel; label: string; color: string; description: string }> = [
  { min: 75, level: 'alta',       label: 'Autoestima alta',      color: '#3B6D11',
    description: 'El evaluado presenta una autoestima alta, con una visión positiva de sí mismo en los distintos ámbitos evaluados. Reconoce sus capacidades y se valora adecuadamente en el contexto familiar, social y escolar.' },
  { min: 50, level: 'media_alta', label: 'Autoestima media alta', color: '#639922',
    description: 'El evaluado presenta una autoestima media alta. Tiene una valoración generalmente positiva de sí mismo con algunas áreas de incertidumbre. Este nivel es funcional y no requiere intervención específica.' },
  { min: 25, level: 'media_baja', label: 'Autoestima media baja', color: '#854F0B',
    description: 'El evaluado presenta una autoestima media baja. Existen áreas en las que su autovaloración es insuficiente, lo que puede afectar su desenvolvimiento académico y social. Se recomienda considerar intervención de apoyo.' },
  { min: 0,  level: 'baja',       label: 'Autoestima baja',      color: '#A32D2D',
    description: 'El evaluado presenta una autoestima baja. Hay una percepción negativa de sí mismo en múltiples ámbitos. Se recomienda intervención psicológica orientada al desarrollo de autoconcepto positivo.' },
]

export function scoreCoopersmith(responses: CooperResponses): CooperResult {
  const answered = Object.keys(responses).map(Number)

  // Puntaje general: suma de respuestas que coinciden con la clave
  // excluye ítems de escala de mentira para el total
  const lieItems = new Set(COOPER_SUBSCALES.mentira.items)
  let totalRaw = 0
  let lieRaw   = 0

  answered.forEach(i => {
    const correct = responses[i] === COOPER_KEY[i] ? 1 : 0
    if (lieItems.has(i)) { lieRaw += correct }
    else                 { totalRaw += correct }
  })

  const totalScaled = Math.min(100, totalRaw * 2)
  const level = LEVELS.find(l => totalScaled >= l.min) ?? LEVELS[3]

  // Subescalas
  const subscales: CooperSubscaleResult[] = Object.entries(COOPER_SUBSCALES)
    .filter(([code]) => code !== 'mentira')
    .map(([code, sub]) => {
      const raw = sub.items
        .filter(i => responses[i] !== undefined)
        .reduce((s, i) => s + (responses[i] === COOPER_KEY[i] ? 1 : 0), 0)
      const maxRaw    = sub.items.length
      const scaled    = Math.min(maxRaw * 2, raw * 2)
      const maxScaled = maxRaw * 2
      return { code, label: sub.label, rawScore: raw, scaledScore: scaled, maxScaled, pct: maxScaled > 0 ? scaled / maxScaled : 0 }
    })

  return {
    totalRaw,
    totalScaled,
    level:             level.level,
    levelLabel:        level.label,
    levelDescription:  level.description,
    levelColor:        level.color,
    subscales,
    lieScaleRaw:       lieRaw,
    lieScaleInvalid:   lieRaw >= 5,
    answeredItems:     answered.length,
    totalItems:        58,
    isComplete:        answered.length === 58,
  }
}

export const COOPERSMITH_ITEMS: Array<{ num: number; text: string }> = [
  {num:1,  text:'Paso mucho tiempo soñando despierto/a'},
  {num:2,  text:'Estoy seguro/a de mí mismo/a'},
  {num:3,  text:'Deseo frecuentemente ser otra persona'},
  {num:4,  text:'Soy simpático/a'},
  {num:5,  text:'Mis padres y yo nos divertimos mucho juntos'},
  {num:6,  text:'Nunca me preocupo por nada'},
  {num:7,  text:'Me da vergüenza pararme frente al curso para hablar'},
  {num:8,  text:'Desearía ser más joven'},
  {num:9,  text:'Hay muchas cosas de mí mismo/a que cambiaría si pudiera'},
  {num:10, text:'Puedo tomar decisiones fácilmente'},
  {num:11, text:'Mis amigos disfrutan cuando están conmigo'},
  {num:12, text:'Me incomodo en casa fácilmente'},
  {num:13, text:'Siempre hago lo correcto'},
  {num:14, text:'Me siento orgulloso/a de mi trabajo (en el colegio)'},
  {num:15, text:'Tengo siempre que tener a alguien que me diga lo que tengo que hacer'},
  {num:16, text:'Me toma mucho tiempo acostumbrarme a cosas nuevas'},
  {num:17, text:'Frecuentemente me arrepiento de las cosas que hago'},
  {num:18, text:'Soy popular entre mis compañeros/as de mi misma edad'},
  {num:19, text:'Usualmente mis padres consideran mis sentimientos'},
  {num:20, text:'Nunca estoy triste'},
  {num:21, text:'Estoy haciendo el mejor trabajo que puedo'},
  {num:22, text:'Me doy por vencido/a fácilmente'},
  {num:23, text:'Usualmente puedo cuidarme a mí mismo/a'},
  {num:24, text:'Me siento suficientemente feliz'},
  {num:25, text:'Preferiría jugar con niños/as menores que yo'},
  {num:26, text:'Mis padres me exigen demasiado'},
  {num:27, text:'Me gustan todas las personas que conozco'},
  {num:28, text:'Me gusta que el profesor me interrogue en clases'},
  {num:29, text:'Me entiendo a mí mismo/a'},
  {num:30, text:'Me cuesta comportarme como en realidad soy'},
  {num:31, text:'Las cosas en mi vida están muy complicadas'},
  {num:32, text:'Los demás (niños/as) casi siempre siguen mis ideas'},
  {num:33, text:'Nadie me presta mucha atención en casa'},
  {num:34, text:'Nunca me reprenden'},
  {num:35, text:'No estoy progresando en el colegio como me gustaría'},
  {num:36, text:'Puedo tomar decisiones y cumplirlas'},
  {num:37, text:'Realmente no me gusta ser un muchacho/a'},
  {num:38, text:'Tengo una mala opinión de mí mismo/a'},
  {num:39, text:'No me gusta estar con otra gente'},
  {num:40, text:'Muchas veces me gustaría irme de casa'},
  {num:41, text:'Nunca soy tímido/a'},
  {num:42, text:'Frecuentemente me incomoda el colegio'},
  {num:43, text:'Frecuentemente me avergüenzo de mí mismo/a'},
  {num:44, text:'No soy tan bien parecido/a como otra gente'},
  {num:45, text:'Si tengo algo que decir, usualmente lo digo'},
  {num:46, text:'A los demás «les da» conmigo frecuentemente'},
  {num:47, text:'Mis padres me entienden'},
  {num:48, text:'Siempre digo la verdad'},
  {num:49, text:'Mi profesor/a me hace sentir que no soy gran cosa'},
  {num:50, text:'A mí no me importa lo que me pasa'},
  {num:51, text:'Soy un fracaso'},
  {num:52, text:'Me incomodo fácilmente cuando me reprenden'},
  {num:53, text:'Las otras personas son más agradables que yo'},
  {num:54, text:'Usualmente siento que mis padres esperan más de mí'},
  {num:55, text:'Siempre sé qué decir a otras personas'},
  {num:56, text:'Frecuentemente me siento desilusionado/a en el colegio'},
  {num:57, text:'Generalmente las cosas no me importan'},
  {num:58, text:'No soy una persona confiable para que otros dependan de mí'},
]
