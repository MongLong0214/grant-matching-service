import { createClient } from '@supabase/supabase-js'
import { extractEligibility } from '@/lib/extraction'
import { fetchWithRetry } from '@/lib/fetch-with-retry'

// 금융위원회_사회적금융 지원정보
const API_URL = 'https://apis.data.go.kr/1160100/service/GetFSSocialFinanSupInfoService/getScfinInfoSvcInfo'

// 실제 API 응답 필드 (2026-02 확인)
interface SocialFinanceItem {
  basYm?: string             // 기준년월
  sprtBizNm?: string         // 지원사업명
  sprtTrgtNm?: string        // 지원대상명
  sprtTrgtDtlCn?: string     // 지원대상 상세
  sprtMthdCn?: string        // 지원방법
  sprvsnInstNm?: string      // 감독기관
  operInstNm?: string        // 운영기관
  bizOtlCn?: string          // 사업개요
  offrSchdlCn?: string       // 제공일정
  offrSchdlDtlCn?: string    // 제공일정 상세
  rfrcCn?: string            // 참고내용
  aplyMthdCn?: string        // 신청방법
  refCn?: string             // 참조내용
}

export async function syncSocialFinance(): Promise<{
  fetched: number
  inserted: number
  updated: number
  skipped: number
  apiCallsUsed: number
}> {
  const apiKey = process.env.DATA_GO_KR_API_KEY
  if (!apiKey) {
    console.log('[SocialFinance] DATA_GO_KR_API_KEY not set, skipping sync')
    return { fetched: 0, inserted: 0, updated: 0, skipped: 0, apiCallsUsed: 0 }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, serviceKey)

  const { data: syncLog } = await supabase
    .from('sync_logs')
    .insert({ source: 'social-finance', status: 'running' })
    .select()
    .single()
  const logId = syncLog?.id

  let apiCallsUsed = 0
  let inserted = 0
  let updated = 0
  let skipped = 0
  const allItems: SocialFinanceItem[] = []

  try {
    let pageNo = 1
    const numOfRows = 100

    while (true) {
      const url = new URL(API_URL)
      url.searchParams.set('serviceKey', apiKey)
      url.searchParams.set('pageNo', String(pageNo))
      url.searchParams.set('numOfRows', String(numOfRows))
      url.searchParams.set('resultType', 'json')

      const res = await fetchWithRetry(url.toString())
      apiCallsUsed++

      if (res.status === 403 || res.status === 404 || res.status === 500) {
        const errBody = await res.text()
        console.log(`[SocialFinance] API returned ${res.status} (${errBody.slice(0, 200).trim()})`)
        break
      }

      if (!res.ok) {
        console.log(`[SocialFinance] API error: ${res.status} ${res.statusText}`)
        break
      }

      const text = await res.text()

      let itemList: SocialFinanceItem[] = []
      let totalCount = 0

      try {
        const json = JSON.parse(text)
        const body = (json?.response as Record<string, unknown>)?.body as Record<string, unknown> | undefined
        if (body) {
          totalCount = (body.totalCount as number) || 0
          const itemsField = body.items as Record<string, unknown> | undefined
          const rawItems = itemsField?.item
          if (rawItems && !Array.isArray(rawItems)) {
            itemList = [rawItems as SocialFinanceItem]
          } else {
            itemList = (rawItems as SocialFinanceItem[]) || []
          }
        }
      } catch {
        // XML 에러 체크
        const errorMatch = text.match(/<returnReasonCode>(.*?)<\/returnReasonCode>/)
        if (errorMatch) {
          const msgMatch = text.match(/<returnAuthMsg>(.*?)<\/returnAuthMsg>/)
          console.log(`[SocialFinance] API XML error: ${errorMatch[1]} - ${msgMatch?.[1] || 'Unknown'}`)
          break
        }
        console.log('[SocialFinance] Non-JSON/non-XML response, stopping')
        break
      }

      if (!Array.isArray(itemList) || itemList.length === 0) break
      allItems.push(...itemList)

      console.log(`[SocialFinance] Page ${pageNo}: ${itemList.length} items (total: ${allItems.length}/${totalCount})`)

      if (totalCount > 0 && allItems.length >= totalCount) break
      pageNo++
      if (pageNo > 50) break

      await new Promise((r) => setTimeout(r, 100))
    }

    console.log(`[SocialFinance] Fetched ${allItems.length} items, processing...`)

    for (const item of allItems) {
      const title = item.sprtBizNm
      if (!title) { skipped++; continue }

      // basYm + 사업명으로 고유 ID
      const externalId = `social-finance-${item.basYm || 'unknown'}-${title}`

      const eligibilityTexts = [
        item.sprtTrgtNm,
        item.sprtTrgtDtlCn,
        item.bizOtlCn,
        item.sprtMthdCn,
      ].filter(Boolean) as string[]

      const extraction = extractEligibility(eligibilityTexts, title)

      const record = {
        title,
        organization: item.operInstNm || item.sprvsnInstNm || '금융위원회',
        category: '금융',
        start_date: null as string | null,
        end_date: null as string | null,
        detail_url: '',
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
        source: 'social-finance',
        external_id: externalId,
        raw_eligibility_text: item.sprtTrgtDtlCn || item.sprtTrgtNm || null,
        raw_exclusion_text: null as string | null,
        raw_preference_text: item.sprtMthdCn || null,
        extraction_confidence: extraction.confidence,
        service_type: 'both' as const,
        target_age_min: extraction.ageMin,
        target_age_max: extraction.ageMax,
        target_household_types: extraction.householdTypes.length > 0 ? extraction.householdTypes : null,
        target_income_levels: extraction.incomeLevels.length > 0 ? extraction.incomeLevels : null,
        target_employment_status: extraction.employmentStatus.length > 0 ? extraction.employmentStatus : null,
        benefit_categories: extraction.benefitCategories.length > 0 ? extraction.benefitCategories : null,
      }

      const { data: existing } = await supabase
        .from('supports')
        .select('id')
        .eq('external_id', externalId)
        .maybeSingle()

      if (existing) {
        const { error } = await supabase.from('supports').update(record).eq('external_id', externalId)
        if (error) {
          if (skipped < 3) console.error(`[SocialFinance] Update error: ${error.message}`)
          skipped++; continue
        }
        updated++
      } else {
        const { error } = await supabase.from('supports').insert(record)
        if (error) {
          if (skipped < 3) console.error(`[SocialFinance] Insert error: ${error.message}`)
          skipped++; continue
        }
        inserted++
      }
    }

    console.log(`[SocialFinance] Done: ${inserted} inserted, ${updated} updated, ${skipped} skipped`)

    if (logId) {
      await supabase.from('sync_logs').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        programs_fetched: allItems.length,
        programs_inserted: inserted,
        programs_updated: updated,
        programs_skipped: skipped,
        api_calls_used: apiCallsUsed,
      }).eq('id', logId)
    }

    return { fetched: allItems.length, inserted, updated, skipped, apiCallsUsed }
  } catch (error) {
    console.error('[SocialFinance] Sync failed:', error)
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
