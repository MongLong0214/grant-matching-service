// 차원 정보 수집 + knockout 판정 + 가중치
import type { ExtractionConfidence } from '@/lib/extraction'
import type { DiagnoseFormData, PersonalFormData, Support } from '@/types'
import {
  AGE_GROUP_TO_VALUE, INCOME_ORDER, expandBusinessType,
  scoreAge, scoreBusinessAge, scoreBusinessType, scoreEmploymentStatus,
  scoreHouseholdType, scoreIncomeLevel, scoreRange, scoreRegionWithDistrict,
} from './scores'

export const BUSINESS_WEIGHTS = {
  region: 0.22, businessAge: 0.20, businessType: 0.18,
  employee: 0.15, founderAge: 0.15, revenue: 0.10,
} as const

export const PERSONAL_WEIGHTS = {
  region: 0.20, age: 0.25, householdType: 0.20,
  incomeLevel: 0.20, employmentStatus: 0.15,
} as const

export interface DimensionInfo {
  key: string
  weight: number
  hasData: boolean
  confidence: number
  rawScore: number
  isSpecific: boolean
}

const MIN_CONF = 0.3

// 헬퍼: 배열 필드가 유효한 데이터인지 판별
function hasArr(arr: unknown[] | null | undefined, conf: number): boolean {
  return arr !== null && arr !== undefined && arr.length > 0 && conf >= MIN_CONF
}
function hasRange(min: number | null | undefined, max: number | null | undefined, conf: number): boolean {
  return (min != null || max != null) && conf >= MIN_CONF
}

export function getBusinessDimensions(support: Support, input: DiagnoseFormData): DimensionInfo[] {
  const c = (support.extractionConfidence ?? null) as ExtractionConfidence | null
  const regions = support.targetRegions
  const types = support.targetBusinessTypes
  const scope = support.regionScope ?? 'unknown'
  // region hasData: regional이면 기존 로직, national/unknown이면 항상 true (점수에 반영되므로)
  const regionHasData = scope !== 'regional' ? true : hasArr(regions, c?.regions ?? 0)
  return [
    { key: 'region', weight: BUSINESS_WEIGHTS.region, isSpecific: true,
      hasData: regionHasData, confidence: scope !== 'regional' ? 0.9 : (c?.regions ?? 0),
      rawScore: scoreRegionWithDistrict(regions ?? [], support.targetSubRegions ?? null, scope, input.region, input.subRegion) },
    { key: 'businessType', weight: BUSINESS_WEIGHTS.businessType, isSpecific: true,
      hasData: hasArr(types, c?.businessTypes ?? 0), confidence: c?.businessTypes ?? 0,
      rawScore: types && types.length > 0 ? scoreBusinessType(types, input.businessType) : 0 },
    { key: 'employee', weight: BUSINESS_WEIGHTS.employee, isSpecific: true,
      hasData: hasRange(support.targetEmployeeMin, support.targetEmployeeMax, c?.employee ?? 0), confidence: c?.employee ?? 0,
      rawScore: support.targetEmployeeMin !== null || support.targetEmployeeMax !== null
        ? scoreRange(support.targetEmployeeMin, support.targetEmployeeMax, input.employeeCount, 10) : 0 },
    { key: 'revenue', weight: BUSINESS_WEIGHTS.revenue, isSpecific: false,
      hasData: hasRange(support.targetRevenueMin, support.targetRevenueMax, c?.revenue ?? 0), confidence: c?.revenue ?? 0,
      rawScore: support.targetRevenueMin !== null || support.targetRevenueMax !== null
        ? scoreRange(support.targetRevenueMin, support.targetRevenueMax, input.annualRevenue, 100_000_000) : 0 },
    { key: 'businessAge', weight: BUSINESS_WEIGHTS.businessAge, isSpecific: true,
      hasData: hasRange(support.targetBusinessAgeMin, support.targetBusinessAgeMax, c?.businessAge ?? 0), confidence: c?.businessAge ?? 0,
      rawScore: support.targetBusinessAgeMin !== null || support.targetBusinessAgeMax !== null
        ? scoreBusinessAge(support.targetBusinessAgeMin, support.targetBusinessAgeMax, input.businessAge) : 0 },
    { key: 'founderAge', weight: BUSINESS_WEIGHTS.founderAge, isSpecific: false,
      hasData: hasRange(support.targetFounderAgeMin, support.targetFounderAgeMax, c?.founderAge ?? 0), confidence: c?.founderAge ?? 0,
      rawScore: support.targetFounderAgeMin !== null || support.targetFounderAgeMax !== null
        ? scoreRange(support.targetFounderAgeMin, support.targetFounderAgeMax, input.founderAge, 10) : 0 },
  ]
}

export function getPersonalDimensions(support: Support, input: PersonalFormData): DimensionInfo[] {
  const c = (support.extractionConfidence ?? null) as ExtractionConfidence | null
  const regions = support.targetRegions
  const scope = support.regionScope ?? 'unknown'
  const regionHasData = scope !== 'regional' ? true : hasArr(regions, c?.regions ?? 0)
  return [
    { key: 'region', weight: PERSONAL_WEIGHTS.region, isSpecific: true,
      hasData: regionHasData, confidence: scope !== 'regional' ? 0.9 : (c?.regions ?? 0),
      rawScore: scoreRegionWithDistrict(regions ?? [], support.targetSubRegions ?? null, scope, input.region, input.subRegion) },
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

// ─── Knockout 함수 ───

export function isKnockedOutBusiness(support: Support, input: DiagnoseFormData): boolean {
  const c = (support.extractionConfidence ?? null) as ExtractionConfidence | null
  const regions = support.targetRegions
  // regional만 knockout (national/unknown은 점수 패널티로 처리)
  if (support.regionScope === 'regional' && regions && regions.length > 0 && (c?.regions ?? 0) >= 0.5) {
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

export function isKnockedOutPersonal(support: Support, input: PersonalFormData): boolean {
  const c = (support.extractionConfidence ?? null) as ExtractionConfidence | null
  const regions = support.targetRegions
  // regional만 knockout (national/unknown은 점수 패널티로 처리)
  if (support.regionScope === 'regional' && regions && regions.length > 0 && (c?.regions ?? 0) >= 0.5) {
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
    const validIndices = iLevels.map(l => INCOME_ORDER.indexOf(l)).filter(i => i !== -1)
    if (validIndices.length === 0) return false
    const maxTargetIdx = Math.max(...validIndices)
    if (userIdx !== -1 && userIdx > maxTargetIdx + 1) return true
  }
  const eStatus = support.targetEmploymentStatus
  if (eStatus && eStatus.length > 0 && (c?.employmentStatus ?? 0) >= 0.5) {
    if (!eStatus.includes(input.employmentStatus)) return true
  }
  return false
}
