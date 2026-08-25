// lib/activities/pdpi/sessions-31-40.ts
import { PdpiSession } from '../types'

export const PDPI_SESSIONS_31_40: PdpiSession[] = [
  // Sesión 31
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
        label: 'POSMAN completo',
        instruction: 'POSMAN.',
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
  // Sesión 32
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
        label: 'POSMAN completo',
        instruction: 'POSMAN.',
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
  // Sesión 33
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
        label: 'POSMAN completo',
        instruction: 'POSMAN.',
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
  // Sesión 34
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
        label: 'POSMAN completo',
        instruction: 'POSMAN.',
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
  // Sesión 35
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
        label: 'POSMAN completo',
        instruction: 'POSMAN con coordinación.',
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
  // Sesión 36
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
        label: 'POSMAN completo',
        instruction: 'POSMAN.',
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
  // Sesión 37
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
        label: 'POSMAN completo',
        instruction: 'POSMAN.',
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
  // Sesión 38
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
        label: 'POSMAN completo',
        instruction: 'POSMAN.',
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
  // Sesión 39
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
        label: 'POSMAN completo',
        instruction: 'POSMAN.',
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
  // Sesión 40
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
        label: 'POSMAN completo',
        instruction: 'POSMAN con integración.',
        display: { type: 'hands_guide', content: 'POSMAN — integración' }
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