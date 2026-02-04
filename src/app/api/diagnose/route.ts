import { NextRequest, NextResponse } from 'next/server'
import { getActiveSupports, saveDiagnosis } from '@/lib/data'
import { matchSupportsV2 } from '@/lib/matching-v2'
import { BUSINESS_TYPES, REGIONS, EMPLOYEE_OPTIONS, REVENUE_OPTIONS } from '@/constants'

const validBusinessTypes: readonly string[] = BUSINESS_TYPES
const validRegions: readonly string[] = REGIONS
const validEmployeeCounts: number[] = EMPLOYEE_OPTIONS.map((o) => o.value)
const validRevenues: number[] = REVENUE_OPTIONS.map((o) => o.value)

/**
 * 진단 생성 API
 * POST /api/diagnose
 *
 * 사업 정보를 입력받아 매칭되는 지원금을 찾고 진단 결과를 저장
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let body: any
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, error: '잘못된 JSON 형식입니다.' },
        { status: 400 }
      )
    }
    const { businessType, region, employeeCount, annualRevenue, businessStartDate, email } = body

    // 필수값 존재 검증
    if (!businessType || !region || !employeeCount || !annualRevenue || !businessStartDate) {
      return NextResponse.json(
        { success: false, error: '필수 항목을 모두 입력해주세요.' },
        { status: 400 }
      )
    }

    // 업종 검증
    if (!validBusinessTypes.includes(businessType)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 업종입니다.' },
        { status: 400 }
      )
    }

    // 지역 검증
    if (!validRegions.includes(region)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 지역입니다.' },
        { status: 400 }
      )
    }

    const parsedEmployeeCount = Number(employeeCount)
    const parsedRevenue = Number(annualRevenue)

    // 직원 수 검증
    if (isNaN(parsedEmployeeCount) || !validEmployeeCounts.includes(parsedEmployeeCount)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 직원 수입니다.' },
        { status: 400 }
      )
    }

    // 매출 검증
    if (isNaN(parsedRevenue) || !validRevenues.includes(parsedRevenue)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 연 매출입니다.' },
        { status: 400 }
      )
    }

    // 창업일 검증
    const startDate = new Date(businessStartDate)
    if (isNaN(startDate.getTime())) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 창업일입니다.' },
        { status: 400 }
      )
    }
    if (startDate > new Date()) {
      return NextResponse.json(
        { success: false, error: '창업일은 미래 날짜일 수 없습니다.' },
        { status: 400 }
      )
    }

    // 이메일 검증 (선택 필드)
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 이메일 형식입니다.' },
        { status: 400 }
      )
    }

    // 활성화된 지원금 조회
    const supports = await getActiveSupports()

    // 매칭 실행
    const formData = {
      businessType,
      region,
      employeeCount: parsedEmployeeCount,
      annualRevenue: parsedRevenue,
      businessStartDate,
      email,
    }
    const matchResult = matchSupportsV2(supports, formData)

    // 진단 결과 저장
    const matchedSupports = matchResult.all.map((s) => s.support)
    const diagnosisId = await saveDiagnosis(formData, matchedSupports)

    const duration = Date.now() - startTime

    return NextResponse.json({
      success: true,
      data: {
        diagnosisId,
        matchedCount: matchResult.totalCount,
        supports: matchedSupports,
        scored: matchResult.all.map((s) => ({
          supportId: s.support.id,
          score: Math.round(s.score * 100) / 100,
          tier: s.tier,
          breakdown: s.breakdown,
        })),
        tiers: {
          exact: matchResult.exact.length,
          likely: matchResult.likely.length,
          related: matchResult.related.length,
        },
      },
      metadata: {
        duration_ms: duration,
        timestamp: new Date().toISOString(),
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
