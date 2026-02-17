import { createClient } from '@supabase/supabase-js'
import { extractEligibility } from '@/lib/extraction'
import { fetchWithRetry } from '@/lib/fetch-with-retry'

// 대출 상품 비교 정보 서비스 (XML only)
const API_URL = 'https://apis.data.go.kr/B553701/LoanProductSearchingInfo/LoanProductSearchingInfo/getLoanProductSearchingInfo'

interface LoanComparisonItem {
  prdt_nm?: string           // 상품명
  fnc_instt_nm?: string      // 금융기관명
  trget?: string             // 대상
  intrt_min?: string         // 최저금리
  intrt_max?: string         // 최고금리
  intrt?: string             // 금리 (단일 필드)
  ln_lmt?: string            // 대출한도
  ln_trm?: string            // 대출기간
  repay_mthd?: string        // 상환방식
  aply_mthd?: string         // 신청방법
  rqrmt?: string             // 필요요건
  prdt_cn?: string           // 상품내용
  etc_cn?: string            // 기타내용
  prdt_cd?: string           // 상품코드
  prdt_se?: string           // 상품구분 (신용대출, 담보대출 등)
  // XML에서 나올 수 있는 대체 필드명
  finPrdNm?: string
  ofrInstNm?: string
  trgt?: string
  irt?: string
  lnLmt?: string
  maxTotLnTrm?: string
  rdptMthd?: string
  suprTgtDtlCond?: string
  tgtFltr?: string
}

export async function syncLoanComparison(): Promise<{
  fetched: number
  inserted: number
  updated: number
  skipped: number
  apiCallsUsed: number
}> {
  const apiKey = process.env.DATA_GO_KR_API_KEY
  if (!apiKey) {
    console.log('[LoanComparison] DATA_GO_KR_API_KEY not set, skipping sync')
    return { fetched: 0, inserted: 0, updated: 0, skipped: 0, apiCallsUsed: 0 }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, serviceKey)

  const { data: syncLog } = await supabase
    .from('sync_logs')
    .insert({ source: 'loan-comparison', status: 'running' })
    .select()
    .single()
  const logId = syncLog?.id

  let apiCallsUsed = 0
  let inserted = 0
  let updated = 0
  let skipped = 0
  const allItems: LoanComparisonItem[] = []

  try {
    let pageNo = 1
    const numOfRows = 100

    while (true) {
      const url = new URL(API_URL)
      url.searchParams.set('serviceKey', apiKey)
      url.searchParams.set('pageNo', String(pageNo))
      url.searchParams.set('numOfRows', String(numOfRows))
      const res = await fetchWithRetry(url.toString())
      apiCallsUsed++

      if (res.status === 404 || res.status === 500) {
        const errBody = await res.text()
        console.log(`[LoanComparison] API returned ${res.status} (${errBody.trim()}) - API not found or key not authorized. Apply at data.go.kr`)
        break
      }

      if (!res.ok) {
        throw new Error(`LoanComparison API error: ${res.status} ${res.statusText}`)
      }

      const text = await res.text()
      let itemList: LoanComparisonItem[] = []
      let totalCount = 0

      // XML 파싱 (이 API는 XML only)
      if (text.trim().startsWith('<')) {
        const totalCountMatch = text.match(/<totalCount>(\d+)<\/totalCount>/)
        totalCount = totalCountMatch ? parseInt(totalCountMatch[1]) : 0

        const resultCodeMatch = text.match(/<resultCode>(\d+)<\/resultCode>/)
        if (resultCodeMatch && resultCodeMatch[1] !== '00') {
          const msgMatch = text.match(/<resultMsg>(.*?)<\/resultMsg>/)
          console.log(`[LoanComparison] API error: ${resultCodeMatch[1]} - ${msgMatch?.[1] || 'Unknown'}`)
          break
        }

        const itemRegex = /<item>([\s\S]*?)<\/item>/g
        let xmlMatch
        while ((xmlMatch = itemRegex.exec(text)) !== null) {
          const block = xmlMatch[1]
          const get = (tag: string): string => {
            const m = block.match(new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?</${tag}>`))
            return m ? m[1].trim() : ''
          }
          // 실제 API XML 필드명 (2026-02 확인: 대부분 소문자)
          itemList.push({
            prdt_nm: get('finprdnm') || undefined,
            fnc_instt_nm: get('ofrinstnm') || undefined,
            trget: get('trgt') || undefined,
            intrt: get('irt') || undefined,
            ln_lmt: get('lnlmt') || undefined,
            ln_trm: get('maxtotlntrm') || undefined,
            repay_mthd: get('rdptmthd') || undefined,
            prdt_cn: get('suprtgtdtlcond') || undefined,
            prdt_cd: get('seq') || undefined,
            rqrmt: get('tgtFltr') || undefined,
            prdt_se: get('prdCtg') || undefined,
          })
        }
      } else {
        // JSON fallback
        try {
          const json = JSON.parse(text) as Record<string, unknown>
          const body = (json?.response as Record<string, unknown>)?.body as Record<string, unknown> | undefined
          const items = body?.items as Record<string, unknown> | undefined
          itemList = (items?.item || []) as LoanComparisonItem[]
          totalCount = (body?.totalCount || 0) as number
          if (itemList && !Array.isArray(itemList)) {
            itemList = [itemList as LoanComparisonItem]
          }
        } catch {
          console.log('[LoanComparison] Unparseable response, stopping pagination')
          break
        }
      }

      if (!Array.isArray(itemList) || itemList.length === 0) break
      allItems.push(...itemList)

      console.log(`[LoanComparison] Page ${pageNo}: ${itemList.length} items (total: ${allItems.length}/${totalCount})`)

      if (allItems.length >= totalCount) break
      pageNo++

      if (pageNo > 50) break

      // API rate limit 방지
      await new Promise((r) => setTimeout(r, 100))
    }

    console.log(`[LoanComparison] Fetched ${allItems.length} items, processing...`)

    for (const item of allItems) {
      // 상품코드 또는 상품명+기관 조합으로 고유 ID 생성
      const productKey = item.prdt_cd || `${item.prdt_nm || ''}_${item.fnc_instt_nm || ''}`
      if (!productKey || productKey === '_') { skipped++; continue }
      const externalId = `loan-comparison-${productKey}`

      const eligibilityTexts = [
        item.trget,
        item.prdt_cn,
        item.rqrmt,
        item.etc_cn,
      ].filter(Boolean) as string[]

      const extraction = extractEligibility(eligibilityTexts, item.prdt_nm)

      // 금리/한도 정보를 amount 필드에 조합
      const amountParts: string[] = []
      if (item.ln_lmt) amountParts.push(`한도: ${item.ln_lmt}`)
      if (item.intrt) {
        amountParts.push(`금리: ${item.intrt}`)
      } else if (item.intrt_min || item.intrt_max) {
        const rateRange = [item.intrt_min, item.intrt_max].filter(Boolean).join('~')
        amountParts.push(`금리: ${rateRange}`)
      }
      if (item.ln_trm) amountParts.push(`기간: ${item.ln_trm}`)
      if (item.prdt_se) amountParts.push(`구분: ${item.prdt_se}`)

      const record = {
        title: item.prdt_nm || '대출상품',
        organization: item.fnc_instt_nm || '서민금융진흥원',
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
        source: 'loan-comparison',
        external_id: externalId,
        raw_eligibility_text: item.trget || null,
        raw_exclusion_text: null as string | null,
        raw_preference_text: item.prdt_cn || null,
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

    console.log(`[LoanComparison] Done: ${inserted} inserted, ${updated} updated, ${skipped} skipped`)

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
    console.error('[LoanComparison] Sync failed:', error)
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
