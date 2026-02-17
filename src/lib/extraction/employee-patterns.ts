interface EmployeeRange {
  employeeMin: number | null
  employeeMax: number | null
}

// 긴 문자열이 먼저 매칭되도록 정렬 (예: "중소기업" > "소기업")
const NAMED_EMPLOYEE_RANGES: [string, EmployeeRange][] = [
  ['중소기업',   { employeeMin: null, employeeMax: 300 }],
  ['소상공인',   { employeeMin: null, employeeMax: 10 }],
  ['소기업',     { employeeMin: null, employeeMax: 50 }],
  ['중견기업',   { employeeMin: 300, employeeMax: 1000 }],
  ['중기업',     { employeeMin: 50, employeeMax: 300 }],
  ['대기업',     { employeeMin: 1000, employeeMax: null }],
  ['영세기업',   { employeeMin: null, employeeMax: 5 }],
  ['1인 기업',   { employeeMin: 1, employeeMax: 1 }],
  ['1인기업',    { employeeMin: 1, employeeMax: 1 }],
]

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
  // 명칭 기반 매칭 우선 (긴 문자열부터 매칭)
  for (const [name, range] of NAMED_EMPLOYEE_RANGES) {
    if (text.includes(name)) {
      return range
    }
  }

  // 정규식 패턴 매칭
  for (const { pattern, extract } of EMPLOYEE_PATTERNS) {
    const match = text.match(pattern)
    if (match) {
      return extract(match)
    }
  }

  return { employeeMin: null, employeeMax: null }
}
