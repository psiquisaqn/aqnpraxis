// lib/activities/pdpi/sessions-0-10.ts
import { PdpiSession } from '../types'

export const PDPI_SESSIONS_0_10: PdpiSession[] = [
  // Sesión 0
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
        label: 'POSMAN (mitad)',
        instruction: 'Realiza la primera mitad de los ejercicios POSMAN: digitación cruzada y frotación de manos (sin trenzado ni lavado). Concéntrate en cada movimiento.',
        display: { type: 'hands_guide', content: 'POSMAN — mitad (digitación + frotación)' }
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
  // Sesión 1
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
        label: 'POSMAN (mitad)',
        instruction: 'POSMAN: digitación cruzada, frotación y abrazo dactilar (sin trenzado ni lavado).',
        display: { type: 'hands_guide', content: 'POSMAN — digitación + frotación + abrazo' }
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
  // Sesión 2
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
        label: 'POSMAN (mitad)',
        instruction: 'POSMAN: digitación cruzada, frotación, abrazo dactilar y encogimiento/extensión de dedos.',
        display: { type: 'hands_guide', content: 'POSMAN — digitación + frotación + abrazo + encogimiento' }
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
  // Sesión 3
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
        label: 'POSMAN (mitad)',
        instruction: 'POSMAN: digitación cruzada, frotación, abrazo dactilar, encogimiento/extensión y frotación circular.',
        display: { type: 'hands_guide', content: 'POSMAN — + frotación circular' }
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
  // Sesión 4
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
        label: 'POSMAN (mitad)',
        instruction: 'POSMAN: digitación cruzada, frotación, abrazo dactilar, encogimiento/extensión, frotación circular y trenzado (casi completo).',
        display: { type: 'hands_guide', content: 'POSMAN — casi completo (falta lavado)' }
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
  // Sesión 5
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
        label: 'POSMAN completo',
        instruction: 'Pauta completa de POSMAN: digitación cruzada, frotación, abrazo dactilar, encogimiento/extensión, frotación circular, trenzado y lavado de manos.',
        display: { type: 'hands_guide', content: 'POSMAN — completo' }
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
  // Sesión 6
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
        label: 'POSMAN completo',
        instruction: 'Pauta completa de POSMAN.',
        display: { type: 'hands_guide', content: 'POSMAN — completo' }
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
  // Sesión 7
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
        label: 'POSMAN completo',
        instruction: 'POSMAN completo con ojos cerrados.',
        display: { type: 'hands_guide', content: 'POSMAN — completo, ojos cerrados' }
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
  // Sesión 8
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
        label: 'POSMAN completo',
        instruction: 'POSMAN completo.',
        display: { type: 'hands_guide', content: 'POSMAN — completo' }
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
  // Sesión 9
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
        label: 'POSMAN completo',
        instruction: 'POSMAN con énfasis en la sensación táctil.',
        display: { type: 'hands_guide', content: 'POSMAN — atención táctil' }
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
  // Sesión 10
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
        label: 'POSMAN completo',
        instruction: 'POSMAN con ritmo dactilar.',
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
  }
]