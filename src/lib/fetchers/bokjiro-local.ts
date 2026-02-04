import { createClient } from '@supabase/supabase-js'
import { extractEligibility, CTPV_TO_REGION } from '@/lib/extraction'

const BOKJIRO_LOCAL_URL = 'https://apis.data.go.kr/B554287/LocalGovernmentWelfareInformations/LcgvWelfareDtl'

interface BokjiroLocalItem {
  servId: string
  servNm: string
  ctpvNm: string
  sggNm?: string
  jurMnofNm: string
  servDgst: string
  trgterIndvdlNmArray?: string
  srvPvsnNm?: string
}

function parseXmlItems(xmlText: string): BokjiroLocalItem[] {
  const items: BokjiroLocalItem[] = []
  const itemRegex = /<servList>([\s\S]*?)<\/servList>/g
  let match

  while ((match = itemRegex.exec(xmlText)) !== null) {
    const block = match[1]
    const get = (tag: string) => {
      const m = block.match(new RegExp(`<${tag}>(.*?)</${tag}>`))
      return m ? m[1].trim() : ''
    }
    items.push({
      servId: get('servId'),
      servNm: get('servNm'),
      ctpvNm: get('ctpvNm'),
      sggNm: get('sggNm'),
      jurMnofNm: get('jurMnofNm'),
      servDgst: get('servDgst'),
      trgterIndvdlNmArray: get('trgterIndvdlNmArray'),
      srvPvsnNm: get('srvPvsnNm'),
    })
  }
  return items
}

function getTotalCount(xmlText: string): number {
  const m = xmlText.match(/<totalCount>(\d+)<\/totalCount>/)
  return m ? parseInt(m[1]) : 0
}

export async function syncBokjiroLocal(): Promise<{
  fetched: number
  inserted: number
  updated: number
  skipped: number
  apiCallsUsed: number
  isComplete: boolean
}> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const apiKey = process.env.BIZINFO_API_KEY!

  const supabase = createClient(supabaseUrl, serviceKey)

  const { data: cursor } = await supabase
    .from('sync_cursors')
    .select('*')
    .eq('source', 'bokjiro-local')
    .maybeSingle()

  let pageNo = cursor ? Math.floor((cursor.last_processed_index + 1) / 10) + 1 : 1
  const isAlreadyComplete = cursor?.is_complete || false

  if (isAlreadyComplete) {
    pageNo = 1
    await supabase.from('sync_cursors').update({
      last_processed_index: -1,
      is_complete: false,
      last_updated: new Date().toISOString(),
    }).eq('source', 'bokjiro-local')
  }

  const { data: syncLog } = await supabase
    .from('sync_logs')
    .insert({ source: 'bokjiro-local', status: 'running' })
    .select()
    .single()
  const logId = syncLog?.id

  const MAX_API_CALLS = 90
  let apiCallsUsed = 0
  let fetched = 0
  let inserted = 0
  let updated = 0
  let skipped = 0
  let totalCount = 0
  let isComplete = false

  try {
    while (apiCallsUsed < MAX_API_CALLS) {
      const url = new URL(BOKJIRO_LOCAL_URL)
      url.searchParams.set('serviceKey', apiKey)
      url.searchParams.set('pageNo', String(pageNo))
      url.searchParams.set('numOfRows', '10')

      const res = await fetch(url.toString())
      apiCallsUsed++

      if (!res.ok) throw new Error(`Bokjiro Local API error: ${res.status}`)

      const xml = await res.text()
      totalCount = getTotalCount(xml) || totalCount
      const items = parseXmlItems(xml)

      if (items.length === 0) {
        isComplete = true
        break
      }

      for (const item of items) {
        if (!item.servId) { skipped++; continue }
        const externalId = `bokjiro-local-${item.servId}`

        // Use ctpvNm for structured region mapping
        const ctpvRegion = item.ctpvNm ? CTPV_TO_REGION[item.ctpvNm] : null
        const eligibilityTexts = [item.servDgst, item.trgterIndvdlNmArray, item.srvPvsnNm].filter(Boolean) as string[]
        const extraction = extractEligibility(eligibilityTexts)

        // If ctpvNm gives us a region, use it (higher confidence than text extraction)
        const regions = ctpvRegion ? [ctpvRegion] : (extraction.regions.length > 0 ? extraction.regions : null)

        const record = {
          title: item.servNm,
          organization: item.jurMnofNm || item.ctpvNm || '지자체',
          category: '기타' as const,
          start_date: null as string | null,
          end_date: null as string | null,
          detail_url: `https://www.bokjiro.go.kr/ssis-tbu/twataa/wlfareInfo/moveTWAT52011M.do?wlfareInfoId=${item.servId}`,
          target_regions: regions,
          target_business_types: extraction.businessTypes.length > 0 ? extraction.businessTypes : null,
          target_employee_min: extraction.employeeMin,
          target_employee_max: extraction.employeeMax,
          target_revenue_min: extraction.revenueMin,
          target_revenue_max: extraction.revenueMax,
          target_business_age_min: extraction.businessAgeMinMonths,
          target_business_age_max: extraction.businessAgeMaxMonths,
          amount: null as string | null,
          is_active: true,
          source: 'bokjiro-local',
          external_id: externalId,
          raw_eligibility_text: item.servDgst || null,
          raw_exclusion_text: null as string | null,
          raw_preference_text: item.trgterIndvdlNmArray || null,
          extraction_confidence: {
            ...extraction.confidence,
            regions: ctpvRegion ? 1.0 : extraction.confidence.regions,
          },
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
        fetched++
      }

      const processedIndex = (pageNo - 1) * 10 + items.length - 1
      await supabase.from('sync_cursors').upsert({
        source: 'bokjiro-local',
        last_processed_index: processedIndex,
        last_updated: new Date().toISOString(),
        is_complete: false,
      })

      if (processedIndex + 1 >= totalCount) {
        isComplete = true
        break
      }

      pageNo++
    }

    if (isComplete) {
      await supabase.from('sync_cursors').upsert({
        source: 'bokjiro-local',
        last_processed_index: totalCount - 1,
        is_complete: true,
        last_updated: new Date().toISOString(),
      })
    }

    if (logId) {
      await supabase.from('sync_logs').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        programs_fetched: fetched,
        programs_inserted: inserted,
        programs_updated: updated,
        programs_skipped: skipped,
        api_calls_used: apiCallsUsed,
        metadata: { totalCount, isComplete, pageNo },
      }).eq('id', logId)
    }

    return { fetched, inserted, updated, skipped, apiCallsUsed, isComplete }
  } catch (error) {
    if (logId) {
      await supabase.from('sync_logs').update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: error instanceof Error ? error.message : 'Unknown error',
        api_calls_used: apiCallsUsed,
      }).eq('id', logId)
    }
    throw error
  }
}
