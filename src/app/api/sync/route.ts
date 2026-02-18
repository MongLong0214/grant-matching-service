import { NextResponse } from "next/server"
import { fetchAllPrograms, mapToSupport } from "@/lib/bizinfo"
import { createSyncClient, startSyncLog, completeSyncLog, failSyncLog } from "@/lib/fetchers/sync-helpers"
import { timingSafeEqual } from "crypto"

/** 배치 삽입 단위 (Supabase 제한 고려) */
const BATCH_SIZE = 500

/**
 * POST /api/sync
 * 기업마당 API 데이터 동기화
 *
 * 요구사항:
 * - x-sync-secret 헤더로 인증
 * - BIZINFO_API_KEY, SUPABASE_SERVICE_ROLE_KEY 환경변수 필요
 */
export async function POST(request: Request) {
  try {
    // 인증 확인
    const syncSecret = request.headers.get("x-sync-secret")
    const expectedSecret = process.env.SYNC_SECRET

    if (!expectedSecret || !syncSecret ||
        Buffer.byteLength(syncSecret) !== Buffer.byteLength(expectedSecret) ||
        !timingSafeEqual(Buffer.from(syncSecret), Buffer.from(expectedSecret))) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다" },
        { status: 401 }
      )
    }

    // API 키 확인
    const apiKey = process.env.BIZINFO_API_KEY
    if (!apiKey) {
      console.error("[Sync] BIZINFO_API_KEY not configured")
      return NextResponse.json(
        { success: false, error: "서버 설정 오류입니다." },
        { status: 500 }
      )
    }

    const supabase = createSyncClient()
    const logId = await startSyncLog(supabase, 'bizinfo')

    console.log("[Sync] Starting Bizinfo sync...")

    // API에서 데이터 가져오기
    const programs = await fetchAllPrograms(apiKey)
    console.log(`[Sync] Fetched ${programs.length} programs from API`)

    // 배치 upsert (external_id 기준)
    const supportData = programs.map(mapToSupport)
    let upsertedCount = 0

    for (let i = 0; i < supportData.length; i += BATCH_SIZE) {
      const batch = supportData.slice(i, i + BATCH_SIZE)
      const { error: upsertError } = await supabase
        .from("supports")
        .upsert(batch, { onConflict: "external_id" })

      if (upsertError) {
        console.error(`[Sync] Batch ${Math.floor(i / BATCH_SIZE) + 1} error:`, upsertError)
        await failSyncLog(supabase, logId, upsertError, 0)
        return NextResponse.json(
          { success: false, error: "데이터 upsert 중 오류가 발생했습니다.", partialUpserted: upsertedCount },
          { status: 500 }
        )
      }

      upsertedCount += batch.length
      console.log(`[Sync] Upserted batch ${Math.floor(i / BATCH_SIZE) + 1}: ${upsertedCount}/${supportData.length}`)
    }

    await completeSyncLog(supabase, logId, {
      fetched: programs.length, inserted: upsertedCount, updated: 0, skipped: 0, apiCallsUsed: 0,
    })
    console.log(`[Sync] Complete: ${upsertedCount} records synced`)

    return NextResponse.json({ success: true, synced: upsertedCount, total: programs.length })
  } catch (error) {
    console.error("[Sync] Error:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json(
      { success: false, error: "동기화 중 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}
