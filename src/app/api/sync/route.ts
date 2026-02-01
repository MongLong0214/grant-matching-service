import { NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { fetchAllPrograms, mapToSupport } from "@/lib/bizinfo"
import { timingSafeEqual } from "crypto"

/** 배치 삽입 단위 (Supabase 제한 고려) */
const BATCH_SIZE = 500

/**
 * 관리자 권한 Supabase 클라이언트 생성
 * RLS 우회를 위해 service_role 키 사용
 */
function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured")
  }

  return createSupabaseClient(url, serviceKey)
}

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

    console.log("[Sync] Starting Bizinfo sync...")

    // 1. API에서 데이터 가져오기
    const programs = await fetchAllPrograms(apiKey)
    console.log(`[Sync] Fetched ${programs.length} programs from API`)

    // 2. 관리자 클라이언트 생성 (RLS 우회)
    const supabase = createAdminClient()

    // 3. 기존 bizinfo 소스 데이터 삭제
    const { error: deleteError } = await supabase
      .from("supports")
      .delete()
      .eq("source", "bizinfo")

    if (deleteError) {
      console.error("[Sync] Delete error:", deleteError)
      return NextResponse.json(
        { success: false, error: "기존 데이터 삭제 중 오류가 발생했습니다." },
        { status: 500 }
      )
    }

    console.log("[Sync] Deleted old bizinfo records")

    // 4. 배치 삽입
    const supportData = programs.map(mapToSupport)
    let insertedCount = 0

    for (let i = 0; i < supportData.length; i += BATCH_SIZE) {
      const batch = supportData.slice(i, i + BATCH_SIZE)
      const { error: insertError } = await supabase
        .from("supports")
        .insert(batch)

      if (insertError) {
        console.error(`[Sync] Batch ${Math.floor(i / BATCH_SIZE) + 1} error:`, insertError)
        return NextResponse.json(
          {
            success: false,
            error: "데이터 삽입 중 오류가 발생했습니다.",
            partialInserted: insertedCount,
          },
          { status: 500 }
        )
      }

      insertedCount += batch.length
      console.log(`[Sync] Inserted batch ${Math.floor(i / BATCH_SIZE) + 1}: ${insertedCount}/${supportData.length}`)
    }

    console.log(`[Sync] Complete: ${insertedCount} records synced`)

    return NextResponse.json({
      success: true,
      synced: insertedCount,
      total: programs.length,
    })
  } catch (error) {
    console.error("[Sync] Error:", error instanceof Error ? error.message : "Unknown error")
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      {
        success: false,
        error: "동기화 중 오류가 발생했습니다.",
        message: process.env.NODE_ENV === "production" ? undefined : errorMessage,
      },
      { status: 500 }
    )
  }
}
