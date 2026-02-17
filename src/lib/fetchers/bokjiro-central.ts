import { createClient } from '@supabase/supabase-js'
import { extractEligibility } from '@/lib/extraction'
import { fetchWithRetry } from '@/lib/fetch-with-retry'
import { parseXmlItems, getTotalCount } from './bokjiro-central-helpers'

// 보건복지부_지자체 복지정보
const BOKJIRO_CENTRAL_URL = 'https://apis.data.go.kr/B554287/LocalGovernmentWelfareInformations/LcgvWelfarelist'

export async function syncBokjiroCentral(): Promise<{
  fetched: number
  inserted: number
  updated: number
  skipped: number
  apiCallsUsed: number
  isComplete: boolean
}> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const apiKey = process.env.DATA_GO_KR_API_KEY!

  const supabase = createClient(supabaseUrl, serviceKey)

  // 커서 조회
  const { data: cursor } = await supabase
    .from('sync_cursors')
    .select('*')
    .eq('source', 'bokjiro-central')
    .maybeSingle()

  let pageNo = cursor ? Math.floor((cursor.last_processed_index + 1) / 10) + 1 : 1
  const isAlreadyComplete = cursor?.is_complete || false

  if (isAlreadyComplete) {
    // 재동기화를 위한 초기화
    pageNo = 1
    await supabase.from('sync_cursors').update({
      last_processed_index: -1,
      is_complete: false,
      last_updated: new Date().toISOString(),
    }).eq('source', 'bokjiro-central')
  }

  // 동기화 로그 생성
  const { data: syncLog } = await supabase
    .from('sync_logs')
    .insert({ source: 'bokjiro-central', status: 'running' })
    .select()
    .single()
  const logId = syncLog?.id

  const MAX_API_CALLS = 90  // 일일 100회 제한 내 유지
  let apiCallsUsed = 0
  let fetched = 0
  let skipped = 0
  let totalCount = 0
  let isComplete = false

  try {
    while (apiCallsUsed < MAX_API_CALLS) {
      const url = new URL(BOKJIRO_CENTRAL_URL)
      url.searchParams.set('serviceKey', apiKey)
      url.searchParams.set('pageNo', String(pageNo))
      url.searchParams.set('numOfRows', '10')

      const res = await fetchWithRetry(url.toString())
      apiCallsUsed++

      if (res.status === 403) {
        console.log('[Bokjiro-Central] API returned 403 - 활용신청 필요')
        break
      }
      if (!res.ok) throw new Error(`Bokjiro Central API error: ${res.status}`)

      const xml = await res.text()
      totalCount = getTotalCount(xml) || totalCount
      const items = parseXmlItems(xml)

      if (items.length === 0) {
        isComplete = true
        break
      }

      for (const item of items) {
        if (!item.servId) { skipped++; continue }
        const externalId = `bokjiro-central-${item.servId}`

        const eligibilityTexts = [
          item.servDgst,
          item.trgterIndvdlNmArray,
          item.srvPvsnNm,
        ].filter(Boolean) as string[]

        const extraction = extractEligibility(eligibilityTexts, item.servNm)

        // 복지로는 기본 personal, 사업자 키워드가 있으면 both
        const hasBizKeywords = /기업|사업자|소상공인|법인|자영업/.test(item.servDgst || '')
        const serviceType = hasBizKeywords ? 'both' : 'personal'

        const record = {
          title: item.servNm,
          organization: item.jurMnofNm || '중앙정부',
          category: '기타' as const,
          start_date: null as string | null,
          end_date: null as string | null,
          detail_url: `https://www.bokjiro.go.kr/ssis-tbu/twataa/wlfareInfo/moveTWAT52011M.do?wlfareInfoId=${item.servId}`,
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
          source: 'bokjiro-central',
          external_id: externalId,
          raw_eligibility_text: item.servDgst || null,
          raw_exclusion_text: null as string | null,
          raw_preference_text: item.trgterIndvdlNmArray || null,
          extraction_confidence: extraction.confidence,
          service_type: serviceType,
          target_age_min: extraction.ageMin,
          target_age_max: extraction.ageMax,
          target_household_types: extraction.householdTypes.length > 0 ? extraction.householdTypes : null,
          target_income_levels: extraction.incomeLevels.length > 0 ? extraction.incomeLevels : null,
          target_employment_status: extraction.employmentStatus.length > 0 ? extraction.employmentStatus : null,
          benefit_categories: extraction.benefitCategories.length > 0 ? extraction.benefitCategories : null,
        }

        const { error } = await supabase
          .from('supports')
          .upsert(record, { onConflict: 'external_id' })

        if (error) { skipped++; continue }
        fetched++
      }

      // 커서 갱신
      const processedIndex = (pageNo - 1) * 10 + items.length - 1
      await supabase.from('sync_cursors').upsert({
        source: 'bokjiro-central',
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
        source: 'bokjiro-central',
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
        programs_inserted: 0,
        programs_updated: 0,
        programs_skipped: skipped,
        api_calls_used: apiCallsUsed,
        metadata: { totalCount, isComplete, pageNo },
      }).eq('id', logId)
    }

    return { fetched, inserted: 0, updated: 0, skipped, apiCallsUsed, isComplete }
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
