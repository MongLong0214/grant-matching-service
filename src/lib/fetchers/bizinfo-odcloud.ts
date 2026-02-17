import { createClient } from '@supabase/supabase-js'
import { fetchAllPrograms, mapToSupport } from '@/lib/bizinfo'

// 기업마당 odcloud API (2024/2025 지원사업 데이터)
// bizinfo.ts의 fetchAllPrograms + mapToSupport 재사용

export async function syncBizinfoOdcloud(): Promise<{
  fetched: number
  inserted: number
  updated: number
  skipped: number
}> {
  const apiKey = process.env.DATA_GO_KR_API_KEY
  if (!apiKey) {
    console.log('[Bizinfo-Odcloud] DATA_GO_KR_API_KEY not set, skipping sync')
    return { fetched: 0, inserted: 0, updated: 0, skipped: 0 }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, serviceKey)

  const { data: syncLog } = await supabase
    .from('sync_logs')
    .insert({ source: 'bizinfo-odcloud', status: 'running' })
    .select()
    .single()
  const logId = syncLog?.id

  let fetched = 0
  let skipped = 0

  try {
    console.log('[Bizinfo-Odcloud] Fetching all programs...')
    const allPrograms = await fetchAllPrograms(apiKey)

    // 5000건 제한 (타임아웃 방지)
    const programs = allPrograms.slice(0, 5000)
    console.log(`[Bizinfo-Odcloud] Processing ${programs.length} / ${allPrograms.length} programs`)

    // 배치 upsert (100건씩)
    const BATCH_SIZE = 100
    for (let i = 0; i < programs.length; i += BATCH_SIZE) {
      const batch = programs.slice(i, i + BATCH_SIZE)
      const records = batch.map((program) => {
        const support = mapToSupport(program)
        return {
          ...support,
          service_type: 'business',
          external_id: `bizinfo-${program.번호 || i}`,
        }
      })

      const { error } = await supabase
        .from('supports')
        .upsert(records, { onConflict: 'external_id' })

      if (error) {
        console.error(`[Bizinfo-Odcloud] Batch upsert error at ${i}:`, error.message)
        skipped += batch.length
      } else {
        fetched += batch.length
      }
    }

    if (logId) {
      await supabase.from('sync_logs').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        programs_fetched: fetched,
        programs_inserted: 0,
        programs_updated: 0,
        programs_skipped: skipped,
        metadata: { totalAvailable: allPrograms.length, processed: programs.length },
      }).eq('id', logId)
    }

    console.log(`[Bizinfo-Odcloud] Done: ${fetched} fetched, ${skipped} skipped`)
    return { fetched, inserted: 0, updated: 0, skipped }
  } catch (error) {
    if (logId) {
      await supabase.from('sync_logs').update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: error instanceof Error ? error.message : 'Unknown error',
      }).eq('id', logId)
    }
    throw error
  }
}
