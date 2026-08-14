// lib/interpretaciones/bdi2.ts

export interface InterpretacionSeveridad {
  nivel: string
  descripcion: string
  recomendacion: string
}

export function getInterpretacionSeveridad(puntaje: number): InterpretacionSeveridad {
  if (puntaje >= 0 && puntaje <= 13) {
    return {
      nivel: "Depresión Mínima",
      descripcion: "El puntaje obtenido se encuentra dentro del rango de depresión mínima. Esto indica que el evaluado no presenta sintomatología depresiva significativa en el momento de la evaluación. Las puntuaciones en este rango son consideradas normales en la población general y no sugieren la necesidad de intervención clínica por depresión. Es posible que el evaluado experimente algunos síntomas aislados, pero no cumplen con la frecuencia o intensidad para ser considerados clínicamente significativos.",
      recomendacion: "Se recomienda mantener un seguimiento periódico de salud mental como parte del autocuidado general."
    }
  } else if (puntaje >= 14 && puntaje <= 19) {
    return {
      nivel: "Depresión Leve",
      descripcion: "La puntuación se ubica en el rango de depresión leve. Esto sugiere la presencia de algunos síntomas depresivos que pueden estar afectando el estado de ánimo y el funcionamiento diario del evaluado, aunque de manera moderada. Síntomas como tristeza ocasional, pérdida de interés en actividades, fatiga o alteraciones del sueño pueden estar presentes. Aunque no es una condición severa, se recomienda considerar intervenciones psicoeducativas y seguimiento clínico para prevenir la progresión de los síntomas.",
      recomendacion: "Se sugiere intervención psicoeducativa, activación conductual y monitoreo del estado de ánimo cada 2-3 meses."
    }
  } else if (puntaje >= 20 && puntaje <= 28) {
    return {
      nivel: "Depresión Moderada",
      descripcion: "La puntuación total indica un nivel de depresión moderada. Esto refleja una presencia significativa de síntomas depresivos que probablemente están interfiriendo con el funcionamiento cotidiano del evaluado en áreas como el trabajo, los estudios o las relaciones interpersonales. Síntomas como anhedonia (pérdida de placer), alteraciones del sueño y apetito, sentimientos de culpa o inutilidad, y fatiga significativa son comunes en este rango.",
      recomendacion: "Se recomienda encarecidamente una evaluación clínica más profunda y considerar intervenciones psicoterapéuticas estructuradas (como Terapia Cognitivo-Conductual)."
    }
  } else {
    return {
      nivel: "Depresión Grave",
      descripcion: "El puntaje obtenido se encuentra en el rango de depresión grave. Esto indica una sintomatología depresiva severa que está causando un deterioro significativo en múltiples áreas de la vida del evaluado. Los síntomas como ideación suicida, desesperanza, agitación o retraso psicomotor, y una afectación profunda del estado de ánimo son característicos de este nivel.",
      recomendacion: "Se requiere una intervención clínica inmediata e intensiva. Derivar para evaluación psiquiátrica y considerar un plan de tratamiento integral que puede incluir psicoterapia y medicación."
    }
  }
}

export function getInterpretacionDimension(nombre: string, puntaje: number, maximo: number): string {
  const porcentaje = (puntaje / maximo) * 100
  if (nombre === "Cognitivo-Afectivo") {
    if (porcentaje >= 60) {
      return `La dimensión Cognitivo-Afectiva (${puntaje}/${maximo}) refleja un procesamiento negativo significativo de uno mismo, del mundo y del futuro. Agrupa síntomas relacionados con el estado de ánimo disfórico (tristeza), la anhedonia (pérdida de placer), la autodesvalorización (culpa, inutilidad), el pesimismo y la ideación suicida. Una puntuación elevada en esta dimensión sugiere un patrón de pensamiento negativo automático que puede perpetuar el malestar emocional.`
    } else if (porcentaje >= 30) {
      return `La dimensión Cognitivo-Afectiva (${puntaje}/${maximo}) muestra un nivel moderado de síntomas. Se observan algunos patrones de pensamiento negativo que podrían estar influyendo en el estado de ánimo, aunque no de manera generalizada.`
    } else {
      return `La dimensión Cognitivo-Afectiva (${puntaje}/${maximo}) se encuentra en un rango bajo, indicando ausencia de pensamientos negativos significativos. El evaluado mantiene una visión equilibrada de sí mismo, el mundo y el futuro.`
    }
  } else if (nombre === "Somático-Motivacional") {
    if (porcentaje >= 60) {
      return `La dimensión Somática (${puntaje}/${maximo}) muestra una alta presencia de manifestaciones físicas de la depresión, como pérdida de energía, alteraciones del sueño, cambios en el apetito y fatiga. Una puntuación elevada en esta dimensión puede indicar la necesidad de una evaluación médica para descartar causas orgánicas.`
    } else if (porcentaje >= 30) {
      return `La dimensión Somática (${puntaje}/${maximo}) muestra un nivel moderado de síntomas físicos. Se recomienda monitorear posibles alteraciones del sueño, apetito y energía.`
    } else {
      return `La dimensión Somática (${puntaje}/${maximo}) se encuentra en un rango bajo, indicando ausencia de manifestaciones físicas significativas asociadas a la depresión.`
    }
  } else {
    if (porcentaje >= 60) {
      return `La puntuación en Ideación Suicida (${puntaje}/${maximo}) es elevada. Esto requiere atención clínica inmediata y evaluación de riesgo.`
    } else if (porcentaje >= 30) {
      return `La puntuación en Ideación Suicida (${puntaje}/${maximo}) es moderada. Se recomienda explorar en profundidad durante la entrevista clínica.`
    } else {
      return `La puntuación en Ideación Suicida (${puntaje}/${maximo}) es baja, indicando ausencia de pensamientos suicidas significativos.`
    }
  }
}

export function getConclusionGeneral(puntaje: number, severityLabel: string, nombrePaciente: string): string {
  const interpretacion = getInterpretacionSeveridad(puntaje)
  return `${nombrePaciente || 'El evaluado'} presenta un cuadro de ${interpretacion.nivel.toLowerCase()} según el BDI-II, con una puntuación total de ${puntaje} puntos. ${interpretacion.descripcion} ${interpretacion.recomendacion} Es importante destacar que este instrumento es una medida de tamizaje, no un diagnóstico definitivo. Cualquier plan de intervención debe basarse en una evaluación clínica integral que considere el contexto biopsicosocial del evaluado. El presente informe debe ser interpretado por un profesional de la salud mental capacitado.`
}