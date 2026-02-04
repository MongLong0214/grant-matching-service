interface EmployeeRange {
  employeeMin: number | null
  employeeMax: number | null
}

const NAMED_EMPLOYEE_RANGES: Record<string, EmployeeRange> = {
  '소기업':     { employeeMin: null, employeeMax: 50 },
  '소상공인':   { employeeMin: null, employeeMax: 10 },
  '중기업':     { employeeMin: 50, employeeMax: 300 },
  '중소기업':   { employeeMin: null, employeeMax: 300 },
  '중견기업':   { employeeMin: 300, employeeMax: 1000 },
  '대기업':     { employeeMin: 1000, employeeMax: null },
  '영세기업':   { employeeMin: null, employeeMax: 5 },
  '1인 기업':   { employeeMin: 1, employeeMax: 1 },
  '1인기업':    { employeeMin: 1, employeeMax: 1 },
}

const EMPLOYEE_PATTERNS: Array<{ pattern: RegExp; extract: (m: RegExpMatchArray) => EmployeeRange }> = [
  {
    pattern: /상시\s*(?:근로자|종업원|고용인원|인원)\s*(\d+)\s*(?:인|명)\s*(?:이하|미만)/,
    extract: (m) => ({ employeeMin: null, employeeMax: parseInt(m[1]) }),
  },
  {
    pattern: /(?:종업원|근로자|직원)\s*(\d+)\s*(?:인|명)\s*이상\s*(\d+)\s*(?:인|명)\s*이하/,
    extract: (m) => ({ employeeMin: parseInt(m[1]), employeeMax: parseInt(m[2]) }),
  },
  {
    pattern: /(\d+)\s*(?:인|명)\s*(?:~|~|이상)\s*(\d+)\s*(?:인|명)\s*(?:이하|미만|까지)?/,
    extract: (m) => ({ employeeMin: parseInt(m[1]), employeeMax: parseInt(m[2]) }),
  },
  {
    pattern: /(\d+)\s*(?:인|명)\s*(?:이하|미만|까지)/,
    extract: (m) => ({ employeeMin: null, employeeMax: parseInt(m[1]) }),
  },
  {
    pattern: /(\d+)\s*(?:인|명)\s*(?:이상|초과|부터)/,
    extract: (m) => ({ employeeMin: parseInt(m[1]), employeeMax: null }),
  },
  {
    pattern: /(?:고용|채용)\s*(?:인원|규모)\s*(\d+)\s*(?:인|명)\s*(?:이상)/,
    extract: (m) => ({ employeeMin: parseInt(m[1]), employeeMax: null }),
  },
]

export function extractEmployeeRange(text: string): EmployeeRange {
  // Named ranges first
  for (const [name, range] of Object.entries(NAMED_EMPLOYEE_RANGES)) {
    if (text.includes(name)) {
      return range
    }
  }

  // Regex patterns
  for (const { pattern, extract } of EMPLOYEE_PATTERNS) {
    const match = text.match(pattern)
    if (match) {
      return extract(match)
    }
  }

  return { employeeMin: null, employeeMax: null }
}
