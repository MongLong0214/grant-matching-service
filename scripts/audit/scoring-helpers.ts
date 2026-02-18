/**
 * 감사 점수 계산 및 분석 헬퍼
 */
import type { Support } from '../../src/types'
import type { MatchResultV4, ScoredSupportV4 } from '../../src/lib/matching-v4/index'
import { matchSupportsV4 } from '../../src/lib/matching-v4/index'
import { REGION_DISTRICTS } from '../../src/constants/index'
import type { TestProfile } from './profile-generators'
import { pick } from './profile-generators'

export interface TypeMetrics {
  count: number
  subRegionSupportsFound: number
  subRegionInTailored: number
  subRegionInRecommended: number
  subRegionInExploratory: number
  subRegionMissed: number
  scoreLiftSum: number
  scoreLiftCount: number
  noImpactCount: number
  fallbackAppliedCount: number
  diffCheckCount: number
  diffFoundCount: number
}

export interface GlobalCounters {
  totalSubRegionExists: number
  totalSubRegionMatched: number
  totalSubRegionInTopTiers: number
  regionFpTotal: number
  regionFpCount: number
  unknownInTopTier: number
  topTierTotal: number
  unknownInTailored: number
  tailoredTotal: number
  unknownInRecommended: number
  recommendedTotal: number
  crossTrackViolations: number
  crossTrackChecks: number
  zeroMatchCount: number
}

export function createEmptyMetrics(): TypeMetrics {
  return {
    count: 0, subRegionSupportsFound: 0, subRegionInTailored: 0,
    subRegionInRecommended: 0, subRegionInExploratory: 0, subRegionMissed: 0,
    scoreLiftSum: 0, scoreLiftCount: 0, noImpactCount: 0,
    fallbackAppliedCount: 0, diffCheckCount: 0, diffFoundCount: 0,
  }
}

export function createEmptyCounters(): GlobalCounters {
  return {
    totalSubRegionExists: 0, totalSubRegionMatched: 0, totalSubRegionInTopTiers: 0,
    regionFpTotal: 0, regionFpCount: 0,
    unknownInTopTier: 0, topTierTotal: 0,
    unknownInTailored: 0, tailoredTotal: 0,
    unknownInRecommended: 0, recommendedTotal: 0,
    crossTrackViolations: 0, crossTrackChecks: 0, zeroMatchCount: 0,
  }
}

/** 단일 프로필에 대해 매칭 실행 + 메트릭 수집 */
export function analyzeProfile(
  profile: TestProfile,
  allSupports: Support[],
  m: TypeMetrics,
  g: GlobalCounters,
  processed: number,
) {
  m.count++
  const result = matchSupportsV4(allSupports, profile.input)

  // sub-region supports 관련 분석
  const relevantSubs = allSupports.filter(s => {
    if (!s.targetSubRegions?.length) return false
    if (!s.targetRegions?.includes(profile.targetRegion)) return false
    return !!(profile.targetSubRegion && s.targetSubRegions.includes(profile.targetSubRegion))
  })

  if (profile.profileType === 'A') analyzeTypeA(profile, relevantSubs, result, allSupports, m, g)
  if (profile.profileType === 'B') analyzeTypeB(profile, result, allSupports, m)
  if (profile.profileType === 'C') analyzeTypeC(profile, result, allSupports, m)

  // 지역 FP + unknown-in-tier + cross-track + 0-match
  analyzeGlobalMetrics(profile, result, g)

  // Differentiation 샘플링 (Type A, 매 10번째)
  if (profile.profileType === 'A' && processed % 10 === 0 && profile.targetSubRegion) {
    analyzeDifferentiation(profile, result, allSupports, m)
  }
}

function analyzeTypeA(
  profile: TestProfile, relevantSubs: Support[],
  result: MatchResultV4, allSupports: Support[],
  m: TypeMetrics, g: GlobalCounters,
) {
  m.subRegionSupportsFound += relevantSubs.length
  g.totalSubRegionExists += relevantSubs.length

  for (const sr of relevantSubs) {
    const inT = result.tailored.some(s => s.support.id === sr.id)
    const inR = result.recommended.some(s => s.support.id === sr.id)
    const inE = result.exploratory.some(s => s.support.id === sr.id)
    const inAny = result.all.some(s => s.support.id === sr.id)
    if (inT) { m.subRegionInTailored++; g.totalSubRegionInTopTiers++; g.totalSubRegionMatched++ }
    else if (inR) { m.subRegionInRecommended++; g.totalSubRegionInTopTiers++; g.totalSubRegionMatched++ }
    else if (inE) { m.subRegionInExploratory++; g.totalSubRegionMatched++ }
    else if (inAny) { g.totalSubRegionMatched++ }
    else { m.subRegionMissed++ }
  }

  // 대조 실험: subRegion 없이 매칭 → score lift
  const resultWithout = matchSupportsV4(allSupports, { ...profile.input, subRegion: undefined })
  for (const sr of relevantSubs) {
    const withScore = result.all.find(s => s.support.id === sr.id)?.score ?? 0
    const withoutScore = resultWithout.all.find(s => s.support.id === sr.id)?.score ?? 0
    if (withScore > 0 || withoutScore > 0) {
      m.scoreLiftSum += (withScore - withoutScore)
      m.scoreLiftCount++
    }
  }
}

function analyzeTypeB(
  profile: TestProfile, result: MatchResultV4,
  allSupports: Support[], m: TypeMetrics,
) {
  const resultWithout = matchSupportsV4(allSupports, { ...profile.input, subRegion: undefined })
  const topIds1 = result.all.slice(0, 10).map(s => s.support.id)
  const topIds2 = resultWithout.all.slice(0, 10).map(s => s.support.id)
  const overlap = topIds1.filter(id => topIds2.includes(id)).length
  const idsMatch = result.all.map(s => s.support.id).join(',') === resultWithout.all.map(s => s.support.id).join(',')
  if (overlap >= 8 || idsMatch) m.noImpactCount++
}

function analyzeTypeC(
  profile: TestProfile, result: MatchResultV4,
  allSupports: Support[], m: TypeMetrics,
) {
  const subInRegion = allSupports.filter(s =>
    s.targetSubRegions?.length && s.targetRegions?.includes(profile.targetRegion) && s.regionScope === 'regional'
  )
  if (subInRegion.length === 0) return
  let applied = 0
  for (const sr of subInRegion) {
    const scored = result.all.find(s => s.support.id === sr.id)
    if (scored?.breakdown?.['region'] !== undefined && Math.abs(scored.breakdown['region'] - 0.85) < 0.01) applied++
  }
  if (applied > 0) m.fallbackAppliedCount++
}

function analyzeGlobalMetrics(profile: TestProfile, result: MatchResultV4, g: GlobalCounters) {
  for (const scored of result.all) {
    const s = scored.support
    if (s.regionScope === 'regional' && s.targetRegions?.length) {
      g.regionFpTotal++
      if (!s.targetRegions.includes(profile.targetRegion)) g.regionFpCount++
    }
    g.crossTrackChecks++
    const st = s.serviceType ?? 'unknown'
    if (profile.userType === 'personal' && st === 'business') g.crossTrackViolations++
    if (profile.userType === 'business' && st === 'personal') g.crossTrackViolations++
  }
  for (const scored of result.tailored) {
    g.tailoredTotal++; g.topTierTotal++
    if (scored.support.regionScope === 'unknown') { g.unknownInTailored++; g.unknownInTopTier++ }
  }
  for (const scored of result.recommended) {
    g.recommendedTotal++; g.topTierTotal++
    if (scored.support.regionScope === 'unknown') { g.unknownInRecommended++; g.unknownInTopTier++ }
  }
  if (result.all.length === 0) g.zeroMatchCount++
}

function analyzeDifferentiation(
  profile: TestProfile, result: MatchResultV4,
  allSupports: Support[], m: TypeMetrics,
) {
  const districts = REGION_DISTRICTS[profile.targetRegion] ?? []
  const others = districts.filter(d => d !== profile.targetSubRegion)
  if (others.length === 0) return
  const altResult = matchSupportsV4(allSupports, { ...profile.input, subRegion: pick(others) })
  const origIds = new Set(result.all.map(s => s.support.id))
  const altIds = new Set(altResult.all.map(s => s.support.id))
  const union = new Set([...origIds, ...altIds])
  const intersection = [...origIds].filter(id => altIds.has(id))
  const diffRatio = union.size > 0 ? 1 - (intersection.length / union.size) : 0
  m.diffCheckCount++
  if (diffRatio > 0.05) m.diffFoundCount++
}
