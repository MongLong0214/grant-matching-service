interface FounderAgeExtraction {
  founderAgeMin: number | null
  founderAgeMax: number | null
}

/**
 * 대표자 연령 관련 자격 조건 추출
 * 청년/시니어 키워드 + "만 XX세 이하/이상" + "XX세 ~ YY세" 패턴
 */
export function extractFounderAge(texts: string[]): FounderAgeExtraction {
  const combined = texts.join(' ')

  let founderAgeMin: number | null = null
  let founderAgeMax: number | null = null

  // "XX세 ~ YY세" or "XX~YY세" (범위 패턴을 먼저 체크)
  const rangeMatch = combined.match(/(\d{2})세?\s*[~\-]\s*(\d{2})세/)
  if (rangeMatch) {
    founderAgeMin = parseInt(rangeMatch[1])
    founderAgeMax = parseInt(rangeMatch[2])
    return { founderAgeMin, founderAgeMax }
  }

  // 청년 키워드 -> max 39 (중장년/장년이 함께 있으면 무시)
  if (/청년/.test(combined) && !/중장년|장년/.test(combined)) {
    founderAgeMax = 39
  }

  // 중장년/시니어 -> min 40
  if (/중장년|시니어|장년|노인/.test(combined)) {
    founderAgeMin = 40
  }

  // "만 XX세 이하" or "XX세 이하"
  const maxMatch = combined.match(/만?\s*(\d{2})세\s*이하/)
  if (maxMatch) {
    founderAgeMax = parseInt(maxMatch[1])
  }

  // "만 XX세 이상" or "XX세 이상"
  const minMatch = combined.match(/만?\s*(\d{2})세\s*이상/)
  if (minMatch) {
    founderAgeMin = parseInt(minMatch[1])
  }

  return { founderAgeMin, founderAgeMax }
}
