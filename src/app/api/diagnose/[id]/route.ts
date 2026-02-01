import { NextRequest, NextResponse } from 'next/server'
import { getDiagnosis, getSupportsByIds } from '@/lib/data'

/**
 * 진단 결과 조회 API
 * GET /api/diagnose/[id]
 *
 * 저장된 진단 결과와 매칭된 지원금 목록을 반환
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()

  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { success: false, error: '진단 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // UUID 형식 검증
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 진단 ID 형식입니다.' },
        { status: 400 }
      )
    }

    const diagnosis = await getDiagnosis(id)

    if (!diagnosis) {
      return NextResponse.json(
        { success: false, error: '진단 결과를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const supports = await getSupportsByIds(diagnosis.matchedSupportIds)

    const duration = Date.now() - startTime

    return NextResponse.json(
      {
        success: true,
        data: {
          diagnosis,
          supports,
          totalCount: diagnosis.matchedCount,
        },
        metadata: {
          duration_ms: duration,
          timestamp: new Date().toISOString(),
        },
      },
      {
        headers: {
          'Cache-Control': 'private, no-store',
          'X-Response-Time': `${duration}ms`,
        },
      }
    )
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    console.error('[API] Diagnose fetch error:', {
      message: errorMessage,
      duration_ms: duration,
    })

    return NextResponse.json(
      {
        success: false,
        error: '결과 조회 중 오류가 발생했습니다.',
        message: process.env.NODE_ENV === 'production' ? undefined : errorMessage,
      },
      { status: 500, headers: { 'X-Response-Time': `${duration}ms` } }
    )
  }
}
