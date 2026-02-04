interface BusinessAgeRange {
  businessAgeMinMonths: number | null
  businessAgeMaxMonths: number | null
}

const AGE_PATTERNS: Array<{
  pattern: RegExp
  extract: (m: RegExpMatchArray) => BusinessAgeRange
}> = [
  {
    pattern: /예비\s*창업/,
    extract: () => ({ businessAgeMinMonths: null, businessAgeMaxMonths: 0 }),
  },
  {
    pattern: /(?:창업|설립|개업)\s*(\d+)\s*년\s*(?:이내|이하|미만)/,
    extract: (m) => ({ businessAgeMinMonths: null, businessAgeMaxMonths: parseInt(m[1]) * 12 }),
  },
  {
    pattern: /(\d+)\s*년\s*이내\s*(?:(?:예비)?창업|설립)/,
    extract: (m) => ({ businessAgeMinMonths: null, businessAgeMaxMonths: parseInt(m[1]) * 12 }),
  },
  {
    pattern: /(\d+)\s*개월\s*(?:이내|이하)\s*(?:창업|설립)?/,
    extract: (m) => ({ businessAgeMinMonths: null, businessAgeMaxMonths: parseInt(m[1]) }),
  },
  {
    pattern: /(?:창업|설립|사업)\s*(\d+)\s*년\s*(?:이상|초과)/,
    extract: (m) => ({ businessAgeMinMonths: parseInt(m[1]) * 12, businessAgeMaxMonths: null }),
  },
  {
    pattern: /(\d+)\s*년\s*이상\s*(?:경과|된|이상인)/,
    extract: (m) => ({ businessAgeMinMonths: parseInt(m[1]) * 12, businessAgeMaxMonths: null }),
  },
  {
    pattern: /(?:업력|창업)\s*(\d+)\s*년\s*(?:~|~|이상)\s*(\d+)\s*년\s*(?:이하|이내)?/,
    extract: (m) => ({ businessAgeMinMonths: parseInt(m[1]) * 12, businessAgeMaxMonths: parseInt(m[2]) * 12 }),
  },
  {
    pattern: /(\d+)\s*년\s*(?:이상|초과)\s*(\d+)\s*년\s*(?:이하|미만|이내)/,
    extract: (m) => ({ businessAgeMinMonths: parseInt(m[1]) * 12, businessAgeMaxMonths: parseInt(m[2]) * 12 }),
  },
  {
    pattern: /초기\s*창업/,
    extract: () => ({ businessAgeMinMonths: null, businessAgeMaxMonths: 36 }),
  },
  {
    pattern: /청년\s*창업/,
    extract: () => ({ businessAgeMinMonths: null, businessAgeMaxMonths: 84 }),
  },
]

export function extractBusinessAge(text: string): BusinessAgeRange {
  for (const { pattern, extract } of AGE_PATTERNS) {
    const match = text.match(pattern)
    if (match) return extract(match)
  }
  return { businessAgeMinMonths: null, businessAgeMaxMonths: null }
}
