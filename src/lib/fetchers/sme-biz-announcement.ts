import { extractEligibility } from '@/lib/extraction'
import { fetchWithRetry } from '@/lib/fetch-with-retry'
import {
  createSyncClient, startSyncLog, completeSyncLog, failSyncLog,
  batchUpsertSupports, getXmlField, parseXmlItems, parseJsonItems, parseDate, mapCategory,
} from './sync-helpers'

// 중소벤처기업부_중소기업 사업 정보 v2 (data.go.kr, XML 응답)
const SME_BIZ_API_URL = 'https://apis.data.go.kr/1421000/mssBizService_v2/getbizList_v2'

interface SmeBizItem {
  pbancSn?: string            // 공고일련번호
  pbancTtl?: string           // 공고제목
  pbancNm?: string            // 공고명
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

function parseXmlToItems(text: string): SmeBizItem[] {
  const { blocks } = parseXmlItems(text)
  return blocks.map(block => ({
    pbancSn: getXmlField(block, 'itemId') || undefined,
    pbancTtl: getXmlField(block, 'title') || undefined,
    insttNm: getXmlField(block, 'writerPosition') || undefined,
    pbancBgngDt: getXmlField(block, 'applicationStartDate') || undefined,
    pbancEndDt: getXmlField(block, 'applicationEndDate') || undefined,
    bsnsSumryCn: getXmlField(block, 'dataContents') || undefined,
    pbancUrl: getXmlField(block, 'viewUrl') || undefined,
  }))
}

export async function syncSmeBizAnnouncement(): Promise<{
  fetched: number; inserted: number; updated: number; skipped: number; apiCallsUsed: number
}> {
  const apiKey = process.env.DATA_GO_KR_API_KEY
  if (!apiKey) {
    console.log('[SmeBizAnnouncement] DATA_GO_KR_API_KEY not set, skipping sync')
    return { fetched: 0, inserted: 0, updated: 0, skipped: 0, apiCallsUsed: 0 }
  }

  const supabase = createSyncClient()
  const logId = await startSyncLog(supabase, 'sme-biz-announcement')
  let apiCallsUsed = 0, inserted = 0, skipped = 0
  const updated = 0
  const allItems: SmeBizItem[] = []

  try {
    let page = 1
    while (true) {
      const url = new URL(SME_BIZ_API_URL)
      url.searchParams.set('serviceKey', apiKey)
      url.searchParams.set('pageNo', String(page))
      url.searchParams.set('numOfRows', '1000')
      const res = await fetchWithRetry(url.toString())
      apiCallsUsed++

      if (res.status === 429) { console.warn(`[SmeBizAnnouncement] 429 rate limited (${page}페이지), 중단 (${apiCallsUsed} calls)`); break }
      if (res.status === 403) { console.log('[SmeBizAnnouncement] 403 — API 키 확인 필요'); break }
      if (res.status === 404 || res.status === 500) { console.log(`[SmeBizAnnouncement] ${res.status}`); break }
      if (!res.ok) { console.log(`[SmeBizAnnouncement] API 오류: ${res.status}`); break }

      const text = await res.text()
      let itemList: SmeBizItem[] = []
      let totalCount = 0

      if (text.trim().startsWith('<')) {
        const xml = parseXmlItems(text)
        totalCount = xml.totalCount
        if (xml.error) { console.log(`[SmeBizAnnouncement] XML 오류: ${xml.error}`); break }
        itemList = parseXmlToItems(text)
      } else {
        const json = parseJsonItems<SmeBizItem>(text)
        if (json.error) { console.log(`[SmeBizAnnouncement] 파싱 오류: ${json.error}`); break }
        totalCount = json.totalCount
        itemList = json.items
      }

      if (itemList.length === 0) break
      allItems.push(...itemList)
      if (totalCount > 0 && allItems.length >= totalCount) break
      page++
      if (page > 50) break
      await new Promise((r) => setTimeout(r, 100))
    }

    console.log(`[SmeBizAnnouncement] ${allItems.length}건 수집, ${apiCallsUsed}회 API 호출`)

    const records: Record<string, unknown>[] = []
    for (const item of allItems) {
      const itemId = item.pbancSn || item.pbancTtl || item.pbancNm
      if (!itemId) { skipped++; continue }
      const externalId = `sme-biz-announcement-${itemId}`
      const title = item.pbancTtl || item.pbancNm || ''

      const extraction = extractEligibility(
        [item.trgtJgCn, item.sprtCn, item.bsnsSumryCn, item.excptMtr].filter(Boolean) as string[],
        title, item.insttNm || item.jrsdInsttNm,
      )

      records.push({
        title, organization: item.insttNm || item.jrsdInsttNm || '중소벤처기업부',
        category: mapCategory(title, item.bizNm),
        start_date: parseDate(item.pbancBgngDt || item.rcptBgngDt),
        end_date: parseDate(item.pbancEndDt || item.rcptEndDt),
        detail_url: item.pbancUrl || item.detailUrl || '',
        target_regions: extraction.regions, target_business_types: extraction.businessTypes,
        target_employee_min: extraction.employeeMin, target_employee_max: extraction.employeeMax,
        target_revenue_min: extraction.revenueMin, target_revenue_max: extraction.revenueMax,
        target_business_age_min: extraction.businessAgeMinMonths, target_business_age_max: extraction.businessAgeMaxMonths,
        target_founder_age_min: extraction.founderAgeMin, target_founder_age_max: extraction.founderAgeMax,
        amount: null, is_active: true,
        source: 'sme-biz-announcement', external_id: externalId,
        raw_eligibility_text: item.trgtJgCn || item.bsnsSumryCn || null,
        raw_exclusion_text: item.excptMtr || null, raw_preference_text: null,
        extraction_confidence: extraction.confidence, service_type: 'business',
        target_age_min: extraction.ageMin, target_age_max: extraction.ageMax,
        target_household_types: extraction.householdTypes.length > 0 ? extraction.householdTypes : null,
        target_income_levels: extraction.incomeLevels.length > 0 ? extraction.incomeLevels : null,
        target_employment_status: extraction.employmentStatus.length > 0 ? extraction.employmentStatus : null,
        benefit_categories: extraction.benefitCategories.length > 0 ? extraction.benefitCategories : null,
        region_scope: extraction.regionScope,
      })
    }

    const batchResult = await batchUpsertSupports(supabase, records, 'SmeBizAnnouncement')
    inserted = batchResult.inserted
    skipped += batchResult.skipped

    await completeSyncLog(supabase, logId, { fetched: allItems.length, inserted, updated, skipped, apiCallsUsed })
    return { fetched: allItems.length, inserted, updated, skipped, apiCallsUsed }
  } catch (error) {
    await failSyncLog(supabase, logId, error, apiCallsUsed)
    throw error
  }
}
