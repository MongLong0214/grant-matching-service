import { createClient } from '@supabase/supabase-js'
import { extractEligibility } from '@/lib/extraction'
import { fetchWithRetry } from '@/lib/fetch-with-retry'

// 중소벤처기업부_중소기업 사업 정보 v2 (data.go.kr, XML 응답)
const SME_BIZ_API_URL = 'https://apis.data.go.kr/1421000/mssBizService_v2/getbizList_v2'

interface SmeBizItem {
  pbancSn?: string            // 공고일련번호
  pbancTtl?: string           // 공고제목
  pbancNm?: string            // 공고명 (대체 필드)
  insttNm?: string            // 기관명
  jrsdInsttNm?: string        // 주관기관명
  pbancBgngDt?: string        // 공고시작일
  pbancEndDt?: string         // 공고마감일
  rcptBgngDt?: string         // 접수시작일
  rcptEndDt?: string          // 접수마감일
  pbancTypeCdNm?: string      // 공고유형
  bizNm?: string              // 사업명
  sprtCn?: string             // 지원내용
  trgtJgCn?: string           // 대상자격내용
  bsnsSumryCn?: string        // 사업요약
  excptMtr?: string           // 제외사항
  pbancUrl?: string           // 공고URL
  detailUrl?: string          // 상세URL
}

// 제목/내용 기반 카테고리 매핑
function mapCategory(title?: string, bizNm?: string): string {
  const text = [title, bizNm].filter(Boolean).join(' ')
  if (!text) return '기타'
  const map: Record<string, string> = {
    '금융': '금융', '융자': '금융', '보증': '금융', '투자': '금융', '대출': '금융',
    '기술': '기술', 'R&D': '기술', '연구': '기술', '혁신': '기술',
    '인력': '인력', '고용': '인력', '교육': '인력', '훈련': '인력', '채용': '인력',
    '수출': '수출', '해외': '수출', '글로벌': '수출', '무역': '수출',
    '판로': '내수', '마케팅': '내수', '내수': '내수', '판매': '내수',
    '창업': '창업', '스타트업': '창업', '예비창업': '창업',
    '경영': '경영', '컨설팅': '경영', '멘토링': '경영', '진단': '경영',
  }
  for (const [keyword, category] of Object.entries(map)) {
    if (text.includes(keyword)) return category
  }
  return '기타'
}

function parseDate(dateStr?: string): string | null {
  if (!dateStr) return null
  const cleaned = dateStr.replace(/[^0-9]/g, '')
  if (cleaned.length !== 8) return null
  return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6, 8)}`
}

export async function syncSmeBizAnnouncement(): Promise<{
  fetched: number
  inserted: number
  updated: number
  skipped: number
  apiCallsUsed: number
}> {
  const apiKey = process.env.DATA_GO_KR_API_KEY
  if (!apiKey) {
    console.log('[SmeBizAnnouncement] DATA_GO_KR_API_KEY not set, skipping sync')
    return { fetched: 0, inserted: 0, updated: 0, skipped: 0, apiCallsUsed: 0 }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, serviceKey)

  const { data: syncLog } = await supabase
    .from('sync_logs')
    .insert({ source: 'sme-biz-announcement', status: 'running' })
    .select()
    .single()
  const logId = syncLog?.id

  let apiCallsUsed = 0
  let inserted = 0
  let updated = 0
  let skipped = 0
  const allItems: SmeBizItem[] = []

  try {
    let page = 1
    const perPage = 100

    while (true) {
      const url = new URL(SME_BIZ_API_URL)
      url.searchParams.set('serviceKey', apiKey)
      url.searchParams.set('pageNo', String(page))
      url.searchParams.set('numOfRows', String(perPage))
      const res = await fetchWithRetry(url.toString())
      apiCallsUsed++

      if (res.status === 403) {
        console.log('[SmeBizAnnouncement] API returned 403 - check API key/subscription')
        break
      }

      if (res.status === 404 || res.status === 500) {
        const errBody = await res.text()
        console.log(`[SmeBizAnnouncement] API returned ${res.status} (${errBody.trim()}) - API not found or key not authorized. Apply at data.go.kr`)
        break
      }

      if (!res.ok) {
        console.log(`[SmeBizAnnouncement] API error: ${res.status} ${res.statusText}`)
        break
      }

      const text = await res.text()
      let itemList: SmeBizItem[] = []
      let totalCount = 0

      // XML 응답 파싱 (v2 API는 XML만 반환)
      if (text.trim().startsWith('<')) {
        const totalCountMatch = text.match(/<totalCount>(\d+)<\/totalCount>/)
        totalCount = totalCountMatch ? parseInt(totalCountMatch[1]) : 0

        const resultCodeMatch = text.match(/<resultCode>(\d+)<\/resultCode>/)
        if (resultCodeMatch && resultCodeMatch[1] !== '00') {
          const msgMatch = text.match(/<resultMsg>(.*?)<\/resultMsg>/)
          console.log(`[SmeBizAnnouncement] API error: ${resultCodeMatch[1]} - ${msgMatch?.[1] || 'Unknown'}`)
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
          // 실제 API XML 필드명 (2026-02 확인)
          itemList.push({
            pbancSn: get('itemId') || undefined,
            pbancTtl: get('title') || undefined,
            insttNm: get('writerPosition') || undefined,
            pbancBgngDt: get('applicationStartDate') || undefined,
            pbancEndDt: get('applicationEndDate') || undefined,
            bsnsSumryCn: get('dataContents') || undefined,
            pbancUrl: get('viewUrl') || undefined,
          })
        }
      } else {
        // JSON fallback
        try {
          const json = JSON.parse(text) as Record<string, unknown>
          const body = (json?.response as Record<string, unknown>)?.body as Record<string, unknown> | undefined
          if (body) {
            totalCount = (body.totalCount as number) || 0
            const itemsField = body.items as Record<string, unknown> | undefined
            const rawItems = itemsField?.item
            if (rawItems && !Array.isArray(rawItems)) {
              itemList = [rawItems as SmeBizItem]
            } else {
              itemList = (rawItems as SmeBizItem[]) || []
            }
          }
          if (itemList.length === 0 && json?.data) {
            totalCount = (json.totalCount as number) || 0
            itemList = (json.data as SmeBizItem[]) || []
          }
        } catch {
          console.log('[SmeBizAnnouncement] Non-JSON/XML response received')
          break
        }
      }

      if (!Array.isArray(itemList) || itemList.length === 0) break
      allItems.push(...itemList)

      if (totalCount > 0 && allItems.length >= totalCount) break
      page++

      if (page > 50) break

      // API rate limit 방지
      await new Promise((r) => setTimeout(r, 100))
    }

    console.log(`[SmeBizAnnouncement] Fetched ${allItems.length} items in ${apiCallsUsed} API calls`)

    for (const item of allItems) {
      const itemId = item.pbancSn || item.pbancTtl || item.pbancNm
      if (!itemId) { skipped++; continue }
      const externalId = `sme-biz-announcement-${itemId}`

      const title = item.pbancTtl || item.pbancNm || ''
      const eligibilityTexts = [
        item.trgtJgCn,
        item.sprtCn,
        item.bsnsSumryCn,
        item.excptMtr,
      ].filter(Boolean) as string[]

      const extraction = extractEligibility(eligibilityTexts, title)

      const record = {
        title,
        organization: item.insttNm || item.jrsdInsttNm || '중소벤처기업부',
        category: mapCategory(title, item.bizNm),
        start_date: parseDate(item.pbancBgngDt || item.rcptBgngDt),
        end_date: parseDate(item.pbancEndDt || item.rcptEndDt),
        detail_url: item.pbancUrl || item.detailUrl || '',
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
        source: 'sme-biz-announcement',
        external_id: externalId,
        raw_eligibility_text: item.trgtJgCn || item.bsnsSumryCn || null,
        raw_exclusion_text: item.excptMtr || null,
        raw_preference_text: null as string | null,
        extraction_confidence: extraction.confidence,
        service_type: 'business',
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
