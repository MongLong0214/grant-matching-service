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
  metadata?: Record<string, unknown>,
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
    ...(metadata && { metadata }),
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

/** supports 테이블 upsert (external_id 기준, native upsert) — 단건용 */
export async function upsertSupport(
  supabase: SupabaseClient,
  record: Record<string, unknown>,
): Promise<'upserted' | 'skipped'> {
  const { error } = await supabase
    .from('supports')
    .upsert(record, { onConflict: 'external_id' })
  if (error) {
    console.error(`[upsertSupport] ${record.external_id}: ${error.message}`)
    return 'skipped'
  }
  return 'upserted'
}

const BATCH_SIZE = 200

/** supports 테이블 배치 upsert — 대량 데이터 처리용 (Supabase 502 방지) */
export async function batchUpsertSupports(
  supabase: SupabaseClient,
  records: Record<string, unknown>[],
  source: string,
): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0
  let skipped = 0

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE)
    const { error } = await supabase
      .from('supports')
      .upsert(batch, { onConflict: 'external_id' })

    if (error) {
      console.error(`[${source}] 배치 upsert 오류 (${i}~${i + batch.length}): ${error.message}`)
      skipped += batch.length
    } else {
      inserted += batch.length
    }

    // Supabase 과부하 방지: 배치 간 50ms 대기
    if (i + BATCH_SIZE < records.length) {
      await new Promise((r) => setTimeout(r, 50))
    }
  }

  return { inserted, skipped }
}

/** XML 응답에서 totalCount 추출 */
export function getTotalCount(xmlText: string): number {
  const m = xmlText.match(/<totalCount>(\d+)<\/totalCount>/)
  return m ? parseInt(m[1]) : 0
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
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr
  const cleaned = dateStr.replace(/[^0-9]/g, '')
  if (cleaned.length !== 8) return null
  return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6, 8)}`
}

/** 텍스트에서 지원 카테고리 추출 */
export function mapCategory(...texts: (string | undefined)[]): string {
  const text = texts.filter(Boolean).join(' ')
  if (!text) return '기타'
  const KEYWORD_MAP: Record<string, string> = {
    '금융': '금융', '융자': '금융', '보증': '금융', '투자': '금융', '대출': '금융',
    '기술': '기술', 'R&D': '기술', '연구': '기술', '혁신': '기술', '개발': '기술',
    '인력': '인력', '고용': '인력', '교육': '인력', '훈련': '인력', '채용': '인력', '양성': '인력',
    '수출': '수출', '해외': '수출', '글로벌': '수출', '무역': '수출', '국제': '수출', '협력': '수출',
    '판로': '내수', '마케팅': '내수', '내수': '내수', '판매': '내수',
    '창업': '창업', '스타트업': '창업', '예비창업': '창업',
    '경영': '경영', '컨설팅': '경영', '멘토링': '경영', '진단': '경영', '인프라': '경영', '기반': '경영',
  }
  for (const [keyword, category] of Object.entries(KEYWORD_MAP)) {
    if (text.includes(keyword)) return category
  }
  return '기타'
}
