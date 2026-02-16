/**
 * 개인 대상자 차원 추출: 연령, 가구유형, 소득수준, 취업상태
 * 복지로/보조금24 텍스트에서 개인 복지 대상자 정보를 추출
 */

// === 연령 추출 ===

interface AgeRange {
  min: number | null
  max: number | null
}

/** 키워드 기반 연령대 매핑 */
const AGE_KEYWORD_MAP: Record<string, AgeRange> = {
  '영유아': { min: 0, max: 6 },
  '영아': { min: 0, max: 2 },
  '유아': { min: 3, max: 6 },
  '아동': { min: 0, max: 12 },
  '초등': { min: 6, max: 12 },
  '중학': { min: 12, max: 15 },
  '고등': { min: 15, max: 18 },
  '청소년': { min: 9, max: 18 },
  '청년': { min: 19, max: 34 },
  '중장년': { min: 40, max: 64 },
  '장년': { min: 50, max: 64 },
  '노인': { min: 65, max: null },
  '고령자': { min: 65, max: null },
  '어르신': { min: 65, max: null },
  '임산부': { min: 15, max: 49 },
  '신생아': { min: 0, max: 1 },
}

/** "만 19~34세", "만 19세 이상 34세 이하" 등 패턴 */
const AGE_RANGE_PATTERNS = [
  /만\s*(\d{1,3})\s*[~\-–]\s*(\d{1,3})\s*세/g,
  /만\s*(\d{1,3})\s*세\s*이상\s*(\d{1,3})\s*세\s*이하/g,
  /(\d{1,3})\s*세\s*이상\s*(\d{1,3})\s*세\s*이하/g,
  /(\d{1,3})\s*세\s*이상\s*(\d{1,3})\s*세\s*미만/g,
]

/** "만 65세 이상", "19세 이상" */
const AGE_MIN_PATTERNS = [
  /만\s*(\d{1,3})\s*세\s*이상/g,
  /(\d{1,3})\s*세\s*이상/g,
]

/** "만 39세 이하", "34세 이하" */
const AGE_MAX_PATTERNS = [
  /만\s*(\d{1,3})\s*세\s*이하/g,
  /(\d{1,3})\s*세\s*이하/g,
  /만\s*(\d{1,3})\s*세\s*미만/g,
]

export function extractAgeRange(text: string): AgeRange {
  if (!text) return { min: null, max: null }

  // 1) 명시적 범위 패턴 먼저
  for (const pattern of AGE_RANGE_PATTERNS) {
    pattern.lastIndex = 0
    const match = pattern.exec(text)
    if (match) {
      return { min: parseInt(match[1]), max: parseInt(match[2]) }
    }
  }

  // 2) 최소/최대 개별 패턴
  let min: number | null = null
  let max: number | null = null

  for (const pattern of AGE_MIN_PATTERNS) {
    pattern.lastIndex = 0
    const match = pattern.exec(text)
    if (match) {
      min = parseInt(match[1])
      break
    }
  }

  for (const pattern of AGE_MAX_PATTERNS) {
    pattern.lastIndex = 0
    const match = pattern.exec(text)
    if (match) {
      max = parseInt(match[1])
      break
    }
  }

  if (min !== null || max !== null) return { min, max }

  // 3) 키워드 기반 매핑
  for (const [keyword, range] of Object.entries(AGE_KEYWORD_MAP)) {
    if (text.includes(keyword)) return range
  }

  return { min: null, max: null }
}

// === 가구 유형 추출 ===

const HOUSEHOLD_PATTERNS: [RegExp, string][] = [
  [/1인\s*가구/, '1인'],
  [/단독\s*가구/, '1인'],
  [/신혼\s*부부|신혼\s*가구|결혼\s*\d/, '신혼부부'],
  [/영유아\s*(가구|가정|자녀)/, '영유아'],
  [/다자녀|다\s*자녀\s*가구|3자녀|셋째/, '다자녀'],
  [/한부모|한\s*부모\s*가(구|정)|조손\s*가(구|정)/, '한부모'],
  [/다문화\s*가(구|정)/, '다문화'],
  [/장애인\s*가(구|정)/, '장애인'],
  [/임산부|임신/, '임산부'],
  [/소년소녀\s*가(장|정)/, '소년소녀가장'],
]

export function extractHouseholdTypes(text: string): string[] {
  if (!text) return []
  const result: string[] = []

  for (const [pattern, type] of HOUSEHOLD_PATTERNS) {
    if (pattern.test(text) && !result.includes(type)) {
      result.push(type)
    }
  }

  return result
}

// === 소득 수준 추출 ===

export function extractIncomeLevels(text: string): string[] {
  if (!text) return []
  const result: string[] = []

  // 기초생활/차상위 키워드
  if (/기초생활\s*수급/.test(text) && !result.includes('기초생활')) {
    result.push('기초생활')
  }
  if (/차상위/.test(text) && !result.includes('차상위')) {
    result.push('차상위')
  }

  // 중위소득 퍼센트 추출
  const medianPatterns = [
    /중위\s*소득\s*(\d+)\s*%/g,
    /기준\s*중위소득\s*(\d+)\s*%/g,
  ]
  for (const pattern of medianPatterns) {
    pattern.lastIndex = 0
    let match
    while ((match = pattern.exec(text)) !== null) {
      const pct = parseInt(match[1])
      if (pct <= 50) {
        if (!result.includes('중위50이하')) result.push('중위50이하')
      } else if (pct <= 100) {
        if (!result.includes('중위100이하')) result.push('중위100이하')
      } else {
        if (!result.includes('중위100초과')) result.push('중위100초과')
      }
    }
  }

  // 저소득 키워드
  if (/저소득/.test(text) && result.length === 0) {
    result.push('중위50이하')
  }

  return result
}

// === 취업 상태 추출 ===

const EMPLOYMENT_PATTERNS: [RegExp, string][] = [
  [/재직자|재직\s*중|직장인|근로자/, '재직자'],
  [/구직자|구직\s*중|실업(자)?|미취업(자)?/, '구직자'],
  [/학생|대학(생|교)|재학/, '학생'],
  [/자영업(자)?|소상공인|영세\s*상인/, '자영업'],
  [/경력\s*단절|경단녀/, '무직'],
  [/무직|비경제\s*활동/, '무직'],
  [/은퇴(자)?|퇴직(자)?/, '은퇴'],
]

export function extractEmploymentStatus(text: string): string[] {
  if (!text) return []
  const result: string[] = []

  for (const [pattern, status] of EMPLOYMENT_PATTERNS) {
    if (pattern.test(text) && !result.includes(status)) {
      result.push(status)
    }
  }

  return result
}
