/**
 * region_scope 3단계 판정 모듈
 * national: 확인된 전국 (중앙정부/부처, "전국" 키워드)
 * regional: 확인된 지역 (추출 성공)
 * unknown: 지역 불명 (추출 실패)
 */
import type { RegionScope } from '@/types'

const NATIONAL_KEYWORDS = [
  '국방부','법무부','환경부','과학기술','중소벤처기업부','산업통상자원부',
  '고용노동부','보건복지부','국토교통부','농림축산식품부','해양수산부',
  '문화체육관광부','교육부','여성가족부','행정안전부','기획재정부',
  '금융위원회','공정거래위원회','국세청','병무청','통계청','소방청',
  '특허청','산림청','기상청','조달청',
]

const NATIONAL_TEXT_PATTERNS = /전국|전지역|지역\s*제한\s*없|지역\s*무관/

export function determineRegionScope(
  regions: string[],
  organization?: string,
  rawText?: string,
): RegionScope {
  if (regions.length > 0) return 'regional'

  // 텍스트에 "전국", "전지역" 등이 있으면 national
  if (rawText && NATIONAL_TEXT_PATTERNS.test(rawText)) return 'national'

  if (!organization) return 'unknown'
  const org = organization.trim()
  if (org === '중앙정부') return 'national'
  if (NATIONAL_KEYWORDS.some(kw => org.includes(kw))) return 'national'

  return 'unknown'
}
