import { createClient } from '@supabase/supabase-js'
import { extractEligibility } from '@/lib/extraction'
import { fetchWithRetry } from '@/lib/fetch-with-retry'

// 행정안전부_보조금24 (공공서비스 정보) - odcloud API v3
const SUBSIDY24_API_URL = 'https://api.odcloud.kr/api/gov24/v3/serviceList'

interface Subsidy24Item {
  서비스ID: string
  서비스명: string
  소관기관유형?: string
  부서명?: string
  사용자구분?: string
  서비스분야?: string
  서비스목적요약?: string
  선정기준?: string
  상세조회URL?: string
}

function mapCategory(bizType?: string): string {
  if (!bizType) return '기타'
  const map: Record<string, string> = {
    '금융': '금융', '대출': '금융', '보증': '금융',
    '기술': '기술', '연구': '기술',
    '인력': '인력', '고용': '인력', '교육': '인력',
    '수출': '수출', '해외': '수출',
    '창업': '창업', '스타트업': '창업',
    '경영': '경영', '컨설팅': '경영',
  }
  for (const [keyword, category] of Object.entries(map)) {
    if (bizType.includes(keyword)) return category
  }
  return '기타'
}

export async function syncSubsidy24(): Promise<{
  fetched: number
  inserted: number
  updated: number
  skipped: number
  apiCallsUsed: number
}> {
  const apiKey = process.env.SUBSIDY24_API_KEY
  if (!apiKey) {
    console.log('[Subsidy24] SUBSIDY24_API_KEY not set, skipping sync')
    return { fetched: 0, inserted: 0, updated: 0, skipped: 0, apiCallsUsed: 0 }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, serviceKey)

  const { data: syncLog } = await supabase
    .from('sync_logs')
    .insert({ source: 'subsidy24', status: 'running' })
    .select()
    .single()
  const logId = syncLog?.id

  let apiCallsUsed = 0
  let fetched = 0
  let skipped = 0
  const allItems: Subsidy24Item[] = []

  try {
    let page = 1
    const perPage = 100

    while (true) {
      const url = new URL(SUBSIDY24_API_URL)
      url.searchParams.set('serviceKey', apiKey)
      url.searchParams.set('page', String(page))
      url.searchParams.set('perPage', String(perPage))

      const res = await fetchWithRetry(url.toString())
      apiCallsUsed++

      if (!res.ok) {
        throw new Error(`Subsidy24 API error: ${res.status} ${res.statusText}`)
      }

      const json = await res.json()
      // odcloud v3 응답 형식: { currentCount, data: [...], matchCount, page, perPage, totalCount }
      const totalCount = json?.totalCount || 0
      const itemList = json?.data || []

      if (!Array.isArray(itemList) || itemList.length === 0) break
      allItems.push(...itemList)

      if (allItems.length >= totalCount) break
      page++

      if (page > 50) break

      // API rate limit 방지
      await new Promise((r) => setTimeout(r, 100))
    }

    for (const item of allItems) {
      if (!item.서비스ID) { skipped++; continue }
      const externalId = `subsidy24-${item.서비스ID}`

      const eligibilityTexts = [
        item.서비스목적요약,
        item.선정기준,
      ].filter(Boolean) as string[]

      const extraction = extractEligibility(eligibilityTexts, item.서비스명, item.부서명)

      // 사용자구분 기반 service_type 결정
      const userCategory = item.사용자구분 || ''
      let serviceType = 'both'
      if (userCategory.includes('개인') && !userCategory.includes('법인') && !userCategory.includes('기업')) {
        serviceType = 'personal'
      } else if (!userCategory.includes('개인') && (userCategory.includes('법인') || userCategory.includes('기업'))) {
        serviceType = 'business'
      }

      const record = {
        title: item.서비스명,
        organization: item.부서명 || '행정안전부',
        category: mapCategory(item.서비스분야),
        start_date: null as string | null,
        end_date: null as string | null,
        detail_url: item.상세조회URL || `https://www.gov.kr/portal/rcvfvrSvc/dtlEx/${item.서비스ID}`,
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
        source: 'subsidy24',
        external_id: externalId,
        raw_eligibility_text: item.서비스목적요약 || null,
        raw_exclusion_text: null as string | null,
        raw_preference_text: item.선정기준 || null,
        extraction_confidence: extraction.confidence,
        service_type: serviceType,
        target_age_min: extraction.ageMin,
        target_age_max: extraction.ageMax,
        target_household_types: extraction.householdTypes.length > 0 ? extraction.householdTypes : null,
        target_income_levels: extraction.incomeLevels.length > 0 ? extraction.incomeLevels : null,
        target_employment_status: extraction.employmentStatus.length > 0 ? extraction.employmentStatus : null,
        benefit_categories: extraction.benefitCategories.length > 0 ? extraction.benefitCategories : null,
        region_scope: extraction.regionScope,
      }

      const { error } = await supabase
        .from('supports')
        .upsert(record, { onConflict: 'external_id' })

      if (error) {
        // 첫 5건만 에러 로그 출력 (디버깅)
        if (skipped < 5) console.error(`[Subsidy24] Upsert error (${externalId}): ${error.message}`)
        skipped++; continue
      }
      fetched++
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
      }).eq('id', logId)
    }

    return { fetched, inserted: 0, updated: 0, skipped, apiCallsUsed }
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
