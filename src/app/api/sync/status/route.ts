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

    // Get latest sync logs per source
    const { data: logs } = await supabase
      .from('sync_logs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(20)

    // Get all cursors
    const { data: cursors } = await supabase
      .from('sync_cursors')
      .select('*')

    // Get support counts by source
    const { data: counts } = await supabase
      .rpc('get_support_counts_by_source')
      .select('*')

    // Fallback: manual count if RPC doesn't exist
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
