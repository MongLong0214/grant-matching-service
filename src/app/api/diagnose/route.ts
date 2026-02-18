import { NextRequest, NextResponse } from 'next/server'
import { getActiveSupports, saveDiagnosis } from '@/lib/data'
import { matchSupportsV4Flat } from '@/lib/matching-v4'
import {
  BUSINESS_TYPES, REGIONS, REGION_DISTRICTS, EMPLOYEE_OPTIONS, REVENUE_OPTIONS, BUSINESS_AGE_OPTIONS, FOUNDER_AGE_OPTIONS,
  AGE_GROUP_OPTIONS, GENDER_OPTIONS, HOUSEHOLD_TYPE_OPTIONS, INCOME_LEVEL_OPTIONS, EMPLOYMENT_STATUS_OPTIONS, INTEREST_CATEGORY_OPTIONS,
} from '@/constants'
import type { UserInput } from '@/types'

const validBusinessTypes: readonly string[] = BUSINESS_TYPES
const validRegions: readonly string[] = REGIONS
const validEmployeeCounts: number[] = EMPLOYEE_OPTIONS.map((o) => o.value)
const validRevenues: number[] = REVENUE_OPTIONS.map((o) => o.value)
const validBusinessAges: number[] = BUSINESS_AGE_OPTIONS.map((o) => o.value)
const validFounderAges: number[] = FOUNDER_AGE_OPTIONS.map((o) => o.value)
const validAgeGroups: string[] = AGE_GROUP_OPTIONS.map((o) => o.value)
const validGenders: string[] = GENDER_OPTIONS.map((o) => o.value)
const validHouseholdTypes: string[] = HOUSEHOLD_TYPE_OPTIONS.map((o) => o.value)
const validIncomeLevels: string[] = INCOME_LEVEL_OPTIONS.map((o) => o.value)
const validEmploymentStatuses: string[] = EMPLOYMENT_STATUS_OPTIONS.map((o) => o.value)
const validInterestCategories: string[] = INTEREST_CATEGORY_OPTIONS.map((o) => o.value)

function badRequest(error: string) {
  return NextResponse.json({ success: false, error }, { status: 400 })
}

function validateBusinessInput(body: Record<string, unknown>): UserInput | string {
  const { businessType, region, employeeCount, annualRevenue, businessAge, founderAge, subRegion } = body

  if (!businessType || !region || employeeCount === undefined || employeeCount === null || annualRevenue === undefined || annualRevenue === null || businessAge === undefined || businessAge === null || founderAge === undefined || founderAge === null) {
    return '필수 항목을 모두 입력해주세요.'
  }
  if (!validBusinessTypes.includes(businessType as string)) return '유효하지 않은 업종입니다.'
  if (!validRegions.includes(region as string)) return '유효하지 않은 지역입니다.'
  if (subRegion && typeof subRegion === 'string' && subRegion.length > 0) {
    const districts = REGION_DISTRICTS[region as string]
    if (!districts || !districts.includes(subRegion)) return '유효하지 않은 세부 지역입니다.'
  }

  const parsedEmployee = Number(employeeCount)
  if (isNaN(parsedEmployee) || !validEmployeeCounts.includes(parsedEmployee)) return '유효하지 않은 직원 수입니다.'
  const parsedRevenue = Number(annualRevenue)
  if (isNaN(parsedRevenue) || !validRevenues.includes(parsedRevenue)) return '유효하지 않은 연 매출입니다.'
  const parsedBizAge = Number(businessAge)
  if (isNaN(parsedBizAge) || !validBusinessAges.includes(parsedBizAge)) return '유효하지 않은 업력입니다.'
  const parsedFounderAge = Number(founderAge)
  if (isNaN(parsedFounderAge) || !validFounderAges.includes(parsedFounderAge)) return '유효하지 않은 대표자 연령입니다.'

  return {
    userType: 'business',
    businessType: businessType as string,
    region: region as string,
    subRegion: (subRegion as string) || undefined,
    employeeCount: parsedEmployee,
    annualRevenue: parsedRevenue,
    businessAge: parsedBizAge,
    founderAge: parsedFounderAge,
  }
}

function validatePersonalInput(body: Record<string, unknown>): UserInput | string {
  const { ageGroup, gender, region, householdType, incomeLevel, employmentStatus, interestCategories, subRegion } = body

  if (!ageGroup || !gender || !region || !householdType || !incomeLevel || !employmentStatus) {
    return '필수 항목을 모두 입력해주세요.'
  }
  if (!validAgeGroups.includes(ageGroup as string)) return '유효하지 않은 연령대입니다.'
  if (!validGenders.includes(gender as string)) return '유효하지 않은 성별입니다.'
  if (!validRegions.includes(region as string)) return '유효하지 않은 지역입니다.'
  if (subRegion && typeof subRegion === 'string' && subRegion.length > 0) {
    const districts = REGION_DISTRICTS[region as string]
    if (!districts || !districts.includes(subRegion)) return '유효하지 않은 세부 지역입니다.'
  }
  if (!validHouseholdTypes.includes(householdType as string)) return '유효하지 않은 가구 유형입니다.'
  if (!validIncomeLevels.includes(incomeLevel as string)) return '유효하지 않은 소득 수준입니다.'
  if (!validEmploymentStatuses.includes(employmentStatus as string)) return '유효하지 않은 취업 상태입니다.'

  const categories = Array.isArray(interestCategories) ? interestCategories as string[] : []
  if (categories.some(c => !validInterestCategories.includes(c))) return '유효하지 않은 관심 분야입니다.'

  return {
    userType: 'personal',
    ageGroup: ageGroup as string,
    gender: gender as string,
    region: region as string,
    subRegion: (subRegion as string) || undefined,
    householdType: householdType as string,
    incomeLevel: incomeLevel as string,
    employmentStatus: employmentStatus as string,
    interestCategories: categories,
  }
}

/**
 * 진단 생성 API (듀얼 트랙: 개인/사업자)
 * POST /api/diagnose
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return badRequest('잘못된 JSON 형식입니다.')
    }

    const userType = body.userType as string | undefined
    if (userType !== 'personal' && userType !== 'business') {
      return badRequest('userType은 "personal" 또는 "business"여야 합니다.')
    }

    // 트랙별 검증
    const validationResult = userType === 'personal'
      ? validatePersonalInput(body)
      : validateBusinessInput(body)

    if (typeof validationResult === 'string') {
      return badRequest(validationResult)
    }

    const userInput = validationResult

    // 활성화된 지원금 조회
    const supports = await getActiveSupports()

    // 매칭 실행 (v4: dual-track)
    const { result, matchedScores, matchedSupports } = matchSupportsV4Flat(supports, userInput)

    // 진단 결과 저장
    const diagnosisId = await saveDiagnosis(userInput, matchedSupports, matchedScores)

    const duration = Date.now() - startTime

    return NextResponse.json({
      success: true,
      data: {
        diagnosisId,
        matchedCount: result.totalCount,
        supports: matchedSupports,
        scored: matchedScores,
        tiers: {
          tailored: result.tailored.length,
          recommended: result.recommended.length,
          exploratory: result.exploratory.length,
        },
      },
      metadata: {
        duration_ms: duration,
        timestamp: new Date().toISOString(),
        totalAnalyzed: result.totalAnalyzed,
        knockedOut: result.knockedOut,
        filteredByServiceType: result.filteredByServiceType,
        userType,
      },
    })
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    console.error('[API] Diagnose error:', {
      message: errorMessage,
      duration_ms: duration,
    })

    return NextResponse.json(
      {
        success: false,
        error: '진단 처리 중 오류가 발생했습니다.',
        message: process.env.NODE_ENV === 'production' ? undefined : errorMessage,
      },
      { status: 500, headers: { 'X-Response-Time': `${duration}ms` } }
    )
  }
}
