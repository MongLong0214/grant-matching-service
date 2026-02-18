import { REGION_DISTRICTS } from '@/constants'
import { REGION_VARIANTS, CITY_TO_REGION, PARTICLE_STARTS, SIDO_SHORT } from './region-data'

// 데이터 사전 re-export — 외부에서 region-dictionary 경로로 접근하는 코드 호환
export { REGION_VARIANTS } from './region-data'

/**
 * 한글 단어 경계 검증
 * 좌측: 앞 글자가 한글 음절이면 복합어의 일부 → false
 * 우측 (2글자 이하 매칭만): 뒤 글자가 한글 음절이고 조사가 아니면 복합어 → false
 */
function isValidBoundary(text: string, matchIdx: number, matchLen: number): boolean {
  if (matchIdx > 0) {
    const prevCode = text.charCodeAt(matchIdx - 1)
    if (prevCode >= 0xAC00 && prevCode <= 0xD7A3) return false
  }

  if (matchLen <= 2) {
    const afterIdx = matchIdx + matchLen
    if (afterIdx < text.length) {
      const nextCode = text.charCodeAt(afterIdx)
      if (nextCode >= 0xAC00 && nextCode <= 0xD7A3 && !PARTICLE_STARTS.has(text[afterIdx])) {
        return false
      }
    }
  }

  return true
}

// 복지로 ctpvNm → 표준 지역명 매핑 (REGION_VARIANTS + CITY_TO_REGION 기반)
export const CTPV_TO_REGION: Record<string, string> = {}

for (const [region, variants] of Object.entries(REGION_VARIANTS)) {
  for (const variant of variants) {
    CTPV_TO_REGION[variant] = region
  }
}
for (const [city, region] of Object.entries(CITY_TO_REGION)) {
  CTPV_TO_REGION[city] = region
}

export function extractRegionsWithDistricts(text: string): { regions: string[], subRegions: string[] } {
  if (/전\s*국|전지역|지역\s*(제한|무관)|제한\s*없/.test(text)) {
    return { regions: [], subRegions: [] }
  }

  const foundRegions = new Set<string>()
  const foundSubRegions = new Set<string>()

  // 시도 레벨 매칭 (긴 변형 우선, 한글 경계 체크 적용)
  for (const [region, variants] of Object.entries(REGION_VARIANTS)) {
    let matched = false
    for (const variant of variants) {
      let startPos = 0
      while (startPos < text.length) {
        const idx = text.indexOf(variant, startPos)
        if (idx === -1) break
        if (isValidBoundary(text, idx, variant.length)) {
          foundRegions.add(region)
          matched = true
          break
        }
        startPos = idx + 1
      }
      if (matched) break
    }
  }

  // 시/군/구 → 시도 매핑 + subRegion 보존
  for (const [city, region] of Object.entries(CITY_TO_REGION)) {
    let startPos = 0
    while (startPos < text.length) {
      const idx = text.indexOf(city, startPos)
      if (idx === -1) break
      if (isValidBoundary(text, idx, city.length)) {
        foundRegions.add(region)
        foundSubRegions.add(city)
        break
      }
      startPos = idx + 1
    }
  }

  // 시/도가 확정된 경우, 해당 시/도의 구/군 중 텍스트에 나오는 것을 subRegions에 추가
  for (const region of foundRegions) {
    const districts = REGION_DISTRICTS[region]
    if (!districts) continue
    for (const district of districts) {
      if (foundSubRegions.has(district)) continue
      let startPos = 0
      while (startPos < text.length) {
        const idx = text.indexOf(district, startPos)
        if (idx === -1) break
        if (isValidBoundary(text, idx, district.length)) {
          foundSubRegions.add(district)
          break
        }
        startPos = idx + 1
      }
    }
  }

  return {
    regions: Array.from(foundRegions),
    subRegions: Array.from(foundSubRegions),
  }
}

export function extractRegions(text: string): string[] {
  return extractRegionsWithDistricts(text).regions
}

/**
 * 기관명에서 지역 추출을 위한 전처리
 * "대전신용보증재단" → "대전 신용보증재단" (경계 체크 통과하도록)
 */
export function preprocessOrgForRegion(org: string): string {
  for (const sido of SIDO_SHORT) {
    if (org.startsWith(sido) && org.length > sido.length) {
      return sido + ' ' + org.slice(sido.length)
    }
  }
  return org
}
