// lib/activities/all-sessions.ts
// AQN Praxis — PDPI, TP‑CREM y POSMAN
// Basado en el material de Ps. Juan Francisco Sotomayor Julio (Psiquis AQN)
// Última actualización: agosto 2026

export interface PdpiActivity {
  step: string          // "a" | "b" | "c" | "d" | "e"
  label: string         // Título corto para el panel
  instruction: string   // Texto completo para pantalla del evaluado
  display?: {
    type: 'text' | 'image_prompt' | 'breathing_timer' | 'hands_guide' | 'meditation'
    content: string
    duration_sec?: number
  }
  psychologist_note?: string
}

export interface PdpiSession {
  id: number
  area: string
  element: string
  objective: string
  activities: PdpiActivity[]
  achievement_domains: string[]
  completed_by_aqn?: boolean
}

export const ACHIEVEMENT_SCALE = [
  { level: 1, label: 'No lo logra', description: 'El participante no alcanza el objetivo de la actividad ni con ayuda del facilitador.', color: '#A32D2D' },
  { level: 2, label: 'Logros mínimos con ayuda', description: 'Alcanza el objetivo mínimo únicamente con apoyo directo del facilitador.', color: '#993C1D' },
  { level: 3, label: 'Mínimos sin ayuda / moderados con ayuda', description: 'Logra mínimos de forma autónoma; moderados solo con apoyo.', color: '#854F0B' },
  { level: 4, label: 'Moderados sin ayuda / suficientes con ayuda', description: 'Logra moderados de forma autónoma; suficientes solo con apoyo.', color: '#5A7A0A' },
  { level: 5, label: 'Suficientes sin ayuda / sobresalientes con ayuda', description: 'Logra suficientes de forma autónoma; sobresalientes con apoyo.', color: '#3B6D11' },
  { level: 6, label: 'Logros sobresalientes sin ayuda', description: 'Supera los objetivos de forma completamente autónoma y muestra comprensión profunda.', color: '#0F6E56' },
]

// ====================================================================
//  PDPI – SESIONES 0–40 (extraídas y estructuradas desde el CSV)
// ====================================================================

const PDPI_SESSIONS_0_40: PdpiSession[] = [
  // ── 0 ────────────────────────────────────────────────────────────────
  {
    id: 0,
    area: 'Contextualización, Introducción, Presentación',
    element: 'Recepción, Bienvenida, Presentación Orador/es',
    objective: 'Establecer vínculo con la audiencia, motivar interés por el curso y el espacio.',
    completed_by_aqn: false,
    activities: [
      {
        step: 'a',
        label: 'TP-CREM',
        instruction: 'Realiza 3 respiraciones conscientes completas. Inhala por la nariz, exhala por la nariz. Enfoca tu atención únicamente en el movimiento de tu respiración.',
        display: { type: 'breathing_timer', content: 'Respiración consciente — 3 ciclos', duration_sec: 60 }
      },
      {
        step: 'b',
        label: 'POSMAN',
        instruction: 'Pauta de ejercicios POSMAN: digitación cruzada y frotación de manos. Realiza cada movimiento con atención plena.',
        display: { type: 'hands_guide', content: 'POSMAN — activación inicial' }
      },
      {
        step: 'c',
        label: 'Observación y presencia',
        instruction: 'Observa tus pies, tu calzado, tu vestimenta, los objetos que traes (bolso, mochila, celular). Siente tus límites corporales y el espacio que ocupas. Luego observa tus antebrazos, tus manos, y recorre sus detalles mientras cuentas hasta 20.',
        display: { type: 'text', content: 'Observa con detenimiento: tus pies, tu ropa, tus manos. ¿Dónde está tu ser que observa?' },
        psychologist_note: 'Guiar la atención desde lo externo hacia lo corporal. Crear un ambiente de presencia.'
      },
      {
        step: 'd',
        label: 'Cierre',
        instruction: 'Comparte con el grupo una palabra que describa cómo te sientes ahora.',
        psychologist_note: 'Registro de estado emocional inicial.'
      }
    ],
    achievement_domains: ['Capacidad de observación', 'Atención a detalles', 'Expresión emocional']
  },

  // ── 1 ────────────────────────────────────────────────────────────────
  {
    id: 1,
    area: 'Contextualización',
    element: 'La familia — El hogar',
    objective: 'Reconocer los diferentes tipos de familia. Ideas de asociación y agrupación. Categorización.',
    completed_by_aqn: false,
    activities: [
      {
        step: 'a',
        label: 'TP-CREM',
        instruction: 'Respiración consciente con conteo hasta 3. Postura sentada, espalda recta, manos sobre rodillas. Inhala y exhala por la nariz.',
        display: { type: 'breathing_timer', content: 'Respiración + conteo 1-3', duration_sec: 45 }
      },
      {
        step: 'b',
        label: 'POSMAN',
        instruction: 'Digitación cruzada: cada dedo de una mano toca los de la opuesta. Realiza la secuencia completa con atención plena.',
        display: { type: 'hands_guide', content: 'POSMAN — digitación cruzada' }
      },
      {
        step: 'c',
        label: 'Tipos de familia',
        instruction: 'El psicólogo presenta el origen de la palabra "familia", los tipos de familia (imágenes), el porqué y para qué de la familia, el apego en la infancia y ejemplos de sociedades sin familia. Reflexiona: ¿Qué es para ti una familia?',
        display: { type: 'image_prompt', content: 'Imágenes de distintos tipos de familia. Luego dibuja tu concepto de "familia".' },
        psychologist_note: 'Usar imágenes variadas para estimular la reflexión. Enfatizar la diversidad y el afecto.'
      },
      {
        step: 'd',
        label: 'Actividad 1: Dibujo e historia',
        instruction: 'Dibuja una agrupación de objetos inanimados en un contexto. En la parte posterior escribe una historia de esa situación y elige uno de los objetos con el que te identifiques.',
        display: { type: 'text', content: 'Dibuja una escena con objetos. Luego escribe una historia y elige un objeto que te represente.' }
      },
      {
        step: 'e',
        label: 'Actividad 2: Familia animal',
        instruction: 'Dibuja una familia de animales (puede ser el animal que elegiste en la sesión 0). Escribe una historia y elige un integrante con el que te identifiques.',
        display: { type: 'text', content: 'Dibuja una familia de animales. Escribe una historia y elige uno que te represente.' }
      }
    ],
    achievement_domains: ['Reconoce tipos de familia', 'Asocia conceptos de agrupación', 'Expresa identificación personal']
  },

  // ── 2 ────────────────────────────────────────────────────────────────
  {
    id: 2,
    area: 'Contextualización — Enfoque ecológico',
    element: 'Mi familia — Mi hogar',
    objective: 'Generar instancia para conocer realidades de los otros. Aprender a estructurar el pensamiento y un discurso organizado.',
    completed_by_aqn: false,
    activities: [
      {
        step: 'a',
        label: 'TP-CREM',
        instruction: 'Respiración consciente con conteo hasta 5. Postura sentada, ojos cerrados, manos sobre el abdomen.',
        display: { type: 'breathing_timer', content: 'Respiración + conteo 1-5', duration_sec: 75 }
      },
      {
        step: 'b',
        label: 'POSMAN',
        instruction: 'Frotación de manos y digitación cruzada con ojos cerrados.',
        display: { type: 'hands_guide', content: 'POSMAN — frotación + digitación, ojos cerrados' }
      },
      {
        step: 'c',
        label: 'Laberinto "La Familia"',
        instruction: 'Resuelve el laberinto proyectado primero con la mirada (sin lápiz). Luego resuélvelo en la hoja. Voltea la hoja y dibuja "Mi familia" (quienes viven y no viven contigo) y tu casa.',
        display: { type: 'image_prompt', content: 'Laberinto "La Familia". Primero con la mirada, luego con lápiz.' },
        psychologist_note: 'Activar atención visual y motora. El dibujo de la familia permite expresar la composición real.'
      },
      {
        step: 'd',
        label: 'Estructuración de la presentación',
        instruction: 'En la parte inferior de la hoja escribe: parentesco, nombre, apellido, edad de cada miembro; actividades que realizan; momentos de convivencia; con quién te llevas mejor y con quién compartes menos. Usa este esquema para organizar tu pensamiento.',
        display: { type: 'text', content: 'Esquema de presentación familiar: Parentesco – Nombre – Edad – Actividades – Convivencias – Relaciones.' },
        psychologist_note: 'Ayudar a estructurar módulos. Anotar palabras nuevas para ampliar vocabulario.'
      }
    ],
    achievement_domains: ['Estructura pensamiento en módulos', 'Describe composición familiar', 'Usa vocabulario ampliado']
  },

  // ── 3 ────────────────────────────────────────────────────────────────
  {
    id: 3,
    area: 'Contextualización — Presentación',
    element: 'Presentación de su familia',
    objective: 'Generar instancia para conocer realidades de los otros. Aprender a estructurar el pensamiento y un discurso organizado.',
    completed_by_aqn: false,
    activities: [
      {
        step: 'a',
        label: 'TP-CREM',
        instruction: 'Respiración consciente con conteo hasta 7. Postura sentada, manos sobre rodillas, espalda recta.',
        display: { type: 'breathing_timer', content: 'Respiración + conteo 1-7', duration_sec: 90 }
      },
      {
        step: 'b',
        label: 'POSMAN',
        instruction: 'Ejercicios de independencia dactilar: encoger y extender alternadamente cada dedo de ambas manos.',
        display: { type: 'hands_guide', content: 'POSMAN — independencia dactilar' }
      },
      {
        step: 'c',
        label: 'Presentación oral',
        instruction: 'Cada participante presenta a su familia usando el esquema de la sesión anterior. El grupo escucha atentamente.',
        psychologist_note: 'Fomentar la escucha activa. Asegurar que todos tengan oportunidad de hablar.'
      },
      {
        step: 'd',
        label: 'Evocación de recuerdo',
        instruction: 'Cierra los ojos o cúbrelos. Escucha la música y evoca un recuerdo positivo y significativo junto a tu familia (vacaciones, celebración, momento feliz).',
        display: { type: 'meditation', content: 'Evoca un recuerdo feliz en familia.', duration_sec: 120 },
        psychologist_note: 'Usar música suave para facilitar la evocación. Respetar el silencio.'
      }
    ],
    achievement_domains: ['Expone con organización', 'Escucha activa', 'Evoca y comparte recuerdo significativo']
  },

  // ── 4 ────────────────────────────────────────────────────────────────
  {
    id: 4,
    area: 'Contextualización — Presentación',
    element: 'Escultura "La Familia"',
    objective: 'Elaborar una escultura con material moldeable (greda, cerámica) y otros elementos que prefiera.',
    completed_by_aqn: false,
    activities: [
      {
        step: 'a',
        label: 'TP-CREM',
        instruction: 'Respiración consciente con conexión emocional (E9). Inhala profundo y pregúntate: ¿qué siento en este momento? Exhala y observa tus emociones sin juzgarlas.',
        display: { type: 'breathing_timer', content: 'Respiración + conexión emocional', duration_sec: 90 }
      },
      {
        step: 'b',
        label: 'POSMAN',
        instruction: 'Pauta completa de POSMAN: frotación, digitación, trenzado.',
        display: { type: 'hands_guide', content: 'POSMAN — secuencia completa' }
      },
      {
        step: 'c',
        label: 'Creación escultórica',
        instruction: 'Con greda o cerámica, modela una obra que represente a tu familia o algún elemento significativo de ella. Puedes incluir objetos, fotos o símbolos. Dale un nombre a tu obra.',
        display: { type: 'text', content: 'Crea una escultura que represente a tu familia. Nombra tu obra.' },
        psychologist_note: 'Observar el proceso creativo y los temas que emergen. No corregir, solo acompañar.'
      }
    ],
    achievement_domains: ['Expresión artística', 'Simbolización familiar', 'Creatividad']
  },

  // ── 5 ────────────────────────────────────────────────────────────────
  {
    id: 5,
    area: 'Contextualización — Presentación',
    element: 'Presentación de la escultura',
    objective: 'Ensayar presentación con todos los apoyos que se requieran.',
    completed_by_aqn: false,
    activities: [
      {
        step: 'a',
        label: 'TP-CREM',
        instruction: 'Respiración consciente con conteo hasta 10 en ciclo ascendente y descendente. Postura sentada, manos sobre el ombligo.',
        display: { type: 'breathing_timer', content: 'Ciclo respiratorio 1→10→1', duration_sec: 150 }
      },
      {
        step: 'b',
        label: 'POSMAN',
        instruction: 'Digitación cruzada aumentando velocidad en cada ciclo (3 ciclos).',
        display: { type: 'hands_guide', content: 'POSMAN — velocidad progresiva' }
      },
      {
        step: 'c',
        label: 'Ensayo de presentación',
        instruction: 'En grupos pequeños, cada uno presenta su escultura y explica su significado. El grupo ofrece retroalimentación constructiva.',
        psychologist_note: 'Preparar para la presentación final al grupo ampliado.'
      },
      {
        step: 'd',
        label: 'Cierre con sorpresa',
        instruction: 'Se realiza un encuentro con un personaje significativo de su familia (modo sorpresa). Incluye un cofre con una carta que contenga un mensaje sobre lo familiar. Se escucha el Réquiem de Mozart.',
        display: { type: 'meditation', content: 'Cierre con música y carta sorpresa.', duration_sec: 180 },
        psychologist_note: 'Crear un momento emotivo y significativo para sellar la etapa.'
      }
    ],
    achievement_domains: ['Comunica significado de la obra', 'Acepta retroalimentación', 'Participa en cierre emotivo']
  },

  // ── 6 ────────────────────────────────────────────────────────────────
  {
    id: 6,
    area: 'Autoconocimiento — Inteligencia intrapersonal',
    element: 'Mandala personal',
    objective: 'Focalizar atención y conocerse a sí mismo.',
    completed_by_aqn: false,
    activities: [
      {
        step: 'a',
        label: 'TP-CREM',
        instruction: 'Respiración consciente con mirada interior (E5). Cierra los ojos y observa tu oscuridad visual.',
        display: { type: 'meditation', content: 'Cierra los ojos, observa tu interior.', duration_sec: 60 }
      },
      {
        step: 'b',
        label: 'POSMAN',
        instruction: 'Frotación de manos palma con palma y dorso con dorso.',
        display: { type: 'hands_guide', content: 'POSMAN — frotación bilateral' }
      },
      {
        step: 'c',
        label: 'Creación de mandala',
        instruction: 'Diseña un mandala que incluya elementos que te identifiquen (familia, gustos, valores, sueños). Usa colores y formas simbólicas.',
        display: { type: 'image_prompt', content: 'Crea tu mandala personal con símbolos significativos.' },
        psychologist_note: 'El mandala es una herramienta de autoconocimiento. Observar elecciones de color y forma.'
      }
    ],
    achievement_domains: ['Autorreflexión', 'Simbolización personal', 'Creatividad']
  },

  // ── 7 ────────────────────────────────────────────────────────────────
  {
    id: 7,
    area: 'Autoconocimiento — Inteligencia intrapersonal',
    element: 'Características de la personalidad — Comparaciones',
    objective: 'Conocernos mejor y generar un clima de confianza para expresarse.',
    completed_by_aqn: false,
    activities: [
      {
        step: 'a',
        label: 'TP-CREM',
        instruction: 'Respiración consciente con conexión sensorial (E6). Pon atención a la sensación del aire en tus fosas nasales.',
        display: { type: 'breathing_timer', content: 'Atención a la sensación nasal', duration_sec: 60 }
      },
      {
        step: 'b',
        label: 'POSMAN',
        instruction: 'Digitación cruzada y frotación con ojos cerrados.',
        display: { type: 'hands_guide', content: 'POSMAN — digitación + frotación' }
      },
      {
        step: 'c',
        label: 'Si yo fuera…',
        instruction: 'Responde en silencio: Si yo fuera un animal, ¿cuál sería? Luego dibuja el animal sin mostrarlo. El psicólogo recoge los dibujos y cada uno, mediante mímica, representa el dibujo que le tocó. El autor del dibujo expresa 3-5 características positivas de su animal elegido.',
        display: { type: 'text', content: 'Si yo fuera un animal… Dibuja y luego adivina el de los demás.' },
        psychologist_note: 'Repetir con fruta, país, medio de transporte, árbol, estación, comida, bebida. La suma de respuestas es un perfil de personalidad.'
      },
      {
        step: 'd',
        label: 'Reflexión',
        instruction: '¿Qué tienen en común tus respuestas? ¿Se parecen a cómo eres realmente? ¿Se parecen a alguien que conozcas?',
        psychologist_note: 'Guiar hacia la metacognición sobre la propia identidad.'
      }
    ],
    achievement_domains: ['Autopercepción', 'Creatividad metafórica', 'Expresión oral', 'Reflexión sobre identidad']
  },

  // ── 8 ────────────────────────────────────────────────────────────────
  {
    id: 8,
    area: 'Autoconocimiento — Inteligencia intrapersonal',
    element: 'Preferencias',
    objective: 'Conocernos mejor y generar un clima de confianza para expresarse.',
    completed_by_aqn: false,
    activities: [
      {
        step: 'a',
        label: 'TP-CREM',
        instruction: 'Respiración consciente con conexión auditiva (E7). Escucha el sonido de tu respiración. Cuenta 5 ciclos.',
        display: { type: 'breathing_timer', content: 'Escucha el sonido de tu respiración', duration_sec: 60 }
      },
      {
        step: 'b',
        label: 'POSMAN',
        instruction: 'Frotación simultánea palma con palma circular hacia adelante y luego hacia atrás.',
        display: { type: 'hands_guide', content: 'POSMAN — frotación circular bilateral' }
      },
      {
        step: 'c',
        label: 'Juego situacional — 25 preguntas',
        instruction: 'Se realizan 25 preguntas de tipo "¿Qué prefieres?" con 4 alternativas. Fundamenta cada respuesta y comparte los motivos con el grupo.',
        display: { type: 'text', content: '¿Qué prefieres? Elige y explica por qué.' },
        psychologist_note: 'Preguntas variadas: "¿Qué prefieres, playa o montaña? ¿Libro o película? ¿Perro o gato?"'
      }
    ],
    achievement_domains: ['Expresa preferencias', 'Argumenta decisiones', 'Escucha a los demás']
  },

  // ── 9 ────────────────────────────────────────────────────────────────
  {
    id: 9,
    area: 'Inteligencia corporal kinestésica',
    element: 'Silencio, dirigir atención, autoobservación',
    objective: 'Generar noción del sí mismo y definir parámetros claros de autoobservación y autoconocimiento.',
    completed_by_aqn: false,
    activities: [
      {
        step: 'a',
        label: 'TP-CREM',
        instruction: 'Respiración consciente. Cuenta 10 respiraciones, enfocándote en cada detalle del proceso: inhalación, exhalación, pausa.',
        display: { type: 'breathing_timer', content: 'Conteo de 10 respiraciones', duration_sec: 120 }
      },
      {
        step: 'b',
        label: 'POSMAN',
        instruction: 'Pauta de activación con énfasis en la sensación táctil de cada movimiento.',
        display: { type: 'hands_guide', content: 'POSMAN — atención plena táctil' }
      },
      {
        step: 'c',
        label: 'Registro de signos vitales',
        instruction: 'Registra en una tabla: número de respiraciones por minuto, latidos del corazón, temperatura corporal, sensación de equilibrio y cualquier dolor o malestar.',
        display: { type: 'text', content: 'Tabla de signos vitales: respiración, pulso, temperatura, equilibrio, molestias.' },
        psychologist_note: 'Introducir el concepto de autoobservación sistemática.'
      },
      {
        step: 'd',
        label: 'Juego de mímica',
        instruction: 'Cada uno saca un papelito con un elemento (animal, comida, músico, película). Solo puede usar palabras escritas para expresarlo, sin hablar. Los demás adivinan.',
        psychologist_note: 'Fomentar la comunicación no verbal y la creatividad.'
      }
    ],
    achievement_domains: ['Autoobservación', 'Registro sistemático', 'Comunicación no verbal']
  },

  // ── 10 ───────────────────────────────────────────────────────────────
  {
    id: 10,
    area: 'Inteligencia corporal kinestésica',
    element: 'Respiración y atención',
    objective: 'Contar, controlar, dirigir atención hacia la respiración y otros signos vitales.',
    completed_by_aqn: false,
    activities: [
      {
        step: 'a',
        label: 'TP-CREM',
        instruction: 'Respiración consciente con conteo rítmico. Inhala 3 tiempos, sostén 12, exhala 6. Repite 3 veces.',
        display: { type: 'breathing_timer', content: 'Ritmo 3-12-6', duration_sec: 90 }
      },
      {
        step: 'b',
        label: 'POSMAN',
        instruction: 'Ejercicios de independencia dactilar con conteo. Cada dedo se mueve al ritmo de una respiración.',
        display: { type: 'hands_guide', content: 'POSMAN — ritmo dactilar' }
      },
      {
        step: 'c',
        label: 'Juegos con la respiración',
        instruction: 'Competencia: inflar globos y soplar aviones de papel. Luego, en grupo, enumeren todos los usos del acto de soplar (enfriar comida, secar pegamento, encender fuego, defenderte de un insecto, etc.).',
        display: { type: 'text', content: 'Infla globos, sopla aviones. Piensa en todos los usos de soplar.' },
        psychologist_note: 'Relacionar la respiración con acciones cotidianas.'
      },
      {
        step: 'd',
        label: 'Escucha del cuerpo',
        instruction: 'Graba la respiración de tu compañero durante 10 segundos. Luego graba un mensaje de 10 segundos. Escúchense en duplas y anoten diferencias. Escuchen el sonido del corazón (con el oído pegado al pecho o con estetoscopio).',
        display: { type: 'text', content: 'Grabar respiración y voz. Escuchar latidos del corazón.' },
        psychologist_note: 'Conectar la respiración con la conciencia corporal.'
      }
    ],
    achievement_domains: ['Control respiratorio', 'Relación respiración-acción', 'Conciencia corporal']
  },

  // ── 11 ───────────────────────────────────────────────────────────────
  {
    id: 11,
    area: 'Focalización de atención — Contemplación activa',
    element: 'Respiración, observación, objetos',
    objective: 'Identificar objetos y sus detalles observando detenidamente.',
    completed_by_aqn: false,
    activities: [
      {
        step: 'a',
        label: 'TP-CREM',
        instruction: 'Respiración consciente con conexión emocional. Inhala y pregúntate: ¿qué siento? Exhala y observa la emoción sin juzgar.',
        display: { type: 'breathing_timer', content: 'Respiración + conexión emocional', duration_sec: 90 }
      },
      {
        step: 'b',
        label: 'POSMAN',
        instruction: 'Pauta completa de POSMAN con ojos cerrados.',
        display: { type: 'hands_guide', content: 'POSMAN — ojos cerrados' }
      },
      {
        step: 'c',
        label: 'Encontrar diferencias',
        instruction: 'Observa imágenes en pantalla (dos versiones casi idénticas) y encuentra las diferencias. Luego, al salir y entrar de la sala, detecta cambios en la disposición de objetos.',
        display: { type: 'image_prompt', content: 'Encuentra las diferencias entre estas dos imágenes.' },
        psychologist_note: 'Ejercicio de atención selectiva y percepción.'
      },
      {
        step: 'd',
        label: 'Caja sensorial',
        instruction: 'En una caja con objetos, identifica cada uno solo por el tacto. Desde objetos simples a complejos.',
        display: { type: 'text', content: 'Caja sensorial: identifica los objetos con los ojos cerrados.' },
        psychologist_note: 'Integrar percepción táctil con memoria.'
      }
    ],
    achievement_domains: ['Atención selectiva', 'Percepción de detalles', 'Identificación táctil']
  },

  // ── 12 ───────────────────────────────────────────────────────────────
  {
    id: 12,
    area: 'Inteligencia corporal kinestésica',
    element: 'Respiración, observación, kinestesia',
    objective: 'Identificar, imaginar, tocar.',
    completed_by_aqn: false,
    activities: [
      {
        step: 'a',
        label: 'TP-CREM',
        instruction: 'Respiración consciente con conexión táctil (E8). Coloca tus manos sobre el abdomen, siente cómo se expande al inhalar y se contrae al exhalar.',
        display: { type: 'breathing_timer', content: 'Atención al movimiento abdominal', duration_sec: 60 }
      },
      {
        step: 'b',
        label: 'POSMAN',
        instruction: 'Abraza cada dedo de la mano opuesta contando hasta 10. Alterna manos.',
        display: { type: 'hands_guide', content: 'POSMAN — abrazo dactilar' }
      },
      {
        step: 'c',
        label: 'Reconocimiento táctil facial',
        instruction: 'Con los ojos cubiertos por un antifaz, toca la cara de tu compañero e intenta identificarlo.',
        display: { type: 'text', content: 'Con antifaz, identifica a tu compañero tocando su cara.' },
        psychologist_note: 'Fomentar la atención plena al tacto y la confianza.'
      },
      {
        step: 'd',
        label: 'Caja sensorial avanzada',
        instruction: 'Se colocan objetos en una caja. Los participantes los identifican y luego los dibujan. Los objetos pertenecen a un concepto que deben descubrir.',
        display: { type: 'text', content: 'Identifica los objetos, dibújalos y descubre el concepto común.' },
        psychologist_note: 'Aumentar dificultad progresivamente.'
      }
    ],
    achievement_domains: ['Percepción táctil', 'Memoria kinestésica', 'Síntesis conceptual']
  },

  // ── 13 ───────────────────────────────────────────────────────────────
  {
    id: 13,
    area: 'Inteligencia corporal kinestésica',
    element: 'Respiración, cuerpo, equilibrio',
    objective: 'Imaginar, controlar, tomar conciencia del cuerpo.',
    completed_by_aqn: false,
    activities: [
      {
        step: 'a',
        label: 'TP-CREM',
        instruction: 'Respiración consciente con conexión emocional (E9) y auditiva (E7). Escucha tu respiración y siente la emoción que te genera.',
        display: { type: 'breathing_timer', content: 'Respiración + emoción + sonido', duration_sec: 90 }
      },
      {
        step: 'b',
        label: 'POSMAN',
        instruction: 'Pauta de ejercicios de equilibrio: pararse en un pie, luego en el otro, con los brazos extendidos.',
        display: { type: 'hands_guide', content: 'POSMAN — equilibrio' }
      },
      {
        step: 'c',
        label: 'Yoga y posturas',
        instruction: 'Realiza secuencias de posturas de yoga (individuales y grupales). Enfócate en la respiración y el equilibrio en cada postura.',
        display: { type: 'image_prompt', content: 'Secuencia de posturas de yoga.' },
        psychologist_note: 'Adaptar posturas a la capacidad del grupo.'
      },
      {
        step: 'd',
        label: 'Disociación de movimientos',
        instruction: 'Ejercicios de gimnasia cerebral: ampliar y reducir espacio, mantener equilibrio, movimientos disociados.',
        display: { type: 'text', content: 'Pauta de ejercicios de disociación.' }
      }
    ],
    achievement_domains: ['Equilibrio corporal', 'Coordinación', 'Conciencia corporal']
  },

  // ── 14 ───────────────────────────────────────────────────────────────
  {
    id: 14,
    area: 'Inteligencia corporal kinestésica',
    element: 'Cuerpo y equilibrio',
    objective: 'Imaginar, controlar, interpretar, comunicar.',
    completed_by_aqn: false,
    activities: [
      {
        step: 'a',
        label: 'TP-CREM',
        instruction: 'Respiración consciente con conexión visual (E10). Cierra los ojos y observa las imágenes que aparecen en tu oscuridad visual.',
        display: { type: 'meditation', content: 'Observa las luces y formas en tu interior.', duration_sec: 60 }
      },
      {
        step: 'b',
        label: 'POSMAN',
        instruction: 'Digitación cruzada con los brazos en distintas posiciones.',
        display: { type: 'hands_guide', content: 'POSMAN — digitación en diferentes planos' }
      },
      {
        step: 'c',
        label: 'La estatua',
        instruction: 'Forma parejas. Uno es el escultor y el otro la estatua. El escultor moldea la estatua en una posición que exprese una emoción. Luego intercambian.',
        display: { type: 'text', content: 'Moldea a tu compañero como una estatua que exprese una emoción.' },
        psychologist_note: 'Trabajar la expresión corporal y la comunicación no verbal.'
      }
    ],
    achievement_domains: ['Expresión corporal', 'Comunicación no verbal', 'Empatía kinestésica']
  },

  // ── 15 ───────────────────────────────────────────────────────────────
  {
    id: 15,
    area: 'Focalización de atención',
    element: 'Meditación',
    objective: 'Imaginar, relajar.',
    completed_by_aqn: false,
    activities: [
      {
        step: 'a',
        label: 'TP-CREM',
        instruction: 'Respiración consciente con conexión emocional y visual. Prepara tu mente para la experiencia guiada.',
        display: { type: 'breathing_timer', content: 'Preparación para meditación', duration_sec: 60 }
      },
      {
        step: 'b',
        label: 'POSMAN',
        instruction: 'Pauta completa con enfoque en la respiración.',
        display: { type: 'hands_guide', content: 'POSMAN — preparación para meditación' }
      },
      {
        step: 'c',
        label: 'Experiencia guiada "El Árbol"',
        instruction: 'Cierra los ojos. Imagina un gran árbol con raíces profundas, tronco firme y ramas que se elevan al cielo. Siente tu conexión con la tierra y el cielo. Permanece en esa imagen por unos minutos.',
        display: { type: 'meditation', content: 'El Árbol: raíces, tronco, ramas.', duration_sec: 180 },
        psychologist_note: 'Guiar con voz suave. Pausas entre cada instrucción.'
      },
      {
        step: 'd',
        label: 'Confección del árbol en 3D',
        instruction: 'Con materiales (cartón, papel, plastilina) construye un modelo del árbol que imaginaste.',
        display: { type: 'text', content: 'Construye tu árbol en 3D.' }
      }
    ],
    achievement_domains: ['Imaginación guiada', 'Simbolización', 'Expresión artística']
  },

  // ── 16 ───────────────────────────────────────────────────────────────
  {
    id: 16,
    area: 'Focalización de atención',
    element: 'Meditación',
    objective: 'Imaginar, relajar.',
    completed_by_aqn: false,
    activities: [
      {
        step: 'a',
        label: 'TP-CREM',
        instruction: 'Respiración consciente con conexión visual y emocional.',
        display: { type: 'breathing_timer', content: 'Preparación', duration_sec: 60 }
      },
      {
        step: 'b',
        label: 'POSMAN',
        instruction: 'Frotación y digitación con ojos cerrados.',
        display: { type: 'hands_guide', content: 'POSMAN — ojos cerrados' }
      },
      {
        step: 'c',
        label: 'Experiencia guiada "Luz Blanca"',
        instruction: 'Cierra los ojos. Imagina una luz blanca y cálida que desciende desde el cielo, recorriendo tu cuerpo, llenándote de paz y claridad. Deja que esa luz te envuelva por completo.',
        display: { type: 'meditation', content: 'Luz Blanca — paz y claridad.', duration_sec: 180 },
        psychologist_note: 'Guiar la luz desde la cabeza hasta los pies.'
      }
    ],
    achievement_domains: ['Imaginación guiada', 'Relajación profunda', 'Visualización']
  },

  // ── 17 ───────────────────────────────────────────────────────────────
  {
    id: 17,
    area: 'Generación de imagen mental',
    element: 'Representar, definir',
    objective: 'Revisión de formas y conceptos geométricos y otras características de los objetos.',
    completed_by_aqn: false,
    activities: [
      {
        step: 'a',
        label: 'TP-CREM',
        instruction: 'Respiración consciente con conexión táctil (E8). Manos sobre el abdomen.',
        display: { type: 'breathing_timer', content: 'Atención táctil', duration_sec: 60 }
      },
      {
        step: 'b',
        label: 'POSMAN',
        instruction: 'Digitación cruzada y frotación.',
        display: { type: 'hands_guide', content: 'POSMAN — activación' }
      },
      {
        step: 'c',
        label: 'Manipulación de figuras geométricas',
        instruction: 'Observa y describe en detalle figuras geométricas (círculo, cuadrado, triángulo, cubo, etc.). Luego inventa una nueva figura geométrica, dale un nombre y descríbela.',
        display: { type: 'image_prompt', content: 'Figuras geométricas: nómbralas y descríbelas. Crea una nueva.' },
        psychologist_note: 'Fomentar la creatividad y el lenguaje descriptivo.'
      },
      {
        step: 'd',
        label: 'Modelado en masa',
        instruction: 'Moldea en masa la figura que inventaste.',
        display: { type: 'text', content: 'Modela tu figura en masa.' }
      }
    ],
    achievement_domains: ['Conocimiento geométrico', 'Descripción detallada', 'Creatividad']
  },

  // ── 18 ───────────────────────────────────────────────────────────────
  {
    id: 18,
    area: 'Generación de imagen mental',
    element: 'Respirar, imaginar, traducir de palabra a imagen',
    objective: 'Generación de objetos sensoriales mentales y manipulación de los mismos mediante el pensamiento.',
    completed_by_aqn: false,
    activities: [
      {
        step: 'a',
        label: 'TP-CREM',
        instruction: 'Respiración consciente con conexión sensorial (E6). Pon atención a la sensación del aire en tus fosas nasales.',
        display: { type: 'breathing_timer', content: 'Atención a la sensación', duration_sec: 60 }
      },
      {
        step: 'b',
        label: 'POSMAN',
        instruction: 'Digitación cruzada y frotación.',
        display: { type: 'hands_guide', content: 'POSMAN' }
      },
      {
        step: 'c',
        label: 'Imaginación guiada',
        instruction: 'Imagina un objeto que te será descrito en detalle. Manipúlalo mentalmente: gíralo, trasládalo, deformalo. Luego crea tu propia imagen y texto y compártela con el grupo con efectos de audio.',
        display: { type: 'text', content: 'Imagina y transforma el objeto. Luego crea tu propio objeto imaginario.' },
        psychologist_note: 'Fomentar la flexibilidad de pensamiento.'
      }
    ],
    achievement_domains: ['Imaginación', 'Manipulación mental', 'Expresión creativa']
  },

  // ── 19 ───────────────────────────────────────────────────────────────
  {
    id: 19,
    area: 'Generación de imagen mental',
    element: 'Respirar, imaginar, traducir de palabra a imagen',
    objective: 'Transposición de imágenes. Generación de escenarios con profundidad.',
    completed_by_aqn: false,
    activities: [
      {
        step: 'a',
        label: 'TP-CREM',
        instruction: 'Respiración consciente con conexión visual (E10). Observa las imágenes que aparecen al cerrar los ojos.',
        display: { type: 'meditation', content: 'Observa tu espacio visual interno.', duration_sec: 60 }
      },
      {
        step: 'b',
        label: 'POSMAN',
        instruction: 'Pauta completa de POSMAN.',
        display: { type: 'hands_guide', content: 'POSMAN completo' }
      },
      {
        step: 'c',
        label: 'Escenas superpuestas',
        instruction: 'Imagina un objeto y luego otro que se superponga al primero, manteniendo ambos en la memoria de trabajo. Amplía la cantidad de objetos. Luego analiza el concepto que surge de esa escena y compártelo con el grupo.',
        display: { type: 'text', content: 'Superpone objetos en tu mente y encuentra el concepto común.' },
        psychologist_note: 'Trabajar la memoria de trabajo y la síntesis de conceptos.'
      }
    ],
    achievement_domains: ['Memoria de trabajo', 'Síntesis conceptual', 'Imaginación espacial']
  },

  // ── 20 ───────────────────────────────────────────────────────────────
  {
    id: 20,
    area: 'Inteligencia visual-espacial',
    element: 'Uso de la imaginación',
    objective: 'Conocimientos de conceptos básicos para comprender y representarse el espacio.',
    completed_by_aqn: false,
    activities: [
      {
        step: 'a',
        label: 'TP-CREM',
        instruction: 'Respiración consciente con conexión táctil y visual.',
        display: { type: 'breathing_timer', content: 'Preparación', duration_sec: 60 }
      },
      {
        step: 'b',
        label: 'POSMAN',
        instruction: 'Digitación cruzada con los brazos en diferentes planos espaciales.',
        display: { type: 'hands_guide', content: 'POSMAN — planos espaciales' }
      },
      {
        step: 'c',
        label: 'Plano y espacio',
        instruction: 'Revisión de conceptos de plano (2D) y espacio (3D), sistemas de coordenadas (x,y; x,y,z), línea y figura. Interactúa con figuras físicas de 2 y 3 dimensiones, asociándolas con su nombre, su familia y sus figuras generatrices.',
        display: { type: 'image_prompt', content: 'Figuras 2D y 3D: nómbralas, relaciónalas.' },
        psychologist_note: 'Usar objetos concretos para facilitar la comprensión.'
      }
    ],
    achievement_domains: ['Comprensión espacial', 'Relación 2D-3D', 'Vocabulario geométrico']
  },

  // ── 21 ───────────────────────────────────────────────────────────────
  {
    id: 21,
    area: 'Inteligencia visual-espacial',
    element: 'Uso de la imaginación',
    objective: 'Ejercitación de la habilidad para conformar o elaborar imágenes mentales a partir de un requerimiento o sugerencia.',
    completed_by_aqn: false,
    activities: [
      {
        step: 'a',
        label: 'TP-CREM',
        instruction: 'Respiración consciente enfocada en la contemplación de imágenes residuales desde el cerebro.',
        display: { type: 'meditation', content: 'Contempla las imágenes que aparecen.', duration_sec: 90 }
      },
      {
        step: 'b',
        label: 'POSMAN',
        instruction: 'Integración interhemisférica con ejercicios de coordinación cruzada.',
        display: { type: 'hands_guide', content: 'POSMAN — integración hemisférica' }
      },
      {
        step: 'c',
        label: 'Producción de imágenes guiadas',
        instruction: 'Imagina una silla con patas metálicas, asiento y respaldo de madera oscura, bordes metálicos dorados. Luego realiza ejercicios del PEI "Orientación Espacial I".',
        display: { type: 'text', content: 'Imagina la silla descrita. Luego ejercicios PEI.' },
        psychologist_note: 'Iniciar con descripciones detalladas y pasar a ejercicios estructurados.'
      }
    ],
    achievement_domains: ['Imaginación dirigida', 'Atención al detalle', 'Orientación espacial']
  },

  // ── 22 ───────────────────────────────────────────────────────────────
  {
    id: 22,
    area: 'Inteligencia visual-espacial',
    element: 'Generación de imágenes mentales',
    objective: 'Ejercitación de habilidad para generar imágenes mentales.',
    completed_by_aqn: false,
    activities: [
      {
        step: 'a',
        label: 'TP-CREM',
        instruction: 'Respiración consciente enfocada en generar una imagen detallada de cada elemento del proceso respiratorio.',
        display: { type: 'breathing_timer', content: 'Imagina cada detalle de tu respiración.', duration_sec: 90 }
      },
      {
        step: 'b',
        label: 'POSMAN',
        instruction: 'Pauta de ejercicios de integración interhemisférica.',
        display: { type: 'hands_guide', content: 'POSMAN — integración' }
      },
      {
        step: 'c',
        label: 'PEI Orientación espacial I',
        instruction: 'Realiza los ejercicios del PEI. Luego, experiencia guiada "El pasillo del Tiempo": camina mentalmente por un pasillo donde cada puerta representa un momento de tu vida.',
        display: { type: 'meditation', content: 'El pasillo del Tiempo.', duration_sec: 180 },
        psychologist_note: 'Trabajar la memoria episódica y la proyección temporal.'
      }
    ],
    achievement_domains: ['Imaginación', 'Memoria episódica', 'Orientación temporal']
  },

  // ── 23 ───────────────────────────────────────────────────────────────
  {
    id: 23,
    area: 'Inteligencia visual-espacial',
    element: 'Generación y manipulación de imágenes mentales',
    objective: 'Aprender a realizar representaciones mentales de lugares.',
    completed_by_aqn: false,
    activities: [
      {
        step: 'a',
        label: 'TP-CREM',
        instruction: 'Respiración consciente con conteo de respiraciones.',
        display: { type: 'breathing_timer', content: 'Conteo de 10 respiraciones', duration_sec: 120 }
      },
      {
        step: 'b',
        label: 'POSMAN',
        instruction: 'Digitación cruzada y frotación.',
        display: { type: 'hands_guide', content: 'POSMAN' }
      },
      {
        step: 'c',
        label: 'PEI Orientación espacial I',
        instruction: 'Continúa con los ejercicios del PEI. Luego, experiencia guiada "El sendero del Bosque": camina mentalmente por un sendero, observando los detalles del entorno.',
        display: { type: 'meditation', content: 'El sendero del Bosque.', duration_sec: 180 },
        psychologist_note: 'Fomentar la creación de mapas mentales.'
      }
    ],
    achievement_domains: ['Representación mental de lugares', 'Atención al detalle', 'Navegación imaginaria']
  },

  // ── 24 ───────────────────────────────────────────────────────────────
  {
    id: 24,
    area: 'Búsqueda de información',
    element: 'Uso de los sentidos',
    objective: 'Aprender a observarse a sí mismo y al entorno, siendo capaz de registrar lo percibido.',
    completed_by_aqn: false,
    activities: [
      {
        step: 'a',
        label: 'TP-CREM',
        instruction: 'Respiración consciente enfocada en reconocer los diferentes sentidos involucrados en el proceso de respirar-observar.',
        display: { type: 'meditation', content: 'Reconoce cada sentido mientras respiras.', duration_sec: 90 }
      },
      {
        step: 'b',
        label: 'POSMAN',
        instruction: 'Ejercicios de atención plena en el tacto.',
        display: { type: 'hands_guide', content: 'POSMAN — atención táctil' }
      },
      {
        step: 'c',
        label: 'Observación sensorial',
        instruction: 'Cierra los ojos, adopta una postura sentada erguida, manos sobre el abdomen. Enfócate en cada detalle que puedas percibir mientras respiras (sonido, sensación, emoción, imagen). Registra lo percibido.',
        display: { type: 'text', content: 'Registra todo lo que percibes al respirar.' },
        psychologist_note: 'Guiar la atención a los distintos canales sensoriales.'
      }
    ],
    achievement_domains: ['Percepción sensorial', 'Registro consciente', 'Atención plena']
  },

  // ── 25 ───────────────────────────────────────────────────────────────
  {
    id: 25,
    area: 'Búsqueda de información',
    element: 'Uso de programas',
    objective: 'Aprender a buscar información en distintas fuentes.',
    completed_by_aqn: false,
    activities: [
      {
        step: 'a',
        label: 'TP-CREM',
        instruction: 'Respiración consciente con conexión emocional.',
        display: { type: 'breathing_timer', content: 'Respiración + emoción', duration_sec: 60 }
      },
      {
        step: 'b',
        label: 'POSMAN',
        instruction: 'Frotación y digitación.',
        display: { type: 'hands_guide', content: 'POSMAN' }
      },
      {
        step: 'c',
        label: 'Investigación geográfica',
        instruction: 'Busca un destino geográfico solicitado mediante una consigna que exige previa investigación bibliográfica. Compara puntos geográficos de Santiago que lleven el nombre de otra ciudad del mundo.',
        display: { type: 'text', content: 'Investiga el destino asignado y comparte la información.' },
        psychologist_note: 'Fomentar el uso de fuentes variadas (internet, libros, mapas).'
      }
    ],
    achievement_domains: ['Búsqueda de información', 'Uso de fuentes', 'Comparación geográfica']
  },

  // ── 26 ───────────────────────────────────────────────────────────────
  {
    id: 26,
    area: 'Búsqueda de información',
    element: 'Uso de libros, revistas, diarios',
    objective: 'Aprender a buscar, registrar y presentar información.',
    completed_by_aqn: false,
    activities: [
      {
        step: 'a',
        label: 'TP-CREM',
        instruction: 'Respiración consciente con conexión auditiva.',
        display: { type: 'breathing_timer', content: 'Respiración + sonido', duration_sec: 60 }
      },
      {
        step: 'b',
        label: 'POSMAN',
        instruction: 'Pauta de activación.',
        display: { type: 'hands_guide', content: 'POSMAN' }
      },
      {
        step: 'c',
        label: 'Elaboración de texto con imágenes',
        instruction: 'Busca en libros, revistas y diarios información de un tema de interés. Elabora un texto con imágenes y preséntalo al grupo.',
        display: { type: 'text', content: 'Investiga y elabora un texto con imágenes sobre tu tema.' },
        psychologist_note: 'Enfatizar la selección de información relevante y la organización visual.'
      }
    ],
    achievement_domains: ['Investigación', 'Síntesis textual', 'Presentación visual']
  },

  // ── 27 ───────────────────────────────────────────────────────────────
  {
    id: 27,
    area: 'Búsqueda de información',
    element: 'Películas y videos',
    objective: 'Aprender a buscar, registrar y presentar la información.',
    completed_by_aqn: false,
    activities: [
      {
        step: 'a',
        label: 'TP-CREM',
        instruction: 'Respiración consciente con conexión visual.',
        display: { type: 'breathing_timer', content: 'Respiración + imagen', duration_sec: 60 }
      },
      {
        step: 'b',
        label: 'POSMAN',
        instruction: 'Digitación cruzada y frotación.',
        display: { type: 'hands_guide', content: 'POSMAN' }
      },
      {
        step: 'c',
        label: 'Análisis de video',
        instruction: 'Observa un video educativo. Luego cada uno presenta al grupo la temática, las ideas expuestas, el mensaje y la importancia de conocerlo.',
        display: { type: 'text', content: 'Observa el video y prepárate para presentarlo al grupo.' },
        psychologist_note: 'Seleccionar videos cortos y de interés para los participantes.'
      }
    ],
    achievement_domains: ['Comprensión audiovisual', 'Análisis crítico', 'Presentación oral']
  },

  // ── 28 ───────────────────────────────────────────────────────────────
  {
    id: 28,
    area: 'Búsqueda de información',
    element: 'Entrevistas, registro fotográfico',
    objective: 'Aprender a buscar información visual.',
    completed_by_aqn: false,
    activities: [
      {
        step: 'a',
        label: 'TP-CREM',
        instruction: 'Respiración consciente con conexión emocional.',
        display: { type: 'breathing_timer', content: 'Respiración + emoción', duration_sec: 60 }
      },
      {
        step: 'b',
        label: 'POSMAN',
        instruction: 'Pauta completa.',
        display: { type: 'hands_guide', content: 'POSMAN' }
      },
      {
        step: 'c',
        label: 'Entrevista y registro',
        instruction: 'Elige un referente importante para ti. Busca entrevistas en Internet que otorguen información sobre su vida y obra. Busca también fotografías relevantes. Registra la URL o los datos bibliográficos.',
        display: { type: 'text', content: 'Investiga a tu referente: entrevistas, fotos, fuentes.' },
        psychologist_note: 'Fomentar el pensamiento crítico sobre las fuentes de información.'
      }
    ],
    achievement_domains: ['Investigación en línea', 'Selección de fuentes', 'Registro de información']
  },

  // ── 29 ───────────────────────────────────────────────────────────────
  {
    id: 29,
    area: 'Registrar información',
    element: 'Tablas básicas',
    objective: 'Aprender a registrar ordenadamente la información observada.',
    completed_by_aqn: false,
    activities: [
      {
        step: 'a',
        label: 'TP-CREM',
        instruction: 'Respiración consciente con conexión táctil.',
        display: { type: 'breathing_timer', content: 'Atención táctil', duration_sec: 60 }
      },
      {
        step: 'b',
        label: 'POSMAN',
        instruction: 'Digitación cruzada y frotación.',
        display: { type: 'hands_guide', content: 'POSMAN' }
      },
      {
        step: 'c',
        label: 'Clasificación de fuentes',
        instruction: 'Clasifica las fuentes obtenidas en la sesión anterior según criterios: personal/laboral, imagen/texto, citas textuales/parafraseos. Archiva las fuentes con un sistema de rotulación.',
        display: { type: 'text', content: 'Clasifica y archiva tus fuentes.' },
        psychologist_note: 'Introducir el concepto de fuentes primarias y secundarias.'
      }
    ],
    achievement_domains: ['Clasificación', 'Organización de información', 'Archivo']
  },

  // ── 30 ───────────────────────────────────────────────────────────────
  {
    id: 30,
    area: 'Registrar información',
    element: 'Tablas',
    objective: 'Profundizar en el concepto de tabla. Dar un marco histórico cultural.',
    completed_by_aqn: false,
    activities: [
      {
        step: 'a',
        label: 'TP-CREM',
        instruction: 'Respiración consciente con conexión visual y táctil.',
        display: { type: 'breathing_timer', content: 'Preparación', duration_sec: 60 }
      },
      {
        step: 'b',
        label: 'POSMAN',
        instruction: 'Pauta de activación.',
        display: { type: 'hands_guide', content: 'POSMAN' }
      },
      {
        step: 'c',
        label: 'MetaTabla',
        instruction: 'Cada uno trae un pedazo de tabla de madera de 30x30 cm. Sobre ella confeccionan una tabla de 5x5 con datos personales (Tabla de Presentación). Por el lado artístico, decoran la tabla con una obra significativa.',
        display: { type: 'text', content: 'Crea tu MetaTabla: datos personales y arte en la parte trasera.' },
        psychologist_note: 'Mostrar ejemplos de tablas notables en la historia (Tablas de la Ley, tablas de multiplicar, tablas de surf, etc.).'
      }
    ],
    achievement_domains: ['Comprensión de tabla', 'Creatividad', 'Expresión personal']
  },

  // ── 31 ───────────────────────────────────────────────────────────────
  {
    id: 31,
    area: 'Registrar información',
    element: 'Tablas creativas',
    objective: 'Aprender a diseñar y organizar información usando esquemas.',
    completed_by_aqn: false,
    activities: [
      {
        step: 'a',
        label: 'TP-CREM',
        instruction: 'Respiración consciente con conexión emocional.',
        display: { type: 'breathing_timer', content: 'Respiración + emoción', duration_sec: 60 }
      },
      {
        step: 'b',
        label: 'POSMAN',
        instruction: 'Digitación cruzada y frotación.',
        display: { type: 'hands_guide', content: 'POSMAN' }
      },
      {
        step: 'c',
        label: 'Uso de tablas en diversos contextos',
        instruction: 'Observa distintos tipos de tablas (deportes, noticiarios, negocios, medicina, ciencias). Elabora una tabla para registrar información de un texto científico, literario o filosófico. También elabora una tabla para un partido de tenis y para una competencia de atletismo.',
        display: { type: 'image_prompt', content: 'Observa ejemplos de tablas y crea tus propias tablas.' },
        psychologist_note: 'Conectar con personas significativas que usan tablas en su trabajo.'
      }
    ],
    achievement_domains: ['Diseño de tablas', 'Organización de información', 'Transferencia a contextos reales']
  },

  // ── 32 ───────────────────────────────────────────────────────────────
  {
    id: 32,
    area: 'Registrar información',
    element: 'Esquemas',
    objective: 'Aprender a diseñar y organizar información usando esquemas.',
    completed_by_aqn: false,
    activities: [
      {
        step: 'a',
        label: 'TP-CREM',
        instruction: 'Respiración consciente con conexión auditiva y visual.',
        display: { type: 'breathing_timer', content: 'Preparación', duration_sec: 60 }
      },
      {
        step: 'b',
        label: 'POSMAN',
        instruction: 'Pauta de activación.',
        display: { type: 'hands_guide', content: 'POSMAN' }
      },
      {
        step: 'c',
        label: 'De la tabla al esquema',
        instruction: 'Amplía la visión desde la "Tabla" al concepto más amplio de "Esquema". Diseña un esquema que organice la información de un tema de interés.',
        display: { type: 'text', content: 'Transforma tu tabla en un esquema más complejo.' },
        psychologist_note: 'Mostrar diferentes tipos de esquemas (mapas conceptuales, diagramas de flujo, etc.).'
      }
    ],
    achievement_domains: ['Pensamiento visual', 'Jerarquización de información', 'Representación esquemática']
  },

  // ── 33 ───────────────────────────────────────────────────────────────
  {
    id: 33,
    area: 'Registrar información',
    element: 'Esquemas',
    objective: 'Realizar representaciones gráficas creativas del tema de su interés.',
    completed_by_aqn: false,
    activities: [
      {
        step: 'a',
        label: 'TP-CREM',
        instruction: 'Respiración consciente con conexión emocional.',
        display: { type: 'breathing_timer', content: 'Respiración + emoción', duration_sec: 60 }
      },
      {
        step: 'b',
        label: 'POSMAN',
        instruction: 'Digitación cruzada y frotación.',
        display: { type: 'hands_guide', content: 'POSMAN' }
      },
      {
        step: 'c',
        label: 'Maqueta en 3D/4D/5D',
        instruction: 'Elabora una maqueta que represente el tema seleccionado en un proceso reflexivo. Puede incluir dimensiones temporales o conceptuales.',
        display: { type: 'text', content: 'Crea una maqueta de tu tema de interés.' },
        psychologist_note: 'Fomentar la creatividad y la integración de conceptos.'
      }
    ],
    achievement_domains: ['Creatividad', 'Integración conceptual', 'Representación tridimensional']
  },

  // ── 34 ───────────────────────────────────────────────────────────────
  {
    id: 34,
    area: 'Categorizar',
    element: 'Separar / Ordenar',
    objective: 'Ejercitar capacidad de organizar y separar elementos materiales para un mejor trabajo.',
    completed_by_aqn: false,
    activities: [
      {
        step: 'a',
        label: 'TP-CREM',
        instruction: 'Respiración consciente enfocada en distinguir cada elemento nuclear del ejercicio respiratorio.',
        display: { type: 'breathing_timer', content: 'Distinción de elementos', duration_sec: 60 }
      },
      {
        step: 'b',
        label: 'POSMAN',
        instruction: 'Pauta de ejercicios de focalización.',
        display: { type: 'hands_guide', content: 'POSMAN' }
      },
      {
        step: 'c',
        label: 'Separación por categorías',
        instruction: 'Recibe un recipiente con fichas de colores diversos. Sepáralas según su color y asígnales un nombre a cada categoría. Realiza ejercicios del PEI "Categorizaciones".',
        display: { type: 'text', content: 'Separa las fichas por color y nombra las categorías.' },
        psychologist_note: 'Introducir el concepto de atributo y categoría.'
      }
    ],
    achievement_domains: ['Categorización', 'Identificación de atributos', 'Clasificación']
  },

  // ── 35 ───────────────────────────────────────────────────────────────
  {
    id: 35,
    area: 'Categorizar',
    element: 'Separar / Ordenar',
    objective: 'Ejercitar capacidad de separar y organizar elementos a partir de un conjunto desordenado y desorganizado.',
    completed_by_aqn: false,
    activities: [
      {
        step: 'a',
        label: 'TP-CREM',
        instruction: 'Respiración consciente con conexión sensorial.',
        display: { type: 'breathing_timer', content: 'Preparación', duration_sec: 60 }
      },
      {
        step: 'b',
        label: 'POSMAN',
        instruction: 'Ejercicios de coordinación motora con manos y brazos.',
        display: { type: 'hands_guide', content: 'POSMAN — coordinación' }
      },
      {
        step: 'c',
        label: 'Ordenamiento de cartas',
        instruction: 'Recibe un conjunto de cartas desordenadas. Ordénalas en categorías crecientes: números, pinta, masos, juego completo.',
        display: { type: 'text', content: 'Ordena las cartas en diferentes niveles de categorización.' },
        psychologist_note: 'Trabajar la jerarquización de categorías.'
      }
    ],
    achievement_domains: ['Jerarquización', 'Pensamiento lógico', 'Organización']
  },

  // ── 36 ───────────────────────────────────────────────────────────────
  {
    id: 36,
    area: 'Categorizar',
    element: 'Identificar / Categorizar',
    objective: 'Ejercitar la capacidad de identificar diferentes elementos y situarlos ordenadamente junto a otros para asignarles una etiqueta verbal.',
    completed_by_aqn: false,
    activities: [
      {
        step: 'a',
        label: 'TP-CREM',
        instruction: 'Respiración consciente con conexión táctil.',
        display: { type: 'breathing_timer', content: 'Atención táctil', duration_sec: 60 }
      },
      {
        step: 'b',
        label: 'POSMAN',
        instruction: 'Pauta de ejercicios de activación y focalización.',
        display: { type: 'hands_guide', content: 'POSMAN' }
      },
      {
        step: 'c',
        label: 'PEI Categorizaciones',
        instruction: 'Ejercita el instrumento "Categorizaciones" del Programa de Enriquecimiento, desde la portada hasta la página 15.',
        display: { type: 'text', content: 'Realiza los ejercicios de categorización del PEI.' },
        psychologist_note: 'Asegurar comprensión de las instrucciones de cada ejercicio.'
      }
    ],
    achievement_domains: ['Categorización', 'Etiquetado verbal', 'Pensamiento analítico']
  },

  // ── 37 ───────────────────────────────────────────────────────────────
  {
    id: 37,
    area: 'Categorizar',
    element: 'Identificar / Categorizar',
    objective: 'Distinguir, agrupar, ordenar.',
    completed_by_aqn: false,
    activities: [
      {
        step: 'a',
        label: 'TP-CREM',
        instruction: 'Respiración consciente con conexión auditiva y visual.',
        display: { type: 'breathing_timer', content: 'Preparación', duration_sec: 60 }
      },
      {
        step: 'b',
        label: 'POSMAN',
        instruction: 'Pauta de ejercicios de activación y focalización.',
        display: { type: 'hands_guide', content: 'POSMAN' }
      },
      {
        step: 'c',
        label: 'PEI Percepción Analítica',
        instruction: 'Ejercita el instrumento "Percepción Analítica" del PEI.',
        display: { type: 'text', content: 'Realiza los ejercicios de percepción analítica.' },
        psychologist_note: 'Trabajar la descomposición de elementos en partes.'
      }
    ],
    achievement_domains: ['Análisis', 'Percepción de partes', 'Síntesis']
  },

  // ── 38 ───────────────────────────────────────────────────────────────
  {
    id: 38,
    area: 'Análisis',
    element: 'Separar, estudiar',
    objective: 'Conocer por partes integrantes.',
    completed_by_aqn: false,
    activities: [
      {
        step: 'a',
        label: 'TP-CREM',
        instruction: 'Respiración consciente con conexión emocional.',
        display: { type: 'breathing_timer', content: 'Respiración + emoción', duration_sec: 60 }
      },
      {
        step: 'b',
        label: 'POSMAN',
        instruction: 'Pauta de activación y focalización.',
        display: { type: 'hands_guide', content: 'POSMAN' }
      },
      {
        step: 'c',
        label: 'Percepción Analítica + Acertijo',
        instruction: 'Ejercita el instrumento "Percepción Analítica" del PEI. Luego resuelve un acertijo o situación compleja que requiera análisis.',
        display: { type: 'text', content: 'Resuelve el acertijo usando el análisis.' },
        psychologist_note: 'Fomentar el razonamiento lógico y la búsqueda de soluciones.'
      }
    ],
    achievement_domains: ['Análisis detallado', 'Razonamiento lógico', 'Resolución de problemas']
  },

  // ── 39 ───────────────────────────────────────────────────────────────
  {
    id: 39,
    area: 'Análisis',
    element: 'Separar, estudiar',
    objective: 'Conocer por partes integrantes.',
    completed_by_aqn: false,
    activities: [
      {
        step: 'a',
        label: 'TP-CREM',
        instruction: 'Respiración consciente con conexión táctil.',
        display: { type: 'breathing_timer', content: 'Atención táctil', duration_sec: 60 }
      },
      {
        step: 'b',
        label: 'POSMAN',
        instruction: 'Digitación cruzada y frotación.',
        display: { type: 'hands_guide', content: 'POSMAN' }
      },
      {
        step: 'c',
        label: 'PEI Percepción Analítica',
        instruction: 'Continúa con los ejercicios de "Percepción Analítica" del PEI.',
        display: { type: 'text', content: 'Realiza más ejercicios de percepción analítica.' },
        psychologist_note: 'Repetir para consolidar la habilidad.'
      }
    ],
    achievement_domains: ['Análisis', 'Atención al detalle', 'Precisión']
  },

  // ── 40 ───────────────────────────────────────────────────────────────
  {
    id: 40,
    area: 'Análisis',
    element: 'Separar, estudiar',
    objective: 'Pensamiento organizado.',
    completed_by_aqn: false,
    activities: [
      {
        step: 'a',
        label: 'TP-CREM',
        instruction: 'Respiración consciente con conexión visual y emocional.',
        display: { type: 'breathing_timer', content: 'Preparación', duration_sec: 60 }
      },
      {
        step: 'b',
        label: 'POSMAN',
        instruction: 'Pauta de focalización e integración.',
        display: { type: 'hands_guide', content: 'POSMAN' }
      },
      {
        step: 'c',
        label: 'PEI Percepción Analítica',
        instruction: 'Completa los ejercicios de "Percepción Analítica" del PEI.',
        display: { type: 'text', content: 'Finaliza los ejercicios de percepción analítica.' },
        psychologist_note: 'Cerrar el módulo de análisis con una reflexión grupal.'
      }
    ],
    achievement_domains: ['Pensamiento organizado', 'Análisis sistemático', 'Reflexión metacognitiva']
  }
]

// ====================================================================
//  PDPI – SESIONES 41–58 (desde pdpi-sessions.ts)
// ====================================================================

import { PDPI_SESSIONS_41_58 } from './pdpi-sessions'

// ====================================================================
//  PDPI – TODAS LAS SESIONES (0–58)
// ====================================================================

export const PDPI_SESSIONS: PdpiSession[] = [
  ...PDPI_SESSIONS_0_40,
  ...PDPI_SESSIONS_41_58,
]

// ====================================================================
//  TP-CREM – 12 SESIONES (E1 a E12)
// ====================================================================

const TPCREM_SESSIONS: PdpiSession[] = [
  // ── 1 ────────────────────────────────────────────────────────────────
  {
    id: 1,
    area: 'TP-CREM',
    element: 'E1–E5 (Base)',
    objective: 'Practicar los elementos básicos de la técnica: conexión mental, control respiratorio, conteo, postura y mirada interior.',
    completed_by_aqn: true,
    activities: [
      {
        step: 'a',
        label: 'Introducción',
        instruction: 'Vamos a practicar la Respiración Consciente. Inhala por la nariz, exhala por la nariz. Enfoca tu atención en el movimiento de tu respiración.',
        display: { type: 'text', content: 'E1–E5: Conciencia respiratoria, control, conteo, postura, mirada interior.' }
      },
      {
        step: 'b',
        label: 'Práctica guiada',
        instruction: 'Siéntate en una silla, espalda recta, manos sobre rodillas, pies en el suelo. Cierra los ojos. Realiza 3 respiraciones completas, luego cuenta hasta 3, luego hasta 5, luego hasta 7, luego hasta 10. Repite en orden descendente.',
        display: { type: 'breathing_timer', content: 'Secuencia 3-5-7-10-7-5-3-1', duration_sec: 300 },
        psychologist_note: 'Guiar el conteo en voz alta al inicio, luego dejar que lo hagan mentalmente.'
      },
      {
        step: 'c',
        label: 'Reflexión',
        instruction: '¿Cómo te has sentido? ¿Has podido mantener la atención en la respiración? ¿Qué distracciones aparecieron?',
        psychologist_note: 'Fomentar la autobservación sin juicio.'
      },
      {
        step: 'd',
        label: 'Cierre',
        instruction: 'Toma una última respiración profunda y abre los ojos.',
        display: { type: 'breathing_timer', content: 'Respiración final', duration_sec: 20 }
      }
    ],
    achievement_domains: ['Control respiratorio', 'Mantiene atención', 'Regula postura', 'Observa mirada interior']
  },
  // ── 2 ────────────────────────────────────────────────────────────────
  {
    id: 2,
    area: 'TP-CREM',
    element: 'E1–E6 (Agrega sensación física)',
    objective: 'Incorporar la atención a la sensación física del aire al ingresar por las fosas nasales y la tráquea.',
    completed_by_aqn: true,
    activities: [
      {
        step: 'a',
        label: 'Introducción',
        instruction: 'Hoy agregaremos un nuevo elemento: la sensación física del aire al ingresar por tus fosas nasales y tráquea.',
        display: { type: 'text', content: 'E6: Atención a la sensación nasal.' }
      },
      {
        step: 'b',
        label: 'Práctica guiada',
        instruction: 'Misma postura y secuencia que la sesión anterior, pero ahora pon toda tu atención en la sensación del aire rozando tus fosas nasales y descendiendo por la tráquea. Cuenta hasta 5, 7 y 10.',
        display: { type: 'breathing_timer', content: 'Secuencia 5-7-10-7-5 con atención nasal', duration_sec: 300 },
        psychologist_note: 'Recordar mantener la postura y la mirada interior.'
      },
      {
        step: 'c',
        label: 'Reflexión',
        instruction: '¿Qué sensaciones percibiste? ¿Cómo cambió tu experiencia al añadir este foco?',
        psychologist_note: 'Conectar la sensación física con la conciencia corporal.'
      },
      {
        step: 'd',
        label: 'Cierre',
        instruction: 'Toma una respiración profunda sintiendo el aire en tus fosas nasales, y abre los ojos.',
        display: { type: 'breathing_timer', content: 'Cierre', duration_sec: 20 }
      }
    ],
    achievement_domains: ['Atención sensorial', 'Conciencia nasal', 'Integración de foco']
  },
  // ── 3 ────────────────────────────────────────────────────────────────
  {
    id: 3,
    area: 'TP-CREM',
    element: 'E1–E7 (Agrega sonido)',
    objective: 'Incorporar la atención al sonido que produce la respiración.',
    completed_by_aqn: true,
    activities: [
      {
        step: 'a',
        label: 'Introducción',
        instruction: 'Hoy agregaremos el sonido de la respiración. Escucha cada mínimo sonido que produce el aire al ingresar y salir.',
        display: { type: 'text', content: 'E7: Atención al sonido respiratorio.' }
      },
      {
        step: 'b',
        label: 'Práctica guiada',
        instruction: 'Secuencia de conteo con atención a la sensación y al sonido. Primero con oídos descubiertos, luego tapando un oído, luego el otro, luego ambos.',
        display: { type: 'breathing_timer', content: 'Secuencia con variantes auditivas', duration_sec: 360 },
        psychologist_note: 'Ayudar a distinguir los sonidos internos y externos.'
      },
      {
        step: 'c',
        label: 'Reflexión',
        instruction: '¿Qué sonidos percibiste? ¿Cómo cambió tu experiencia al tapar los oídos?',
        psychologist_note: 'Fomentar la percepción auditiva fina.'
      },
      {
        step: 'd',
        label: 'Cierre',
        instruction: 'Toma una respiración escuchando su sonido y abre los ojos.',
        display: { type: 'breathing_timer', content: 'Cierre', duration_sec: 20 }
      }
    ],
    achievement_domains: ['Percepción auditiva', 'Atención al sonido', 'Flexibilidad atencional']
  },
  // ── 4 ────────────────────────────────────────────────────────────────
  {
    id: 4,
    area: 'TP-CREM',
    element: 'E1–E8 (Agrega tacto abdominal)',
    objective: 'Incorporar la sensación táctil del abdomen al respirar.',
    completed_by_aqn: true,
    activities: [
      {
        step: 'a',
        label: 'Introducción',
        instruction: 'Hoy pondremos las manos sobre el abdomen para sentir su expansión al inhalar y contracción al exhalar.',
        display: { type: 'text', content: 'E8: Atención táctil abdominal.' }
      },
      {
        step: 'b',
        label: 'Práctica guiada',
        instruction: 'Postura recostada o sentada con manos sobre el abdomen. Secuencia de conteo con atención a sensación nasal, sonido y movimiento abdominal.',
        display: { type: 'breathing_timer', content: 'Secuencia con atención táctil', duration_sec: 360 },
        psychologist_note: 'Guiar la respiración abdominal profunda.'
      },
      {
        step: 'c',
        label: 'Reflexión',
        instruction: '¿Cómo sentiste el movimiento de tu abdomen? ¿Qué diferencia notas con sesiones anteriores?',
        psychologist_note: 'Conectar con la respiración diafragmática.'
      },
      {
        step: 'd',
        label: 'Cierre',
        instruction: 'Toma una respiración sintiendo el abdomen y abre los ojos.',
        display: { type: 'breathing_timer', content: 'Cierre', duration_sec: 20 }
      }
    ],
    achievement_domains: ['Conciencia abdominal', 'Respiración diafragmática', 'Integración táctil']
  },
  // ── 5 ────────────────────────────────────────────────────────────────
  {
    id: 5,
    area: 'TP-CREM',
    element: 'E1–E9 (Agrega emoción)',
    objective: 'Incorporar la conexión emocional con el proceso respiratorio.',
    completed_by_aqn: true,
    activities: [
      {
        step: 'a',
        label: 'Introducción',
        instruction: 'Hoy conectaremos con las emociones que surgen al respirar. Observa cómo te sientes al inhalar y exhalar.',
        display: { type: 'text', content: 'E9: Conexión emocional.' }
      },
      {
        step: 'b',
        label: 'Práctica guiada',
        instruction: 'Misma postura y secuencia. Al contar, pregúntate: ¿qué emoción siento en este momento? Sin juzgar, solo observa.',
        display: { type: 'breathing_timer', content: 'Secuencia con atención emocional', duration_sec: 360 },
        psychologist_note: 'Validar cualquier emoción que aparezca.'
      },
      {
        step: 'c',
        label: 'Reflexión',
        instruction: '¿Qué emociones surgieron? ¿Cómo se relacionan con la respiración?',
        psychologist_note: 'Fomentar la alfabetización emocional.'
      },
      {
        step: 'd',
        label: 'Cierre',
        instruction: 'Toma una respiración sintiendo tu emoción y abre los ojos.',
        display: { type: 'breathing_timer', content: 'Cierre', duration_sec: 20 }
      }
    ],
    achievement_domains: ['Reconocimiento emocional', 'Regulación emocional', 'Autoconciencia']
  },
  // ── 6 ────────────────────────────────────────────────────────────────
  {
    id: 6,
    area: 'TP-CREM',
    element: 'E1–E10 (Agrega mirada interior visual)',
    objective: 'Incorporar la observación de estímulos visuales internos.',
    completed_by_aqn: true,
    activities: [
      {
        step: 'a',
        label: 'Introducción',
        instruction: 'Hoy observaremos las imágenes, luces o formas que aparecen en nuestra oscuridad visual interna.',
        display: { type: 'text', content: 'E10: Conexión sensorial visual.' }
      },
      {
        step: 'b',
        label: 'Práctica guiada',
        instruction: 'Cierra los ojos y, al respirar, contempla con serenidad cualquier estímulo visual que aparezca. No fuerces, solo observa.',
        display: { type: 'meditation', content: 'Observa las luces y formas internas.', duration_sec: 300 },
        psychologist_note: 'Guiar sin expectativas, solo presencia.'
      },
      {
        step: 'c',
        label: 'Reflexión',
        instruction: '¿Qué viste? ¿Cómo te sentiste al observar tu interior visual?',
        psychologist_note: 'Conectar con la imaginación y la creatividad.'
      },
      {
        step: 'd',
        label: 'Cierre',
        instruction: 'Toma una respiración y abre los ojos.',
        display: { type: 'breathing_timer', content: 'Cierre', duration_sec: 20 }
      }
    ],
    achievement_domains: ['Visualización', 'Observación interna', 'Imaginación']
  },
  // ── 7 ────────────────────────────────────────────────────────────────
  {
    id: 7,
    area: 'TP-CREM',
    element: 'E1–E11 (Agrega reflexión consciente)',
    objective: 'Incorporar la reflexión analítica sobre el proceso respiratorio.',
    completed_by_aqn: true,
    activities: [
      {
        step: 'a',
        label: 'Introducción',
        instruction: 'Hoy reflexionaremos sobre la técnica: ¿qué es la respiración consciente? ¿Para qué puede servir?',
        display: { type: 'text', content: 'E11: Reflexión consciente.' }
      },
      {
        step: 'b',
        label: 'Práctica guiada',
        instruction: 'Realiza la secuencia completa (sensación, sonido, tacto, emoción, visión). Al finalizar, describe en tus palabras qué es la respiración consciente y para qué sirve.',
        display: { type: 'breathing_timer', content: 'Secuencia completa + reflexión', duration_sec: 360 },
        psychologist_note: 'Fomentar la metacognición.'
      },
      {
        step: 'c',
        label: 'Reflexión',
        instruction: 'Comparte tu reflexión con el grupo. ¿Qué ideas nuevas tienes sobre la respiración consciente?',
        psychologist_note: 'Valorar las construcciones personales.'
      },
      {
        step: 'd',
        label: 'Cierre',
        instruction: 'Toma una respiración consciente y abre los ojos.',
        display: { type: 'breathing_timer', content: 'Cierre', duration_sec: 20 }
      }
    ],
    achievement_domains: ['Metacognición', 'Expresión verbal', 'Comprensión conceptual']
  },
  // ── 8 ────────────────────────────────────────────────────────────────
  {
    id: 8,
    area: 'TP-CREM',
    element: 'E1–E12 (Agrega pausa y relajo)',
    objective: 'Practicar la suspensión momentánea de la actividad cognitiva consciente.',
    completed_by_aqn: true,
    activities: [
      {
        step: 'a',
        label: 'Introducción',
        instruction: 'Hoy aprenderemos a hacer una pausa mental, dejando ir la mente con libertad, solo observándola.',
        display: { type: 'text', content: 'E12: Pausa y relajo mental.' }
      },
      {
        step: 'b',
        label: 'Práctica guiada',
        instruction: 'Después de la secuencia de respiración, tómate un minuto de pausa: deja que tus pensamientos fluyan sin seguirlos. Solo obsérvate.',
        display: { type: 'meditation', content: 'Pausa: observa tus pensamientos sin aferrarte.', duration_sec: 120 },
        psychologist_note: 'Crear un espacio de no-hacer.'
      },
      {
        step: 'c',
        label: 'Reflexión',
        instruction: '¿Qué sintiste durante la pausa? ¿Fue difícil o fácil?',
        psychologist_note: 'Normalizar la dificultad inicial.'
      },
      {
        step: 'd',
        label: 'Cierre',
        instruction: 'Toma una respiración consciente y abre los ojos.',
        display: { type: 'breathing_timer', content: 'Cierre', duration_sec: 20 }
      }
    ],
    achievement_domains: ['Capacidad de pausa', 'Observación de pensamientos', 'Regulación mental']
  },
  // ── 9 ────────────────────────────────────────────────────────────────
  {
    id: 9,
    area: 'TP-CREM',
    element: 'Práctica integrada',
    objective: 'Integrar todos los elementos en una práctica fluida.',
    completed_by_aqn: true,
    activities: [
      {
        step: 'a',
        label: 'Práctica completa',
        instruction: 'Realiza toda la secuencia de E1 a E12 de forma continua, sin pausas entre elementos.',
        display: { type: 'meditation', content: 'Secuencia completa integrada', duration_sec: 360 },
        psychologist_note: 'Observar la fluidez y la capacidad de mantener la atención.'
      }
    ],
    achievement_domains: ['Fluidez en la práctica', 'Integración de elementos', 'Atención sostenida']
  },
  // ── 10 ───────────────────────────────────────────────────────────────
  {
    id: 10,
    area: 'TP-CREM',
    element: 'Práctica en diferentes posturas',
    objective: 'Experimentar la técnica en distintas posiciones (sentado, recostado, de pie).',
    completed_by_aqn: true,
    activities: [
      {
        step: 'a',
        label: 'Práctica en postura de pie',
        instruction: 'Realiza la secuencia completa de pie, con los pies separados al ancho de los hombros.',
        display: { type: 'meditation', content: 'TP-CREM de pie', duration_sec: 360 },
        psychologist_note: 'Observar cómo cambia la experiencia con la postura.'
      }
    ],
    achievement_domains: ['Adaptabilidad postural', 'Conciencia corporal', 'Flexibilidad']
  },
  // ── 11 ───────────────────────────────────────────────────────────────
  {
    id: 11,
    area: 'TP-CREM',
    element: 'Práctica en contexto real',
    objective: 'Aplicar la técnica en una situación cotidiana (ej. antes de una tarea).',
    completed_by_aqn: true,
    activities: [
      {
        step: 'a',
        label: 'Aplicación práctica',
        instruction: 'Antes de realizar una tarea (lectura, dibujo, escritura), realiza 3 minutos de TP-CREM para centrarte.',
        display: { type: 'meditation', content: 'TP-CREM antes de la tarea', duration_sec: 180 },
        psychologist_note: 'Transferencia a la vida diaria.'
      }
    ],
    achievement_domains: ['Transferencia contextual', 'Autoregulación', 'Aplicación práctica']
  },
  // ── 12 ───────────────────────────────────────────────────────────────
  {
    id: 12,
    area: 'TP-CREM',
    element: 'Cierre del programa',
    objective: 'Integrar todos los aprendizajes y proyectar su uso futuro.',
    completed_by_aqn: true,
    activities: [
      {
        step: 'a',
        label: 'Práctica final',
        instruction: 'Realiza la secuencia completa como ritual de cierre.',
        display: { type: 'meditation', content: 'Cierre del programa TP-CREM', duration_sec: 360 }
      },
      {
        step: 'b',
        label: 'Reflexión final',
        instruction: 'Comparte: ¿qué te llevas de este programa? ¿Cómo piensas usar la respiración consciente en tu vida?',
        psychologist_note: 'Cerrar con un círculo de palabras.'
      }
    ],
    achievement_domains: ['Integración de aprendizajes', 'Proyección futura', 'Comunidad']
  }
]

// ====================================================================
//  POSMAN – 1 SESIÓN
// ====================================================================

const POSMAN_SESSION: PdpiSession = {
  id: 1,
  area: 'POSMAN',
  element: 'Ejercicios de focalización y activación',
  objective: 'Realizar todos los ejercicios de focalización manual para activar la atención y la coordinación.',
  completed_by_aqn: true,
  activities: [
    {
      step: 'a',
      label: 'Digitación cruzada',
      instruction: 'Coloca la mano izquierda con la palma hacia abajo frente al esternón. Partiendo por el dedo pulgar derecho, toca cada dedo de la mano izquierda extendida. Luego voltea la mano izquierda con la palma hacia arriba y repite comenzando por el meñique derecho. Invierte la secuencia con el pulgar izquierdo. Aumenta la velocidad.',
      display: { type: 'hands_guide', content: 'POSMAN — digitación cruzada' },
      psychologist_note: 'Observar la coordinación y la velocidad.'
    },
    {
      step: 'b',
      label: 'Encogimiento y extensión',
      instruction: 'Encoge y extiende alternadamente cada dedo de ambas manos comenzando por el pulgar derecho hasta el meñique derecho, luego el pulgar izquierdo hasta el meñique izquierdo, y de vuelta.',
      display: { type: 'hands_guide', content: 'POSMAN — encogimiento-extensión' }
    },
    {
      step: 'c',
      label: 'Abrazo dactilar',
      instruction: 'Con la mano derecha, abraza cada dedo de la mano izquierda extendida, contando hasta diez por cada dedo. Luego invierte con la mano izquierda abrazando los dedos de la mano derecha.',
      display: { type: 'hands_guide', content: 'POSMAN — abrazo dactilar' }
    },
    {
      step: 'd',
      label: 'Frotación',
      instruction: 'Frota el dorso de una mano con la palma de la otra (rectilíneo y circular). Luego frotación simultánea palma con palma y dorso con dorso, y circular hacia adelante y atrás.',
      display: { type: 'hands_guide', content: 'POSMAN — frotación' }
    },
    {
      step: 'e',
      label: 'Lavado de manos y trenzado',
      instruction: 'Simula lavarte las manos con atención plena: jabonar, enjuagar, agitar. Luego trenza los dedos y levanta cada uno en orden, y repite con las palmas hacia abajo.',
      display: { type: 'hands_guide', content: 'POSMAN — lavado y trenzado' }
    }
  ],
  achievement_domains: ['Coordinación fina', 'Atención plena', 'Velocidad motora']
}

// ====================================================================
//  EXPORTACIONES
// ====================================================================

export { TPCREM_SESSIONS, POSMAN_SESSION }