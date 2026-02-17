import { REGION_DISTRICTS } from '@/constants'

/**
 * 한국 17개 광역시도 지역명 변형 매핑
 * 모든 알려진 변형을 표준 지역명으로 매핑
 */
export const REGION_VARIANTS: Record<string, string[]> = {
  '서울': ['서울특별시', '서울시', '서울'],
  '부산': ['부산광역시', '부산시', '부산'],
  '대구': ['대구광역시', '대구시', '대구'],
  '인천': ['인천광역시', '인천시', '인천'],
  '광주': ['광주광역시', '광주'],  // 광주시 제외 — 경기도 광주시와 충돌 (CITY_TO_REGION에서 처리)
  '대전': ['대전광역시', '대전시', '대전'],
  '울산': ['울산광역시', '울산시', '울산'],
  '세종': ['세종특별자치시', '세종시', '세종'],
  '경기': ['경기도', '경기'],
  '강원': ['강원특별자치도', '강원도', '강원'],
  '충북': ['충청북도', '충북'],
  '충남': ['충청남도', '충남'],
  '전북': ['전라북도', '전북특별자치도', '전북'],
  '전남': ['전라남도', '전남'],
  '경북': ['경상북도', '경북'],
  '경남': ['경상남도', '경남'],
  '제주': ['제주특별자치도', '제주도', '제주'],
}

/**
 * 시/군/구 → 시도 매핑
 * 제목이나 본문에 "평택시", "수원시" 등이 나오면 해당 시도로 매핑
 */
const CITY_TO_REGION: Record<string, string> = {
  // 경기도
  수원시: '경기', 수원: '경기', 성남시: '경기', 성남: '경기', 안양시: '경기', 안양: '경기',
  부천시: '경기', 부천: '경기', 광명시: '경기', 광명: '경기', 평택시: '경기', 평택: '경기',
  안산시: '경기', 안산: '경기', 과천시: '경기', 과천: '경기', 오산시: '경기', 오산: '경기',
  시흥시: '경기', 시흥: '경기', 군포시: '경기', 군포: '경기', 의왕시: '경기', 의왕: '경기',
  하남시: '경기', 하남: '경기', 용인시: '경기', 용인: '경기', 파주시: '경기', 파주: '경기',
  이천시: '경기', 이천: '경기', 안성시: '경기', 안성: '경기', 김포시: '경기', 김포: '경기',
  화성시: '경기', 화성: '경기', 양주시: '경기', 양주: '경기', 포천시: '경기', 포천: '경기',
  여주시: '경기', 여주: '경기', 고양시: '경기', 고양: '경기', 의정부시: '경기', 의정부: '경기',
  동두천시: '경기', 동두천: '경기', 구리시: '경기', 구리: '경기', 남양주시: '경기', 남양주: '경기',
  연천군: '경기', 가평군: '경기', 양평군: '경기', 광주시: '경기',
  // 강원도
  춘천시: '강원', 춘천: '강원', 원주시: '강원', 원주: '강원', 강릉시: '강원', 강릉: '강원',
  동해시: '강원', 태백시: '강원', 속초시: '강원', 속초: '강원', 삼척시: '강원', 삼척: '강원',
  홍천군: '강원', 횡성군: '강원', 영월군: '강원', 평창군: '강원', 정선군: '강원',
  철원군: '강원', 화천군: '강원', 양구군: '강원', 인제군: '강원', 고성군: '강원', 양양군: '강원',
  // 충청북도
  청주시: '충북', 청주: '충북', 충주시: '충북', 충주: '충북', 제천시: '충북', 제천: '충북',
  보은군: '충북', 옥천군: '충북', 영동군: '충북', 증평군: '충북', 진천군: '충북',
  괴산군: '충북', 음성군: '충북', 단양군: '충북',
  // 충청남도
  천안시: '충남', 천안: '충남', 공주시: '충남', 공주: '충남', 보령시: '충남', 보령: '충남',
  아산시: '충남', 아산: '충남', 서산시: '충남', 서산: '충남', 논산시: '충남', 논산: '충남',
  계룡시: '충남', 당진시: '충남', 당진: '충남', 금산군: '충남', 부여군: '충남',
  서천군: '충남', 청양군: '충남', 홍성군: '충남', 예산군: '충남', 태안군: '충남',
  // 전북
  전주시: '전북', 전주: '전북', 군산시: '전북', 군산: '전북', 익산시: '전북', 익산: '전북',
  정읍시: '전북', 정읍: '전북', 남원시: '전북', 남원: '전북', 김제시: '전북', 김제: '전북',
  완주군: '전북', 진안군: '전북', 무주군: '전북', 장수군: '전북', 임실군: '전북',
  순창군: '전북', 고창군: '전북', 부안군: '전북',
  // 전남
  목포시: '전남', 목포: '전남', 여수시: '전남', 여수: '전남', 순천시: '전남', 순천: '전남',
  나주시: '전남', 나주: '전남', 광양시: '전남', 광양: '전남',
  담양군: '전남', 곡성군: '전남', 구례군: '전남', 고흥군: '전남', 보성군: '전남',
  화순군: '전남', 장흥군: '전남', 강진군: '전남', 해남군: '전남', 영암군: '전남',
  무안군: '전남', 함평군: '전남', 영광군: '전남', 장성군: '전남', 완도군: '전남',
  진도군: '전남', 신안군: '전남',
  // 경북
  포항시: '경북', 포항: '경북', 경주시: '경북', 경주: '경북', 김천시: '경북', 김천: '경북',
  안동시: '경북', 안동: '경북', 구미시: '경북', 구미: '경북', 영주시: '경북', 영주: '경북',
  영천시: '경북', 영천: '경북', 상주시: '경북', 상주: '경북', 문경시: '경북', 문경: '경북',
  경산시: '경북', 경산: '경북', 의성군: '경북', 청송군: '경북', 영양군: '경북',
  영덕군: '경북', 청도군: '경북', 고령군: '경북', 성주군: '경북', 칠곡군: '경북',
  예천군: '경북', 봉화군: '경북', 울진군: '경북', 울릉군: '경북',
  // 경남
  창원시: '경남', 창원: '경남', 진주시: '경남', 진주: '경남', 통영시: '경남', 통영: '경남',
  사천시: '경남', 사천: '경남', 김해시: '경남', 김해: '경남', 밀양시: '경남', 밀양: '경남',
  거제시: '경남', 거제: '경남', 양산시: '경남', 양산: '경남',
  의령군: '경남', 함안군: '경남', 함안: '경남', 창녕군: '경남', 남해군: '경남',
  하동군: '경남', 산청군: '경남', 함양군: '경남', 거창군: '경남', 합천군: '경남',
  // 서울 자치구 (중구 제외 — 6개 도시에 존재하여 모호, 강서구 제외 — 부산에도 존재)
  종로구: '서울', 용산구: '서울', 성동구: '서울', 광진구: '서울',
  동대문구: '서울', 중랑구: '서울', 중랑: '서울', 성북구: '서울', 강북구: '서울',
  도봉구: '서울', 노원구: '서울', 은평구: '서울', 서대문구: '서울', 마포구: '서울',
  양천구: '서울', 구로구: '서울', 금천구: '서울', 영등포구: '서울',
  동작구: '서울', 관악구: '서울', 서초구: '서울', 강남구: '서울', 송파구: '서울', 강동구: '서울',
  // 부산 자치구 (남구/북구 제외 — 4+개 도시에 존재하여 모호)
  영도구: '부산', 영도: '부산', 부산진구: '부산', 동래구: '부산',
  해운대구: '부산', 사하구: '부산', 금정구: '부산', 연제구: '부산',
  수영구: '부산', 사상구: '부산', 기장군: '부산',
  // 인천 자치구 (서구 제외 — 5개 도시에 존재하여 모호)
  미추홀구: '인천', 연수구: '인천', 남동구: '인천', 부평구: '인천', 계양구: '인천',
  강화군: '인천', 옹진군: '인천',
  // 대구 자치구
  수성구: '대구', 달서구: '대구', 달성군: '대구',
  // 울산 자치구/군
  울주군: '울산',
  // 광주 자치구
  광산구: '광주',
  // 대전 자치구
  유성구: '대전', 대덕구: '대전',
  // 제주 행정시
  제주시: '제주', 서귀포시: '제주', 서귀포: '제주',
}

/**
 * 한글 조사/접미사 시작 문자 — 지역명 뒤에 올 수 있는 문법적 접미사
 * 이 문자로 시작하면 앞 단어가 독립된 명사(지역명)로 판단
 * 예: "서울에서" → "에" (조사) → 서울 매칭 ✅
 * 예: "경기침체" → "침" (비조사) → 경기 매칭 ✗
 */
const PARTICLE_STARTS = new Set('에으로의은는이가을를와과만뿐처한부까마라도')

/**
 * 한글 단어 경계 검증
 * 좌측: 앞 글자가 한글 음절이면 복합어의 일부 → false
 * 우측 (2글자 이하 매칭만): 뒤 글자가 한글 음절이고 조사가 아니면 복합어 → false
 *
 * 예시:
 * - "해운대구" 안의 "대구" → 좌측 "운"(한글) → false (복합어)
 * - "경기침체" 안의 "경기" → 우측 "침"(비조사) → false (복합어)
 * - "서울에서" 안의 "서울" → 우측 "에"(조사) → true (독립 명사)
 * - "부산광역시" 안의 "부산" → 우측 "광"(비조사) → false, 하지만 "부산광역시" 변형이 먼저 매칭
 */
function isValidBoundary(text: string, matchIdx: number, matchLen: number): boolean {
  // 좌측 경계: 앞 글자가 한글 음절(가~힣)이면 복합어의 일부
  if (matchIdx > 0) {
    const prevCode = text.charCodeAt(matchIdx - 1)
    if (prevCode >= 0xAC00 && prevCode <= 0xD7A3) return false
  }

  // 우측 경계 (짧은 매칭, 2글자 이하만 적용):
  // 뒤 글자가 한글 음절이고 조사 시작 문자가 아니면 복합어
  if (matchLen <= 2) {
    const afterIdx = matchIdx + matchLen
    if (afterIdx < text.length) {
      const nextCode = text.charCodeAt(afterIdx)
      if (nextCode >= 0xAC00 && nextCode <= 0xD7A3 && !PARTICLE_STARTS.has(text[afterIdx])) {
        return false
      }
    }
  }

  return true
}

// 복지로 ctpvNm → 표준 지역명 매핑 (REGION_VARIANTS + CITY_TO_REGION 기반)
export const CTPV_TO_REGION: Record<string, string> = {}

for (const [region, variants] of Object.entries(REGION_VARIANTS)) {
  for (const variant of variants) {
    CTPV_TO_REGION[variant] = region
  }
}
for (const [city, region] of Object.entries(CITY_TO_REGION)) {
  CTPV_TO_REGION[city] = region
}

export function extractRegionsWithDistricts(text: string): { regions: string[], subRegions: string[] } {
  if (/전\s*국|전지역|지역\s*(제한|무관)|제한\s*없/.test(text)) {
    return { regions: [], subRegions: [] }
  }

  const foundRegions = new Set<string>()
  const foundSubRegions = new Set<string>()

  // 시도 레벨 매칭 (긴 변형 우선, 한글 경계 체크 적용)
  for (const [region, variants] of Object.entries(REGION_VARIANTS)) {
    let matched = false
    for (const variant of variants) {
      let startPos = 0
      while (startPos < text.length) {
        const idx = text.indexOf(variant, startPos)
        if (idx === -1) break
        if (isValidBoundary(text, idx, variant.length)) {
          foundRegions.add(region)
          matched = true
          break
        }
        startPos = idx + 1
      }
      if (matched) break
    }
  }

  // 시/군/구 → 시도 매핑 + subRegion 보존
  for (const [city, region] of Object.entries(CITY_TO_REGION)) {
    let startPos = 0
    while (startPos < text.length) {
      const idx = text.indexOf(city, startPos)
      if (idx === -1) break
      if (isValidBoundary(text, idx, city.length)) {
        foundRegions.add(region)
        foundSubRegions.add(city)
        break
      }
      startPos = idx + 1
    }
  }

  // 시/도가 확정된 경우, 해당 시/도의 구/군 중 텍스트에 나오는 것을 subRegions에 추가
  // (CITY_TO_REGION에 없는 모호한 구/군: 중구, 남구, 북구, 서구, 강서구 등)
  for (const region of foundRegions) {
    const districts = REGION_DISTRICTS[region]
    if (!districts) continue
    for (const district of districts) {
      if (foundSubRegions.has(district)) continue
      let startPos = 0
      while (startPos < text.length) {
        const idx = text.indexOf(district, startPos)
        if (idx === -1) break
        if (isValidBoundary(text, idx, district.length)) {
          foundSubRegions.add(district)
          break
        }
        startPos = idx + 1
      }
    }
  }

  return {
    regions: Array.from(foundRegions),
    subRegions: Array.from(foundSubRegions),
  }
}

export function extractRegions(text: string): string[] {
  return extractRegionsWithDistricts(text).regions
}

const SIDO_SHORT = ['서울','부산','대구','인천','광주','대전','울산','세종','경기','강원','충북','충남','전북','전남','경북','경남','제주']

/**
 * 기관명에서 지역 추출을 위한 전처리
 * "대전신용보증재단" → "대전 신용보증재단" (경계 체크 통과하도록)
 */
export function preprocessOrgForRegion(org: string): string {
  for (const sido of SIDO_SHORT) {
    if (org.startsWith(sido) && org.length > sido.length) {
      return sido + ' ' + org.slice(sido.length)
    }
  }
  return org
}
