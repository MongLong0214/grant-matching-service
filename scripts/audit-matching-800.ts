#!/usr/bin/env tsx

/**
 * 매칭 알고리즘 800 케이스 종합 감사
 * - 400 개인 (personal) 케이스
 * - 400 사업자 (business) 케이스
 *
 * 실행: npx tsx scripts/audit-matching-800.ts
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

// ═══════════════════════════════════════════════════════════════════════
//  타입 정의 (scripts/ 폴더는 tsconfig paths 사용 불가)
// ═══════════════════════════════════════════════════════════════════════

type SupportCategory =
  | "금융" | "기술" | "인력" | "수출" | "내수" | "창업" | "경영" | "복지"
  | "주거" | "육아" | "교육" | "건강" | "고용" | "생활" | "기타" | "문화"

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

interface PersonalFormData {
  ageGroup: string
  gender: string
  region: string
  householdType: string
  incomeLevel: string
  employmentStatus: string
  interestCategories: string[]
}

interface DiagnoseFormData {
  businessType: string
  region: string
  employeeCount: number
  annualRevenue: number
  businessAge: number
  founderAge: number
}

type UserInput =
  | ({ userType: 'personal' } & PersonalFormData)
  | ({ userType: 'business' } & DiagnoseFormData)

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

// ═══════════════════════════════════════════════════════════════════════
//  matching-v4 로직 인라인 (프로덕션 코드와 동일)
// ═══════════════════════════════════════════════════════════════════════

const BUSINESS_WEIGHTS = {
  region: 0.22, businessAge: 0.20, businessType: 0.18,
  employee: 0.15, founderAge: 0.15, revenue: 0.10,
} as const

const PERSONAL_WEIGHTS = {
  region: 0.20, age: 0.25, householdType: 0.20,
  incomeLevel: 0.20, employmentStatus: 0.15,
} as const

const MIN_CONF = 0.3

interface DimensionInfo {
  key: string
  weight: number
  hasData: boolean
  confidence: number
  rawScore: number
  isSpecific: boolean
}

function hasArr(arr: unknown[] | null | undefined, conf: number): boolean {
  return arr !== null && arr !== undefined && arr.length > 0 && conf >= MIN_CONF
}

function hasRange(min: number | null | undefined, max: number | null | undefined, conf: number): boolean {
  return (min != null || max != null) && conf >= MIN_CONF
}

// Scores

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

// Dimensions

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

// Knockout

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

// Matching pipeline

type MatchTierV4 = 'tailored' | 'recommended' | 'exploratory'

const TIER_THRESHOLDS = { tailored: 0.55, recommended: 0.35, exploratory: 0.15 } as const
const TIER_CAPS = { tailored: 20, recommended: 30, exploratory: 50 } as const
const TOTAL_CAP = 100

interface ScoredSupportV4 {
  support: Support
  tier: MatchTierV4
  score: number
  breakdown: Record<string, number>
  scores: Record<string, number>
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
  const coverageFactor = 0.3 + 0.7 * (totalActiveWeight / 1.0)
  let finalScore = matchScore * coverageFactor
  if (hasInterestBonus) finalScore = Math.min(1.0, finalScore * 1.12)
  return { finalScore, matchScore, coverageFactor, hasSpecificMatch }
}

function scoreSupport(
  support: Support, dims: DimensionInfo[], interestBonus: boolean,
): ScoredSupportV4 | null {
  const result = scorePipeline(dims, interestBonus)
  if (!result) return null
  let tier = getTierV4(result.finalScore)
  if (!tier) return null
  if (!result.hasSpecificMatch && tier === 'tailored') tier = 'recommended'

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

// ═══════════════════════════════════════════════════════════════════════
//  DB Row Mapper
// ═══════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════
//  상수 (constants/index.ts 미러)
// ═══════════════════════════════════════════════════════════════════════

const BUSINESS_TYPES = [
  "음식점업", "소매업", "도매업", "제조업", "건설업", "운수업", "숙박업",
  "정보통신업", "전문서비스업", "교육서비스업", "보건업", "예술/스포츠", "기타서비스업",
] as const

const REGIONS = [
  "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종",
  "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
] as const

const AGE_GROUPS = ['10대', '20대', '30대', '40대', '50대', '60대이상'] as const
const GENDERS = ['남성', '여성'] as const
const HOUSEHOLD_TYPES = ['1인', '신혼부부', '영유아', '다자녀', '한부모', '일반'] as const
const INCOME_LEVELS = ['기초생활', '차상위', '중위50이하', '중위100이하', '중위100초과'] as const
const EMPLOYMENT_STATUSES = ['재직자', '구직자', '학생', '자영업', '무직', '은퇴'] as const
const INTEREST_CATEGORIES = ['주거', '육아', '교육', '취업', '건강', '생활', '문화'] as const

const EMPLOYEE_VALUES = [2, 7, 30, 75, 150] as const
const REVENUE_VALUES = [50_000_000, 300_000_000, 750_000_000, 3_000_000_000, 10_000_000_000] as const
const BUSINESS_AGE_VALUES = [-1, 6, 24, 48, 84, 180] as const
const FOUNDER_AGE_VALUES = [25, 35, 45, 55, 65] as const

const INTEREST_COMBOS: string[][] = [
  ['주거'], ['육아'], ['교육'], ['취업'], ['건강'], ['생활'], ['문화'],
  ['주거', '생활'], ['육아', '교육'], ['취업', '교육'], ['건강', '생활'],
  ['주거', '육아', '교육'], ['취업', '건강', '문화'], ['주거', '생활', '건강', '문화'],
  ['육아', '교육', '취업'], [],
]

// ═══════════════════════════════════════════════════════════════════════
//  결정론적 셔플 유틸
// ═══════════════════════════════════════════════════════════════════════

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

function pick<T>(arr: readonly T[], idx: number): T { return arr[idx % arr.length] }

// ═══════════════════════════════════════════════════════════════════════
//  400 개인 케이스 생성
// ═══════════════════════════════════════════════════════════════════════

interface PersonalCase {
  id: number
  label: string
  input: PersonalFormData
  tags: string[]
}

function generatePersonalCases(): PersonalCase[] {
  const cases: PersonalCase[] = []
  let id = 0

  // 명시적 엣지 케이스 (20개)
  const edges: { label: string; input: PersonalFormData; tags: string[] }[] = [
    { label: '20대 남성 서울 1인가구 기초생활 구직자', input: { ageGroup: '20대', gender: '남성', region: '서울', householdType: '1인', incomeLevel: '기초생활', employmentStatus: '구직자', interestCategories: ['취업', '주거', '생활'] }, tags: ['edge', 'youth-low-income'] },
    { label: '30대 여성 전남 신혼부부 중위100이하 재직자', input: { ageGroup: '30대', gender: '여성', region: '전남', householdType: '신혼부부', incomeLevel: '중위100이하', employmentStatus: '재직자', interestCategories: ['주거', '육아'] }, tags: ['edge', 'newlywed-rural'] },
    { label: '60대이상 남성 부산 1인가구 기초생활 은퇴', input: { ageGroup: '60대이상', gender: '남성', region: '부산', householdType: '1인', incomeLevel: '기초생활', employmentStatus: '은퇴', interestCategories: ['건강', '생활'] }, tags: ['edge', 'senior-poverty'] },
    { label: '10대 여성 경기 다자녀 중위100이하 학생', input: { ageGroup: '10대', gender: '여성', region: '경기', householdType: '다자녀', incomeLevel: '중위100이하', employmentStatus: '학생', interestCategories: ['교육', '문화'] }, tags: ['edge', 'teen-student'] },
    { label: '40대 여성 대구 한부모 차상위 무직', input: { ageGroup: '40대', gender: '여성', region: '대구', householdType: '한부모', incomeLevel: '차상위', employmentStatus: '무직', interestCategories: ['생활', '육아', '교육'] }, tags: ['edge', 'single-parent'] },
    { label: '50대 남성 강원 일반 중위50이하 무직', input: { ageGroup: '50대', gender: '남성', region: '강원', householdType: '일반', incomeLevel: '중위50이하', employmentStatus: '무직', interestCategories: ['취업', '건강'] }, tags: ['edge', 'midlife-unemployment'] },
    { label: '30대 여성 인천 영유아 중위100이하 무직', input: { ageGroup: '30대', gender: '여성', region: '인천', householdType: '영유아', incomeLevel: '중위100이하', employmentStatus: '무직', interestCategories: ['육아', '취업', '주거'] }, tags: ['edge', 'childcare-career-break'] },
    { label: '20대 남성 서울 일반 중위100초과 학생', input: { ageGroup: '20대', gender: '남성', region: '서울', householdType: '일반', incomeLevel: '중위100초과', employmentStatus: '학생', interestCategories: ['교육', '문화'] }, tags: ['edge', 'high-income-student'] },
    { label: '20대 여성 제주 1인 중위50이하 구직자', input: { ageGroup: '20대', gender: '여성', region: '제주', householdType: '1인', incomeLevel: '중위50이하', employmentStatus: '구직자', interestCategories: ['취업', '주거'] }, tags: ['edge', 'rural-youth-jobseeker'] },
    { label: '40대 남성 서울 다자녀 중위100이하 재직자', input: { ageGroup: '40대', gender: '남성', region: '서울', householdType: '다자녀', incomeLevel: '중위100이하', employmentStatus: '재직자', interestCategories: ['교육', '주거', '육아'] }, tags: ['edge', 'multi-child-working'] },
    { label: '60대이상 여성 전북 1인 차상위 은퇴', input: { ageGroup: '60대이상', gender: '여성', region: '전북', householdType: '1인', incomeLevel: '차상위', employmentStatus: '은퇴', interestCategories: ['건강', '생활'] }, tags: ['edge', 'elderly-rural'] },
    { label: '10대 남성 대전 일반 중위100초과 학생', input: { ageGroup: '10대', gender: '남성', region: '대전', householdType: '일반', incomeLevel: '중위100초과', employmentStatus: '학생', interestCategories: ['교육'] }, tags: ['edge', 'teen-affluent'] },
    { label: '30대 남성 세종 신혼부부 중위50이하 자영업', input: { ageGroup: '30대', gender: '남성', region: '세종', householdType: '신혼부부', incomeLevel: '중위50이하', employmentStatus: '자영업', interestCategories: ['주거', '생활'] }, tags: ['edge', 'self-employed-newlywed'] },
    { label: '50대 여성 광주 한부모 기초생활 무직', input: { ageGroup: '50대', gender: '여성', region: '광주', householdType: '한부모', incomeLevel: '기초생활', employmentStatus: '무직', interestCategories: ['생활', '건강', '취업'] }, tags: ['edge', 'senior-single-parent'] },
    { label: '20대 여성 경기 영유아 중위100이하 재직자', input: { ageGroup: '20대', gender: '여성', region: '경기', householdType: '영유아', incomeLevel: '중위100이하', employmentStatus: '재직자', interestCategories: ['육아', '주거'] }, tags: ['edge', 'young-parent-working'] },
    { label: '40대 남성 충남 일반 중위100초과 재직자', input: { ageGroup: '40대', gender: '남성', region: '충남', householdType: '일반', incomeLevel: '중위100초과', employmentStatus: '재직자', interestCategories: [] }, tags: ['edge', 'middle-class-no-interest'] },
    { label: '30대 여성 경남 다자녀 차상위 자영업', input: { ageGroup: '30대', gender: '여성', region: '경남', householdType: '다자녀', incomeLevel: '차상위', employmentStatus: '자영업', interestCategories: ['육아', '교육', '생활'] }, tags: ['edge', 'self-employed-multi-child'] },
    { label: '50대 남성 울산 1인 중위100이하 재직자', input: { ageGroup: '50대', gender: '남성', region: '울산', householdType: '1인', incomeLevel: '중위100이하', employmentStatus: '재직자', interestCategories: ['건강'] }, tags: ['edge', 'single-worker-50s'] },
    { label: '60대이상 여성 서울 신혼부부 중위100이하 은퇴', input: { ageGroup: '60대이상', gender: '여성', region: '서울', householdType: '신혼부부', incomeLevel: '중위100이하', employmentStatus: '은퇴', interestCategories: ['건강', '문화'] }, tags: ['edge', 'senior-remarriage'] },
    { label: '20대 남성 충북 일반 기초생활 구직자', input: { ageGroup: '20대', gender: '남성', region: '충북', householdType: '일반', incomeLevel: '기초생활', employmentStatus: '구직자', interestCategories: ['취업', '교육', '주거'] }, tags: ['edge', 'rural-youth-poverty'] },
  ]
  for (const e of edges) {
    cases.push({ id: id++, label: e.label, input: e.input, tags: e.tags })
  }

  // 체계적 조합 생성 (380개)
  // 인구 비례 지역 풀
  const regionWeights: [string, number][] = [
    ['서울', 50], ['경기', 45], ['부산', 25], ['대구', 20], ['인천', 20],
    ['광주', 15], ['대전', 15], ['울산', 12], ['세종', 12], ['강원', 12],
    ['충북', 12], ['충남', 12], ['전북', 12], ['전남', 12], ['경북', 12],
    ['경남', 20], ['제주', 14],
  ]
  const regionPool: string[] = []
  for (const [r, w] of regionWeights) for (let i = 0; i < w; i++) regionPool.push(r)

  const shuffledRegions = seededShuffle(regionPool, 1001)
  const shuffledAges = seededShuffle([...Array(380)].map((_, i) => AGE_GROUPS[i % AGE_GROUPS.length]), 2002)
  const shuffledGenders = seededShuffle([...Array(380)].map((_, i) => GENDERS[i % GENDERS.length]), 3003)
  const shuffledHousehold = seededShuffle([...Array(380)].map((_, i) => HOUSEHOLD_TYPES[i % HOUSEHOLD_TYPES.length]), 4004)
  const shuffledIncome = seededShuffle([...Array(380)].map((_, i) => INCOME_LEVELS[i % INCOME_LEVELS.length]), 5005)
  const shuffledEmployment = seededShuffle([...Array(380)].map((_, i) => EMPLOYMENT_STATUSES[i % EMPLOYMENT_STATUSES.length]), 6006)
  const shuffledInterest = seededShuffle([...Array(380)].map((_, i) => INTEREST_COMBOS[i % INTEREST_COMBOS.length]), 7007)

  for (let i = 0; i < 380 && cases.length < 400; i++) {
    const ageGroup = shuffledAges[i]
    const gender = shuffledGenders[i]
    const region = shuffledRegions[i % shuffledRegions.length]
    const householdType = shuffledHousehold[i]
    const incomeLevel = shuffledIncome[i]
    const employmentStatus = shuffledEmployment[i]
    const interestCategories = shuffledInterest[i]

    const tags: string[] = []
    if (ageGroup === '10대' || ageGroup === '20대') tags.push('youth')
    if (ageGroup === '60대이상') tags.push('senior')
    if (incomeLevel === '기초생활' || incomeLevel === '차상위') tags.push('low-income')
    if (householdType === '한부모' || householdType === '다자녀') tags.push('vulnerable')
    if (employmentStatus === '무직' || employmentStatus === '구직자') tags.push('unemployed')
    if (interestCategories.length === 0) tags.push('no-interest')

    cases.push({
      id: id++,
      label: `P${String(id).padStart(3, '0')}: ${ageGroup} ${gender} ${region} ${householdType} ${incomeLevel} ${employmentStatus}`,
      input: { ageGroup, gender, region, householdType, incomeLevel, employmentStatus, interestCategories },
      tags,
    })
  }

  return cases.slice(0, 400)
}

// ═══════════════════════════════════════════════════════════════════════
//  400 사업자 케이스 생성
// ═══════════════════════════════════════════════════════════════════════

interface BusinessCase {
  id: number
  label: string
  input: DiagnoseFormData
  tags: string[]
}

function generateBusinessCases(): BusinessCase[] {
  const cases: BusinessCase[] = []
  let id = 0

  // 명시적 엣지 케이스 (16개)
  const edges: { label: string; input: DiagnoseFormData; tags: string[] }[] = [
    { label: '20대 예비창업자 IT 서울', input: { businessType: '정보통신업', region: '서울', employeeCount: 2, annualRevenue: 50_000_000, businessAge: -1, founderAge: 25 }, tags: ['edge', 'youth-startup-it'] },
    { label: '50대 음식점업 5~9명 1억~5억 서울', input: { businessType: '음식점업', region: '서울', employeeCount: 7, annualRevenue: 300_000_000, businessAge: 84, founderAge: 55 }, tags: ['edge', 'typical-small-biz'] },
    { label: '제조업 50명 10억~50억 경기', input: { businessType: '제조업', region: '경기', employeeCount: 75, annualRevenue: 3_000_000_000, businessAge: 84, founderAge: 45 }, tags: ['edge', 'sme-rnd'] },
    { label: '기타서비스업 1~4명 1억미만 전남', input: { businessType: '기타서비스업', region: '전남', employeeCount: 2, annualRevenue: 50_000_000, businessAge: 48, founderAge: 55 }, tags: ['edge', 'agriculture-proxy'] },
    { label: '60대 10년이상 건설업 경남', input: { businessType: '건설업', region: '경남', employeeCount: 30, annualRevenue: 750_000_000, businessAge: 180, founderAge: 65 }, tags: ['edge', 'old-business'] },
    { label: '30대 IT 예비창업자 세종', input: { businessType: '정보통신업', region: '세종', employeeCount: 2, annualRevenue: 50_000_000, businessAge: -1, founderAge: 35 }, tags: ['edge', 'local-startup'] },
    { label: '소매업 1명 1억미만 제주', input: { businessType: '소매업', region: '제주', employeeCount: 2, annualRevenue: 50_000_000, businessAge: 24, founderAge: 45 }, tags: ['edge', 'micro-retail'] },
    { label: '보건업 10~49명 5억~10억 대구', input: { businessType: '보건업', region: '대구', employeeCount: 30, annualRevenue: 750_000_000, businessAge: 48, founderAge: 45 }, tags: ['edge', 'healthcare'] },
    { label: '교육서비스업 1명 예비 서울', input: { businessType: '교육서비스업', region: '서울', employeeCount: 2, annualRevenue: 50_000_000, businessAge: -1, founderAge: 35 }, tags: ['edge', 'edu-startup'] },
    { label: '운수업 5~9명 1~5억 부산', input: { businessType: '운수업', region: '부산', employeeCount: 7, annualRevenue: 300_000_000, businessAge: 48, founderAge: 55 }, tags: ['edge', 'transport'] },
    { label: '전문서비스업 10~49명 5~10억 서울', input: { businessType: '전문서비스업', region: '서울', employeeCount: 30, annualRevenue: 750_000_000, businessAge: 48, founderAge: 35 }, tags: ['edge', 'professional'] },
    { label: '예술/스포츠 1명 1억미만 광주', input: { businessType: '예술/스포츠', region: '광주', employeeCount: 2, annualRevenue: 50_000_000, businessAge: 24, founderAge: 25 }, tags: ['edge', 'arts'] },
    { label: '숙박업 5~9명 1~5억 제주', input: { businessType: '숙박업', region: '제주', employeeCount: 7, annualRevenue: 300_000_000, businessAge: 48, founderAge: 45 }, tags: ['edge', 'accommodation'] },
    { label: '도매업 100명+ 50억이상 경기', input: { businessType: '도매업', region: '경기', employeeCount: 150, annualRevenue: 10_000_000_000, businessAge: 180, founderAge: 55 }, tags: ['edge', 'large-wholesale'] },
    { label: '제조업 1~4명 1억미만 예비 20대', input: { businessType: '제조업', region: '인천', employeeCount: 2, annualRevenue: 50_000_000, businessAge: -1, founderAge: 25 }, tags: ['edge', 'young-manufacturing'] },
    { label: '음식점업 1명 1억미만 강원 60대', input: { businessType: '음식점업', region: '강원', employeeCount: 2, annualRevenue: 50_000_000, businessAge: 6, founderAge: 65 }, tags: ['edge', 'senior-food'] },
  ]
  for (const e of edges) {
    cases.push({ id: id++, label: e.label, input: e.input, tags: e.tags })
  }

  // 업종 분포에 따른 체계적 케이스 (384개)
  const businessTypeDistribution: [string, number][] = [
    ['음식점업', 40], ['소매업', 30], ['제조업', 35], ['정보통신업', 35],
    ['도매업', 20], ['건설업', 25], ['운수업', 20], ['숙박업', 20],
    ['교육서비스업', 25], ['보건업', 20], ['전문서비스업', 25], ['예술/스포츠', 20],
    ['기타서비스업', 69],
  ]

  const regionWeights: [string, number][] = [
    ['서울', 50], ['경기', 45], ['부산', 25], ['대구', 20], ['인천', 20],
    ['광주', 15], ['대전', 15], ['울산', 12], ['세종', 12], ['강원', 12],
    ['충북', 12], ['충남', 12], ['전북', 12], ['전남', 12], ['경북', 12],
    ['경남', 20], ['제주', 14],
  ]
  const regionPool: string[] = []
  for (const [r, w] of regionWeights) for (let i = 0; i < w; i++) regionPool.push(r)

  const employeePool: number[] = []
  for (const [v, c] of [[2, 80], [7, 80], [30, 70], [75, 50], [150, 50]] as [number, number][]) for (let i = 0; i < c; i++) employeePool.push(v)
  const revenuePool: number[] = []
  for (const [v, c] of [[50_000_000, 80], [300_000_000, 80], [750_000_000, 70], [3_000_000_000, 50], [10_000_000_000, 50]] as [number, number][]) for (let i = 0; i < c; i++) revenuePool.push(v)
  const businessAgePool: number[] = []
  for (const [v, c] of [[-1, 60], [6, 60], [24, 70], [48, 60], [84, 50], [180, 40]] as [number, number][]) for (let i = 0; i < c; i++) businessAgePool.push(v)
  const founderAgePool: number[] = []
  for (const [v, c] of [[25, 70], [35, 80], [45, 70], [55, 60], [65, 50]] as [number, number][]) for (let i = 0; i < c; i++) founderAgePool.push(v)

  const sRegions = seededShuffle(regionPool, 8001)
  const sEmployees = seededShuffle(employeePool, 8002)
  const sRevenues = seededShuffle(revenuePool, 8003)
  const sBusinessAges = seededShuffle(businessAgePool, 8004)
  const sFounderAges = seededShuffle(founderAgePool, 8005)

  let poolIdx = 0
  for (const [bt, count] of businessTypeDistribution) {
    const edgeCount = cases.filter(c => c.input.businessType === bt).length
    const remaining = count - edgeCount
    if (remaining <= 0) continue

    for (let i = 0; i < remaining; i++) {
      if (cases.length >= 400) break
      const region = sRegions[poolIdx % sRegions.length]
      const employee = sEmployees[poolIdx % sEmployees.length]
      const revenue = sRevenues[poolIdx % sRevenues.length]
      const businessAge = sBusinessAges[poolIdx % sBusinessAges.length]
      const founderAge = sFounderAges[poolIdx % sFounderAges.length]
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
        label: `B${String(id).padStart(3, '0')}: ${ageLabel} ${bt} ${employeeLabel} ${businessAgeLabel} ${region}`,
        input: { businessType: bt, region, employeeCount: employee, annualRevenue: revenue, businessAge, founderAge },
        tags,
      })
    }
    if (cases.length >= 400) break
  }

  // 400개 미달 시 보충
  while (cases.length < 400) {
    const bt = BUSINESS_TYPES[poolIdx % BUSINESS_TYPES.length]
    const region = sRegions[poolIdx % sRegions.length]
    const employee = sEmployees[poolIdx % sEmployees.length]
    const revenue = sRevenues[poolIdx % sRevenues.length]
    const businessAge = sBusinessAges[poolIdx % sBusinessAges.length]
    const founderAge = sFounderAges[poolIdx % sFounderAges.length]
    poolIdx++
    cases.push({
      id: id++,
      label: `B${String(id).padStart(3, '0')}: (보충) ${bt} ${region}`,
      input: { businessType: bt, region, employeeCount: employee, annualRevenue: revenue, businessAge, founderAge },
      tags: ['supplemental'],
    })
  }

  return cases.slice(0, 400)
}

// ═══════════════════════════════════════════════════════════════════════
//  결과 타입
// ═══════════════════════════════════════════════════════════════════════

interface CaseResult {
  id: number
  track: 'personal' | 'business'
  label: string
  tags: string[]
  result: MatchResultV4
  totalMatches: number
  tailoredCount: number
  recommendedCount: number
  exploratoryCount: number
  knockedOutCount: number
  knockedOutPct: number
  filteredByServiceType: number
  avgScore: number
  maxScore: number
  top5Scores: number[]
  top3Titles: string[]
  avgBreakdown: Record<string, number>
  coverageFactor: number
}

// ═══════════════════════════════════════════════════════════════════════
//  통계 유틸리티
// ═══════════════════════════════════════════════════════════════════════

function computeStats(arr: number[]) {
  if (arr.length === 0) return { mean: 0, median: 0, stddev: 0, min: 0, max: 0, p10: 0, p25: 0, p75: 0, p90: 0 }
  const sorted = [...arr].sort((a, b) => a - b)
  const sum = sorted.reduce((a, b) => a + b, 0)
  const mean = sum / sorted.length
  const mid = Math.floor(sorted.length / 2)
  const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
  const variance = sorted.reduce((s, v) => s + (v - mean) ** 2, 0) / sorted.length
  const stddev = Math.sqrt(variance)
  const p = (pct: number) => sorted[Math.floor(sorted.length * pct)] ?? 0
  return { mean, median, stddev, min: sorted[0], max: sorted[sorted.length - 1], p10: p(0.1), p25: p(0.25), p75: p(0.75), p90: p(0.9) }
}

// ═══════════════════════════════════════════════════════════════════════
//  데이터 품질 분석
// ═══════════════════════════════════════════════════════════════════════

interface DataQuality {
  total: number
  serviceTypeBreakdown: Record<string, number>
  // Business fields
  biz_hasRegions: number
  biz_hasBusinessTypes: number
  biz_hasEmployeeMin: number
  biz_hasEmployeeMax: number
  biz_hasRevenueMin: number
  biz_hasRevenueMax: number
  biz_hasBusinessAgeMin: number
  biz_hasBusinessAgeMax: number
  biz_hasFounderAgeMin: number
  biz_hasFounderAgeMax: number
  // Personal fields
  per_hasRegions: number
  per_hasAgeMin: number
  per_hasAgeMax: number
  per_hasHouseholdTypes: number
  per_hasIncomeLevels: number
  per_hasEmploymentStatus: number
  per_hasBenefitCategories: number
  // Confidence >= MIN_CONF
  confRegions: number
  confBusinessTypes: number
  confEmployee: number
  confRevenue: number
  confBusinessAge: number
  confFounderAge: number
  confAge: number
  confHouseholdTypes: number
  confIncomeLevels: number
  confEmploymentStatus: number
  // Total with extraction confidence
  hasExtConf: number
}

function analyzeDataQuality(supports: Support[]): DataQuality {
  const q: DataQuality = {
    total: supports.length,
    serviceTypeBreakdown: {},
    biz_hasRegions: 0, biz_hasBusinessTypes: 0, biz_hasEmployeeMin: 0, biz_hasEmployeeMax: 0,
    biz_hasRevenueMin: 0, biz_hasRevenueMax: 0, biz_hasBusinessAgeMin: 0, biz_hasBusinessAgeMax: 0,
    biz_hasFounderAgeMin: 0, biz_hasFounderAgeMax: 0,
    per_hasRegions: 0, per_hasAgeMin: 0, per_hasAgeMax: 0,
    per_hasHouseholdTypes: 0, per_hasIncomeLevels: 0, per_hasEmploymentStatus: 0,
    per_hasBenefitCategories: 0,
    confRegions: 0, confBusinessTypes: 0, confEmployee: 0, confRevenue: 0,
    confBusinessAge: 0, confFounderAge: 0, confAge: 0, confHouseholdTypes: 0,
    confIncomeLevels: 0, confEmploymentStatus: 0,
    hasExtConf: 0,
  }

  for (const s of supports) {
    const st = s.serviceType ?? 'unknown'
    q.serviceTypeBreakdown[st] = (q.serviceTypeBreakdown[st] || 0) + 1

    if (s.targetRegions && s.targetRegions.length > 0) { q.biz_hasRegions++; q.per_hasRegions++ }
    if (s.targetBusinessTypes && s.targetBusinessTypes.length > 0) q.biz_hasBusinessTypes++
    if (s.targetEmployeeMin !== null) q.biz_hasEmployeeMin++
    if (s.targetEmployeeMax !== null) q.biz_hasEmployeeMax++
    if (s.targetRevenueMin !== null) q.biz_hasRevenueMin++
    if (s.targetRevenueMax !== null) q.biz_hasRevenueMax++
    if (s.targetBusinessAgeMin !== null) q.biz_hasBusinessAgeMin++
    if (s.targetBusinessAgeMax !== null) q.biz_hasBusinessAgeMax++
    if (s.targetFounderAgeMin !== null) q.biz_hasFounderAgeMin++
    if (s.targetFounderAgeMax !== null) q.biz_hasFounderAgeMax++
    if (s.targetAgeMin !== null) q.per_hasAgeMin++
    if (s.targetAgeMax !== null) q.per_hasAgeMax++
    if (s.targetHouseholdTypes && s.targetHouseholdTypes.length > 0) q.per_hasHouseholdTypes++
    if (s.targetIncomeLevels && s.targetIncomeLevels.length > 0) q.per_hasIncomeLevels++
    if (s.targetEmploymentStatus && s.targetEmploymentStatus.length > 0) q.per_hasEmploymentStatus++
    if (s.benefitCategories && s.benefitCategories.length > 0) q.per_hasBenefitCategories++

    const c = s.extractionConfidence as ExtractionConfidence | null
    if (c) {
      q.hasExtConf++
      if ((c.regions ?? 0) >= MIN_CONF) q.confRegions++
      if ((c.businessTypes ?? 0) >= MIN_CONF) q.confBusinessTypes++
      if ((c.employee ?? 0) >= MIN_CONF) q.confEmployee++
      if ((c.revenue ?? 0) >= MIN_CONF) q.confRevenue++
      if ((c.businessAge ?? 0) >= MIN_CONF) q.confBusinessAge++
      if ((c.founderAge ?? 0) >= MIN_CONF) q.confFounderAge++
      if ((c.age ?? 0) >= MIN_CONF) q.confAge++
      if ((c.householdTypes ?? 0) >= MIN_CONF) q.confHouseholdTypes++
      if ((c.incomeLevels ?? 0) >= MIN_CONF) q.confIncomeLevels++
      if ((c.employmentStatus ?? 0) >= MIN_CONF) q.confEmploymentStatus++
    }
  }

  return q
}

// ═══════════════════════════════════════════════════════════════════════
//  매칭 실행
// ═══════════════════════════════════════════════════════════════════════

function runCase(supports: Support[], track: 'personal' | 'business', caseData: PersonalCase | BusinessCase): CaseResult {
  let userInput: UserInput
  if (track === 'personal') {
    userInput = { userType: 'personal', ...(caseData as PersonalCase).input }
  } else {
    userInput = { userType: 'business', ...(caseData as BusinessCase).input }
  }

  const result = matchSupportsV4(supports, userInput)

  const avgScore = result.all.length > 0
    ? result.all.reduce((s, r) => s + r.score, 0) / result.all.length : 0
  const maxScore = result.all.length > 0
    ? Math.max(...result.all.map(r => r.score)) : 0
  const top5Scores = result.all.slice(0, 5).map(s => s.score)
  const top3Titles = result.all.slice(0, 3).map(s => s.support.title)

  const avgBreakdown: Record<string, number> = {}
  const top3 = result.all.slice(0, 3)
  if (top3.length > 0) {
    for (const key of Object.keys(top3[0].breakdown)) {
      avgBreakdown[key] = top3.reduce((s, r) => s + (r.breakdown[key] ?? 0), 0) / top3.length
    }
  }

  const coverageFactor = result.all.length > 0 ? result.all[0].scores.coverage : 0

  return {
    id: caseData.id,
    track,
    label: caseData.label,
    tags: caseData.tags,
    result,
    totalMatches: result.totalCount,
    tailoredCount: result.tailored.length,
    recommendedCount: result.recommended.length,
    exploratoryCount: result.exploratory.length,
    knockedOutCount: result.knockedOut,
    knockedOutPct: result.totalAnalyzed > 0 ? result.knockedOut / result.totalAnalyzed : 0,
    filteredByServiceType: result.filteredByServiceType,
    avgScore,
    maxScore,
    top5Scores,
    top3Titles,
    avgBreakdown,
    coverageFactor,
  }
}

// ═══════════════════════════════════════════════════════════════════════
//  Red Flag Detection
// ═══════════════════════════════════════════════════════════════════════

interface RedFlag {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  name: string
  detail: string
  value: string
  threshold: string
}

function detectRedFlags(
  personalResults: CaseResult[],
  businessResults: CaseResult[],
  dataQuality: DataQuality,
): RedFlag[] {
  const flags: RedFlag[] = []
  const allResults = [...personalResults, ...businessResults]

  // Cap hitting: >20% hitting 100-match limit
  const capHits = allResults.filter(r => r.totalMatches >= 100).length
  const capHitPct = capHits / allResults.length * 100
  if (capHitPct > 20) flags.push({ severity: 'CRITICAL', name: 'CAP_HITTING', detail: `${capHitPct.toFixed(1)}% of cases hit the 100-match limit`, value: `${capHitPct.toFixed(1)}%`, threshold: '<20%' })
  else if (capHitPct > 10) flags.push({ severity: 'HIGH', name: 'CAP_HITTING', detail: `${capHitPct.toFixed(1)}% of cases hit the 100-match limit`, value: `${capHitPct.toFixed(1)}%`, threshold: '<10%' })

  // Score clustering: std dev < 0.05
  const allScores = allResults.filter(r => r.totalMatches > 0).map(r => r.avgScore)
  const scoreStd = computeStats(allScores).stddev
  if (scoreStd < 0.03) flags.push({ severity: 'CRITICAL', name: 'SCORE_CLUSTERING', detail: 'Score standard deviation extremely low -- no differentiation', value: scoreStd.toFixed(4), threshold: '>0.05' })
  else if (scoreStd < 0.05) flags.push({ severity: 'HIGH', name: 'SCORE_CLUSTERING', detail: 'Score standard deviation low -- weak differentiation', value: scoreStd.toFixed(4), threshold: '>0.05' })

  // NULL bias per dimension (data quality)
  const checkNull = (name: string, populated: number) => {
    const nullPct = (1 - populated / dataQuality.total) * 100
    if (nullPct > 99) flags.push({ severity: 'CRITICAL', name: `NULL_${name.toUpperCase()}`, detail: `${name} is ${nullPct.toFixed(1)}% NULL -- dimension is useless`, value: `${nullPct.toFixed(1)}%`, threshold: '<80%' })
    else if (nullPct > 90) flags.push({ severity: 'HIGH', name: `NULL_${name.toUpperCase()}`, detail: `${name} is ${nullPct.toFixed(1)}% NULL`, value: `${nullPct.toFixed(1)}%`, threshold: '<80%' })
    else if (nullPct > 80) flags.push({ severity: 'MEDIUM', name: `NULL_${name.toUpperCase()}`, detail: `${name} is ${nullPct.toFixed(1)}% NULL`, value: `${nullPct.toFixed(1)}%`, threshold: '<80%' })
  }
  checkNull('regions (conf>=0.3)', dataQuality.confRegions)
  checkNull('businessTypes (conf>=0.3)', dataQuality.confBusinessTypes)
  checkNull('employee (conf>=0.3)', dataQuality.confEmployee)
  checkNull('revenue (conf>=0.3)', dataQuality.confRevenue)
  checkNull('businessAge (conf>=0.3)', dataQuality.confBusinessAge)
  checkNull('founderAge (conf>=0.3)', dataQuality.confFounderAge)
  checkNull('age (conf>=0.3)', dataQuality.confAge)
  checkNull('householdTypes (conf>=0.3)', dataQuality.confHouseholdTypes)
  checkNull('incomeLevels (conf>=0.3)', dataQuality.confIncomeLevels)
  checkNull('employmentStatus (conf>=0.3)', dataQuality.confEmploymentStatus)

  // Knockout overkill: >30% knocked out per case on average
  const avgKnockout = computeStats(allResults.map(r => r.knockedOutPct * 100)).mean
  if (avgKnockout > 30) flags.push({ severity: 'HIGH', name: 'KNOCKOUT_OVERKILL', detail: `Average knockout rate ${avgKnockout.toFixed(1)}%`, value: `${avgKnockout.toFixed(1)}%`, threshold: '<30%' })

  // Tier imbalance: 0 tailored in >50% of cases
  const noTailored = allResults.filter(r => r.totalMatches > 0 && r.tailoredCount === 0).length
  const noTailoredPct = noTailored / allResults.filter(r => r.totalMatches > 0).length * 100
  if (noTailoredPct > 50) flags.push({ severity: 'CRITICAL', name: 'TIER_IMBALANCE', detail: `${noTailoredPct.toFixed(1)}% of matching cases have 0 tailored results`, value: `${noTailoredPct.toFixed(1)}%`, threshold: '<50%' })

  // Empty results >10%
  const emptyPct = allResults.filter(r => r.totalMatches === 0).length / allResults.length * 100
  if (emptyPct > 10) flags.push({ severity: 'CRITICAL', name: 'HIGH_EMPTY_RATE', detail: `${emptyPct.toFixed(1)}% of cases return 0 matches`, value: `${emptyPct.toFixed(1)}%`, threshold: '<5%' })
  else if (emptyPct > 5) flags.push({ severity: 'HIGH', name: 'HIGH_EMPTY_RATE', detail: `${emptyPct.toFixed(1)}% of cases return 0 matches`, value: `${emptyPct.toFixed(1)}%`, threshold: '<5%' })

  // All-exploratory: most results exploratory only
  const exploratoryOnly = allResults.filter(r => r.totalMatches > 0 && r.tailoredCount === 0 && r.recommendedCount === 0).length
  const exploratoryOnlyPct = exploratoryOnly / allResults.filter(r => r.totalMatches > 0).length * 100
  if (exploratoryOnlyPct > 50) flags.push({ severity: 'HIGH', name: 'ALL_EXPLORATORY', detail: `${exploratoryOnlyPct.toFixed(1)}% of cases have only exploratory matches (no tailored/recommended)`, value: `${exploratoryOnlyPct.toFixed(1)}%`, threshold: '<30%' })

  return flags.sort((a, b) => {
    const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
    return order[a.severity] - order[b.severity]
  })
}

// ═══════════════════════════════════════════════════════════════════════
//  보고서 생성
// ═══════════════════════════════════════════════════════════════════════

function generateReport(
  personalResults: CaseResult[],
  businessResults: CaseResult[],
  dataQuality: DataQuality,
  redFlags: RedFlag[],
  durationMs: number,
): string {
  const ln: string[] = []
  const f = (n: number, d = 1) => Number(n).toFixed(d)
  const pct = (n: number) => `${Number(n).toFixed(1)}%`
  const allResults = [...personalResults, ...businessResults]

  // ──── Grading ────
  function gradeTrack(results: CaseResult[]): { grade: string; score: number; reasons: string[] } {
    let score = 100
    const reasons: string[] = []
    const matching = results.filter(r => r.totalMatches > 0)
    const emptyP = results.filter(r => r.totalMatches === 0).length / results.length * 100
    const overP = results.filter(r => r.totalMatches >= 100).length / results.length * 100
    const avgTailored = computeStats(results.map(r => r.tailoredCount)).mean
    const avgTotal = computeStats(results.map(r => r.totalMatches)).mean
    const allExploratory = matching.filter(r => r.tailoredCount === 0 && r.recommendedCount === 0).length / Math.max(matching.length, 1) * 100
    const scoreStd = computeStats(matching.map(r => r.avgScore)).stddev

    if (emptyP > 20) { score -= 30; reasons.push(`Empty ${pct(emptyP)}`) }
    else if (emptyP > 10) { score -= 20; reasons.push(`Empty ${pct(emptyP)}`) }
    else if (emptyP > 5) { score -= 10; reasons.push(`Empty ${pct(emptyP)}`) }

    if (overP > 30) { score -= 20; reasons.push(`Over-match ${pct(overP)}`) }
    else if (overP > 10) { score -= 10; reasons.push(`Over-match ${pct(overP)}`) }

    if (avgTailored < 1) { score -= 15; reasons.push(`Avg tailored ${f(avgTailored)}`) }
    else if (avgTailored < 3) { score -= 5; reasons.push(`Avg tailored ${f(avgTailored)}`) }

    if (avgTotal < 5) { score -= 15; reasons.push(`Avg total ${f(avgTotal)}`) }
    else if (avgTotal > 80) { score -= 10; reasons.push(`Avg total ${f(avgTotal)} (too many)`) }

    if (allExploratory > 70) { score -= 15; reasons.push(`All-exploratory ${pct(allExploratory)}`) }
    else if (allExploratory > 50) { score -= 10; reasons.push(`All-exploratory ${pct(allExploratory)}`) }

    if (scoreStd < 0.03) { score -= 10; reasons.push(`Score clustering stddev=${f(scoreStd, 4)}`) }

    let grade: string
    if (score >= 90) grade = 'A'
    else if (score >= 75) grade = 'B'
    else if (score >= 60) grade = 'C'
    else if (score >= 40) grade = 'D'
    else grade = 'F'

    return { grade, score, reasons }
  }

  const personalGrade = gradeTrack(personalResults)
  const businessGrade = gradeTrack(businessResults)
  const overallScore = Math.round((personalGrade.score + businessGrade.score) / 2)
  let overallGrade: string
  if (overallScore >= 90) overallGrade = 'A'
  else if (overallScore >= 75) overallGrade = 'B'
  else if (overallScore >= 60) overallGrade = 'C'
  else if (overallScore >= 40) overallGrade = 'D'
  else overallGrade = 'F'

  // ──── Header ────
  ln.push('# Matching Algorithm 800-Case Enterprise Audit')
  ln.push('')
  ln.push(`> Audit date: ${new Date().toISOString()}`)
  ln.push(`> Duration: ${(durationMs / 1000).toFixed(1)}s`)
  ln.push(`> Total supports in DB: ${dataQuality.total}`)
  ln.push(`> Cases: 400 personal + 400 business = 800`)
  ln.push(`> Matcher version: v4 (dual-track)`)
  ln.push('')

  // ──── Executive Summary ────
  ln.push('## Executive Summary')
  ln.push('')
  ln.push(`| Track | Grade | Score | Key Issues |`)
  ln.push(`|-------|-------|-------|------------|`)
  ln.push(`| Personal (400) | **${personalGrade.grade}** | ${personalGrade.score}/100 | ${personalGrade.reasons.join('; ') || 'None'} |`)
  ln.push(`| Business (400) | **${businessGrade.grade}** | ${businessGrade.score}/100 | ${businessGrade.reasons.join('; ') || 'None'} |`)
  ln.push(`| **Overall** | **${overallGrade}** | **${overallScore}/100** | |`)
  ln.push('')

  // Monetization readiness
  ln.push('### Monetization Readiness')
  ln.push('')
  if (overallScore >= 75) {
    ln.push('**READY with caveats** -- Algorithm performs at acceptable levels but has notable weaknesses that should be addressed.')
  } else if (overallScore >= 60) {
    ln.push('**NOT READY** -- Algorithm has significant quality issues. Users paying 1000 won would likely feel results are too generic or irrelevant.')
  } else {
    ln.push('**NOT READY** -- Algorithm has fundamental problems. Monetization would damage user trust.')
  }
  ln.push('')

  // ──── Red Flags ────
  ln.push('## Red Flags')
  ln.push('')
  if (redFlags.length === 0) {
    ln.push('No red flags detected.')
  } else {
    ln.push(`| # | Severity | Flag | Value | Threshold | Detail |`)
    ln.push(`|---|----------|------|-------|-----------|--------|`)
    for (let i = 0; i < redFlags.length; i++) {
      const rf = redFlags[i]
      ln.push(`| ${i + 1} | ${rf.severity} | ${rf.name} | ${rf.value} | ${rf.threshold} | ${rf.detail} |`)
    }
  }
  ln.push('')

  // ──── Data Quality ────
  ln.push('## Data Quality Analysis')
  ln.push('')

  ln.push('### Service Type Distribution')
  ln.push('| Type | Count | % |')
  ln.push('|------|-------|---|')
  for (const [st, cnt] of Object.entries(dataQuality.serviceTypeBreakdown).sort((a, b) => (b[1] as number) - (a[1] as number))) {
    ln.push(`| ${st} | ${cnt} | ${pct((cnt as number) / dataQuality.total * 100)} |`)
  }
  ln.push('')

  ln.push('### Business Dimension NULL Rates')
  ln.push('')
  ln.push('> Fields populated out of all supports. "Effective" = confidence >= 0.3 AND data present.')
  ln.push('')
  ln.push('| Dimension | Raw Populated | % | Effective (conf>=0.3) | % |')
  ln.push('|-----------|--------------|---|----------------------|---|')
  const bizFields: [string, number, number][] = [
    ['targetRegions', dataQuality.biz_hasRegions, dataQuality.confRegions],
    ['targetBusinessTypes', dataQuality.biz_hasBusinessTypes, dataQuality.confBusinessTypes],
    ['targetEmployeeMin', dataQuality.biz_hasEmployeeMin, dataQuality.confEmployee],
    ['targetEmployeeMax', dataQuality.biz_hasEmployeeMax, dataQuality.confEmployee],
    ['targetRevenueMin', dataQuality.biz_hasRevenueMin, dataQuality.confRevenue],
    ['targetRevenueMax', dataQuality.biz_hasRevenueMax, dataQuality.confRevenue],
    ['targetBusinessAgeMin', dataQuality.biz_hasBusinessAgeMin, dataQuality.confBusinessAge],
    ['targetBusinessAgeMax', dataQuality.biz_hasBusinessAgeMax, dataQuality.confBusinessAge],
    ['targetFounderAgeMin', dataQuality.biz_hasFounderAgeMin, dataQuality.confFounderAge],
    ['targetFounderAgeMax', dataQuality.biz_hasFounderAgeMax, dataQuality.confFounderAge],
  ]
  for (const [name, raw, eff] of bizFields) {
    ln.push(`| ${name} | ${raw} | ${pct(raw / dataQuality.total * 100)} | ${eff} | ${pct(eff / dataQuality.total * 100)} |`)
  }
  ln.push('')

  ln.push('### Personal Dimension NULL Rates')
  ln.push('')
  ln.push('| Dimension | Raw Populated | % | Effective (conf>=0.3) | % |')
  ln.push('|-----------|--------------|---|----------------------|---|')
  const perFields: [string, number, number][] = [
    ['targetRegions', dataQuality.per_hasRegions, dataQuality.confRegions],
    ['targetAgeMin', dataQuality.per_hasAgeMin, dataQuality.confAge],
    ['targetAgeMax', dataQuality.per_hasAgeMax, dataQuality.confAge],
    ['targetHouseholdTypes', dataQuality.per_hasHouseholdTypes, dataQuality.confHouseholdTypes],
    ['targetIncomeLevels', dataQuality.per_hasIncomeLevels, dataQuality.confIncomeLevels],
    ['targetEmploymentStatus', dataQuality.per_hasEmploymentStatus, dataQuality.confEmploymentStatus],
    ['benefitCategories', dataQuality.per_hasBenefitCategories, dataQuality.hasExtConf],
  ]
  for (const [name, raw, eff] of perFields) {
    ln.push(`| ${name} | ${raw} | ${pct(raw / dataQuality.total * 100)} | ${eff} | ${pct(eff / dataQuality.total * 100)} |`)
  }
  ln.push('')

  // ──── Personal Track ────
  ln.push('## Personal Track (400 cases)')
  ln.push('')
  ln.push(`**Grade: ${personalGrade.grade} (${personalGrade.score}/100)**`)
  ln.push('')

  const pStats = computeStats(personalResults.map(r => r.totalMatches))
  const pTailored = computeStats(personalResults.map(r => r.tailoredCount))
  const pRecommended = computeStats(personalResults.map(r => r.recommendedCount))
  const pExploratory = computeStats(personalResults.map(r => r.exploratoryCount))
  const pScoreStats = computeStats(personalResults.filter(r => r.totalMatches > 0).map(r => r.avgScore))
  const pKnockout = computeStats(personalResults.map(r => r.knockedOutPct * 100))
  const pCoverage = computeStats(personalResults.filter(r => r.totalMatches > 0).map(r => r.coverageFactor))
  const pEmpty = personalResults.filter(r => r.totalMatches === 0).length
  const pOverMatch = personalResults.filter(r => r.totalMatches >= 100).length

  ln.push('### Summary Statistics')
  ln.push('')
  ln.push('| Metric | Total | Tailored | Recommended | Exploratory |')
  ln.push('|--------|-------|----------|-------------|-------------|')
  ln.push(`| Mean | ${f(pStats.mean)} | ${f(pTailored.mean)} | ${f(pRecommended.mean)} | ${f(pExploratory.mean)} |`)
  ln.push(`| Median | ${f(pStats.median)} | ${f(pTailored.median)} | ${f(pRecommended.median)} | ${f(pExploratory.median)} |`)
  ln.push(`| Std Dev | ${f(pStats.stddev)} | ${f(pTailored.stddev)} | ${f(pRecommended.stddev)} | ${f(pExploratory.stddev)} |`)
  ln.push(`| Min | ${pStats.min} | ${pTailored.min} | ${pRecommended.min} | ${pExploratory.min} |`)
  ln.push(`| Max | ${pStats.max} | ${pTailored.max} | ${pRecommended.max} | ${pExploratory.max} |`)
  ln.push(`| P10 | ${pStats.p10} | ${pTailored.p10} | ${pRecommended.p10} | ${pExploratory.p10} |`)
  ln.push(`| P90 | ${pStats.p90} | ${pTailored.p90} | ${pRecommended.p90} | ${pExploratory.p90} |`)
  ln.push('')

  ln.push('| Metric | Value | Target | Status |')
  ln.push('|--------|-------|--------|--------|')
  ln.push(`| Empty results | ${pEmpty} (${pct(pEmpty / 400 * 100)}) | <5% | ${pEmpty / 400 * 100 < 5 ? 'PASS' : 'FAIL'} |`)
  ln.push(`| Over-match (100+) | ${pOverMatch} (${pct(pOverMatch / 400 * 100)}) | <10% | ${pOverMatch / 400 * 100 < 10 ? 'PASS' : 'FAIL'} |`)
  ln.push(`| Avg score | ${f(pScoreStats.mean, 3)} | | |`)
  ln.push(`| Score std dev | ${f(pScoreStats.stddev, 4)} | >0.05 | ${pScoreStats.stddev > 0.05 ? 'PASS' : 'WARN'} |`)
  ln.push(`| Avg knockout | ${f(pKnockout.mean)}% | <30% | ${pKnockout.mean < 30 ? 'PASS' : 'WARN'} |`)
  ln.push(`| Avg coverage factor | ${f(pCoverage.mean, 3)} | | |`)
  ln.push('')

  // Personal breakdown by dimension
  const pDimBreakdown = (key: string, getVal: (r: CaseResult) => string) => {
    const groups: Record<string, { count: number; totalMatches: number; tailored: number; avgScore: number }> = {}
    for (const r of personalResults) {
      const k = getVal(r)
      if (!groups[k]) groups[k] = { count: 0, totalMatches: 0, tailored: 0, avgScore: 0 }
      groups[k].count++
      groups[k].totalMatches += r.totalMatches
      groups[k].tailored += r.tailoredCount
      groups[k].avgScore += r.avgScore
    }
    ln.push(`### By ${key}`)
    ln.push('')
    ln.push(`| ${key} | Cases | Avg Matches | Avg Tailored | Avg Score |`)
    ln.push(`|${'-'.repeat(key.length + 2)}|-------|-------------|-------------|-----------|`)
    for (const [k, v] of Object.entries(groups).sort((a, b) => b[1].totalMatches / b[1].count - a[1].totalMatches / a[1].count)) {
      ln.push(`| ${k} | ${v.count} | ${f(v.totalMatches / v.count)} | ${f(v.tailored / v.count)} | ${f(v.avgScore / v.count, 3)} |`)
    }
    ln.push('')
  }

  pDimBreakdown('Region', r => {
    const input = (r as CaseResult & { label: string }).label
    // Extract from the PersonalCase input
    const found = personalResults.find(p => p.id === r.id)
    // All personal cases have the same structure
    return found ? (found as unknown as { result: MatchResultV4 }).result.totalAnalyzed > 0 ? '' : '' : ''
  })

  // Actually use the raw data from personal cases
  // Region breakdown
  {
    const groups: Record<string, { count: number; totalMatches: number; tailored: number; avgScore: number; empty: number }> = {}
    const personalCases = generatePersonalCases()
    for (let i = 0; i < personalResults.length; i++) {
      const r = personalResults[i]
      const c = personalCases[i]
      const region = c.input.region
      if (!groups[region]) groups[region] = { count: 0, totalMatches: 0, tailored: 0, avgScore: 0, empty: 0 }
      groups[region].count++
      groups[region].totalMatches += r.totalMatches
      groups[region].tailored += r.tailoredCount
      groups[region].avgScore += r.avgScore
      if (r.totalMatches === 0) groups[region].empty++
    }
    // Remove the previous empty breakdown
    ln.splice(ln.length - 4, 4) // remove the broken Region section
    ln.push('### By Region (Personal)')
    ln.push('')
    ln.push('| Region | Cases | Avg Matches | Avg Tailored | Avg Score | Empty |')
    ln.push('|--------|-------|-------------|-------------|-----------|-------|')
    for (const [k, v] of Object.entries(groups).sort((a, b) => b[1].totalMatches / b[1].count - a[1].totalMatches / a[1].count)) {
      ln.push(`| ${k} | ${v.count} | ${f(v.totalMatches / v.count)} | ${f(v.tailored / v.count)} | ${f(v.avgScore / v.count, 3)} | ${v.empty} |`)
    }
    ln.push('')

    // Age group breakdown
    const ageGroups: Record<string, { count: number; totalMatches: number; tailored: number; avgScore: number }> = {}
    for (let i = 0; i < personalResults.length; i++) {
      const r = personalResults[i]
      const c = personalCases[i]
      const age = c.input.ageGroup
      if (!ageGroups[age]) ageGroups[age] = { count: 0, totalMatches: 0, tailored: 0, avgScore: 0 }
      ageGroups[age].count++
      ageGroups[age].totalMatches += r.totalMatches
      ageGroups[age].tailored += r.tailoredCount
      ageGroups[age].avgScore += r.avgScore
    }
    ln.push('### By Age Group (Personal)')
    ln.push('')
    ln.push('| Age | Cases | Avg Matches | Avg Tailored | Avg Score |')
    ln.push('|-----|-------|-------------|-------------|-----------|')
    for (const age of AGE_GROUPS) {
      const v = ageGroups[age]
      if (v) ln.push(`| ${age} | ${v.count} | ${f(v.totalMatches / v.count)} | ${f(v.tailored / v.count)} | ${f(v.avgScore / v.count, 3)} |`)
    }
    ln.push('')

    // Income breakdown
    const incomeGroups: Record<string, { count: number; totalMatches: number; tailored: number }> = {}
    for (let i = 0; i < personalResults.length; i++) {
      const r = personalResults[i]
      const c = personalCases[i]
      const inc = c.input.incomeLevel
      if (!incomeGroups[inc]) incomeGroups[inc] = { count: 0, totalMatches: 0, tailored: 0 }
      incomeGroups[inc].count++
      incomeGroups[inc].totalMatches += r.totalMatches
      incomeGroups[inc].tailored += r.tailoredCount
    }
    ln.push('### By Income Level (Personal)')
    ln.push('')
    ln.push('| Income | Cases | Avg Matches | Avg Tailored |')
    ln.push('|--------|-------|-------------|-------------|')
    for (const inc of INCOME_LEVELS) {
      const v = incomeGroups[inc]
      if (v) ln.push(`| ${inc} | ${v.count} | ${f(v.totalMatches / v.count)} | ${f(v.tailored / v.count)} |`)
    }
    ln.push('')

    // Household breakdown
    const hhGroups: Record<string, { count: number; totalMatches: number; tailored: number }> = {}
    for (let i = 0; i < personalResults.length; i++) {
      const r = personalResults[i]
      const c = personalCases[i]
      const hh = c.input.householdType
      if (!hhGroups[hh]) hhGroups[hh] = { count: 0, totalMatches: 0, tailored: 0 }
      hhGroups[hh].count++
      hhGroups[hh].totalMatches += r.totalMatches
      hhGroups[hh].tailored += r.tailoredCount
    }
    ln.push('### By Household Type (Personal)')
    ln.push('')
    ln.push('| Household | Cases | Avg Matches | Avg Tailored |')
    ln.push('|-----------|-------|-------------|-------------|')
    for (const hh of HOUSEHOLD_TYPES) {
      const v = hhGroups[hh]
      if (v) ln.push(`| ${hh} | ${v.count} | ${f(v.totalMatches / v.count)} | ${f(v.tailored / v.count)} |`)
    }
    ln.push('')
  }

  // ──── Business Track ────
  ln.push('## Business Track (400 cases)')
  ln.push('')
  ln.push(`**Grade: ${businessGrade.grade} (${businessGrade.score}/100)**`)
  ln.push('')

  const bStats = computeStats(businessResults.map(r => r.totalMatches))
  const bTailored = computeStats(businessResults.map(r => r.tailoredCount))
  const bRecommended = computeStats(businessResults.map(r => r.recommendedCount))
  const bExploratory = computeStats(businessResults.map(r => r.exploratoryCount))
  const bScoreStats = computeStats(businessResults.filter(r => r.totalMatches > 0).map(r => r.avgScore))
  const bKnockout = computeStats(businessResults.map(r => r.knockedOutPct * 100))
  const bCoverage = computeStats(businessResults.filter(r => r.totalMatches > 0).map(r => r.coverageFactor))
  const bEmpty = businessResults.filter(r => r.totalMatches === 0).length
  const bOverMatch = businessResults.filter(r => r.totalMatches >= 100).length

  ln.push('### Summary Statistics')
  ln.push('')
  ln.push('| Metric | Total | Tailored | Recommended | Exploratory |')
  ln.push('|--------|-------|----------|-------------|-------------|')
  ln.push(`| Mean | ${f(bStats.mean)} | ${f(bTailored.mean)} | ${f(bRecommended.mean)} | ${f(bExploratory.mean)} |`)
  ln.push(`| Median | ${f(bStats.median)} | ${f(bTailored.median)} | ${f(bRecommended.median)} | ${f(bExploratory.median)} |`)
  ln.push(`| Std Dev | ${f(bStats.stddev)} | ${f(bTailored.stddev)} | ${f(bRecommended.stddev)} | ${f(bExploratory.stddev)} |`)
  ln.push(`| Min | ${bStats.min} | ${bTailored.min} | ${bRecommended.min} | ${bExploratory.min} |`)
  ln.push(`| Max | ${bStats.max} | ${bTailored.max} | ${bRecommended.max} | ${bExploratory.max} |`)
  ln.push(`| P10 | ${bStats.p10} | ${bTailored.p10} | ${bRecommended.p10} | ${bExploratory.p10} |`)
  ln.push(`| P90 | ${bStats.p90} | ${bTailored.p90} | ${bRecommended.p90} | ${bExploratory.p90} |`)
  ln.push('')

  ln.push('| Metric | Value | Target | Status |')
  ln.push('|--------|-------|--------|--------|')
  ln.push(`| Empty results | ${bEmpty} (${pct(bEmpty / 400 * 100)}) | <5% | ${bEmpty / 400 * 100 < 5 ? 'PASS' : 'FAIL'} |`)
  ln.push(`| Over-match (100+) | ${bOverMatch} (${pct(bOverMatch / 400 * 100)}) | <10% | ${bOverMatch / 400 * 100 < 10 ? 'PASS' : 'FAIL'} |`)
  ln.push(`| Avg score | ${f(bScoreStats.mean, 3)} | | |`)
  ln.push(`| Score std dev | ${f(bScoreStats.stddev, 4)} | >0.05 | ${bScoreStats.stddev > 0.05 ? 'PASS' : 'WARN'} |`)
  ln.push(`| Avg knockout | ${f(bKnockout.mean)}% | <30% | ${bKnockout.mean < 30 ? 'PASS' : 'WARN'} |`)
  ln.push(`| Avg coverage factor | ${f(bCoverage.mean, 3)} | | |`)
  ln.push('')

  // Business breakdown by dimensions
  {
    const businessCases = generateBusinessCases()

    // By business type
    const btGroups: Record<string, { count: number; totalMatches: number; tailored: number; avgScore: number; empty: number }> = {}
    for (let i = 0; i < businessResults.length; i++) {
      const r = businessResults[i]
      const c = businessCases[i]
      const bt = c.input.businessType
      if (!btGroups[bt]) btGroups[bt] = { count: 0, totalMatches: 0, tailored: 0, avgScore: 0, empty: 0 }
      btGroups[bt].count++
      btGroups[bt].totalMatches += r.totalMatches
      btGroups[bt].tailored += r.tailoredCount
      btGroups[bt].avgScore += r.avgScore
      if (r.totalMatches === 0) btGroups[bt].empty++
    }
    ln.push('### By Business Type')
    ln.push('')
    ln.push('| Type | Cases | Avg Matches | Avg Tailored | Avg Score | Empty |')
    ln.push('|------|-------|-------------|-------------|-----------|-------|')
    for (const [k, v] of Object.entries(btGroups).sort((a, b) => b[1].totalMatches / b[1].count - a[1].totalMatches / a[1].count)) {
      ln.push(`| ${k} | ${v.count} | ${f(v.totalMatches / v.count)} | ${f(v.tailored / v.count)} | ${f(v.avgScore / v.count, 3)} | ${v.empty} |`)
    }
    ln.push('')

    // By region
    const regGroups: Record<string, { count: number; totalMatches: number; tailored: number; empty: number }> = {}
    for (let i = 0; i < businessResults.length; i++) {
      const r = businessResults[i]
      const c = businessCases[i]
      const reg = c.input.region
      if (!regGroups[reg]) regGroups[reg] = { count: 0, totalMatches: 0, tailored: 0, empty: 0 }
      regGroups[reg].count++
      regGroups[reg].totalMatches += r.totalMatches
      regGroups[reg].tailored += r.tailoredCount
      if (r.totalMatches === 0) regGroups[reg].empty++
    }
    ln.push('### By Region (Business)')
    ln.push('')
    ln.push('| Region | Cases | Avg Matches | Avg Tailored | Empty |')
    ln.push('|--------|-------|-------------|-------------|-------|')
    for (const [k, v] of Object.entries(regGroups).sort((a, b) => b[1].totalMatches / b[1].count - a[1].totalMatches / a[1].count)) {
      ln.push(`| ${k} | ${v.count} | ${f(v.totalMatches / v.count)} | ${f(v.tailored / v.count)} | ${v.empty} |`)
    }
    ln.push('')

    // By employee size
    const empGroups: Record<string, { count: number; totalMatches: number; tailored: number }> = {}
    for (let i = 0; i < businessResults.length; i++) {
      const r = businessResults[i]
      const c = businessCases[i]
      const emp = c.input.employeeCount <= 4 ? '1~4명' : c.input.employeeCount <= 9 ? '5~9명' : c.input.employeeCount <= 49 ? '10~49명' : c.input.employeeCount <= 99 ? '50~99명' : '100명+'
      if (!empGroups[emp]) empGroups[emp] = { count: 0, totalMatches: 0, tailored: 0 }
      empGroups[emp].count++
      empGroups[emp].totalMatches += r.totalMatches
      empGroups[emp].tailored += r.tailoredCount
    }
    ln.push('### By Employee Size (Business)')
    ln.push('')
    ln.push('| Size | Cases | Avg Matches | Avg Tailored |')
    ln.push('|------|-------|-------------|-------------|')
    for (const [k, v] of Object.entries(empGroups)) {
      ln.push(`| ${k} | ${v.count} | ${f(v.totalMatches / v.count)} | ${f(v.tailored / v.count)} |`)
    }
    ln.push('')

    // By business age
    const baGroups: Record<string, { count: number; totalMatches: number; tailored: number }> = {}
    for (let i = 0; i < businessResults.length; i++) {
      const r = businessResults[i]
      const c = businessCases[i]
      const ba = c.input.businessAge === -1 ? '예비창업' : c.input.businessAge <= 12 ? '1년미만' : c.input.businessAge <= 36 ? '1~3년' : c.input.businessAge <= 60 ? '3~5년' : c.input.businessAge <= 120 ? '5~10년' : '10년+'
      if (!baGroups[ba]) baGroups[ba] = { count: 0, totalMatches: 0, tailored: 0 }
      baGroups[ba].count++
      baGroups[ba].totalMatches += r.totalMatches
      baGroups[ba].tailored += r.tailoredCount
    }
    ln.push('### By Business Age')
    ln.push('')
    ln.push('| Age | Cases | Avg Matches | Avg Tailored |')
    ln.push('|-----|-------|-------------|-------------|')
    for (const [k, v] of Object.entries(baGroups)) {
      ln.push(`| ${k} | ${v.count} | ${f(v.totalMatches / v.count)} | ${f(v.tailored / v.count)} |`)
    }
    ln.push('')
  }

  // ──── Top 10 Critical Issues ────
  ln.push('## Top 10 Most Critical Issues')
  ln.push('')

  const issues: { priority: number; title: string; detail: string; files: string }[] = []

  // Issue detection based on actual results
  const pEmptyPct = pEmpty / 400 * 100
  const bEmptyPct = bEmpty / 400 * 100

  if (pEmptyPct > 5 || bEmptyPct > 5) {
    issues.push({ priority: 1, title: `High empty result rate (Personal: ${f(pEmptyPct)}%, Business: ${f(bEmptyPct)}%)`, detail: 'Users paying for matching get 0 results. Root cause: aggressive knockout + low data coverage means many profiles find no qualifying supports.', files: 'src/lib/matching-v4/dimensions.ts (knockout functions), src/lib/matching-v4/index.ts (TIER_THRESHOLDS)' })
  }

  // NULL bias
  const nullDims = redFlags.filter(rf => rf.name.startsWith('NULL_'))
  if (nullDims.length > 5) {
    issues.push({ priority: 2, title: `${nullDims.length} dimensions have >80% NULL data`, detail: 'Most dimensions that the algorithm relies on have no usable data. The algorithm effectively scores based on 1-2 active dimensions for most supports, making results generic and indistinguishable.', files: 'src/lib/extraction/index.ts (extraction pipeline), src/lib/extraction/*.ts' })
  }

  const tierFlag = redFlags.find(rf => rf.name === 'TIER_IMBALANCE')
  if (tierFlag) {
    issues.push({ priority: 3, title: `Tier imbalance: ${tierFlag.value} of cases have 0 tailored results`, detail: 'The hasSpecificMatch requirement (region or businessType score >= 0.8 and hasData) demotes tailored/recommended to exploratory. With most region/businessType data NULL, almost no support can qualify as "specific match".', files: 'src/lib/matching-v4/index.ts (scoreSupport, line ~89)' })
  }

  const exploratoryFlag = redFlags.find(rf => rf.name === 'ALL_EXPLORATORY')
  if (exploratoryFlag) {
    issues.push({ priority: 4, title: `${exploratoryFlag.value} of matching cases are all-exploratory`, detail: 'Users see only "exploratory" tier matches, never "tailored" or "recommended". This makes the product feel low-quality.', files: 'src/lib/matching-v4/index.ts (scoreSupport hasSpecificMatch), src/lib/matching-v4/dimensions.ts (isSpecific flag)' })
  }

  const clusterFlag = redFlags.find(rf => rf.name === 'SCORE_CLUSTERING')
  if (clusterFlag) {
    issues.push({ priority: 5, title: `Score clustering (stddev=${clusterFlag.value})`, detail: 'All scores are nearly identical, meaning the algorithm cannot differentiate between good and bad matches. Users see essentially random ordering.', files: 'src/lib/matching-v4/index.ts (scorePipeline coverage factor)' })
  }

  // Coverage factor issue
  if (pCoverage.mean < 0.4 || bCoverage.mean < 0.4) {
    issues.push({ priority: 6, title: `Low coverage factor (Personal: ${f(pCoverage.mean, 3)}, Business: ${f(bCoverage.mean, 3)})`, detail: 'Coverage factor penalizes supports with few active dimensions. With most data NULL, this creates a ceiling effect where scores can never reach tailored threshold. Formula: 0.1 + 0.9 * (activeWeight / 1.0)', files: 'src/lib/matching-v4/index.ts (scorePipeline, coverage formula)' })
  }

  // Extraction quality
  if (dataQuality.hasExtConf < dataQuality.total * 0.5) {
    issues.push({ priority: 7, title: `${pct((1 - dataQuality.hasExtConf / dataQuality.total) * 100)} of supports have no extraction confidence`, detail: 'These supports were never processed by the extraction pipeline, so all their target dimensions are NULL.', files: 'src/lib/extraction/index.ts, src/app/api/cron/sync/route.ts' })
  }

  // Interest bonus
  issues.push({ priority: 8, title: 'Interest category bonus is additive (+0.10)', detail: 'The +0.10 flat bonus can cross tier thresholds artificially. A support scoring 0.55 (recommended) gets bumped to 0.65 (tailored) just because it has matching benefit category, regardless of eligibility fit.', files: 'src/lib/matching-v4/index.ts (scorePipeline, interest bonus)' })

  // Knockout confidence threshold
  issues.push({ priority: 9, title: 'Knockout requires confidence >= 0.7, but most data has low confidence', detail: 'The knockout filter only activates when extraction confidence >= 0.7. With most dimensions having confidence < 0.3, knockouts rarely fire, allowing irrelevant supports through.', files: 'src/lib/matching-v4/dimensions.ts (isKnockedOutBusiness, isKnockedOutPersonal)' })

  // Org diversity
  issues.push({ priority: 10, title: 'Organization diversity cap (maxPerOrg=3) may hide relevant results', detail: 'If a single organization (e.g., "중소벤처기업부") has many relevant programs, only 3 per tier are shown. This is good for diversity but may hide the best matches.', files: 'src/lib/matching-v4/index.ts (enforceOrgDiversity)' })

  ln.push('| # | Priority | Issue | Files |')
  ln.push('|---|----------|-------|-------|')
  for (const issue of issues.slice(0, 10)) {
    ln.push(`| ${issue.priority} | P${issue.priority <= 3 ? '0-CRITICAL' : issue.priority <= 6 ? '1-HIGH' : '2-MEDIUM'} | ${issue.title} | \`${issue.files.split(',')[0].trim()}\` |`)
  }
  ln.push('')

  for (const issue of issues.slice(0, 10)) {
    ln.push(`### Issue #${issue.priority}: ${issue.title}`)
    ln.push('')
    ln.push(issue.detail)
    ln.push('')
    ln.push(`**Files**: \`${issue.files}\``)
    ln.push('')
  }

  // ──── Specific Code Changes ────
  ln.push('## Recommended Code Changes')
  ln.push('')

  ln.push('### Change 1: Relax hasSpecificMatch demotion (HIGH IMPACT)')
  ln.push('')
  ln.push('```typescript')
  ln.push('// src/lib/matching-v4/index.ts, scoreSupport function')
  ln.push('// BEFORE:')
  ln.push("if (!result.hasSpecificMatch && (tier === 'tailored' || tier === 'recommended')) tier = 'exploratory'")
  ln.push('')
  ln.push('// AFTER: Demote by 1 tier instead of straight to exploratory')
  ln.push("if (!result.hasSpecificMatch && tier === 'tailored') tier = 'recommended'")
  ln.push("// Do NOT demote recommended -> exploratory (allow recommended without specific match)")
  ln.push('```')
  ln.push('')

  ln.push('### Change 2: Raise coverage factor floor (MEDIUM IMPACT)')
  ln.push('')
  ln.push('```typescript')
  ln.push('// src/lib/matching-v4/index.ts, scorePipeline function')
  ln.push('// BEFORE:')
  ln.push('const coverageFactor = 0.1 + 0.9 * (totalActiveWeight / 1.0)')
  ln.push('')
  ln.push('// AFTER: Higher floor prevents scores from being crushed')
  ln.push('const coverageFactor = 0.3 + 0.7 * (totalActiveWeight / 1.0)')
  ln.push('```')
  ln.push('')

  ln.push('### Change 3: Make interest bonus multiplicative (LOW IMPACT)')
  ln.push('')
  ln.push('```typescript')
  ln.push('// src/lib/matching-v4/index.ts, scorePipeline function')
  ln.push('// BEFORE:')
  ln.push('if (hasInterestBonus) finalScore = Math.min(1.0, finalScore + 0.10)')
  ln.push('')
  ln.push('// AFTER: Proportional bonus prevents artificial tier jumps')
  ln.push('if (hasInterestBonus) finalScore = Math.min(1.0, finalScore * 1.12)')
  ln.push('```')
  ln.push('')

  ln.push('### Change 4: Lower tier thresholds (MEDIUM IMPACT)')
  ln.push('')
  ln.push('```typescript')
  ln.push('// src/lib/matching-v4/index.ts')
  ln.push('// BEFORE:')
  ln.push('const TIER_THRESHOLDS = { tailored: 0.65, recommended: 0.40, exploratory: 0.20 }')
  ln.push('')
  ln.push('// AFTER: Account for low data coverage')
  ln.push('const TIER_THRESHOLDS = { tailored: 0.55, recommended: 0.35, exploratory: 0.15 }')
  ln.push('```')
  ln.push('')

  ln.push('### Change 5: Minimum 2 active dimensions for scoring (LOW IMPACT)')
  ln.push('')
  ln.push('```typescript')
  ln.push('// src/lib/matching-v4/index.ts, scorePipeline function')
  ln.push('// BEFORE:')
  ln.push('if (activeDims.length < 1) return null')
  ln.push('')
  ln.push('// AFTER: Require at least 2 dimensions for meaningful scoring')
  ln.push('if (activeDims.length < 2) return null')
  ln.push('```')
  ln.push('')

  // ──── Full Case Results (compact) ────
  ln.push('## Full 800-Case Results (Compact)')
  ln.push('')

  // Histogram
  ln.push('### Match Count Distribution')
  ln.push('')
  ln.push('| Range | Personal | Business | Total |')
  ln.push('|-------|----------|----------|-------|')
  const buckets = [0, 1, 5, 10, 20, 30, 50, 100]
  for (let i = 0; i < buckets.length; i++) {
    const lo = buckets[i]
    const hi = i + 1 < buckets.length ? buckets[i + 1] - 1 : 999
    const label = i + 1 < buckets.length ? `${lo}~${hi}` : `${lo}+`
    const pCount = personalResults.filter(r => r.totalMatches >= lo && (i + 1 < buckets.length ? r.totalMatches <= hi : true)).length
    const bCount = businessResults.filter(r => r.totalMatches >= lo && (i + 1 < buckets.length ? r.totalMatches <= hi : true)).length
    ln.push(`| ${label} | ${pCount} (${pct(pCount / 400 * 100)}) | ${bCount} (${pct(bCount / 400 * 100)}) | ${pCount + bCount} |`)
  }
  ln.push('')

  // Problem cases
  ln.push('### Problem Cases (Top 30)')
  ln.push('')
  const problemCases = allResults.filter(r =>
    r.totalMatches === 0 || r.totalMatches >= 100 || (r.totalMatches > 0 && r.tailoredCount === 0 && r.recommendedCount === 0 && r.totalMatches > 30) ||
    (r.totalMatches > 0 && r.avgScore > 0.8)
  ).sort((a, b) => {
    if (a.totalMatches === 0 && b.totalMatches !== 0) return -1
    if (b.totalMatches === 0 && a.totalMatches !== 0) return 1
    return b.totalMatches - a.totalMatches
  }).slice(0, 30)

  ln.push('| # | Track | Label | Total | T/R/E | KO% | Avg Score | Problem |')
  ln.push('|---|-------|-------|-------|-------|-----|-----------|---------|')
  for (let i = 0; i < problemCases.length; i++) {
    const p = problemCases[i]
    const problem = p.totalMatches === 0 ? 'EMPTY' : p.totalMatches >= 100 ? 'OVER_MATCH' : p.avgScore > 0.8 ? 'HIGH_SCORE' : 'ALL_EXPLORATORY'
    ln.push(`| ${i + 1} | ${p.track} | ${p.label.slice(0, 35)} | ${p.totalMatches} | ${p.tailoredCount}/${p.recommendedCount}/${p.exploratoryCount} | ${f(p.knockedOutPct * 100)}% | ${f(p.avgScore, 3)} | ${problem} |`)
  }
  ln.push('')

  // ──── Footer ────
  ln.push('---')
  ln.push('')
  ln.push(`*Generated by audit-matching-800.ts on ${new Date().toISOString()}*`)
  ln.push(`*Duration: ${(durationMs / 1000).toFixed(1)}s | 800 cases against ${dataQuality.total} supports*`)

  return ln.join('\n')
}

// ═══════════════════════════════════════════════════════════════════════
//  Main
// ═══════════════════════════════════════════════════════════════════════

async function main() {
  console.log('=== 800-Case Matching Algorithm Enterprise Audit ===\n')
  const startTime = Date.now()

  // 1. Load supports from Supabase
  console.log('[1/6] Loading supports from Supabase...')
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) { console.error('ERROR: Supabase env vars missing'); process.exit(1) }

  const supabase = createClient(url, key)
  const today = new Date().toISOString().split('T')[0]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let allRows: any[] = []
  let from = 0
  const PAGE_SIZE = 1000
  while (true) {
    const { data: rows, error } = await supabase
      .from('supports')
      .select('*')
      .eq('is_active', true)
      .or(`end_date.is.null,end_date.gte.${today}`)
      .range(from, from + PAGE_SIZE - 1)
    if (error) { console.error('DB error:', error); process.exit(1) }
    if (!rows || rows.length === 0) break
    allRows = allRows.concat(rows)
    if (rows.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  const supports = allRows.map(mapSupportRow)
  console.log(`  => ${supports.length} active supports loaded`)

  // 2. Data quality analysis
  console.log('[2/6] Analyzing data quality...')
  const dataQuality = analyzeDataQuality(supports)
  console.log(`  => Service types: ${JSON.stringify(dataQuality.serviceTypeBreakdown)}`)
  console.log(`  => Extraction confidence present: ${dataQuality.hasExtConf}/${dataQuality.total}`)

  // 3. Generate test cases
  console.log('[3/6] Generating 800 test cases...')
  const personalCases = generatePersonalCases()
  const businessCases = generateBusinessCases()
  console.log(`  => ${personalCases.length} personal + ${businessCases.length} business cases generated`)

  // 4. Run personal track
  console.log('[4/6] Running 400 personal cases...')
  const personalResults: CaseResult[] = []
  for (let i = 0; i < personalCases.length; i++) {
    personalResults.push(runCase(supports, 'personal', personalCases[i]))
    if ((i + 1) % 100 === 0) console.log(`  => ${i + 1}/400 personal cases done`)
  }

  // 5. Run business track
  console.log('[5/6] Running 400 business cases...')
  const businessResults: CaseResult[] = []
  for (let i = 0; i < businessCases.length; i++) {
    businessResults.push(runCase(supports, 'business', businessCases[i]))
    if ((i + 1) % 100 === 0) console.log(`  => ${i + 1}/400 business cases done`)
  }

  const matchDuration = Date.now() - startTime
  console.log(`  => Matching complete in ${(matchDuration / 1000).toFixed(1)}s`)

  // Quick stats
  const allResults = [...personalResults, ...businessResults]
  const pEmpty = personalResults.filter(r => r.totalMatches === 0).length
  const bEmpty = businessResults.filter(r => r.totalMatches === 0).length
  const pAvgTotal = computeStats(personalResults.map(r => r.totalMatches)).mean
  const bAvgTotal = computeStats(businessResults.map(r => r.totalMatches)).mean
  const pAvgTailored = computeStats(personalResults.map(r => r.tailoredCount)).mean
  const bAvgTailored = computeStats(businessResults.map(r => r.tailoredCount)).mean

  console.log('\n--- Quick Summary ---')
  console.log(`Personal: empty=${pEmpty}/400 (${(pEmpty / 400 * 100).toFixed(1)}%), avg=${pAvgTotal.toFixed(1)}, avgTailored=${pAvgTailored.toFixed(1)}`)
  console.log(`Business: empty=${bEmpty}/400 (${(bEmpty / 400 * 100).toFixed(1)}%), avg=${bAvgTotal.toFixed(1)}, avgTailored=${bAvgTailored.toFixed(1)}`)

  // 6. Detect red flags and generate report
  console.log('\n[6/6] Detecting red flags and generating report...')
  const redFlags = detectRedFlags(personalResults, businessResults, dataQuality)
  console.log(`  => ${redFlags.length} red flags detected`)
  for (const rf of redFlags.slice(0, 5)) {
    console.log(`     [${rf.severity}] ${rf.name}: ${rf.value}`)
  }

  const totalDuration = Date.now() - startTime
  const report = generateReport(personalResults, businessResults, dataQuality, redFlags, totalDuration)
  writeFileSync('MATCHING_AUDIT_800.md', report, 'utf-8')
  console.log(`\n=> MATCHING_AUDIT_800.md saved (${(report.length / 1024).toFixed(0)} KB)`)
  console.log(`\n=== Audit complete in ${(totalDuration / 1000).toFixed(1)}s ===`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
