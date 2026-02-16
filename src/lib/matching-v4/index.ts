// v4: 듀얼 트랙 (개인 + 사업자) 매칭 엔진
import type { MatchedScore, Support, UserInput } from '@/types'
import {
  type DimensionInfo, getBusinessDimensions, getPersonalDimensions,
  isKnockedOutBusiness, isKnockedOutPersonal,
} from './dimensions'

export type { DimensionInfo } from './dimensions'
export type MatchTierV4 = 'tailored' | 'recommended' | 'exploratory'

export interface ScoredSupportV4 {
  support: Support
  score: number
  tier: MatchTierV4
  breakdown: Record<string, number>
  scores: Record<string, number> & { confidence: number; weighted: number; coverage: number }
}

export interface MatchResultV4 {
  tailored: ScoredSupportV4[]
  recommended: ScoredSupportV4[]
  exploratory: ScoredSupportV4[]
  all: ScoredSupportV4[]
  totalCount: number
  totalAnalyzed: number
  knockedOut: number
  filteredByServiceType: number
}

const TIER_THRESHOLDS = { tailored: 0.65, recommended: 0.40, exploratory: 0.20 } as const
const TIER_CAPS = { tailored: 20, recommended: 30, exploratory: 50 } as const
const TOTAL_CAP = 100

function getTierV4(score: number): MatchTierV4 | null {
  if (score >= TIER_THRESHOLDS.tailored) return 'tailored'
  if (score >= TIER_THRESHOLDS.recommended) return 'recommended'
  if (score >= TIER_THRESHOLDS.exploratory) return 'exploratory'
  return null
}

function enforceOrgDiversity(items: ScoredSupportV4[], maxPerOrg = 3): ScoredSupportV4[] {
  const orgCount = new Map<string, number>()
  return items.filter(item => {
    const org = item.support.organization
    const count = orgCount.get(org) || 0
    if (count >= maxPerOrg) return false
    orgCount.set(org, count + 1)
    return true
  })
}

function scorePipeline(
  dims: DimensionInfo[], hasInterestBonus: boolean,
): { finalScore: number; matchScore: number; coverageFactor: number; hasSpecificMatch: boolean } | null {
  const activeDims = dims.filter(d => d.hasData)
  if (activeDims.length < 1) return null
  const specificDims = activeDims.filter(d => d.isSpecific)
  const hasSpecificMatch = specificDims.some(d => d.rawScore >= 0.8)
  if (specificDims.length === 0 && activeDims.length < 2) return null

  const totalActiveWeight = activeDims.reduce((sum, d) => sum + d.weight, 0)
  const matchScore = activeDims.reduce((sum, d) => sum + d.rawScore * d.weight, 0) / totalActiveWeight
  const coverageFactor = 0.1 + 0.9 * (totalActiveWeight / 1.0)
  let finalScore = matchScore * coverageFactor
  if (hasInterestBonus) finalScore = Math.min(1.0, finalScore + 0.10)
  return { finalScore, matchScore, coverageFactor, hasSpecificMatch }
}

function isServiceTypeMatch(support: Support, userType: 'personal' | 'business'): boolean {
  const st = support.serviceType ?? 'unknown'
  return st === 'both' || st === userType || st === 'unknown'
}

function hasInterestCategoryMatch(support: Support, interestCategories: string[]): boolean {
  if (interestCategories.length === 0) return false
  const bc = support.benefitCategories
  if (!bc || bc.length === 0) return false
  return bc.some(c => interestCategories.includes(c))
}

// 공통 스코어링 (사업자/개인 중복 제거)
function scoreSupport(
  support: Support, dims: DimensionInfo[], interestBonus: boolean,
): ScoredSupportV4 | null {
  const result = scorePipeline(dims, interestBonus)
  if (!result) return null
  let tier = getTierV4(result.finalScore)
  if (!tier) return null
  if (!result.hasSpecificMatch && (tier === 'tailored' || tier === 'recommended')) tier = 'exploratory'

  const breakdown: Record<string, number> = {}
  const scores: Record<string, number> = {}
  for (const d of dims) {
    breakdown[d.key] = d.hasData ? Math.round(d.rawScore * 1000) / 1000 : 0
    scores[d.key] = breakdown[d.key]
  }
  const activeDims = dims.filter(d => d.hasData)
  const totalWeight = activeDims.reduce((sum, d) => sum + d.weight, 0)
  const confidence = activeDims.length > 0
    ? activeDims.reduce((sum, d) => sum + d.confidence * d.weight, 0) / totalWeight : 0

  return {
    support, tier,
    score: Math.round(result.finalScore * 1000) / 1000,
    breakdown,
    scores: {
      ...scores,
      confidence: Math.round(confidence * 1000) / 1000,
      weighted: Math.round(result.matchScore * 1000) / 1000,
      coverage: Math.round(result.coverageFactor * 1000) / 1000,
    },
  }
}

export function matchSupportsV4(supports: Support[], userInput: UserInput): MatchResultV4 {
  const scored: ScoredSupportV4[] = []
  let knockedOut = 0
  let filteredByServiceType = 0

  for (const support of supports) {
    if (!isServiceTypeMatch(support, userInput.userType)) { filteredByServiceType++; continue }
    if (userInput.userType === 'business') {
      if (isKnockedOutBusiness(support, userInput)) { knockedOut++; continue }
      const dims = getBusinessDimensions(support, userInput)
      const r = scoreSupport(support, dims, false)
      if (r) scored.push(r)
    } else {
      if (isKnockedOutPersonal(support, userInput)) { knockedOut++; continue }
      const dims = getPersonalDimensions(support, userInput)
      const r = scoreSupport(support, dims, hasInterestCategoryMatch(support, userInput.interestCategories))
      if (r) scored.push(r)
    }
  }

  scored.sort((a, b) => b.score - a.score)

  const tailoredAll = enforceOrgDiversity(scored.filter(s => s.tier === 'tailored'))
  const recommendedAll = enforceOrgDiversity(scored.filter(s => s.tier === 'recommended'))
  const exploratoryAll = enforceOrgDiversity(scored.filter(s => s.tier === 'exploratory'))
  const recCap = tailoredAll.length < 3
    ? TIER_CAPS.recommended + (TIER_CAPS.tailored - tailoredAll.length)
    : TIER_CAPS.recommended
  const tailored = tailoredAll.slice(0, TIER_CAPS.tailored)
  const recommended = recommendedAll.slice(0, recCap)
  const exploratory = exploratoryAll.slice(0, TIER_CAPS.exploratory)

  const all: ScoredSupportV4[] = []
  let remaining = TOTAL_CAP
  for (const tier of [tailored, recommended, exploratory]) {
    for (const item of tier) { if (remaining <= 0) break; all.push(item); remaining-- }
  }

  return { tailored, recommended, exploratory, all,
    totalCount: all.length, totalAnalyzed: supports.length, knockedOut, filteredByServiceType }
}

/** Flat format: MatchedScore[] 호환 반환 (diagnose API 및 saveDiagnosis에서 사용) */
export function matchSupportsV4Flat(supports: Support[], userInput: UserInput): {
  result: MatchResultV4; matchedScores: MatchedScore[]; matchedSupports: Support[]
} {
  const result = matchSupportsV4(supports, userInput)
  const matchedScores: MatchedScore[] = result.all.map(s => ({
    supportId: s.support.id,
    score: Math.round(s.score * 100) / 100,
    tier: s.tier,
    breakdown: { region: s.breakdown.region ?? 0, ...s.breakdown },
    scores: { region: s.scores.region ?? 0, ...s.scores,
      confidence: s.scores.confidence, weighted: s.scores.weighted },
  }))
  return { result, matchedScores, matchedSupports: result.all.map(s => s.support) }
}
