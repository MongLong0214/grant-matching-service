interface RevenueRange {
  revenueMin: number | null
  revenueMax: number | null
}

function parseKoreanAmount(numStr: string, unit: string): number | null {
  const num = parseFloat(numStr.replace(/,/g, ''))
  if (isNaN(num)) return null

  const multipliers: Record<string, number> = {
    '원': 1,
    '만원': 10_000,
    '만': 10_000,
    '백만원': 1_000_000,
    '백만': 1_000_000,
    '천만원': 10_000_000,
    '천만': 10_000_000,
    '억원': 100_000_000,
    '억': 100_000_000,
    '십억': 1_000_000_000,
    '조': 1_000_000_000_000,
    '조원': 1_000_000_000_000,
  }

  const multiplier = multipliers[unit]
  if (!multiplier) return null
  return Math.round(num * multiplier)
}

/** 규모 기반 매출 범위 추정 (중소기업기본법 기준) */
const NAME_BASED_RANGES: Array<{
  pattern: RegExp
  range: RevenueRange
}> = [
  { pattern: /소상공인/, range: { revenueMin: null, revenueMax: 1_000_000_000 } },
  { pattern: /소기업/, range: { revenueMin: null, revenueMax: 12_000_000_000 } },
  { pattern: /중기업/, range: { revenueMin: null, revenueMax: 150_000_000_000 } },
  { pattern: /중소기업/, range: { revenueMin: null, revenueMax: 150_000_000_000 } },
  // "중소기업기본법 규모기준" — 업종별 매출 상한이 다르나 일반적으로 1500억 이하
  { pattern: /중소기업기본법\s*(?:시행령)?\s*(?:에\s*따른|상의?)?\s*규모\s*기준/, range: { revenueMin: null, revenueMax: 150_000_000_000 } },
]

const REVENUE_PATTERNS: Array<{
  pattern: RegExp
  extract: (m: RegExpMatchArray) => RevenueRange
}> = [
  // 범위 패턴 (먼저 매칭해야 단일 값 패턴에 부분 매칭되는 것을 방지)
  {
    pattern: /(?:매출|매출액|연매출|연간매출|직전연도\s*매출|전년도\s*매출|매출규모)\s*([\d,.]+)\s*(억원?|천만원?|백만원?|만원?|원)\s*(?:~|~|이상|에서)\s*([\d,.]+)\s*(억원?|천만원?|백만원?|만원?|원)\s*(?:이하|미만)?/,
    extract: (m) => ({ revenueMin: parseKoreanAmount(m[1], m[2]), revenueMax: parseKoreanAmount(m[3], m[4]) }),
  },
  // 혼합 단위: "매출 X천만원 ~ X억원"
  {
    pattern: /(?:매출|매출액|연매출)\s*([\d,.]+)\s*(천만원?|만원?)\s*(?:~|~|에서)\s*([\d,.]+)\s*(억원?)\s*(?:이하|미만)?/,
    extract: (m) => ({ revenueMin: parseKoreanAmount(m[1], m[2]), revenueMax: parseKoreanAmount(m[3], m[4]) }),
  },
  // 이하/미만/까지 (상한만)
  {
    pattern: /(?:매출|매출액|연매출|연간매출|직전연도\s*매출|전년도\s*매출|매출규모)\s*(?:이|가)?\s*([\d,.]+)\s*(억원?|천만원?|백만원?|만원?|원)\s*(?:이하|미만|까지)/,
    extract: (m) => ({ revenueMin: null, revenueMax: parseKoreanAmount(m[1], m[2]) }),
  },
  // 이상/초과 (하한만)
  {
    pattern: /(?:매출|매출액|연매출|연간매출|직전연도\s*매출|전년도\s*매출|매출규모)\s*(?:이|가)?\s*([\d,.]+)\s*(억원?|천만원?|백만원?|만원?|원)\s*(?:이상|초과)/,
    extract: (m) => ({ revenueMin: parseKoreanAmount(m[1], m[2]), revenueMax: null }),
  },
  // "연 매출(액) X억원 이하" — 공백 분리된 "연" 접두사
  {
    pattern: /연\s*매출(?:액)?\s*([\d,.]+)\s*(억원?|천만원?|백만원?|만원?)\s*(?:이하|미만)/,
    extract: (m) => ({ revenueMin: null, revenueMax: parseKoreanAmount(m[1], m[2]) }),
  },
  // "연 매출(액) X억원 이상"
  {
    pattern: /연\s*매출(?:액)?\s*([\d,.]+)\s*(억원?|천만원?|백만원?|만원?)\s*(?:이상|초과)/,
    extract: (m) => ({ revenueMin: parseKoreanAmount(m[1], m[2]), revenueMax: null }),
  },
  // "매출 실적이 있는" → 최소 매출 > 0
  {
    pattern: /매출\s*실적이\s*있는/,
    extract: () => ({ revenueMin: 1, revenueMax: null }),
  },
  // "매출이 발생한" / "매출 발생 기업" → 최소 매출 > 0
  {
    pattern: /매출(?:이|이\s+)?발생/,
    extract: () => ({ revenueMin: 1, revenueMax: null }),
  },
]

export function extractRevenueRange(text: string): RevenueRange {
  for (const { pattern, extract } of REVENUE_PATTERNS) {
    const match = text.match(pattern)
    if (match) return extract(match)
  }

  // 명시적 매출 패턴 없으면 규모 기반 추정 (낮은 신뢰도)
  for (const { pattern, range } of NAME_BASED_RANGES) {
    if (pattern.test(text)) return range
  }

  return { revenueMin: null, revenueMax: null }
}
