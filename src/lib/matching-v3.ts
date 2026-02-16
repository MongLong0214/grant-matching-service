import type { ExtractionConfidence } from '@/lib/extraction'
import type { DiagnoseFormData, MatchedScore, Support } from '@/types'

// v3 핵심 원칙: "Score Only What You Know" + "Specificity Matters"
// - NULL 차원은 채점에서 완전히 제외
// - 업종/지역 정확 매칭은 범용 차원(연령 등)보다 높은 가치
// - 비즈니스 무관 레코드(복지서비스 등)는 사전 필터링

/** v3 가중치 (합계 = 1.0) */
const WEIGHTS = {
  region: 0.22,
  businessAge: 0.20,
  businessType: 0.18,
  employee: 0.15,
  founderAge: 0.15,
  revenue: 0.10,
} as const

type DimensionKey = 'region' | 'businessType' | 'employee' | 'revenue' | 'businessAge' | 'founderAge'

/** 특이성 차원 (유저 개인화에 직접 기여하는 차원) */
const SPECIFIC_DIMS: Set<DimensionKey> = new Set(['region', 'businessType'])

/** v3 티어 임계값 */
const TIER_THRESHOLDS = {
  tailored: 0.65,
  recommended: 0.40,
  exploratory: 0.20,
} as const

/** v3 티어별 최대 건수 */
const TIER_CAPS = {
  tailored: 20,
  recommended: 30,
  exploratory: 50,
} as const

const TOTAL_CAP = 100

export type MatchTierV3 = 'tailored' | 'recommended' | 'exploratory'

export interface ScoredSupportV3 {
  support: Support
  score: number
  tier: MatchTierV3
  breakdown: {
    region: number
    businessType: number
    employee: number
    revenue: number
    businessAge: number
    founderAge: number
  }
  scores: {
    region: number
    businessType: number
    employee: number
    revenue: number
    businessAge: number
    founderAge: number
    confidence: number
    weighted: number
    coverage: number
  }
}

export interface MatchResultV3 {
  tailored: ScoredSupportV3[]
  recommended: ScoredSupportV3[]
  exploratory: ScoredSupportV3[]
  all: ScoredSupportV3[]
  totalCount: number
  totalAnalyzed: number
  knockedOut: number
  filteredNonBusiness: number
}

// ─── Score Functions (순수 점수, v2와 동일 로직이지만 null 처리 제거) ───

/** 지역 점수: 빈 배열(전국)→1.0, 포함→1.0, 미포함→0.0 */
function scoreRegion(regions: string[], userRegion: string): number {
  if (regions.length === 0) return 1.0
  return regions.includes(userRegion) ? 1.0 : 0.0
}

/**
 * 폼 업종명 → DB 추출 업종명 정규화 매핑
 * 폼은 통계청 KSIC 대분류, DB 추출은 축약형 사용
 * 하나의 폼 업종이 여러 DB 업종에 대응 가능
 */
const BUSINESS_TYPE_ALIASES: Record<string, string[]> = {
  '도매 및 소매업': ['도매업', '소매업', '도매 및 소매업'],
  '숙박 및 음식점업': ['숙박업', '음식점업', '숙박 및 음식점업'],
  '운수 및 창고업': ['운수업', '운수 및 창고업'],
  '전문, 과학 및 기술 서비스업': ['전문서비스업', '전문, 과학 및 기술 서비스업'],
  '교육 서비스업': ['교육서비스업', '교육 서비스업'],
  '보건업 및 사회복지 서비스업': ['보건업', '보건업 및 사회복지 서비스업'],
  '기타': ['기타서비스업', '기타', '예술/스포츠'],
}

/** 유저 업종 → 매칭 가능한 DB 업종명 목록 반환 */
function expandBusinessType(userType: string): string[] {
  const aliases = BUSINESS_TYPE_ALIASES[userType]
  if (aliases) return [userType, ...aliases]
  return [userType]
}

/** 업종 점수: 빈 배열(전업종)→1.0, 유저 업종(확장) 포함→1.0, 미포함→0.0 */
function scoreBusinessType(types: string[], userType: string): number {
  if (types.length === 0) return 1.0
  const expanded = expandBusinessType(userType)
  return types.some(t => expanded.includes(t)) ? 1.0 : 0.0
}

/** 범위 점수: 범위 내→1.0, 범위 외→연속적 감소 */
function scoreRange(
  min: number | null,
  max: number | null,
  userValue: number,
  fallbackDenom: number,
): number {
  if (min !== null && max !== null) {
    if (userValue >= min && userValue <= max) return 1.0
    const range = max - min
    if (range > 0) {
      if (userValue < min) return Math.max(0, 1 - (min - userValue) / range)
      if (userValue > max) return Math.max(0, 1 - (userValue - max) / range)
    }
    return 0.0
  }

  if (max !== null) {
    if (userValue <= max) return 1.0
    return Math.max(0, 1 - (userValue - max) / Math.max(max, fallbackDenom))
  }

  if (min !== null) {
    if (userValue >= min) return 1.0
    return Math.max(0, 1 - (min - userValue) / Math.max(min, fallbackDenom))
  }

  return 1.0
}

/** 업력 점수 (예비창업자 특수 처리) */
function scoreBusinessAge(min: number | null, max: number | null, userAgeMonths: number): number {
  if (userAgeMonths === -1) {
    if (min !== null && min > 0) return 0.0
    if (max !== null && max >= 0) return 1.0
    return 0.5
  }
  return scoreRange(min, max, userAgeMonths, 12)
}

// ─── 데이터 존재 여부 판정 ───

interface DimensionInfo {
  key: DimensionKey
  weight: number
  hasData: boolean
  confidence: number
  rawScore: number
}

function getDimensionInfo(support: Support, input: DiagnoseFormData): DimensionInfo[] {
  const conf = (support.extractionConfidence ?? null) as ExtractionConfidence | null
  const MIN_CONFIDENCE = 0.3

  const regions = support.targetRegions
  const types = support.targetBusinessTypes

  return [
    {
      key: 'region',
      weight: WEIGHTS.region,
      hasData: regions !== null && regions !== undefined && regions.length > 0 && (conf?.regions ?? 0) >= MIN_CONFIDENCE,
      confidence: conf?.regions ?? 0,
      rawScore: regions !== null && regions !== undefined && regions.length > 0
        ? scoreRegion(regions, input.region)
        : 0,
    },
    {
      key: 'businessType',
      weight: WEIGHTS.businessType,
      hasData: types !== null && types !== undefined && types.length > 0 && (conf?.businessTypes ?? 0) >= MIN_CONFIDENCE,
      confidence: conf?.businessTypes ?? 0,
      rawScore: types !== null && types !== undefined && types.length > 0
        ? scoreBusinessType(types, input.businessType)
        : 0,
    },
    {
      key: 'employee',
      weight: WEIGHTS.employee,
      hasData: (support.targetEmployeeMin !== null || support.targetEmployeeMax !== null) && (conf?.employee ?? 0) >= MIN_CONFIDENCE,
      confidence: conf?.employee ?? 0,
      rawScore: (support.targetEmployeeMin !== null || support.targetEmployeeMax !== null)
        ? scoreRange(support.targetEmployeeMin, support.targetEmployeeMax, input.employeeCount, 10)
        : 0,
    },
    {
      key: 'revenue',
      weight: WEIGHTS.revenue,
      hasData: (support.targetRevenueMin !== null || support.targetRevenueMax !== null) && (conf?.revenue ?? 0) >= MIN_CONFIDENCE,
      confidence: conf?.revenue ?? 0,
      rawScore: (support.targetRevenueMin !== null || support.targetRevenueMax !== null)
        ? scoreRange(support.targetRevenueMin, support.targetRevenueMax, input.annualRevenue, 100_000_000)
        : 0,
    },
    {
      key: 'businessAge',
      weight: WEIGHTS.businessAge,
      hasData: (support.targetBusinessAgeMin !== null || support.targetBusinessAgeMax !== null) && (conf?.businessAge ?? 0) >= MIN_CONFIDENCE,
      confidence: conf?.businessAge ?? 0,
      rawScore: (support.targetBusinessAgeMin !== null || support.targetBusinessAgeMax !== null)
        ? scoreBusinessAge(support.targetBusinessAgeMin, support.targetBusinessAgeMax, input.businessAge)
        : 0,
    },
    {
      key: 'founderAge',
      weight: WEIGHTS.founderAge,
      hasData: (support.targetFounderAgeMin !== null || support.targetFounderAgeMax !== null) && (conf?.founderAge ?? 0) >= MIN_CONFIDENCE,
      confidence: conf?.founderAge ?? 0,
      rawScore: (support.targetFounderAgeMin !== null || support.targetFounderAgeMax !== null)
        ? scoreRange(support.targetFounderAgeMin, support.targetFounderAgeMax, input.founderAge, 10)
        : 0,
    },
  ]
}

// ─── Stage 0: Business Relevance Pre-filter ───

function isBusinessRelevant(support: Support): boolean {
  const title = support.title

  // 개인 복지서비스 키워드 → 즉시 제외 (소상공인 대상 아님)
  const welfareKeywords = [
    '수당', '급여', '바우처', '돌봄', '보육', '육아', '출산', '양육',
    '입학', '장학', '의료비', '건강보험', '장애인', '어르신', '노인',
    '복지카드', '아동', '다자녀', '한부모', '기초생활', '긴급복지',
    '주거급여', '교육급여', '생계급여', '장례', '재난지원금',
    '동행서비스', '방문건강', '예방접종', '치매',
  ]
  if (welfareKeywords.some(kw => title.includes(kw))) return false

  // 타겟팅 데이터가 있는 레코드는 비즈니스 관련으로 간주
  const types = support.targetBusinessTypes
  if (types && types.length > 0) return true
  if (support.targetEmployeeMin !== null || support.targetEmployeeMax !== null) return true
  if (support.targetRevenueMin !== null || support.targetRevenueMax !== null) return true

  // 타겟팅 데이터 없는 레코드는 제목 키워드로 판별
  const businessKeywords = [
    '소상공인', '중소기업', '기업', '사업자', '창업', '벤처',
    '스타트업', '고용', '수출', '제조', '기술개발', 'R&D',
    '특허', '지식재산', '경영', '컨설팅', '자금', '융자',
    '보증', '마케팅', '판로', '입주', '인큐베이팅',
    '장려금', '지원사업', '공모', '산업',
  ]
  return businessKeywords.some(kw => title.includes(kw))
}

// ─── Stage 1: Knockout Filter ───

function isKnockedOut(support: Support, input: DiagnoseFormData): boolean {
  const conf = (support.extractionConfidence ?? null) as ExtractionConfidence | null

  // 지역: 명시적 지역 목록이 있고 (신뢰도 ≥ 0.7) 사용자 지역 미포함
  const regions = support.targetRegions
  if (regions && regions.length > 0 && (conf?.regions ?? 0) >= 0.7) {
    if (!regions.includes(input.region)) return true
  }

  // 업종: 명시적 업종 목록이 있고 (신뢰도 ≥ 0.5) 사용자 업종 미포함
  const types = support.targetBusinessTypes
  if (types && types.length > 0 && (conf?.businessTypes ?? 0) >= 0.5) {
    const expanded = expandBusinessType(input.businessType)
    if (!types.some(t => expanded.includes(t))) return true
  }

  // 직원 수: 최대 × 1.5 초과 또는 최소 × 0.5 미만
  if (support.targetEmployeeMax !== null && input.employeeCount > support.targetEmployeeMax * 1.5) return true
  if (support.targetEmployeeMin !== null && input.employeeCount < support.targetEmployeeMin * 0.5) return true

  // 매출: 최대 × 2 초과
  if (support.targetRevenueMax !== null && input.annualRevenue > support.targetRevenueMax * 2) return true

  // 업력: 최대 × 1.5 초과 (예비창업자 제외)
  if (input.businessAge !== -1) {
    if (support.targetBusinessAgeMax !== null && support.targetBusinessAgeMax > 0 && input.businessAge > support.targetBusinessAgeMax * 1.5) return true
  }

  // 대표자 연령: 최대 + 10 초과 또는 최소 - 10 미만
  if (support.targetFounderAgeMax !== null && input.founderAge > support.targetFounderAgeMax + 10) return true
  if (support.targetFounderAgeMin !== null && input.founderAge < support.targetFounderAgeMin - 10) return true

  return false
}

// ─── Stage 2 & 3: Score + Coverage ───

function getTierV3(score: number): MatchTierV3 | null {
  if (score >= TIER_THRESHOLDS.tailored) return 'tailored'
  if (score >= TIER_THRESHOLDS.recommended) return 'recommended'
  if (score >= TIER_THRESHOLDS.exploratory) return 'exploratory'
  return null
}

// ─── Organization Diversity ───

/** 동일 기관 결과 최대 3개로 제한 (티어 내 다양성 확보) */
function enforceOrgDiversity(items: ScoredSupportV3[], maxPerOrg: number = 3): ScoredSupportV3[] {
  const orgCount = new Map<string, number>()
  return items.filter(item => {
    const org = item.support.organization
    const count = orgCount.get(org) || 0
    if (count >= maxPerOrg) return false
    orgCount.set(org, count + 1)
    return true
  })
}

/**
 * Matching engine v3: 4-stage pipeline
 * Stage 0: Business Relevance → Stage 1: Knockout → Stage 2: Score Only What You Know → Stage 3: Coverage Factor
 */
export function matchSupportsV3(supports: Support[], input: DiagnoseFormData): MatchResultV3 {
  const scored: ScoredSupportV3[] = []
  let knockedOut = 0
  let filteredNonBusiness = 0

  for (const support of supports) {
    // Stage 0: Business Relevance Pre-filter
    if (!isBusinessRelevant(support)) {
      filteredNonBusiness++
      continue
    }

    // Stage 1: Knockout
    if (isKnockedOut(support, input)) {
      knockedOut++
      continue
    }

    // Stage 2: Score Only What You Know
    const dims = getDimensionInfo(support, input)
    const activeDims = dims.filter((d) => d.hasData)

    // 활성 차원이 0이면 제외
    if (activeDims.length < 1) continue

    // 특이성 차원(업종/지역) 매칭 여부 확인
    const specificDims = activeDims.filter((d) => SPECIFIC_DIMS.has(d.key))
    const hasSpecificMatch = specificDims.some((d) => d.rawScore >= 0.8)
    // 범용 차원만 있고 특이성 없으면 → 개인화 가치 낮음
    const specificOnly = specificDims.length === 0 && activeDims.length < 2

    // 특이성 차원 없이 범용 차원 1개만 → 제외 (개인화 불가)
    if (specificOnly) continue

    const totalActiveWeight = activeDims.reduce((sum, d) => sum + d.weight, 0)
    const weightedSum = activeDims.reduce((sum, d) => sum + d.rawScore * d.weight, 0)
    const matchScore = weightedSum / totalActiveWeight

    // Stage 3: Coverage Factor (강화된 패널티)
    const coverageRatio = totalActiveWeight / 1.0
    const coverageFactor = 0.1 + 0.9 * coverageRatio
    const finalScore = matchScore * coverageFactor

    // 특이성 기반 티어 캡: 업종/지역 매칭 없으면 exploratory까지만
    let tier = getTierV3(finalScore)
    if (!tier) continue

    if (!hasSpecificMatch && (tier === 'tailored' || tier === 'recommended')) {
      tier = 'exploratory'
    }

    // breakdown: 모든 차원의 raw score (활성 여부 무관하게 기록)
    const breakdown: Record<DimensionKey, number> = { region: 0, businessType: 0, employee: 0, revenue: 0, businessAge: 0, founderAge: 0 }
    for (const d of dims) {
      breakdown[d.key] = d.hasData ? Math.round(d.rawScore * 1000) / 1000 : 0
    }

    // 가중 평균 신뢰도
    const overallConfidence = activeDims.length > 0
      ? activeDims.reduce((sum, d) => sum + d.confidence * d.weight, 0) / totalActiveWeight
      : 0

    scored.push({
      support,
      score: Math.round(finalScore * 1000) / 1000,
      tier,
      breakdown,
      scores: {
        region: breakdown.region,
        businessType: breakdown.businessType,
        employee: breakdown.employee,
        revenue: breakdown.revenue,
        businessAge: breakdown.businessAge,
        founderAge: breakdown.founderAge,
        confidence: Math.round(overallConfidence * 1000) / 1000,
        weighted: Math.round(matchScore * 1000) / 1000,
        coverage: Math.round(coverageFactor * 1000) / 1000,
      },
    })
  }

  // 점수 내림차순 정렬
  scored.sort((a, b) => b.score - a.score)

  // 티어별 분류 + 조직 다양성 + 캡 적용
  const tailoredAll = enforceOrgDiversity(scored.filter((s) => s.tier === 'tailored'))
  const recommendedAll = enforceOrgDiversity(scored.filter((s) => s.tier === 'recommended'))
  const exploratoryAll = enforceOrgDiversity(scored.filter((s) => s.tier === 'exploratory'))

  // Adaptive cap: tailored가 3개 미만이면 recommended 캡 증가
  const tailoredCap = TIER_CAPS.tailored
  const recommendedCap = tailoredAll.length < 3
    ? TIER_CAPS.recommended + (tailoredCap - tailoredAll.length)
    : TIER_CAPS.recommended
  const exploratoryCap = TIER_CAPS.exploratory

  const tailored = tailoredAll.slice(0, tailoredCap)
  const recommended = recommendedAll.slice(0, recommendedCap)
  const exploratory = exploratoryAll.slice(0, exploratoryCap)

  // 총합 캡 적용
  const all: ScoredSupportV3[] = []
  let remaining = TOTAL_CAP

  for (const item of tailored) {
    if (remaining <= 0) break
    all.push(item)
    remaining--
  }
  for (const item of recommended) {
    if (remaining <= 0) break
    all.push(item)
    remaining--
  }
  for (const item of exploratory) {
    if (remaining <= 0) break
    all.push(item)
    remaining--
  }

  return {
    tailored,
    recommended,
    exploratory,
    all,
    totalCount: all.length,
    totalAnalyzed: supports.length,
    knockedOut,
    filteredNonBusiness,
  }
}

/**
 * Flat format: MatchedScore[] 호환 반환
 * diagnose API 및 saveDiagnosis에서 사용
 */
export function matchSupportsV3Flat(supports: Support[], input: DiagnoseFormData): {
  result: MatchResultV3
  matchedScores: MatchedScore[]
  matchedSupports: Support[]
} {
  const result = matchSupportsV3(supports, input)

  const matchedScores: MatchedScore[] = result.all.map((s) => ({
    supportId: s.support.id,
    score: Math.round(s.score * 100) / 100,
    tier: s.tier,
    breakdown: s.breakdown,
    scores: {
      region: s.scores.region,
      businessType: s.scores.businessType,
      employee: s.scores.employee,
      revenue: s.scores.revenue,
      businessAge: s.scores.businessAge,
      founderAge: s.scores.founderAge,
      confidence: s.scores.confidence,
      weighted: s.scores.weighted,
    },
  }))

  const matchedSupports = result.all.map((s) => s.support)

  return { result, matchedScores, matchedSupports }
}
