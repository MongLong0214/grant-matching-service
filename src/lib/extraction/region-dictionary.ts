/**
 * Korean region variant mapping
 * Maps all known variants of 17 metropolitan regions to standard names
 */
export const REGION_VARIANTS: Record<string, string[]> = {
  '서울': ['서울특별시', '서울시', '서울'],
  '부산': ['부산광역시', '부산시', '부산'],
  '대구': ['대구광역시', '대구시', '대구'],
  '인천': ['인천광역시', '인천시', '인천'],
  '광주': ['광주광역시', '광주시', '광주'],
  '대전': ['대전광역시', '대전시', '대전'],
  '울산': ['울산광역시', '울산시', '울산'],
  '세종': ['세종특별자치시', '세종시', '세종'],
  '경기': ['경기도', '경기'],
  '강원': ['강원특별자치도', '강원도', '강원'],
  '충북': ['충청북도', '충북'],
  '충남': ['충청남도', '충남'],
  '전북': ['전라북도', '전북특별자치도', '전북'],
  '전남': ['전라남도', '전남'],
  '경북': ['경상북도', '경북'],
  '경남': ['경상남도', '경남'],
  '제주': ['제주특별자치도', '제주도', '제주'],
}

/**
 * Bokjiro ctpvNm to standard region mapping
 */
export const CTPV_TO_REGION: Record<string, string> = {}

// Build from REGION_VARIANTS
for (const [region, variants] of Object.entries(REGION_VARIANTS)) {
  for (const variant of variants) {
    CTPV_TO_REGION[variant] = region
  }
}

export function extractRegions(text: string): string[] {
  if (/전\s*국|전지역|지역\s*(제한|무관)|제한\s*없/.test(text)) {
    return []  // empty = all regions match
  }

  const found = new Set<string>()

  for (const [region, variants] of Object.entries(REGION_VARIANTS)) {
    for (const variant of variants) {
      const escaped = variant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      if (new RegExp(escaped).test(text)) {
        found.add(region)
        break
      }
    }
  }

  return Array.from(found)
}
