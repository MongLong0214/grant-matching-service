import { fetchAllPrograms, mapToSupport } from '@/lib/bizinfo'
import {
  createSyncClient, startSyncLog, completeSyncLog, failSyncLog,
} from './sync-helpers'

// 기업마당 odcloud API (2024/2025 지원사업 데이터)
// bizinfo.ts의 fetchAllPrograms + mapToSupport 재사용

const BATCH_SIZE = 200

export async function syncBizinfoOdcloud(): Promise<{
  fetched: number; inserted: number; updated: number; skipped: number; apiCallsUsed: number
}> {
  const apiKey = process.env.DATA_GO_KR_API_KEY
  if (!apiKey) {
    console.log('[Bizinfo-Odcloud] DATA_GO_KR_API_KEY not set, skipping sync')
    return { fetched: 0, inserted: 0, updated: 0, skipped: 0, apiCallsUsed: 0 }
  }

  const supabase = createSyncClient()
  const logId = await startSyncLog(supabase, 'bizinfo-odcloud')

  let inserted = 0
  let skipped = 0

  try {
    console.log('[Bizinfo-Odcloud] Fetching all programs...')
    const programs = await fetchAllPrograms(apiKey)
    console.log(`[Bizinfo-Odcloud] ${programs.length}건 처리 시작 (최신순 정렬)`)

    // 배치 upsert — mapToSupport가 external_id/service_type 포함
    for (let i = 0; i < programs.length; i += BATCH_SIZE) {
      const batch = programs.slice(i, i + BATCH_SIZE)
      const records = batch.map(mapToSupport)

      const { error } = await supabase
        .from('supports')
        .upsert(records, { onConflict: 'external_id' })

      if (error) {
        console.error(`[Bizinfo-Odcloud] Batch upsert error at ${i}:`, error.message)
        skipped += batch.length
      } else {
        inserted += batch.length
      }
    }

    await completeSyncLog(supabase, logId, {
      fetched: programs.length, inserted, updated: 0, skipped, apiCallsUsed: 0,
    })

    console.log(`[Bizinfo-Odcloud] Done: ${inserted} inserted, ${skipped} skipped`)
    return { fetched: programs.length, inserted, updated: 0, skipped, apiCallsUsed: 0 }
  } catch (error) {
    await failSyncLog(supabase, logId, error, 0)
    throw error
  }
}
