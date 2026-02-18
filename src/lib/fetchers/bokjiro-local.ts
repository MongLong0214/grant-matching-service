import { extractEligibility, CTPV_TO_REGION } from '@/lib/extraction'
import { fetchWithRetry } from '@/lib/fetch-with-retry'
import { parseServListItems } from './bokjiro-local-helpers'
import {
  createSyncClient, startSyncLog, completeSyncLog, failSyncLog,
  upsertSupport, getTotalCount,
} from './sync-helpers'

// 보건복지부_지자체 복지 상세정보
const BOKJIRO_LOCAL_URL = 'https://apis.data.go.kr/B554287/LocalGovernmentWelfareInformations/LcgvWelfarelist'

export async function syncBokjiroLocal(): Promise<{
  fetched: number
  inserted: number
  updated: number
  skipped: number
  apiCallsUsed: number
  isComplete: boolean
}> {
  const apiKey = process.env.DATA_GO_KR_API_KEY
  if (!apiKey) {
    console.log('[Bokjiro-Local] DATA_GO_KR_API_KEY not set, skipping sync')
    return { fetched: 0, inserted: 0, updated: 0, skipped: 0, apiCallsUsed: 0, isComplete: false }
  }
  const supabase = createSyncClient()

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

  const logId = await startSyncLog(supabase, 'bokjiro-local')

  const MAX_API_CALLS = 90
  let apiCallsUsed = 0
  let inserted = 0
  let skipped = 0
  let totalCount = 0
  let isComplete = false

  try {
    while (apiCallsUsed < MAX_API_CALLS) {
      const url = new URL(BOKJIRO_LOCAL_URL)
      url.searchParams.set('serviceKey', apiKey)
      url.searchParams.set('pageNo', String(pageNo))
      url.searchParams.set('numOfRows', '10')

      const res = await fetchWithRetry(url.toString())
      apiCallsUsed++

      if (res.status === 403) {
        console.log('[Bokjiro-Local] API returned 403 - 활용신청 필요')
        break
      }
      if (!res.ok) throw new Error(`Bokjiro Local API error: ${res.status}`)

      const xml = await res.text()
      totalCount = getTotalCount(xml) || totalCount
      const items = parseServListItems(xml)

      if (items.length === 0) {
        isComplete = true
        break
      }

      for (const item of items) {
        if (!item.servId) { skipped++; continue }
        // bokjiro-central과 동일 API → external_id 통합. local이 ctpvNm 기반 지역 매핑으로 더 정확하므로 덮어씀
        const externalId = `bokjiro-${item.servId}`

        // ctpvNm으로 구조화된 지역 매핑
        const ctpvRegion = item.ctpvNm ? CTPV_TO_REGION[item.ctpvNm] : null
        const eligibilityTexts = [item.servDgst, item.trgterIndvdlNmArray, item.srvPvsnNm].filter(Boolean) as string[]
        const extraction = extractEligibility(eligibilityTexts, item.servNm, item.jurMnofNm || item.ctpvNm)

        // ctpvNm이 있으면 구조화된 지역 사용 (텍스트 추출보다 신뢰도 높음)
        const regions = ctpvRegion ? [ctpvRegion] : extraction.regions

        // 복지로는 기본 personal, 사업자 키워드가 있으면 both
        const hasBizKeywords = /기업|사업자|소상공인|법인|자영업/.test(item.servDgst || '')
        const serviceType = hasBizKeywords ? 'both' : 'personal'

        const record = {
          title: item.servNm,
          organization: item.jurMnofNm || item.ctpvNm || '지자체',
          category: '기타' as const,
          start_date: null as string | null,
          end_date: null as string | null,
          detail_url: `https://www.bokjiro.go.kr/ssis-tbu/twataa/wlfareInfo/moveTWAT52011M.do?wlfareInfoId=${item.servId}`,
          target_regions: regions,
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
          source: 'bokjiro-local',
          external_id: externalId,
          raw_eligibility_text: item.servDgst || null,
          raw_exclusion_text: null as string | null,
          raw_preference_text: item.trgterIndvdlNmArray || null,
          extraction_confidence: {
            ...extraction.confidence,
            regions: ctpvRegion ? 1.0 : extraction.confidence.regions,
          },
          service_type: serviceType,
          target_age_min: extraction.ageMin,
          target_age_max: extraction.ageMax,
          target_household_types: extraction.householdTypes.length > 0 ? extraction.householdTypes : null,
          target_income_levels: extraction.incomeLevels.length > 0 ? extraction.incomeLevels : null,
          target_employment_status: extraction.employmentStatus.length > 0 ? extraction.employmentStatus : null,
          benefit_categories: extraction.benefitCategories.length > 0 ? extraction.benefitCategories : null,
          region_scope: ctpvRegion ? 'regional' : extraction.regionScope,
        }

        const result = await upsertSupport(supabase, record)
        if (result === 'skipped') { skipped++; continue }
        inserted++
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

    const fetched = inserted + skipped
    await completeSyncLog(
      supabase, logId,
      { fetched, inserted, updated: 0, skipped, apiCallsUsed },
      { totalCount, isComplete, pageNo },
    )

    return { fetched, inserted, updated: 0, skipped, apiCallsUsed, isComplete }
  } catch (error) {
    await failSyncLog(supabase, logId, error, apiCallsUsed)
    throw error
  }
}
