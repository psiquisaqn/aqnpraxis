/**
 * PsyEval — Motor de scoring WISC-V Chile (versión optimizada con cache)
 * Convierte puntajes directos (PD) a puntajes escala (PE),
 * calcula índices compuestos, intervalos de confianza y
 * emite diagnósticos descriptivos.
 *
 * Fuente normativa: Manual WISC-V CL, Ricardo Rosas D. & Marcelo Pizarro M.
 * CEDETi UC / PUC Chile — Tablas A.1 a A.7
 */

import { supabase } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'

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

/**
 * Clasificación cualitativa según puntaje compuesto (media 100, DE 15)
 * Rangos adaptados para la versión chilena del WISC-V
 */
export function getClassification(score: number): string {
  if (score >= 130) return 'Muy Superior'
  if (score >= 120) return 'Superior'
  if (score >= 110) return 'Normal Alto'
  if (score >= 90) return 'Normal Promedio'
  if (score >= 80) return 'Normal Lento'
  if (score >= 70) return 'Funcionamiento Intelectual Limítrofe'
  return 'Extremadamente Bajo'
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

// ─── Motor principal con cache ──────────────────────────────

export class Wisc5Engine {
  private supabase: SupabaseClient = supabase
  private normsSubtest: any[] = []
  private normsComposite: any[] = []
  private normsLoaded = false

  /**
   * Carga todas las normas en memoria (una sola vez).
   * Debe llamarse antes de cualquier cálculo.
   */
  async loadNorms(): Promise<void> {
    if (this.normsLoaded) return

    const [subtestRes, compositeRes] = await Promise.all([
      this.supabase.from('wisc5_norms_subtest').select('*'),
      this.supabase.from('wisc5_norms_composite').select('*'),
    ])

    if (subtestRes.error) throw new Error(`Error cargando normas subtest: ${subtestRes.error.message}`)
    if (compositeRes.error) throw new Error(`Error cargando normas composite: ${compositeRes.error.message}`)

    this.normsSubtest = subtestRes.data || []
    this.normsComposite = compositeRes.data || []
    this.normsLoaded = true
  }

  /**
   * Paso 2 de la corrección: PD → PE (síncrono, usa cache)
   */
  rawToScaled(ageGroup: string, subtest: SubtestCode, rawScore: number): number | null {
    if (!this.normsLoaded) {
      console.warn('⚠️ Normas no cargadas. Llamar a loadNorms() primero.')
      return null
    }

    const entry = this.normsSubtest.find(
      (n: any) =>
        n.age_group === ageGroup &&
        n.subtest_code === subtest &&
        rawScore >= n.raw_score_min &&
        rawScore <= n.raw_score_max
    )

    return entry?.scaled_score ?? null
  }

  /**
   * Paso 4: Suma PE → puntaje compuesto con percentil e IC (síncrono)
   */
  sumToComposite(indexCode: IndexCode, sumScaled: number): Omit<CompositeResult, 'sumScaled'> | null {
    if (!this.normsLoaded) {
      console.warn('⚠️ Normas no cargadas. Llamar a loadNorms() primero.')
      return null
    }

    const entry = this.normsComposite.find(
      (n: any) =>
        n.index_code === indexCode &&
        sumScaled >= n.sum_scaled_min &&
        sumScaled <= n.sum_scaled_max
    )

    if (!entry) return null

    return {
      score: entry.composite_score,
      percentile: entry.percentile,
      ci90: [entry.ci90_lo, entry.ci90_hi],
      ci95: [entry.ci95_lo, entry.ci95_hi],
      classification: getClassification(entry.composite_score),
    }
  }

  /**
   * Calcula todos los puntajes escala a partir de los puntajes brutos (síncrono)
   */
  calculateScaledScores(ageGroup: string, rawScores: RawScores): ScaledScores {
    const results: ScaledScores = {}
    for (const code of Object.keys(rawScores) as SubtestCode[]) {
      const raw = rawScores[code]
      if (raw !== undefined && raw !== null) {
        const scaled = this.rawToScaled(ageGroup, code, raw)
        if (scaled !== null) results[code] = scaled
      }
    }
    return results
  }

  /**
   * Calcula un índice compuesto (síncrono)
   */
  calculateIndex(
    indexCode: IndexCode,
    scaledScores: ScaledScores,
    substitution?: SubtestCode
  ): CompositeResult | null {
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
    const composite = this.sumToComposite(indexCode, sumScaled)
    if (!composite) return null

    return { ...composite, sumScaled }
  }

  /**
   * Motor completo: recibe puntajes brutos, devuelve resultado total (síncrono)
   */
  score(
    birthDate: Date,
    evalDate: Date,
    rawScores: RawScores,
    options: { substitution?: SubtestCode; confidenceLevel?: 90 | 95 } = {}
  ): WiscScoringResult {
    if (!this.normsLoaded) {
      throw new Error('⚠️ Normas no cargadas. Llamar a loadNorms() antes de score().')
    }

    // Paso 1: grupo etario
    const { group } = getAgeGroup(birthDate, evalDate)

    // Paso 2: PD → PE
    const scaledScores = this.calculateScaledScores(group, rawScores)

    // Paso 3 y 4: calcular cada índice
    const ICV = this.calculateIndex('ICV', scaledScores)
    const IVE = this.calculateIndex('IVE', scaledScores)
    const IRF = this.calculateIndex('IRF', scaledScores)
    const IMT = this.calculateIndex('IMT', scaledScores)
    const IVP = this.calculateIndex('IVP', scaledScores)
    const CIT = this.calculateIndex('CIT', scaledScores, options.substitution)

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
   * Pronóstico en tiempo real (síncrono)
   */
  computeRealtimePrediction(
    scaledScores: ScaledScores,
    completedCIT: CompositeResult | null | undefined
  ): RealtimePrediction {
    const citSubtests = INDEX_COMPOSITION.CIT
    const completedSubtests = citSubtests.filter(s => scaledScores[s] !== undefined) as SubtestCode[]
    const missingSubtests   = citSubtests.filter(s => scaledScores[s] === undefined) as SubtestCode[]
    const progressPercent   = Math.round((completedSubtests.length / citSubtests.length) * 100)

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

    const knownSum  = completedSubtests.reduce((acc, s) => acc + (scaledScores[s] ?? 10), 0)
    const totalSumEstimated = knownSum + missingSubtests.length * 10
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

  private approximateCITFromSum(sum: number): number {
    const estimated = Math.round(1.117 * sum + 32.5)
    return Math.max(40, Math.min(160, estimated))
  }

  /**
   * Prorrateo del CIT cuando solo hay 6 de 7 subpruebas (Tabla A.8).
   */
  prorrateCITSum(sumOf6: number): number {
    return Math.round(sumOf6 * (7 / 6))
  }
}

// ─── Exportar instancia lista para usar ──────────────────────

export function createWisc5Engine(): Wisc5Engine {
  return new Wisc5Engine()
}