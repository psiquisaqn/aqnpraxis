// lib/activities/tpcrem/sessions.ts
import { PdpiSession } from '../types'

export const TPCREM_SESSIONS: PdpiSession[] = [
  // Sesión 1
  {
    id: 1,
    area: 'TP-CREM',
    element: 'E1–E5 (Base)',
    objective: 'Practicar los elementos básicos de la técnica: conexión mental, control respiratorio, conteo, postura y mirada interior.',
    completed_by_aqn: true,
    activities: [
      {
        step: 'a',
        label: 'POSMAN (mitad)',
        instruction: 'Realiza la primera mitad de los ejercicios POSMAN: digitación cruzada y frotación de manos (sin trenzado ni lavado). Concéntrate en cada movimiento.',
        display: { type: 'hands_guide', content: 'POSMAN — mitad (digitación + frotación)' }
      },
      {
        step: 'b',
        label: 'Introducción TP-CREM',
        instruction: 'Vamos a practicar la Respiración Consciente. Inhala por la nariz, exhala por la nariz. Enfoca tu atención en el movimiento de tu respiración.',
        display: { type: 'text', content: 'E1–E5: Conciencia respiratoria, control, conteo, postura, mirada interior.' }
      },
      {
        step: 'c',
        label: 'Práctica guiada',
        instruction: 'Siéntate en una silla, espalda recta, manos sobre rodillas, pies en el suelo. Cierra los ojos. Realiza 3 respiraciones completas, luego cuenta hasta 3, luego hasta 5, luego hasta 7, luego hasta 10. Repite en orden descendente.',
        display: { type: 'breathing_timer', content: 'Secuencia 3-5-7-10-7-5-3-1', duration_sec: 300 },
        psychologist_note: 'Guiar el conteo en voz alta al inicio, luego dejar que lo hagan mentalmente.'
      },
      {
        step: 'd',
        label: 'Reflexión',
        instruction: '¿Cómo te has sentido? ¿Has podido mantener la atención en la respiración? ¿Qué distracciones aparecieron?',
        psychologist_note: 'Fomentar la autobservación sin juicio.'
      },
      {
        step: 'e',
        label: 'Cierre',
        instruction: 'Toma una última respiración profunda y abre los ojos.',
        display: { type: 'breathing_timer', content: 'Respiración final', duration_sec: 20 }
      }
    ],
    achievement_domains: ['Control respiratorio', 'Mantiene atención', 'Regula postura', 'Observa mirada interior']
  },
  // Sesión 2
  {
    id: 2,
    area: 'TP-CREM',
    element: 'E1–E6 (Agrega sensación física)',
    objective: 'Incorporar la atención a la sensación física del aire al ingresar por las fosas nasales y la tráquea.',
    completed_by_aqn: true,
    activities: [
      {
        step: 'a',
        label: 'POSMAN (mitad)',
        instruction: 'POSMAN: digitación cruzada, frotación y abrazo dactilar (sin trenzado ni lavado).',
        display: { type: 'hands_guide', content: 'POSMAN — digitación + frotación + abrazo' }
      },
      {
        step: 'b',
        label: 'Introducción',
        instruction: 'Hoy agregaremos un nuevo elemento: la sensación física del aire al ingresar por tus fosas nasales y tráquea.',
        display: { type: 'text', content: 'E6: Atención a la sensación nasal.' }
      },
      {
        step: 'c',
        label: 'Práctica guiada',
        instruction: 'Misma postura y secuencia que la sesión anterior, pero ahora pon toda tu atención en la sensación del aire rozando tus fosas nasales y descendiendo por la tráquea. Cuenta hasta 5, 7 y 10.',
        display: { type: 'breathing_timer', content: 'Secuencia 5-7-10-7-5 con atención nasal', duration_sec: 300 },
        psychologist_note: 'Recordar mantener la postura y la mirada interior.'
      },
      {
        step: 'd',
        label: 'Reflexión',
        instruction: '¿Qué sensaciones percibiste? ¿Cómo cambió tu experiencia al añadir este foco?',
        psychologist_note: 'Conectar la sensación física con la conciencia corporal.'
      },
      {
        step: 'e',
        label: 'Cierre',
        instruction: 'Toma una respiración profunda sintiendo el aire en tus fosas nasales, y abre los ojos.',
        display: { type: 'breathing_timer', content: 'Cierre', duration_sec: 20 }
      }
    ],
    achievement_domains: ['Atención sensorial', 'Conciencia nasal', 'Integración de foco']
  },
  // Sesión 3
  {
    id: 3,
    area: 'TP-CREM',
    element: 'E1–E7 (Agrega sonido)',
    objective: 'Incorporar la atención al sonido que produce la respiración.',
    completed_by_aqn: true,
    activities: [
      {
        step: 'a',
        label: 'POSMAN (mitad)',
        instruction: 'POSMAN: digitación cruzada, frotación, abrazo dactilar y encogimiento/extensión de dedos.',
        display: { type: 'hands_guide', content: 'POSMAN — digitación + frotación + abrazo + encogimiento' }
      },
      {
        step: 'b',
        label: 'Introducción',
        instruction: 'Hoy agregaremos el sonido de la respiración. Escucha cada mínimo sonido que produce el aire al ingresar y salir.',
        display: { type: 'text', content: 'E7: Atención al sonido respiratorio.' }
      },
      {
        step: 'c',
        label: 'Práctica guiada',
        instruction: 'Secuencia de conteo con atención a la sensación y al sonido. Primero con oídos descubiertos, luego tapando un oído, luego el otro, luego ambos.',
        display: { type: 'breathing_timer', content: 'Secuencia con variantes auditivas', duration_sec: 360 },
        psychologist_note: 'Ayudar a distinguir los sonidos internos y externos.'
      },
      {
        step: 'd',
        label: 'Reflexión',
        instruction: '¿Qué sonidos percibiste? ¿Cómo cambió tu experiencia al tapar los oídos?',
        psychologist_note: 'Fomentar la percepción auditiva fina.'
      },
      {
        step: 'e',
        label: 'Cierre',
        instruction: 'Toma una respiración escuchando su sonido y abre los ojos.',
        display: { type: 'breathing_timer', content: 'Cierre', duration_sec: 20 }
      }
    ],
    achievement_domains: ['Percepción auditiva', 'Atención al sonido', 'Flexibilidad atencional']
  },
  // Sesión 4
  {
    id: 4,
    area: 'TP-CREM',
    element: 'E1–E8 (Agrega tacto abdominal)',
    objective: 'Incorporar la sensación táctil del abdomen al respirar.',
    completed_by_aqn: true,
    activities: [
      {
        step: 'a',
        label: 'POSMAN (mitad)',
        instruction: 'POSMAN: digitación cruzada, frotación, abrazo dactilar, encogimiento/extensión y frotación circular.',
        display: { type: 'hands_guide', content: 'POSMAN — + frotación circular' }
      },
      {
        step: 'b',
        label: 'Introducción',
        instruction: 'Hoy pondremos las manos sobre el abdomen para sentir su expansión al inhalar y contracción al exhalar.',
        display: { type: 'text', content: 'E8: Atención táctil abdominal.' }
      },
      {
        step: 'c',
        label: 'Práctica guiada',
        instruction: 'Postura recostada o sentada con manos sobre el abdomen. Secuencia de conteo con atención a sensación nasal, sonido y movimiento abdominal.',
        display: { type: 'breathing_timer', content: 'Secuencia con atención táctil', duration_sec: 360 },
        psychologist_note: 'Guiar la respiración abdominal profunda.'
      },
      {
        step: 'd',
        label: 'Reflexión',
        instruction: '¿Cómo sentiste el movimiento de tu abdomen? ¿Qué diferencia notas con sesiones anteriores?',
        psychologist_note: 'Conectar con la respiración diafragmática.'
      },
      {
        step: 'e',
        label: 'Cierre',
        instruction: 'Toma una respiración sintiendo el abdomen y abre los ojos.',
        display: { type: 'breathing_timer', content: 'Cierre', duration_sec: 20 }
      }
    ],
    achievement_domains: ['Conciencia abdominal', 'Respiración diafragmática', 'Integración táctil']
  },
  // Sesión 5
  {
    id: 5,
    area: 'TP-CREM',
    element: 'E1–E9 (Agrega emoción)',
    objective: 'Incorporar la conexión emocional con el proceso respiratorio.',
    completed_by_aqn: true,
    activities: [
      {
        step: 'a',
        label: 'POSMAN completo',
        instruction: 'Pauta completa de POSMAN: digitación cruzada, frotación, abrazo dactilar, encogimiento/extensión, frotación circular, trenzado y lavado de manos.',
        display: { type: 'hands_guide', content: 'POSMAN — completo' }
      },
      {
        step: 'b',
        label: 'Introducción',
        instruction: 'Hoy conectaremos con las emociones que surgen al respirar. Observa cómo te sientes al inhalar y exhalar.',
        display: { type: 'text', content: 'E9: Conexión emocional.' }
      },
      {
        step: 'c',
        label: 'Práctica guiada',
        instruction: 'Misma postura y secuencia. Al contar, pregúntate: ¿qué emoción siento en este momento? Sin juzgar, solo observa.',
        display: { type: 'breathing_timer', content: 'Secuencia con atención emocional', duration_sec: 360 },
        psychologist_note: 'Validar cualquier emoción que aparezca.'
      },
      {
        step: 'd',
        label: 'Reflexión',
        instruction: '¿Qué emociones surgieron? ¿Cómo se relacionan con la respiración?',
        psychologist_note: 'Fomentar la alfabetización emocional.'
      },
      {
        step: 'e',
        label: 'Cierre',
        instruction: 'Toma una respiración sintiendo tu emoción y abre los ojos.',
        display: { type: 'breathing_timer', content: 'Cierre', duration_sec: 20 }
      }
    ],
    achievement_domains: ['Reconocimiento emocional', 'Regulación emocional', 'Autoconciencia']
  },
  // Sesión 6
  {
    id: 6,
    area: 'TP-CREM',
    element: 'E1–E10 (Agrega mirada interior visual)',
    objective: 'Incorporar la observación de estímulos visuales internos.',
    completed_by_aqn: true,
    activities: [
      {
        step: 'a',
        label: 'POSMAN completo',
        instruction: 'POSMAN completo.',
        display: { type: 'hands_guide', content: 'POSMAN — completo' }
      },
      {
        step: 'b',
        label: 'Introducción',
        instruction: 'Hoy observaremos las imágenes, luces o formas que aparecen en nuestra oscuridad visual interna.',
        display: { type: 'text', content: 'E10: Conexión sensorial visual.' }
      },
      {
        step: 'c',
        label: 'Práctica guiada',
        instruction: 'Cierra los ojos y, al respirar, contempla con serenidad cualquier estímulo visual que aparezca. No fuerces, solo observa.',
        display: { type: 'meditation', content: 'Observa las luces y formas internas.', duration_sec: 300 },
        psychologist_note: 'Guiar sin expectativas, solo presencia.'
      },
      {
        step: 'd',
        label: 'Reflexión',
        instruction: '¿Qué viste? ¿Cómo te sentiste al observar tu interior visual?',
        psychologist_note: 'Conectar con la imaginación y la creatividad.'
      },
      {
        step: 'e',
        label: 'Cierre',
        instruction: 'Toma una respiración y abre los ojos.',
        display: { type: 'breathing_timer', content: 'Cierre', duration_sec: 20 }
      }
    ],
    achievement_domains: ['Visualización', 'Observación interna', 'Imaginación']
  },
  // Sesión 7
  {
    id: 7,
    area: 'TP-CREM',
    element: 'E1–E11 (Agrega reflexión consciente)',
    objective: 'Incorporar la reflexión analítica sobre el proceso respiratorio.',
    completed_by_aqn: true,
    activities: [
      {
        step: 'a',
        label: 'POSMAN completo',
        instruction: 'POSMAN completo.',
        display: { type: 'hands_guide', content: 'POSMAN — completo' }
      },
      {
        step: 'b',
        label: 'Introducción',
        instruction: 'Hoy reflexionaremos sobre la técnica: ¿qué es la respiración consciente? ¿Para qué puede servir?',
        display: { type: 'text', content: 'E11: Reflexión consciente.' }
      },
      {
        step: 'c',
        label: 'Práctica guiada',
        instruction: 'Realiza la secuencia completa (sensación, sonido, tacto, emoción, visión). Al finalizar, describe en tus palabras qué es la respiración consciente y para qué sirve.',
        display: { type: 'breathing_timer', content: 'Secuencia completa + reflexión', duration_sec: 360 },
        psychologist_note: 'Fomentar la metacognición.'
      },
      {
        step: 'd',
        label: 'Reflexión',
        instruction: 'Comparte tu reflexión con el grupo. ¿Qué ideas nuevas tienes sobre la respiración consciente?',
        psychologist_note: 'Valorar las construcciones personales.'
      },
      {
        step: 'e',
        label: 'Cierre',
        instruction: 'Toma una respiración consciente y abre los ojos.',
        display: { type: 'breathing_timer', content: 'Cierre', duration_sec: 20 }
      }
    ],
    achievement_domains: ['Metacognición', 'Expresión verbal', 'Comprensión conceptual']
  },
  // Sesión 8
  {
    id: 8,
    area: 'TP-CREM',
    element: 'E1–E12 (Agrega pausa y relajo)',
    objective: 'Practicar la suspensión momentánea de la actividad cognitiva consciente.',
    completed_by_aqn: true,
    activities: [
      {
        step: 'a',
        label: 'POSMAN completo',
        instruction: 'POSMAN completo.',
        display: { type: 'hands_guide', content: 'POSMAN — completo' }
      },
      {
        step: 'b',
        label: 'Introducción',
        instruction: 'Hoy aprenderemos a hacer una pausa mental, dejando ir la mente con libertad, solo observándola.',
        display: { type: 'text', content: 'E12: Pausa y relajo mental.' }
      },
      {
        step: 'c',
        label: 'Práctica guiada',
        instruction: 'Después de la secuencia de respiración, tómate un minuto de pausa: deja que tus pensamientos fluyan sin seguirlos. Solo obsérvate.',
        display: { type: 'meditation', content: 'Pausa: observa tus pensamientos sin aferrarte.', duration_sec: 120 },
        psychologist_note: 'Crear un espacio de no-hacer.'
      },
      {
        step: 'd',
        label: 'Reflexión',
        instruction: '¿Qué sintiste durante la pausa? ¿Fue difícil o fácil?',
        psychologist_note: 'Normalizar la dificultad inicial.'
      },
      {
        step: 'e',
        label: 'Cierre',
        instruction: 'Toma una respiración consciente y abre los ojos.',
        display: { type: 'breathing_timer', content: 'Cierre', duration_sec: 20 }
      }
    ],
    achievement_domains: ['Capacidad de pausa', 'Observación de pensamientos', 'Regulación mental']
  },
  // Sesión 9
  {
    id: 9,
    area: 'TP-CREM',
    element: 'Práctica integrada',
    objective: 'Integrar todos los elementos en una práctica fluida.',
    completed_by_aqn: true,
    activities: [
      {
        step: 'a',
        label: 'POSMAN completo',
        instruction: 'POSMAN completo.',
        display: { type: 'hands_guide', content: 'POSMAN — completo' }
      },
      {
        step: 'b',
        label: 'Práctica completa',
        instruction: 'Realiza toda la secuencia de E1 a E12 de forma continua, sin pausas entre elementos.',
        display: { type: 'meditation', content: 'Secuencia completa integrada', duration_sec: 360 },
        psychologist_note: 'Observar la fluidez y la capacidad de mantener la atención.'
      }
    ],
    achievement_domains: ['Fluidez en la práctica', 'Integración de elementos', 'Atención sostenida']
  },
  // Sesión 10
  {
    id: 10,
    area: 'TP-CREM',
    element: 'Práctica en diferentes posturas',
    objective: 'Experimentar la técnica en distintas posiciones (sentado, recostado, de pie).',
    completed_by_aqn: true,
    activities: [
      {
        step: 'a',
        label: 'POSMAN completo',
        instruction: 'POSMAN completo.',
        display: { type: 'hands_guide', content: 'POSMAN — completo' }
      },
      {
        step: 'b',
        label: 'Práctica en postura de pie',
        instruction: 'Realiza la secuencia completa de pie, con los pies separados al ancho de los hombros.',
        display: { type: 'meditation', content: 'TP-CREM de pie', duration_sec: 360 },
        psychologist_note: 'Observar cómo cambia la experiencia con la postura.'
      }
    ],
    achievement_domains: ['Adaptabilidad postural', 'Conciencia corporal', 'Flexibilidad']
  },
  // Sesión 11
  {
    id: 11,
    area: 'TP-CREM',
    element: 'Práctica en contexto real',
    objective: 'Aplicar la técnica en una situación cotidiana (ej. antes de una tarea).',
    completed_by_aqn: true,
    activities: [
      {
        step: 'a',
        label: 'POSMAN completo',
        instruction: 'POSMAN completo.',
        display: { type: 'hands_guide', content: 'POSMAN — completo' }
      },
      {
        step: 'b',
        label: 'Aplicación práctica',
        instruction: 'Antes de realizar una tarea (lectura, dibujo, escritura), realiza 3 minutos de TP-CREM para centrarte.',
        display: { type: 'meditation', content: 'TP-CREM antes de la tarea', duration_sec: 180 },
        psychologist_note: 'Transferencia a la vida diaria.'
      }
    ],
    achievement_domains: ['Transferencia contextual', 'Autoregulación', 'Aplicación práctica']
  },
  // Sesión 12
  {
    id: 12,
    area: 'TP-CREM',
    element: 'Cierre del programa',
    objective: 'Integrar todos los aprendizajes y proyectar su uso futuro.',
    completed_by_aqn: true,
    activities: [
      {
        step: 'a',
        label: 'POSMAN completo',
        instruction: 'POSMAN completo como ritual de cierre.',
        display: { type: 'hands_guide', content: 'POSMAN — ritual de cierre' }
      },
      {
        step: 'b',
        label: 'Práctica final',
        instruction: 'Realiza la secuencia completa como ritual de cierre.',
        display: { type: 'meditation', content: 'Cierre del programa TP-CREM', duration_sec: 360 }
      },
      {
        step: 'c',
        label: 'Reflexión final',
        instruction: 'Comparte: ¿qué te llevas de este programa? ¿Cómo piensas usar la respiración consciente en tu vida?',
        psychologist_note: 'Cerrar con un círculo de palabras.'
      }
    ],
    achievement_domains: ['Integración de aprendizajes', 'Proyección futura', 'Comunidad']
  }
]