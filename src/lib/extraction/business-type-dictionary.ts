/**
 * Business type keyword dictionary
 * Maps keywords found in eligibility text to the 13 BUSINESS_TYPES constants
 */
export const BUSINESS_TYPE_KEYWORDS: Record<string, string[]> = {
  '음식점업': ['음식점', '외식', '요식업', '식당', '카페', '베이커리', '제과', '배달', '급식', '푸드', 'F&B', '프랜차이즈', '조리'],
  '소매업': ['소매', '판매업', '유통', '상점', '가게', '매장', '편의점', '마트', '슈퍼', '리테일'],
  '도매업': ['도매', '도소매', '중간유통', '벤더'],
  '제조업': ['제조', '생산', '공장', '가공', '제품', '산업단지', '스마트공장', '제조기업', '생산기업'],
  '건설업': ['건설', '시공', '건축', '토목', '인테리어', '리모델링'],
  '운수업': ['운수', '운송', '물류', '택배', '배송', '화물', '교통'],
  '숙박업': ['숙박', '호텔', '모텔', '펜션', '게스트하우스', '민박'],
  '정보통신업': ['정보통신', 'IT', 'ICT', '소프트웨어', 'SW', '앱', '플랫폼', '인터넷', '데이터', 'AI', '인공지능', '빅데이터', '클라우드', '블록체인', '핀테크', '디지털', '스타트업', '테크', '기술창업', '전자상거래', 'SaaS', 'IoT'],
  '전문서비스업': ['전문서비스', '컨설팅', '법률', '회계', '세무', '디자인', '광고', '마케팅', '연구', '엔지니어링', '번역'],
  '교육서비스업': ['교육', '학원', '교습', '강의', '훈련', '연수', '학습', 'EdTech', '에듀'],
  '보건업': ['보건', '의료', '병원', '약국', '의원', '치과', '한의원', '바이오', '헬스케어', '건강', '의료기기'],
  '예술/스포츠': ['예술', '스포츠', '문화', '공연', '영화', '음악', '체육', '레저', '관광', '엔터테인먼트', '게임', '콘텐츠'],
  '기타서비스업': ['서비스업', '생활서비스', '수리', '세탁', '미용', '뷰티', '반려동물', '펫'],
}

/**
 * Multi-mapping keywords that map to multiple or no business types
 */
export const MULTI_MAP_KEYWORDS: Record<string, string[]> = {
  '소상공인': ['음식점업', '소매업', '기타서비스업'],
  '자영업': ['음식점업', '소매업', '기타서비스업'],
  '벤처': ['정보통신업', '제조업'],
  '중소기업': [],     // no restriction
  '중소벤처기업': [],
  '소기업': [],
  '영세기업': ['음식점업', '소매업', '기타서비스업'],
}

export function extractBusinessTypes(text: string): string[] {
  if (/업종\s*(제한|무관)\s*없|모든\s*업종|전\s*업종/.test(text)) {
    return []
  }

  const found = new Set<string>()

  // 1. Multi-map keywords first
  for (const [keyword, types] of Object.entries(MULTI_MAP_KEYWORDS)) {
    if (text.includes(keyword)) {
      if (types.length === 0) return []  // no restriction
      types.forEach(t => found.add(t))
    }
  }

  // 2. Per-type keyword matching
  for (const [type, keywords] of Object.entries(BUSINESS_TYPE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        found.add(type)
        break
      }
    }
  }

  // 3. Exclusion check
  const exclusionPattern = /(음식점|소매|도매|제조|건설|운수|숙박|정보통신|전문서비스|교육|보건|예술|스포츠|기타서비스)[^\s]*\s*(제외|불포함|불가|해당\s*없음)/g
  let match: RegExpExecArray | null
  while ((match = exclusionPattern.exec(text)) !== null) {
    const excludedKeyword = match[1]
    for (const [type, keywords] of Object.entries(BUSINESS_TYPE_KEYWORDS)) {
      if (keywords.some(k => k.includes(excludedKeyword))) {
        found.delete(type)
      }
    }
  }

  return Array.from(found)
}
