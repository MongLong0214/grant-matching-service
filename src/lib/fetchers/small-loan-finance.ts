import { createClient } from '@supabase/supabase-js'
import { extractEligibility } from '@/lib/extraction'
import { fetchWithRetry } from '@/lib/fetch-with-retry'

// 금융위원회_서민금융상품기본정보
const API_URL = 'https://apis.data.go.kr/1160100/service/GetSmallLoanFinanceInstituteInfoService/getOrdinaryFinanceInfo'

interface SmallLoanItem {
  basYm?: string             // 기준년월
  snq?: string               // 순번 (고유 식별)
  finPrdNm?: string          // 금융상품명
  ofrInstNm?: string         // 취급기관명
  trgt?: string              // 지원대상
  irt?: string               // 금리
  irtCtg?: string            // 금리구분
  lnLmt?: string             // 대출한도
  rdptMthd?: string          // 상환방법
  maxTotLnTrm?: string       // 최대대출기간
  usge?: string              // 용도
  instCtg?: string           // 기관구분
  suprTgtDtlCond?: string    // 지원대상 상세조건
  age?: string               // 나이조건
  jnMthd?: string            // 가입방법
  cnpl?: string              // 문의처
  tgtFltr?: string           // 대상필터
  hdlInstDtlVw?: string      // 취급기관 상세
  prdExisYn?: string         // 상품존재여부
  prdCtg?: string            // 상품카테고리
  prdNm?: string             // 상품구분명
  mgmDln?: string            // 관리기한
  rsdAreaPamtEqltIstm?: string // 지역
  incm?: string              // 소득조건
  crdtSc?: string            // 신용점수 조건
}

export async function syncSmallLoanFinance(): Promise<{
  fetched: number
  inserted: number
  updated: number
  skipped: number
  apiCallsUsed: number
}> {
  const apiKey = process.env.DATA_GO_KR_API_KEY
  if (!apiKey) {
    console.log('[SmallLoanFinance] DATA_GO_KR_API_KEY not set, skipping sync')
    return { fetched: 0, inserted: 0, updated: 0, skipped: 0, apiCallsUsed: 0 }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, serviceKey)

  const { data: syncLog } = await supabase
    .from('sync_logs')
    .insert({ source: 'small-loan-finance', status: 'running' })
    .select()
    .single()
  const logId = syncLog?.id

  let apiCallsUsed = 0
  let inserted = 0
  let updated = 0
  let skipped = 0
  const allItems: SmallLoanItem[] = []

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

      if (res.status === 404 || res.status === 500) {
        const errBody = await res.text()
        console.log(`[SmallLoanFinance] API returned ${res.status} (${errBody.trim()}) - API not found or key not authorized`)
        break
      }

      if (!res.ok) {
        throw new Error(`SmallLoanFinance API error: ${res.status} ${res.statusText}`)
      }

      const text = await res.text()

      // XML 응답 방어
      let json: Record<string, unknown>
      try {
        json = JSON.parse(text)
      } catch {
        console.log('[SmallLoanFinance] Non-JSON response, attempting XML parse')
        const errorMatch = text.match(/<returnReasonCode>(.*?)<\/returnReasonCode>/)
        const msgMatch = text.match(/<returnAuthMsg>(.*?)<\/returnAuthMsg>/)
        if (errorMatch) {
          throw new Error(`API XML error: ${errorMatch[1]} - ${msgMatch?.[1] || 'Unknown'}`)
        }
        console.log('[SmallLoanFinance] Unparseable response, stopping pagination')
        break
      }

      // data.go.kr 표준 응답: { response: { header, body: { items: { item: [...] }, totalCount } } }
      const body = (json?.response as Record<string, unknown>)?.body as Record<string, unknown> | undefined
      const items = body?.items as Record<string, unknown> | undefined
      let itemList = (items?.item || []) as SmallLoanItem[]
      const totalCount = (body?.totalCount || 0) as number

      // 단건 응답 시 배열로 변환
      if (itemList && !Array.isArray(itemList)) {
        itemList = [itemList]
      }

      if (!Array.isArray(itemList) || itemList.length === 0) break
      allItems.push(...itemList)

      console.log(`[SmallLoanFinance] Page ${pageNo}: ${itemList.length} items (total: ${allItems.length}/${totalCount})`)

      if (allItems.length >= totalCount) break
      pageNo++

      if (pageNo > 50) break

      // API rate limit 방지
      await new Promise((r) => setTimeout(r, 100))
    }

    console.log(`[SmallLoanFinance] Fetched ${allItems.length} items, processing...`)

    for (const item of allItems) {
      // 기준년월 + 순번으로 고유 ID 생성 (API 필드: basYm, snq)
      const productKey = `${item.basYm || ''}_${item.snq || ''}_${item.finPrdNm || ''}`
      if (!item.finPrdNm) { skipped++; continue }
      const externalId = `small-loan-${productKey}`

      const eligibilityTexts = [
        item.trgt,
        item.suprTgtDtlCond,
        item.tgtFltr,
      ].filter(Boolean) as string[]

      const extraction = extractEligibility(eligibilityTexts, item.finPrdNm)

      // 대출한도 + 금리 정보를 amount 필드에 조합
      const amountParts: string[] = []
      if (item.lnLmt) amountParts.push(`한도: ${item.lnLmt}`)
      if (item.irt) amountParts.push(`금리: ${item.irt}`)
      if (item.maxTotLnTrm) amountParts.push(`기간: ${item.maxTotLnTrm}`)

      const record = {
        title: item.finPrdNm || '서민금융상품',
        organization: item.ofrInstNm || '금융위원회',
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
        amount: amountParts.length > 0 ? amountParts.join(' / ') : null,
        is_active: true,
        source: 'small-loan-finance',
        external_id: externalId,
        raw_eligibility_text: item.trgt || null,
        raw_exclusion_text: null as string | null,
        raw_preference_text: item.suprTgtDtlCond || null,
        extraction_confidence: extraction.confidence,
        service_type: 'personal',
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
        if (error) { skipped++; continue }
        updated++
      } else {
        const { error } = await supabase.from('supports').insert(record)
        if (error) { skipped++; continue }
        inserted++
      }
    }

    console.log(`[SmallLoanFinance] Done: ${inserted} inserted, ${updated} updated, ${skipped} skipped`)

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
    console.error('[SmallLoanFinance] Sync failed:', error)
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
