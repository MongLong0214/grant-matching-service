import type { DiagnoseFormData, Support } from '@/types'

/** Matching tier thresholds */
const TIER_THRESHOLDS = {
  exact: 0.7,    // 맞춤추천: 70%+ match
  likely: 0.4,   // 추천: 40-69%
  related: 0.15, // 관련사업: 15-39%
} as const

/** Axis weights (sum = 1.0) */
const WEIGHTS = {
  region: 0.25,
  businessType: 0.25,
  employee: 0.20,
  revenue: 0.15,
  businessAge: 0.15,
} as const

export type MatchTier = 'exact' | 'likely' | 'related'

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
  }
}

export interface MatchResult {
  exact: ScoredSupport[]
  likely: ScoredSupport[]
  related: ScoredSupport[]
  all: ScoredSupport[]
  totalCount: number
}

function calculateBusinessAgeMonths(startDateString: string): number {
  const startDate = new Date(startDateString)
  const now = new Date()
  const months =
    (now.getFullYear() - startDate.getFullYear()) * 12 +
    (now.getMonth() - startDate.getMonth())
  return Math.max(0, months)
}

/** Score region match: 1.0 if match or no restriction, 0.0 if excluded */
function scoreRegion(support: Support, userRegion: string): number {
  if (!support.targetRegions || support.targetRegions.length === 0) return 1.0
  return support.targetRegions.includes(userRegion) ? 1.0 : 0.0
}

/** Score business type match */
function scoreBusinessType(support: Support, userType: string): number {
  if (!support.targetBusinessTypes || support.targetBusinessTypes.length === 0) return 1.0
  return support.targetBusinessTypes.includes(userType) ? 1.0 : 0.0
}

/** Score employee count match with soft boundaries */
function scoreEmployee(support: Support, userCount: number): number {
  const min = support.targetEmployeeMin
  const max = support.targetEmployeeMax

  if (min === null && max === null) return 1.0

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

/** Score revenue match with soft boundaries */
function scoreRevenue(support: Support, userRevenue: number): number {
  const min = support.targetRevenueMin
  const max = support.targetRevenueMax

  if (min === null && max === null) return 1.0

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

/** Score business age match with soft boundaries */
function scoreBusinessAge(support: Support, userAgeMonths: number): number {
  const min = support.targetBusinessAgeMin
  const max = support.targetBusinessAgeMax

  if (min === null && max === null) return 1.0

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

function getTier(score: number): MatchTier | null {
  if (score >= TIER_THRESHOLDS.exact) return 'exact'
  if (score >= TIER_THRESHOLDS.likely) return 'likely'
  if (score >= TIER_THRESHOLDS.related) return 'related'
  return null
}

/**
 * Score-based matching engine v2
 * Replaces binary AND filter with weighted scoring + 3-tier grouping
 */
export function matchSupportsV2(supports: Support[], input: DiagnoseFormData): MatchResult {
  const businessAgeMonths = calculateBusinessAgeMonths(input.businessStartDate)

  const scored: ScoredSupport[] = []

  for (const support of supports) {
    const breakdown = {
      region: scoreRegion(support, input.region),
      businessType: scoreBusinessType(support, input.businessType),
      employee: scoreEmployee(support, input.employeeCount),
      revenue: scoreRevenue(support, input.annualRevenue),
      businessAge: scoreBusinessAge(support, businessAgeMonths),
    }

    const score =
      breakdown.region * WEIGHTS.region +
      breakdown.businessType * WEIGHTS.businessType +
      breakdown.employee * WEIGHTS.employee +
      breakdown.revenue * WEIGHTS.revenue +
      breakdown.businessAge * WEIGHTS.businessAge

    const tier = getTier(score)
    if (tier) {
      scored.push({ support, score, tier, breakdown })
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
