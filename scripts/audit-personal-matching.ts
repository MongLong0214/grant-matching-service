#!/usr/bin/env tsx

/**
 * 개인 트랙 매칭 알고리즘 전수검증 — 200개 케이스
 *
 * 실행: npx tsx scripts/audit-personal-matching.ts
 *
 * .env.local에서 Supabase 접속 정보를 로드하여 실제 DB 데이터로 테스트합니다.
 */

import { readFileSync, writeFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

// ─── .env.local 수동 파싱 ───
const envContent = readFileSync('.env.local', 'utf-8')
for (const line of envContent.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eqIdx = trimmed.indexOf('=')
  if (eqIdx === -1) continue
  const key = trimmed.slice(0, eqIdx).trim()
  const val = trimmed.slice(eqIdx + 1).trim()
  if (!process.env[key]) process.env[key] = val
}

// ─── 직접 임포트 대신 인라인 매칭 엔진 구현 ───
// tsconfig paths(@/*)가 scripts/에서 작동하지 않으므로
// 매칭 로직을 직접 포함합니다.

// -- Types --
interface Support {
  id: string
  title: string
  organization: string
  category: string
  startDate: string | null
  endDate: string | null
  detailUrl: string
  targetRegions: string[] | null
  targetBusinessTypes: string[] | null
  targetEmployeeMin: number | null
  targetEmployeeMax: number | null
  targetRevenueMin: number | null
  targetRevenueMax: number | null
  targetBusinessAgeMin: number | null
  targetBusinessAgeMax: number | null
  targetFounderAgeMin: number | null
  targetFounderAgeMax: number | null
  amount: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  source?: string
  rawEligibilityText?: string | null
  rawExclusionText?: string | null
  rawPreferenceText?: string | null
  extractionConfidence?: Record<string, number> | null
  externalId?: string | null
  serviceType?: 'business' | 'personal' | 'both' | 'unknown'
  targetAgeMin?: number | null
  targetAgeMax?: number | null
  targetHouseholdTypes?: string[] | null
  targetIncomeLevels?: string[] | null
  targetEmploymentStatus?: string[] | null
  benefitCategories?: string[] | null
}

interface PersonalFormData {
  ageGroup: string
  gender: string
  region: string
  householdType: string
  incomeLevel: string
  employmentStatus: string
  interestCategories: string[]
}

type UserInput = { userType: 'personal' } & PersonalFormData

// -- ExtractionConfidence --
interface ExtractionConfidence {
  regions: number
  businessTypes: number
  employee: number
  revenue: number
  businessAge: number
  founderAge: number
  age: number
  householdTypes: number
  incomeLevels: number
  employmentStatus: number
  benefitCategories: number
}

// -- Scores (from matching-v4/scores.ts) --
const AGE_GROUP_TO_VALUE: Record<string, number> = {
  '10대': 17, '20대': 25, '30대': 35, '40대': 45, '50대': 55, '60대이상': 70,
}
const INCOME_ORDER = ['기초생활', '차상위', '중위50이하', '중위100이하', '중위100초과']

function scoreRegion(regions: string[], userRegion: string): number {
  if (regions.length === 0) return 1.0
  return regions.includes(userRegion) ? 1.0 : 0.0
}

function scoreRange(min: number | null, max: number | null, userValue: number, fallbackDenom: number): number {
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

function scoreAge(targetMin: number | null, targetMax: number | null, ageGroup: string): number {
  const userAge = AGE_GROUP_TO_VALUE[ageGroup]
  if (!userAge) return 0.5
  if (targetMin === null && targetMax === null) return 1.0
  return scoreRange(targetMin, targetMax, userAge, 10)
}

function scoreHouseholdType(targetTypes: string[] | null, userType: string): number {
  if (!targetTypes || targetTypes.length === 0) return 1.0
  return targetTypes.includes(userType) ? 1.0 : 0.0
}

function scoreIncomeLevel(targetLevels: string[] | null, userLevel: string): number {
  if (!targetLevels || targetLevels.length === 0) return 1.0
  if (targetLevels.includes(userLevel)) return 1.0
  const userIdx = INCOME_ORDER.indexOf(userLevel)
  if (userIdx === -1) return 0.5
  const targetIndices = targetLevels.map(l => INCOME_ORDER.indexOf(l)).filter(i => i !== -1)
  if (targetIndices.length === 0) return 0.5
  const maxTargetIdx = Math.max(...targetIndices)
  if (userIdx <= maxTargetIdx) return 0.8
  return Math.max(0, 1 - (userIdx - maxTargetIdx) * 0.3)
}

function scoreEmploymentStatus(targetStatus: string[] | null, userStatus: string): number {
  if (!targetStatus || targetStatus.length === 0) return 1.0
  return targetStatus.includes(userStatus) ? 1.0 : 0.0
}

// -- Dimensions (from matching-v4/dimensions.ts) --
const PERSONAL_WEIGHTS = {
  region: 0.20, age: 0.25, householdType: 0.20,
  incomeLevel: 0.20, employmentStatus: 0.15,
} as const

interface DimensionInfo {
  key: string
  weight: number
  hasData: boolean
  confidence: number
  rawScore: number
  isSpecific: boolean
}

const MIN_CONF = 0.3

function hasArr(arr: unknown[] | null | undefined, conf: number): boolean {
  return arr !== null && arr !== undefined && arr.length > 0 && conf >= MIN_CONF
}
function hasRange(min: number | null | undefined, max: number | null | undefined, conf: number): boolean {
  return (min != null || max != null) && conf >= MIN_CONF
}

function getPersonalDimensions(support: Support, input: PersonalFormData): DimensionInfo[] {
  const c = (support.extractionConfidence ?? null) as ExtractionConfidence | null
  const regions = support.targetRegions
  return [
    { key: 'region', weight: PERSONAL_WEIGHTS.region, isSpecific: true,
      hasData: hasArr(regions, c?.regions ?? 0), confidence: c?.regions ?? 0,
      rawScore: regions && regions.length > 0 ? scoreRegion(regions, input.region) : 0 },
    { key: 'age', weight: PERSONAL_WEIGHTS.age, isSpecific: true,
      hasData: hasRange(support.targetAgeMin, support.targetAgeMax, c?.age ?? 0), confidence: c?.age ?? 0,
      rawScore: support.targetAgeMin !== null || support.targetAgeMax !== null
        ? scoreAge(support.targetAgeMin ?? null, support.targetAgeMax ?? null, input.ageGroup) : 0 },
    { key: 'householdType', weight: PERSONAL_WEIGHTS.householdType, isSpecific: true,
      hasData: hasArr(support.targetHouseholdTypes, c?.householdTypes ?? 0), confidence: c?.householdTypes ?? 0,
      rawScore: scoreHouseholdType(support.targetHouseholdTypes ?? null, input.householdType) },
    { key: 'incomeLevel', weight: PERSONAL_WEIGHTS.incomeLevel, isSpecific: true,
      hasData: hasArr(support.targetIncomeLevels, c?.incomeLevels ?? 0), confidence: c?.incomeLevels ?? 0,
      rawScore: scoreIncomeLevel(support.targetIncomeLevels ?? null, input.incomeLevel) },
    { key: 'employmentStatus', weight: PERSONAL_WEIGHTS.employmentStatus, isSpecific: false,
      hasData: hasArr(support.targetEmploymentStatus, c?.employmentStatus ?? 0), confidence: c?.employmentStatus ?? 0,
      rawScore: scoreEmploymentStatus(support.targetEmploymentStatus ?? null, input.employmentStatus) },
  ]
}

function isKnockedOutPersonal(support: Support, input: PersonalFormData): boolean {
  const c = (support.extractionConfidence ?? null) as ExtractionConfidence | null
  const regions = support.targetRegions
  if (regions && regions.length > 0 && (c?.regions ?? 0) >= 0.7) {
    if (!regions.includes(input.region)) return true
  }
  const userAge = AGE_GROUP_TO_VALUE[input.ageGroup]
  if (userAge) {
    if (support.targetAgeMax != null && userAge > support.targetAgeMax + 5) return true
    if (support.targetAgeMin != null && userAge < support.targetAgeMin - 5) return true
  }
  const hTypes = support.targetHouseholdTypes
  if (hTypes && hTypes.length > 0 && (c?.householdTypes ?? 0) >= 0.7) {
    if (!hTypes.includes(input.householdType)) return true
  }
  const iLevels = support.targetIncomeLevels
  if (iLevels && iLevels.length > 0 && (c?.incomeLevels ?? 0) >= 0.7) {
    const userIdx = INCOME_ORDER.indexOf(input.incomeLevel)
    const maxTargetIdx = Math.max(...iLevels.map(l => INCOME_ORDER.indexOf(l)).filter(i => i !== -1))
    if (userIdx !== -1 && maxTargetIdx !== -1 && userIdx > maxTargetIdx + 1) return true
  }
  const eStatus = support.targetEmploymentStatus
  if (eStatus && eStatus.length > 0 && (c?.employmentStatus ?? 0) >= 0.7) {
    if (!eStatus.includes(input.employmentStatus)) return true
  }
  return false
}

// -- Matching Engine (from matching-v4/index.ts) --
type MatchTierV4 = 'tailored' | 'recommended' | 'exploratory'

const TIER_THRESHOLDS = { tailored: 0.65, recommended: 0.40, exploratory: 0.20 } as const
const TIER_CAPS = { tailored: 20, recommended: 30, exploratory: 50 } as const
const TOTAL_CAP = 100

interface ScoredSupportV4 {
  support: Support
  score: number
  tier: MatchTierV4
  breakdown: Record<string, number>
  scores: Record<string, number> & { confidence: number; weighted: number; coverage: number }
}

interface MatchResultV4 {
  tailored: ScoredSupportV4[]
  recommended: ScoredSupportV4[]
  exploratory: ScoredSupportV4[]
  all: ScoredSupportV4[]
  totalCount: number
  totalAnalyzed: number
  knockedOut: number
  filteredByServiceType: number
}

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

function matchSupportsV4(supports: Support[], userInput: UserInput): MatchResultV4 {
  const scored: ScoredSupportV4[] = []
  let knockedOut = 0
  let filteredByServiceType = 0

  for (const support of supports) {
    if (!isServiceTypeMatch(support, userInput.userType)) { filteredByServiceType++; continue }
    if (isKnockedOutPersonal(support, userInput)) { knockedOut++; continue }
    const dims = getPersonalDimensions(support, userInput)
    const r = scoreSupport(support, dims, hasInterestCategoryMatch(support, userInput.interestCategories))
    if (r) scored.push(r)
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

// ─── DB Row → Support 매퍼 ───
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSupportRow(row: any): Support {
  return {
    id: row.id,
    title: row.title,
    organization: row.organization,
    category: row.category,
    startDate: row.start_date,
    endDate: row.end_date,
    detailUrl: row.detail_url,
    targetRegions: row.target_regions,
    targetBusinessTypes: row.target_business_types,
    targetEmployeeMin: row.target_employee_min,
    targetEmployeeMax: row.target_employee_max,
    targetRevenueMin: row.target_revenue_min,
    targetRevenueMax: row.target_revenue_max,
    targetBusinessAgeMin: row.target_business_age_min,
    targetBusinessAgeMax: row.target_business_age_max,
    targetFounderAgeMin: row.target_founder_age_min,
    targetFounderAgeMax: row.target_founder_age_max,
    amount: row.amount,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    source: row.source,
    rawEligibilityText: row.raw_eligibility_text,
    rawExclusionText: row.raw_exclusion_text,
    rawPreferenceText: row.raw_preference_text,
    extractionConfidence: row.extraction_confidence,
    externalId: row.external_id,
    serviceType: (row.service_type as Support['serviceType']) ?? 'unknown',
    targetAgeMin: row.target_age_min,
    targetAgeMax: row.target_age_max,
    targetHouseholdTypes: row.target_household_types,
    targetIncomeLevels: row.target_income_levels,
    targetEmploymentStatus: row.target_employment_status,
    benefitCategories: row.benefit_categories,
  }
}

// ─── 200개 테스트 프로필 생성 ───

const REGIONS = [
  '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
  '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
]

const AGE_GROUPS = ['10대', '20대', '30대', '40대', '50대', '60대이상']
const GENDERS = ['남성', '여성']
const HOUSEHOLD_TYPES = ['1인', '신혼부부', '영유아', '다자녀', '한부모', '일반']
const INCOME_LEVELS = ['기초생활', '차상위', '중위50이하', '중위100이하', '중위100초과']
const EMPLOYMENT_STATUSES = ['재직자', '구직자', '학생', '자영업', '무직', '은퇴']
const INTEREST_CATEGORIES = ['주거', '육아', '교육', '취업', '건강', '생활', '문화']

// 다양한 관심분야 조합 프리셋
const INTEREST_COMBOS = [
  ['주거'],
  ['육아'],
  ['교육'],
  ['취업'],
  ['건강'],
  ['생활'],
  ['문화'],
  ['주거', '생활'],
  ['육아', '교육'],
  ['취업', '교육'],
  ['건강', '생활'],
  ['주거', '육아', '교육'],
  ['취업', '건강', '문화'],
  ['주거', '생활', '건강', '문화'],
  ['육아', '교육', '취업'],
  [], // 관심분야 미선택
]

interface TestProfile extends PersonalFormData {
  label: string
}

function generateProfiles(): TestProfile[] {
  const profiles: TestProfile[] = []
  let idx = 0

  // 지역 가중치 배분 (총 200)
  const regionDist: Record<string, number> = {
    '서울': 30, '경기': 25, '부산': 15, '대구': 12, '인천': 12,
    '광주': 10, '대전': 10, '울산': 8, '세종': 8, '강원': 8,
    '충북': 8, '충남': 8, '전북': 8, '전남': 8, '경북': 8,
    '경남': 12, '제주': 10,
  }
  // 총합 = 200

  // 연령대별 순환 인덱스
  let ageIdx = 0
  let genderIdx = 0
  let householdIdx = 0
  let incomeIdx = 0
  let employmentIdx = 0
  let interestIdx = 0

  for (const [region, count] of Object.entries(regionDist)) {
    for (let i = 0; i < count; i++) {
      const ageGroup = AGE_GROUPS[ageIdx % AGE_GROUPS.length]
      const gender = GENDERS[genderIdx % GENDERS.length]
      const householdType = HOUSEHOLD_TYPES[householdIdx % HOUSEHOLD_TYPES.length]
      const incomeLevel = INCOME_LEVELS[incomeIdx % INCOME_LEVELS.length]
      const employmentStatus = EMPLOYMENT_STATUSES[employmentIdx % EMPLOYMENT_STATUSES.length]
      const interestCategories = INTEREST_COMBOS[interestIdx % INTEREST_COMBOS.length]

      profiles.push({
        label: `P${String(idx + 1).padStart(3, '0')}: ${ageGroup} ${gender} ${region} ${householdType} ${incomeLevel} ${employmentStatus}`,
        ageGroup,
        gender,
        region,
        householdType,
        incomeLevel,
        employmentStatus,
        interestCategories,
      })

      idx++
      ageIdx++
      genderIdx++
      householdIdx++
      incomeIdx++
      employmentIdx++
      interestIdx++
    }
  }

  // 핵심 엣지 케이스 덮어쓰기 (마지막 8개를 교체)
  const edgeCases: TestProfile[] = [
    {
      label: 'EDGE-01: 20대 저소득 구직자 1인가구 (서울)',
      ageGroup: '20대', gender: '남성', region: '서울',
      householdType: '1인', incomeLevel: '기초생활', employmentStatus: '구직자',
      interestCategories: ['취업', '주거', '생활'],
    },
    {
      label: 'EDGE-02: 30대 신혼부부 중위100이하 (지방)',
      ageGroup: '30대', gender: '여성', region: '전남',
      householdType: '신혼부부', incomeLevel: '중위100이하', employmentStatus: '재직자',
      interestCategories: ['주거', '육아'],
    },
    {
      label: 'EDGE-03: 60대이상 은퇴 기초생활 1인가구',
      ageGroup: '60대이상', gender: '남성', region: '부산',
      householdType: '1인', incomeLevel: '기초생활', employmentStatus: '은퇴',
      interestCategories: ['건강', '생활'],
    },
    {
      label: 'EDGE-04: 10대 학생 (다자녀 가구)',
      ageGroup: '10대', gender: '여성', region: '경기',
      householdType: '다자녀', incomeLevel: '중위100이하', employmentStatus: '학생',
      interestCategories: ['교육', '문화'],
    },
    {
      label: 'EDGE-05: 40대 한부모 차상위',
      ageGroup: '40대', gender: '여성', region: '대구',
      householdType: '한부모', incomeLevel: '차상위', employmentStatus: '무직',
      interestCategories: ['생활', '육아', '교육'],
    },
    {
      label: 'EDGE-06: 50대 무직 중위50이하',
      ageGroup: '50대', gender: '남성', region: '강원',
      householdType: '일반', incomeLevel: '중위50이하', employmentStatus: '무직',
      interestCategories: ['취업', '건강'],
    },
    {
      label: 'EDGE-07: 여성 30대 영유아가구 경력단절',
      ageGroup: '30대', gender: '여성', region: '인천',
      householdType: '영유아', incomeLevel: '중위100이하', employmentStatus: '무직',
      interestCategories: ['육아', '취업', '주거'],
    },
    {
      label: 'EDGE-08: 20대 학생 중위100초과 (장학금)',
      ageGroup: '20대', gender: '남성', region: '서울',
      householdType: '일반', incomeLevel: '중위100초과', employmentStatus: '학생',
      interestCategories: ['교육', '문화'],
    },
  ]

  // 마지막 8개를 엣지 케이스로 교체
  for (let i = 0; i < edgeCases.length; i++) {
    profiles[profiles.length - edgeCases.length + i] = edgeCases[i]
  }

  return profiles
}

// ─── 단일 케이스 결과 ───
interface CaseResult {
  profile: TestProfile
  matchResult: MatchResultV4
  // 디버그 정보
  totalSupportsAnalyzed: number
  filteredByServiceType: number
  knockedOut: number
  scoredCount: number
  tailoredCount: number
  recommendedCount: number
  exploratoryCount: number
  totalMatched: number
  hasInterestBonus: number // 관심분야 보너스가 적용된 건수
  avgScore: number
  maxScore: number
  minScore: number
  // 차원별 분석
  dimStats: Record<string, { activePct: number; avgScore: number; specificMatchPct: number }>
}

// ─── 메인 실행 ───
async function main() {
  console.log('=== 개인 트랙 매칭 알고리즘 전수검증 (200 케이스) ===\n')

  // 1. DB에서 supports 로드
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) {
    console.error('ERROR: SUPABASE 환경 변수가 설정되지 않았습니다.')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  console.log('DB에서 supports 데이터 로드 중...')
  const today = new Date().toISOString().split('T')[0]

  // 전체 활성 supports 로드 (페이지네이션)
  let allRows: Record<string, unknown>[] = []
  let from = 0
  const PAGE_SIZE = 1000
  while (true) {
    const { data: rows, error } = await supabase
      .from('supports')
      .select('*')
      .eq('is_active', true)
      .or(`end_date.is.null,end_date.gte.${today}`)
      .range(from, from + PAGE_SIZE - 1)
    if (error) { console.error('DB 조회 실패:', error); process.exit(1) }
    if (!rows || rows.length === 0) break
    allRows = allRows.concat(rows)
    if (rows.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  const allSupports = allRows.map(mapSupportRow)
  console.log(`총 ${allSupports.length}개 활성 supports 로드 완료`)

  // 서비스 타입 분포 분석
  const serviceTypeDist: Record<string, number> = {}
  for (const s of allSupports) {
    const st = s.serviceType ?? 'unknown'
    serviceTypeDist[st] = (serviceTypeDist[st] || 0) + 1
  }
  console.log('서비스 타입 분포:', serviceTypeDist)

  // 개인 트랙 대상 supports (personal, both, unknown)
  const personalSupports = allSupports.filter(s => {
    const st = s.serviceType ?? 'unknown'
    return st === 'personal' || st === 'both' || st === 'unknown'
  })
  console.log(`개인 트랙 대상: ${personalSupports.length}개\n`)

  // 개인 트랙 supports의 데이터 필드 채움 비율 분석
  let hasRegions = 0, hasAge = 0, hasHousehold = 0, hasIncome = 0, hasEmployment = 0, hasBenefitCat = 0
  let hasExtConf = 0
  for (const s of personalSupports) {
    if (s.targetRegions && s.targetRegions.length > 0) hasRegions++
    if (s.targetAgeMin != null || s.targetAgeMax != null) hasAge++
    if (s.targetHouseholdTypes && s.targetHouseholdTypes.length > 0) hasHousehold++
    if (s.targetIncomeLevels && s.targetIncomeLevels.length > 0) hasIncome++
    if (s.targetEmploymentStatus && s.targetEmploymentStatus.length > 0) hasEmployment++
    if (s.benefitCategories && s.benefitCategories.length > 0) hasBenefitCat++
    if (s.extractionConfidence) hasExtConf++
  }
  console.log('── 개인 트랙 supports 데이터 필드 채움률 ──')
  console.log(`  targetRegions:        ${hasRegions}/${personalSupports.length} (${(hasRegions / personalSupports.length * 100).toFixed(1)}%)`)
  console.log(`  targetAge (min/max):  ${hasAge}/${personalSupports.length} (${(hasAge / personalSupports.length * 100).toFixed(1)}%)`)
  console.log(`  targetHouseholdTypes: ${hasHousehold}/${personalSupports.length} (${(hasHousehold / personalSupports.length * 100).toFixed(1)}%)`)
  console.log(`  targetIncomeLevels:   ${hasIncome}/${personalSupports.length} (${(hasIncome / personalSupports.length * 100).toFixed(1)}%)`)
  console.log(`  targetEmploymentStatus: ${hasEmployment}/${personalSupports.length} (${(hasEmployment / personalSupports.length * 100).toFixed(1)}%)`)
  console.log(`  benefitCategories:    ${hasBenefitCat}/${personalSupports.length} (${(hasBenefitCat / personalSupports.length * 100).toFixed(1)}%)`)
  console.log(`  extractionConfidence: ${hasExtConf}/${personalSupports.length} (${(hasExtConf / personalSupports.length * 100).toFixed(1)}%)`)

  // extractionConfidence 중 MIN_CONF(0.3) 이상인 비율도 분석
  let confRegionGood = 0, confAgeGood = 0, confHouseholdGood = 0, confIncomeGood = 0, confEmployGood = 0
  for (const s of personalSupports) {
    const c = s.extractionConfidence as ExtractionConfidence | null
    if (c) {
      if (c.regions >= MIN_CONF) confRegionGood++
      if (c.age >= MIN_CONF) confAgeGood++
      if (c.householdTypes >= MIN_CONF) confHouseholdGood++
      if (c.incomeLevels >= MIN_CONF) confIncomeGood++
      if (c.employmentStatus >= MIN_CONF) confEmployGood++
    }
  }
  console.log(`\n── extractionConfidence >= ${MIN_CONF} 비율 ──`)
  console.log(`  regions:          ${confRegionGood}/${personalSupports.length} (${(confRegionGood / personalSupports.length * 100).toFixed(1)}%)`)
  console.log(`  age:              ${confAgeGood}/${personalSupports.length} (${(confAgeGood / personalSupports.length * 100).toFixed(1)}%)`)
  console.log(`  householdTypes:   ${confHouseholdGood}/${personalSupports.length} (${(confHouseholdGood / personalSupports.length * 100).toFixed(1)}%)`)
  console.log(`  incomeLevels:     ${confIncomeGood}/${personalSupports.length} (${(confIncomeGood / personalSupports.length * 100).toFixed(1)}%)`)
  console.log(`  employmentStatus: ${confEmployGood}/${personalSupports.length} (${(confEmployGood / personalSupports.length * 100).toFixed(1)}%)`)

  // 2. 200개 프로필 생성
  const profiles = generateProfiles()
  console.log(`\n200개 테스트 프로필 생성 완료`)

  // 3. 매칭 실행
  console.log('\n매칭 실행 중...\n')
  const results: CaseResult[] = []

  for (let i = 0; i < profiles.length; i++) {
    const profile = profiles[i]
    const userInput: UserInput = { userType: 'personal', ...profile }

    const matchResult = matchSupportsV4(allSupports, userInput)

    // 관심분야 보너스 카운트
    let interestBonusCount = 0
    for (const scored of matchResult.all) {
      if (hasInterestCategoryMatch(scored.support, profile.interestCategories)) {
        interestBonusCount++
      }
    }

    // 차원별 통계 (전체 scored 대상이 아닌 "전체 서비스 타입 매치" 대상으로 계산)
    const dimKeys = ['region', 'age', 'householdType', 'incomeLevel', 'employmentStatus']
    const dimStats: Record<string, { activePct: number; avgScore: number; specificMatchPct: number }> = {}

    // 전체 personalSupports 대상으로 차원 분석
    let totalAnalyzable = 0
    const dimActiveCount: Record<string, number> = {}
    const dimScoreSum: Record<string, number> = {}
    const dimSpecificMatch: Record<string, number> = {}
    for (const k of dimKeys) {
      dimActiveCount[k] = 0
      dimScoreSum[k] = 0
      dimSpecificMatch[k] = 0
    }

    for (const s of personalSupports) {
      if (!isServiceTypeMatch(s, 'personal')) continue
      totalAnalyzable++
      const dims = getPersonalDimensions(s, profile)
      for (const d of dims) {
        if (d.hasData) {
          dimActiveCount[d.key]++
          dimScoreSum[d.key] += d.rawScore
          if (d.isSpecific && d.rawScore >= 0.8) dimSpecificMatch[d.key]++
        }
      }
    }

    for (const k of dimKeys) {
      dimStats[k] = {
        activePct: totalAnalyzable > 0 ? dimActiveCount[k] / totalAnalyzable : 0,
        avgScore: dimActiveCount[k] > 0 ? dimScoreSum[k] / dimActiveCount[k] : 0,
        specificMatchPct: totalAnalyzable > 0 ? dimSpecificMatch[k] / totalAnalyzable : 0,
      }
    }

    const allScores = matchResult.all.map(s => s.score)
    results.push({
      profile,
      matchResult,
      totalSupportsAnalyzed: matchResult.totalAnalyzed,
      filteredByServiceType: matchResult.filteredByServiceType,
      knockedOut: matchResult.knockedOut,
      scoredCount: matchResult.all.length,
      tailoredCount: matchResult.tailored.length,
      recommendedCount: matchResult.recommended.length,
      exploratoryCount: matchResult.exploratory.length,
      totalMatched: matchResult.totalCount,
      hasInterestBonus: interestBonusCount,
      avgScore: allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0,
      maxScore: allScores.length > 0 ? Math.max(...allScores) : 0,
      minScore: allScores.length > 0 ? Math.min(...allScores) : 0,
      dimStats,
    })

    if ((i + 1) % 50 === 0) {
      console.log(`  ${i + 1}/200 완료...`)
    }
  }

  console.log('매칭 완료!\n')

  // 4. 분석 결과 집계
  const totalResults = results.length
  const emptyResults = results.filter(r => r.totalMatched === 0).length
  const overMatchResults = results.filter(r => r.totalMatched >= 100).length
  const lowMatchResults = results.filter(r => r.totalMatched > 0 && r.totalMatched <= 3).length

  // Tier별 분포
  const tierDistTailored = results.map(r => r.tailoredCount)
  const tierDistRecommended = results.map(r => r.recommendedCount)
  const tierDistExploratory = results.map(r => r.exploratoryCount)
  const tierDistTotal = results.map(r => r.totalMatched)

  function stats(arr: number[]) {
    const sorted = [...arr].sort((a, b) => a - b)
    const sum = sorted.reduce((a, b) => a + b, 0)
    const mean = sum / sorted.length
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)]
    const variance = sorted.reduce((s, v) => s + (v - mean) ** 2, 0) / sorted.length
    const stddev = Math.sqrt(variance)
    const min = sorted[0]
    const max = sorted[sorted.length - 1]
    const p10 = sorted[Math.floor(sorted.length * 0.1)]
    const p25 = sorted[Math.floor(sorted.length * 0.25)]
    const p75 = sorted[Math.floor(sorted.length * 0.75)]
    const p90 = sorted[Math.floor(sorted.length * 0.9)]
    return { mean, median, stddev, min, max, p10, p25, p75, p90, sum }
  }

  const totalStats = stats(tierDistTotal)
  const tailoredStats = stats(tierDistTailored)
  const recommendedStats = stats(tierDistRecommended)
  const exploratoryStats = stats(tierDistExploratory)

  // Knockout 분포
  const knockoutCounts = results.map(r => r.knockedOut)
  const knockoutStats = stats(knockoutCounts)

  // Coverage factor 분포 (전체 매칭 결과에서 추출)
  const allCoverages: number[] = []
  for (const r of results) {
    for (const s of r.matchResult.all) {
      allCoverages.push(s.scores.coverage)
    }
  }
  const coverageStats = allCoverages.length > 0 ? stats(allCoverages) : null

  // 전체 Score 분포
  const allScoresFlat: number[] = []
  for (const r of results) {
    for (const s of r.matchResult.all) {
      allScoresFlat.push(s.score)
    }
  }
  const scoreStats = allScoresFlat.length > 0 ? stats(allScoresFlat) : null

  // 관심분야 보너스 효과 분석
  const interestBonusCounts = results.map(r => r.hasInterestBonus)
  const interestBonusStats = stats(interestBonusCounts)

  // 지역별 평균 매칭 건수
  const regionStats: Record<string, { cases: number; totalMatched: number; avgMatched: number }> = {}
  for (const r of results) {
    const region = r.profile.region
    if (!regionStats[region]) regionStats[region] = { cases: 0, totalMatched: 0, avgMatched: 0 }
    regionStats[region].cases++
    regionStats[region].totalMatched += r.totalMatched
  }
  for (const k of Object.keys(regionStats)) {
    regionStats[k].avgMatched = regionStats[k].totalMatched / regionStats[k].cases
  }

  // 연령대별 평균 매칭 건수
  const ageStats: Record<string, { cases: number; totalMatched: number; avgMatched: number; avgTailored: number; tSum: number }> = {}
  for (const r of results) {
    const age = r.profile.ageGroup
    if (!ageStats[age]) ageStats[age] = { cases: 0, totalMatched: 0, avgMatched: 0, avgTailored: 0, tSum: 0 }
    ageStats[age].cases++
    ageStats[age].totalMatched += r.totalMatched
    ageStats[age].tSum += r.tailoredCount
  }
  for (const k of Object.keys(ageStats)) {
    ageStats[k].avgMatched = ageStats[k].totalMatched / ageStats[k].cases
    ageStats[k].avgTailored = ageStats[k].tSum / ageStats[k].cases
  }

  // 소득수준별 평균 매칭 건수
  const incomeStats: Record<string, { cases: number; totalMatched: number; avgMatched: number }> = {}
  for (const r of results) {
    const income = r.profile.incomeLevel
    if (!incomeStats[income]) incomeStats[income] = { cases: 0, totalMatched: 0, avgMatched: 0 }
    incomeStats[income].cases++
    incomeStats[income].totalMatched += r.totalMatched
  }
  for (const k of Object.keys(incomeStats)) {
    incomeStats[k].avgMatched = incomeStats[k].totalMatched / incomeStats[k].cases
  }

  // 가구유형별 평균 매칭 건수
  const householdStats: Record<string, { cases: number; totalMatched: number; avgMatched: number }> = {}
  for (const r of results) {
    const ht = r.profile.householdType
    if (!householdStats[ht]) householdStats[ht] = { cases: 0, totalMatched: 0, avgMatched: 0 }
    householdStats[ht].cases++
    householdStats[ht].totalMatched += r.totalMatched
  }
  for (const k of Object.keys(householdStats)) {
    householdStats[k].avgMatched = householdStats[k].totalMatched / householdStats[k].cases
  }

  // 취업상태별 평균 매칭 건수
  const employStats: Record<string, { cases: number; totalMatched: number; avgMatched: number }> = {}
  for (const r of results) {
    const es = r.profile.employmentStatus
    if (!employStats[es]) employStats[es] = { cases: 0, totalMatched: 0, avgMatched: 0 }
    employStats[es].cases++
    employStats[es].totalMatched += r.totalMatched
  }
  for (const k of Object.keys(employStats)) {
    employStats[k].avgMatched = employStats[k].totalMatched / employStats[k].cases
  }

  // 문제 케이스 식별
  type ProblemCase = {
    profile: TestProfile
    problem: string
    totalMatched: number
    tailored: number
    recommended: number
    exploratory: number
    knockedOut: number
    avgScore: number
  }
  const problemCases: ProblemCase[] = []

  for (const r of results) {
    if (r.totalMatched === 0) {
      problemCases.push({
        profile: r.profile, problem: 'ZERO_MATCH',
        totalMatched: 0, tailored: 0, recommended: 0, exploratory: 0,
        knockedOut: r.knockedOut, avgScore: 0,
      })
    }
    if (r.totalMatched >= 100) {
      problemCases.push({
        profile: r.profile, problem: 'OVER_MATCH_100+',
        totalMatched: r.totalMatched, tailored: r.tailoredCount,
        recommended: r.recommendedCount, exploratory: r.exploratoryCount,
        knockedOut: r.knockedOut, avgScore: r.avgScore,
      })
    }
    if (r.totalMatched > 0 && r.tailoredCount === 0 && r.recommendedCount === 0) {
      problemCases.push({
        profile: r.profile, problem: 'ONLY_EXPLORATORY',
        totalMatched: r.totalMatched, tailored: 0, recommended: 0,
        exploratory: r.exploratoryCount, knockedOut: r.knockedOut, avgScore: r.avgScore,
      })
    }
    // NULL bias: 대부분의 활성 차원이 hasData=false이면서 높은 점수를 받는 경우
    if (r.totalMatched > 50) {
      // 차원별 활성 비율이 전부 낮은데 매칭이 많은 경우
      const avgActivePct = Object.values(r.dimStats).reduce((s, v) => s + v.activePct, 0) / 5
      if (avgActivePct < 0.15 && !problemCases.find(p => p.profile === r.profile && p.problem === 'OVER_MATCH_100+')) {
        problemCases.push({
          profile: r.profile, problem: 'LOW_DATA_HIGH_MATCH',
          totalMatched: r.totalMatched, tailored: r.tailoredCount,
          recommended: r.recommendedCount, exploratory: r.exploratoryCount,
          knockedOut: r.knockedOut, avgScore: r.avgScore,
        })
      }
    }
  }

  // 관심분야 보너스 tier 승격 분석
  // 관심분야가 있는 프로필 vs 없는 프로필 비교
  const withInterest = results.filter(r => r.profile.interestCategories.length > 0)
  const withoutInterest = results.filter(r => r.profile.interestCategories.length === 0)
  const withInterestAvgTotal = withInterest.length > 0
    ? withInterest.reduce((s, r) => s + r.totalMatched, 0) / withInterest.length : 0
  const withoutInterestAvgTotal = withoutInterest.length > 0
    ? withoutInterest.reduce((s, r) => s + r.totalMatched, 0) / withoutInterest.length : 0
  const withInterestAvgTailored = withInterest.length > 0
    ? withInterest.reduce((s, r) => s + r.tailoredCount, 0) / withInterest.length : 0
  const withoutInterestAvgTailored = withoutInterest.length > 0
    ? withoutInterest.reduce((s, r) => s + r.tailoredCount, 0) / withoutInterest.length : 0

  // ─── 특정 Support 분석: NULL 데이터가 많은 support가 높은 점수를 받는 패턴 ───
  // 전체 매칭 결과에서 top scorer 중 데이터 빈약한 support 추출
  const supportAppearance = new Map<string, { count: number; avgScore: number; totalScore: number; support: Support }>()
  for (const r of results) {
    for (const s of r.matchResult.all) {
      const id = s.support.id
      const entry = supportAppearance.get(id) || { count: 0, avgScore: 0, totalScore: 0, support: s.support }
      entry.count++
      entry.totalScore += s.score
      supportAppearance.set(id, entry)
    }
  }
  for (const [, entry] of supportAppearance) {
    entry.avgScore = entry.totalScore / entry.count
  }

  // NULL 필드가 많은데 자주 매칭되는 support (NULL bias 후보)
  const nullBiasCandidates: { id: string; title: string; org: string; count: number; avgScore: number; nullDims: number }[] = []
  for (const [id, entry] of supportAppearance) {
    const s = entry.support
    let nullDims = 0
    if (!s.targetRegions || s.targetRegions.length === 0) nullDims++
    if (s.targetAgeMin == null && s.targetAgeMax == null) nullDims++
    if (!s.targetHouseholdTypes || s.targetHouseholdTypes.length === 0) nullDims++
    if (!s.targetIncomeLevels || s.targetIncomeLevels.length === 0) nullDims++
    if (!s.targetEmploymentStatus || s.targetEmploymentStatus.length === 0) nullDims++
    if (nullDims >= 4 && entry.count >= 100) {
      nullBiasCandidates.push({
        id, title: s.title, org: s.organization,
        count: entry.count, avgScore: entry.avgScore, nullDims,
      })
    }
  }
  nullBiasCandidates.sort((a, b) => b.count - a.count)

  // ─── 5. 출력 및 리포트 ───
  console.log('='.repeat(80))
  console.log('                  개인 트랙 매칭 알고리즘 전수검증 결과')
  console.log('='.repeat(80))

  console.log('\n## 1. 전체 통계 요약')
  console.log(`  총 테스트 케이스: ${totalResults}`)
  console.log(`  총 supports 수 (활성): ${allSupports.length}`)
  console.log(`  개인 트랙 대상: ${personalSupports.length}`)
  console.log(`  빈 결과 (0건 매칭): ${emptyResults} (${(emptyResults / totalResults * 100).toFixed(1)}%)`)
  console.log(`  과다 매칭 (100건+): ${overMatchResults} (${(overMatchResults / totalResults * 100).toFixed(1)}%)`)
  console.log(`  저매칭 (1-3건): ${lowMatchResults} (${(lowMatchResults / totalResults * 100).toFixed(1)}%)`)
  console.log(`  NULL bias 후보 support: ${nullBiasCandidates.length}개`)

  console.log('\n## 2. Tier별 매칭 건수 분포')
  console.log(`  ── Total Matched ──`)
  console.log(`    평균: ${totalStats.mean.toFixed(1)}, 중위: ${totalStats.median}, 표준편차: ${totalStats.stddev.toFixed(1)}`)
  console.log(`    최소: ${totalStats.min}, 최대: ${totalStats.max}`)
  console.log(`    P10: ${totalStats.p10}, P25: ${totalStats.p25}, P75: ${totalStats.p75}, P90: ${totalStats.p90}`)
  console.log(`  ── Tailored ──`)
  console.log(`    평균: ${tailoredStats.mean.toFixed(1)}, 중위: ${tailoredStats.median}`)
  console.log(`    최소: ${tailoredStats.min}, 최대: ${tailoredStats.max}`)
  console.log(`  ── Recommended ──`)
  console.log(`    평균: ${recommendedStats.mean.toFixed(1)}, 중위: ${recommendedStats.median}`)
  console.log(`    최소: ${recommendedStats.min}, 최대: ${recommendedStats.max}`)
  console.log(`  ── Exploratory ──`)
  console.log(`    평균: ${exploratoryStats.mean.toFixed(1)}, 중위: ${exploratoryStats.median}`)
  console.log(`    최소: ${exploratoryStats.min}, 최대: ${exploratoryStats.max}`)

  console.log('\n## 3. Knockout 분포')
  console.log(`    평균: ${knockoutStats.mean.toFixed(1)}, 중위: ${knockoutStats.median}`)
  console.log(`    최소: ${knockoutStats.min}, 최대: ${knockoutStats.max}`)

  if (coverageStats) {
    console.log('\n## 4. Coverage Factor 분포')
    console.log(`    평균: ${coverageStats.mean.toFixed(3)}, 중위: ${coverageStats.median}`)
    console.log(`    표준편차: ${coverageStats.stddev.toFixed(3)}`)
    console.log(`    최소: ${coverageStats.min}, 최대: ${coverageStats.max}`)
  }

  if (scoreStats) {
    console.log('\n## 5. 전체 Score 분포')
    console.log(`    평균: ${scoreStats.mean.toFixed(3)}, 중위: ${scoreStats.median}`)
    console.log(`    표준편차: ${scoreStats.stddev.toFixed(3)}`)
    console.log(`    최소: ${scoreStats.min}, 최대: ${scoreStats.max}`)
  }

  console.log('\n## 6. 관심분야 보너스 효과')
  console.log(`    보너스 적용 건수 (평균): ${interestBonusStats.mean.toFixed(1)}`)
  console.log(`    관심분야 있음 (${withInterest.length}건) → 평균 매칭: ${withInterestAvgTotal.toFixed(1)}, 평균 tailored: ${withInterestAvgTailored.toFixed(1)}`)
  console.log(`    관심분야 없음 (${withoutInterest.length}건) → 평균 매칭: ${withoutInterestAvgTotal.toFixed(1)}, 평균 tailored: ${withoutInterestAvgTailored.toFixed(1)}`)

  console.log('\n## 7. 지역별 평균 매칭 건수')
  const sortedRegions = Object.entries(regionStats).sort((a, b) => b[1].avgMatched - a[1].avgMatched)
  for (const [region, rs] of sortedRegions) {
    console.log(`    ${region.padEnd(4)}: 평균 ${rs.avgMatched.toFixed(1)}건 (${rs.cases}케이스)`)
  }

  console.log('\n## 8. 연령대별 평균 매칭 건수')
  for (const age of AGE_GROUPS) {
    const as_ = ageStats[age]
    if (as_) {
      console.log(`    ${age.padEnd(6)}: 평균 ${as_.avgMatched.toFixed(1)}건, tailored 평균 ${as_.avgTailored.toFixed(1)} (${as_.cases}케이스)`)
    }
  }

  console.log('\n## 9. 소득수준별 평균 매칭 건수')
  for (const income of INCOME_LEVELS) {
    const is_ = incomeStats[income]
    if (is_) {
      console.log(`    ${income.padEnd(8)}: 평균 ${is_.avgMatched.toFixed(1)}건 (${is_.cases}케이스)`)
    }
  }

  console.log('\n## 10. 가구유형별 평균 매칭 건수')
  for (const ht of HOUSEHOLD_TYPES) {
    const hs = householdStats[ht]
    if (hs) {
      console.log(`    ${ht.padEnd(6)}: 평균 ${hs.avgMatched.toFixed(1)}건 (${hs.cases}케이스)`)
    }
  }

  console.log('\n## 11. 취업상태별 평균 매칭 건수')
  for (const es of EMPLOYMENT_STATUSES) {
    const es_ = employStats[es]
    if (es_) {
      console.log(`    ${es.padEnd(4)}: 평균 ${es_.avgMatched.toFixed(1)}건 (${es_.cases}케이스)`)
    }
  }

  if (nullBiasCandidates.length > 0) {
    console.log('\n## 12. NULL Bias 후보 (4개 이상 차원 NULL + 100건+ 매칭)')
    for (const c of nullBiasCandidates.slice(0, 20)) {
      console.log(`    [${c.nullDims}/5 NULL] 매칭 ${c.count}/200건, avgScore=${c.avgScore.toFixed(3)}: ${c.title.slice(0, 50)} (${c.org})`)
    }
  }

  if (problemCases.length > 0) {
    console.log('\n## 13. 문제 케이스 상세 (Top 20)')
    const sorted = problemCases.sort((a, b) => {
      // ZERO_MATCH > OVER_MATCH > LOW_DATA > ONLY_EXPLORATORY
      const order: Record<string, number> = { ZERO_MATCH: 0, OVER_MATCH_100: 1, LOW_DATA_HIGH_MATCH: 2, ONLY_EXPLORATORY: 3 }
      return (order[a.problem] ?? 99) - (order[b.problem] ?? 99)
    })
    for (const pc of sorted.slice(0, 20)) {
      console.log(`    [${pc.problem}] ${pc.profile.label}`)
      console.log(`      매칭: ${pc.totalMatched} (T:${pc.tailored}/R:${pc.recommended}/E:${pc.exploratory}), knockout: ${pc.knockedOut}, avgScore: ${pc.avgScore.toFixed(3)}`)
    }
  }

  // ─── 엣지 케이스 상세 분석 ───
  console.log('\n## 14. 엣지 케이스 상세 분석')
  const edgeCaseResults = results.filter(r => r.profile.label.startsWith('EDGE-'))
  for (const r of edgeCaseResults) {
    console.log(`\n  ${r.profile.label}`)
    console.log(`    매칭: ${r.totalMatched} (T:${r.tailoredCount}/R:${r.recommendedCount}/E:${r.exploratoryCount})`)
    console.log(`    Knockout: ${r.knockedOut}, Filtered: ${r.filteredByServiceType}`)
    console.log(`    Score: avg=${r.avgScore.toFixed(3)}, max=${r.maxScore.toFixed(3)}, min=${r.minScore.toFixed(3)}`)
    console.log(`    관심분야 보너스: ${r.hasInterestBonus}건`)
    console.log(`    차원 활성률: ${Object.entries(r.dimStats).map(([k, v]) => `${k}=${(v.activePct * 100).toFixed(0)}%`).join(', ')}`)
    if (r.matchResult.tailored.length > 0) {
      console.log(`    Top Tailored:`)
      for (const s of r.matchResult.tailored.slice(0, 3)) {
        console.log(`      - [${s.score.toFixed(3)}] ${s.support.title.slice(0, 60)} | coverage=${s.scores.coverage}`)
      }
    }
    if (r.totalMatched === 0) {
      console.log(`    !! 매칭 0건 — 원인 분석 필요`)
    }
  }

  // ─── hasSpecificMatch 영향 분석 ───
  // scorePipeline에서 hasSpecificMatch=false이면 tailored/recommended -> exploratory로 강제 강등
  // 이 때문에 exploratory만 남는 패턴 분석
  console.log('\n## 15. hasSpecificMatch 강등 분석')
  let totalScored = 0
  let demotedToExploratory = 0
  for (const r of results) {
    for (const s of r.matchResult.all) {
      totalScored++
      // scorePipeline 재실행하여 강등 여부 확인
      const dims = getPersonalDimensions(s.support, r.profile)
      const activeDims = dims.filter(d => d.hasData)
      const specificDims = activeDims.filter(d => d.isSpecific)
      const hasSpecificMatch = specificDims.some(d => d.rawScore >= 0.8)
      if (!hasSpecificMatch && s.score >= TIER_THRESHOLDS.recommended) {
        demotedToExploratory++
      }
    }
  }
  console.log(`  총 scored: ${totalScored}`)
  console.log(`  hasSpecificMatch=false로 강등된 건: ${demotedToExploratory} (${(demotedToExploratory / Math.max(totalScored, 1) * 100).toFixed(1)}%)`)

  // ─── Markdown 리포트 생성 ───
  const report = generateMarkdownReport({
    totalResults, allSupports, personalSupports,
    emptyResults, overMatchResults, lowMatchResults,
    totalStats, tailoredStats, recommendedStats, exploratoryStats,
    knockoutStats, coverageStats, scoreStats,
    interestBonusStats, withInterest, withoutInterest,
    withInterestAvgTotal, withoutInterestAvgTotal,
    withInterestAvgTailored, withoutInterestAvgTailored,
    regionStats: sortedRegions, ageStats, incomeStats, householdStats, employStats,
    nullBiasCandidates, problemCases: problemCases.sort((a, b) => {
      const order: Record<string, number> = { ZERO_MATCH: 0, OVER_MATCH_100: 1, LOW_DATA_HIGH_MATCH: 2, ONLY_EXPLORATORY: 3 }
      return (order[a.problem] ?? 99) - (order[b.problem] ?? 99)
    }),
    edgeCaseResults, results,
    hasRegions, hasAge, hasHousehold, hasIncome, hasEmployment, hasBenefitCat, hasExtConf,
    confRegionGood, confAgeGood, confHouseholdGood, confIncomeGood, confEmployGood,
    serviceTypeDist,
    totalScored, demotedToExploratory,
  })

  writeFileSync('PERSONAL_MATCHING_AUDIT.md', report, 'utf-8')
  console.log('\n\nPERSONAL_MATCHING_AUDIT.md 저장 완료')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function generateMarkdownReport(d: any): string {
  const f = (n: number, digits = 1) => Number(n).toFixed(digits)

  // 품질 등급 결정
  const emptyPct = d.emptyResults / d.totalResults * 100
  const overPct = d.overMatchResults / d.totalResults * 100
  let grade = 'A'
  if (emptyPct > 20 || overPct > 30) grade = 'F'
  else if (emptyPct > 10 || overPct > 20) grade = 'D'
  else if (emptyPct > 5 || overPct > 10) grade = 'C'
  else if (emptyPct > 2 || overPct > 5) grade = 'B'

  let md = `# 개인 트랙 매칭 알고리즘 전수검증 결과

> 검증일: ${new Date().toISOString().split('T')[0]}
> 테스트 케이스: ${d.totalResults}개
> 전체 활성 supports: ${d.allSupports.length}개
> 개인 트랙 대상: ${d.personalSupports.length}개

---

## Executive Summary

**전체 품질 등급: ${grade}**

| 지표 | 결과 | 목표 | 판정 |
|------|------|------|------|
| 빈 결과 비율 | ${f(emptyPct)}% (${d.emptyResults}건) | < 5% | ${emptyPct < 5 ? 'PASS' : 'FAIL'} |
| 과다 매칭 비율 (100건+) | ${f(overPct)}% (${d.overMatchResults}건) | < 10% | ${overPct < 10 ? 'PASS' : 'FAIL'} |
| 저매칭 비율 (1-3건) | ${f(d.lowMatchResults / d.totalResults * 100)}% (${d.lowMatchResults}건) | < 15% | ${d.lowMatchResults / d.totalResults * 100 < 15 ? 'PASS' : 'WARN'} |
| NULL bias 후보 | ${d.nullBiasCandidates.length}개 | 0개 | ${d.nullBiasCandidates.length === 0 ? 'PASS' : 'WARN'} |
| 평균 매칭 건수 | ${f(d.totalStats.mean)} | 10-50 | ${d.totalStats.mean >= 10 && d.totalStats.mean <= 50 ? 'PASS' : 'WARN'} |

---

## 1. DB 데이터 현황

### 서비스 타입 분포

| 서비스 타입 | 건수 |
|------------|------|
${Object.entries(d.serviceTypeDist).map(([k, v]: [string, unknown]) => `| ${k} | ${v} |`).join('\n')}

### 개인 트랙 supports 필드 채움률

| 필드 | 채워진 건수 | 비율 |
|------|-----------|------|
| targetRegions | ${d.hasRegions}/${d.personalSupports.length} | ${f(d.hasRegions / d.personalSupports.length * 100)}% |
| targetAge (min/max) | ${d.hasAge}/${d.personalSupports.length} | ${f(d.hasAge / d.personalSupports.length * 100)}% |
| targetHouseholdTypes | ${d.hasHousehold}/${d.personalSupports.length} | ${f(d.hasHousehold / d.personalSupports.length * 100)}% |
| targetIncomeLevels | ${d.hasIncome}/${d.personalSupports.length} | ${f(d.hasIncome / d.personalSupports.length * 100)}% |
| targetEmploymentStatus | ${d.hasEmployment}/${d.personalSupports.length} | ${f(d.hasEmployment / d.personalSupports.length * 100)}% |
| benefitCategories | ${d.hasBenefitCat}/${d.personalSupports.length} | ${f(d.hasBenefitCat / d.personalSupports.length * 100)}% |
| extractionConfidence | ${d.hasExtConf}/${d.personalSupports.length} | ${f(d.hasExtConf / d.personalSupports.length * 100)}% |

### extractionConfidence >= ${MIN_CONF} (유효 데이터) 비율

| 차원 | 유효 건수 | 비율 |
|------|----------|------|
| regions | ${d.confRegionGood}/${d.personalSupports.length} | ${f(d.confRegionGood / d.personalSupports.length * 100)}% |
| age | ${d.confAgeGood}/${d.personalSupports.length} | ${f(d.confAgeGood / d.personalSupports.length * 100)}% |
| householdTypes | ${d.confHouseholdGood}/${d.personalSupports.length} | ${f(d.confHouseholdGood / d.personalSupports.length * 100)}% |
| incomeLevels | ${d.confIncomeGood}/${d.personalSupports.length} | ${f(d.confIncomeGood / d.personalSupports.length * 100)}% |
| employmentStatus | ${d.confEmployGood}/${d.personalSupports.length} | ${f(d.confEmployGood / d.personalSupports.length * 100)}% |

---

## 2. 200개 케이스 통계 요약

### Tier별 매칭 건수 분포

| 지표 | Total | Tailored | Recommended | Exploratory |
|------|-------|----------|-------------|-------------|
| 평균 | ${f(d.totalStats.mean)} | ${f(d.tailoredStats.mean)} | ${f(d.recommendedStats.mean)} | ${f(d.exploratoryStats.mean)} |
| 중위수 | ${d.totalStats.median} | ${d.tailoredStats.median} | ${d.recommendedStats.median} | ${d.exploratoryStats.median} |
| 표준편차 | ${f(d.totalStats.stddev)} | ${f(d.tailoredStats.stddev)} | ${f(d.recommendedStats.stddev)} | ${f(d.exploratoryStats.stddev)} |
| 최소 | ${d.totalStats.min} | ${d.tailoredStats.min} | ${d.recommendedStats.min} | ${d.exploratoryStats.min} |
| 최대 | ${d.totalStats.max} | ${d.tailoredStats.max} | ${d.recommendedStats.max} | ${d.exploratoryStats.max} |
| P10 | ${d.totalStats.p10} | ${d.tailoredStats.p10} | ${d.recommendedStats.p10} | ${d.exploratoryStats.p10} |
| P25 | ${d.totalStats.p25} | ${d.tailoredStats.p25} | ${d.recommendedStats.p25} | ${d.exploratoryStats.p25} |
| P75 | ${d.totalStats.p75} | ${d.tailoredStats.p75} | ${d.recommendedStats.p75} | ${d.exploratoryStats.p75} |
| P90 | ${d.totalStats.p90} | ${d.tailoredStats.p90} | ${d.recommendedStats.p90} | ${d.exploratoryStats.p90} |

### Knockout 분포

| 지표 | 값 |
|------|---|
| 평균 | ${f(d.knockoutStats.mean)} |
| 중위수 | ${d.knockoutStats.median} |
| 최소 | ${d.knockoutStats.min} |
| 최대 | ${d.knockoutStats.max} |

${d.coverageStats ? `### Coverage Factor 분포

| 지표 | 값 |
|------|---|
| 평균 | ${f(d.coverageStats.mean, 3)} |
| 중위수 | ${d.coverageStats.median} |
| 표준편차 | ${f(d.coverageStats.stddev, 3)} |
| 최소 | ${d.coverageStats.min} |
| 최대 | ${d.coverageStats.max} |
` : ''}

${d.scoreStats ? `### 전체 Score 분포

| 지표 | 값 |
|------|---|
| 평균 | ${f(d.scoreStats.mean, 3)} |
| 중위수 | ${d.scoreStats.median} |
| 표준편차 | ${f(d.scoreStats.stddev, 3)} |
| 최소 | ${d.scoreStats.min} |
| 최대 | ${d.scoreStats.max} |
` : ''}

---

## 3. 관심분야 보너스 효과

| 조건 | 케이스수 | 평균 매칭 | 평균 Tailored |
|------|---------|----------|-------------|
| 관심분야 있음 | ${d.withInterest.length} | ${f(d.withInterestAvgTotal)} | ${f(d.withInterestAvgTailored)} |
| 관심분야 없음 | ${d.withoutInterest.length} | ${f(d.withoutInterestAvgTotal)} | ${f(d.withoutInterestAvgTailored)} |

---

## 4. 차원별 분포 히트맵

### 지역별 평균 매칭 건수

| 지역 | 케이스 | 평균 매칭 |
|------|-------|----------|
${d.regionStats.map(([region, rs]: [string, { cases: number; avgMatched: number }]) =>
  `| ${region} | ${rs.cases} | ${f(rs.avgMatched)} |`).join('\n')}

### 연령대별

| 연령대 | 케이스 | 평균 매칭 | 평균 Tailored |
|--------|-------|----------|-------------|
${AGE_GROUPS.map((age: string) => {
  const as_ = d.ageStats[age]
  return as_ ? `| ${age} | ${as_.cases} | ${f(as_.avgMatched)} | ${f(as_.avgTailored)} |` : ''
}).filter(Boolean).join('\n')}

### 소득수준별

| 소득수준 | 케이스 | 평균 매칭 |
|---------|-------|----------|
${INCOME_LEVELS.map((income: string) => {
  const is_ = d.incomeStats[income]
  return is_ ? `| ${income} | ${is_.cases} | ${f(is_.avgMatched)} |` : ''
}).filter(Boolean).join('\n')}

### 가구유형별

| 가구유형 | 케이스 | 평균 매칭 |
|---------|-------|----------|
${HOUSEHOLD_TYPES.map((ht: string) => {
  const hs = d.householdStats[ht]
  return hs ? `| ${ht} | ${hs.cases} | ${f(hs.avgMatched)} |` : ''
}).filter(Boolean).join('\n')}

### 취업상태별

| 취업상태 | 케이스 | 평균 매칭 |
|---------|-------|----------|
${EMPLOYMENT_STATUSES.map((es: string) => {
  const es_ = d.employStats[es]
  return es_ ? `| ${es} | ${es_.cases} | ${f(es_.avgMatched)} |` : ''
}).filter(Boolean).join('\n')}

---

## 5. hasSpecificMatch 강등 분석

- 총 scored 건수: ${d.totalScored}
- hasSpecificMatch=false로 강등된 건수: ${d.demotedToExploratory} (${f(d.demotedToExploratory / Math.max(d.totalScored, 1) * 100)}%)

> scorePipeline에서 hasSpecificMatch=false이면 tailored/recommended 점수라도 exploratory로 강등됩니다.
> 이는 모든 specific 차원(region, age, householdType, incomeLevel)이 rawScore < 0.8이거나 hasData=false일 때 발생합니다.

---

## 6. NULL Bias 후보 Supports

> 5개 차원 중 4개 이상이 NULL이면서 200개 프로필 중 100건 이상 매칭된 support

${d.nullBiasCandidates.length === 0 ? '해당 없음\n' :
`| NULL 차원 | 매칭 건수 | 평균 Score | 제목 | 기관 |
|----------|---------|-----------|------|------|
${d.nullBiasCandidates.slice(0, 20).map((c: { nullDims: number; count: number; avgScore: number; title: string; org: string }) =>
  `| ${c.nullDims}/5 | ${c.count}/200 | ${f(c.avgScore, 3)} | ${c.title.slice(0, 50)} | ${c.org} |`).join('\n')}
`}

---

## 7. 문제 케이스 Top 20

${d.problemCases.length === 0 ? '문제 케이스 없음\n' :
`| # | 문제 유형 | 프로필 | 매칭 | T/R/E | KO | Avg Score |
|---|----------|--------|------|-------|------|-----------|
${d.problemCases.slice(0, 20).map((pc: ProblemCase, i: number) =>
  `| ${i + 1} | ${pc.problem} | ${pc.profile.label.slice(0, 45)} | ${pc.totalMatched} | ${pc.tailored}/${pc.recommended}/${pc.exploratory} | ${pc.knockedOut} | ${f(pc.avgScore, 3)} |`).join('\n')}
`}

---

## 8. 엣지 케이스 상세 분석

${d.edgeCaseResults.map((r: CaseResult) => `
### ${r.profile.label}

- **매칭 결과**: ${r.totalMatched}건 (T:${r.tailoredCount}/R:${r.recommendedCount}/E:${r.exploratoryCount})
- **Knockout**: ${r.knockedOut}건, **Filtered**: ${r.filteredByServiceType}건
- **Score**: avg=${f(r.avgScore, 3)}, max=${f(r.maxScore, 3)}, min=${f(r.minScore, 3)}
- **관심분야 보너스**: ${r.hasInterestBonus}건
- **차원 활성률**: ${Object.entries(r.dimStats).map(([k, v]: [string, { activePct: number }]) => `${k}=${f(v.activePct * 100, 0)}%`).join(', ')}
${r.matchResult.tailored.length > 0 ? `
**Top Tailored:**
${r.matchResult.tailored.slice(0, 3).map((s: ScoredSupportV4) =>
  `- [${f(s.score, 3)}] ${s.support.title.slice(0, 60)} (coverage=${s.scores.coverage})`).join('\n')}
` : ''}${r.totalMatched === 0 ? '\n> 매칭 0건 -- 원인 분석 필요\n' : ''}
`).join('\n')}

---

## 9. 알고리즘 개선 권고안

### 우선순위 1: 데이터 품질 개선 (근본 원인)

대부분의 매칭 품질 문제는 **supports의 추출된 개인 트랙 데이터가 빈약한 것**에서 기인합니다.

- **조치**: 추출 파이프라인(\`src/lib/extraction/\`)에서 개인 트랙 필드(age, householdTypes, incomeLevels, employmentStatus) 추출 정확도 개선
- **파일**: \`src/lib/extraction/audience-patterns.ts\`
- **기대 효과**: hasData=true인 차원이 증가하면 coverage factor가 상승하고, 더 정확한 knockout + scoring 가능

### 우선순위 2: NULL 데이터 처리 전략 강화

\`hasData=false\`인 차원은 scoring에서 제외되지만, 이로 인해 coverage factor가 낮아지면서도 NULL이 많은 support가 매칭 자체는 통과하는 패턴이 발생할 수 있습니다.

- **현재 로직**: \`scorePipeline\`에서 \`activeDims.length < 1\`이면 null 반환, \`specificDims.length === 0 && activeDims.length < 2\`이면 null 반환
- **제안**: \`activeDims.length < 2\`를 기본 최소 조건으로 강화하거나, coverage factor penalty를 더 강하게 적용
- **파일**: \`src/lib/matching-v4/index.ts\` (scorePipeline 함수)

### 우선순위 3: Coverage Factor 보정 검토

현재 coverage factor = \`0.1 + 0.9 * (totalActiveWeight / 1.0)\`

- 개인 트랙 가중치 합계 = 0.20 + 0.25 + 0.20 + 0.20 + 0.15 = 1.00
- 차원 1개만 활성 시: coverage = 0.1 + 0.9 * weight (예: age만 있으면 0.1 + 0.9*0.25 = 0.325)
- **문제**: 차원 1개만 활성이고 rawScore=1.0이면 finalScore = 1.0 * 0.325 = 0.325 > exploratory 임계값(0.20)
- **제안**: 최소 활성 차원 수를 2개로 강화하거나, 1개 차원만 활성 시 tier 제한(exploratory만)
- **파일**: \`src/lib/matching-v4/index.ts\` (scorePipeline 함수, line ~54)

### 우선순위 4: 관심분야 보너스 보정

+0.10 보너스는 tier 경계를 넘을 수 있어 의도치 않은 tier 승격이 발생할 수 있습니다.

- **제안**: 보너스를 현재 score에 비례하도록 변경 (예: \`finalScore * 1.15\` 대신 \`+0.10\`)
- **파일**: \`src/lib/matching-v4/index.ts\` (scorePipeline 함수, line ~63)

### 우선순위 5: Knockout 임계값 검토

개인 트랙 knockout은 confidence >= 0.7일 때만 작동합니다. 데이터 품질이 낮으면 대부분 knockout을 통과합니다.

- **현재**: 지역 knockout conf >= 0.7, 가구유형 conf >= 0.7, 소득수준 conf >= 0.7, 취업상태 conf >= 0.7
- **제안**: confidence 임계값을 0.5로 낮추면 더 많은 부적합 support가 걸러질 수 있음 (데이터 품질과 트레이드오프)
- **파일**: \`src/lib/matching-v4/dimensions.ts\` (isKnockedOutPersonal 함수, line ~116)

---

## 10. 코드 수정 제안

### 수정 1: scorePipeline 최소 활성 차원 강화

\`\`\`typescript
// src/lib/matching-v4/index.ts, scorePipeline 함수
// Before:
if (activeDims.length < 1) return null

// After:
if (activeDims.length < 2) return null
\`\`\`

### 수정 2: 관심분야 보너스를 비례 방식으로 변경

\`\`\`typescript
// src/lib/matching-v4/index.ts, scorePipeline 함수
// Before:
if (hasInterestBonus) finalScore = Math.min(1.0, finalScore + 0.10)

// After:
if (hasInterestBonus) finalScore = Math.min(1.0, finalScore * 1.12)
\`\`\`

### 수정 3: NULL 차원 4개 이상 support 필터링

\`\`\`typescript
// src/lib/matching-v4/index.ts, scoreSupport 함수에 추가
// 활성 차원이 1개뿐이면 exploratory 이하로 제한
const activeDims = dims.filter(d => d.hasData)
if (activeDims.length <= 1 && tier !== 'exploratory') tier = 'exploratory'
\`\`\`

---

*Generated by audit-personal-matching.ts on ${new Date().toISOString()}*
`

  return md
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
