import { NextRequest, NextResponse } from 'next/server'
import { syncMsitRnd } from '@/lib/fetchers/msit-rnd'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const syncSecret = process.env.SYNC_SECRET

    if (!syncSecret || authHeader !== `Bearer ${syncSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const result = await syncMsitRnd()

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Sync] MSIT R&D error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    )
  }
}
