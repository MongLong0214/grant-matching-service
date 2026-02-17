/**
 * 사업자 트랙 매칭 알고리즘 전수검증 — 200개 케이스
 *
 * 실행: npx tsx scripts/audit-business-matching.ts
 */

import { readFileSync, writeFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

// .env.local 수동 파싱 (dotenv 의존성 없이)
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

// --- 타입 정의 (스크립트 내 자체 정의, @/ alias 미사용) ---

type SupportCategory =
  | "금융" | "기술" | "인력" | "수출" | "내수" | "창업" | "경영" | "복지"
  | "주거" | "육아" | "교육" | "건강" | "고용" | "생활" | "기타"

type ServiceType = 'business' | 'personal' | 'both' | 'unknown'

interface Support {
  id: string
  title: string
  organization: string
  category: SupportCategory
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
  serviceType?: ServiceType
  targetAgeMin?: number | null
  targetAgeMax?: number | null
  targetHouseholdTypes?: string[] | null
  targetIncomeLevels?: string[] | null
  targetEmploymentStatus?: string[] | null
  benefitCategories?: string[] | null
}

interface DiagnoseFormData {
  businessType: string
  region: string
  employeeCount: number
  annualRevenue: number
  businessAge: number
  founderAge: number
}

type UserInput = { userType: 'business' } & DiagnoseFormData

// --- matching-v4 로직 인라인 (scripts/ 폴더가 tsconfig exclude라서 @/ alias 사용 불가) ---

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

// scores.ts 인라인
const BUSINESS_TYPE_ALIASES: Record<string, string[]> = {
  '도매 및 소매업': ['도매업', '소매업', '도매 및 소매업'],
  '숙박 및 음식점업': ['숙박업', '음식점업', '숙박 및 음식점업'],
  '운수 및 창고업': ['운수업', '운수 및 창고업'],
  '전문, 과학 및 기술 서비스업': ['전문서비스업', '전문, 과학 및 기술 서비스업'],
  '교육 서비스업': ['교육서비스업', '교육 서비스업'],
  '보건업 및 사회복지 서비스업': ['보건업', '보건업 및 사회복지 서비스업'],
  '기타': ['기타서비스업', '기타', '예술/스포츠'],
}

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

function expandBusinessType(userType: string): string[] {
  const aliases = BUSINESS_TYPE_ALIASES[userType]
  if (aliases) return [userType, ...aliases]
  // 역방향 검색: alias 값에서 찾기
  for (const [key, vals] of Object.entries(BUSINESS_TYPE_ALIASES)) {
    if (vals.includes(userType)) return [userType, key, ...vals]
  }
  return [userType]
}

function scoreBusinessType(types: string[], userType: string): number {
  if (types.length === 0) return 1.0
  const expanded = expandBusinessType(userType)
  return types.some(t => expanded.includes(t)) ? 1.0 : 0.0
}

function scoreBusinessAge(min: number | null, max: number | null, userAgeMonths: number): number {
  if (userAgeMonths === -1) {
    if (min !== null && min > 0) return 0.0
    if (max !== null && max >= 0) return 1.0
    return 0.5
  }
  return scoreRange(min, max, userAgeMonths, 12)
}

// dimensions.ts 인라인
const BUSINESS_WEIGHTS = {
  region: 0.22, businessAge: 0.20, businessType: 0.18,
  employee: 0.15, founderAge: 0.15, revenue: 0.10,
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

function getBusinessDimensions(support: Support, input: DiagnoseFormData): DimensionInfo[] {
  const c = (support.extractionConfidence ?? null) as ExtractionConfidence | null
  const regions = support.targetRegions
  const types = support.targetBusinessTypes
  return [
    { key: 'region', weight: BUSINESS_WEIGHTS.region, isSpecific: true,
      hasData: hasArr(regions, c?.regions ?? 0), confidence: c?.regions ?? 0,
      rawScore: regions && regions.length > 0 ? scoreRegion(regions, input.region) : 0 },
    { key: 'businessType', weight: BUSINESS_WEIGHTS.businessType, isSpecific: true,
      hasData: hasArr(types, c?.businessTypes ?? 0), confidence: c?.businessTypes ?? 0,
      rawScore: types && types.length > 0 ? scoreBusinessType(types, input.businessType) : 0 },
    { key: 'employee', weight: BUSINESS_WEIGHTS.employee, isSpecific: false,
      hasData: hasRange(support.targetEmployeeMin, support.targetEmployeeMax, c?.employee ?? 0), confidence: c?.employee ?? 0,
      rawScore: support.targetEmployeeMin !== null || support.targetEmployeeMax !== null
        ? scoreRange(support.targetEmployeeMin, support.targetEmployeeMax, input.employeeCount, 10) : 0 },
    { key: 'revenue', weight: BUSINESS_WEIGHTS.revenue, isSpecific: false,
      hasData: hasRange(support.targetRevenueMin, support.targetRevenueMax, c?.revenue ?? 0), confidence: c?.revenue ?? 0,
      rawScore: support.targetRevenueMin !== null || support.targetRevenueMax !== null
        ? scoreRange(support.targetRevenueMin, support.targetRevenueMax, input.annualRevenue, 100_000_000) : 0 },
    { key: 'businessAge', weight: BUSINESS_WEIGHTS.businessAge, isSpecific: false,
      hasData: hasRange(support.targetBusinessAgeMin, support.targetBusinessAgeMax, c?.businessAge ?? 0), confidence: c?.businessAge ?? 0,
      rawScore: support.targetBusinessAgeMin !== null || support.targetBusinessAgeMax !== null
        ? scoreBusinessAge(support.targetBusinessAgeMin, support.targetBusinessAgeMax, input.businessAge) : 0 },
    { key: 'founderAge', weight: BUSINESS_WEIGHTS.founderAge, isSpecific: false,
      hasData: hasRange(support.targetFounderAgeMin, support.targetFounderAgeMax, c?.founderAge ?? 0), confidence: c?.founderAge ?? 0,
      rawScore: support.targetFounderAgeMin !== null || support.targetFounderAgeMax !== null
        ? scoreRange(support.targetFounderAgeMin, support.targetFounderAgeMax, input.founderAge, 10) : 0 },
  ]
}

function isKnockedOutBusiness(support: Support, input: DiagnoseFormData): boolean {
  const c = (support.extractionConfidence ?? null) as ExtractionConfidence | null
  const regions = support.targetRegions
  if (regions && regions.length > 0 && (c?.regions ?? 0) >= 0.7) {
    if (!regions.includes(input.region)) return true
  }
  const types = support.targetBusinessTypes
  if (types && types.length > 0 && (c?.businessTypes ?? 0) >= 0.5) {
    const expanded = expandBusinessType(input.businessType)
    if (!types.some(t => expanded.includes(t))) return true
  }
  if (support.targetEmployeeMax !== null && input.employeeCount > support.targetEmployeeMax * 1.5) return true
  if (support.targetEmployeeMin !== null && input.employeeCount < support.targetEmployeeMin * 0.5) return true
  if (support.targetRevenueMax !== null && input.annualRevenue > support.targetRevenueMax * 2) return true
  if (input.businessAge !== -1) {
    if (support.targetBusinessAgeMax !== null && support.targetBusinessAgeMax > 0 && input.businessAge > support.targetBusinessAgeMax * 1.5) return true
  }
  if (support.targetFounderAgeMax !== null && input.founderAge > support.targetFounderAgeMax + 10) return true
  if (support.targetFounderAgeMin !== null && input.founderAge < support.targetFounderAgeMin - 10) return true
  return false
}

// index.ts (matching engine) 인라인
type MatchTierV4 = 'tailored' | 'recommended' | 'exploratory'

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
    if (isKnockedOutBusiness(support, userInput)) { knockedOut++; continue }
    const dims = getBusinessDimensions(support, userInput)
    const r = scoreSupport(support, dims, false)
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

// --- DB 매퍼 ---
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSupportRow(row: any): Support {
  return {
    id: row.id,
    title: row.title,
    organization: row.organization,
    category: row.category as SupportCategory,
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
    serviceType: (row.service_type as ServiceType) ?? 'unknown',
    targetAgeMin: row.target_age_min,
    targetAgeMax: row.target_age_max,
    targetHouseholdTypes: row.target_household_types,
    targetIncomeLevels: row.target_income_levels,
    targetEmploymentStatus: row.target_employment_status,
    benefitCategories: row.benefit_categories,
  }
}

// --- 상수 (constants/index.ts 미러) ---
const BUSINESS_TYPES = [
  "음식점업", "소매업", "도매업", "제조업", "건설업", "운수업", "숙박업",
  "정보통신업", "전문서비스업", "교육서비스업", "보건업", "예술/스포츠", "기타서비스업",
] as const

const REGIONS = [
  "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종",
  "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
] as const

const EMPLOYEE_VALUES = [2, 7, 30, 75, 150] as const
const REVENUE_VALUES = [50_000_000, 300_000_000, 750_000_000, 3_000_000_000, 10_000_000_000] as const
const BUSINESS_AGE_VALUES = [-1, 6, 24, 48, 84, 180] as const
const FOUNDER_AGE_VALUES = [25, 35, 45, 55, 65] as const

// --- 200개 테스트 케이스 생성 ---

interface TestCase {
  id: number
  label: string
  input: DiagnoseFormData
  tags: string[] // 엣지 케이스 태그
}

function generateTestCases(): TestCase[] {
  const cases: TestCase[] = []
  let id = 0

  // 헬퍼: 인덱스 순환
  const pick = <T>(arr: readonly T[], idx: number): T => arr[idx % arr.length]

  // --- 명시적 엣지 케이스 (8개) ---
  cases.push({
    id: id++, label: '20대 예비창업자 IT 서울 (K-Startup 타겟)',
    input: { businessType: '정보통신업', region: '서울', employeeCount: 2, annualRevenue: 50_000_000, businessAge: -1, founderAge: 25 },
    tags: ['edge', 'youth-startup', 'it'],
  })
  cases.push({
    id: id++, label: '50대 음식점업 5~9명 1억~5억 서울 (전형적 소상공인)',
    input: { businessType: '음식점업', region: '서울', employeeCount: 7, annualRevenue: 300_000_000, businessAge: 84, founderAge: 55 },
    tags: ['edge', 'typical-small-biz'],
  })
  cases.push({
    id: id++, label: '제조업 50명+ 10억~50억 경기 (중소기업 R&D)',
    input: { businessType: '제조업', region: '경기', employeeCount: 75, annualRevenue: 3_000_000_000, businessAge: 84, founderAge: 45 },
    tags: ['edge', 'sme-rnd', 'manufacturing'],
  })
  cases.push({
    id: id++, label: '농업(기타서비스업) 1~4명 1억미만 전남',
    input: { businessType: '기타서비스업', region: '전남', employeeCount: 2, annualRevenue: 50_000_000, businessAge: 48, founderAge: 55 },
    tags: ['edge', 'agriculture-proxy'],
  })
  cases.push({
    id: id++, label: '60대 10년이상 건설업 경남 (노후 사업체)',
    input: { businessType: '건설업', region: '경남', employeeCount: 30, annualRevenue: 750_000_000, businessAge: 180, founderAge: 65 },
    tags: ['edge', 'old-business', 'senior'],
  })
  cases.push({
    id: id++, label: '30대 IT 예비창업자 세종 (지방 창업)',
    input: { businessType: '정보통신업', region: '세종', employeeCount: 2, annualRevenue: 50_000_000, businessAge: -1, founderAge: 35 },
    tags: ['edge', 'local-startup'],
  })
  cases.push({
    id: id++, label: '소매업 1명 1억미만 제주 (영세 소매)',
    input: { businessType: '소매업', region: '제주', employeeCount: 2, annualRevenue: 50_000_000, businessAge: 24, founderAge: 45 },
    tags: ['edge', 'micro-retail'],
  })
  cases.push({
    id: id++, label: '보건업 10~49명 5억~10억 대구 (의료기관)',
    input: { businessType: '보건업', region: '대구', employeeCount: 30, annualRevenue: 750_000_000, businessAge: 48, founderAge: 45 },
    tags: ['edge', 'healthcare'],
  })

  // --- 업종 분포에 따른 체계적 케이스 (192개) ---
  // 업종별 목표: 음식점업(20), 소매업(15), 제조업(15), IT(15), 도매업(10),
  //   건설업(10), 운수업(10), 숙박업(10), 교육서비스업(10), 보건업(10),
  //   전문서비스업(8), 예술/스포츠(8), 기타서비스업(기타+농업)(21 남은 수)
  const businessTypeDistribution: [string, number][] = [
    ['음식점업', 20], ['소매업', 15], ['제조업', 15], ['정보통신업', 15],
    ['도매업', 10], ['건설업', 10], ['운수업', 10], ['숙박업', 10],
    ['교육서비스업', 10], ['보건업', 10], ['전문서비스업', 8], ['예술/스포츠', 8],
    ['기타서비스업', 51], // 나머지 전부
  ]

  // 지역별 가중 배분 (인구 비례 기반)
  const regionWeights: [string, number][] = [
    ['서울', 35], ['경기', 30], ['부산', 15], ['대구', 12], ['인천', 12],
    ['광주', 10], ['대전', 10], ['울산', 8], ['세종', 8], ['강원', 8],
    ['충북', 8], ['충남', 8], ['전북', 8], ['전남', 8], ['경북', 8],
    ['경남', 12], ['제주', 10],
  ]
  const regionPool: string[] = []
  for (const [r, w] of regionWeights) {
    for (let i = 0; i < w; i++) regionPool.push(r)
  }

  // 직원 수 / 매출 / 업력 / 대표자연령 분포 풀
  const employeePool: number[] = []
  const employeeDist: [number, number][] = [[2, 50], [7, 50], [30, 40], [75, 30], [150, 30]]
  for (const [v, c] of employeeDist) for (let i = 0; i < c; i++) employeePool.push(v)

  const revenuePool: number[] = []
  const revenueDist: [number, number][] = [
    [50_000_000, 50], [300_000_000, 50], [750_000_000, 40], [3_000_000_000, 30], [10_000_000_000, 30],
  ]
  for (const [v, c] of revenueDist) for (let i = 0; i < c; i++) revenuePool.push(v)

  const businessAgePool: number[] = []
  const businessAgeDist: [number, number][] = [[-1, 30], [6, 30], [24, 40], [48, 35], [84, 35], [180, 30]]
  for (const [v, c] of businessAgeDist) for (let i = 0; i < c; i++) businessAgePool.push(v)

  const founderAgePool: number[] = []
  const founderAgeDist: [number, number][] = [[25, 40], [35, 50], [45, 40], [55, 40], [65, 30]]
  for (const [v, c] of founderAgeDist) for (let i = 0; i < c; i++) founderAgePool.push(v)

  // 결정론적 섞기 (시드 기반 Fisher-Yates)
  function seededShuffle<T>(arr: T[], seed: number): T[] {
    const a = [...arr]
    let s = seed
    for (let i = a.length - 1; i > 0; i--) {
      s = (s * 1103515245 + 12345) & 0x7fffffff
      const j = s % (i + 1)
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }

  const shuffledRegions = seededShuffle(regionPool, 42)
  const shuffledEmployees = seededShuffle(employeePool, 77)
  const shuffledRevenues = seededShuffle(revenuePool, 123)
  const shuffledBusinessAges = seededShuffle(businessAgePool, 256)
  const shuffledFounderAges = seededShuffle(founderAgePool, 512)

  let poolIdx = 0
  for (const [bt, count] of businessTypeDistribution) {
    // 이미 엣지 케이스에서 사용한 업종 개수를 뺌
    const edgeCount = cases.filter(c => c.input.businessType === bt).length
    const remaining = count - edgeCount
    if (remaining <= 0) continue

    for (let i = 0; i < remaining; i++) {
      if (id >= 200) break
      const region = shuffledRegions[poolIdx % shuffledRegions.length]
      const employee = shuffledEmployees[poolIdx % shuffledEmployees.length]
      const revenue = shuffledRevenues[poolIdx % shuffledRevenues.length]
      const businessAge = shuffledBusinessAges[poolIdx % shuffledBusinessAges.length]
      const founderAge = shuffledFounderAges[poolIdx % shuffledFounderAges.length]
      poolIdx++

      const tags: string[] = []
      if (businessAge === -1) tags.push('pre-startup')
      if (founderAge <= 25) tags.push('young-founder')
      if (founderAge >= 65) tags.push('senior-founder')
      if (employee <= 2) tags.push('micro')
      if (employee >= 150) tags.push('large')
      if (revenue <= 50_000_000) tags.push('low-revenue')
      if (revenue >= 10_000_000_000) tags.push('high-revenue')
      if (businessAge >= 180) tags.push('established')

      const ageLabel = founderAge <= 29 ? '20대' : founderAge <= 39 ? '30대' : founderAge <= 49 ? '40대' : founderAge <= 59 ? '50대' : '60대+'
      const employeeLabel = employee <= 4 ? '1~4명' : employee <= 9 ? '5~9명' : employee <= 49 ? '10~49명' : employee <= 99 ? '50~99명' : '100명+'
      const businessAgeLabel = businessAge === -1 ? '예비' : businessAge <= 12 ? '1년미만' : businessAge <= 36 ? '1~3년' : businessAge <= 60 ? '3~5년' : businessAge <= 120 ? '5~10년' : '10년+'

      cases.push({
        id: id++,
        label: `${ageLabel} ${bt} ${employeeLabel} ${businessAgeLabel} ${region}`,
        input: { businessType: bt, region, employeeCount: employee, annualRevenue: revenue, businessAge, founderAge },
        tags,
      })
    }
    if (id >= 200) break
  }

  // 200개 미달 시 추가 케이스 생성 (다양한 조합)
  while (cases.length < 200) {
    const region = shuffledRegions[poolIdx % shuffledRegions.length]
    const employee = shuffledEmployees[poolIdx % shuffledEmployees.length]
    const revenue = shuffledRevenues[poolIdx % shuffledRevenues.length]
    const businessAge = shuffledBusinessAges[poolIdx % shuffledBusinessAges.length]
    const founderAge = shuffledFounderAges[poolIdx % shuffledFounderAges.length]
    const bt = BUSINESS_TYPES[poolIdx % BUSINESS_TYPES.length]
    poolIdx++

    const ageLabel = founderAge <= 29 ? '20대' : founderAge <= 39 ? '30대' : founderAge <= 49 ? '40대' : founderAge <= 59 ? '50대' : '60대+'
    const employeeLabel = employee <= 4 ? '1~4명' : employee <= 9 ? '5~9명' : employee <= 49 ? '10~49명' : employee <= 99 ? '50~99명' : '100명+'
    const businessAgeLabel = businessAge === -1 ? '예비' : businessAge <= 12 ? '1년미만' : businessAge <= 36 ? '1~3년' : businessAge <= 60 ? '3~5년' : businessAge <= 120 ? '5~10년' : '10년+'

    cases.push({
      id: id++,
      label: `${ageLabel} ${bt} ${employeeLabel} ${businessAgeLabel} ${region} (보충)`,
      input: { businessType: bt, region, employeeCount: employee, annualRevenue: revenue, businessAge, founderAge },
      tags: ['supplemental'],
    })
  }

  return cases.slice(0, 200)
}

// --- 분석 결과 타입 ---

interface CaseResult {
  case: TestCase
  result: MatchResultV4
  tailoredCount: number
  recommendedCount: number
  exploratoryCount: number
  totalMatches: number
  knockedOutCount: number
  knockedOutPct: number
  filteredByServiceType: number
  avgScore: number
  maxScore: number
  // 차원별 디테일 (top 3 매칭의 평균)
  avgBreakdown: Record<string, number>
}

interface AuditReport {
  // 기본 통계
  totalCases: number
  totalSupports: number
  businessSupports: number
  // 빈 결과
  emptyCount: number
  emptyPct: number
  emptyCases: TestCase[]
  // 과다 매칭
  overMatchCount: number
  overMatchPct: number
  // Tier 분포
  avgTailored: number
  avgRecommended: number
  avgExploratory: number
  avgTotal: number
  medianTotal: number
  // Knockout
  avgKnockoutPct: number
  medianKnockoutPct: number
  // Score 분포
  avgScore: number
  medianScore: number
  stddevScore: number
  // Coverage factor 분포 (from scored supports)
  avgCoverage: number
  medianCoverage: number
  // 문제 케이스
  problemCases: CaseResult[]
  // 업종별/지역별 통계
  byBusinessType: Record<string, { count: number; avgMatches: number; emptyCount: number }>
  byRegion: Record<string, { count: number; avgMatches: number; emptyCount: number }>
  byEmployeeSize: Record<string, { count: number; avgMatches: number }>
  byBusinessAge: Record<string, { count: number; avgMatches: number }>
  byFounderAge: Record<string, { count: number; avgMatches: number }>
  // 업종 alias 분석
  aliasAnalysis: { userType: string; matchedTypes: string[]; count: number }[]
  // NULL bias 분석
  nullBias: {
    supportsWithNoData: number // 모든 target 필드가 null
    avgScoreNoData: number
    avgScoreWithData: number
  }
  // 전체 케이스 결과
  allResults: CaseResult[]
}

// --- 메인 실행 ---

async function loadSupports(): Promise<Support[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Supabase 환경변수 없음 (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)')

  const supabase = createClient(url, key)
  const today = new Date().toISOString().split('T')[0]

  // 전체 활성 supports 로드 (페이지네이션)
  let allRows: unknown[] = []
  let from = 0
  const pageSize = 1000

  while (true) {
    const { data: rows, error } = await supabase
      .from('supports')
      .select('*')
      .eq('is_active', true)
      .or(`end_date.is.null,end_date.gte.${today}`)
      .range(from, from + pageSize - 1)

    if (error) throw error
    if (!rows || rows.length === 0) break
    allRows = allRows.concat(rows)
    if (rows.length < pageSize) break
    from += pageSize
  }

  return allRows.map(mapSupportRow)
}

function analyzeSupports(supports: Support[]): {
  totalBusiness: number
  serviceTypeBreakdown: Record<string, number>
  nullFieldCounts: Record<string, number>
  confidenceDistribution: Record<string, { high: number; low: number; none: number }>
} {
  const serviceTypeBreakdown: Record<string, number> = {}
  const nullFieldCounts: Record<string, number> = {
    targetRegions: 0, targetBusinessTypes: 0, targetEmployeeMin: 0, targetEmployeeMax: 0,
    targetRevenueMin: 0, targetRevenueMax: 0, targetBusinessAgeMin: 0, targetBusinessAgeMax: 0,
    targetFounderAgeMin: 0, targetFounderAgeMax: 0,
  }
  const confidenceDistribution: Record<string, { high: number; low: number; none: number }> = {
    regions: { high: 0, low: 0, none: 0 },
    businessTypes: { high: 0, low: 0, none: 0 },
    employee: { high: 0, low: 0, none: 0 },
    revenue: { high: 0, low: 0, none: 0 },
    businessAge: { high: 0, low: 0, none: 0 },
    founderAge: { high: 0, low: 0, none: 0 },
  }

  let totalBusiness = 0

  for (const s of supports) {
    const st = s.serviceType ?? 'unknown'
    serviceTypeBreakdown[st] = (serviceTypeBreakdown[st] || 0) + 1
    if (st === 'business' || st === 'both' || st === 'unknown') totalBusiness++

    if (!s.targetRegions || s.targetRegions.length === 0) nullFieldCounts.targetRegions++
    if (!s.targetBusinessTypes || s.targetBusinessTypes.length === 0) nullFieldCounts.targetBusinessTypes++
    if (s.targetEmployeeMin === null) nullFieldCounts.targetEmployeeMin++
    if (s.targetEmployeeMax === null) nullFieldCounts.targetEmployeeMax++
    if (s.targetRevenueMin === null) nullFieldCounts.targetRevenueMin++
    if (s.targetRevenueMax === null) nullFieldCounts.targetRevenueMax++
    if (s.targetBusinessAgeMin === null) nullFieldCounts.targetBusinessAgeMin++
    if (s.targetBusinessAgeMax === null) nullFieldCounts.targetBusinessAgeMax++
    if (s.targetFounderAgeMin === null) nullFieldCounts.targetFounderAgeMin++
    if (s.targetFounderAgeMax === null) nullFieldCounts.targetFounderAgeMax++

    const c = s.extractionConfidence as Record<string, number> | null
    for (const field of ['regions', 'businessTypes', 'employee', 'revenue', 'businessAge', 'founderAge']) {
      const conf = c?.[field] ?? 0
      if (conf >= 0.5) confidenceDistribution[field].high++
      else if (conf >= 0.3) confidenceDistribution[field].low++
      else confidenceDistribution[field].none++
    }
  }

  return { totalBusiness, serviceTypeBreakdown, nullFieldCounts, confidenceDistribution }
}

function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function stddev(arr: number[]): number {
  const mean = arr.reduce((s, v) => s + v, 0) / arr.length
  return Math.sqrt(arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length)
}

function runAudit(supports: Support[], testCases: TestCase[]): AuditReport {
  const allResults: CaseResult[] = []

  // 사업자 관련 supports 필터링
  const businessSupports = supports.filter(s => {
    const st = s.serviceType ?? 'unknown'
    return st === 'business' || st === 'both' || st === 'unknown'
  })

  for (const tc of testCases) {
    const input: UserInput = { userType: 'business', ...tc.input }
    const result = matchSupportsV4(supports, input)

    const avgScore = result.all.length > 0
      ? result.all.reduce((s, r) => s + r.score, 0) / result.all.length : 0
    const maxScore = result.all.length > 0
      ? Math.max(...result.all.map(r => r.score)) : 0

    // 평균 breakdown (top 3)
    const avgBreakdown: Record<string, number> = {}
    const top3 = result.all.slice(0, 3)
    if (top3.length > 0) {
      for (const key of Object.keys(top3[0].breakdown)) {
        avgBreakdown[key] = top3.reduce((s, r) => s + (r.breakdown[key] ?? 0), 0) / top3.length
      }
    }

    allResults.push({
      case: tc,
      result,
      tailoredCount: result.tailored.length,
      recommendedCount: result.recommended.length,
      exploratoryCount: result.exploratory.length,
      totalMatches: result.totalCount,
      knockedOutCount: result.knockedOut,
      knockedOutPct: result.totalAnalyzed > 0 ? result.knockedOut / result.totalAnalyzed : 0,
      filteredByServiceType: result.filteredByServiceType,
      avgScore,
      maxScore,
      avgBreakdown,
    })
  }

  // 통계
  const totalMatches = allResults.map(r => r.totalMatches)
  const emptyResults = allResults.filter(r => r.totalMatches === 0)
  const overMatchResults = allResults.filter(r => r.totalMatches >= 100)
  const knockoutPcts = allResults.map(r => r.knockedOutPct)
  const avgScores = allResults.filter(r => r.totalMatches > 0).map(r => r.avgScore)
  const coverages = allResults.filter(r => r.result.all.length > 0)
    .map(r => r.result.all[0].scores.coverage)

  // 업종별
  const byBusinessType: Record<string, { count: number; avgMatches: number; emptyCount: number }> = {}
  const byRegion: Record<string, { count: number; avgMatches: number; emptyCount: number }> = {}
  const byEmployeeSize: Record<string, { count: number; avgMatches: number }> = {}
  const byBusinessAge: Record<string, { count: number; avgMatches: number }> = {}
  const byFounderAge: Record<string, { count: number; avgMatches: number }> = {}

  for (const r of allResults) {
    // 업종
    const bt = r.case.input.businessType
    if (!byBusinessType[bt]) byBusinessType[bt] = { count: 0, avgMatches: 0, emptyCount: 0 }
    byBusinessType[bt].count++
    byBusinessType[bt].avgMatches += r.totalMatches
    if (r.totalMatches === 0) byBusinessType[bt].emptyCount++

    // 지역
    const rg = r.case.input.region
    if (!byRegion[rg]) byRegion[rg] = { count: 0, avgMatches: 0, emptyCount: 0 }
    byRegion[rg].count++
    byRegion[rg].avgMatches += r.totalMatches
    if (r.totalMatches === 0) byRegion[rg].emptyCount++

    // 직원수
    const empLabel = r.case.input.employeeCount <= 4 ? '1~4명' : r.case.input.employeeCount <= 9 ? '5~9명' : r.case.input.employeeCount <= 49 ? '10~49명' : r.case.input.employeeCount <= 99 ? '50~99명' : '100명+'
    if (!byEmployeeSize[empLabel]) byEmployeeSize[empLabel] = { count: 0, avgMatches: 0 }
    byEmployeeSize[empLabel].count++
    byEmployeeSize[empLabel].avgMatches += r.totalMatches

    // 업력
    const ageLabel = r.case.input.businessAge === -1 ? '예비창업' : r.case.input.businessAge <= 12 ? '1년미만' : r.case.input.businessAge <= 36 ? '1~3년' : r.case.input.businessAge <= 60 ? '3~5년' : r.case.input.businessAge <= 120 ? '5~10년' : '10년+'
    if (!byBusinessAge[ageLabel]) byBusinessAge[ageLabel] = { count: 0, avgMatches: 0 }
    byBusinessAge[ageLabel].count++
    byBusinessAge[ageLabel].avgMatches += r.totalMatches

    // 대표자 연령
    const faLabel = r.case.input.founderAge <= 29 ? '20대' : r.case.input.founderAge <= 39 ? '30대' : r.case.input.founderAge <= 49 ? '40대' : r.case.input.founderAge <= 59 ? '50대' : '60대+'
    if (!byFounderAge[faLabel]) byFounderAge[faLabel] = { count: 0, avgMatches: 0 }
    byFounderAge[faLabel].count++
    byFounderAge[faLabel].avgMatches += r.totalMatches
  }

  // 평균으로 변환
  for (const v of Object.values(byBusinessType)) v.avgMatches = v.avgMatches / v.count
  for (const v of Object.values(byRegion)) v.avgMatches = v.avgMatches / v.count
  for (const v of Object.values(byEmployeeSize)) v.avgMatches = v.avgMatches / v.count
  for (const v of Object.values(byBusinessAge)) v.avgMatches = v.avgMatches / v.count
  for (const v of Object.values(byFounderAge)) v.avgMatches = v.avgMatches / v.count

  // 업종 alias 분석
  const aliasAnalysis: { userType: string; matchedTypes: string[]; count: number }[] = []
  for (const bt of BUSINESS_TYPES) {
    const expanded = expandBusinessType(bt)
    const matchingSupports = businessSupports.filter(s =>
      s.targetBusinessTypes && s.targetBusinessTypes.length > 0 &&
      s.targetBusinessTypes.some(t => expanded.includes(t))
    )
    const allTargetTypes = new Set<string>()
    for (const s of matchingSupports) {
      if (s.targetBusinessTypes) s.targetBusinessTypes.forEach(t => allTargetTypes.add(t))
    }
    aliasAnalysis.push({ userType: bt, matchedTypes: [...allTargetTypes], count: matchingSupports.length })
  }

  // NULL bias 분석
  const supportsWithNoData = businessSupports.filter(s => {
    const c = s.extractionConfidence as Record<string, number> | null
    const allLow = ['regions', 'businessTypes', 'employee', 'revenue', 'businessAge', 'founderAge']
      .every(k => (c?.[k] ?? 0) < MIN_CONF)
    return allLow
  })

  // 데이터 없는 supports의 평균 점수 계산 (첫 번째 테스트케이스 기준)
  const sampleInput: UserInput = { userType: 'business', ...testCases[0].input }
  let noDataScores: number[] = []
  let withDataScores: number[] = []
  for (const s of businessSupports.slice(0, 500)) { // 샘플링
    const c = s.extractionConfidence as Record<string, number> | null
    const allLow = ['regions', 'businessTypes', 'employee', 'revenue', 'businessAge', 'founderAge']
      .every(k => (c?.[k] ?? 0) < MIN_CONF)
    const dims = getBusinessDimensions(s, sampleInput)
    const scored = scoreSupport(s, dims, false)
    if (scored) {
      if (allLow) noDataScores.push(scored.score)
      else withDataScores.push(scored.score)
    }
  }

  // 문제 케이스 식별: 빈 결과 + 과다 매칭 + 비정상 점수분포 + 극단적 tier 편중
  const problemCases: CaseResult[] = [
    ...allResults.filter(r => r.totalMatches === 0),                          // 빈 결과
    ...allResults.filter(r => r.totalMatches >= 100),                         // 과다 매칭
    ...allResults.filter(r => r.totalMatches > 0 && r.avgScore > 0.8),       // 비정상 고점수
    ...allResults.filter(r => r.totalMatches > 0 && r.totalMatches < 5),     // 과소 매칭
    ...allResults.filter(r => r.tailoredCount === 0 && r.recommendedCount === 0 && r.totalMatches > 30), // 전부 exploratory
    ...allResults.filter(r => r.tailoredCount >= 5),                          // 많은 tailored (분석용)
    ...allResults.filter(r => r.totalMatches > 60),                           // 다수 매칭
    ...allResults.filter(r => r.knockedOutPct > 0.3),                         // 높은 knockout
  ]
  // 중복 제거
  const seen = new Set<number>()
  const uniqueProblems = problemCases.filter(p => {
    if (seen.has(p.case.id)) return false
    seen.add(p.case.id)
    return true
  })

  return {
    totalCases: testCases.length,
    totalSupports: supports.length,
    businessSupports: businessSupports.length,
    emptyCount: emptyResults.length,
    emptyPct: emptyResults.length / testCases.length * 100,
    emptyCases: emptyResults.map(r => r.case),
    overMatchCount: overMatchResults.length,
    overMatchPct: overMatchResults.length / testCases.length * 100,
    avgTailored: allResults.reduce((s, r) => s + r.tailoredCount, 0) / testCases.length,
    avgRecommended: allResults.reduce((s, r) => s + r.recommendedCount, 0) / testCases.length,
    avgExploratory: allResults.reduce((s, r) => s + r.exploratoryCount, 0) / testCases.length,
    avgTotal: totalMatches.reduce((s, v) => s + v, 0) / totalMatches.length,
    medianTotal: median(totalMatches),
    avgKnockoutPct: knockoutPcts.reduce((s, v) => s + v, 0) / knockoutPcts.length * 100,
    medianKnockoutPct: median(knockoutPcts) * 100,
    avgScore: avgScores.length > 0 ? avgScores.reduce((s, v) => s + v, 0) / avgScores.length : 0,
    medianScore: avgScores.length > 0 ? median(avgScores) : 0,
    stddevScore: avgScores.length > 0 ? stddev(avgScores) : 0,
    avgCoverage: coverages.length > 0 ? coverages.reduce((s, v) => s + v, 0) / coverages.length : 0,
    medianCoverage: coverages.length > 0 ? median(coverages) : 0,
    problemCases: uniqueProblems.sort((a, b) => {
      // 빈 결과 우선, 그 다음 과다 매칭
      if (a.totalMatches === 0 && b.totalMatches !== 0) return -1
      if (b.totalMatches === 0 && a.totalMatches !== 0) return 1
      return b.totalMatches - a.totalMatches
    }).slice(0, 20),
    byBusinessType,
    byRegion,
    byEmployeeSize,
    byBusinessAge,
    byFounderAge,
    aliasAnalysis,
    nullBias: {
      supportsWithNoData: supportsWithNoData.length,
      avgScoreNoData: noDataScores.length > 0 ? noDataScores.reduce((s, v) => s + v, 0) / noDataScores.length : 0,
      avgScoreWithData: withDataScores.length > 0 ? withDataScores.reduce((s, v) => s + v, 0) / withDataScores.length : 0,
    },
    allResults,
  }
}

function generateReport(report: AuditReport, supportAnalysis: ReturnType<typeof analyzeSupports>): string {
  const lines: string[] = []
  const ln = (...args: string[]) => lines.push(args.join(''))
  const pct = (v: number) => `${v.toFixed(1)}%`
  const num = (v: number) => v.toFixed(2)

  ln('# 사업자 트랙 매칭 알고리즘 전수검증 리포트')
  ln('')
  ln(`> 검증 일시: ${new Date().toISOString()}`)
  ln(`> 검증 케이스: ${report.totalCases}개`)
  ln(`> DB 지원사업: ${report.totalSupports}개 (사업자 대상: ${report.businessSupports}개)`)
  ln('')

  // Executive Summary
  ln('## 1. Executive Summary')
  ln('')

  // 등급 산정
  let grade: string
  let gradeReason: string[] = []
  let score = 100

  if (report.emptyPct > 20) { score -= 30; gradeReason.push(`빈 결과 비율 ${pct(report.emptyPct)} (목표 5% 미만)`) }
  else if (report.emptyPct > 10) { score -= 20; gradeReason.push(`빈 결과 비율 ${pct(report.emptyPct)} (목표 5% 미만)`) }
  else if (report.emptyPct > 5) { score -= 10; gradeReason.push(`빈 결과 비율 ${pct(report.emptyPct)} (목표 5% 미만)`) }

  if (report.overMatchPct > 30) { score -= 20; gradeReason.push(`과다 매칭 비율 ${pct(report.overMatchPct)} (목표 10% 미만)`) }
  else if (report.overMatchPct > 10) { score -= 10; gradeReason.push(`과다 매칭 비율 ${pct(report.overMatchPct)} (목표 10% 미만)`) }

  if (report.avgTailored < 1) { score -= 15; gradeReason.push(`평균 tailored ${num(report.avgTailored)} (너무 낮음)`) }
  if (report.avgTotal < 5) { score -= 10; gradeReason.push(`평균 매칭 ${num(report.avgTotal)} (너무 적음)`) }
  if (report.avgTotal > 80) { score -= 10; gradeReason.push(`평균 매칭 ${num(report.avgTotal)} (너무 많음)`) }

  if (report.nullBias.avgScoreNoData > report.nullBias.avgScoreWithData * 1.3) {
    score -= 15; gradeReason.push('NULL bias 감지: 데이터 없는 supports가 더 높은 점수')
  }

  if (score >= 90) grade = 'A'
  else if (score >= 75) grade = 'B'
  else if (score >= 60) grade = 'C'
  else if (score >= 40) grade = 'D'
  else grade = 'F'

  ln(`**전체 품질 등급: ${grade} (${score}/100)**`)
  ln('')
  if (gradeReason.length > 0) {
    ln('감점 사유:')
    for (const r of gradeReason) ln(`- ${r}`)
    ln('')
  }

  // 핵심 지표 요약
  ln('| 지표 | 값 | 목표 | 상태 |')
  ln('|------|-----|------|------|')
  ln(`| 빈 결과 비율 | ${pct(report.emptyPct)} (${report.emptyCount}건) | < 5% | ${report.emptyPct < 5 ? 'PASS' : report.emptyPct < 10 ? 'WARN' : 'FAIL'} |`)
  ln(`| 과다 매칭 비율 (100+) | ${pct(report.overMatchPct)} (${report.overMatchCount}건) | < 10% | ${report.overMatchPct < 10 ? 'PASS' : report.overMatchPct < 20 ? 'WARN' : 'FAIL'} |`)
  ln(`| 평균 매칭 건수 | ${num(report.avgTotal)} | 10~50 | ${report.avgTotal >= 10 && report.avgTotal <= 50 ? 'PASS' : 'WARN'} |`)
  ln(`| 중위 매칭 건수 | ${num(report.medianTotal)} | 10~50 | ${report.medianTotal >= 10 && report.medianTotal <= 50 ? 'PASS' : 'WARN'} |`)
  ln(`| 평균 tailored | ${num(report.avgTailored)} | >= 3 | ${report.avgTailored >= 3 ? 'PASS' : report.avgTailored >= 1 ? 'WARN' : 'FAIL'} |`)
  ln(`| 평균 recommended | ${num(report.avgRecommended)} | >= 5 | ${report.avgRecommended >= 5 ? 'PASS' : report.avgRecommended >= 2 ? 'WARN' : 'FAIL'} |`)
  ln(`| 평균 exploratory | ${num(report.avgExploratory)} | >= 5 | ${report.avgExploratory >= 5 ? 'PASS' : 'WARN'} |`)
  ln('')

  // 2. DB 데이터 현황
  ln('## 2. DB 데이터 현황')
  ln('')
  ln('### 서비스 타입별 분포')
  ln('| 서비스 타입 | 건수 |')
  ln('|-----------|------|')
  for (const [st, cnt] of Object.entries(supportAnalysis.serviceTypeBreakdown).sort((a, b) => b[1] - a[1])) {
    ln(`| ${st} | ${cnt} |`)
  }
  ln('')

  ln('### NULL 필드 현황 (전체 supports 대비)')
  ln('| 필드 | NULL 건수 | NULL 비율 |')
  ln('|------|----------|----------|')
  for (const [field, cnt] of Object.entries(supportAnalysis.nullFieldCounts).sort((a, b) => b[1] - a[1])) {
    ln(`| ${field} | ${cnt} | ${pct(cnt / report.totalSupports * 100)} |`)
  }
  ln('')

  ln('### 추출 신뢰도 분포')
  ln('| 차원 | High (>=0.5) | Low (0.3~0.5) | None (<0.3) |')
  ln('|------|-------------|---------------|-------------|')
  for (const [dim, dist] of Object.entries(supportAnalysis.confidenceDistribution)) {
    ln(`| ${dim} | ${dist.high} | ${dist.low} | ${dist.none} |`)
  }
  ln('')

  // 3. 200개 케이스 통계
  ln('## 3. 200개 케이스 통계 요약')
  ln('')
  ln('### 매칭 건수 분포')
  ln(`- 평균: ${num(report.avgTotal)}, 중위수: ${num(report.medianTotal)}`)
  ln(`- 평균 점수: ${num(report.avgScore)}, 중위 점수: ${num(report.medianScore)}, 표준편차: ${num(report.stddevScore)}`)
  ln(`- 평균 knockout 비율: ${pct(report.avgKnockoutPct)}, 중위: ${pct(report.medianKnockoutPct)}`)
  ln('')

  // 매칭 건수 히스토그램
  const buckets = [0, 1, 5, 10, 20, 30, 50, 100]
  ln('### 매칭 건수 히스토그램')
  ln('| 범위 | 케이스 수 | 비율 |')
  ln('|------|---------|------|')
  for (let i = 0; i < buckets.length; i++) {
    const lo = buckets[i]
    const hi = i + 1 < buckets.length ? buckets[i + 1] - 1 : 999
    const label = i + 1 < buckets.length ? `${lo}~${hi}` : `${lo}+`
    const count = report.allResults.filter(r =>
      r.totalMatches >= lo && (i + 1 < buckets.length ? r.totalMatches <= hi : true)
    ).length
    ln(`| ${label} | ${count} | ${pct(count / report.totalCases * 100)} |`)
  }
  ln('')

  // 4. Tier별 분포
  ln('## 4. Tier별 분포 히트맵')
  ln('')
  ln('### 업종별 평균 매칭 건수')
  ln('| 업종 | 케이스수 | 평균매칭 | 빈결과 | 비율 |')
  ln('|------|---------|---------|--------|------|')
  for (const [bt, stats] of Object.entries(report.byBusinessType).sort((a, b) => b[1].avgMatches - a[1].avgMatches)) {
    ln(`| ${bt} | ${stats.count} | ${num(stats.avgMatches)} | ${stats.emptyCount} | ${pct(stats.emptyCount / stats.count * 100)} |`)
  }
  ln('')

  ln('### 지역별 평균 매칭 건수')
  ln('| 지역 | 케이스수 | 평균매칭 | 빈결과 | 빈결과비율 |')
  ln('|------|---------|---------|--------|----------|')
  for (const [rg, stats] of Object.entries(report.byRegion).sort((a, b) => b[1].avgMatches - a[1].avgMatches)) {
    ln(`| ${rg} | ${stats.count} | ${num(stats.avgMatches)} | ${stats.emptyCount} | ${pct(stats.emptyCount / stats.count * 100)} |`)
  }
  ln('')

  ln('### 직원 수별 평균 매칭 건수')
  ln('| 직원 수 | 케이스수 | 평균매칭 |')
  ln('|--------|---------|---------|')
  for (const [emp, stats] of Object.entries(report.byEmployeeSize)) {
    ln(`| ${emp} | ${stats.count} | ${num(stats.avgMatches)} |`)
  }
  ln('')

  ln('### 업력별 평균 매칭 건수')
  ln('| 업력 | 케이스수 | 평균매칭 |')
  ln('|------|---------|---------|')
  for (const [age, stats] of Object.entries(report.byBusinessAge)) {
    ln(`| ${age} | ${stats.count} | ${num(stats.avgMatches)} |`)
  }
  ln('')

  ln('### 대표자 연령별 평균 매칭 건수')
  ln('| 연령대 | 케이스수 | 평균매칭 |')
  ln('|--------|---------|---------|')
  for (const [fa, stats] of Object.entries(report.byFounderAge)) {
    ln(`| ${fa} | ${stats.count} | ${num(stats.avgMatches)} |`)
  }
  ln('')

  // 5. 문제 케이스 Top 20
  ln('## 5. 문제 케이스 Top 20 상세 분석')
  ln('')
  for (const p of report.problemCases) {
    const inp = p.case.input
    const problemType = p.totalMatches === 0 ? '[빈 결과]'
      : p.totalMatches >= 100 ? '[과다 매칭]'
      : p.totalMatches < 3 ? '[과소 매칭]'
      : p.avgScore > 0.8 ? '[비정상 고점수]'
      : '[기타]'

    ln(`### Case #${p.case.id}: ${problemType} ${p.case.label}`)
    ln(`- **프로필**: ${inp.businessType} / ${inp.region} / 직원${inp.employeeCount}명 / 매출${(inp.annualRevenue / 100_000_000).toFixed(1)}억 / 업력${inp.businessAge}개월 / 대표${inp.founderAge}세`)
    ln(`- **매칭**: tailored=${p.tailoredCount}, recommended=${p.recommendedCount}, exploratory=${p.exploratoryCount}, total=${p.totalMatches}`)
    ln(`- **knockout**: ${p.knockedOutCount}건 (${pct(p.knockedOutPct * 100)}), serviceType필터: ${p.filteredByServiceType}건`)
    ln(`- **점수**: avg=${num(p.avgScore)}, max=${num(p.maxScore)}`)
    if (Object.keys(p.avgBreakdown).length > 0) {
      ln(`- **Top3 평균 breakdown**: ${Object.entries(p.avgBreakdown).map(([k, v]) => `${k}=${num(v)}`).join(', ')}`)
    }
    ln(`- **태그**: ${p.case.tags.join(', ') || 'none'}`)

    // 상위 3개 매칭 상세
    if (p.result.all.length > 0) {
      ln('- **상위 매칭 예시**:')
      for (const s of p.result.all.slice(0, 3)) {
        ln(`  - [${s.tier}] score=${num(s.score)} "${s.support.title}" (${s.support.organization})`)
        ln(`    breakdown: ${Object.entries(s.breakdown).map(([k, v]) => `${k}=${num(v)}`).join(', ')}`)
        ln(`    targets: region=${JSON.stringify(s.support.targetRegions)}, type=${JSON.stringify(s.support.targetBusinessTypes)}`)
      }
    }
    ln('')
  }

  // 6. NULL bias 분석
  ln('## 6. NULL Bias 분석')
  ln('')
  ln(`| 지표 | 값 |`)
  ln(`|------|-----|`)
  ln(`| 모든 차원 데이터 없는 supports | ${report.nullBias.supportsWithNoData}개 (${pct(report.nullBias.supportsWithNoData / report.businessSupports * 100)}) |`)
  ln(`| 데이터 없는 supports 평균 점수 | ${num(report.nullBias.avgScoreNoData)} |`)
  ln(`| 데이터 있는 supports 평균 점수 | ${num(report.nullBias.avgScoreWithData)} |`)
  ln(`| NULL bias ratio | ${report.nullBias.avgScoreWithData > 0 ? num(report.nullBias.avgScoreNoData / report.nullBias.avgScoreWithData) : 'N/A'} |`)
  ln('')
  if (report.nullBias.avgScoreNoData > report.nullBias.avgScoreWithData) {
    ln('> **경고**: 데이터가 없는 supports가 더 높은 점수를 받고 있습니다. hasData 필터링 및 coverage factor로 보정되고 있지만, 잔여 NULL bias가 존재합니다.')
  } else {
    ln('> NULL bias 없음. 데이터가 있는 supports가 적절히 더 높은 점수를 받고 있습니다.')
  }
  ln('')

  // 7. 업종 Alias 분석
  ln('## 7. 업종 Alias 분석')
  ln('')
  ln('| 사용자 업종 | 매칭 타겟 업종 | 매칭 supports 수 |')
  ln('|-----------|-------------|----------------|')
  for (const a of report.aliasAnalysis) {
    ln(`| ${a.userType} | ${a.matchedTypes.join(', ') || '(없음)'} | ${a.count} |`)
  }
  ln('')

  // 8. Coverage Factor 분석
  ln('## 8. Coverage Factor 분석')
  ln('')
  ln(`- 평균: ${num(report.avgCoverage)}`)
  ln(`- 중위수: ${num(report.medianCoverage)}`)
  ln(`- 공식: \`0.1 + 0.9 * (totalActiveWeight / 1.0)\``)
  ln('')
  ln('> coverage factor는 활성 차원(hasData=true, confidence>=0.3)의 가중치 합에 비례합니다.')
  ln('> 가중치 합이 1.0이면 coverage=1.0, 합이 0이면 coverage=0.1 (바닥).')
  ln('')

  // 8b. hasSpecificMatch 강등 분석
  ln('## 8b. hasSpecificMatch 강등 분석')
  ln('')
  const allCasesWithMatches = report.allResults.filter(r => r.totalMatches > 0)
  const exploratoryOnlyResults = allCasesWithMatches.filter(r => r.tailoredCount === 0 && r.recommendedCount === 0)
  const hasAnyTailored = allCasesWithMatches.filter(r => r.tailoredCount > 0)
  const hasAnyRecommended = allCasesWithMatches.filter(r => r.recommendedCount > 0)
  ln(`| 지표 | 값 |`)
  ln(`|------|-----|`)
  ln(`| 전체 매칭 있는 케이스 | ${allCasesWithMatches.length} |`)
  ln(`| tailored > 0 케이스 | ${hasAnyTailored.length} (${pct(hasAnyTailored.length / Math.max(1, allCasesWithMatches.length) * 100)}) |`)
  ln(`| recommended > 0 케이스 | ${hasAnyRecommended.length} (${pct(hasAnyRecommended.length / Math.max(1, allCasesWithMatches.length) * 100)}) |`)
  ln(`| 전부 exploratory 케이스 | ${exploratoryOnlyResults.length} (${pct(exploratoryOnlyResults.length / Math.max(1, allCasesWithMatches.length) * 100)}) |`)
  ln('')
  ln('> **설명**: `scoreSupport()`에서 `hasSpecificMatch`가 false이면 tailored/recommended → exploratory로 강등됩니다.')
  ln('> "specific" 차원은 region(isSpecific=true)과 businessType(isSpecific=true)입니다.')
  ln('> 이 두 차원에서 rawScore >= 0.8인 매칭이 하나도 없으면 강등됩니다.')
  ln('> DB에서 region 데이터가 있는 supports가 극소수(1%~2%)이므로, 대부분의 매칭에서 region 차원은 비활성입니다.')
  ln('> businessType은 30% 정도에서 활성이지만, 업종이 다르면 0.0으로 즉시 실패합니다.')
  ln('')

  // 9. 알고리즘 개선 권고안
  ln('## 9. 알고리즘 개선 권고안')
  ln('')

  const recommendations: { priority: string; title: string; detail: string; files: string }[] = []

  // 빈 결과 분석
  if (report.emptyPct > 5) {
    recommendations.push({
      priority: 'P1-HIGH',
      title: '빈 결과 비율 감소',
      detail: `현재 ${pct(report.emptyPct)}의 케이스가 매칭 0건입니다. 주요 원인: (1) knockout이 너무 공격적, (2) coverage factor가 하위 케이스에서 점수를 과도하게 낮춤, (3) 특정 지역/업종의 supports 부족. exploratory 임계값(현재 0.20)을 0.15로 낮추거나, knockout 조건의 배수를 완화하세요.`,
      files: 'src/lib/matching-v4/index.ts (TIER_THRESHOLDS), src/lib/matching-v4/dimensions.ts (isKnockedOutBusiness)',
    })
  }

  if (report.overMatchPct > 10) {
    recommendations.push({
      priority: 'P2-MEDIUM',
      title: '과다 매칭 제어',
      detail: `${pct(report.overMatchPct)}의 케이스에서 100건 이상 매칭됩니다. TOTAL_CAP=100이 이미 적용되어 있지만, 이는 사용자에게 너무 많은 결과를 보여줄 수 있습니다. 특정 차원의 구분력이 부족한 것이 원인일 수 있습니다.`,
      files: 'src/lib/matching-v4/index.ts (TOTAL_CAP, TIER_CAPS)',
    })
  }

  // NULL bias
  if (report.nullBias.avgScoreNoData > report.nullBias.avgScoreWithData * 1.1) {
    recommendations.push({
      priority: 'P1-HIGH',
      title: 'NULL bias 보정 강화',
      detail: `데이터 없는 supports의 평균 점수(${num(report.nullBias.avgScoreNoData)})가 데이터 있는 supports(${num(report.nullBias.avgScoreWithData)})보다 높습니다. hasData 필터링이 confidence >= ${MIN_CONF}에 의존하는데, 실제로 confidence가 0.1(추출 실패)인 경우에도 hasData=false로 처리하여 해당 차원이 점수 계산에서 제외됩니다. 이로 인해 잘 추출된 supports는 불일치 차원에서 패널티를 받지만, 추출 실패한 supports는 패널티를 피합니다. scorePipeline에서 activeDims가 적은 경우 추가 패널티를 부여하세요.`,
      files: 'src/lib/matching-v4/index.ts (scorePipeline), src/lib/matching-v4/dimensions.ts (hasArr, hasRange)',
    })
  }

  // 업종 alias 커버리지
  const noMatchTypes = report.aliasAnalysis.filter(a => a.count === 0)
  if (noMatchTypes.length > 0) {
    recommendations.push({
      priority: 'P2-MEDIUM',
      title: '업종 alias 커버리지 확대',
      detail: `다음 업종이 DB에서 매칭되는 supports가 0건입니다: ${noMatchTypes.map(a => a.userType).join(', ')}. alias 매핑을 확대하거나 해당 업종의 지원사업 데이터를 추가해야 합니다.`,
      files: 'src/lib/matching-v4/scores.ts (BUSINESS_TYPE_ALIASES)',
    })
  }

  // 특정 차원의 구분력
  const allBreakdowns = report.allResults.filter(r => r.totalMatches > 0)
  if (allBreakdowns.length > 0) {
    const dimKeys = ['region', 'businessType', 'employee', 'revenue', 'businessAge', 'founderAge']
    for (const dim of dimKeys) {
      const scores = allBreakdowns.flatMap(r =>
        r.result.all.slice(0, 5).map(s => s.breakdown[dim] ?? 0)
      )
      const avgDimScore = scores.length > 0 ? scores.reduce((s, v) => s + v, 0) / scores.length : 0
      if (avgDimScore > 0.9) {
        recommendations.push({
          priority: 'P3-LOW',
          title: `차원 '${dim}' 구분력 부족 (평균 ${num(avgDimScore)})`,
          detail: `'${dim}' 차원의 평균 점수가 ${num(avgDimScore)}로 거의 모든 supports에 대해 높은 점수를 부여합니다. 이는 대부분의 supports에서 해당 필드가 NULL이거나 추출 신뢰도가 낮아 해당 차원이 점수 계산에서 제외되기 때문일 수 있습니다.`,
          files: 'src/lib/extraction/index.ts, src/lib/matching-v4/dimensions.ts',
        })
      }
    }
  }

  // hasSpecificMatch 강등 분석
  const exploratoryOnlyCount = report.allResults.filter(r => r.tailoredCount === 0 && r.recommendedCount === 0 && r.totalMatches > 0).length
  const exploratoryOnlyPct = exploratoryOnlyCount / report.allResults.filter(r => r.totalMatches > 0).length * 100
  if (exploratoryOnlyPct > 30) {
    recommendations.push({
      priority: 'P1-HIGH',
      title: `hasSpecificMatch 강등이 과도함 (${exploratoryOnlyPct.toFixed(0)}% 케이스가 전부 exploratory)`,
      detail: `전체 매칭 결과가 있는 케이스 중 ${exploratoryOnlyPct.toFixed(1)}%에서 tailored/recommended가 0건이며, 모든 결과가 exploratory로 강등되었습니다. 원인: "specific" 차원(region, businessType)에서 rawScore >= 0.8인 매칭이 없으면 tailored/recommended → exploratory로 강등됩니다. DB에서 region 데이터가 있는 supports는 ${supportAnalysis.confidenceDistribution.regions.high}개(전체의 ${(supportAnalysis.confidenceDistribution.regions.high / report.totalSupports * 100).toFixed(1)}%)에 불과합니다. 해결안: (1) hasSpecificMatch 조건을 완화하거나, (2) region/businessType 데이터 커버리지를 높이거나, (3) hasSpecificMatch 강등을 tier 1단계 감소로 변경하세요.`,
      files: 'src/lib/matching-v4/index.ts (scoreSupport L89), src/lib/matching-v4/dimensions.ts (isSpecific)',
    })
  }

  // Tier 분포 불균형
  if (report.avgTailored < 3 && report.avgExploratory > 30) {
    recommendations.push({
      priority: 'P1-HIGH',
      title: `Tier 분포 극단적 불균형 (tailored=${num(report.avgTailored)}, exploratory=${num(report.avgExploratory)})`,
      detail: `평균 tailored ${num(report.avgTailored)}건, exploratory ${num(report.avgExploratory)}건으로 대부분의 매칭이 exploratory에 집중됩니다. 사용자 관점에서 "맞춤(tailored)" 결과가 거의 없어 매칭 품질이 낮게 느껴집니다. 원인: (1) DB의 대다수 supports에서 추출 신뢰도가 낮아 활성 차원이 적고, (2) coverage factor가 점수를 낮추며, (3) hasSpecificMatch 미충족 시 exploratory로 강등됩니다. 해결안: tailored 임계값을 0.65→0.55로 낮추거나, coverage factor 바닥값을 0.1→0.3으로 올리세요.`,
      files: 'src/lib/matching-v4/index.ts (TIER_THRESHOLDS, scorePipeline coverage)',
    })
  }

  // 가중치 균형
  recommendations.push({
    priority: 'P3-LOW',
    title: '가중치 검토',
    detail: `현재 가중치: region=0.22, businessAge=0.20, businessType=0.18, employee=0.15, founderAge=0.15, revenue=0.10. region과 businessType이 "specific" 차원으로 분류되어 hasSpecificMatch 판정에 영향을 미칩니다. 이 두 차원이 모두 데이터 부족일 때 "specific match 없음" → exploratory 강등이 발생합니다.`,
    files: 'src/lib/matching-v4/dimensions.ts (BUSINESS_WEIGHTS), src/lib/matching-v4/index.ts (scoreSupport hasSpecificMatch)',
  })

  for (const rec of recommendations.sort((a, b) => a.priority.localeCompare(b.priority))) {
    ln(`### ${rec.priority}: ${rec.title}`)
    ln('')
    ln(rec.detail)
    ln('')
    ln(`**관련 파일**: \`${rec.files}\``)
    ln('')
  }

  // 10. 전체 케이스 결과 테이블 (축약)
  ln('## 10. 전체 200 케이스 결과 요약')
  ln('')
  ln('| # | 라벨 | 업종 | 지역 | 매칭총수 | tailored | recommended | exploratory | avg score | max score |')
  ln('|---|------|------|------|---------|----------|-------------|-------------|-----------|-----------|')
  for (const r of report.allResults) {
    ln(`| ${r.case.id} | ${r.case.label.slice(0, 30)} | ${r.case.input.businessType} | ${r.case.input.region} | ${r.totalMatches} | ${r.tailoredCount} | ${r.recommendedCount} | ${r.exploratoryCount} | ${num(r.avgScore)} | ${num(r.maxScore)} |`)
  }
  ln('')

  return lines.join('\n')
}

// --- 메인 ---

async function main() {
  console.log('=== 사업자 트랙 매칭 알고리즘 전수검증 시작 ===\n')

  // 1. Supports 로드
  console.log('[1/5] Supabase에서 supports 로드 중...')
  const supports = await loadSupports()
  console.log(`  => ${supports.length}개 활성 supports 로드 완료`)

  // 2. Supports 분석
  console.log('[2/5] Supports 데이터 분석 중...')
  const supportAnalysis = analyzeSupports(supports)
  console.log(`  => 사업자 대상 supports: ${supportAnalysis.totalBusiness}개`)
  console.log(`  => 서비스 타입 분포:`, JSON.stringify(supportAnalysis.serviceTypeBreakdown))

  // 3. 테스트 케이스 생성
  console.log('[3/5] 200개 테스트 케이스 생성 중...')
  const testCases = generateTestCases()
  console.log(`  => ${testCases.length}개 케이스 생성 완료`)

  // 업종 분포 확인
  const btDist: Record<string, number> = {}
  for (const tc of testCases) {
    btDist[tc.input.businessType] = (btDist[tc.input.businessType] || 0) + 1
  }
  console.log('  => 업종 분포:', JSON.stringify(btDist))

  // 지역 분포 확인
  const rgDist: Record<string, number> = {}
  for (const tc of testCases) {
    rgDist[tc.input.region] = (rgDist[tc.input.region] || 0) + 1
  }
  console.log('  => 지역 분포:', JSON.stringify(rgDist))

  // 4. 매칭 실행
  console.log('[4/5] 200개 케이스 매칭 실행 중...')
  const startTime = Date.now()
  const report = runAudit(supports, testCases)
  const duration = Date.now() - startTime
  console.log(`  => 매칭 완료 (${(duration / 1000).toFixed(1)}초)`)

  // 콘솔 요약
  console.log('\n--- 핵심 통계 ---')
  console.log(`빈 결과: ${report.emptyCount}건 (${(report.emptyPct).toFixed(1)}%)`)
  console.log(`과다 매칭 (100+): ${report.overMatchCount}건 (${(report.overMatchPct).toFixed(1)}%)`)
  console.log(`평균 매칭: ${report.avgTotal.toFixed(1)}, 중위수: ${report.medianTotal.toFixed(1)}`)
  console.log(`평균 Tier: tailored=${report.avgTailored.toFixed(1)}, recommended=${report.avgRecommended.toFixed(1)}, exploratory=${report.avgExploratory.toFixed(1)}`)
  console.log(`평균 점수: ${report.avgScore.toFixed(3)}, 중위수: ${report.medianScore.toFixed(3)}`)
  console.log(`평균 knockout: ${report.avgKnockoutPct.toFixed(1)}%`)
  console.log(`NULL bias: noData=${report.nullBias.avgScoreNoData.toFixed(3)}, withData=${report.nullBias.avgScoreWithData.toFixed(3)}`)

  // 5. 리포트 생성
  console.log('\n[5/5] 리포트 생성 중...')
  const reportText = generateReport(report, supportAnalysis)
  writeFileSync('BUSINESS_MATCHING_AUDIT.md', reportText, 'utf-8')
  console.log('  => BUSINESS_MATCHING_AUDIT.md 저장 완료')

  console.log('\n=== 검증 완료 ===')
}

main().catch(err => {
  console.error('치명적 오류:', err)
  process.exit(1)
})
