import { extractEligibility } from '@/lib/extraction'
import { fetchWithRetry } from '@/lib/fetch-with-retry'
import {
  createSyncClient, startSyncLog, completeSyncLog, failSyncLog,
  upsertSupport, getXmlField, parseXmlItems, parseJsonItems,
} from './sync-helpers'

// 대출 상품 비교 정보 서비스 (XML only)
const API_URL = 'https://apis.data.go.kr/B553701/LoanProductSearchingInfo/LoanProductSearchingInfo/getLoanProductSearchingInfo'

interface LoanComparisonItem {
  prdt_nm?: string           // 상품명
  fnc_instt_nm?: string      // 금융기관명
  trget?: string             // 대상
  intrt_min?: string         // 최저금리
  intrt_max?: string         // 최고금리
  intrt?: string             // 금리
  ln_lmt?: string            // 대출한도
  ln_trm?: string            // 대출기간
  repay_mthd?: string        // 상환방식
  rqrmt?: string             // 필요요건
  prdt_cn?: string           // 상품내용
  etc_cn?: string            // 기타내용
  prdt_cd?: string           // 상품코드
  prdt_se?: string           // 상품구분
}

function parseXmlToItems(text: string): LoanComparisonItem[] {
  const { blocks } = parseXmlItems(text)
  return blocks.map(block => ({
    prdt_nm: getXmlField(block, 'finprdnm') || undefined,
    fnc_instt_nm: getXmlField(block, 'ofrinstnm') || undefined,
    trget: getXmlField(block, 'trgt') || undefined,
    intrt: getXmlField(block, 'irt') || undefined,
    ln_lmt: getXmlField(block, 'lnlmt') || undefined,
    ln_trm: getXmlField(block, 'maxtotlntrm') || undefined,
    repay_mthd: getXmlField(block, 'rdptmthd') || undefined,
    prdt_cn: getXmlField(block, 'suprtgtdtlcond') || undefined,
    prdt_cd: getXmlField(block, 'seq') || undefined,
    rqrmt: getXmlField(block, 'tgtFltr') || undefined,
    prdt_se: getXmlField(block, 'prdCtg') || undefined,
  }))
}

export async function syncLoanComparison(): Promise<{
  fetched: number; inserted: number; updated: number; skipped: number; apiCallsUsed: number
}> {
  const apiKey = process.env.DATA_GO_KR_API_KEY
  if (!apiKey) {
    console.log('[LoanComparison] DATA_GO_KR_API_KEY not set, skipping sync')
    return { fetched: 0, inserted: 0, updated: 0, skipped: 0, apiCallsUsed: 0 }
  }

  const supabase = createSyncClient()
  const logId = await startSyncLog(supabase, 'loan-comparison')
  let apiCallsUsed = 0, inserted = 0, skipped = 0
  const updated = 0
  const allItems: LoanComparisonItem[] = []

  try {
    let pageNo = 1
    while (true) {
      const url = new URL(API_URL)
      url.searchParams.set('serviceKey', apiKey)
      url.searchParams.set('pageNo', String(pageNo))
      url.searchParams.set('numOfRows', '1000')
      const res = await fetchWithRetry(url.toString())
      apiCallsUsed++

      if (res.status === 429) { console.warn(`[LoanComparison] 429 rate limited (${pageNo}페이지), 중단 (${apiCallsUsed} calls)`); break }
      if (res.status === 404 || res.status === 500) { console.log(`[LoanComparison] ${res.status}`); break }
      if (!res.ok) throw new Error(`LoanComparison API 오류: ${res.status} ${res.statusText}`)

      const text = await res.text()
      let itemList: LoanComparisonItem[] = []
      let totalCount = 0

      if (text.trim().startsWith('<')) {
        const xml = parseXmlItems(text)
        totalCount = xml.totalCount
        if (xml.error) { console.log(`[LoanComparison] XML 오류: ${xml.error}`); break }
        itemList = parseXmlToItems(text)
      } else {
        const json = parseJsonItems<LoanComparisonItem>(text)
        if (json.error === 'UNPARSEABLE') { console.log('[LoanComparison] 파싱 불가 응답'); break }
        if (json.error) { console.log(`[LoanComparison] 파싱 오류: ${json.error}`); break }
        totalCount = json.totalCount
        itemList = json.items
      }

      if (itemList.length === 0) break
      allItems.push(...itemList)
      console.log(`[LoanComparison] ${pageNo}페이지: ${itemList.length}건 (누적: ${allItems.length}/${totalCount})`)
      if (allItems.length >= totalCount) break
      pageNo++
      if (pageNo > 50) break
      await new Promise((r) => setTimeout(r, 100))
    }

    console.log(`[LoanComparison] ${allItems.length}건 수집, 처리 시작`)

    for (const item of allItems) {
      const productKey = item.prdt_cd || `${item.prdt_nm || ''}_${item.fnc_instt_nm || ''}`
      if (!productKey || productKey === '_') { skipped++; continue }
      const externalId = `loan-comparison-${productKey}`

      const extraction = extractEligibility(
        [item.trget, item.prdt_cn, item.rqrmt, item.etc_cn].filter(Boolean) as string[],
        item.prdt_nm, item.fnc_instt_nm,
      )

      // 금리/한도 정보
      const amountParts: string[] = []
      if (item.ln_lmt) amountParts.push(`한도: ${item.ln_lmt}`)
      if (item.intrt) {
        amountParts.push(`금리: ${item.intrt}`)
      } else if (item.intrt_min || item.intrt_max) {
        amountParts.push(`금리: ${[item.intrt_min, item.intrt_max].filter(Boolean).join('~')}`)
      }
      if (item.ln_trm) amountParts.push(`기간: ${item.ln_trm}`)
      if (item.prdt_se) amountParts.push(`구분: ${item.prdt_se}`)

      const record = {
        title: item.prdt_nm || '대출상품',
        organization: item.fnc_instt_nm || '서민금융진흥원',
        category: '금융',
        start_date: null as string | null, end_date: null as string | null,
        detail_url: '',
        target_regions: extraction.regions, target_business_types: extraction.businessTypes,
        target_employee_min: extraction.employeeMin, target_employee_max: extraction.employeeMax,
        target_revenue_min: extraction.revenueMin, target_revenue_max: extraction.revenueMax,
        target_business_age_min: extraction.businessAgeMinMonths, target_business_age_max: extraction.businessAgeMaxMonths,
        target_founder_age_min: extraction.founderAgeMin, target_founder_age_max: extraction.founderAgeMax,
        amount: amountParts.length > 0 ? amountParts.join(' / ') : null,
        is_active: true, source: 'loan-comparison', external_id: externalId,
        raw_eligibility_text: item.trget || null,
        raw_exclusion_text: null as string | null, raw_preference_text: item.prdt_cn || null,
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

    console.log(`[LoanComparison] 완료: ${inserted} 신규, ${updated} 갱신, ${skipped} 건너뜀`)
    await completeSyncLog(supabase, logId, { fetched: allItems.length, inserted, updated, skipped, apiCallsUsed })
    return { fetched: allItems.length, inserted, updated, skipped, apiCallsUsed }
  } catch (error) {
    console.error('[LoanComparison] 싱크 실패:', error)
    await failSyncLog(supabase, logId, error, apiCallsUsed)
    throw error
  }
}
