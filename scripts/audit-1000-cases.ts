/**
 * 1000-Case Audit Script
 * 500 personal + 500 business profiles -> matching quality metrics
 * Embeds matching-v4 logic directly (no @/ path alias in scripts)
 */
import { readFileSync, writeFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

// .env.local 로드
const envFile = readFileSync('.env.local', 'utf-8')
for (const l of envFile.split('\n')) {
  const t = l.trim()
  if (!t || t.startsWith('#')) continue
  const e = t.indexOf('=')
  if (e === -1) continue
  const k = t.slice(0, e).trim()
  const v = t.slice(e + 1).trim()
  if (!process.env[k]) process.env[k] = v
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// =============================================
// Embedded Types
// =============================================

type ServiceType = 'personal' | 'business' | 'both' | 'unknown'
type SupportCategory = string

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
  extractionConfidence?: Record<string, number> | null
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

interface PersonalFormData {
  ageGroup: string
  gender: string
  region: string
  householdType: string
  incomeLevel: string
  employmentStatus: string
  interestCategories: string[]
}

type UserInput =
  | ({ userType: 'personal' } & PersonalFormData)
  | ({ userType: 'business' } & DiagnoseFormData)

// =============================================
// Embedded Scores (from matching-v4/scores.ts)
// =============================================

const BUSINESS_TYPE_ALIASES: Record<string, string[]> = {
  '도매 및 소매업': ['도매업', '소매업', '도매 및 소매업'],
  '숙박 및 음식점업': ['숙박업', '음식점업', '숙박 및 음식점업'],
  '운수 및 창고업': ['운수업', '운수 및 창고업'],
  '전문, 과학 및 기술 서비스업': ['전문서비스업', '전문, 과학 및 기술 서비스업'],
  '교육 서비스업': ['교육서비스업', '교육 서비스업'],
  '보건업 및 사회복지 서비스업': ['보건업', '보건업 및 사회복지 서비스업'],
  '기타': ['기타서비스업', '기타', '예술/스포츠'],
}

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

function expandBusinessType(userType: string): string[] {
  const aliases = BUSINESS_TYPE_ALIASES[userType]
  if (aliases) return [userType, ...aliases]
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

// =============================================
// Embedded Dimensions (from matching-v4/dimensions.ts)
// =============================================

const BUSINESS_WEIGHTS = {
  region: 0.22, businessAge: 0.20, businessType: 0.18,
  employee: 0.15, founderAge: 0.15, revenue: 0.10,
} as const

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
function hasRangeCheck(min: number | null | undefined, max: number | null | undefined, conf: number): boolean {
  return (min != null || max != null) && conf >= MIN_CONF
}

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
    { key: 'employee', weight: BUSINESS_WEIGHTS.employee, isSpecific: true,
      hasData: hasRangeCheck(support.targetEmployeeMin, support.targetEmployeeMax, c?.employee ?? 0), confidence: c?.employee ?? 0,
      rawScore: support.targetEmployeeMin !== null || support.targetEmployeeMax !== null
        ? scoreRange(support.targetEmployeeMin, support.targetEmployeeMax, input.employeeCount, 10) : 0 },
    { key: 'revenue', weight: BUSINESS_WEIGHTS.revenue, isSpecific: false,
      hasData: hasRangeCheck(support.targetRevenueMin, support.targetRevenueMax, c?.revenue ?? 0), confidence: c?.revenue ?? 0,
      rawScore: support.targetRevenueMin !== null || support.targetRevenueMax !== null
        ? scoreRange(support.targetRevenueMin, support.targetRevenueMax, input.annualRevenue, 100_000_000) : 0 },
    { key: 'businessAge', weight: BUSINESS_WEIGHTS.businessAge, isSpecific: true,
      hasData: hasRangeCheck(support.targetBusinessAgeMin, support.targetBusinessAgeMax, c?.businessAge ?? 0), confidence: c?.businessAge ?? 0,
      rawScore: support.targetBusinessAgeMin !== null || support.targetBusinessAgeMax !== null
        ? scoreBusinessAge(support.targetBusinessAgeMin, support.targetBusinessAgeMax, input.businessAge) : 0 },
    { key: 'founderAge', weight: BUSINESS_WEIGHTS.founderAge, isSpecific: false,
      hasData: hasRangeCheck(support.targetFounderAgeMin, support.targetFounderAgeMax, c?.founderAge ?? 0), confidence: c?.founderAge ?? 0,
      rawScore: support.targetFounderAgeMin !== null || support.targetFounderAgeMax !== null
        ? scoreRange(support.targetFounderAgeMin, support.targetFounderAgeMax, input.founderAge, 10) : 0 },
  ]
}

function getPersonalDimensions(support: Support, input: PersonalFormData): DimensionInfo[] {
  const c = (support.extractionConfidence ?? null) as ExtractionConfidence | null
  const regions = support.targetRegions
  return [
    { key: 'region', weight: PERSONAL_WEIGHTS.region, isSpecific: true,
      hasData: hasArr(regions, c?.regions ?? 0), confidence: c?.regions ?? 0,
      rawScore: regions && regions.length > 0 ? scoreRegion(regions, input.region) : 0 },
    { key: 'age', weight: PERSONAL_WEIGHTS.age, isSpecific: true,
      hasData: hasRangeCheck(support.targetAgeMin, support.targetAgeMax, c?.age ?? 0), confidence: c?.age ?? 0,
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

function isKnockedOutBusiness(support: Support, input: DiagnoseFormData): boolean {
  const c = (support.extractionConfidence ?? null) as ExtractionConfidence | null
  const regions = support.targetRegions
  if (regions && regions.length > 0 && (c?.regions ?? 0) >= 0.5) {
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

function isKnockedOutPersonal(support: Support, input: PersonalFormData): boolean {
  const c = (support.extractionConfidence ?? null) as ExtractionConfidence | null
  const regions = support.targetRegions
  if (regions && regions.length > 0 && (c?.regions ?? 0) >= 0.5) {
    if (!regions.includes(input.region)) return true
  }
  const userAge = AGE_GROUP_TO_VALUE[input.ageGroup]
  if (userAge) {
    if (support.targetAgeMax != null && userAge > support.targetAgeMax + 5) return true
    if (support.targetAgeMin != null && userAge < support.targetAgeMin - 5) return true
  }
  const hTypes = support.targetHouseholdTypes
  if (hTypes && hTypes.length > 0 && (c?.householdTypes ?? 0) >= 0.5) {
    if (!hTypes.includes(input.householdType)) return true
  }
  const iLevels = support.targetIncomeLevels
  if (iLevels && iLevels.length > 0 && (c?.incomeLevels ?? 0) >= 0.5) {
    const userIdx = INCOME_ORDER.indexOf(input.incomeLevel)
    const maxTargetIdx = Math.max(...iLevels.map(l => INCOME_ORDER.indexOf(l)).filter(i => i !== -1))
    if (userIdx !== -1 && maxTargetIdx !== -1 && userIdx > maxTargetIdx + 1) return true
  }
  const eStatus = support.targetEmploymentStatus
  if (eStatus && eStatus.length > 0 && (c?.employmentStatus ?? 0) >= 0.5) {
    if (!eStatus.includes(input.employmentStatus)) return true
  }
  return false
}

// =============================================
// Embedded Pipeline (from matching-v4/index.ts)
// =============================================

type MatchTierV4 = 'tailored' | 'recommended' | 'exploratory'

interface ScoredSupportV4 {
  support: Support
  score: number
  tier: MatchTierV4
  breakdown: Record<string, number>
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
  if (specificDims.length === 0 && activeDims.length < 2) return null
  // 1개라도 특정 차원이 있으면 진입 허용 (coverage 확대)

  const totalActiveWeight = activeDims.reduce((sum, d) => sum + d.weight, 0)
  // 신뢰도 가중: 저신뢰(< 0.6) 차원만 0.5 기본값 쪽으로 끌어당김
  const matchScore = activeDims.reduce((sum, d) => {
    const effective = d.confidence < 0.6
      ? d.rawScore * d.confidence + 0.5 * (1 - d.confidence)
      : d.rawScore
    return sum + effective * d.weight
  }, 0) / totalActiveWeight
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

function scoreSupport(
  support: Support, dims: DimensionInfo[], interestBonus: boolean,
): ScoredSupportV4 | null {
  const result = scorePipeline(dims, interestBonus)
  if (!result) return null
  let tier = getTierV4(result.finalScore)
  if (!tier) return null
  // 특정 차원에서 높은 점수(0.8+)가 없으면 tailored 진입을 더 엄격하게
  if (!result.hasSpecificMatch && tier === 'tailored' && result.finalScore < 0.60) tier = 'recommended'

  const breakdown: Record<string, number> = {}
  for (const d of dims) {
    breakdown[d.key] = d.hasData ? Math.round(d.rawScore * 1000) / 1000 : 0
  }

  return {
    support, tier,
    score: Math.round(result.finalScore * 1000) / 1000,
    breakdown,
  }
}

function matchSupportsV4(supports: Support[], userInput: UserInput): MatchResultV4 {
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

// =============================================
// DB -> Support mapper (from supabase/mappers.ts)
// =============================================

function mapSupportRow(row: Record<string, unknown>): Support {
  return {
    id: row.id as string,
    title: row.title as string,
    organization: row.organization as string,
    category: row.category as SupportCategory,
    startDate: row.start_date as string | null,
    endDate: row.end_date as string | null,
    detailUrl: row.detail_url as string,
    targetRegions: row.target_regions as string[] | null,
    targetBusinessTypes: row.target_business_types as string[] | null,
    targetEmployeeMin: row.target_employee_min as number | null,
    targetEmployeeMax: row.target_employee_max as number | null,
    targetRevenueMin: row.target_revenue_min as number | null,
    targetRevenueMax: row.target_revenue_max as number | null,
    targetBusinessAgeMin: row.target_business_age_min as number | null,
    targetBusinessAgeMax: row.target_business_age_max as number | null,
    targetFounderAgeMin: row.target_founder_age_min as number | null,
    targetFounderAgeMax: row.target_founder_age_max as number | null,
    amount: row.amount as string | null,
    isActive: row.is_active as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    source: row.source as string | undefined,
    extractionConfidence: row.extraction_confidence as Record<string, number> | null,
    serviceType: (row.service_type as ServiceType) ?? 'unknown',
    targetAgeMin: row.target_age_min as number | null,
    targetAgeMax: row.target_age_max as number | null,
    targetHouseholdTypes: row.target_household_types as string[] | null,
    targetIncomeLevels: row.target_income_levels as string[] | null,
    targetEmploymentStatus: row.target_employment_status as string[] | null,
    benefitCategories: row.benefit_categories as string[] | null,
  }
}

// =============================================
// Constants for profile generation
// =============================================

const REGIONS = ['서울','부산','대구','인천','광주','대전','울산','세종','경기','강원','충북','충남','전북','전남','경북','경남','제주']
const BUSINESS_TYPES = ['음식점업','소매업','도매업','제조업','건설업','운수업','숙박업','정보통신업','전문서비스업','교육서비스업','보건업','예술/스포츠','기타서비스업']
const EMPLOYEE_VALUES = [2, 7, 30, 75, 150]
const REVENUE_VALUES = [50_000_000, 300_000_000, 750_000_000, 3_000_000_000, 10_000_000_000]
const BUSINESS_AGE_VALUES = [-1, 6, 24, 48, 84, 180]
const FOUNDER_AGE_VALUES = [25, 35, 45, 55, 65]
const AGE_GROUP_VALUES = ['10대', '20대', '30대', '40대', '50대', '60대이상']
const GENDER_VALUES = ['남성', '여성']
const HOUSEHOLD_VALUES = ['1인', '신혼부부', '영유아', '다자녀', '한부모', '일반']
const INCOME_VALUES = ['기초생활', '차상위', '중위50이하', '중위100이하', '중위100초과']
const EMPLOYMENT_VALUES = ['재직자', '구직자', '학생', '자영업', '무직', '은퇴']
const INTEREST_VALUES = ['주거', '육아', '교육', '취업', '건강', '생활', '문화']

// 결정론적 난수 (시드 기반)
class SeededRandom {
  private seed: number
  constructor(seed: number) { this.seed = seed }
  next(): number {
    this.seed = (this.seed * 16807 + 0) % 2147483647
    return (this.seed - 1) / 2147483646
  }
  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)]
  }
  pickN<T>(arr: readonly T[], n: number): T[] {
    const shuffled = [...arr].sort(() => this.next() - 0.5)
    return shuffled.slice(0, n)
  }
}

function generatePersonalProfiles(rng: SeededRandom, count: number): (PersonalFormData & { userType: 'personal' })[] {
  const profiles: (PersonalFormData & { userType: 'personal' })[] = []
  for (let i = 0; i < count; i++) {
    const numInterests = Math.floor(rng.next() * 3) + 1
    profiles.push({
      userType: 'personal',
      ageGroup: rng.pick(AGE_GROUP_VALUES),
      gender: rng.pick(GENDER_VALUES),
      region: rng.pick(REGIONS),
      householdType: rng.pick(HOUSEHOLD_VALUES),
      incomeLevel: rng.pick(INCOME_VALUES),
      employmentStatus: rng.pick(EMPLOYMENT_VALUES),
      interestCategories: rng.pickN(INTEREST_VALUES, numInterests),
    })
  }
  return profiles
}

function generateBusinessProfiles(rng: SeededRandom, count: number): (DiagnoseFormData & { userType: 'business' })[] {
  const profiles: (DiagnoseFormData & { userType: 'business' })[] = []
  for (let i = 0; i < count; i++) {
    profiles.push({
      userType: 'business',
      businessType: rng.pick(BUSINESS_TYPES),
      region: rng.pick(REGIONS),
      employeeCount: rng.pick(EMPLOYEE_VALUES),
      annualRevenue: rng.pick(REVENUE_VALUES),
      businessAge: rng.pick(BUSINESS_AGE_VALUES),
      founderAge: rng.pick(FOUNDER_AGE_VALUES),
    })
  }
  return profiles
}

// =============================================
// Main Audit
// =============================================

interface CaseResult {
  profileIndex: number
  userType: 'personal' | 'business'
  region: string
  totalMatched: number
  tailoredCount: number
  recommendedCount: number
  exploratoryCount: number
  topScore: number
  avgScore: number
  knockedOut: number
  filteredByServiceType: number
  regionMismatchCount: number
  serviceTypeMismatchCount: number
  matchedIds: Set<string>
}

async function main() {
  console.log('=== 1000-Case Matching Audit ===\n')

  // 1. Load all supports
  console.log('Loading supports from DB...')
  const PAGE_SIZE = 1000
  const allRows: Record<string, unknown>[] = []
  let from = 0

  while (true) {
    const { data, error } = await supabase
      .from('supports')
      .select('*')
      .eq('is_active', true)
      .range(from, from + PAGE_SIZE - 1)
    if (error) throw error
    if (!data || data.length === 0) break
    allRows.push(...data)
    if (data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  const supports = allRows.map(mapSupportRow)
  console.log(`Loaded ${supports.length} active supports\n`)

  // 2. Generate profiles
  const rng = new SeededRandom(42)
  const personalProfiles = generatePersonalProfiles(rng, 500)
  const businessProfiles = generateBusinessProfiles(rng, 500)
  const allProfiles: UserInput[] = [...personalProfiles, ...businessProfiles]

  console.log(`Generated ${personalProfiles.length} personal + ${businessProfiles.length} business = ${allProfiles.length} profiles\n`)

  // 3. Run matching for each profile
  const results: CaseResult[] = []
  const supportMatchCount = new Map<string, number>()

  for (let i = 0; i < allProfiles.length; i++) {
    const profile = allProfiles[i]
    const matchResult = matchSupportsV4(supports, profile)

    // FP 분석: 지역 불일치
    let regionMismatchCount = 0
    for (const scored of matchResult.all) {
      const sRegions = scored.support.targetRegions
      if (sRegions && sRegions.length > 0 && !sRegions.includes(profile.region)) {
        regionMismatchCount++
      }
    }

    // FP 분석: 서비스 타입 불일치 (이미 필터됨. 결과에는 없어야 하지만 확인)
    let serviceTypeMismatchCount = 0
    for (const scored of matchResult.all) {
      const st = scored.support.serviceType ?? 'unknown'
      if (st !== 'both' && st !== 'unknown' && st !== profile.userType) {
        serviceTypeMismatchCount++
      }
    }

    const scores = matchResult.all.map(s => s.score)
    const topScore = scores.length > 0 ? Math.max(...scores) : 0
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0

    // 커버리지 추적
    for (const scored of matchResult.all) {
      supportMatchCount.set(scored.support.id, (supportMatchCount.get(scored.support.id) || 0) + 1)
    }

    const matchedIds = new Set(matchResult.all.map(s => s.support.id))

    results.push({
      profileIndex: i,
      userType: profile.userType,
      region: profile.region,
      totalMatched: matchResult.totalCount,
      tailoredCount: matchResult.tailored.length,
      recommendedCount: matchResult.recommended.length,
      exploratoryCount: matchResult.exploratory.length,
      topScore,
      avgScore: Math.round(avgScore * 1000) / 1000,
      knockedOut: matchResult.knockedOut,
      filteredByServiceType: matchResult.filteredByServiceType,
      regionMismatchCount,
      serviceTypeMismatchCount,
      matchedIds,
    })

    if ((i + 1) % 200 === 0) {
      console.log(`  Processed ${i + 1}/${allProfiles.length}`)
    }
  }

  console.log(`  Processed ${allProfiles.length}/${allProfiles.length}\n`)

  // 4. Calculate metrics
  const personalResults = results.filter(r => r.userType === 'personal')
  const businessResults = results.filter(r => r.userType === 'business')

  const zeroResultCount = results.filter(r => r.totalMatched === 0).length
  const zeroResultRate = zeroResultCount / results.length

  const personalZeroCount = personalResults.filter(r => r.totalMatched === 0).length
  const businessZeroCount = businessResults.filter(r => r.totalMatched === 0).length

  const avgPersonalTailored = personalResults.reduce((s, r) => s + r.tailoredCount, 0) / personalResults.length
  const avgPersonalRecommended = personalResults.reduce((s, r) => s + r.recommendedCount, 0) / personalResults.length
  const avgPersonalExploratory = personalResults.reduce((s, r) => s + r.exploratoryCount, 0) / personalResults.length
  const avgPersonalTotal = personalResults.reduce((s, r) => s + r.totalMatched, 0) / personalResults.length

  const avgBusinessTailored = businessResults.reduce((s, r) => s + r.tailoredCount, 0) / businessResults.length
  const avgBusinessRecommended = businessResults.reduce((s, r) => s + r.recommendedCount, 0) / businessResults.length
  const avgBusinessExploratory = businessResults.reduce((s, r) => s + r.exploratoryCount, 0) / businessResults.length
  const avgBusinessTotal = businessResults.reduce((s, r) => s + r.totalMatched, 0) / businessResults.length

  const avgTopScore = results.reduce((s, r) => s + r.topScore, 0) / results.length
  const avgAvgScore = results.reduce((s, r) => s + r.avgScore, 0) / results.length

  // Region mismatch FP
  const totalRegionFP = results.reduce((s, r) => s + r.regionMismatchCount, 0)
  const totalResults = results.reduce((s, r) => s + r.totalMatched, 0)
  const regionFPRate = totalResults > 0 ? totalRegionFP / totalResults : 0

  // Service type mismatch FP
  const totalSTFP = results.reduce((s, r) => s + r.serviceTypeMismatchCount, 0)
  const stFPRate = totalResults > 0 ? totalSTFP / totalResults : 0

  // Differentiation: Jaccard distance (1 - IoU) 기반 정확한 계산
  let differentiationSamples = 0
  let totalJaccardDistance = 0
  const regionGroups = new Map<string, number[]>()
  for (let i = 0; i < results.length; i++) {
    const region = results[i].region
    if (!regionGroups.has(region)) regionGroups.set(region, [])
    regionGroups.get(region)!.push(i)
  }
  for (const [, indices] of regionGroups) {
    if (indices.length < 2) continue
    // 같은 userType끼리만 비교
    const personalIdx = indices.filter(i => results[i].userType === 'personal')
    const businessIdx = indices.filter(i => results[i].userType === 'business')
    for (const groupIndices of [personalIdx, businessIdx]) {
      for (let a = 0; a < Math.min(groupIndices.length, 5); a++) {
        for (let b = a + 1; b < Math.min(groupIndices.length, 5); b++) {
          differentiationSamples++
          const setA = results[groupIndices[a]].matchedIds
          const setB = results[groupIndices[b]].matchedIds
          if (setA.size === 0 && setB.size === 0) { totalJaccardDistance += 1; continue }
          let intersection = 0
          for (const id of setA) { if (setB.has(id)) intersection++ }
          const union = setA.size + setB.size - intersection
          const jaccardDistance = union > 0 ? 1 - intersection / union : 1
          totalJaccardDistance += jaccardDistance
        }
      }
    }
  }
  const avgDifferentiation = differentiationSamples > 0 ? totalJaccardDistance / differentiationSamples : 1

  // Coverage: 전체 지원사업 중 1번 이상 추천된 비율
  const coveredSupports = supportMatchCount.size
  const coverageRate = coveredSupports / supports.length

  // =============================================
  // Output Report
  // =============================================

  console.log('=== AUDIT RESULTS ===\n')

  console.log('1. Zero-Result Rate')
  console.log(`   Total:    ${zeroResultCount}/${results.length} = ${(zeroResultRate * 100).toFixed(1)}% (target < 1%)`)
  console.log(`   Personal: ${personalZeroCount}/${personalResults.length} = ${(personalZeroCount / personalResults.length * 100).toFixed(1)}%`)
  console.log(`   Business: ${businessZeroCount}/${businessResults.length} = ${(businessZeroCount / businessResults.length * 100).toFixed(1)}%`)

  console.log('\n2. Tier Distribution (average per profile)')
  console.log(`   Personal - Tailored: ${avgPersonalTailored.toFixed(1)} | Recommended: ${avgPersonalRecommended.toFixed(1)} | Exploratory: ${avgPersonalExploratory.toFixed(1)} | Total: ${avgPersonalTotal.toFixed(1)}`)
  console.log(`   Business - Tailored: ${avgBusinessTailored.toFixed(1)} | Recommended: ${avgBusinessRecommended.toFixed(1)} | Exploratory: ${avgBusinessExploratory.toFixed(1)} | Total: ${avgBusinessTotal.toFixed(1)}`)

  console.log('\n3. Score Distribution')
  console.log(`   Average Top Score: ${avgTopScore.toFixed(3)}`)
  console.log(`   Average Avg Score: ${avgAvgScore.toFixed(3)}`)

  console.log('\n4. Region Accuracy (FP: region mismatch in results)')
  console.log(`   Region FP: ${totalRegionFP}/${totalResults} = ${(regionFPRate * 100).toFixed(2)}% (target < 1%)`)

  console.log('\n5. Service Type Accuracy')
  console.log(`   Service Type FP: ${totalSTFP}/${totalResults} = ${(stFPRate * 100).toFixed(2)}% (target < 1%)`)

  console.log('\n6. Differentiation')
  console.log(`   Estimated differentiation: ${(avgDifferentiation * 100).toFixed(1)}% (target > 70%)`)
  console.log(`   (${differentiationSamples} pairs compared)`)

  console.log('\n7. Coverage')
  console.log(`   Supports matched at least once: ${coveredSupports}/${supports.length} = ${(coverageRate * 100).toFixed(1)}% (target > 30%)`)

  console.log('\n8. FP Indicators')
  console.log(`   Region mismatch total: ${totalRegionFP}`)
  console.log(`   Service type mismatch total: ${totalSTFP}`)

  // Grade each metric
  const grade = (val: number, good: number, ok: number, direction: 'lower' | 'higher'): string => {
    if (direction === 'lower') {
      if (val <= good) return 'A'
      if (val <= ok) return 'B'
      if (val <= ok * 2) return 'C'
      return 'F'
    }
    if (val >= good) return 'A'
    if (val >= ok) return 'B'
    if (val >= ok * 0.5) return 'C'
    return 'F'
  }

  console.log('\n=== GRADE SUMMARY ===')
  console.log(`   Zero-Result Rate:      ${grade(zeroResultRate, 0.01, 0.05, 'lower')} (${(zeroResultRate * 100).toFixed(1)}%)`)
  console.log(`   Region FP Rate:        ${grade(regionFPRate, 0.01, 0.05, 'lower')} (${(regionFPRate * 100).toFixed(2)}%)`)
  console.log(`   Service Type FP Rate:  ${grade(stFPRate, 0.01, 0.05, 'lower')} (${(stFPRate * 100).toFixed(2)}%)`)
  console.log(`   Personal Tailored:     ${grade(avgPersonalTailored, 5, 3, 'higher')} (avg ${avgPersonalTailored.toFixed(1)})`)
  console.log(`   Business Tailored:     ${grade(avgBusinessTailored, 5, 3, 'higher')} (avg ${avgBusinessTailored.toFixed(1)})`)
  console.log(`   Differentiation:       ${grade(avgDifferentiation, 0.7, 0.5, 'higher')} (${(avgDifferentiation * 100).toFixed(1)}%)`)
  console.log(`   Coverage:              ${grade(coverageRate, 0.3, 0.15, 'higher')} (${(coverageRate * 100).toFixed(1)}%)`)

  // Save full results
  const outputData = {
    meta: {
      timestamp: new Date().toISOString(),
      totalSupports: supports.length,
      totalProfiles: allProfiles.length,
      personalProfiles: personalProfiles.length,
      businessProfiles: businessProfiles.length,
    },
    metrics: {
      zeroResultRate,
      zeroResultCount,
      personalZeroCount,
      businessZeroCount,
      avgPersonalTailored,
      avgPersonalRecommended,
      avgPersonalExploratory,
      avgPersonalTotal,
      avgBusinessTailored,
      avgBusinessRecommended,
      avgBusinessExploratory,
      avgBusinessTotal,
      avgTopScore,
      avgAvgScore,
      regionFPRate,
      totalRegionFP,
      stFPRate,
      totalSTFP,
      avgDifferentiation,
      coverageRate,
      coveredSupports,
    },
    results: results.map((r, i) => {
      const { matchedIds, ...rest } = r
      return {
        ...rest,
        matchedIdCount: matchedIds.size,
        profile: i < 500
          ? { ...personalProfiles[i], interestCategories: personalProfiles[i].interestCategories }
          : businessProfiles[i - 500],
      }
    }),
  }

  writeFileSync('scripts/audit-1000-results.json', JSON.stringify(outputData, null, 2))
  console.log('\nFull results saved to scripts/audit-1000-results.json')
}

main().catch(console.error)
