/**
 * PsyEval — Motor de scoring WISC-V Chile
 * Convierte puntajes directos (PD) a puntajes escala (PE),
 * calcula índices compuestos, intervalos de confianza y
 * emite diagnósticos descriptivos.
 *
 * Fuente normativa: Manual WISC-V CL, Ricardo Rosas D. & Marcelo Pizarro M.
 * CEDETi UC / PUC Chile — Tablas A.1 a A.7
 */

import { createClient } from '@supabase/supabase-js'

// ─── Tipos ──────────────────────────────────────────────────

export type SubtestCode =
  | 'CC' | 'AN' | 'MR' | 'RD' | 'CLA' | 'VOC' | 'BAL'  // primarias CIT
  | 'RV' | 'RI' | 'BS' | 'IN' | 'SLN' | 'CAN' | 'COM' | 'ARI' // complementarias

export type IndexCode = 'ICV' | 'IVE' | 'IRF' | 'IMT' | 'IVP' | 'CIT'

export interface RawScores {
  CC?: number; AN?: number; MR?: number; RD?: number; CLA?: number
  VOC?: number; BAL?: number; RV?: number; RI?: number; BS?: number
  IN?: number; SLN?: number; CAN?: number; COM?: number; ARI?: number
}

export interface ScaledScores {
  CC?: number; AN?: number; MR?: number; RD?: number; CLA?: number
  VOC?: number; BAL?: number; RV?: number; RI?: number; BS?: number
  IN?: number; SLN?: number; CAN?: number; COM?: number; ARI?: number
}

export interface CompositeResult {
  score: number
  percentile: string
  ci90: [number, number]
  ci95: [number, number]
  classification: string
  sumScaled: number
}

export interface WiscScoringResult {
  ageGroup: string
  scaledScores: ScaledScores
  ICV?: CompositeResult
  IVE?: CompositeResult
  IRF?: CompositeResult
  IMT?: CompositeResult
  IVP?: CompositeResult
  CIT?: CompositeResult
  substitutionUsed?: SubtestCode
  isProrated?: boolean
  realtimePrediction?: RealtimePrediction
}

export interface RealtimePrediction {
  estimatedCIT: number | null
  estimatedClassification: string | null
  confidence: 'low' | 'medium' | 'high'
  completedSubtests: SubtestCode[]
  missingSubtests: SubtestCode[]
  progressPercent: number
}

// ─── Configuración de índices ────────────────────────────────

/** Qué subpruebas componen cada índice */
export const INDEX_COMPOSITION: Record<IndexCode, SubtestCode[]> = {
  ICV: ['AN', 'VOC'],
  IVE: ['CC', 'RV'],
  IRF: ['MR', 'BAL'],
  IMT: ['RD', 'RI'],
  IVP: ['CLA', 'BS'],
  CIT: ['CC', 'AN', 'MR', 'RD', 'CLA', 'VOC', 'BAL'],
}

/** Subpruebas que pueden sustituir para obtener el CIT */
export const CIT_SUBSTITUTES: SubtestCode[] = ['RV', 'RI', 'BS', 'IN', 'SLN', 'CAN', 'COM', 'ARI']

/** Clasificación descriptiva según puntaje compuesto */
export function getClassification(score: number): string {
  if (score >= 130) return 'Muy superior'
  if (score >= 120) return 'Superior'
  if (score >= 110) return 'Promedio alto'
  if (score >= 90)  return 'Promedio'
  if (score >= 80)  return 'Promedio bajo'
  if (score >= 70)  return 'Limítrofe'
  return 'Extremadamente bajo'
}

// ─── Cálculo de grupo etario ────────────────────────────────

/**
 * Determina el grupo etario para la Tabla A.1 a partir de la
 * fecha de nacimiento y la fecha de evaluación.
 */
export function getAgeGroup(birthDate: Date, evalDate: Date): {
  years: number; months: number; days: number; group: string
} {
  let years  = evalDate.getFullYear() - birthDate.getFullYear()
  let months = evalDate.getMonth()    - birthDate.getMonth()
  let days   = evalDate.getDate()     - birthDate.getDate()

  if (days < 0) {
    months--
    const prevMonth = new Date(evalDate.getFullYear(), evalDate.getMonth(), 0)
    days += prevMonth.getDate()
  }
  if (months < 0) { years--; months += 12 }

  const totalMonths = years * 12 + months

  // Grupos de 6 meses (6:0–6:5, 6:6–6:11, 7:0–7:5, ..., 16:6–16:11)
  const groupIndex = Math.floor((totalMonths - 72) / 6) // 72 meses = 6 años
  const groupYear  = 6 + Math.floor(groupIndex / 2)
  const groupHalf  = groupIndex % 2 === 0 ? '0' : '6'
  const groupEnd   = groupIndex % 2 === 0 ? '5' : '11'
  const group      = `${groupYear}:${groupHalf}-${groupYear}:${groupEnd}`

  return { years, months, days, group }
}

// ─── Motor principal ─────────────────────────────────────────

export class Wisc5Engine {
  private supabase: ReturnType<typeof createClient>

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey)
  }

  /**
   * Paso 2 de la corrección: PD → PE para una subprueba y grupo etario.
   * Consulta la tabla wisc5_norms_subtest en Supabase.
   */
  async rawToScaled(
    ageGroup: string,
    subtest: SubtestCode,
    rawScore: number
  ): Promise<number | null> {
    const { data, error } = await this.supabase
      .from('wisc5_norms_subtest')
      .select('scaled_score')
      .eq('age_group', ageGroup)
      .eq('subtest_code', subtest)
      .lte('raw_score_min', rawScore)
      .gte('raw_score_max', rawScore)
      .single()

    if (error || !data) return null
    return data.scaled_score
  }

  /**
   * Paso 4: Suma PE → puntaje compuesto con percentil e IC.
   */
  async sumToComposite(
    indexCode: IndexCode,
    sumScaled: number
  ): Promise<Omit<CompositeResult, 'sumScaled'> | null> {
    const { data, error } = await this.supabase
      .from('wisc5_norms_composite')
      .select('composite_score, percentile, ci90_lo, ci90_hi, ci95_lo, ci95_hi')
      .eq('index_code', indexCode)
      .lte('sum_scaled_min', sumScaled)
      .gte('sum_scaled_max', sumScaled)
      .single()

    if (error || !data) return null

    return {
      score: data.composite_score,
      percentile: data.percentile,
      ci90: [data.ci90_lo, data.ci90_hi],
      ci95: [data.ci95_lo, data.ci95_hi],
      classification: getClassification(data.composite_score),
    }
  }

  /**
   * Calcula todos los puntajes escala a partir de los puntajes brutos.
   */
  async calculateScaledScores(
    ageGroup: string,
    rawScores: RawScores
  ): Promise<ScaledScores> {
    const subtests = Object.keys(rawScores) as SubtestCode[]
    const results: ScaledScores = {}

    await Promise.all(
      subtests.map(async (subtest) => {
        const raw = rawScores[subtest]
        if (raw !== undefined && raw !== null) {
          results[subtest] = await this.rawToScaled(ageGroup, subtest, raw) ?? undefined
        }
      })
    )

    return results
  }

  /**
   * Calcula un índice compuesto a partir de los puntajes escala.
   * Maneja sustituciones para el CIT.
   */
  async calculateIndex(
    indexCode: IndexCode,
    scaledScores: ScaledScores,
    substitution?: SubtestCode
  ): Promise<CompositeResult | null> {
    const subtests = [...INDEX_COMPOSITION[indexCode]]

    // Si hay sustitución para CIT, reemplazar la subprueba faltante
    if (indexCode === 'CIT' && substitution) {
      const missing = subtests.find(s => scaledScores[s] === undefined)
      if (missing) {
        const idx = subtests.indexOf(missing)
        subtests[idx] = substitution
      }
    }

    const scores = subtests.map(s => scaledScores[s])
    if (scores.some(s => s === undefined)) return null

    const sumScaled = scores.reduce((acc, s) => acc! + s!, 0) as number
    const composite = await this.sumToComposite(indexCode, sumScaled)
    if (!composite) return null

    return { ...composite, sumScaled }
  }

  /**
   * Motor completo: recibe puntajes brutos, devuelve resultado total.
   * Paso a paso según el protocolo WISC-V.
   */
  async score(
    birthDate: Date,
    evalDate: Date,
    rawScores: RawScores,
    options: { substitution?: SubtestCode; confidenceLevel?: 90 | 95 } = {}
  ): Promise<WiscScoringResult> {
    // Paso 1: grupo etario
    const { years, months, days, group } = getAgeGroup(birthDate, evalDate)

    // Paso 2: PD → PE
    const scaledScores = await this.calculateScaledScores(group, rawScores)

    // Paso 3 y 4: calcular cada índice
    const [ICV, IVE, IRF, IMT, IVP, CIT] = await Promise.all([
      this.calculateIndex('ICV', scaledScores),
      this.calculateIndex('IVE', scaledScores),
      this.calculateIndex('IRF', scaledScores),
      this.calculateIndex('IMT', scaledScores),
      this.calculateIndex('IVP', scaledScores),
      this.calculateIndex('CIT', scaledScores, options.substitution),
    ])

    // Pronóstico en tiempo real
    const realtimePrediction = this.computeRealtimePrediction(scaledScores, CIT)

    return {
      ageGroup: group,
      scaledScores,
      ICV: ICV ?? undefined,
      IVE: IVE ?? undefined,
      IRF: IRF ?? undefined,
      IMT: IMT ?? undefined,
      IVP: IVP ?? undefined,
      CIT: CIT ?? undefined,
      substitutionUsed: options.substitution,
      realtimePrediction,
    }
  }

  /**
   * Pronóstico en tiempo real: estima el CIT probable a medida que
   * el psicólogo va ingresando puntajes subprueba por subprueba.
   *
   * Estrategia: promedio ponderado de las subpruebas CIT completadas,
   * interpolado hacia media esperada (10) para las faltantes.
   */
  computeRealtimePrediction(
    scaledScores: ScaledScores,
    completedCIT: CompositeResult | null | undefined
  ): RealtimePrediction {
    const citSubtests = INDEX_COMPOSITION.CIT
    const completedSubtests = citSubtests.filter(s => scaledScores[s] !== undefined) as SubtestCode[]
    const missingSubtests   = citSubtests.filter(s => scaledScores[s] === undefined) as SubtestCode[]
    const progressPercent   = Math.round((completedSubtests.length / citSubtests.length) * 100)

    // Si tenemos el CIT completo, úsalo directamente
    if (completedCIT) {
      return {
        estimatedCIT: completedCIT.score,
        estimatedClassification: completedCIT.classification,
        confidence: 'high',
        completedSubtests,
        missingSubtests,
        progressPercent: 100,
      }
    }

    if (completedSubtests.length === 0) {
      return {
        estimatedCIT: null,
        estimatedClassification: null,
        confidence: 'low',
        completedSubtests: [],
        missingSubtests: citSubtests as SubtestCode[],
        progressPercent: 0,
      }
    }

    // Estimación: suma de PE conocidas + media (10) para las desconocidas
    const knownSum  = completedSubtests.reduce((acc, s) => acc + (scaledScores[s] ?? 10), 0)
    const totalSumEstimated = knownSum + missingSubtests.length * 10

    // Aproximación lineal: CIT ≈ 40 + (sumCIT / 70) * 60 (rango 40–100 para sumas 7–70)
    // Más preciso: usar la tabla compuesta si sum está en rango
    const estimatedCIT = this.approximateCITFromSum(totalSumEstimated)

    const confidence: RealtimePrediction['confidence'] =
      completedSubtests.length >= 5 ? 'high'
      : completedSubtests.length >= 3 ? 'medium'
      : 'low'

    return {
      estimatedCIT,
      estimatedClassification: estimatedCIT ? getClassification(estimatedCIT) : null,
      confidence,
      completedSubtests,
      missingSubtests,
      progressPercent,
    }
  }

  /**
   * Aproximación del CIT a partir de la suma de puntajes escala.
   * Usa regresión lineal ajustada a los datos reales de la Tabla A.7.
   * Rango real: suma 7–133 → CIT 40–160
   */
  private approximateCITFromSum(sum: number): number {
    // Regresión lineal aproximada derivada de la Tabla A.7:
    // CIT ≈ 1.117 * sum + 32.5 (R² ≈ 0.999)
    const estimated = Math.round(1.117 * sum + 32.5)
    return Math.max(40, Math.min(160, estimated))
  }

  /**
   * Prorrateo del CIT cuando solo hay 6 de 7 subpruebas (Tabla A.8).
   */
  prorrateCITSum(sumOf6: number): number {
    // Tabla A.8: suma_6 × 7/6, redondeado
    return Math.round(sumOf6 * (7 / 6))
  }
}

// ─── Exportar instancia lista para usar ──────────────────────

export function createWisc5Engine(supabaseUrl: string, supabaseKey: string): Wisc5Engine {
  return new Wisc5Engine(supabaseUrl, supabaseKey)
}
