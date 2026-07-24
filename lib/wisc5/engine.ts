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
  isEstimated?: boolean  // ← nuevo flag para indicar que el CIT es estimado
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

  /**
   * Carga TODAS las normas desde Supabase usando paginación manual.
   * Esto asegura que se obtengan todos los registros (más de 1000).
   */
  async loadNorms(): Promise<void> {
    console.log('📥 [Engine] Cargando todas las normas desde Supabase (con paginación)...')

    const pageSize = 1000
    let allSubtest: any[] = []
    let allComposite: any[] = []
    let hasMore = true
    let page = 0

    // 1. Cargar normas de subpruebas con paginación
    while (hasMore) {
      const from = page * pageSize
      const to = (page + 1) * pageSize - 1
      console.log(`   ⏳ Cargando subtest página ${page + 1} (registros ${from} a ${to})...`)

      const { data, error } = await this.supabase
        .from('wisc5_norms_subtest')
        .select('*')
        .order('age_group', { ascending: true })
        .range(from, to)

      if (error) {
        console.error('❌ [Engine] Error cargando normas subtest:', error)
        throw new Error(`Error cargando normas subtest: ${error.message}`)
      }

      if (!data || data.length === 0) {
        hasMore = false
      } else {
        allSubtest = allSubtest.concat(data)
        page++
        if (data.length < pageSize) {
          hasMore = false
        }
      }
    }

    // 2. Cargar normas compuestas con paginación
    hasMore = true
    page = 0
    while (hasMore) {
      const from = page * pageSize
      const to = (page + 1) * pageSize - 1
      console.log(`   ⏳ Cargando composite página ${page + 1} (registros ${from} a ${to})...`)

      const { data, error } = await this.supabase
        .from('wisc5_norms_composite')
        .select('*')
        .order('index_code', { ascending: true })
        .range(from, to)

      if (error) {
        console.error('❌ [Engine] Error cargando normas composite:', error)
        throw new Error(`Error cargando normas composite: ${error.message}`)
      }

      if (!data || data.length === 0) {
        hasMore = false
      } else {
        allComposite = allComposite.concat(data)
        page++
        if (data.length < pageSize) {
          hasMore = false
        }
      }
    }

    this.normsSubtest = allSubtest
    this.normsComposite = allComposite
    this.normsLoaded = true

    // Guardar los grupos de edad únicos
    this.ageGroupsSet.clear()
    this.normsSubtest.forEach((n: any) => {
      if (n.age_group) this.ageGroupsSet.add(n.age_group)
    })

    console.log(`✅ [Engine] Normas cargadas: ${this.normsSubtest.length} subtest, ${this.normsComposite.length} composite`)
    console.log(`📋 [Engine] Grupos de edad disponibles (${this.ageGroupsSet.size} grupos):`, Array.from(this.ageGroupsSet).slice(0, 10))
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

    // Buscar exacto
    let entry = this.normsSubtest.find(
      (n: any) =>
        this.normalizeAgeGroup(n.age_group) === normalizedGroup &&
        n.subtest_code === subtest &&
        rawScore >= n.raw_score_min &&
        rawScore <= n.raw_score_max
    )

    if (entry) {
      return entry.scaled_score
    }

    // Buscar en grupos adyacentes (fallback)
    const [year, rest] = ageGroup.split(':')
    const [minMonth, maxMonth] = rest.split('-').map(s => parseInt(s))
    const fallbackGroups: string[] = []
    if (minMonth >= 6) {
      const prev = `${year}:${(minMonth-6).toString().padStart(2,'0')}-${year}:${(maxMonth-6).toString().padStart(2,'0')}`
      fallbackGroups.push(prev)
    }
    if (maxMonth <= 5) {
      const next = `${year}:${(minMonth+6).toString().padStart(2,'0')}-${year}:${(maxMonth+6).toString().padStart(2,'0')}`
      fallbackGroups.push(next)
    }

    for (const fallback of fallbackGroups) {
      const entryFallback = this.normsSubtest.find(
        (n: any) =>
          n.age_group === fallback &&
          n.subtest_code === subtest &&
          rawScore >= n.raw_score_min &&
          rawScore <= n.raw_score_max
      )
      if (entryFallback) {
        console.warn(`⚠️ [Engine] Usando grupo ${fallback} como fallback para ${subtest} (raw=${rawScore})`)
        return entryFallback.scaled_score
      }
    }

    // Mostrar grupos disponibles que contienen el año
    const availableGroups = Array.from(this.ageGroupsSet).filter(g => g.includes(year)).join(', ')
    console.warn(`⚠️ [Engine] No se encontró norma para ${subtest} (raw=${rawScore}, group=${ageGroup})`)
    if (availableGroups) {
      console.warn(`   Grupos disponibles que contienen '${year}': ${availableGroups}`)
    } else {
      console.warn(`   Ningún grupo disponible para el año ${year}.`)
    }

    return null
  }

  /**
   * Aproxima el CIT a partir de la suma de puntajes escalares de las 7 subpruebas primarias.
   * Usa la fórmula de regresión lineal: CIT ≈ 1.117 * suma + 32.5
   * También calcula percentil y CI basados en la distribución normal (media 100, DE 15).
   */
  private approximateCITFromSum(sumScaled: number): CompositeResult {
    const score = Math.round(1.117 * sumScaled + 32.5)
    const clamped = Math.max(40, Math.min(160, score))

    // Percentil aproximado usando distribución normal estándar
    const z = (clamped - 100) / 15
    const percentile = Math.round(100 * (0.5 * (1 + erf(z / Math.SQRT2))))

    const ci90: [number, number] = [
      Math.max(40, Math.round(clamped - 1.645 * 15)),
      Math.min(160, Math.round(clamped + 1.645 * 15))
    ]
    const ci95: [number, number] = [
      Math.max(40, Math.round(clamped - 1.96 * 15)),
      Math.min(160, Math.round(clamped + 1.96 * 15))
    ]

    return {
      score: clamped,
      percentile: `${percentile}`,
      ci90,
      ci95,
      classification: getClassification(clamped),
      sumScaled,
      isEstimated: true
    }
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

    if (entry) {
      return {
        score: entry.composite_score,
        percentile: entry.percentile,
        ci90: [entry.ci90_lo, entry.ci90_hi],
        ci95: [entry.ci95_lo, entry.ci95_hi],
        classification: getClassification(entry.composite_score),
      }
    }

    // Si no hay norma y es CIT, intentar aproximación
    if (indexCode === 'CIT') {
      console.warn(`⚠️ [Engine] No se encontró norma para CIT (sum=${sumScaled}). Usando aproximación.`)
      const approx = this.approximateCITFromSum(sumScaled)
      return approx
    }

    console.warn(`⚠️ [Engine] No se encontró norma compuesta para ${indexCode} (sum=${sumScaled})`)
    return null
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
        console.log(`🔁 [Engine] Sustitución aplicada: ${missing} → ${substitution}`)
      }
    }

    const scores = subtests.map(s => scaledScores[s])
    if (scores.some(s => s === undefined)) {
      console.warn(`⚠️ [Engine] Faltan subpruebas para ${indexCode}:`, subtests.filter(s => scaledScores[s] === undefined))
      return null
    }

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

    if (CIT?.isEstimated) {
      console.warn('⚠️ [Engine] CIT calculado de forma aproximada (sin norma).')
    }

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
    const estimatedCIT = this.approximateCITFromSum(totalSumEstimated).score

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

  prorrateCITSum(sumOf6: number): number {
    return Math.round(sumOf6 * (7 / 6))
  }
}

// Función auxiliar erf para cálculo de percentil aproximado
function erf(x: number): number {
  const a1 = 0.254829592
  const a2 = -0.284496736
  const a3 = 1.421413741
  const a4 = -1.453152027
  const a5 = 1.061405429
  const p = 0.3275911
  const sign = x < 0 ? -1 : 1
  x = Math.abs(x)
  const t = 1 / (1 + p * x)
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)
  return sign * y
}

export function createWisc5Engine(): Wisc5Engine {
  return new Wisc5Engine()
}