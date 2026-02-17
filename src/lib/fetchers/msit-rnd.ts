import { createClient } from '@supabase/supabase-js'
import { extractEligibility } from '@/lib/extraction'
import { fetchWithRetry } from '@/lib/fetch-with-retry'
import { type MsitRndItem, parseXmlResponse, parseDate, mapCategory } from './msit-rnd-parser'

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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, serviceKey)

  const { data: syncLog } = await supabase
    .from('sync_logs')
    .insert({ source: 'msit-rnd', status: 'running' })
    .select()
    .single()
  const logId = syncLog?.id

  let apiCallsUsed = 0
  let fetched = 0
  let skipped = 0
  const allItems: MsitRndItem[] = []

  try {
    let pageNo = 1
    const numOfRows = 100

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

    for (const item of allItems) {
      if (!item.subject) { skipped++; continue }
      // subject를 해시하여 고유 ID 생성 (이 API는 별도 ID 필드가 없음)
      const idBase = `${item.subject}-${item.pressDt || ''}`
      const externalId = `msit-rnd-${Buffer.from(idBase).toString('base64url').slice(0, 32)}`

      const eligibilityTexts = [
        item.subject,
      ].filter(Boolean) as string[]

      const extraction = extractEligibility(eligibilityTexts, undefined, item.deptName)

      const record = {
        title: item.subject,
        organization: item.deptName || '과학기술정보통신부',
        category: mapCategory(item.deptName),
        start_date: parseDate(item.pressDt),
        end_date: null as string | null,
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
        amount: null as string | null,
        is_active: true,
        source: 'msit-rnd',
        external_id: externalId,
        raw_eligibility_text: item.subject || null,
        raw_exclusion_text: null as string | null,
        raw_preference_text: null as string | null,
        extraction_confidence: extraction.confidence,
        service_type: 'business',
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

      if (error) { skipped++; continue }
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
