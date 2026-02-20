export interface BokjiroCentralItem {
  servId: string
  servNm: string
  jurMnofNm: string
  servDgst: string
  srvPvsnNm?: string
  trgterIndvdlNmArray?: string
  lifeNmArray?: string
}

export function parseServListItems(xmlText: string): BokjiroCentralItem[] {
  const items: BokjiroCentralItem[] = []
  const itemRegex = /<servList>([\s\S]*?)<\/servList>/g
  let match

  while ((match = itemRegex.exec(xmlText)) !== null) {
    const block = match[1]
    const get = (tag: string) => {
      const m = block.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`))
      return m ? m[1].trim() : ''
    }
    items.push({
      servId: get('servId'),
      servNm: get('servNm'),
      jurMnofNm: get('jurMnofNm'),
      servDgst: get('servDgst'),
      srvPvsnNm: get('srvPvsnNm'),
      trgterIndvdlNmArray: get('trgterIndvdlNmArray'),
      lifeNmArray: get('lifeNmArray'),
    })
  }
  return items
}

