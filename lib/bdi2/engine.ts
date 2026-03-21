// @ts-nocheck
/**
 * AQN Praxis — Motor BDI-II
 * Inventario de Depresión de Beck — 2ª Edición
 * Beck, Steer & Brown (1996). BDI-II Manual. Psychological Corporation.
 *
 * 21 ítems, cada uno puntuado 0–3.
 * Puntos de corte (Beck et al., 1996; validados en Chile):
 *   0–13  → Mínima
 *  14–19  → Leve
 *  20–28  → Moderada
 *  29–63  → Grave
 *
 * Subescalas (Steer et al., 1999):
 *   Cognitivo-afectiva: ítems 1–13
 *   Somático-motivacional: ítems 14–21
 */

export type BdiResponse = 0 | 1 | 2 | 3
export type BdiResponses = Partial<Record<number, BdiResponse>>

export type BdiSeverity = 'minima' | 'leve' | 'moderada' | 'grave'

export interface BdiResult {
  totalScore: number
  severity: BdiSeverity
  severityLabel: string
  severityDescription: string
  cognitiveAffectiveScore: number   // ítems 1–13
  somaticMotivationalScore: number  // ítems 14–21
  answeredItems: number
  totalItems: 21
  isComplete: boolean
  /** Ítems con puntaje ≥ 2 (señales clínicas relevantes) */
  flaggedItems: number[]
  /** Ítem 9 = ideación suicida (requiere atención inmediata si ≥ 1) */
  suicidalIdeationScore: number
}

export const BDI2_ITEMS: Array<{ num: number; label: string }> = [
  { num: 1,  label: 'Tristeza' },
  { num: 2,  label: 'Pesimismo' },
  { num: 3,  label: 'Fracaso en el pasado' },
  { num: 4,  label: 'Pérdida de placer' },
  { num: 5,  label: 'Sentimientos de culpa' },
  { num: 6,  label: 'Sentimientos de castigo' },
  { num: 7,  label: 'Disconformidad con uno mismo' },
  { num: 8,  label: 'Autocrítica' },
  { num: 9,  label: 'Pensamientos o deseos suicidas' },
  { num: 10, label: 'Llanto' },
  { num: 11, label: 'Agitación' },
  { num: 12, label: 'Pérdida de interés' },
  { num: 13, label: 'Indecisión' },
  { num: 14, label: 'Desvalorización' },
  { num: 15, label: 'Pérdida de energía' },
  { num: 16, label: 'Cambios en los hábitos de sueño' },
  { num: 17, label: 'Irritabilidad' },
  { num: 18, label: 'Cambios en el apetito' },
  { num: 19, label: 'Dificultad de concentración' },
  { num: 20, label: 'Cansancio o fatiga' },
  { num: 21, label: 'Pérdida de interés en el sexo' },
]

const SEVERITY_MAP: Array<{ max: number; severity: BdiSeverity; label: string; description: string; color: string }> = [
  { max: 13, severity: 'minima',   label: 'Depresión mínima',    color: '#3B6D11',
    description: 'El puntaje obtenido se encuentra en el rango de depresión mínima. Los síntomas reportados no alcanzan umbral clínico significativo.' },
  { max: 19, severity: 'leve',     label: 'Depresión leve',      color: '#854F0B',
    description: 'El puntaje obtenido indica presencia de síntomas depresivos leves. Se recomienda monitoreo y, según contexto clínico, considerar intervención.' },
  { max: 28, severity: 'moderada', label: 'Depresión moderada',  color: '#993C1D',
    description: 'El puntaje obtenido indica un nivel de depresión moderado. Se recomienda evaluación clínica especializada e intervención terapéutica.' },
  { max: 63, severity: 'grave',    label: 'Depresión grave',     color: '#A32D2D',
    description: 'El puntaje obtenido indica un nivel de depresión grave. Se requiere atención clínica prioritaria y evaluación de riesgo.' },
]

export const BDI2_SEVERITY_COLORS: Record<BdiSeverity, string> = {
  minima:   '#3B6D11',
  leve:     '#854F0B',
  moderada: '#993C1D',
  grave:    '#A32D2D',
}

export function scoreBdi2(responses: BdiResponses): BdiResult {
  const answered = Object.keys(responses).map(Number)
  const totalScore = answered.reduce((sum, i) => sum + (responses[i] ?? 0), 0)

  const cognitiveAffectiveScore  = [1,2,3,4,5,6,7,8,9,10,11,12,13]
    .reduce((s, i) => s + (responses[i] ?? 0), 0)
  const somaticMotivationalScore = [14,15,16,17,18,19,20,21]
    .reduce((s, i) => s + (responses[i] ?? 0), 0)

  const severityEntry = SEVERITY_MAP.find(s => totalScore <= s.max) ?? SEVERITY_MAP[3]
  const flaggedItems  = answered.filter(i => (responses[i] ?? 0) >= 2)
  const suicidalIdeationScore = responses[9] ?? 0

  return {
    totalScore,
    severity:              severityEntry.severity,
    severityLabel:         severityEntry.label,
    severityDescription:   severityEntry.description,
    cognitiveAffectiveScore,
    somaticMotivationalScore,
    answeredItems:         answered.length,
    totalItems:            21,
    isComplete:            answered.length === 21,
    flaggedItems,
    suicidalIdeationScore,
  }
}
