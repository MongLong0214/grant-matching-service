import { extractEligibility } from '@/lib/extraction'
import { fetchWithRetry } from '@/lib/fetch-with-retry'
import {
  createSyncClient, startSyncLog, completeSyncLog, failSyncLog,
  upsertSupport, parseJsonItems,
} from './sync-helpers'

// 금융위원회_서민금융상품기본정보
const API_URL = 'https://apis.data.go.kr/1160100/service/GetSmallLoanFinanceInstituteInfoService/getOrdinaryFinanceInfo'

interface SmallLoanItem {
  basYm?: string             // 기준년월
  snq?: string               // 순번
  finPrdNm?: string          // 금융상품명
  ofrInstNm?: string         // 취급기관명
  trgt?: string              // 지원대상
  irt?: string               // 금리
  lnLmt?: string             // 대출한도
  maxTotLnTrm?: string       // 최대대출기간
  suprTgtDtlCond?: string    // 지원대상 상세조건
  tgtFltr?: string           // 대상필터
  rsdAreaPamtEqltIstm?: string // 지역
}

export async function syncSmallLoanFinance(): Promise<{
  fetched: number; inserted: number; updated: number; skipped: number; apiCallsUsed: number
}> {
  const apiKey = process.env.DATA_GO_KR_API_KEY
  if (!apiKey) {
    console.log('[SmallLoanFinance] DATA_GO_KR_API_KEY not set, skipping sync')
    return { fetched: 0, inserted: 0, updated: 0, skipped: 0, apiCallsUsed: 0 }
  }

  const supabase = createSyncClient()
  const logId = await startSyncLog(supabase, 'small-loan-finance')
  let apiCallsUsed = 0, inserted = 0, skipped = 0
  const updated = 0
  const allItems: SmallLoanItem[] = []

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

      if (res.status === 404 || res.status === 500) {
        console.log(`[SmallLoanFinance] ${res.status} — API 키 또는 권한 확인 필요`)
        break
      }
      if (!res.ok) throw new Error(`SmallLoanFinance API 오류: ${res.status} ${res.statusText}`)

      const text = await res.text()
      const parsed = parseJsonItems<SmallLoanItem>(text)
      if (parsed.error === 'UNPARSEABLE') { console.log('[SmallLoanFinance] 파싱 불가 응답'); break }
      if (parsed.error) throw new Error(`API 오류: ${parsed.error}`)
      if (parsed.items.length === 0) break

      allItems.push(...parsed.items)
      console.log(`[SmallLoanFinance] ${pageNo}페이지: ${parsed.items.length}건 (누적: ${allItems.length}/${parsed.totalCount})`)
      if (allItems.length >= parsed.totalCount) break
      pageNo++
      if (pageNo > 50) break
      await new Promise((r) => setTimeout(r, 100))
    }

    console.log(`[SmallLoanFinance] ${allItems.length}건 수집, 처리 시작`)

    for (const item of allItems) {
      if (!item.finPrdNm) { skipped++; continue }
      const productKey = `${item.basYm || ''}_${item.snq || ''}_${item.finPrdNm}`
      const externalId = `small-loan-${productKey}`

      const extraction = extractEligibility(
        [item.trgt, item.suprTgtDtlCond, item.tgtFltr].filter(Boolean) as string[],
        item.finPrdNm, item.ofrInstNm,
      )

      const amountParts: string[] = []
      if (item.lnLmt) amountParts.push(`한도: ${item.lnLmt}`)
      if (item.irt) amountParts.push(`금리: ${item.irt}`)
      if (item.maxTotLnTrm) amountParts.push(`기간: ${item.maxTotLnTrm}`)

      const record = {
        title: item.finPrdNm || '서민금융상품',
        organization: item.ofrInstNm || '금융위원회',
        category: '금융',
        start_date: null as string | null, end_date: null as string | null,
        detail_url: '',
        target_regions: extraction.regions, target_business_types: extraction.businessTypes,
        target_employee_min: extraction.employeeMin, target_employee_max: extraction.employeeMax,
        target_revenue_min: extraction.revenueMin, target_revenue_max: extraction.revenueMax,
        target_business_age_min: extraction.businessAgeMinMonths, target_business_age_max: extraction.businessAgeMaxMonths,
        target_founder_age_min: extraction.founderAgeMin, target_founder_age_max: extraction.founderAgeMax,
        amount: amountParts.length > 0 ? amountParts.join(' / ') : null,
        is_active: true, source: 'small-loan-finance', external_id: externalId,
        raw_eligibility_text: item.trgt || null,
        raw_exclusion_text: null as string | null, raw_preference_text: item.suprTgtDtlCond || null,
        extraction_confidence: extraction.confidence, service_type: 'personal',
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

    console.log(`[SmallLoanFinance] 완료: ${inserted} 신규, ${updated} 갱신, ${skipped} 건너뜀`)
    await completeSyncLog(supabase, logId, { fetched: allItems.length, inserted, updated, skipped, apiCallsUsed })
    return { fetched: allItems.length, inserted, updated, skipped, apiCallsUsed }
  } catch (error) {
    console.error('[SmallLoanFinance] 싱크 실패:', error)
    await failSyncLog(supabase, logId, error, apiCallsUsed)
    throw error
  }
}
