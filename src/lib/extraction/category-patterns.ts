/**
 * 혜택 카테고리 분류: 지원사업 제목/내용에서 카테고리 추출
 * 키워드 매핑 기반 분류
 */

const CATEGORY_KEYWORD_MAP: [RegExp, string][] = [
  // 주거
  [/월세|전세|임대|주택|주거|보증금|리모델링|수선|집수리|도배|LH/, '주거'],
  // 육아/출산
  [/출산|보육|아동|양육|육아|어린이집|유치원|임신|산후|영유아|아이\s*돌봄|아이\s*사랑/, '육아'],
  // 교육
  [/장학|학자금|교육|학비|수업료|입학|등록금|방과후|학습/, '교육'],
  // 취업/창업
  [/취업|구직|일자리|채용|취창업|직업\s*훈련|인턴|고용|실업\s*급여|창업/, '취업'],
  // 건강/의료
  [/건강|의료|진료|치료|병원|간병|요양|재활|검진|수술|의약품|치매|정신건강/, '건강'],
  // 생활 안정
  [/생활\s*(안정|지원|비)|기초\s*생활|긴급\s*지원|긴급\s*복지|재난|에너지\s*바우처|난방비|수도\s*요금|전기\s*요금/, '생활'],
  // 문화/여가
  [/문화|여가|체육|스포츠|관광|여행|공연|도서|박물관|미술관/, '문화'],
]

/**
 * 제목과 본문에서 혜택 카테고리를 추출
 * 복수 카테고리 가능 (예: "청년 주거 취업 지원" → ['주거', '취업'])
 */
export function extractBenefitCategories(title: string, text: string): string[] {
  const combined = `${title} ${text}`
  if (!combined.trim()) return []

  const result: string[] = []

  for (const [pattern, category] of CATEGORY_KEYWORD_MAP) {
    if (pattern.test(combined) && !result.includes(category)) {
      result.push(category)
    }
  }

  return result
}
