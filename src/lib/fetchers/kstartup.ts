import { createClient } from '@supabase/supabase-js'
import { extractEligibility } from '@/lib/extraction'

const KSTARTUP_API_URL = 'https://apis.data.go.kr/B552735/k-startup/getAnnouncementList'

interface KStartupItem {
  pblancId: string          // 공고ID (external_id)
  pblancNm: string          // 공고명 (title)
  jrsdInsttNm: string       // 주관기관명 (organization)
  pblancEndDt: string       // 공고마감일 (endDate, format: yyyyMMdd)
  detailUrl?: string        // 상세URL
  bizPrchPtrnCdNm?: string  // 사업분류 (maps to category)
  // Eligibility text fields
  trgtJgCn?: string         // 대상 자격 내용
  sprtCn?: string           // 지원 내용
  excptMtr?: string         // 제외사항
  prfrCn?: string           // 우대조건
}

// Map K-Startup bizPrchPtrnCdNm to our SupportCategory
function mapCategory(bizType?: string): string {
  if (!bizType) return '기타'
  const map: Record<string, string> = {
    '금융': '금융', '융자': '금융', '보증': '금융', '투자': '금융',
    '기술': '기술', 'R&D': '기술', '연구': '기술',
    '인력': '인력', '고용': '인력', '교육': '인력', '훈련': '인력',
    '수출': '수출', '해외': '수출', '글로벌': '수출',
    '판로': '내수', '마케팅': '내수', '내수': '내수',
    '창업': '창업', '스타트업': '창업',
    '경영': '경영', '컨설팅': '경영', '멘토링': '경영',
  }
  for (const [keyword, category] of Object.entries(map)) {
    if (bizType.includes(keyword)) return category
  }
  return '기타'
}

function parseDate(yyyymmdd?: string): string | null {
  if (!yyyymmdd || yyyymmdd.length !== 8) return null
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`
}

export async function fetchKStartup(apiKey: string): Promise<{
  items: KStartupItem[]
  totalCount: number
  apiCallsUsed: number
}> {
  const items: KStartupItem[] = []
  let totalCount = 0
  let apiCallsUsed = 0
  let pageNo = 1
  const numOfRows = 100

  while (true) {
    const url = new URL(KSTARTUP_API_URL)
    url.searchParams.set('serviceKey', apiKey)
    url.searchParams.set('pageNo', String(pageNo))
    url.searchParams.set('numOfRows', String(numOfRows))
    url.searchParams.set('type', 'json')

    const res = await fetch(url.toString())
    apiCallsUsed++

    if (!res.ok) {
      throw new Error(`K-Startup API error: ${res.status} ${res.statusText}`)
    }

    const json = await res.json()
    const body = json?.response?.body
    if (!body) break

    totalCount = body.totalCount || 0
    const itemList = body.items?.item || []

    if (!Array.isArray(itemList) || itemList.length === 0) break
    items.push(...itemList)

    if (items.length >= totalCount) break
    pageNo++

    // Safety: max 50 pages (5000 items)
    if (pageNo > 50) break
  }

  return { items, totalCount, apiCallsUsed }
}

export async function syncKStartup(): Promise<{
  fetched: number
  inserted: number
  updated: number
  skipped: number
  apiCallsUsed: number
}> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const apiKey = process.env.BIZINFO_API_KEY!

  const supabase = createClient(supabaseUrl, serviceKey)

  // Create sync log
  const { data: syncLog } = await supabase
    .from('sync_logs')
    .insert({ source: 'kstartup', status: 'running' })
    .select()
    .single()

  const logId = syncLog?.id

  try {
    const { items, totalCount, apiCallsUsed } = await fetchKStartup(apiKey)

    let inserted = 0
    let updated = 0
    let skipped = 0

    for (const item of items) {
      const externalId = `kstartup-${item.pblancId}`

      // Extract eligibility from text fields
      const eligibilityTexts = [
        item.trgtJgCn,
        item.sprtCn,
        item.excptMtr,
        item.prfrCn,
      ].filter(Boolean) as string[]

      const extraction = extractEligibility(eligibilityTexts)

      const record = {
        title: item.pblancNm,
        organization: item.jrsdInsttNm || '미상',
        category: mapCategory(item.bizPrchPtrnCdNm),
        start_date: null as string | null,
        end_date: parseDate(item.pblancEndDt),
        detail_url: item.detailUrl || `https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schM=view&pbancSn=${item.pblancId}`,
        target_regions: extraction.regions.length > 0 ? extraction.regions : null,
        target_business_types: extraction.businessTypes.length > 0 ? extraction.businessTypes : null,
        target_employee_min: extraction.employeeMin,
        target_employee_max: extraction.employeeMax,
        target_revenue_min: extraction.revenueMin,
        target_revenue_max: extraction.revenueMax,
        target_business_age_min: extraction.businessAgeMinMonths,
        target_business_age_max: extraction.businessAgeMaxMonths,
        amount: null as string | null,
        is_active: true,
        source: 'kstartup',
        external_id: externalId,
        raw_eligibility_text: item.trgtJgCn || null,
        raw_exclusion_text: item.excptMtr || null,
        raw_preference_text: item.prfrCn || null,
        extraction_confidence: extraction.confidence,
      }

      // Upsert: insert or update based on external_id
      const { data: existing } = await supabase
        .from('supports')
        .select('id')
        .eq('external_id', externalId)
        .maybeSingle()

      if (existing) {
        const { error } = await supabase
          .from('supports')
          .update(record)
          .eq('external_id', externalId)
        if (error) { skipped++; continue }
        updated++
      } else {
        const { error } = await supabase
          .from('supports')
          .insert(record)
        if (error) { skipped++; continue }
        inserted++
      }
    }

    // Update sync log
    if (logId) {
      await supabase.from('sync_logs').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        programs_fetched: items.length,
        programs_inserted: inserted,
        programs_updated: updated,
        programs_skipped: skipped,
        api_calls_used: apiCallsUsed,
      }).eq('id', logId)
    }

    return { fetched: items.length, inserted, updated, skipped, apiCallsUsed }
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
