import { createClient } from '@supabase/supabase-js'
import { extractEligibility } from '@/lib/extraction'
import { fetchWithRetry } from '@/lib/fetch-with-retry'

// 과학기술정보통신부_사업공고
const MSIT_RND_API_URL = 'https://apis.data.go.kr/1721000/msitannouncementinfo/businessAnnouncMentList'

interface MsitRndItem {
  subject: string          // 사업공고명 (title)
  deptName?: string        // 부서명
  pressDt?: string         // 게시일 (yyyy-MM-dd or yyyyMMdd)
  managerTel?: string      // 담당자 연락처
  viewUrl?: string         // 상세 URL
  files?: string           // 첨부파일
}

// XML 응답에서 item 목록과 totalCount를 파싱
function parseXmlResponse(xmlText: string): { items: MsitRndItem[], totalCount: number } {
  const items: MsitRndItem[] = []

  // totalCount 추출
  const totalCountMatch = xmlText.match(/<totalCount>(\d+)<\/totalCount>/)
  const totalCount = totalCountMatch ? parseInt(totalCountMatch[1], 10) : 0

  // resultCode 확인 (에러 응답 감지)
  const resultCodeMatch = xmlText.match(/<resultCode>(\d+)<\/resultCode>/)
  if (resultCodeMatch && resultCodeMatch[1] !== '00') {
    const msgMatch = xmlText.match(/<resultMsg>(.*?)<\/resultMsg>/)
    throw new Error(`MSIT R&D API resultCode: ${resultCodeMatch[1]} - ${msgMatch?.[1] || 'Unknown'}`)
  }

  const itemRegex = /<item>([\s\S]*?)<\/item>/g
  let match

  while ((match = itemRegex.exec(xmlText)) !== null) {
    const block = match[1]
    const get = (tag: string): string => {
      const m = block.match(new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?</${tag}>`))
      return m ? m[1].trim() : ''
    }
    items.push({
      subject: get('subject'),
      deptName: get('deptName') || undefined,
      pressDt: get('pressDt') || undefined,
      managerTel: get('managerTel') || undefined,
      viewUrl: get('viewUrl') || undefined,
      files: get('files') || undefined,
    })
  }

  return { items, totalCount }
}

function parseDate(dateStr?: string): string | null {
  if (!dateStr) return null
  // yyyy-MM-dd 형식이면 그대로
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr
  // yyyyMMdd 형식
  const cleaned = dateStr.replace(/[^0-9]/g, '')
  if (cleaned.length !== 8) return null
  return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6, 8)}`
}

function mapCategory(bizType?: string): string {
  if (!bizType) return '기술'
  const map: Record<string, string> = {
    'R&D': '기술', '연구': '기술', '기술': '기술', '개발': '기술',
    '인력': '인력', '교육': '인력', '양성': '인력',
    '인프라': '경영', '기반': '경영',
    '국제': '수출', '글로벌': '수출', '협력': '수출',
    '창업': '창업',
  }
  for (const [keyword, category] of Object.entries(map)) {
    if (bizType.includes(keyword)) return category
  }
  return '기술'
}

export async function syncMsitRnd(): Promise<{
  fetched: number
  inserted: number
  updated: number
  skipped: number
  apiCallsUsed: number
}> {
  const apiKey = process.env.MSIT_RND_API_KEY
  if (!apiKey) {
    console.log('[MSIT-RnD] MSIT_RND_API_KEY not set, skipping sync')
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
  let inserted = 0
  let updated = 0
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

      const extraction = extractEligibility(eligibilityTexts)

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
