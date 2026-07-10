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

export const INDEX_COMPOSITION: Record<IndexCode, SubtestCode[]> = {
  ICV: ['AN', 'VOC'],
  IVE: ['CC', 'RV'],
  IRF: ['MR', 'BAL'],
  IMT: ['RD', 'RI'],
  IVP: ['CLA', 'BS'],
  CIT: ['CC', 'AN', 'MR', 'RD', 'CLA', 'VOC', 'BAL'],
}

export const CIT_SUBSTITUTES: SubtestCode[] = ['RV', 'RI', 'BS', 'IN', 'SLN', 'CAN', 'COM', 'ARI']

/**
 * Clasificación cualitativa según puntaje compuesto (media 100, DE 15)
 * Rangos adaptados para la versión chilena del WISC-V
 * Corregido: 55-69 = Discapacidad Intelectual Leve, <=54 = Discapacidad Intelectual Moderada
 */
export function getClassification(score: number): string {
  if (score >= 130) return 'Muy Superior'
  if (score >= 120) return 'Superior'
  if (score >= 110) return 'Normal Alto'
  if (score >= 90) return 'Normal Promedio'
  if (score >= 80) return 'Normal Bajo'
  if (score >= 70) return 'Limítrofe'
  if (score >= 55) return 'Discapacidad Intelectual Leve'
  return 'Discapacidad Intelectual Moderada'
}

// ─── Cálculo de grupo etario ────────────────────────────────

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
  const groupIndex = Math.floor((totalMonths - 72) / 6)
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
  private ageGroupsSet: Set<string> = new Set()

  async loadNorms(): Promise<void> {
    if (this.normsLoaded) {
      console.log('✅ [Engine] Normas ya cargadas, omitiendo recarga.')
      return
    }

    console.log('📥 [Engine] Cargando normas desde Supabase...')
    const [subtestRes, compositeRes] = await Promise.all([
      this.supabase.from('wisc5_norms_subtest').select('*'),
      this.supabase.from('wisc5_norms_composite').select('*'),
    ])

    if (subtestRes.error) {
      console.error('❌ [Engine] Error cargando normas subtest:', subtestRes.error)
      throw new Error(`Error cargando normas subtest: ${subtestRes.error.message}`)
    }
    if (compositeRes.error) {
      console.error('❌ [Engine] Error cargando normas composite:', compositeRes.error)
      throw new Error(`Error cargando normas composite: ${compositeRes.error.message}`)
    }

    this.normsSubtest = subtestRes.data || []
    this.normsComposite = compositeRes.data || []
    this.normsLoaded = true

    // Guardar grupos de edad
    this.normsSubtest.forEach((n: any) => {
      if (n.age_group) this.ageGroupsSet.add(n.age_group)
    })

    console.log(`✅ [Engine] Normas cargadas: ${this.normsSubtest.length} subtest, ${this.normsComposite.length} composite`)
    console.log(`📋 [Engine] Grupos de edad disponibles (primeros 10):`, Array.from(this.ageGroupsSet).slice(0, 10))
  }

  private normalizeAgeGroup(ageGroup: string): string {
    return ageGroup.trim().replace(/\s+/g, ' ')
  }

  rawToScaled(ageGroup: string, subtest: SubtestCode, rawScore: number): number | null {
    if (!this.normsLoaded) {
      console.warn('⚠️ [Engine] Normas no cargadas. Llamar a loadNorms() primero.')
      return null
    }

    const normalizedGroup = this.normalizeAgeGroup(ageGroup)

    // Búsqueda exacta
    let entry = this.normsSubtest.find(
      (n: any) =>
        this.normalizeAgeGroup(n.age_group) === normalizedGroup &&
        n.subtest_code === subtest &&
        rawScore >= n.raw_score_min &&
        rawScore <= n.raw_score_max
    )

    // Si no se encuentra, mostrar grupos disponibles para depuración
    if (!entry) {
      const availableGroups = Array.from(this.ageGroupsSet).filter(g => g.includes('13')).join(', ')
      console.warn(`⚠️ [Engine] No se encontró norma para ${subtest} (raw=${rawScore}, group=${ageGroup})`)
      console.warn(`   Grupos disponibles que contienen '13': ${availableGroups || 'ninguno'}`)
      return null
    }

    return entry.scaled_score
  }

  sumToComposite(indexCode: IndexCode, sumScaled: number): Omit<CompositeResult, 'sumScaled'> | null {
    if (!this.normsLoaded) {
      console.warn('⚠️ [Engine] Normas no cargadas. Llamar a loadNorms() primero.')
      return null
    }

    const entry = this.normsComposite.find(
      (n: any) =>
        n.index_code === indexCode &&
        sumScaled >= n.sum_scaled_min &&
        sumScaled <= n.sum_scaled_max
    )

    if (!entry) {
      console.warn(`⚠️ [Engine] No se encontró norma compuesta para ${indexCode} (sum=${sumScaled})`)
      return null
    }

    return {
      score: entry.composite_score,
      percentile: entry.percentile,
      ci90: [entry.ci90_lo, entry.ci90_hi],
      ci95: [entry.ci95_lo, entry.ci95_hi],
      classification: getClassification(entry.composite_score),
    }
  }

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

  calculateIndex(
    indexCode: IndexCode,
    scaledScores: ScaledScores,
    substitution?: SubtestCode
  ): CompositeResult | null {
    const subtests = [...INDEX_COMPOSITION[indexCode]]

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

  score(
    birthDate: Date,
    evalDate: Date,
    rawScores: RawScores,
    options: { substitution?: SubtestCode; confidenceLevel?: 90 | 95 } = {}
  ): WiscScoringResult {
    if (!this.normsLoaded) {
      throw new Error('⚠️ [Engine] Normas no cargadas. Llamar a loadNorms() antes de score().')
    }

    const { group } = getAgeGroup(birthDate, evalDate)
    console.log(`📊 [Engine] Calculando para grupo: ${group}`)

    const scaledScores = this.calculateScaledScores(group, rawScores)
    console.log(`📊 [Engine] Escalares calculados:`, scaledScores)

    const ICV = this.calculateIndex('ICV', scaledScores)
    const IVE = this.calculateIndex('IVE', scaledScores)
    const IRF = this.calculateIndex('IRF', scaledScores)
    const IMT = this.calculateIndex('IMT', scaledScores)
    const IVP = this.calculateIndex('IVP', scaledScores)
    const CIT = this.calculateIndex('CIT', scaledScores, options.substitution)

    const realtimePrediction = this.computeRealtimePrediction(scaledScores, CIT)

    const result = {
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

    console.log(`📊 [Engine] Resultado final:`, result)
    return result
  }

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

  prorrateCITSum(sumOf6: number): number {
    return Math.round(sumOf6 * (7 / 6))
  }
}

export function createWisc5Engine(): Wisc5Engine {
  return new Wisc5Engine()
}