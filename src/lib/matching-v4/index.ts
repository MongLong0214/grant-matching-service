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

const TIER_THRESHOLDS = { tailored: 0.45, recommended: 0.30, exploratory: 0.18 } as const
const TIER_CAPS = { tailored: 20, recommended: 25, exploratory: 25 } as const
const TOTAL_CAP = 70

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
  // 특정 차원이 없으면 1개 일반 차원만으로는 부족 (최소 2개 필요)
  if (specificDims.length === 0 && activeDims.length < 2) return null
  // 하지만 1개라도 특정 차원이 있으면 진입 허용 (coverage 확대)

  const totalActiveWeight = activeDims.reduce((sum, d) => sum + d.weight, 0)
  // 신뢰도 가중: 저신뢰(< 0.6) 차원만 0.5 기본값 쪽으로 끌어당김
  const matchScore = activeDims.reduce((sum, d) => {
    const effective = d.confidence < 0.6
      ? d.rawScore * d.confidence + 0.5 * (1 - d.confidence)
      : d.rawScore
    return sum + effective * d.weight
  }, 0) / (totalActiveWeight || 1)
  const coverageFactor = 0.2 + 0.8 * (totalActiveWeight / 1.0)
  let finalScore = matchScore * coverageFactor
  if (hasInterestBonus) finalScore = Math.min(1.0, finalScore * 1.12)
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
  support: Support, dims: DimensionInfo[], interestBonus: boolean, subRegionMatch: boolean,
): ScoredSupportV4 | null {
  const result = scorePipeline(dims, interestBonus)
  if (!result) return null
  // 구/군 정확 일치 보너스: coverage 패널티를 상쇄하여 지역 맞춤 정책 가시성 확보
  if (subRegionMatch) result.finalScore = Math.min(1.0, result.finalScore + 0.15)
  let tier = getTierV4(result.finalScore)
  if (!tier) return null
  // 특정 차원에서 높은 점수(0.8+)가 없으면 tailored 진입을 더 엄격하게
  if (!result.hasSpecificMatch && tier === 'tailored' && result.finalScore < 0.60) tier = 'recommended'
  // unknown 지역은 tailored 진입 불가 — "맞춤"은 지역이 확인된 정책만
  if (support.regionScope === 'unknown' && tier === 'tailored') tier = 'recommended'

  const breakdown: Record<string, number> = {}
  const scores: Record<string, number> = {}
  for (const d of dims) {
    breakdown[d.key] = d.hasData ? Math.round(d.rawScore * 1000) / 1000 : 0
    scores[d.key] = breakdown[d.key]
  }
  const activeDims = dims.filter(d => d.hasData)
  const totalWeight = activeDims.reduce((sum, d) => sum + d.weight, 0)
  const confidence = activeDims.length > 0
    ? activeDims.reduce((sum, d) => sum + d.confidence * d.weight, 0) / (totalWeight || 1) : 0

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
    const subRegionMatch = !!(userInput.subRegion &&
      support.targetSubRegions && support.targetSubRegions.length > 0 &&
      support.targetSubRegions.includes(userInput.subRegion))
    if (userInput.userType === 'business') {
      if (isKnockedOutBusiness(support, userInput)) { knockedOut++; continue }
      const dims = getBusinessDimensions(support, userInput)
      const r = scoreSupport(support, dims, false, subRegionMatch)
      if (r) scored.push(r)
    } else {
      if (isKnockedOutPersonal(support, userInput)) { knockedOut++; continue }
      const dims = getPersonalDimensions(support, userInput)
      const r = scoreSupport(support, dims, hasInterestCategoryMatch(support, userInput.interestCategories), subRegionMatch)
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
    breakdown: { ...s.breakdown, region: s.breakdown.region ?? 0 },
    scores: { ...s.scores, region: s.scores.region ?? 0,
      confidence: s.scores.confidence, weighted: s.scores.weighted },
  }))
  return { result, matchedScores, matchedSupports: result.all.map(s => s.support) }
}
