/**
 * 데이터 싱크 공통 유틸리티
 * 싱크 로그 관리, XML 파싱, supports upsert 패턴 추출
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js'

export type { SupabaseClient }

/** Supabase 서비스 클라이언트 생성 */
export function createSyncClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

/** 싱크 로그 시작 */
export async function startSyncLog(supabase: SupabaseClient, source: string): Promise<string | undefined> {
  const { data } = await supabase
    .from('sync_logs')
    .insert({ source, status: 'running' })
    .select()
    .single()
  return data?.id
}

interface SyncStats {
  fetched: number
  inserted: number
  updated: number
  skipped: number
  apiCallsUsed: number
}

/** 싱크 로그 완료 */
export async function completeSyncLog(
  supabase: SupabaseClient,
  logId: string | undefined,
  stats: SyncStats,
): Promise<void> {
  if (!logId) return
  await supabase.from('sync_logs').update({
    status: 'completed',
    completed_at: new Date().toISOString(),
    programs_fetched: stats.fetched,
    programs_inserted: stats.inserted,
    programs_updated: stats.updated,
    programs_skipped: stats.skipped,
    api_calls_used: stats.apiCallsUsed,
  }).eq('id', logId)
}

/** 싱크 로그 실패 */
export async function failSyncLog(
  supabase: SupabaseClient,
  logId: string | undefined,
  error: unknown,
  apiCallsUsed: number,
): Promise<void> {
  if (!logId) return
  await supabase.from('sync_logs').update({
    status: 'failed',
    completed_at: new Date().toISOString(),
    error_message: error instanceof Error ? error.message : 'Unknown error',
    api_calls_used: apiCallsUsed,
  }).eq('id', logId)
}

/** supports 테이블 upsert (external_id 기준) */
export async function upsertSupport(
  supabase: SupabaseClient,
  externalId: string,
  record: Record<string, unknown>,
): Promise<'inserted' | 'updated' | 'skipped'> {
  const { data: existing } = await supabase
    .from('supports')
    .select('id')
    .eq('external_id', externalId)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase.from('supports').update(record).eq('external_id', externalId)
    return error ? 'skipped' : 'updated'
  }
  const { error } = await supabase.from('supports').insert(record)
  return error ? 'skipped' : 'inserted'
}

/** XML 태그 값 추출 (CDATA 지원) */
export function getXmlField(block: string, tag: string): string {
  const m = block.match(new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?</${tag}>`))
  return m ? m[1].trim() : ''
}

/** XML 응답에서 <item> 블록 추출 + 에러 체크 */
export function parseXmlItems(text: string): {
  blocks: string[]
  totalCount: number
  error: string | null
} {
  const totalCountMatch = text.match(/<totalCount>(\d+)<\/totalCount>/)
  const totalCount = totalCountMatch ? parseInt(totalCountMatch[1]) : 0

  const resultCodeMatch = text.match(/<resultCode>(\d+)<\/resultCode>/)
  if (resultCodeMatch && resultCodeMatch[1] !== '00') {
    const msgMatch = text.match(/<resultMsg>(.*?)<\/resultMsg>/)
    return { blocks: [], totalCount, error: `${resultCodeMatch[1]} - ${msgMatch?.[1] || 'Unknown'}` }
  }

  const blocks: string[] = []
  const itemRegex = /<item>([\s\S]*?)<\/item>/g
  let match
  while ((match = itemRegex.exec(text)) !== null) {
    blocks.push(match[1])
  }

  return { blocks, totalCount, error: null }
}

/** data.go.kr 표준 JSON 응답 파싱 */
export function parseJsonItems<T>(text: string): {
  items: T[]
  totalCount: number
  error: string | null
} {
  try {
    const json = JSON.parse(text) as Record<string, unknown>
    const body = (json?.response as Record<string, unknown>)?.body as Record<string, unknown> | undefined
    if (!body) return { items: [], totalCount: 0, error: null }

    const totalCount = (body.totalCount as number) || 0
    const itemsField = body.items as Record<string, unknown> | undefined
    const rawItems = itemsField?.item

    let items: T[]
    if (rawItems && !Array.isArray(rawItems)) {
      items = [rawItems as T]
    } else {
      items = (rawItems as T[]) || []
    }

    return { items, totalCount, error: null }
  } catch {
    // XML 에러 응답 체크
    const errorMatch = text.match(/<returnReasonCode>(.*?)<\/returnReasonCode>/)
    if (errorMatch) {
      const msgMatch = text.match(/<returnAuthMsg>(.*?)<\/returnAuthMsg>/)
      return { items: [], totalCount: 0, error: `${errorMatch[1]} - ${msgMatch?.[1] || 'Unknown'}` }
    }
    return { items: [], totalCount: 0, error: 'UNPARSEABLE' }
  }
}

/** YYYYMMDD 또는 YYYY-MM-DD 형식 → ISO 날짜 문자열 */
export function parseDate(dateStr?: string): string | null {
  if (!dateStr) return null
  const cleaned = dateStr.replace(/[^0-9]/g, '')
  if (cleaned.length !== 8) return null
  return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6, 8)}`
}
