import { NextRequest, NextResponse } from 'next/server'
import { syncKStartup } from '@/lib/fetchers/kstartup'

/**
 * K-Startup 데이터 동기화 API
 * POST /api/sync/kstartup
 *
 * Headers: Authorization: Bearer {SYNC_SECRET}
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const authHeader = request.headers.get('authorization')
    const syncSecret = process.env.SYNC_SECRET

    if (!syncSecret || authHeader !== `Bearer ${syncSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const result = await syncKStartup()

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Sync] K-Startup error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Sync failed',
      },
      { status: 500 }
    )
  }
}
