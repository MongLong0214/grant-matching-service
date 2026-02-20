import { extractEligibility } from '@/lib/extraction'
import { fetchWithRetry } from '@/lib/fetch-with-retry'
import { type MsitRndItem, parseXmlResponse } from './msit-rnd-parser'
import {
  createSyncClient, startSyncLog, completeSyncLog, failSyncLog,
  batchUpsertSupports, parseDate, mapCategory,
} from './sync-helpers'

// 과학기술정보통신부_사업공고
const MSIT_RND_API_URL = 'https://apis.data.go.kr/1721000/msitannouncementinfo/businessAnnouncMentList'

export async function syncMsitRnd(): Promise<{
  fetched: number
  inserted: number
  updated: number
  skipped: number
  apiCallsUsed: number
}> {
  const apiKey = process.env.DATA_GO_KR_API_KEY
  if (!apiKey) {
    console.log('[MSIT-RnD] DATA_GO_KR_API_KEY not set, skipping sync')
    return { fetched: 0, inserted: 0, updated: 0, skipped: 0, apiCallsUsed: 0 }
  }

  const supabase = createSyncClient()
  const logId = await startSyncLog(supabase, 'msit-rnd')
  let apiCallsUsed = 0
  let inserted = 0
  let skipped = 0
  const allItems: MsitRndItem[] = []

  try {
    let pageNo = 1
    const numOfRows = 1000

    while (true) {
      const url = new URL(MSIT_RND_API_URL)
      // 이 API는 ServiceKey (대문자 S) 사용
      url.searchParams.set('ServiceKey', apiKey)
      url.searchParams.set('pageNo', String(pageNo))
      url.searchParams.set('numOfRows', String(numOfRows))

      // User-Agent 필수 (없으면 400 "Request Blocked"), XML 응답 파싱
      const res = await fetchWithRetry(url.toString(), {
        headers: { 'User-Agent': 'grant-matching-service/1.0' },
      })
      apiCallsUsed++

      if (res.status === 429) {
        console.warn(`[MSIT-RnD] 429 rate limited (${pageNo}페이지), 중단 (${apiCallsUsed} calls)`)
        break
      }
      if (!res.ok) {
        throw new Error(`MSIT R&D API error: ${res.status} ${res.statusText}`)
      }

      const xmlText = await res.text()
      const { items: itemList, totalCount } = parseXmlResponse(xmlText)

      if (itemList.length === 0) break
      allItems.push(...itemList)

      if (allItems.length >= totalCount) break
      pageNo++

      if (pageNo > 50) break

      await new Promise((r) => setTimeout(r, 100))
    }

    const records: Record<string, unknown>[] = []
    for (const item of allItems) {
      if (!item.subject) { skipped++; continue }
      // subject를 해시하여 고유 ID 생성 (이 API는 별도 ID 필드가 없음)
      const idBase = `${item.subject}-${item.pressDt || ''}`
      const externalId = `msit-rnd-${Buffer.from(idBase).toString('base64url').slice(0, 32)}`

      const extraction = extractEligibility([], item.subject, item.deptName)

      // MSIT는 기술부처이므로 카테고리 미매칭 시 '기술'을 기본값으로 사용
      const cat = mapCategory(item.deptName)

      records.push({
        title: item.subject,
        organization: item.deptName || '과학기술정보통신부',
        category: cat === '기타' ? '기술' : cat,
        start_date: parseDate(item.pressDt),
        end_date: null,
        detail_url: item.viewUrl || 'https://www.msit.go.kr/bbs/list.do?sCode=user&mId=113&mPid=112',
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
        source: 'msit-rnd',
        external_id: externalId,
        raw_eligibility_text: item.subject || null,
        raw_exclusion_text: null,
        raw_preference_text: null,
        extraction_confidence: extraction.confidence,
        service_type: 'business',
        target_age_min: extraction.ageMin,
        target_age_max: extraction.ageMax,
        target_household_types: extraction.householdTypes.length > 0 ? extraction.householdTypes : null,
        target_income_levels: extraction.incomeLevels.length > 0 ? extraction.incomeLevels : null,
        target_employment_status: extraction.employmentStatus.length > 0 ? extraction.employmentStatus : null,
        benefit_categories: extraction.benefitCategories.length > 0 ? extraction.benefitCategories : null,
        region_scope: extraction.regionScope,
      })
    }

    const batchResult = await batchUpsertSupports(supabase, records, 'MSIT-RnD')
    inserted = batchResult.inserted
    skipped += batchResult.skipped

    await completeSyncLog(supabase, logId, { fetched: allItems.length, inserted, updated: 0, skipped, apiCallsUsed })
    return { fetched: allItems.length, inserted, updated: 0, skipped, apiCallsUsed }
  } catch (error) {
    await failSyncLog(supabase, logId, error, apiCallsUsed)
    throw error
  }
}
