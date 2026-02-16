import type { ExtractionConfidence } from '@/lib/extraction'
import type { DiagnoseFormData, Support } from '@/types'

/** Matching tier thresholds */
const TIER_THRESHOLDS = {
  exact: 0.7,    // 맞춤추천: 70%+ match
  likely: 0.4,   // 추천: 40-69%
  related: 0.15, // 관련사업: 15-39%
} as const

/** Axis weights (sum = 1.0) */
const WEIGHTS = {
  businessAge: 0.20,
  region: 0.20,
  founderAge: 0.20,
  businessType: 0.15,
  employee: 0.15,
  revenue: 0.10,
} as const

export type MatchTier = 'exact' | 'likely' | 'related'

export interface DimensionScores {
  region: number
  businessType: number
  employee: number
  revenue: number
  businessAge: number
  founderAge: number
  confidence: number
  weighted: number
}

export interface ScoredSupport {
  support: Support
  score: number
  tier: MatchTier
  breakdown: {
    region: number
    businessType: number
    employee: number
    revenue: number
    businessAge: number
    founderAge: number
  }
  scores: DimensionScores
}

export interface MatchResult {
  exact: ScoredSupport[]
  likely: ScoredSupport[]
  related: ScoredSupport[]
  all: ScoredSupport[]
  totalCount: number
}

/** Score region match: null→0.5 (unknown), []→1.0 (no restriction), match→1.0, miss→0.0 */
function scoreRegion(support: Support, userRegion: string): number {
  if (support.targetRegions === null || support.targetRegions === undefined) return 0.5
  if (support.targetRegions.length === 0) return 1.0
  return support.targetRegions.includes(userRegion) ? 1.0 : 0.0
}

/** Score business type match: null→0.5 (unknown), []→1.0 (no restriction), match→1.0, miss→0.0 */
function scoreBusinessType(support: Support, userType: string): number {
  if (support.targetBusinessTypes === null || support.targetBusinessTypes === undefined) return 0.5
  if (support.targetBusinessTypes.length === 0) return 1.0
  return support.targetBusinessTypes.includes(userType) ? 1.0 : 0.0
}

/** Score employee count match: both null→0.5 (unknown), within range→1.0, outside→soft penalty */
function scoreEmployee(support: Support, userCount: number): number {
  const min = support.targetEmployeeMin
  const max = support.targetEmployeeMax

  if (min === null && max === null) return 0.5

  // Both bounds
  if (min !== null && max !== null) {
    if (userCount >= min && userCount <= max) return 1.0
    // Soft penalty: within 50% of range boundary
    const range = max - min
    if (range > 0) {
      if (userCount < min) {
        const dist = (min - userCount) / range
        return Math.max(0, 1 - dist)
      }
      if (userCount > max) {
        const dist = (userCount - max) / range
        return Math.max(0, 1 - dist)
      }
    }
    return 0.0
  }

  // Only max
  if (max !== null) {
    if (userCount <= max) return 1.0
    const overRatio = (userCount - max) / max
    return Math.max(0, 1 - overRatio)
  }

  // Only min
  if (min !== null) {
    if (userCount >= min) return 1.0
    const underRatio = (min - userCount) / min
    return Math.max(0, 1 - underRatio)
  }

  return 1.0
}

/** Score revenue match: both null→0.5 (unknown), within range→1.0, outside→soft penalty */
function scoreRevenue(support: Support, userRevenue: number): number {
  const min = support.targetRevenueMin
  const max = support.targetRevenueMax

  if (min === null && max === null) return 0.5

  if (min !== null && max !== null) {
    if (userRevenue >= min && userRevenue <= max) return 1.0
    const range = max - min
    if (range > 0) {
      if (userRevenue < min) {
        const dist = (min - userRevenue) / range
        return Math.max(0, 1 - dist)
      }
      if (userRevenue > max) {
        const dist = (userRevenue - max) / range
        return Math.max(0, 1 - dist)
      }
    }
    return 0.0
  }

  if (max !== null) {
    if (userRevenue <= max) return 1.0
    const overRatio = (userRevenue - max) / max
    return Math.max(0, 1 - overRatio)
  }

  if (min !== null) {
    if (userRevenue >= min) return 1.0
    const underRatio = (min - userRevenue) / min
    return Math.max(0, 1 - underRatio)
  }

  return 1.0
}

/** Score business age match: both null→0.5 (unknown), within range→1.0, outside→soft penalty */
function scoreBusinessAge(support: Support, userAgeMonths: number): number {
  const min = support.targetBusinessAgeMin
  const max = support.targetBusinessAgeMax

  // 예비창업자 (-1) 특수 처리
  if (userAgeMonths === -1) {
    if (min === null && max === null) return 0.5
    if (min !== null && min > 0) return 0.0   // 기존 사업자만 대상
    if (max !== null && max >= 0) return 1.0   // 초기 창업 대상
    return 0.5
  }

  if (min === null && max === null) return 0.5

  if (min !== null && max !== null) {
    if (userAgeMonths >= min && userAgeMonths <= max) return 1.0
    const range = max - min
    if (range > 0) {
      if (userAgeMonths < min) {
        const dist = (min - userAgeMonths) / range
        return Math.max(0, 1 - dist)
      }
      if (userAgeMonths > max) {
        const dist = (userAgeMonths - max) / range
        return Math.max(0, 1 - dist)
      }
    }
    return 0.0
  }

  if (max !== null) {
    if (userAgeMonths <= max) return 1.0
    const overRatio = (userAgeMonths - max) / Math.max(max, 12)
    return Math.max(0, 1 - overRatio)
  }

  if (min !== null) {
    if (userAgeMonths >= min) return 1.0
    const underRatio = (min - userAgeMonths) / Math.max(min, 12)
    return Math.max(0, 1 - underRatio)
  }

  return 1.0
}

/** Score founder age match: both null→0.5 (unknown), within range→1.0, outside→soft penalty */
function scoreFounderAge(support: Support, userAge: number): number {
  const min = support.targetFounderAgeMin
  const max = support.targetFounderAgeMax

  if (min === null && max === null) return 0.5

  if (min !== null && max !== null) {
    if (userAge >= min && userAge <= max) return 1.0
    const range = max - min
    if (range > 0) {
      if (userAge < min) {
        const dist = (min - userAge) / range
        return Math.max(0, 1 - dist)
      }
      if (userAge > max) {
        const dist = (userAge - max) / range
        return Math.max(0, 1 - dist)
      }
    }
    return 0.0
  }

  if (max !== null) {
    if (userAge <= max) return 1.0
    const overRatio = (userAge - max) / Math.max(max, 10)
    return Math.max(0, 1 - overRatio)
  }

  if (min !== null) {
    if (userAge >= min) return 1.0
    const underRatio = (min - userAge) / Math.max(min, 10)
    return Math.max(0, 1 - underRatio)
  }

  return 1.0
}

function getTier(score: number): MatchTier | null {
  if (score >= TIER_THRESHOLDS.exact) return 'exact'
  if (score >= TIER_THRESHOLDS.likely) return 'likely'
  if (score >= TIER_THRESHOLDS.related) return 'related'
  return null
}

/** 추출 신뢰도가 없는 데이터(Bizinfo 등)에 적용하는 기본 신뢰도 */
const DEFAULT_CONFIDENCE = 0.1

/** 신뢰도 가중 적용: 낮은 신뢰도 → 0.5(중립)로 수렴 */
function applyConfidence(rawScore: number, confidence: number): number {
  return rawScore * confidence + 0.5 * (1 - confidence)
}

/**
 * Score-based matching engine v2
 * Replaces binary AND filter with weighted scoring + 3-tier grouping
 */
export function matchSupportsV2(supports: Support[], input: DiagnoseFormData): MatchResult {
  const scored: ScoredSupport[] = []

  for (const support of supports) {
    const conf = (support.extractionConfidence ?? null) as ExtractionConfidence | null

    // 개별 차원별 신뢰도 (null이면 기본값 적용)
    const confRegion = conf?.regions ?? DEFAULT_CONFIDENCE
    const confBusinessType = conf?.businessTypes ?? DEFAULT_CONFIDENCE
    const confEmployee = conf?.employee ?? DEFAULT_CONFIDENCE
    const confRevenue = conf?.revenue ?? DEFAULT_CONFIDENCE
    const confBusinessAge = conf?.businessAge ?? DEFAULT_CONFIDENCE
    const confFounderAge = conf?.founderAge ?? DEFAULT_CONFIDENCE

    const rawRegion = scoreRegion(support, input.region)
    const rawBusinessType = scoreBusinessType(support, input.businessType)
    const rawEmployee = scoreEmployee(support, input.employeeCount)
    const rawRevenue = scoreRevenue(support, input.annualRevenue)
    const rawBusinessAge = scoreBusinessAge(support, input.businessAge)
    const rawFounderAge = scoreFounderAge(support, input.founderAge)

    const breakdown = {
      region: applyConfidence(rawRegion, confRegion),
      businessType: applyConfidence(rawBusinessType, confBusinessType),
      employee: applyConfidence(rawEmployee, confEmployee),
      revenue: applyConfidence(rawRevenue, confRevenue),
      businessAge: applyConfidence(rawBusinessAge, confBusinessAge),
      founderAge: applyConfidence(rawFounderAge, confFounderAge),
    }

    const score =
      breakdown.businessAge * WEIGHTS.businessAge +
      breakdown.region * WEIGHTS.region +
      breakdown.founderAge * WEIGHTS.founderAge +
      breakdown.businessType * WEIGHTS.businessType +
      breakdown.employee * WEIGHTS.employee +
      breakdown.revenue * WEIGHTS.revenue

    // 가중 평균 신뢰도 (각 차원 가중치 비례)
    const overallConfidence =
      confBusinessAge * WEIGHTS.businessAge +
      confRegion * WEIGHTS.region +
      confFounderAge * WEIGHTS.founderAge +
      confBusinessType * WEIGHTS.businessType +
      confEmployee * WEIGHTS.employee +
      confRevenue * WEIGHTS.revenue

    const scores: DimensionScores = {
      region: breakdown.region,
      businessType: breakdown.businessType,
      employee: breakdown.employee,
      revenue: breakdown.revenue,
      businessAge: breakdown.businessAge,
      founderAge: breakdown.founderAge,
      confidence: Math.round(overallConfidence * 1000) / 1000,
      weighted: Math.round(score * 1000) / 1000,
    }

    const tier = getTier(score)
    if (tier) {
      scored.push({ support, score, tier, breakdown, scores })
    }
  }

  // Sort by score descending within each tier
  scored.sort((a, b) => b.score - a.score)

  return {
    exact: scored.filter((s) => s.tier === 'exact'),
    likely: scored.filter((s) => s.tier === 'likely'),
    related: scored.filter((s) => s.tier === 'related'),
    all: scored,
    totalCount: scored.length,
  }
}

/**
 * Backward-compatible wrapper: returns flat Support[] like v1
 * Used during transition period
 */
export function matchSupportsV2Flat(supports: Support[], input: DiagnoseFormData): Support[] {
  const result = matchSupportsV2(supports, input)
  return result.all.map((s) => s.support)
}
