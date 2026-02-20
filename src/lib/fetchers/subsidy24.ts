import { extractEligibility } from '@/lib/extraction'
import { fetchWithRetry } from '@/lib/fetch-with-retry'
import {
  createSyncClient, startSyncLog, completeSyncLog, failSyncLog,
  batchUpsertSupports, mapCategory,
} from './sync-helpers'

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

export async function syncSubsidy24(): Promise<{
  fetched: number
  inserted: number
  updated: number
  skipped: number
  apiCallsUsed: number
}> {
  const apiKey = process.env.SUBSIDY24_API_KEY
  if (!apiKey) {
    console.log('[Subsidy24] SUBSIDY24_API_KEY 미설정, 건너뜀')
    return { fetched: 0, inserted: 0, updated: 0, skipped: 0, apiCallsUsed: 0 }
  }

  const supabase = createSyncClient()
  const logId = await startSyncLog(supabase, 'subsidy24')
  let apiCallsUsed = 0
  let inserted = 0
  let skipped = 0
  const allItems: Subsidy24Item[] = []

  try {
    let page = 1
    const perPage = 1000

    while (true) {
      const url = new URL(SUBSIDY24_API_URL)
      url.searchParams.set('serviceKey', apiKey)
      url.searchParams.set('page', String(page))
      url.searchParams.set('perPage', String(perPage))

      const res = await fetchWithRetry(url.toString())
      apiCallsUsed++

      if (res.status === 429) {
        console.warn(`[Subsidy24] 429 rate limited (${page}페이지), 중단 (${apiCallsUsed} calls)`)
        break
      }
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

    const records: Record<string, unknown>[] = []
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
      let serviceType: 'personal' | 'business' | 'both' = 'both'
      if (userCategory.includes('개인') && !userCategory.includes('법인') && !userCategory.includes('기업')) {
        serviceType = 'personal'
      } else if (!userCategory.includes('개인') && (userCategory.includes('법인') || userCategory.includes('기업'))) {
        serviceType = 'business'
      }

      records.push({
        title: item.서비스명,
        organization: item.부서명 || '행정안전부',
        category: mapCategory(item.서비스분야),
        start_date: null,
        end_date: null,
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
        amount: null,
        is_active: true,
        source: 'subsidy24',
        external_id: externalId,
        raw_eligibility_text: item.서비스목적요약 || null,
        raw_exclusion_text: null,
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
      })
    }

    const batchResult = await batchUpsertSupports(supabase, records, 'Subsidy24')
    inserted = batchResult.inserted
    skipped += batchResult.skipped

    await completeSyncLog(supabase, logId, { fetched: allItems.length, inserted, updated: 0, skipped, apiCallsUsed })
    return { fetched: allItems.length, inserted, updated: 0, skipped, apiCallsUsed }
  } catch (error) {
    await failSyncLog(supabase, logId, error, apiCallsUsed)
    throw error
  }
}
