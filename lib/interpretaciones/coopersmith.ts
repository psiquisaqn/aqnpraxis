// lib/interpretaciones/coopersmith.ts

function getShortName(fullName: string): string {
  if (!fullName) return 'El evaluado'
  const parts = fullName.trim().split(/\s+/)
  if (parts.length <= 2) return fullName
  return parts.slice(0, 2).join(' ')
}

export function getInterpretacionSubescala(puntaje: number, maximo: number, nombre: string): string {
  const porcentaje = (puntaje / maximo) * 100
  if (porcentaje >= 75) {
    return `${nombre}: El evaluado muestra una percepción muy alta de sí mismo en esta área. Se siente competente, valorado y aceptado, lo que contribuye positivamente a su autoestima general. No se detectan dificultades significativas en este dominio.`
  } else if (porcentaje >= 50) {
    return `${nombre}: La autopercepción del evaluado en esta área es media-alta. Generalmente se siente adecuado, aunque puede experimentar inseguridades en situaciones específicas que requieren mayor exigencia. Se recomienda reforzar las áreas de fortaleza.`
  } else if (porcentaje >= 25) {
    return `${nombre}: Se observa una autopercepción baja en esta área. El evaluado tiende a subestimar sus capacidades y puede experimentar sentimientos de incompetencia o de no ser "suficientemente bueno" en comparación con otros. Es un área que podría beneficiarse de intervención focalizada.`
  } else {
    return `${nombre}: La autopercepción es muy baja. Existe un patrón consistente de autodescalificación, lo que sugiere que esta área es una fuente significativa de malestar y requiere intervención prioritaria. Se recomienda trabajo psicoterapéutico específico para fortalecer la autoestima en este dominio.`
  }
}

export interface CooperResultForDocx {
  totalScaled: number
  levelLabel: string
  lieScaleInvalid?: boolean
  lieScaleRaw?: number
  subscales: Array<{ code: string; label: string; scaledScore: number; maxScaled: number; pct: number }>
}

export function getConclusionGeneral(result: CooperResultForDocx, nombrePaciente: string): string {
  const puntaje = result.totalScaled
  const nombre = getShortName(nombrePaciente)
  let conclusion = ""

  if (puntaje >= 75) {
    conclusion = `Los resultados del Coopersmith SEI indican que ${nombre} presenta una autoestima alta y bien consolidada. Con un puntaje total de ${puntaje} puntos (sobre 100), se ubica en el percentil superior, lo que refleja una percepción positiva y bien consolidada de sí mismo. `
  } else if (puntaje >= 50) {
    conclusion = `Los resultados del Coopersmith SEI indican que ${nombre} presenta una autoestima media-alta. Con un puntaje total de ${puntaje} puntos (sobre 100), se ubica en un rango medio-alto, mostrando una percepción generalmente positiva de sí mismo, aunque con algunas áreas de inseguridad. `
  } else if (puntaje >= 25) {
    conclusion = `Los resultados del Coopersmith SEI indican que ${nombre} presenta una autoestima media-baja. Con un puntaje total de ${puntaje} puntos (sobre 100), se observan dificultades significativas en la percepción de autoeficacia y valía personal. `
  } else {
    conclusion = `Los resultados del Coopersmith SEI indican que ${nombre} presenta una autoestima baja. Con un puntaje total de ${puntaje} puntos (sobre 100), se evidencia un patrón consistente de autodescalificación que requiere intervención prioritaria. `
  }
  
  conclusion += `Las subescalas permiten identificar áreas específicas de fortaleza y vulnerabilidad. `
  
  if (result.lieScaleInvalid) {
    conclusion += `⚠️ Precaución: La puntuación en la escala de mentira (${result.lieScaleRaw}/8) sugiere una tendencia a responder de manera socialmente deseable, por lo que los resultados deben interpretarse con cautela. `
  }
  
  conclusion += `Se recomienda utilizar estos resultados como base para un plan de intervención focalizado en las áreas deficitarias, fortaleciendo los recursos existentes y promoviendo una autopercepción más realista y positiva. La autoestima es un constructo dinámico que puede modificarse a través de intervenciones psicosociales y psicoterapéuticas adecuadas.`
  
  return conclusion
}