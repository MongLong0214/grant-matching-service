// 모든 차원별 점수 계산 함수 + 관련 상수

// ─── 사업자 트랙 업종 별칭 ───

export const BUSINESS_TYPE_ALIASES: Record<string, string[]> = {
  '도매 및 소매업': ['도매업', '소매업', '도매 및 소매업'],
  '숙박 및 음식점업': ['숙박업', '음식점업', '숙박 및 음식점업'],
  '운수 및 창고업': ['운수업', '운수 및 창고업'],
  '전문, 과학 및 기술 서비스업': ['전문서비스업', '전문, 과학 및 기술 서비스업'],
  '교육 서비스업': ['교육서비스업', '교육 서비스업'],
  '보건업 및 사회복지 서비스업': ['보건업', '보건업 및 사회복지 서비스업'],
  '기타': ['기타서비스업', '기타', '예술/스포츠'],
}

/** 연령대 문자열 -> 대표 나이 변환 */
export const AGE_GROUP_TO_VALUE: Record<string, number> = {
  '10대': 17, '20대': 25, '30대': 35, '40대': 45, '50대': 55, '60대이상': 70,
}

/** 소득수준 서열 (낮은 순) */
export const INCOME_ORDER = ['기초생활', '차상위', '중위50이하', '중위100이하', '중위100초과']

// ─── 점수 함수 ───

export function scoreRegion(regions: string[], userRegion: string): number {
  if (regions.length === 0) return 1.0
  return regions.includes(userRegion) ? 1.0 : 0.0
}

export function scoreRange(min: number | null, max: number | null, userValue: number, fallbackDenom: number): number {
  if (min !== null && max !== null) {
    if (userValue >= min && userValue <= max) return 1.0
    const range = max - min
    if (range > 0) {
      if (userValue < min) return Math.max(0, 1 - (min - userValue) / range)
      if (userValue > max) return Math.max(0, 1 - (userValue - max) / range)
    }
    // min === max: fallbackDenom으로 점진 감소
    const dist = Math.abs(userValue - min)
    return Math.max(0, 1 - dist / fallbackDenom)
  }
  if (max !== null) {
    if (userValue <= max) return 1.0
    return Math.max(0, 1 - (userValue - max) / Math.max(max, fallbackDenom))
  }
  if (min !== null) {
    if (userValue >= min) return 1.0
    return Math.max(0, 1 - (min - userValue) / Math.max(min, fallbackDenom))
  }
  return 1.0
}

export function expandBusinessType(userType: string): string[] {
  const aliases = BUSINESS_TYPE_ALIASES[userType]
  if (aliases) return [userType, ...aliases]
  return [userType]
}

export function scoreBusinessType(types: string[], userType: string): number {
  if (types.length === 0) return 1.0
  const expanded = expandBusinessType(userType)
  return types.some(t => expanded.includes(t)) ? 1.0 : 0.0
}

export function scoreBusinessAge(min: number | null, max: number | null, userAgeMonths: number): number {
  if (userAgeMonths === -1) {
    if (min !== null && min > 0) return 0.0
    if (max !== null && max >= 0) return 1.0
    return 0.5
  }
  return scoreRange(min, max, userAgeMonths, 12)
}

export function scoreAge(targetMin: number | null, targetMax: number | null, ageGroup: string): number {
  const userAge = AGE_GROUP_TO_VALUE[ageGroup]
  if (!userAge) return 0.5
  if (targetMin === null && targetMax === null) return 1.0
  // 범위 내 -> 1.0, 범위 외 -> 연속 감소
  return scoreRange(targetMin, targetMax, userAge, 10)
}

/** 가구유형 매칭: 목록에 포함되면 1.0, 미포함이면 0.0, 빈 목록 -> 1.0 */
export function scoreHouseholdType(targetTypes: string[] | null, userType: string): number {
  if (!targetTypes || targetTypes.length === 0) return 1.0
  return targetTypes.includes(userType) ? 1.0 : 0.0
}

/** 소득수준 매칭: 서열 기반 */
export function scoreIncomeLevel(targetLevels: string[] | null, userLevel: string): number {
  if (!targetLevels || targetLevels.length === 0) return 1.0
  if (targetLevels.includes(userLevel)) return 1.0

  // 서열 기반: 사용자 소득이 타겟보다 높으면 탈락 가능
  const userIdx = INCOME_ORDER.indexOf(userLevel)
  if (userIdx === -1) return 0.5

  const targetIndices = targetLevels.map(l => INCOME_ORDER.indexOf(l)).filter(i => i !== -1)
  if (targetIndices.length === 0) return 0.5

  const maxTargetIdx = Math.max(...targetIndices)
  // 사용자 소득이 타겟 최대 범위 이내면 해당
  if (userIdx <= maxTargetIdx) return 0.8
  // 초과하면 거리에 따라 감소
  return Math.max(0, 1 - (userIdx - maxTargetIdx) * 0.3)
}

/** 취업상태 매칭: 목록에 포함되면 1.0 */
export function scoreEmploymentStatus(targetStatus: string[] | null, userStatus: string): number {
  if (!targetStatus || targetStatus.length === 0) return 1.0
  return targetStatus.includes(userStatus) ? 1.0 : 0.0
}
