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

