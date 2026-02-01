import { NextRequest, NextResponse } from 'next/server'
import { browseSupports } from '@/lib/data'

/**
 * 지원금 목록 조회 API
 * GET /api/supports?page=1&perPage=20&category=금융
 *
 * 전체 지원사업 목록을 페이지네이션으로 반환
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    const { searchParams } = request.nextUrl
    const page = Math.max(1, Number(searchParams.get('page')) || 1)
    const perPage = Math.min(100, Math.max(1, Number(searchParams.get('perPage')) || 20))
    const category = searchParams.get('category') || undefined
    const activeOnly = searchParams.get('activeOnly') !== 'false'

    const { data: supports, total } = await browseSupports({ page, perPage, category, activeOnly })
    const duration = Date.now() - startTime

    return NextResponse.json(
      {
        success: true,
        data: supports,
        metadata: {
          page,
          perPage,
          total,
          totalPages: Math.ceil(total / perPage),
          duration_ms: duration,
          timestamp: new Date().toISOString(),
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
          'X-Response-Time': `${duration}ms`,
        },
      }
    )
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    console.error('[API] Supports list error:', {
      message: errorMessage,
      duration_ms: duration,
    })

    return NextResponse.json(
      {
        success: false,
        error: '지원금 목록 조회 중 오류가 발생했습니다.',
        message: process.env.NODE_ENV === 'production' ? undefined : errorMessage,
      },
      { status: 500, headers: { 'X-Response-Time': `${duration}ms` } }
    )
  }
}
