/** v2 티어명 → v3/v4 티어명 변환 (하위 호환) */

export type TierName = 'tailored' | 'recommended' | 'exploratory'

const TIER_MAP: Record<string, TierName> = {
  exact: 'tailored',
  likely: 'recommended',
  related: 'exploratory',
  tailored: 'tailored',
  recommended: 'recommended',
  exploratory: 'exploratory',
}

export function normalizeTier(tier: string): TierName {
  return TIER_MAP[tier] ?? 'exploratory'
}
