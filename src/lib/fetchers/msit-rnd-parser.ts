export interface MsitRndItem {
  subject: string
  deptName?: string
  pressDt?: string
  managerTel?: string
  viewUrl?: string
  files?: string
}

// XML 응답 파싱 (이 API는 type=json 파라미터를 무시하고 XML만 반환)
export function parseXmlResponse(xmlText: string): { items: MsitRndItem[], totalCount: number } {
  const items: MsitRndItem[] = []

  const totalCountMatch = xmlText.match(/<totalCount>(\d+)<\/totalCount>/)
  const totalCount = totalCountMatch ? parseInt(totalCountMatch[1], 10) : 0

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

export function parseDate(dateStr?: string): string | null {
  if (!dateStr) return null
  // yyyy-MM-dd 형식이면 그대로
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr
  // yyyyMMdd 형식
  const cleaned = dateStr.replace(/[^0-9]/g, '')
  if (cleaned.length !== 8) return null
  return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6, 8)}`
}

export function mapCategory(bizType?: string): string {
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
