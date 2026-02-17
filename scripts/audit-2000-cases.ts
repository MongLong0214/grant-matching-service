/**
 * 2000-Case Matching Quality Audit (v2)
 * 1000 personal + 1000 business profiles -> per-case PASS/WARN/FAIL verdict
 *
 * FAIL criteria (strict):
 * 1. totalMatches === 0 -> FAIL
 * 2. regionFalsePositives > 0 in tailored tier -> FAIL
 * 3. personal case with tailored containing business-only serviceType -> FAIL
 * 4. business case with tailored containing personal-only serviceType -> FAIL
 * 5. age range mismatch in tailored -> WARN
 *
 * WARN criteria:
 * 1. tailoredCount < 3
 * 2. top 5 all in "other" category
 *
 * Run: npx tsx scripts/audit-2000-cases.ts
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

  const totalActiveWeight = activeDims.reduce((sum, d) => sum + d.weight, 0)
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
// DB -> Support mapper
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
// Constants for profile generation (user spec values)
// =============================================

const REGIONS = ['서울','부산','대구','인천','광주','대전','울산','세종','경기','강원','충북','충남','전북','전남','경북','경남','제주']
const BUSINESS_TYPES = ['음식점업','소매업','도매업','제조업','건설업','운수업','숙박업','정보통신업','전문서비스업','교육서비스업','보건업','예술/스포츠','기타서비스업']
const EMPLOYEE_VALUES = [0, 1, 3, 5, 7, 10, 20, 50, 100, 300]
const REVENUE_VALUES = [0, 50_000_000, 100_000_000, 300_000_000, 500_000_000, 1_000_000_000, 3_000_000_000, 5_000_000_000]
const BUSINESS_AGE_VALUES = [0, 1, 2, 3, 5, 7, 10, 15, 20]  // 년 -> 월 변환
const FOUNDER_AGE_VALUES = [20, 25, 28, 30, 35, 40, 45, 50, 55, 60]
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
  intRange(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min
  }
}

// 균등 샘플링: 모든 지역/연령대가 충분히 포함되도록 라운드로빈 + 랜덤 채움
function generatePersonalProfiles(rng: SeededRandom, count: number): (PersonalFormData & { userType: 'personal' })[] {
  const profiles: (PersonalFormData & { userType: 'personal' })[] = []

  // 모든 지역 x 모든 연령대 조합 = 102개 보장 (라운드로빈)
  for (const region of REGIONS) {
    for (const ageGroup of AGE_GROUP_VALUES) {
      const numInterests = rng.intRange(1, 3)
      profiles.push({
        userType: 'personal',
        ageGroup,
        gender: rng.pick(GENDER_VALUES),
        region,
        householdType: rng.pick(HOUSEHOLD_VALUES),
        incomeLevel: rng.pick(INCOME_VALUES),
        employmentStatus: rng.pick(EMPLOYMENT_VALUES),
        interestCategories: rng.pickN(INTEREST_VALUES, numInterests),
      })
    }
  }

  // 나머지 랜덤 채움 (898개)
  while (profiles.length < count) {
    const numInterests = rng.intRange(1, 3)
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

  return profiles.slice(0, count)
}

function generateBusinessProfiles(rng: SeededRandom, count: number): (DiagnoseFormData & { userType: 'business' })[] {
  const profiles: (DiagnoseFormData & { userType: 'business' })[] = []

  // 모든 지역 x 모든 업종 조합 = 221개 보장
  for (const region of REGIONS) {
    for (const businessType of BUSINESS_TYPES) {
      profiles.push({
        userType: 'business',
        businessType,
        region,
        employeeCount: rng.pick(EMPLOYEE_VALUES),
        annualRevenue: rng.pick(REVENUE_VALUES),
        businessAge: rng.pick(BUSINESS_AGE_VALUES) * 12, // 년 -> 월
        founderAge: rng.pick(FOUNDER_AGE_VALUES),
      })
    }
  }

  // 나머지 랜덤 채움 (779개)
  while (profiles.length < count) {
    profiles.push({
      userType: 'business',
      businessType: rng.pick(BUSINESS_TYPES),
      region: rng.pick(REGIONS),
      employeeCount: rng.pick(EMPLOYEE_VALUES),
      annualRevenue: rng.pick(REVENUE_VALUES),
      businessAge: rng.pick(BUSINESS_AGE_VALUES) * 12,
      founderAge: rng.pick(FOUNDER_AGE_VALUES),
    })
  }

  return profiles.slice(0, count)
}

// =============================================
// Per-case Audit Result
// =============================================

type Verdict = 'PASS' | 'WARN' | 'FAIL'

interface AuditResult {
  caseId: number
  userType: 'personal' | 'business'
  input: Record<string, unknown>
  totalMatches: number
  tailoredCount: number
  recommendedCount: number
  exploratoryCount: number

  checks: {
    hasResults: boolean
    regionAccuracy: boolean
    regionFalsePositives: number
    regionFPDetails: { title: string; regions: string[] }[]
    trackSeparation: boolean
    trackFPDetails: { title: string; serviceType: string }[]
    ageRelevance: boolean
    ageFPCount: number
    ageFPDetails: { title: string; ageMin: number | null; ageMax: number | null }[]
    topRelevance: string[]
  }

  verdict: Verdict
  failReasons: string[]
  warnReasons: string[]
}

// =============================================
// Main Audit
// =============================================

async function main() {
  console.log('=== 2000-CASE MATCHING AUDIT REPORT ===')
  console.log(`Date: ${new Date().toISOString()}`)
  console.log()

  // 1. Load all supports
  console.log('[1/4] Loading supports from DB...')
  const PAGE_SIZE = 1000
  const allRows: Record<string, unknown>[] = []
  let from = 0
  const today = new Date().toISOString().split('T')[0]

  while (true) {
    const { data, error } = await supabase
      .from('supports')
      .select('*')
      .eq('is_active', true)
      .or(`end_date.is.null,end_date.gte.${today}`)
      .range(from, from + PAGE_SIZE - 1)
    if (error) throw error
    if (!data || data.length === 0) break
    allRows.push(...data)
    if (data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  const supports = allRows.map(mapSupportRow)
  console.log(`  Loaded ${supports.length} active supports`)

  const stBreakdown = {
    personal: supports.filter(s => s.serviceType === 'personal').length,
    business: supports.filter(s => s.serviceType === 'business').length,
    both: supports.filter(s => s.serviceType === 'both').length,
    unknown: supports.filter(s => !s.serviceType || s.serviceType === 'unknown').length,
  }
  console.log(`  Service types: personal=${stBreakdown.personal}, business=${stBreakdown.business}, both=${stBreakdown.both}, unknown=${stBreakdown.unknown}`)
  console.log()

  // 2. Generate profiles
  console.log('[2/4] Generating 2000 profiles (stratified sampling)...')
  const rng = new SeededRandom(42)
  const personalProfiles = generatePersonalProfiles(rng, 1000)
  const businessProfiles = generateBusinessProfiles(rng, 1000)

  // 분포 검증
  const pRegionDist = new Map<string, number>()
  const pAgeDist = new Map<string, number>()
  for (const p of personalProfiles) {
    pRegionDist.set(p.region, (pRegionDist.get(p.region) ?? 0) + 1)
    pAgeDist.set(p.ageGroup, (pAgeDist.get(p.ageGroup) ?? 0) + 1)
  }
  const bRegionDist = new Map<string, number>()
  const bTypeDist = new Map<string, number>()
  for (const p of businessProfiles) {
    bRegionDist.set(p.region, (bRegionDist.get(p.region) ?? 0) + 1)
    bTypeDist.set(p.businessType, (bTypeDist.get(p.businessType) ?? 0) + 1)
  }
  console.log(`  Personal: ${personalProfiles.length} cases`)
  console.log(`    Regions: min=${Math.min(...pRegionDist.values())}, max=${Math.max(...pRegionDist.values())}`)
  console.log(`    Age groups: min=${Math.min(...pAgeDist.values())}, max=${Math.max(...pAgeDist.values())}`)
  console.log(`  Business: ${businessProfiles.length} cases`)
  console.log(`    Regions: min=${Math.min(...bRegionDist.values())}, max=${Math.max(...bRegionDist.values())}`)
  console.log(`    Business types: min=${Math.min(...bTypeDist.values())}, max=${Math.max(...bTypeDist.values())}`)
  console.log()

  // 3. Run matching + per-case audit
  console.log('[3/4] Running matching for all 2000 profiles...')
  const auditResults: AuditResult[] = []
  const allProfiles: UserInput[] = [...personalProfiles, ...businessProfiles]

  for (let i = 0; i < allProfiles.length; i++) {
    const profile = allProfiles[i]
    const matchResult = matchSupportsV4(supports, profile)

    const failReasons: string[] = []
    const warnReasons: string[] = []

    // CHECK 1: hasResults
    const hasResults = matchResult.totalCount > 0
    if (!hasResults) {
      failReasons.push('totalMatches === 0')
    }

    // CHECK 2: regionFalsePositives in tailored tier
    const regionFPDetails: { title: string; regions: string[] }[] = []
    for (const scored of matchResult.tailored) {
      const sRegions = scored.support.targetRegions
      if (sRegions && sRegions.length > 0 && !sRegions.includes(profile.region)) {
        regionFPDetails.push({ title: scored.support.title, regions: sRegions })
      }
    }
    const regionAccuracy = regionFPDetails.length === 0
    if (!regionAccuracy) {
      failReasons.push(`regionFalsePositives=${regionFPDetails.length} in tailored tier`)
    }

    // CHECK 3: trackSeparation in tailored tier
    const trackFPDetails: { title: string; serviceType: string }[] = []
    for (const scored of matchResult.tailored) {
      const st = scored.support.serviceType ?? 'unknown'
      if (st !== 'both' && st !== 'unknown' && st !== profile.userType) {
        trackFPDetails.push({ title: scored.support.title, serviceType: st })
      }
    }
    const trackSeparation = trackFPDetails.length === 0
    if (!trackSeparation) {
      failReasons.push(`track separation failure: ${profile.userType} case has ${trackFPDetails.length} wrong-track supports in tailored`)
    }

    // CHECK 4: ageRelevance in tailored tier
    const ageFPDetails: { title: string; ageMin: number | null; ageMax: number | null }[] = []
    if (profile.userType === 'personal') {
      const userAge = AGE_GROUP_TO_VALUE[profile.ageGroup]
      if (userAge) {
        for (const scored of matchResult.tailored) {
          const s = scored.support
          // 엄격: targetAgeMin/Max가 있고 유저 연령이 완전히 범위 밖
          if (s.targetAgeMin != null && s.targetAgeMax != null) {
            if (userAge < s.targetAgeMin - 5 || userAge > s.targetAgeMax + 5) {
              ageFPDetails.push({ title: s.title, ageMin: s.targetAgeMin, ageMax: s.targetAgeMax })
            }
          } else if (s.targetAgeMax != null && userAge > s.targetAgeMax + 10) {
            ageFPDetails.push({ title: s.title, ageMin: s.targetAgeMin ?? null, ageMax: s.targetAgeMax })
          } else if (s.targetAgeMin != null && userAge < s.targetAgeMin - 10) {
            ageFPDetails.push({ title: s.title, ageMin: s.targetAgeMin, ageMax: s.targetAgeMax ?? null })
          }
        }
      }
    } else {
      // 사업자: founderAge 검증
      for (const scored of matchResult.tailored) {
        const s = scored.support
        if (s.targetFounderAgeMin != null && s.targetFounderAgeMax != null) {
          if (profile.founderAge < s.targetFounderAgeMin - 5 || profile.founderAge > s.targetFounderAgeMax + 5) {
            ageFPDetails.push({ title: s.title, ageMin: s.targetFounderAgeMin, ageMax: s.targetFounderAgeMax })
          }
        }
      }
    }
    const ageRelevance = ageFPDetails.length === 0
    if (!ageRelevance) {
      warnReasons.push(`age mismatch: ${ageFPDetails.length} supports in tailored with incompatible age range`)
    }

    // WARN: tailoredCount < 3
    if (matchResult.tailored.length < 3 && hasResults) {
      warnReasons.push(`tailoredCount=${matchResult.tailored.length} (< 3)`)
    }

    // top 5 titles
    const top5 = matchResult.all.slice(0, 5).map(s => s.support.title)

    // WARN: top 5 all "기타" category
    if (top5.length > 0) {
      const allOther = matchResult.all.slice(0, 5).every(s => s.support.category === '기타')
      if (allOther) {
        warnReasons.push('top 5 all in "기타" category')
      }
    }

    // Determine verdict
    let verdict: Verdict = 'PASS'
    if (failReasons.length > 0) verdict = 'FAIL'
    else if (warnReasons.length > 0) verdict = 'WARN'

    const inputRecord: Record<string, unknown> = { ...profile }

    auditResults.push({
      caseId: i + 1,
      userType: profile.userType,
      input: inputRecord,
      totalMatches: matchResult.totalCount,
      tailoredCount: matchResult.tailored.length,
      recommendedCount: matchResult.recommended.length,
      exploratoryCount: matchResult.exploratory.length,
      checks: {
        hasResults,
        regionAccuracy,
        regionFalsePositives: regionFPDetails.length,
        regionFPDetails,
        trackSeparation,
        trackFPDetails,
        ageRelevance,
        ageFPCount: ageFPDetails.length,
        ageFPDetails,
        topRelevance: top5,
      },
      verdict,
      failReasons,
      warnReasons,
    })

    if ((i + 1) % 500 === 0) {
      console.log(`  Processed ${i + 1}/${allProfiles.length}`)
    }
  }
  console.log(`  Processed ${allProfiles.length}/${allProfiles.length}`)
  console.log()

  // 4. Report
  console.log('[4/4] Generating report...')
  console.log()

  const personalResults = auditResults.filter(r => r.userType === 'personal')
  const businessResults = auditResults.filter(r => r.userType === 'business')

  function printTrackReport(label: string, results: AuditResult[]) {
    const pass = results.filter(r => r.verdict === 'PASS').length
    const warn = results.filter(r => r.verdict === 'WARN').length
    const fail = results.filter(r => r.verdict === 'FAIL').length
    const total = results.length

    const regionOk = results.filter(r => r.checks.regionAccuracy).length
    const trackOk = results.filter(r => r.checks.trackSeparation).length
    const ageOk = results.filter(r => r.checks.ageRelevance).length

    const totalMatches = results.map(r => r.totalMatches)
    const tailoredCounts = results.map(r => r.tailoredCount)

    const minMatch = Math.min(...totalMatches)
    const maxMatch = Math.max(...totalMatches)
    const avgMatch = totalMatches.reduce((a, b) => a + b, 0) / totalMatches.length
    const minTailored = Math.min(...tailoredCounts)
    const maxTailored = Math.max(...tailoredCounts)
    const avgTailored = tailoredCounts.reduce((a, b) => a + b, 0) / tailoredCounts.length

    console.log(`[${label}: ${total} cases]`)
    console.log(`- PASS: ${pass} cases (${(pass / total * 100).toFixed(1)}%)`)
    console.log(`- WARN: ${warn} cases (${(warn / total * 100).toFixed(1)}%)`)
    console.log(`- FAIL: ${fail} cases (${(fail / total * 100).toFixed(1)}%)`)
    console.log()
    console.log(`Region accuracy: ${regionOk}/${total} (${(regionOk / total * 100).toFixed(1)}%)`)
    console.log(`Track separation: ${trackOk}/${total} (${(trackOk / total * 100).toFixed(1)}%)`)
    console.log(`Age relevance: ${ageOk}/${total} (${(ageOk / total * 100).toFixed(1)}%)`)
    console.log(`Min matches: ${minMatch}, Max: ${maxMatch}, Avg: ${avgMatch.toFixed(1)}`)
    console.log(`Min tailored: ${minTailored}, Max: ${maxTailored}, Avg: ${avgTailored.toFixed(1)}`)
    console.log()

    // Region breakdown
    console.log('Region breakdown:')
    const regionBuckets = new Map<string, { total: number; pass: number; fail: number; warn: number }>()
    for (const r of results) {
      const region = r.input.region as string
      if (!regionBuckets.has(region)) regionBuckets.set(region, { total: 0, pass: 0, fail: 0, warn: 0 })
      const bucket = regionBuckets.get(region)!
      bucket.total++
      if (r.verdict === 'PASS') bucket.pass++
      else if (r.verdict === 'FAIL') bucket.fail++
      else bucket.warn++
    }
    for (const region of REGIONS) {
      const b = regionBuckets.get(region)
      if (b) {
        console.log(`  ${region.padEnd(4)}: ${String(b.total).padStart(4)} cases, ${String(b.pass).padStart(4)} PASS, ${String(b.warn).padStart(3)} WARN, ${String(b.fail).padStart(3)} FAIL`)
      }
    }
    console.log()
  }

  printTrackReport('PERSONAL TRACK', personalResults)
  printTrackReport('BUSINESS TRACK', businessResults)

  // FAIL DETAILS
  const failCases = auditResults.filter(r => r.verdict === 'FAIL')
  console.log(`[FAIL DETAILS] (${failCases.length} cases)`)
  for (const fc of failCases) {
    const region = fc.input.region as string
    console.log(`Case #${fc.caseId}: FAIL - ${fc.userType} - ${fc.failReasons.join('; ')}`)

    // 간결한 입력 요약
    if (fc.userType === 'personal') {
      console.log(`  Input: region=${region}, age=${fc.input.ageGroup}, gender=${fc.input.gender}, household=${fc.input.householdType}, income=${fc.input.incomeLevel}, employment=${fc.input.employmentStatus}`)
    } else {
      console.log(`  Input: region=${region}, type=${fc.input.businessType}, emp=${fc.input.employeeCount}, rev=${fc.input.annualRevenue}, bizAge=${fc.input.businessAge}mo, founderAge=${fc.input.founderAge}`)
    }

    if (fc.checks.topRelevance.length > 0) {
      console.log(`  Top 5 matches: ${fc.checks.topRelevance.map((t, i) => `${i + 1}. ${t}`).join(' | ')}`)
    }

    if (fc.checks.regionFPDetails.length > 0) {
      console.log(`  Region FP:`)
      for (const fp of fc.checks.regionFPDetails) {
        console.log(`    - "${fp.title}" (regions: ${fp.regions.join(', ')})`)
      }
    }

    if (fc.checks.trackFPDetails.length > 0) {
      console.log(`  Track FP:`)
      for (const fp of fc.checks.trackFPDetails) {
        console.log(`    - "${fp.title}" (serviceType: ${fp.serviceType})`)
      }
    }
    console.log()
  }

  // WARN DETAILS (first 30)
  const warnCases = auditResults.filter(r => r.verdict === 'WARN')
  console.log(`[WARN DETAILS] (${warnCases.length} cases, showing first 30)`)
  for (const wc of warnCases.slice(0, 30)) {
    console.log(`Case #${wc.caseId}: WARN - ${wc.userType} - ${wc.warnReasons.join('; ')}`)
  }
  if (warnCases.length > 30) {
    console.log(`  ... and ${warnCases.length - 30} more WARN cases`)
  }
  console.log()

  // OVERALL
  const totalPass = auditResults.filter(r => r.verdict === 'PASS').length
  const totalWarn = auditResults.filter(r => r.verdict === 'WARN').length
  const totalFail = auditResults.filter(r => r.verdict === 'FAIL').length

  console.log('[OVERALL]')
  console.log(`Total PASS: ${totalPass}/2000 (${(totalPass / 2000 * 100).toFixed(1)}%)`)
  console.log(`Total WARN: ${totalWarn}/2000 (${(totalWarn / 2000 * 100).toFixed(1)}%)`)
  console.log(`Total FAIL: ${totalFail}/2000 (${(totalFail / 2000 * 100).toFixed(1)}%)`)
  console.log()

  if (totalFail === 0) {
    console.log('=== ALL 2000 CASES PASSED (no FAIL) ===')
  } else {
    console.log(`=== ${totalFail} CASES FAILED -- see FAIL DETAILS above ===`)
  }

  // Save JSON
  const outputPath = 'scripts/audit-2000-results.json'
  const outputData = {
    meta: {
      timestamp: new Date().toISOString(),
      totalSupports: supports.length,
      serviceTypeBreakdown: stBreakdown,
    },
    summary: {
      totalPass,
      totalWarn,
      totalFail,
      personal: {
        pass: personalResults.filter(r => r.verdict === 'PASS').length,
        warn: personalResults.filter(r => r.verdict === 'WARN').length,
        fail: personalResults.filter(r => r.verdict === 'FAIL').length,
        regionAccuracy: personalResults.filter(r => r.checks.regionAccuracy).length,
        trackSeparation: personalResults.filter(r => r.checks.trackSeparation).length,
        ageRelevance: personalResults.filter(r => r.checks.ageRelevance).length,
      },
      business: {
        pass: businessResults.filter(r => r.verdict === 'PASS').length,
        warn: businessResults.filter(r => r.verdict === 'WARN').length,
        fail: businessResults.filter(r => r.verdict === 'FAIL').length,
        regionAccuracy: businessResults.filter(r => r.checks.regionAccuracy).length,
        trackSeparation: businessResults.filter(r => r.checks.trackSeparation).length,
        ageRelevance: businessResults.filter(r => r.checks.ageRelevance).length,
      },
    },
    failCases: failCases.map(fc => ({
      caseId: fc.caseId,
      userType: fc.userType,
      input: fc.input,
      failReasons: fc.failReasons,
      regionFPDetails: fc.checks.regionFPDetails,
      trackFPDetails: fc.checks.trackFPDetails,
      topMatches: fc.checks.topRelevance,
    })),
    warnCases: warnCases.map(wc => ({
      caseId: wc.caseId,
      userType: wc.userType,
      warnReasons: wc.warnReasons,
      tailoredCount: wc.tailoredCount,
      totalMatches: wc.totalMatches,
    })),
    allResults: auditResults.map(r => ({
      caseId: r.caseId,
      userType: r.userType,
      region: r.input.region,
      verdict: r.verdict,
      totalMatches: r.totalMatches,
      tailoredCount: r.tailoredCount,
      recommendedCount: r.recommendedCount,
      exploratoryCount: r.exploratoryCount,
      regionFP: r.checks.regionFalsePositives,
      trackOk: r.checks.trackSeparation,
      ageOk: r.checks.ageRelevance,
    })),
  }

  writeFileSync(outputPath, JSON.stringify(outputData, null, 2))
  console.log(`\nFull results saved to ${outputPath}`)
}

main().catch(err => {
  console.error('FATAL:', err)
  process.exit(1)
})
