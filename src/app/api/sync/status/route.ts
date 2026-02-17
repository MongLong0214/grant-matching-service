import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const syncSecret = process.env.SYNC_SECRET

    if (!syncSecret || authHeader !== `Bearer ${syncSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, serviceKey)

    // 소스별 최근 동기화 로그 조회
    const { data: logs } = await supabase
      .from('sync_logs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(20)

    // 전체 커서 조회
    const { data: cursors } = await supabase
      .from('sync_cursors')
      .select('*')

    // 소스별 지원사업 건수 조회
    const { data: counts } = await supabase
      .rpc('get_support_counts_by_source')
      .select('*')

    // RPC 미존재 시 수동 카운트 폴백
    let sourceCounts = counts
    if (!sourceCounts) {
      const { data: allSupports } = await supabase
        .from('supports')
        .select('source')
        .eq('is_active', true)

      const countMap: Record<string, number> = {}
      for (const s of allSupports || []) {
        countMap[s.source] = (countMap[s.source] || 0) + 1
      }
      sourceCounts = Object.entries(countMap).map(([source, count]) => ({ source, count }))
    }

    return NextResponse.json({
      success: true,
      data: {
        recentLogs: logs || [],
        cursors: cursors || [],
        supportCounts: sourceCounts,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Sync] Status error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to get status' },
      { status: 500 }
    )
  }
}
