import { fetchWithRetry } from '@/lib/fetch-with-retry'

const KSTARTUP_API_URL = 'https://apis.data.go.kr/B552735/kisedKstartupService01/getAnnouncementInformation01'

export interface KStartupItem {
  bizPblancId?: string
  pblancNm?: string
  bizPblancNm?: string
  jrsdInsttNm?: string
  excInsttNm?: string
  pblancEndDt?: string
  rcptEndDt?: string
  bizPrchPtrnCdNm?: string
  sprtField?: string
  trgtJgCn?: string
  sprtCn?: string
  excptMtr?: string
  prfrCn?: string
  detailUrl?: string
}

// XML <col name="field">value</col> 형식에서 필드 매핑
// API 필드명(snake_case) → KStartupItem 필드명(camelCase)
const FIELD_MAP: Record<string, keyof KStartupItem> = {
  'pbanc_sn': 'bizPblancId',
  'biz_pbanc_id': 'bizPblancId',
  'pbanc_nm': 'pblancNm',
  'biz_pbanc_nm': 'bizPblancNm',
  'jrsd_instt_nm': 'jrsdInsttNm',
  'exc_instt_nm': 'excInsttNm',
  'pbanc_end_dt': 'pblancEndDt',
  'pbanc_rcpt_end_dt': 'rcptEndDt',
  'rcpt_end_dt': 'rcptEndDt',

  'biz_prch_ptrn_cd_nm': 'bizPrchPtrnCdNm',
  'sprt_field': 'sprtField',
  'trgt_jg_cn': 'trgtJgCn',
  'sprt_cn': 'sprtCn',
  'excpt_mtr': 'excptMtr',
  'prfr_cn': 'prfrCn',
  'detail_url': 'detailUrl',
}

// K-Startup XML 응답 파싱 (<col name="field">value</col> 형식)
function parseKStartupXml(xmlText: string): { items: KStartupItem[], totalCount: number } {
  const items: KStartupItem[] = []

  const totalCountMatch = xmlText.match(/<totalCount>(\d+)<\/totalCount>/)
  const totalCount = totalCountMatch ? parseInt(totalCountMatch[1], 10) : 0

  // <item> 블록 추출
  const itemRegex = /<item>([\s\S]*?)<\/item>/g
  let match

  while ((match = itemRegex.exec(xmlText)) !== null) {
    const block = match[1]
    const item: KStartupItem = {}

    // <col name="field_name">value</col> 패턴 매칭
    const colRegex = /<col\s+name="([^"]+)">([\s\S]*?)<\/col>/g
    let colMatch

    while ((colMatch = colRegex.exec(block)) !== null) {
      const fieldName = colMatch[1].trim()
      const value = colMatch[2].trim()
      if (!value) continue

      const mappedField = FIELD_MAP[fieldName]
      if (mappedField) {
        item[mappedField] = value
      }
    }

    // item에 최소한 ID나 이름이 있어야 유효
    if (item.bizPblancId || item.pblancNm || item.bizPblancNm) {
      items.push(item)
    }
  }

  return { items, totalCount }
}

export async function fetchKStartup(apiKey: string): Promise<{
  items: KStartupItem[]
  totalCount: number
  apiCallsUsed: number
}> {
  const items: KStartupItem[] = []
  let totalCount = 0
  let apiCallsUsed = 0
  let page = 1
  const perPage = 100

  while (true) {
    const url = new URL(KSTARTUP_API_URL)
    url.searchParams.set('serviceKey', apiKey)
    url.searchParams.set('pageNo', String(page))
    url.searchParams.set('numOfRows', String(perPage))

    const res = await fetchWithRetry(url.toString(), {
      headers: { 'User-Agent': 'grant-matching-service/1.0' },
    })
    apiCallsUsed++

    if (res.status === 403) {
      console.log('[K-Startup] API returned 403 - check API key/subscription')
      return { items: [], totalCount: 0, apiCallsUsed }
    }

    if (res.status === 500 || res.status === 404) {
      const body = await res.text()
      console.log(`[K-Startup] API returned ${res.status} (${body.trim()}) - API key may not be authorized for this service. Apply at data.go.kr`)
      return { items: [], totalCount: 0, apiCallsUsed }
    }

    if (!res.ok) {
      throw new Error(`K-Startup API error: ${res.status} ${res.statusText}`)
    }

    const text = await res.text()

    // XML 파싱 (<col name="field">value</col> 형식)
    const { items: itemList, totalCount: tc } = parseKStartupXml(text)

    if (page === 1) totalCount = tc

    if (itemList.length === 0) break
    items.push(...itemList)

    if (totalCount > 0 && items.length >= totalCount) break
    page++

    if (page > 50) break

    // API rate limit 방지
    await new Promise((r) => setTimeout(r, 100))
  }

  return { items, totalCount, apiCallsUsed }
}
