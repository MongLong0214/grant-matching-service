import { extractEligibility } from '@/lib/extraction'
import { fetchWithRetry } from '@/lib/fetch-with-retry'
import {
  createSyncClient, startSyncLog, completeSyncLog, failSyncLog,
  upsertSupport, parseJsonItems,
} from './sync-helpers'

// 금융위원회_사회적금융 지원정보
const API_URL = 'https://apis.data.go.kr/1160100/service/GetFSSocialFinanSupInfoService/getScfinInfoSvcInfo'

interface SocialFinanceItem {
  basYm?: string             // 기준년월
  sprtBizNm?: string         // 지원사업명
  sprtTrgtNm?: string        // 지원대상명
  sprtTrgtDtlCn?: string     // 지원대상 상세
  sprtMthdCn?: string        // 지원방법
  sprvsnInstNm?: string      // 감독기관
  operInstNm?: string        // 운영기관
  bizOtlCn?: string          // 사업개요
}

export async function syncSocialFinance(): Promise<{
  fetched: number; inserted: number; updated: number; skipped: number; apiCallsUsed: number
}> {
  const apiKey = process.env.DATA_GO_KR_API_KEY
  if (!apiKey) {
    console.log('[SocialFinance] DATA_GO_KR_API_KEY not set, skipping sync')
    return { fetched: 0, inserted: 0, updated: 0, skipped: 0, apiCallsUsed: 0 }
  }

  const supabase = createSyncClient()
  const logId = await startSyncLog(supabase, 'social-finance')
  let apiCallsUsed = 0, inserted = 0, skipped = 0
  const updated = 0
  const allItems: SocialFinanceItem[] = []

  try {
    let pageNo = 1
    while (true) {
      const url = new URL(API_URL)
      url.searchParams.set('serviceKey', apiKey)
      url.searchParams.set('pageNo', String(pageNo))
      url.searchParams.set('numOfRows', '100')
      url.searchParams.set('resultType', 'json')
      const res = await fetchWithRetry(url.toString())
      apiCallsUsed++

      if (res.status === 403 || res.status === 404 || res.status === 500) {
        console.log(`[SocialFinance] ${res.status} (${(await res.text()).slice(0, 200).trim()})`)
        break
      }
      if (!res.ok) { console.log(`[SocialFinance] API 오류: ${res.status}`); break }

      const text = await res.text()
      const parsed = parseJsonItems<SocialFinanceItem>(text)
      if (parsed.error) { console.log(`[SocialFinance] 파싱 오류: ${parsed.error}`); break }
      if (parsed.items.length === 0) break

      allItems.push(...parsed.items)
      console.log(`[SocialFinance] ${pageNo}페이지: ${parsed.items.length}건 (누적: ${allItems.length}/${parsed.totalCount})`)
      if (parsed.totalCount > 0 && allItems.length >= parsed.totalCount) break
      pageNo++
      if (pageNo > 50) break
      await new Promise((r) => setTimeout(r, 100))
    }

    console.log(`[SocialFinance] ${allItems.length}건 수집, 처리 시작`)

    for (const item of allItems) {
      const title = item.sprtBizNm
      if (!title) { skipped++; continue }
      const externalId = `social-finance-${item.basYm || 'unknown'}-${title}`

      const extraction = extractEligibility(
        [item.sprtTrgtNm, item.sprtTrgtDtlCn, item.bizOtlCn, item.sprtMthdCn].filter(Boolean) as string[],
        title, item.operInstNm || item.sprvsnInstNm,
      )

      const record = {
        title, organization: item.operInstNm || item.sprvsnInstNm || '금융위원회',
        category: '금융',
        start_date: null as string | null, end_date: null as string | null,
        detail_url: '',
        target_regions: extraction.regions, target_business_types: extraction.businessTypes,
        target_employee_min: extraction.employeeMin, target_employee_max: extraction.employeeMax,
        target_revenue_min: extraction.revenueMin, target_revenue_max: extraction.revenueMax,
        target_business_age_min: extraction.businessAgeMinMonths, target_business_age_max: extraction.businessAgeMaxMonths,
        target_founder_age_min: extraction.founderAgeMin, target_founder_age_max: extraction.founderAgeMax,
        amount: null as string | null,
        is_active: true, source: 'social-finance', external_id: externalId,
        raw_eligibility_text: item.sprtTrgtDtlCn || item.sprtTrgtNm || null,
        raw_exclusion_text: null as string | null, raw_preference_text: item.sprtMthdCn || null,
        extraction_confidence: extraction.confidence, service_type: 'both' as const,
        target_age_min: extraction.ageMin, target_age_max: extraction.ageMax,
        target_household_types: extraction.householdTypes.length > 0 ? extraction.householdTypes : null,
        target_income_levels: extraction.incomeLevels.length > 0 ? extraction.incomeLevels : null,
        target_employment_status: extraction.employmentStatus.length > 0 ? extraction.employmentStatus : null,
        benefit_categories: extraction.benefitCategories.length > 0 ? extraction.benefitCategories : null,
        region_scope: extraction.regionScope,
      }

      const result = await upsertSupport(supabase, record)
      if (result === 'upserted') inserted++
      else skipped++
    }

    console.log(`[SocialFinance] 완료: ${inserted} 신규, ${updated} 갱신, ${skipped} 건너뜀`)
    await completeSyncLog(supabase, logId, { fetched: allItems.length, inserted, updated, skipped, apiCallsUsed })
    return { fetched: allItems.length, inserted, updated, skipped, apiCallsUsed }
  } catch (error) {
    console.error('[SocialFinance] 싱크 실패:', error)
    await failSyncLog(supabase, logId, error, apiCallsUsed)
    throw error
  }
}
