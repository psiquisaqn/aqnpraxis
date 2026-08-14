// lib/interpretaciones/wisc5.ts

export function getClassification(score: number): string {
  if (score >= 130) return 'Muy Superior'
  if (score >= 120) return 'Superior'
  if (score >= 110) return 'Normal Alto'
  if (score >= 90) return 'Normal Promedio'
  if (score >= 80) return 'Normal Lento'
  if (score >= 70) return 'Funcionamiento Intelectual Limítrofe'
  return 'Extremadamente Bajo'
}

export function getScaledClassification(score: number): string {
  if (score >= 16) return 'Muy Superior'
  if (score >= 14) return 'Superior'
  if (score >= 12) return 'Normal Alto'
  if (score >= 8) return 'Normal Promedio'
  if (score >= 6) return 'Normal Lento'
  if (score >= 4) return 'Funcionamiento Intelectual Limítrofe'
  return 'Extremadamente Bajo'
}

export const SUBTEST_INTERPRETATIONS: Record<string, { Bajo: string; Suficiente: string; Alto: string }> = {
  CC: {
    Bajo: 'Existe confusión o extravío en el mapeo visual de superficies y su división en coordenadas, lo que afecta la coordinación entre representación, percepción y movimiento. Suele presentar dificultades para reproducir modelos a partir de estímulos visuales, con errores de rotación o inversión, y requiere apoyo externo o ensayo-error constante.',
    Suficiente: 'Nivel suficiente: logra reproducir los modelos con precisión aceptable, aunque puede mostrar alguna lentitud o mínimos errores en patrones complejos. La coordinación visomotora es adecuada para tareas cotidianas.',
    Alto: 'Desempeño notable: demuestra una capacidad excepcional para analizar y replicar estructuras geométricas, con rapidez y precisión. Maneja con soltura la rotación mental y la segmentación de superficies.'
  },
  AN: {
    Bajo: 'Presenta dificultades significativas para identificar relaciones semánticas entre conceptos, mostrando escasa capacidad de síntesis y abstracción. Suele responder con asociaciones concretas o tangenciales, y requiere apoyos visuales o ejemplos para establecer comparaciones.',
    Suficiente: 'Capacidad suficiente: identifica relaciones lógicas entre conceptos de uso común y puede establecer categorías básicas. Su pensamiento abstracto está en desarrollo y le permite resolver analogías simples con cierta fluidez.',
    Alto: 'Alto rendimiento: demuestra un pensamiento abstracto refinado, captando relaciones complejas y sutiles entre conceptos. Su razonamiento analógico es rápido, preciso y enriquece su discurso con comparaciones elaboradas.'
  },
  MR: {
    Bajo: 'Confusión en la identificación de secuencias y series, así como en la ilación de elementos en ejes de sentido. Falla al percibir patrones de cambio (tamaño, color, orientación) y tiende a responder al azar o por ensayo-error sin estrategia.',
    Suficiente: 'Manejo suficiente: reconoce patrones visuales y secuencias lógicas en matrices de dificultad moderada. Puede resolver la mayoría de los ítems, aunque con lentitud o dudas en los más complejos.',
    Alto: 'Alto desarrollo: identifica con rapidez y precisión las reglas subyacentes en matrices complejas, incluso con múltiples atributos. Su razonamiento inductivo es muy eficiente.'
  },
  RD: {
    Bajo: 'Confusión o bloqueo en el uso de la memoria de trabajo, con dificultades para retener y manipular secuencias numéricas. Muestra pérdida de información en tareas de atención sostenida y se ve superado fácilmente por la longitud de los estímulos.',
    Suficiente: 'Manejo suficiente: retiene y ordena dígitos en orden directo e inverso con un desempeño acorde a su edad. Aunque puede cometer algún error en secuencias largas, mantiene una estrategia eficaz de repaso.',
    Alto: 'Alto desempeño: exhibe una memoria de trabajo excepcional, manejando secuencias largas con precisión y sin esfuerzo. Además, es capaz de reorganizar la información mentalmente con gran agilidad.'
  },
  CLA: {
    Bajo: 'Desmedro significativo en la velocidad de operatoria mental, lo que repercute en la coordinación visomotora y en la rapidez para procesar estímulos simples. Puede presentar lentitud motriz o fatiga precoz, afectando el número de ítems completados.',
    Suficiente: 'Desempeño suficiente: velocidad de procesamiento adecuada para la edad, completando la tarea en un tiempo razonable y con pocos errores. Mantiene un ritmo constante durante toda la prueba.',
    Alto: 'Manejo notable: gran rapidez y precisión en la copia de símbolos, con una excelente coordinación ojo-mano. Su velocidad de procesamiento está por encima de la media, lo que le permite realizar tareas rutinarias con eficiencia.'
  },
  VOC: {
    Bajo: 'Bloqueo o desinterés en el manejo del repertorio léxico y semántico del medio cultural. Dificultad para definir palabras o para encontrar el término exacto, con discurso telegráfico o impreciso. Muestra poca riqueza expresiva.',
    Suficiente: 'Manejo suficiente: posee un vocabulario funcional para la comunicación diaria, define palabras comunes con precisión y comprende el significado de términos abstractos básicos. Su discurso es coherente y fluido.',
    Alto: 'Alto nivel: dominio léxico amplio y preciso, con capacidad para definir términos complejos y utilizar un lenguaje rico en matices. Su discurso es elaborado, con buen uso de sinónimos y estructuras gramaticales avanzadas.'
  },
  BAL: {
    Bajo: 'Dificultades significativas en la percepción visual de relaciones de equilibrio y equivalencia, con tendencia a saturarse perceptivamente ante estímulos que requieren comparación de pesos. Errores frecuentes al juzgar si dos conjuntos son equivalentes.',
    Suficiente: 'Rendimiento suficiente: percibe correctamente relaciones de equilibrio en la mayoría de los ítems, aunque puede dudar en los que requieren mayor razonamiento cuantitativo. No presenta saturación perceptiva relevante.',
    Alto: 'Manejo notable: percepción visual muy aguda para relaciones de equivalencia, resuelve con rapidez y precisión, incluso en configuraciones complejas. Muestra una excelente comprensión de la conservación de la masa.'
  },
  RV: {
    Bajo: 'Confusión o extravío en la división y rearticulación geométrica regular e irregular de elementos visuales. Dificultad para descomponer mentalmente figuras y volver a ensamblarlas, con errores de orientación o traslape.',
    Suficiente: 'Nivel suficiente: es capaz de segmentar y recomponer figuras geométricas de complejidad moderada, aunque puede necesitar más tiempo o ensayos en ítems difíciles. Su razonamiento espacial es adecuado.',
    Alto: 'Manejo notable: gran habilidad para analizar y reconstruir mentalmente figuras, incluso con formas irregulares. Su razonamiento visoespacial es rápido y preciso, destacando en tareas de rotación y traslación.'
  },
  RI: {
    Bajo: 'Presenta dificultades para retener y reconocer estímulos visuales complejos después de una breve exposición. Muestra olvidos frecuentes, confusión entre distractores y baja capacidad de almacenamiento visual a corto plazo.',
    Suficiente: 'Desempeño suficiente: recuerda correctamente la mayoría de las imágenes presentadas, con un reconocimiento acorde a su edad. Puede fallar en algunos detalles, pero en general mantiene una memoria visual funcional.',
    Alto: 'Alta capacidad: demuestra una memoria visual excepcional, reteniendo detalles finos y distinguiendo con precisión entre estímulos similares. Su almacenamiento visual es rápido y duradero.'
  },
  BS: {
    Bajo: 'Dificultades en la velocidad de operatoria mental, la agudeza y organización de búsqueda, y la concentración en tareas de esfuerzo visual. Tiende a perderse entre distractores, con alto número de omisiones o errores.',
    Suficiente: 'Desempeño suficiente: realiza la búsqueda de símbolos con velocidad y precisión adecuadas para su edad, aunque puede disminuir el ritmo en ítems más largos. Mantiene una buena atención visual.',
    Alto: 'Notable desarrollo: altísima velocidad y precisión en la búsqueda, con una organización visual muy eficiente. Su capacidad de atención sostenida es sobresaliente, completando la tarea con pocos errores.'
  },
  IN: {
    Bajo: 'Bloqueo o desinterés en el acceso a la información del medio cultural amplio. Muestra lagunas en conocimientos generales básicos, con respuestas evasivas o "no sé" frecuentes.',
    Suficiente: 'Nivel suficiente: posee un bagaje de conocimientos generales acorde a su edad y entorno, respondiendo correctamente a preguntas de cultura general sin dificultad.',
    Alto: 'Alto nivel: demuestra una gran curiosidad y un amplio repertorio de información cultural, respondiendo con precisión y detalles a preguntas complejas. Su memoria a largo plazo para hechos es excelente.'
  },
  SLN: {
    Bajo: 'Dificultad para alternar entre categorías (letras y números) y para retener el orden secuencial. Muestra confusión al reorganizar la información, con errores de omisión o inversión.',
    Suficiente: 'Manejo suficiente: logra ordenar correctamente secuencias mixtas de letras y números en tareas de dificultad media, aunque puede necesitar más tiempo en las más largas.',
    Alto: 'Alto rendimiento: ejecuta con rapidez y sin errores la reorganización de secuencias alfanuméricas, demostrando una excelente flexibilidad cognitiva y memoria de trabajo.'
  },
  CAN: {
    Bajo: 'Dificultad para mantener la atención selectiva y para escanear estímulos visuales de forma organizada. Omite muchos blancos o comete errores por impulsividad, con baja velocidad de procesamiento.',
    Suficiente: 'Desempeño suficiente: realiza la tarea de cancelación con un nivel de atención y organización adecuado, aunque puede tener algún error en estímulos muy densos.',
    Alto: 'Alta precisión: mantiene una atención selectiva sobresaliente, escaneando rápidamente y marcando todos los blancos sin errores. Su control inhibitorio es muy eficaz.'
  },
  COM: {
    Bajo: 'Poca densidad en la habilidad de análisis, la reflexividad y la descripción detallada de elementos complejos. Responde de manera superficial o con respuestas concretas, sin profundizar en causas o implicaciones.',
    Suficiente: 'Nivel suficiente: comprende y explica situaciones sociales o conceptuales con un grado de detalle adecuado, mostrando capacidad de análisis moderada y reflexiva.',
    Alto: 'Alto desarrollo: demuestra un pensamiento crítico refinado, con análisis detallado de situaciones complejas, identificando múltiples perspectivas y consecuencias. Su discurso es reflexivo y rico en matices.'
  },
  ARI: {
    Bajo: 'Dificultades en el cálculo mental inmediato y en el espacio disponible en la memoria de trabajo. Comete errores por pérdida de información intermedia o por falta de estrategias de cálculo.',
    Suficiente: 'Desempeño suficiente: resuelve problemas aritméticos mentales con precisión en un tiempo razonable, utilizando estrategias básicas y manteniendo la información en memoria de trabajo.',
    Alto: 'Notable manejo: realiza cálculos mentales complejos con gran rapidez y exactitud, demostrando un excelente uso de la memoria de trabajo y un razonamiento cuantitativo muy desarrollado.'
  }
}

export function getSubtestInterpretation(code: string, pe: number): string {
  const entry = SUBTEST_INTERPRETATIONS[code]
  if (!entry) return 'No disponible.'
  if (pe >= 12) return entry.Alto
  if (pe >= 8) return entry.Suficiente
  return entry.Bajo
}

export function getInterpretacionIndice(code: string, score: number): string {
  const label: Record<string, string> = {
    ICV: 'Comprensión Verbal',
    IVE: 'Visoespacial',
    IRF: 'Razonamiento Fluido',
    IMT: 'Memoria de Trabajo',
    IVP: 'Velocidad de Procesamiento',
    CIT: 'Coeficiente Intelectual Total'
  }
  const clasif = getClassification(score)
  const desc = {
    ICV: 'evalúa la capacidad de razonamiento verbal, la formación de conceptos y el conocimiento léxico.',
    IVE: 'evalúa la percepción de detalles visuales, la comprensión de relaciones espaciales y la integración visomotora.',
    IRF: 'mide la capacidad de detectar reglas lógicas y relaciones conceptuales, así como el pensamiento abstracto.',
    IMT: 'evalúa la capacidad de registrar, mantener y manipular información activa en la conciencia.',
    IVP: 'mide la rapidez en identificación visual y toma de decisiones, así como la eficiencia en tareas de rastreo visual.',
    CIT: 'representa el funcionamiento cognitivo global del evaluado.'
  }
  const descText = desc[code] || ''
  return `El índice ${label[code] || code} (${score}) se clasifica como "${clasif}". Este índice ${descText}`
}