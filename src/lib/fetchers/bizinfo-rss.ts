import { createClient } from '@supabase/supabase-js'
import { extractEligibility } from '@/lib/extraction'

const BIZINFO_RSS_URL = 'https://www.bizinfo.go.kr/web/lay1/bbs/S1T122C128/AS/74/rssFeed.do'

interface RssItem {
  title: string
  link: string
  description: string
  category: string
  pubDate: string
  guid: string
}

function parseRssItems(xmlText: string): RssItem[] {
  const items: RssItem[] = []
  const itemRegex = /<item>([\s\S]*?)<\/item>/g
  let match

  while ((match = itemRegex.exec(xmlText)) !== null) {
    const block = match[1]
    const get = (tag: string) => {
      const m = block.match(new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?</${tag}>`))
      return m ? m[1].trim() : ''
    }
    items.push({
      title: get('title'),
      link: get('link'),
      description: get('description'),
      category: get('category'),
      pubDate: get('pubDate'),
      guid: get('guid'),
    })
  }
  return items
}

function mapCategory(rssCategory: string): string {
  const map: Record<string, string> = {
    '금융': '금융', '기술': '기술', '인력': '인력',
    '수출': '수출', '내수': '내수', '창업': '창업',
    '경영': '경영',
  }
  return map[rssCategory] || '기타'
}

function parseGuid(guid: string): string {
  // Extract numeric ID from guid if present
  const m = guid.match(/(\d+)/)
  return m ? `bizinfo-rss-${m[1]}` : `bizinfo-rss-${guid.replace(/\W+/g, '-')}`
}

export async function syncBizinfoRss(): Promise<{
  fetched: number
  inserted: number
  updated: number
  skipped: number
}> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  const supabase = createClient(supabaseUrl, serviceKey)

  const { data: syncLog } = await supabase
    .from('sync_logs')
    .insert({ source: 'bizinfo-rss', status: 'running' })
    .select()
    .single()
  const logId = syncLog?.id

  try {
    let res: Response
    try {
      res = await fetch(BIZINFO_RSS_URL)
    } catch (fetchErr) {
      // 네트워크 오류 시 빈 결과 반환 (다른 소스 sync 계속 진행)
      console.warn(`[Bizinfo RSS] Fetch failed: ${fetchErr instanceof Error ? fetchErr.message : 'Unknown error'}`)
      if (logId) {
        await supabase.from('sync_logs').update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          programs_fetched: 0, programs_inserted: 0, programs_updated: 0, programs_skipped: 0,
          api_calls_used: 1,
          error_message: `Fetch failed: ${fetchErr instanceof Error ? fetchErr.message : 'Unknown error'}`,
        }).eq('id', logId)
      }
      return { fetched: 0, inserted: 0, updated: 0, skipped: 0 }
    }

    if (!res.ok) {
      // 404 등 HTTP 오류 시 빈 결과 반환 (다른 소스 sync 계속 진행)
      console.warn(`[Bizinfo RSS] HTTP ${res.status}: ${res.statusText}`)
      if (logId) {
        await supabase.from('sync_logs').update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          programs_fetched: 0, programs_inserted: 0, programs_updated: 0, programs_skipped: 0,
          api_calls_used: 1,
          error_message: `HTTP ${res.status}: ${res.statusText}`,
        }).eq('id', logId)
      }
      return { fetched: 0, inserted: 0, updated: 0, skipped: 0 }
    }

    const xml = await res.text()
    const items = parseRssItems(xml)

    let inserted = 0
    let updated = 0
    let skipped = 0

    for (const item of items) {
      if (!item.title || !item.link) { skipped++; continue }

      const externalId = parseGuid(item.guid || item.link)
      const eligibilityTexts = [item.description].filter(Boolean)
      const extraction = extractEligibility(eligibilityTexts)

      const record = {
        title: item.title,
        organization: '기업마당',
        category: mapCategory(item.category),
        start_date: null as string | null,
        end_date: null as string | null,
        detail_url: item.link,
        target_regions: extraction.regions,
        target_business_types: extraction.businessTypes,
        target_employee_min: extraction.employeeMin,
        target_employee_max: extraction.employeeMax,
        target_revenue_min: extraction.revenueMin,
        target_revenue_max: extraction.revenueMax,
        target_business_age_min: extraction.businessAgeMinMonths,
        target_business_age_max: extraction.businessAgeMaxMonths,
        target_founder_age_min: extraction.founderAgeMin,
        target_founder_age_max: extraction.founderAgeMax,
        amount: null as string | null,
        is_active: true,
        source: 'bizinfo-rss',
        external_id: externalId,
        raw_eligibility_text: item.description || null,
        raw_exclusion_text: null as string | null,
        raw_preference_text: null as string | null,
        extraction_confidence: extraction.confidence,
      }

      const { data: existing } = await supabase
        .from('supports')
        .select('id')
        .eq('external_id', externalId)
        .maybeSingle()

      if (existing) {
        const { error } = await supabase.from('supports').update(record).eq('external_id', externalId)
        if (error) { skipped++; continue }
        updated++
      } else {
        const { error } = await supabase.from('supports').insert(record)
        if (error) { skipped++; continue }
        inserted++
      }
    }

    if (logId) {
      await supabase.from('sync_logs').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        programs_fetched: items.length,
        programs_inserted: inserted,
        programs_updated: updated,
        programs_skipped: skipped,
        api_calls_used: 1,
      }).eq('id', logId)
    }

    return { fetched: items.length, inserted, updated, skipped }
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
