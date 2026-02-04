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

const REVENUE_PATTERNS: Array<{
  pattern: RegExp
  extract: (m: RegExpMatchArray) => RevenueRange
}> = [
  {
    pattern: /(?:매출|매출액|연매출|연간매출|매출규모)\s*(?:이|가)?\s*([\d,.]+)\s*(억원?|천만원?|백만원?|만원?|원)\s*(?:이하|미만|까지)/,
    extract: (m) => ({ revenueMin: null, revenueMax: parseKoreanAmount(m[1], m[2]) }),
  },
  {
    pattern: /(?:매출|매출액|연매출|연간매출|매출규모)\s*(?:이|가)?\s*([\d,.]+)\s*(억원?|천만원?|백만원?|만원?|원)\s*(?:이상|초과)/,
    extract: (m) => ({ revenueMin: parseKoreanAmount(m[1], m[2]), revenueMax: null }),
  },
  {
    pattern: /(?:매출|연매출)\s*([\d,.]+)\s*(억원?|천만원?|만원?)\s*(?:~|~|이상)\s*([\d,.]+)\s*(억원?|천만원?|만원?)\s*(?:이하|미만)?/,
    extract: (m) => ({ revenueMin: parseKoreanAmount(m[1], m[2]), revenueMax: parseKoreanAmount(m[3], m[4]) }),
  },
  {
    pattern: /연\s*매출(?:액)?\s*([\d,.]+)\s*(억원?|천만원?|만원?)\s*(?:이하|미만)/,
    extract: (m) => ({ revenueMin: null, revenueMax: parseKoreanAmount(m[1], m[2]) }),
  },
]

export function extractRevenueRange(text: string): RevenueRange {
  for (const { pattern, extract } of REVENUE_PATTERNS) {
    const match = text.match(pattern)
    if (match) return extract(match)
  }
  return { revenueMin: null, revenueMax: null }
}
