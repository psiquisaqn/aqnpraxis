// lib/activities/pdpi/sessions-21-30.ts
import { PdpiSession } from '../types'

export const PDPI_SESSIONS_21_30: PdpiSession[] = [
  // Sesión 21
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
        label: 'POSMAN completo',
        instruction: 'POSMAN de integración hemisférica.',
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
  // Sesión 22
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
        label: 'POSMAN completo',
        instruction: 'POSMAN de integración.',
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
  // Sesión 23
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
        label: 'POSMAN completo',
        instruction: 'POSMAN completo.',
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
  // Sesión 24
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
        label: 'POSMAN completo',
        instruction: 'POSMAN con atención táctil.',
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
  // Sesión 25
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
        label: 'POSMAN completo',
        instruction: 'POSMAN completo.',
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
  // Sesión 26
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
        label: 'POSMAN completo',
        instruction: 'POSMAN.',
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
  // Sesión 27
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
        label: 'POSMAN completo',
        instruction: 'POSMAN.',
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
  // Sesión 28
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
        label: 'POSMAN completo',
        instruction: 'POSMAN.',
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
  // Sesión 29
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
        label: 'POSMAN completo',
        instruction: 'POSMAN.',
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
  // Sesión 30
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
        label: 'POSMAN completo',
        instruction: 'POSMAN.',
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
  }
]