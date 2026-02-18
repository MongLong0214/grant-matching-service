export interface BokjiroLocalItem {
  servId: string
  servNm: string
  ctpvNm: string
  sggNm?: string
  jurMnofNm: string
  servDgst: string
  trgterIndvdlNmArray?: string
  srvPvsnNm?: string
}

export function parseServListItems(xmlText: string): BokjiroLocalItem[] {
  const items: BokjiroLocalItem[] = []
  const itemRegex = /<servList>([\s\S]*?)<\/servList>/g
  let match

  while ((match = itemRegex.exec(xmlText)) !== null) {
    const block = match[1]
    const get = (tag: string) => {
      const m = block.match(new RegExp(`<${tag}>(.*?)</${tag}>`))
      return m ? m[1].trim() : ''
    }
    items.push({
      servId: get('servId'),
      servNm: get('servNm'),
      ctpvNm: get('ctpvNm'),
      sggNm: get('sggNm'),
      jurMnofNm: get('jurMnofNm'),
      servDgst: get('servDgst'),
      trgterIndvdlNmArray: get('trgterIndvdlNmArray'),
      srvPvsnNm: get('srvPvsnNm'),
    })
  }
  return items
}

