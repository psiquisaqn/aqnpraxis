// lib/activities/pdpi/sessions-11-20.ts
import { PdpiSession } from '../types'

export const PDPI_SESSIONS_11_20: PdpiSession[] = [
  // Sesión 11
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
        label: 'POSMAN completo',
        instruction: 'POSMAN con ojos cerrados.',
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
  // Sesión 12
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
        label: 'POSMAN completo',
        instruction: 'POSMAN con abrazo dactilar.',
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
  // Sesión 13
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
        label: 'POSMAN completo',
        instruction: 'POSMAN con equilibrio.',
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
  // Sesión 14
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
        label: 'POSMAN completo',
        instruction: 'POSMAN en diferentes planos.',
        display: { type: 'hands_guide', content: 'POSMAN — planos' }
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
  // Sesión 15
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
        label: 'POSMAN completo',
        instruction: 'POSMAN con enfoque en la respiración.',
        display: { type: 'hands_guide', content: 'POSMAN — preparación' }
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
  // Sesión 16
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
        label: 'POSMAN completo',
        instruction: 'POSMAN con ojos cerrados.',
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
  // Sesión 17
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
        label: 'POSMAN completo',
        instruction: 'POSMAN completo.',
        display: { type: 'hands_guide', content: 'POSMAN — completo' }
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
  // Sesión 18
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
        label: 'POSMAN completo',
        instruction: 'POSMAN completo.',
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
  // Sesión 19
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
        label: 'POSMAN completo',
        instruction: 'POSMAN completo.',
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
  // Sesión 20
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
        label: 'POSMAN completo',
        instruction: 'POSMAN en diferentes planos espaciales.',
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
  }
]