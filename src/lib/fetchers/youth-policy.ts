import { createHash } from 'crypto'
import { extractEligibility } from '@/lib/extraction'
import { fetchWithRetry } from '@/lib/fetch-with-retry'
import {
  createSyncClient, startSyncLog, completeSyncLog, failSyncLog,
  upsertSupport, mapCategory, getXmlField,
} from './sync-helpers'

// 한국고용정보원_청년정책 (온통청년/온라인청년센터)
const YOUTH_POLICY_API_URL = 'https://www.youthcenter.go.kr/go/ythip/getPlcy'

interface YouthPolicyItem {
  bizId?: string             // 사업 고유ID
  polyBizSjnm?: string      // 정책사업명
  polyItcnCn?: string       // 정책소개내용
  sporCn?: string            // 지원내용
  rqutPrdCn?: string         // 신청기간내용
  ageInfo?: string           // 연령정보
  empmSttsCn?: string        // 취업상태내용
  accrRqisCn?: string        // 학력요건
  majRqisCn?: string         // 전공요건
  splzRlmRqisCn?: string     // 특화분야요건
  aditRscn?: string          // 추가단서
  prcpCn?: string            // 참여제한/절차
  cnsgNmor?: string          // 상담기관명
  polyRlmCd?: string         // 정책분야코드
  rqutUrla?: string          // 신청 URL
  mngtMson?: string          // 주관기관
}

// --- 응답 파싱 ---

function parseYouthPolicyResponse(text: string): {
  items: YouthPolicyItem[]
  totalCount: number
  error: string | null
} {
  try {
    const json = JSON.parse(text) as Record<string, unknown>
    const list = json.youthPolicyList
    if (!list) return { items: [], totalCount: 0, error: null }

    const items = Array.isArray(list) ? list as YouthPolicyItem[] : [list as YouthPolicyItem]
    const totalCount = (json.totalCnt as number) || (json.totalCount as number) || items.length

    return { items, totalCount, error: null }
  } catch {
    // JSON 아님 → XML 파싱
    return parseYouthPolicyXml(text)
  }
}

function parseYouthPolicyXml(text: string): {
  items: YouthPolicyItem[]
  totalCount: number
  error: string | null
} {
  // HTML 에러 페이지 감지 (API 서버 장애 시 HTML 반환하는 경우)
  const trimmed = text.trimStart()
  if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')) {
    return { items: [], totalCount: 0, error: 'HTML 에러 페이지 수신 — API 서버 장애 가능성' }
  }

  const errMatch = text.match(/<errorMessage>(.*?)<\/errorMessage>/)
  if (errMatch) return { items: [], totalCount: 0, error: errMatch[1] }

  const totalMatch = text.match(/<totalCnt>(\d+)<\/totalCnt>/) || text.match(/<totalCount>(\d+)<\/totalCount>/)
  const totalCount = totalMatch ? parseInt(totalMatch[1]) : 0

  const items: YouthPolicyItem[] = []
  const blockRegex = /<youthPolicy>([\s\S]*?)<\/youthPolicy>/g
  let match
  while ((match = blockRegex.exec(text)) !== null) {
    const block = match[1]
    const get = (tag: string) => getXmlField(block, tag)
    items.push({
      bizId: get('bizId'),
      polyBizSjnm: get('polyBizSjnm'),
      polyItcnCn: get('polyItcnCn'),
      sporCn: get('sporCn'),
      rqutPrdCn: get('rqutPrdCn'),
      ageInfo: get('ageInfo'),
      empmSttsCn: get('empmSttsCn'),
      accrRqisCn: get('accrRqisCn'),
      majRqisCn: get('majRqisCn'),
      splzRlmRqisCn: get('splzRlmRqisCn'),
      aditRscn: get('aditRscn'),
      prcpCn: get('prcpCn'),
      cnsgNmor: get('cnsgNmor'),
      polyRlmCd: get('polyRlmCd'),
      rqutUrla: get('rqutUrla'),
      mngtMson: get('mngtMson'),
    })
  }

  return { items, totalCount, error: null }
}

// --- 유틸리티 ---

// ageInfo 필드에서 연령 범위 추출 (예: "만 19세 ~ 34세", "19~34세")
function parseAgeInfo(ageInfo: string): { min: number; max: number } | null {
  const m = ageInfo.match(/(?:만\s*)?(\d{1,2})\s*세?\s*[~\-～—]\s*(?:만\s*)?(\d{1,2})\s*세?/)
  return m ? { min: parseInt(m[1], 10), max: parseInt(m[2], 10) } : null
}

// 지원내용에서 service_type 판별 (청년 창업/사업자 지원 포함 시 'both')
function detectServiceType(item: YouthPolicyItem): 'personal' | 'both' {
  const text = [item.sporCn, item.polyItcnCn, item.polyBizSjnm].filter(Boolean).join(' ')
  return /기업|사업자|소상공인|법인|자영업|창업/.test(text) ? 'both' : 'personal'
}

// 정책명 기반 충돌 안전 해시 (bizId 없을 때 fallback)
function hashTitle(title: string): string {
  return createHash('sha256').update(title).digest('hex').slice(0, 16)
}

// --- 동기화 ---

export async function syncYouthPolicy(): Promise<{
  fetched: number; inserted: number; updated: number; skipped: number; apiCallsUsed: number
}> {
  const apiKey = process.env.YOUTH_POLICY_API_KEY
  if (!apiKey) {
    console.log('[YouthPolicy] YOUTH_POLICY_API_KEY 미설정, 건너뜀')
    return { fetched: 0, inserted: 0, updated: 0, skipped: 0, apiCallsUsed: 0 }
  }

  const supabase = createSyncClient()
  const logId = await startSyncLog(supabase, 'youth-policy')
  let apiCallsUsed = 0, inserted = 0, skipped = 0
  const allItems: YouthPolicyItem[] = []

  try {
    let pageIndex = 1
    const display = 100

    while (true) {
      const url = new URL(YOUTH_POLICY_API_URL)
      url.searchParams.set('openApiVlak', apiKey)
      url.searchParams.set('pageIndex', String(pageIndex))
      url.searchParams.set('display', String(display))

      const res = await fetchWithRetry(url.toString())
      apiCallsUsed++

      if (res.status === 403 || res.status === 401) {
        console.log(`[YouthPolicy] ${res.status} 응답 - API 키 확인 필요`)
        break
      }
      if (res.status === 429) {
        console.warn(`[YouthPolicy] 429 rate limited (${pageIndex}페이지), 중단`)
        break
      }
      if (!res.ok) { console.log(`[YouthPolicy] API 오류: ${res.status}`); break }

      const text = await res.text()

      // 첫 페이지 응답 구조 로깅 (API 응답 포맷 검증용)
      if (pageIndex === 1) {
        console.log(`[YouthPolicy] 응답 미리보기 (${text.length}자): ${text.slice(0, 300)}...`)
      }

      const parsed = parseYouthPolicyResponse(text)
      if (parsed.error) { console.log(`[YouthPolicy] 파싱 오류: ${parsed.error}`); break }

      if (parsed.items.length === 0) {
        if (pageIndex === 1) console.warn('[YouthPolicy] 1페이지 응답이 비어있음 - API 키 또는 엔드포인트 확인 필요')
        break
      }

      allItems.push(...parsed.items)
      console.log(`[YouthPolicy] ${pageIndex}페이지: ${parsed.items.length}건 (누적: ${allItems.length}/${parsed.totalCount || '?'})`)

      if (parsed.totalCount > 0 && allItems.length >= parsed.totalCount) break
      pageIndex++
      if (pageIndex > 100) break

      // rate limit 방지 (미확인 API이므로 보수적 간격)
      await new Promise((r) => setTimeout(r, 500))
    }

    console.log(`[YouthPolicy] ${allItems.length}건 수집, 처리 시작`)

    for (const item of allItems) {
      const title = item.polyBizSjnm
      if (!title) { skipped++; continue }

      const uniqueKey = item.bizId || hashTitle(title)
      const externalId = `youth-policy-${uniqueKey}`

      const eligibilityTexts = [
        item.polyItcnCn, item.sporCn, item.ageInfo,
        item.empmSttsCn, item.accrRqisCn, item.aditRscn, item.prcpCn,
      ].filter(Boolean) as string[]

      const org = item.cnsgNmor || item.mngtMson || '한국고용정보원'
      const extraction = extractEligibility(eligibilityTexts, title, org)

      // 연령 정보 보강: extractEligibility가 못 잡은 경우 ageInfo에서 직접 추출
      let ageMin = extraction.ageMin
      let ageMax = extraction.ageMax
      if (item.ageInfo && (ageMin === null || ageMax === null)) {
        const parsed = parseAgeInfo(item.ageInfo)
        if (parsed) {
          ageMin = ageMin ?? parsed.min
          ageMax = ageMax ?? parsed.max
        }
      }

      const record = {
        title,
        organization: org,
        category: mapCategory(item.sporCn, item.polyItcnCn, title),
        start_date: null as string | null,
        end_date: null as string | null,
        detail_url: item.rqutUrla || 'https://www.youthcenter.go.kr/youthPolicy/ythPlcyTotalSearch',
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
        source: 'youth-policy',
        external_id: externalId,
        raw_eligibility_text: item.polyItcnCn || item.sporCn || null,
        raw_exclusion_text: item.prcpCn || null,
        raw_preference_text: item.aditRscn || null,
        extraction_confidence: extraction.confidence,
        service_type: detectServiceType(item),
        target_age_min: ageMin,
        target_age_max: ageMax,
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

    const fetched = allItems.length
    console.log(`[YouthPolicy] 완료: ${inserted} 신규, ${skipped} 건너뜀`)
    await completeSyncLog(supabase, logId, { fetched, inserted, updated: 0, skipped, apiCallsUsed })
    return { fetched, inserted, updated: 0, skipped, apiCallsUsed }
  } catch (error) {
    console.error('[YouthPolicy] 싱크 실패:', error)
    await failSyncLog(supabase, logId, error, apiCallsUsed)
    throw error
  }
}
