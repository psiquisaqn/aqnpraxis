// @ts-nocheck
/**
 * AQN Praxis — PDPI: Programa de Desarrollo del Pensamiento Inteligente
 * Autor: Ps. Juan Francisco Sotomayor Julio — Psiquis AQN
 *
 * 59 sesiones (0–58). Sesiones 0–40 según documento original.
 * Sesiones 41–58 completadas por AQN Praxis manteniendo la estructura,
 * el estilo pedagógico y la progresión didáctica del autor.
 *
 * Estructura estándar por sesión:
 *   a) Activación TP-CREM
 *   b) Focalización POSMAN
 *   c) Actividad central
 *   d) Extensión / cierre
 *
 * Sistema de niveles de logro (AQN):
 *   1: No lo logra
 *   2: Logros mínimos, solo con ayuda
 *   3: Logros mínimos sin ayuda / logros moderados con ayuda
 *   4: Logros moderados sin ayuda / logros suficientes con ayuda
 *   5: Logros suficientes sin ayuda / logros sobresalientes con ayuda
 *   6: Logros sobresalientes sin ayuda
 */

export interface PdpiActivity {
  step: string          // "a" | "b" | "c" | "d" | "e" | "f" | "g"
  label: string         // Título corto para el panel
  instruction: string   // Texto completo para pantalla evaluado
  display?: {           // Contenido visual para pantalla del evaluado
    type: 'text' | 'image_prompt' | 'breathing_timer' | 'hands_guide' | 'meditation'
    content: string
    duration_sec?: number
  }
  psychologist_note?: string  // Indicación privada para el psicólogo
}

export interface PdpiSession {
  id: number
  area: string
  element: string
  objective: string
  activities: PdpiActivity[]
  achievement_domains: string[]  // qué observar para el nivel de logro
  completed_by_aqn?: boolean     // true = completada por el equipo AQN
}

// ─── Sesiones 41–58: completadas por equipo AQN ──────────────────────────

const SESSIONS_41_58: PdpiSession[] = [

  // ── 41 ──────────────────────────────────────────────────────────────────
  {
    id: 41, area: 'Síntesis', element: 'Resumir / Relacionar / Unir',
    objective: 'Ejercitar la capacidad de extraer la idea central de un texto y relacionarla con el conocimiento previo del estudiante.',
    completed_by_aqn: true,
    activities: [
      { step:'a', label:'TP-CREM',
        instruction:'Realiza 3 respiraciones conscientes completas. Inhala por la nariz, exhala por la nariz. Enfoca tu atención únicamente en el movimiento de tu respiración.',
        display:{ type:'breathing_timer', content:'Respiración consciente — 3 ciclos', duration_sec:60 } },
      { step:'b', label:'POSMAN',
        instruction:'Pauta de ejercicios POSMAN: frotación de manos, digitación cruzada y trenzado de dedos. Realiza cada movimiento con atención plena.',
        display:{ type:'hands_guide', content:'POSMAN — focalización dactilar' } },
      { step:'c', label:'El extracto y la idea núcleo',
        instruction:'Leerás un texto breve. Tu tarea es identificar y escribir en una sola oración cuál es la idea más importante del texto. Luego escribe una segunda oración que relacione esa idea con algo que ya sabes o has vivido.',
        display:{ type:'text', content:'Lee con atención. Cuando termines, escribe: (1) La idea más importante del texto. (2) Cómo se relaciona con algo que tú ya sabes o has vivido.' },
        psychologist_note:'Presenta texto de 100-150 palabras apropiado para la edad. Evalúa si el participante puede distinguir la idea principal de los detalles secundarios.' },
      { step:'d', label:'Síntesis en una imagen',
        instruction:'Ahora dibuja en una sola imagen lo que entendiste del texto. La imagen debe representar la idea central que identificaste. Comparte tu dibujo con el grupo y explica tu elección.',
        psychologist_note:'Observar si la imagen sintetiza o si reproduce detalles. Nivel 5-6: imagen abstracta que captura el concepto.' },
    ],
    achievement_domains: ['Identifica idea principal', 'Relaciona con conocimiento previo', 'Síntesis gráfica coherente'],
  },

  // ── 42 ──────────────────────────────────────────────────────────────────
  {
    id: 42, area: 'Síntesis', element: 'Resumir / Relacionar',
    objective: 'Ejercitar la síntesis comparativa: encontrar elementos comunes entre dos textos o situaciones distintas.',
    completed_by_aqn: true,
    activities: [
      { step:'a', label:'TP-CREM', instruction:'Respiración consciente con conteo hasta 5. Postura sentada, espalda recta, manos sobre rodillas. Cierra los ojos. Inhala y exhala por la nariz, contando cada respiración completa.',
        display:{ type:'breathing_timer', content:'Respiración consciente — conteo hasta 5', duration_sec:90 } },
      { step:'b', label:'POSMAN', instruction:'Ejercicios de digitación cruzada. Cada dedo de una mano toca los de la opuesta. Realiza la secuencia completa con atención plena.',
        display:{ type:'hands_guide', content:'POSMAN — digitación cruzada' } },
      { step:'c', label:'El puente entre dos mundos',
        instruction:'Se te presentarán dos textos breves sobre temas diferentes. Encuentra al menos tres cosas que ambos textos tienen en común. Escríbelas en forma de lista. Luego escribe una oración que las una a las tres.',
        display:{ type:'text', content:'Texto A y Texto B. Encuentra 3 elementos en común. Escríbelos. Luego escribe una oración que los una a todos.' },
        psychologist_note:'Usar textos con conexión no obvia: ej. un texto sobre la migración de aves y uno sobre el viaje de los astronautas. El nivel 5-6 logra conexiones conceptuales profundas, no solo superficiales.' },
      { step:'d', label:'Mapa de conexiones',
        instruction:'Dibuja un mapa con los dos textos en los extremos y, en el centro, las ideas que los conectan. Usa flechas para unir las ideas comunes.',
        psychologist_note:'Variante: el participante puede hacerlo como diagrama de Venn.' },
    ],
    achievement_domains: ['Identificación de elementos comunes', 'Abstracción de la conexión', 'Representación del mapa conceptual'],
  },

  // ── 43 ──────────────────────────────────────────────────────────────────
  {
    id: 43, area: 'Síntesis', element: 'Proposiciones',
    objective: 'Aprender a formular proposiciones: afirmaciones claras, verificables y bien construidas sobre un tema.',
    completed_by_aqn: true,
    activities: [
      { step:'a', label:'TP-CREM', instruction:'Respiración consciente con conteo hasta 7. Postura recostada o sentada. Manos entrecruzadas sobre el abdomen. Inhala expandiendo el abdomen, exhala contrayéndolo.',
        display:{ type:'breathing_timer', content:'Respiración abdominal — conteo hasta 7', duration_sec:120 } },
      { step:'b', label:'POSMAN', instruction:'Frotación de manos: palma con palma en movimiento circular, luego dorso con dorso. 20 tiempos cada dirección.',
        display:{ type:'hands_guide', content:'POSMAN — frotación bilateral' } },
      { step:'c', label:'¿Eso es verdad o es opinión?',
        instruction:'Se te presentarán 10 frases. Para cada una decide: ¿es una proposición (algo que se puede comprobar como verdadero o falso) o es una opinión (algo que depende de quien lo dice)? Luego escribe 3 proposiciones tuyas sobre un tema que conozcas bien.',
        display:{ type:'text', content:'Para cada frase: ¿Es una PROPOSICIÓN (verificable) o una OPINIÓN (personal)?\n\nLuego escribe 3 proposiciones tuyas propias.' },
        psychologist_note:'Ejemplos de frases: "Los perros son mejores que los gatos" (opinión), "El agua hierve a 100°C al nivel del mar" (proposición). Ajustar dificultad según edad.' },
      { step:'d', label:'El debate de proposiciones',
        instruction:'Elige una de tus proposiciones y defíendela con al menos dos argumentos ante el grupo. Luego escucha si alguien puede refutarla.',
        psychologist_note:'Observar capacidad de sostener una proposición con evidencia vs. solo con emoción.' },
    ],
    achievement_domains: ['Distingue proposición de opinión', 'Construye proposiciones propias', 'Defiende con argumentos'],
  },

  // ── 44 ──────────────────────────────────────────────────────────────────
  {
    id: 44, area: 'Deducción', element: 'De lo general a lo particular',
    objective: 'Ejercitar el razonamiento deductivo: partir de una regla o principio general para llegar a una conclusión particular.',
    completed_by_aqn: true,
    activities: [
      { step:'a', label:'TP-CREM', instruction:'Respiración consciente. Postura sentada en silla. Espalda recta. Inhala por la nariz 3 tiempos, sostén 12 tiempos, exhala 6 tiempos. Repite 3 veces.',
        display:{ type:'breathing_timer', content:'Respiración rítmica 3 · 12 · 6', duration_sec:90 } },
      { step:'b', label:'POSMAN', instruction:'Trenzado de dedos: une los dedos de ambas manos. Levanta cada dedo comenzando por el pulgar derecho hasta completar todos. Repite en orden inverso.',
        display:{ type:'hands_guide', content:'POSMAN — trenzado y secuencia' } },
      { step:'c', label:'Si todos… entonces…',
        instruction:'El psicólogo te dará una regla general (por ejemplo: "Todos los mamíferos son de sangre caliente. El delfín es un mamífero."). Tu tarea es llegar a la conclusión particular que se desprende de esa regla. Resuelve 5 ejercicios de este tipo.',
        display:{ type:'text', content:'Lee la regla y el caso particular.\n¿Qué conclusión se puede deducir?\n\nRecuerda: la conclusión DEBE seguirse de las premisas.' },
        psychologist_note:'Ejercicios de silogismo básico. Graduar dificultad: primero con contenido concreto (animales, objetos), luego con contenido abstracto (conceptos).' },
      { step:'d', label:'Inventa un silogismo',
        instruction:'Crea tú un silogismo: escribe una regla general, un caso particular, y la conclusión que se desprende. Compártelo con el grupo para que lo evalúen.',
        psychologist_note:'Nivel 5-6: el participante crea silogismos válidos con contenido original y detecta silogismos inválidos de sus compañeros.' },
    ],
    achievement_domains: ['Aplica regla general al caso', 'Valida la conclusión', 'Construye silogismo propio'],
  },

  // ── 45 ──────────────────────────────────────────────────────────────────
  {
    id: 45, area: 'Deducción', element: 'De lo general a lo particular',
    objective: 'Profundizar el razonamiento deductivo aplicado a situaciones cotidianas y dilemas prácticos.',
    completed_by_aqn: true,
    activities: [
      { step:'a', label:'TP-CREM', instruction:'Respiración consciente con conteo hasta 10 en ciclo ascendente (1,3,5,7,10) y luego descendente (7,5,3,1). Postura sentada o recostada.',
        display:{ type:'breathing_timer', content:'Ciclo respiratorio 1→10→1', duration_sec:150 } },
      { step:'b', label:'POSMAN', instruction:'Pauta completa de POSMAN: digitación cruzada, frotación, trenzado. Realiza cada ejercicio con los ojos cerrados.',
        display:{ type:'hands_guide', content:'POSMAN — secuencia completa, ojos cerrados' } },
      { step:'c', label:'El detective deductivo',
        instruction:'Se te presentará una situación cotidiana con una regla implícita. Debes descubrir qué regla general está en juego y luego deducir qué debería ocurrir en 3 casos particulares nuevos que se te presentarán.',
        display:{ type:'text', content:'Lee la situación.\n1. ¿Qué regla general está implícita?\n2. Aplica esa regla a los 3 casos nuevos.\n3. ¿Hay algún caso donde la regla falla?' },
        psychologist_note:'Ejemplo: "Cada vez que llueve, los niños juegan adentro. Hoy llueve. ¿Dónde juegan los niños?" Luego: "¿Qué pasa si llueve pero están en un parque cubierto?"' },
      { step:'d', label:'Límites de la deducción',
        instruction:'Reflexiona: ¿Puede la deducción equivocarse? Busca un ejemplo real en tu vida donde seguiste una regla general pero el resultado particular fue inesperado.',
        psychologist_note:'Objetivo metacognitivo: que el participante reconozca que la deducción es válida solo si las premisas son verdaderas.' },
    ],
    achievement_domains: ['Identifica regla implícita', 'Aplica a casos nuevos', 'Reconoce excepciones'],
  },

  // ── 46 ──────────────────────────────────────────────────────────────────
  {
    id: 46, area: 'Deducción', element: 'De tesis general a conclusiones particulares',
    objective: 'Aplicar una tesis o posición general a casos concretos y evaluar la validez de las conclusiones.',
    completed_by_aqn: true,
    activities: [
      { step:'a', label:'TP-CREM', instruction:'Respiración consciente con foco en la Mirada Interior. Cierra los ojos. Observa con serenidad los estímulos visuales y lumínicos que aparezcan en tu oscuridad visual interna.',
        display:{ type:'meditation', content:'Cierra los ojos. Observa con serenidad lo que aparece en tu interior. No fuerces ninguna imagen. Solo contempla.', duration_sec:120 } },
      { step:'b', label:'POSMAN', instruction:'Abraza cada dedo de la mano opuesta contando hasta 10 por dedo. Alterna manos con ojos cerrados.',
        display:{ type:'hands_guide', content:'POSMAN — abrazo dactilar bilateral, ojos cerrados' } },
      { step:'c', label:'De la tesis al mundo real',
        instruction:'Se te presentará una tesis (posición sobre un tema). Tu tarea es derivar al menos 4 conclusiones particulares que se desprenderían de esa tesis si fuera verdadera. Luego elige una conclusión y busca un ejemplo real que la apoye y uno que la refute.',
        display:{ type:'text', content:'TESIS presentada por el psicólogo.\n\nDeriva 4 conclusiones particulares.\nPara una de ellas:\n• Un ejemplo que la APOYA\n• Un ejemplo que la REFUTA' },
        psychologist_note:'Ejemplo de tesis: "El juego es la forma más natural de aprendizaje." Las conclusiones deben ser específicas: ej. "Los niños que juegan más aprenden vocabulario más amplio."' },
      { step:'d', label:'¿Cuándo falla la tesis?',
        instruction:'Piensa en al menos dos condiciones en las que la tesis NO funcionaría. ¿Qué necesitaría cambiar en el mundo para que dejara de ser válida?',
        psychologist_note:'Nivel 5-6: el participante puede formular contrargumentos sin que la tesis original les parezca absurda, manteniendo respeto por la complejidad.' },
    ],
    achievement_domains: ['Deriva conclusiones desde tesis', 'Encuentra ejemplos de apoyo y refutación', 'Identifica condiciones de fallo'],
  },

  // ── 47 ──────────────────────────────────────────────────────────────────
  {
    id: 47, area: 'Inducción', element: 'De lo particular a lo general',
    objective: 'Ejercitar el razonamiento inductivo: observar casos particulares para formular una regla o patrón general.',
    completed_by_aqn: true,
    activities: [
      { step:'a', label:'TP-CREM', instruction:'Respiración consciente con conexión emocional (E9). Inhala profundo y pregúntate: ¿qué siento en este momento? Exhala y observa tus emociones sin juzgarlas.',
        display:{ type:'breathing_timer', content:'Respiración + conexión emocional. ¿Qué siento al respirar?', duration_sec:90 } },
      { step:'b', label:'POSMAN', instruction:'Pauta completa de activación. Frotación de manos, digitación, trenzado. Aumenta la velocidad en la segunda repetición.',
        display:{ type:'hands_guide', content:'POSMAN — velocidad progresiva' } },
      { step:'c', label:'¿Qué tienen todos en común?',
        instruction:'Observarás una serie de 6 objetos, imágenes o situaciones. Tu tarea es encontrar la regla que los une a todos. Escríbela en una sola oración. Luego presenta 2 casos nuevos que también cumplan esa regla.',
        display:{ type:'text', content:'Observa los 6 elementos.\n1. ¿Qué regla o patrón los une a todos?\n2. Escríbela en una sola oración.\n3. Propón 2 casos nuevos que también la cumplan.' },
        psychologist_note:'Usar series con patrones no obvios. Ej: imágenes de araña, ola del mar, red de internet, árbol ramificado → respuesta inductiva: "todos tienen estructura de red o ramificación."' },
      { step:'d', label:'La trampa de la inducción',
        instruction:'¿Puede una regla que funciona para 6 casos ser falsa? Busca en tu serie un caso donde la regla podría no cumplirse. ¿Cuántos casos necesitas ver para estar seguro de la regla?',
        psychologist_note:'Introduce el concepto de "cisne negro" de forma accesible según la edad.' },
    ],
    achievement_domains: ['Identifica patrón inductivo', 'Formula la regla general', 'Reconoce límites de la inducción'],
  },

  // ── 48 ──────────────────────────────────────────────────────────────────
  {
    id: 48, area: 'Inducción', element: 'De lo particular a lo general',
    objective: 'Aplicar la inducción a fenómenos cotidianos del entorno inmediato del participante.',
    completed_by_aqn: true,
    activities: [
      { step:'a', label:'TP-CREM', instruction:'Respiración consciente con conexión auditiva (E7). Tapa el oído derecho con la mano derecha. Escucha el sonido de tu respiración. Cuenta 5 ciclos. Luego tapa el oído izquierdo. Cuenta 5 más.',
        display:{ type:'breathing_timer', content:'Escucha el sonido de tu respiración. Oído derecho tapado (5 ciclos) → oído izquierdo tapado (5 ciclos).', duration_sec:120 } },
      { step:'b', label:'POSMAN', instruction:'Frotación simultánea palma con palma de forma circular hacia adelante y luego hacia atrás. 20 tiempos cada dirección.',
        display:{ type:'hands_guide', content:'POSMAN — frotación circular bilateral' } },
      { step:'c', label:'El diario de patrones',
        instruction:'Piensa en tu semana. Describe 4 situaciones que hayas vivido que parezcan diferentes entre sí. Ahora encuentra una característica común a todas. Formula una regla general que las explique. ¿Podrías predecir algo nuevo con esa regla?',
        display:{ type:'text', content:'Describe 4 situaciones de tu semana.\n→ ¿Qué tienen en común?\n→ Formula una regla general.\n→ ¿Qué predicción harías con esa regla?' },
        psychologist_note:'El valor de este ejercicio es la transferencia personal: el participante usa su propia vida como material de análisis inductivo.' },
      { step:'d', label:'Comparte y contrasta',
        instruction:'Comparte tu regla con el grupo. ¿Les pasa lo mismo a ellos? ¿La regla se sostiene para todos o solo para ti? ¿Qué dice eso sobre las reglas generales?',
        psychologist_note:'Fomentar la conversación sobre diferencias individuales y subjetividad en la inducción.' },
    ],
    achievement_domains: ['Extrae patrón de experiencia propia', 'Formula regla transferible', 'Evalúa validez grupal'],
  },

  // ── 49 ──────────────────────────────────────────────────────────────────
  {
    id: 49, area: 'Inducción', element: 'De lo particular a lo general',
    objective: 'Combinar inducción y síntesis para construir una hipótesis propia sobre un tema de interés.',
    completed_by_aqn: true,
    activities: [
      { step:'a', label:'TP-CREM', instruction:'Respiración consciente completa incluyendo E1 a E9. Postura de loto, ambas manos sobre el ombligo. Recorre mentalmente cada componente: movimiento, conteo, postura, mirada interior, sensación, sonido, tacto, emoción.',
        display:{ type:'breathing_timer', content:'Integración E1-E9. Recorre cada componente en cada respiración.', duration_sec:180 } },
      { step:'b', label:'POSMAN', instruction:'Secuencia completa con ojos cerrados. Digit ación, frotación, trenzado. Máxima atención.',
        display:{ type:'hands_guide', content:'POSMAN completo — ojos cerrados' } },
      { step:'c', label:'Mi hipótesis',
        instruction:'Elige un tema que te llame la atención: puede ser algo del mundo natural, social, o de tu vida. Describe al menos 3 casos particulares que hayas observado. A partir de ellos, formula una hipótesis: una afirmación general que podría explicar esos casos. ¿Cómo la pondrías a prueba?',
        display:{ type:'text', content:'1. Elige un tema.\n2. Describe 3 casos que hayas observado.\n3. Formula una hipótesis que los explique.\n4. ¿Cómo la podrías comprobar?' },
        psychologist_note:'Este es el ejercicio más avanzado de inducción. Un buen indicador de nivel 6: el participante formula una hipótesis falseable y propone un método de comprobación genuino.' },
      { step:'d', label:'Presentación de hipótesis',
        instruction:'Presenta tu hipótesis al grupo como si fuera un proyecto de investigación. Título, observaciones, hipótesis, y método de comprobación.',
        psychologist_note:'Puede quedar como proyecto de seguimiento para sesiones futuras.' },
    ],
    achievement_domains: ['Formula hipótesis inductiva', 'Conecta observaciones con la hipótesis', 'Propone método de comprobación'],
  },

  // ── 50 ──────────────────────────────────────────────────────────────────
  {
    id: 50, area: 'Redacción', element: 'Palabra y frase',
    objective: 'Reconocer y ampliar el vocabulario activo; construir frases precisas a partir de palabras nuevas.',
    completed_by_aqn: true,
    activities: [
      { step:'a', label:'TP-CREM', instruction:'Respiración consciente. 3 ciclos de preparación. Postura sentada en silla, espalda recta, manos sobre rodillas.',
        display:{ type:'breathing_timer', content:'Respiración consciente — 3 ciclos de preparación', duration_sec:60 } },
      { step:'b', label:'POSMAN', instruction:'Pauta de activación dactilar: digitación cruzada y frotación. Prepara tus manos para escribir.',
        display:{ type:'hands_guide', content:'POSMAN — activación para escritura' } },
      { step:'c', label:'El banco de palabras',
        instruction:'Se te presentarán 10 palabras que tal vez no conoces. Para cada una: escucha o lee su definición, dibuja una imagen mental de ella, y úsala en una frase corta que tenga sentido para ti. Las frases deben ser tuyas, no copiadas.',
        display:{ type:'text', content:'Palabra → Imagen mental → Frase propia.\n\nLas frases deben:\n✓ Tener sentido\n✓ Usar la palabra correctamente\n✓ Ser creadas por ti' },
        psychologist_note:'Elegir palabras de distintos campos: emociones, naturaleza, ciencia, arte. Nivel 5-6: la frase muestra comprensión profunda, no solo uso superficial.' },
      { step:'d', label:'Categoría de palabras',
        instruction:'De las 10 palabras, agrupa las que crees que pertenecen a la misma categoría. Dale un nombre a cada grupo. ¿Queda alguna palabra sin grupo?',
        psychologist_note:'Conectar con sesiones de categorización anteriores (34-36).' },
    ],
    achievement_domains: ['Comprensión de vocabulario nuevo', 'Construcción de frases propias', 'Categorización léxica'],
  },

  // ── 51 ──────────────────────────────────────────────────────────────────
  {
    id: 51, area: 'Redacción', element: 'Frase y oración',
    objective: 'Distinguir entre frase y oración; construir oraciones completas con sujeto, verbo y complemento.',
    completed_by_aqn: true,
    activities: [
      { step:'a', label:'TP-CREM', instruction:'Respiración consciente con conteo hasta 5. Ojos cerrados, mirada interior.',
        display:{ type:'breathing_timer', content:'Respiración + mirada interior — conteo hasta 5', duration_sec:90 } },
      { step:'b', label:'POSMAN', instruction:'Encoge y extiende alternadamente cada dedo de ambas manos comenzando por el pulgar derecho hasta el meñique izquierdo. Luego en sentido inverso.',
        display:{ type:'hands_guide', content:'POSMAN — extensión y flexión dactilar progresiva' } },
      { step:'c', label:'Frase incompleta → oración completa',
        instruction:'Se te darán 8 frases incompletas. Tu tarea es transformar cada una en una oración completa agregando lo que falta (sujeto, verbo o complemento). Luego escribe 3 oraciones completamente tuyas sobre lo que estás sintiendo en este momento.',
        display:{ type:'text', content:'Completa cada frase hasta convertirla en una oración.\n\nUna oración completa tiene:\n• Sujeto (¿quién?)\n• Verbo (¿qué hace?)\n• Complemento (¿cómo, cuándo, dónde?)' },
        psychologist_note:'Frases ejemplo: "El perro grande…" / "…corrió por el parque" / "Cuando llueve…". Las 3 oraciones propias son el indicador principal de nivel de logro.' },
      { step:'d', label:'La oración más difícil',
        instruction:'Escribe la oración más compleja que puedas: que tenga dos verbos, dos sujetos distintos y un conector. Léela en voz alta al grupo.',
        psychologist_note:'No corregir la oración si tiene sentido, aunque sea gramaticalmente imperfecta. El objetivo es la complejidad del pensamiento expresado.' },
    ],
    achievement_domains: ['Distingue frase de oración', 'Completa oraciones con coherencia', 'Construye oración compleja propia'],
  },

  // ── 52 ──────────────────────────────────────────────────────────────────
  {
    id: 52, area: 'Redacción', element: 'Oración y vocativo',
    objective: 'Aprender a dirigirse a alguien con claridad y pertinencia; usar el vocativo para personalizar la comunicación escrita y oral.',
    completed_by_aqn: true,
    activities: [
      { step:'a', label:'TP-CREM', instruction:'Respiración consciente con foco auditivo (E7) y emocional (E9). Cuenta 7 respiraciones. En cada una, escucha el sonido de tu respiración y observa qué emoción te genera.',
        display:{ type:'breathing_timer', content:'Respiración + escucha + emoción — 7 ciclos', duration_sec:120 } },
      { step:'b', label:'POSMAN', instruction:'Frotación de manos simulando lavado. Echamos jabón, jabonamos, enjuagamos, sacudimos. Con atención plena en cada movimiento.',
        display:{ type:'hands_guide', content:'POSMAN — lavado de manos con atención plena' } },
      { step:'c', label:'Te escribo a ti',
        instruction:'Escribe 3 oraciones, cada una dirigida a una persona diferente (un amigo, una persona mayor, alguien que no conoces). Usa el vocativo: el nombre o forma de llamar a quien escribes debe aparecer en la oración. Observa cómo cambia el tono según a quién le escribes.',
        display:{ type:'text', content:'Escribe una oración para:\n1. Un amigo o amiga\n2. Una persona mayor\n3. Alguien que no conoces\n\nEl nombre o forma de llamarle debe aparecer en cada oración.' },
        psychologist_note:'Ejemplo: "Juan, no olvides traer tu cuaderno." vs "Estimado señor, agradeceré su respuesta." Observar si el participante ajusta el registro según el destinatario.' },
      { step:'d', label:'La carta mínima',
        instruction:'Escribe una carta de 5 oraciones a alguien importante para ti. Usa el vocativo al inicio. Expresa al menos una idea, una pregunta y una despedida.',
        psychologist_note:'Esta actividad puede usarse para seguimiento terapéutico: la carta puede enviarse o guardarse como ejercicio de expresión emocional.' },
    ],
    achievement_domains: ['Usa vocativo correctamente', 'Adapta registro al destinatario', 'Estructura carta mínima'],
  },

  // ── 53 ──────────────────────────────────────────────────────────────────
  {
    id: 53, area: 'Redacción', element: 'Vocativo y párrafo',
    objective: 'Construir un párrafo coherente con idea principal, desarrollo y cierre, usando el vocativo como punto de partida.',
    completed_by_aqn: true,
    activities: [
      { step:'a', label:'TP-CREM', instruction:'Respiración consciente. Postura de loto o sentada. Ambas manos sobre el ombligo. Conteo hasta 10, ciclo ascendente y descendente.',
        display:{ type:'breathing_timer', content:'Respiración abdominal — ciclo 1 a 10 y de vuelta a 1', duration_sec:150 } },
      { step:'b', label:'POSMAN', instruction:'Digitación cruzada completa, aumentando velocidad en cada ciclo. 3 ciclos.',
        display:{ type:'hands_guide', content:'POSMAN — digitación cruzada progresiva (3 ciclos)' } },
      { step:'c', label:'El párrafo completo',
        instruction:'Elige a alguien y escríbele un párrafo de 4 a 6 oraciones. El párrafo debe tener: (1) una oración de apertura con vocativo, (2) al menos 2 oraciones que desarrollen una idea, (3) una oración de cierre. Lee el párrafo en voz alta y evalúa si suena completo.',
        display:{ type:'text', content:'Estructura del párrafo:\n\n[Apertura con vocativo]\n[Desarrollo: 2 oraciones]\n[Cierre]\n\nLéelo en voz alta. ¿Suena completo?' },
        psychologist_note:'El criterio de "sonar completo" al leerse en voz alta es uno de los mejores indicadores de cohesión textual para cualquier nivel educativo.' },
      { step:'d', label:'El párrafo del otro',
        instruction:'Intercambia tu párrafo con un compañero. Lee el de tu compañero y dile: una cosa que le quedó bien y una sugerencia de mejora.',
        psychologist_note:'Nivel 5-6: la retroalimentación es específica y constructiva, no solo "está bien" o "le falta algo."' },
    ],
    achievement_domains: ['Estructura párrafo con coherencia', 'Usa vocativo como apertura', 'Da retroalimentación específica'],
  },

  // ── 54 ──────────────────────────────────────────────────────────────────
  {
    id: 54, area: 'Redacción', element: 'Párrafo y texto',
    objective: 'Integrar párrafos para construir un texto breve con introducción, desarrollo y conclusión.',
    completed_by_aqn: true,
    activities: [
      { step:'a', label:'TP-CREM', instruction:'Sesión de reflexión consciente (E11). Respira 5 ciclos completos. Luego reflexiona en voz baja: ¿Qué has aprendido en este programa? ¿Qué te llevará contigo?',
        display:{ type:'meditation', content:'Respira 5 ciclos.\nLuego reflexiona: ¿Qué has aprendido? ¿Qué te llevas contigo?', duration_sec:120 } },
      { step:'b', label:'POSMAN', instruction:'Pauta completa de POSMAN como ritual de apertura. Frotación, digitación, trenzado.',
        display:{ type:'hands_guide', content:'POSMAN — ritual completo de apertura' } },
      { step:'c', label:'Mi primer texto',
        instruction:'Escribe un texto de 3 párrafos sobre un tema que tú elijas. El texto debe tener: un párrafo de introducción (¿de qué trata?), un párrafo de desarrollo (¿qué quieres decir sobre eso?), y un párrafo de conclusión (¿qué concluyes o qué propones?). Mínimo 12 oraciones en total.',
        display:{ type:'text', content:'PÁRRAFO 1: Introducción\n¿De qué vas a escribir? ¿Por qué es importante?\n\nPÁRRAFO 2: Desarrollo\n¿Qué quieres decir sobre ese tema?\n\nPÁRRAFO 3: Conclusión\n¿Qué concluyes? ¿Qué propones?' },
        psychologist_note:'La elección del tema es libre y significativa. El contenido elegido es material clínico valioso. No corregir gramática en esta sesión; valorar la estructura y la expresión.' },
      { step:'d', label:'Lectura en voz alta',
        instruction:'Lee tu texto completo al grupo. El grupo escucha sin interrumpir. Al terminar, cada oyente comparte una sola palabra que le quedó del texto.',
        psychologist_note:'La "palabra que queda" es un ejercicio de escucha activa y síntesis para los oyentes.' },
    ],
    achievement_domains: ['Construye texto de 3 párrafos', 'Mantiene hilo conductor', 'Cierra con conclusión'],
  },

  // ── 55 ──────────────────────────────────────────────────────────────────
  {
    id: 55, area: 'Ubicación geográfica', element: 'Eje terrestre / Zonas climáticas / Continentes / Océanos',
    objective: 'Comprender la estructura básica del planeta Tierra: su inclinación, sus zonas climáticas y la distribución de continentes y océanos.',
    completed_by_aqn: true,
    activities: [
      { step:'a', label:'TP-CREM', instruction:'Respiración consciente con foco visual interior (E10). Cierra los ojos. Imagina la Tierra vista desde el espacio. Observa su forma, sus colores. ¿Cómo se siente contemplarla?',
        display:{ type:'meditation', content:'Cierra los ojos.\nImagina la Tierra desde el espacio.\nObserva su forma, sus colores. ¿Cómo se ve?', duration_sec:90 } },
      { step:'b', label:'POSMAN', instruction:'Pauta completa de activación y focalización.',
        display:{ type:'hands_guide', content:'POSMAN — activación completa' } },
      { step:'c', label:'La Tierra y sus zonas',
        instruction:'El psicólogo presenta el eje terrestre, la inclinación de 23,5°, las zonas climáticas (tropical, templada, polar) y la distribución de continentes y océanos. Luego cada participante recibe un mapa mudo y debe: ubicar los continentes, los océanos principales, el ecuador y los trópicos.',
        display:{ type:'image_prompt', content:'MAPA MUNDI MUDO\n\nUbica:\n• Los 7 continentes\n• Los 5 océanos\n• El Ecuador\n• El Trópico de Cáncer y de Capricornio\n• Los Polos Norte y Sur' },
        psychologist_note:'Proyectar en la pantalla del evaluado el mapa mudo interactivo. El psicólogo guía la ubicación en la pantalla del psicólogo.' },
      { step:'d', label:'¿Dónde estoy yo?',
        instruction:'Ubica Chile en el mapa. ¿En qué zona climática está? ¿Qué océanos lo bordean? ¿Qué continentes tiene como vecinos?',
        psychologist_note:'Conectar con la sesión 58 "Yo, mi familia y el mundo."' },
    ],
    achievement_domains: ['Ubica continentes y océanos', 'Comprende zonas climáticas', 'Ubica Chile en el mundo'],
  },

  // ── 56 ──────────────────────────────────────────────────────────────────
  {
    id: 56, area: 'Ubicación geográfica', element: 'Países / Capitales / Alianzas internacionales',
    objective: 'Reconocer países, sus capitales y las principales alianzas o bloques geopolíticos del mundo actual.',
    completed_by_aqn: true,
    activities: [
      { step:'a', label:'TP-CREM', instruction:'Respiración consciente. Conteo hasta 7. Postura sentada, cómoda.',
        display:{ type:'breathing_timer', content:'Respiración consciente — conteo hasta 7', duration_sec:120 } },
      { step:'b', label:'POSMAN', instruction:'Pauta completa de POSMAN.',
        display:{ type:'hands_guide', content:'POSMAN — activación completa' } },
      { step:'c', label:'El mundo y sus nombres',
        instruction:'Se presentarán 20 países en la pantalla. Para cada uno debes: escribir su capital, ubicarlo en el mapa y mencionar un bloque o alianza al que pertenece (ej: Unión Europea, CELAC, G20, ASEAN, Unión Africana). Trabaja en parejas.',
        display:{ type:'image_prompt', content:'Para cada país:\n1. ¿Cuál es su capital?\n2. Ubícalo en el mapa\n3. ¿A qué bloque o alianza pertenece?\n\nTrabaja con tu compañero/a.' },
        psychologist_note:'Enfatizar países de América Latina primero. Graduar dificultad: comenzar por los que el participante ya conoce.' },
      { step:'d', label:'¿Por qué se forman alianzas?',
        instruction:'Discute con el grupo: ¿por qué los países forman alianzas? ¿Qué ganan? ¿Qué pierden? Piensa en un ejemplo de alianza que encuentres justa y uno que te parezca cuestionable.',
        psychologist_note:'No hay respuesta correcta. Evaluar la capacidad de argumentar y de ver más de un punto de vista.' },
    ],
    achievement_domains: ['Asocia país con capital', 'Ubica en mapa', 'Comprende concepto de alianza'],
  },

  // ── 57 ──────────────────────────────────────────────────────────────────
  {
    id: 57, area: 'Ubicación geográfica', element: 'Chile en el mundo — División política — Características — Historia',
    objective: 'Conocer y representar Chile en su contexto geográfico, político, físico e histórico.',
    completed_by_aqn: true,
    activities: [
      { step:'a', label:'TP-CREM', instruction:'Respiración consciente. Imagina Chile visto desde el espacio: su forma larga y angosta, el desierto al norte, los hielos al sur, la cordillera al este, el océano al oeste.',
        display:{ type:'meditation', content:'Cierra los ojos.\nImagina Chile desde el espacio.\n¿Qué forma tiene? ¿Qué colores ves?\n¿Dónde estás tú dentro de ese territorio?', duration_sec:90 } },
      { step:'b', label:'POSMAN', instruction:'Pauta completa.',
        display:{ type:'hands_guide', content:'POSMAN — activación completa' } },
      { step:'c', label:'Chile: el país largo',
        instruction:'Usando el mapa de Chile, ubica: las 16 regiones y sus capitales, los principales relieves (desierto de Atacama, Valle Central, Patagonia, Antártica), los vecinos (Perú, Bolivia, Argentina), y los hitos históricos más importantes. Dibuja Chile de memoria y coloca al menos 5 elementos.',
        display:{ type:'image_prompt', content:'MAPA DE CHILE — completa:\n• 16 regiones y capitales\n• Desierto / Valle Central / Patagonia\n• Países vecinos\n• Tu ciudad o pueblo\n\nLuego dibuja Chile de memoria.' },
        psychologist_note:'El dibujo de memoria es el indicador principal. Nivel 5-6: dibuja la forma correcta con al menos 5 elementos correctamente ubicados.' },
      { step:'d', label:'¿Qué significa vivir en Chile?',
        instruction:'Reflexiona: ¿qué significa vivir en un país con estas características geográficas? ¿Cómo afecta el territorio a la forma de vivir de las personas? Comparte una reflexión con el grupo.',
        psychologist_note:'Conectar con sesión 58 y con el marco ecológico de las primeras sesiones.' },
    ],
    achievement_domains: ['Ubica regiones y capitales', 'Dibuja Chile de memoria', 'Reflexiona sobre identidad territorial'],
  },

  // ── 58 ──────────────────────────────────────────────────────────────────
  {
    id: 58, area: 'Ubicación geográfica', element: 'Yo, mi familia y el mundo — Mi lugar y el de mi familia',
    objective: 'Integrar el recorrido completo del PDPI conectando la identidad personal, familiar y el lugar en el mundo como cierre del programa.',
    completed_by_aqn: true,
    activities: [
      { step:'a', label:'TP-CREM — Cierre del programa',
        instruction:'Respiración consciente de cierre. Recorre mentalmente todos los ejercicios aprendidos en el programa: E1 a E11. Respira con atención, con la postura correcta, con mirada interior, con conciencia del sonido, del tacto abdominal, de tus emociones, de las imágenes internas. Una última vez, completa.',
        display:{ type:'meditation', content:'Cierre TP-CREM.\nRecorre E1 a E11 en cada respiración.\nInhala todo lo aprendido. Exhala lo que ya no necesitas.', duration_sec:180 } },
      { step:'b', label:'POSMAN — Cierre',
        instruction:'Secuencia completa de POSMAN como ritual de cierre. Lenta, consciente, con atención plena en cada movimiento.',
        display:{ type:'hands_guide', content:'POSMAN — ritual de cierre. Lento y consciente.' } },
      { step:'c', label:'Mi mapa personal',
        instruction:'Crea un mapa que muestre: tu cuerpo en el centro, tu familia alrededor, tu barrio y ciudad, tu país, y el mundo. Conecta cada capa con una flecha y escribe qué aporta cada nivel a quien eres hoy. ¿Qué parte del mundo llevas contigo?',
        display:{ type:'image_prompt', content:'Dibuja tu mapa personal:\n\nYO (centro)\n↕\nMi FAMILIA\n↕\nMi CIUDAD / BARRIO\n↕\nMi PAÍS — CHILE\n↕\nEL MUNDO\n\n¿Qué aporta cada nivel a quien eres hoy?' },
        psychologist_note:'Este es el ejercicio de cierre e integración del programa completo. El mapa personal puede quedar como un objeto de significado terapéutico para el participante.' },
      { step:'d', label:'La carta del futuro',
        instruction:'Escribe una carta breve dirigida a ti mismo/a en el futuro (en 1 año). Cuéntale quién eres hoy, qué aprendiste en este programa, y qué esperas de ti mismo/a para cuando la leas. Guárdala en un sobre. El psicólogo la entregará en el momento acordado.',
        psychologist_note:'Ritual de cierre poderoso. El sobre sellado puede entregarse a la familia para custodiarlo. Programar la fecha de apertura con el participante.' },
      { step:'e', label:'Ceremonia de cierre',
        instruction:'Cada participante comparte una palabra que describa cómo llega al final del programa y una palabra que describa cómo parte. El grupo aplaude a cada participante.',
        psychologist_note:'Sesión de máximo 20 personas. Si el grupo es grande, hacer en pequeños grupos de 4-5.' },
    ],
    achievement_domains: ['Integra identidad personal y territorial', 'Construye mapa personal coherente', 'Escribe carta con proyección futura'],
  },

]

export const PDPI_SESSIONS_41_58 = SESSIONS_41_58

export const ACHIEVEMENT_SCALE = [
  { level: 1, label: 'No lo logra',
    description: 'El participante no alcanza el objetivo de la actividad ni con ayuda del facilitador.',
    color: '#A32D2D' },
  { level: 2, label: 'Logros mínimos con ayuda',
    description: 'El participante alcanza el objetivo mínimo únicamente cuando recibe apoyo o guía directa del facilitador.',
    color: '#993C1D' },
  { level: 3, label: 'Mínimos sin ayuda / moderados con ayuda',
    description: 'Logra los objetivos mínimos de forma autónoma. Alcanza objetivos de dificultad moderada solo con apoyo.',
    color: '#854F0B' },
  { level: 4, label: 'Moderados sin ayuda / suficientes con ayuda',
    description: 'Logra objetivos moderados de forma autónoma. Alcanza los objetivos suficientes solo con apoyo.',
    color: '#5A7A0A' },
  { level: 5, label: 'Suficientes sin ayuda / sobresalientes con ayuda',
    description: 'Logra los objetivos suficientes de forma autónoma. Alcanza logros sobresalientes cuando recibe apoyo.',
    color: '#3B6D11' },
  { level: 6, label: 'Logros sobresalientes sin ayuda',
    description: 'El participante supera los objetivos de la actividad de forma completamente autónoma y muestra comprensión profunda.',
    color: '#0F6E56' },
]
