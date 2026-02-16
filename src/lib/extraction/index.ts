import { extractRegions } from './region-dictionary'
import { extractBusinessTypes } from './business-type-dictionary'
import { extractEmployeeRange } from './employee-patterns'
import { extractRevenueRange } from './revenue-patterns'
import { extractBusinessAge } from './business-age-patterns'
import { extractFounderAge } from './founder-age-patterns'
import { extractAgeRange, extractHouseholdTypes, extractIncomeLevels, extractEmploymentStatus } from './audience-patterns'
import { extractBenefitCategories } from './category-patterns'

export interface ExtractionResult {
  regions: string[]
  businessTypes: string[]
  employeeMin: number | null
  employeeMax: number | null
  revenueMin: number | null
  revenueMax: number | null
  businessAgeMinMonths: number | null
  businessAgeMaxMonths: number | null
  founderAgeMin: number | null
  founderAgeMax: number | null
  // 개인 트랙 차원
  ageMin: number | null
  ageMax: number | null
  householdTypes: string[]
  incomeLevels: string[]
  employmentStatus: string[]
  benefitCategories: string[]
  confidence: ExtractionConfidence
}

export interface ExtractionConfidence {
  regions: number
  businessTypes: number
  employee: number
  revenue: number
  businessAge: number
  founderAge: number
  // 개인 트랙 신뢰도
  age: number
  householdTypes: number
  incomeLevels: number
  employmentStatus: number
  benefitCategories: number
}

/** 지역 오탐 방지: 대학교/기관명에 포함된 지역명이 지역으로 추출되는 것을 방지 */
const REGION_FALSE_POSITIVES = /서울대학교|서울과학기술대학교|서울시립대학교|서울교육대학교|부산대학교|부산교육대학교|경북대학교|전남대학교|충남대학교|충북대학교|강원대학교|인천대학교|인천교육대학교|대구대학교|대구교육대학교|대전대학교|제주대학교|경인교육대학교|광주과학기술원|대구경북과학기술원|울산과학기술원/g

/** 추출 결과 후처리 검증 — 비현실적 값 제거 */
function validateExtraction(result: ExtractionResult, rawText: string): ExtractionResult {
  let { regions, employeeMin, employeeMax, revenueMin, revenueMax, businessAgeMinMonths, businessAgeMaxMonths, founderAgeMin, founderAgeMax } = result

  // 기관명 오탐 방지: 원문에 대학교 등이 있으면 해당 지역 제거
  if (REGION_FALSE_POSITIVES.test(rawText)) {
    const cleaned = rawText.replace(REGION_FALSE_POSITIVES, '')
    regions = extractRegions(cleaned)
  }

  // min > max → swap
  if (employeeMin !== null && employeeMax !== null && employeeMin > employeeMax) {
    [employeeMin, employeeMax] = [employeeMax, employeeMin]
  }
  if (revenueMin !== null && revenueMax !== null && revenueMin > revenueMax) {
    [revenueMin, revenueMax] = [revenueMax, revenueMin]
  }
  if (businessAgeMinMonths !== null && businessAgeMaxMonths !== null && businessAgeMinMonths > businessAgeMaxMonths) {
    [businessAgeMinMonths, businessAgeMaxMonths] = [businessAgeMaxMonths, businessAgeMinMonths]
  }
  if (founderAgeMin !== null && founderAgeMax !== null && founderAgeMin > founderAgeMax) {
    [founderAgeMin, founderAgeMax] = [founderAgeMax, founderAgeMin]
  }

  // 비현실적 값 무효화
  if (employeeMin !== null && (employeeMin < 0 || employeeMin > 100_000)) employeeMin = null
  if (employeeMax !== null && (employeeMax < 0 || employeeMax > 100_000)) employeeMax = null
  if (revenueMin !== null && (revenueMin < 1_000_000 || revenueMin > 10_000_000_000_000)) revenueMin = null
  if (revenueMax !== null && (revenueMax < 1_000_000 || revenueMax > 10_000_000_000_000)) revenueMax = null
  if (businessAgeMinMonths !== null && (businessAgeMinMonths < 0 || businessAgeMinMonths > 600)) businessAgeMinMonths = null
  if (businessAgeMaxMonths !== null && (businessAgeMaxMonths < 0 || businessAgeMaxMonths > 600)) businessAgeMaxMonths = null
  if (founderAgeMin !== null && (founderAgeMin < 15 || founderAgeMin > 100)) founderAgeMin = null
  if (founderAgeMax !== null && (founderAgeMax < 15 || founderAgeMax > 100)) founderAgeMax = null

  return {
    ...result,
    regions,
    employeeMin,
    employeeMax,
    revenueMin,
    revenueMax,
    businessAgeMinMonths,
    businessAgeMaxMonths,
    founderAgeMin,
    founderAgeMax,
    confidence: {
      regions: regions.length > 0 ? 0.9 : 0.1,
      businessTypes: result.businessTypes.length > 0 ? 0.7 : 0.1,
      employee: (employeeMin !== null || employeeMax !== null) ? 0.8 : 0.1,
      revenue: (revenueMin !== null || revenueMax !== null) ? 0.8 : 0.1,
      businessAge: (businessAgeMinMonths !== null || businessAgeMaxMonths !== null) ? 0.85 : 0.1,
      founderAge: (founderAgeMin !== null || founderAgeMax !== null) ? 0.8 : 0.1,
      age: (result.ageMin !== null || result.ageMax !== null) ? 0.85 : 0.1,
      householdTypes: result.householdTypes.length > 0 ? 0.8 : 0.1,
      incomeLevels: result.incomeLevels.length > 0 ? 0.8 : 0.1,
      employmentStatus: result.employmentStatus.length > 0 ? 0.75 : 0.1,
      benefitCategories: result.benefitCategories.length > 0 ? 0.7 : 0.1,
    },
  }
}

/**
 * 한국어 자유 텍스트에서 구조화된 자격 요건 추출
 * 여러 텍스트 소스(자격, 제외, 내용)를 결합하여 추출 범위 극대화
 * AI/LLM 미사용 — 순수 정규식 + 키워드 사전 기반
 */
export function extractEligibility(texts: string[], title?: string): ExtractionResult {
  const combined = texts.filter(Boolean).join(' ')

  const regions = extractRegions(combined)
  const businessTypes = extractBusinessTypes(combined)
  const { employeeMin, employeeMax } = extractEmployeeRange(combined)
  const { revenueMin, revenueMax } = extractRevenueRange(combined)
  const { businessAgeMinMonths, businessAgeMaxMonths } = extractBusinessAge(combined)
  const { founderAgeMin, founderAgeMax } = extractFounderAge(texts.filter(Boolean))

  // 개인 트랙 차원 추출
  const { min: ageMin, max: ageMax } = extractAgeRange(combined)
  const householdTypes = extractHouseholdTypes(combined)
  const incomeLevels = extractIncomeLevels(combined)
  const empStatus = extractEmploymentStatus(combined)
  const benefitCategories = extractBenefitCategories(title || '', combined)

  // confidence는 validateExtraction()에서 최종 계산 (중복 방지)
  const raw: ExtractionResult = {
    regions,
    businessTypes,
    employeeMin,
    employeeMax,
    revenueMin,
    revenueMax,
    businessAgeMinMonths,
    businessAgeMaxMonths,
    founderAgeMin,
    founderAgeMax,
    ageMin,
    ageMax,
    householdTypes,
    incomeLevels,
    employmentStatus: empStatus,
    benefitCategories,
    confidence: {} as ExtractionConfidence,
  }

  return validateExtraction(raw, combined)
}

export { extractRegions, CTPV_TO_REGION } from './region-dictionary'
export { extractBusinessTypes } from './business-type-dictionary'
export { extractEmployeeRange } from './employee-patterns'
export { extractRevenueRange } from './revenue-patterns'
export { extractBusinessAge } from './business-age-patterns'
export { extractFounderAge } from './founder-age-patterns'
export { extractAgeRange, extractHouseholdTypes, extractIncomeLevels, extractEmploymentStatus } from './audience-patterns'
export { extractBenefitCategories } from './category-patterns'
