// lib/interpretaciones/peca.ts

function getShortName(fullName: string): string {
  if (!fullName) return 'El evaluado'
  const parts = fullName.trim().split(/\s+/)
  if (parts.length <= 2) return fullName
  return parts.slice(0, 2).join(' ')
}

export function getInterpretacionParticipacion(porcentaje: number): { nivel: string; descripcion: string; recomendacion: string } {
  if (porcentaje >= 75) {
    return {
      nivel: "Alta Capacidad de Participación",
      descripcion: "El evaluado presenta una alta capacidad de participación y adaptación conductual. Las habilidades adaptativas están bien desarrolladas, permitiendo un funcionamiento independiente en la mayoría de los contextos.",
      recomendacion: "Se recomienda continuar con estrategias de refuerzo positivo y monitoreo periódico."
    }
  } else if (porcentaje >= 50) {
    return {
      nivel: "Nivel Medio de Participación",
      descripcion: "El evaluado muestra un nivel medio de participación en conductas adaptativas. Presenta habilidades funcionales en varias áreas, aunque requiere apoyo ocasional en tareas más complejas.",
      recomendacion: "Se sugiere trabajar en áreas específicas identificadas en las dimensiones con menor puntuación."
    }
  } else if (porcentaje >= 25) {
    return {
      nivel: "Dificultades Significativas",
      descripcion: "El evaluado presenta dificultades significativas en conducta adaptativa. Requiere apoyos sustanciales para desenvolverse en actividades cotidianas.",
      recomendacion: "Se recomienda intervención multidisciplinaria, entrenamiento en habilidades específicas y reevaluación en 3-6 meses."
    }
  } else {
    return {
      nivel: "Requiere Apoyo Intensivo",
      descripcion: "El evaluado requiere apoyo intensivo en conducta adaptativa. Las habilidades para la vida diaria y la interacción social se encuentran severamente afectadas.",
      recomendacion: "Se recomienda derivación a especialistas, programa de intervención individualizado y reevaluación en 3 meses."
    }
  }
}

export function getInterpretacionDimension(nombre: string, puntaje: number, intensidad: string): string {
  const baseDescripcion: Record<string, string> = {
    'com': 'Habilidades de comunicación (lenguaje receptivo y expresivo), capacidad para expresar necesidades y comprender instrucciones.',
    'acu': 'Habilidades académicas funcionales, manejo de conceptos numéricos, lectura y escritura básica para la vida diaria.',
    'avd': 'Actividades de la vida diaria como alimentación, aseo, vestimenta, manejo del hogar y uso de la comunidad.',
    'hs': 'Habilidades sociales para interactuar con pares y adultos, seguir normas, respetar turnos y regular emociones.',
    'haf': 'Habilidades de autocuidado, salud y seguridad personal, reconocimiento de situaciones de riesgo.',
    'uco': 'Uso de la comunidad, desplazamiento autónomo, manejo de transporte y recursos comunitarios.',
    'adi': 'Autodirección, toma de decisiones, resolución de problemas y planificación de actividades.',
    'css': 'Conducta social y responsabilidad, respeto por normas sociales y capacidad para trabajar en grupo.',
    'aor': 'Áreas ocupacionales y recreativas, habilidades para el trabajo y uso adecuado del tiempo libre.'
  }
  
  const gradoAfectacion = intensidad === 'Generalizado' ? 'muy afectada' :
                          intensidad === 'Extenso' ? 'significativamente afectada' :
                          intensidad === 'Limitado' ? 'moderadamente afectada' :
                          'levemente afectada'
  
  return `${nombre}: ${baseDescripcion[nombre] || 'Habilidad adaptativa evaluada.'} La habilidad adaptativa evaluada está ${gradoAfectacion}, por lo que el nivel de apoyos necesario es ${intensidad.toLowerCase()}.`
}

export interface PecaResultForDocx {
  participationLevel: number
  dimensions: Array<{ code: string; label: string; p2: number; intensityLabel: string; rawScore: number; itemsAnswered: number; itemsTotal: number }>
  aamrSets: Array<{ code: string; label: string; p2: number; demandLabel: string; needsSupport: boolean; descriptionText: string }>
  participationText: string
  participationNeeds: boolean
}

export function getConclusionGeneral(result: PecaResultForDocx, nombrePaciente: string): string {
  const porcentaje = Math.round(result.participationLevel * 100)
  const interpretacion = getInterpretacionParticipacion(porcentaje)
  const nombre = getShortName(nombrePaciente)
  
  let dimensionAlta = { label: '', puntaje: -1 }
  let dimensionBaja = { label: '', puntaje: 101 }
  
  result.dimensions.forEach(dim => {
    const pct = dim.p2 * 100
    if (pct > dimensionAlta.puntaje) {
      dimensionAlta = { label: dim.label, puntaje: pct }
    }
    if (pct < dimensionBaja.puntaje) {
      dimensionBaja = { label: dim.label, puntaje: pct }
    }
  })
  
  return `${nombre} presenta ${interpretacion.nivel.toLowerCase()} en conducta adaptativa, con un puntaje global de ${porcentaje}%. ${interpretacion.descripcion} Las principales fortalezas se observan en ${dimensionAlta.label} (${Math.round(dimensionAlta.puntaje)}%), mientras que las mayores dificultades se concentran en ${dimensionBaja.label} (${Math.round(dimensionBaja.puntaje)}%). ${interpretacion.recomendacion} Es fundamental que esta evaluación sea complementada con observación directa en contextos naturales y entrevistas con cuidadores o educadores para obtener un perfil completo y preciso del funcionamiento adaptativo del evaluado.`
}