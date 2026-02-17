export const BUSINESS_TYPES = [
  "음식점업",
  "소매업",
  "도매업",
  "제조업",
  "건설업",
  "운수업",
  "숙박업",
  "정보통신업",
  "전문서비스업",
  "교육서비스업",
  "보건업",
  "예술/스포츠",
  "기타서비스업",
] as const

export const REGIONS = [
  "서울",
  "부산",
  "대구",
  "인천",
  "광주",
  "대전",
  "울산",
  "세종",
  "경기",
  "강원",
  "충북",
  "충남",
  "전북",
  "전남",
  "경북",
  "경남",
  "제주",
] as const

export const REGION_DISTRICTS: Record<string, string[]> = {
  서울: ['종로구', '중구', '용산구', '성동구', '광진구', '동대문구', '중랑구', '성북구', '강북구', '도봉구', '노원구', '은평구', '서대문구', '마포구', '양천구', '강서구', '구로구', '금천구', '영등포구', '동작구', '관악구', '서초구', '강남구', '송파구', '강동구'],
  부산: ['중구', '서구', '동구', '영도구', '부산진구', '동래구', '남구', '북구', '해운대구', '사하구', '금정구', '강서구', '연제구', '수영구', '사상구', '기장군'],
  대구: ['중구', '동구', '서구', '남구', '북구', '수성구', '달서구', '달성군'],
  인천: ['중구', '동구', '미추홀구', '연수구', '남동구', '부평구', '계양구', '서구', '강화군', '옹진군'],
  광주: ['동구', '서구', '남구', '북구', '광산구'],
  대전: ['동구', '중구', '서구', '유성구', '대덕구'],
  울산: ['중구', '남구', '동구', '북구', '울주군'],
  세종: [],
  경기: ['수원시', '성남시', '안양시', '부천시', '광명시', '평택시', '안산시', '과천시', '오산시', '시흥시', '군포시', '의왕시', '하남시', '용인시', '파주시', '이천시', '안성시', '김포시', '화성시', '양주시', '포천시', '여주시', '고양시', '의정부시', '동두천시', '구리시', '남양주시', '연천군', '가평군', '양평군', '광주시'],
  강원: ['춘천시', '원주시', '강릉시', '동해시', '태백시', '속초시', '삼척시', '홍천군', '횡성군', '영월군', '평창군', '정선군', '철원군', '화천군', '양구군', '인제군', '고성군', '양양군'],
  충북: ['청주시', '충주시', '제천시', '보은군', '옥천군', '영동군', '증평군', '진천군', '괴산군', '음성군', '단양군'],
  충남: ['천안시', '공주시', '보령시', '아산시', '서산시', '논산시', '계룡시', '당진시', '금산군', '부여군', '서천군', '청양군', '홍성군', '예산군', '태안군'],
  전북: ['전주시', '군산시', '익산시', '정읍시', '남원시', '김제시', '완주군', '진안군', '무주군', '장수군', '임실군', '순창군', '고창군', '부안군'],
  전남: ['목포시', '여수시', '순천시', '나주시', '광양시', '담양군', '곡성군', '구례군', '고흥군', '보성군', '화순군', '장흥군', '강진군', '해남군', '영암군', '무안군', '함평군', '영광군', '장성군', '완도군', '진도군', '신안군'],
  경북: ['포항시', '경주시', '김천시', '안동시', '구미시', '영주시', '영천시', '상주시', '문경시', '경산시', '의성군', '청송군', '영양군', '영덕군', '청도군', '고령군', '성주군', '칠곡군', '예천군', '봉화군', '울진군', '울릉군'],
  경남: ['창원시', '진주시', '통영시', '사천시', '김해시', '밀양시', '거제시', '양산시', '의령군', '함안군', '창녕군', '남해군', '하동군', '산청군', '함양군', '거창군', '합천군'],
  제주: ['제주시', '서귀포시'],
}

export const EMPLOYEE_OPTIONS = [
  { label: "1~4명", value: 2 },
  { label: "5~9명", value: 7 },
  { label: "10~49명", value: 30 },
  { label: "50~99명", value: 75 },
  { label: "100명 이상", value: 150 },
] as const

export const REVENUE_OPTIONS = [
  { label: "1억 미만", value: 50_000_000 },
  { label: "1억 ~ 5억", value: 300_000_000 },
  { label: "5억 ~ 10억", value: 750_000_000 },
  { label: "10억 ~ 50억", value: 3_000_000_000 },
  { label: "50억 이상", value: 10_000_000_000 },
] as const

export const BUSINESS_AGE_OPTIONS = [
  { label: "예비창업자", value: -1 },
  { label: "1년 미만", value: 6 },
  { label: "1~3년", value: 24 },
  { label: "3~5년", value: 48 },
  { label: "5~10년", value: 84 },
  { label: "10년 이상", value: 180 },
] as const

export const FOUNDER_AGE_OPTIONS = [
  { label: "만 19~29세", value: 25 },
  { label: "만 30~39세", value: 35 },
  { label: "만 40~49세", value: 45 },
  { label: "만 50~59세", value: 55 },
  { label: "만 60세 이상", value: 65 },
] as const

export const AGE_GROUP_OPTIONS = [
  { label: '10대 (만 15~19세)', value: '10대' },
  { label: '20대', value: '20대' },
  { label: '30대', value: '30대' },
  { label: '40대', value: '40대' },
  { label: '50대', value: '50대' },
  { label: '60대 이상', value: '60대이상' },
] as const

export const GENDER_OPTIONS = [
  { label: '남성', value: '남성' },
  { label: '여성', value: '여성' },
] as const

export const HOUSEHOLD_TYPE_OPTIONS = [
  { label: '1인 가구', value: '1인' },
  { label: '신혼부부', value: '신혼부부' },
  { label: '영유아 가구', value: '영유아' },
  { label: '다자녀 가구', value: '다자녀' },
  { label: '한부모 가구', value: '한부모' },
  { label: '일반 가구', value: '일반' },
] as const

export const INCOME_LEVEL_OPTIONS = [
  { label: '기초생활 수급자', value: '기초생활' },
  { label: '차상위 계층', value: '차상위' },
  { label: '중위소득 50% 이하', value: '중위50이하' },
  { label: '중위소득 100% 이하', value: '중위100이하' },
  { label: '중위소득 100% 초과', value: '중위100초과' },
] as const

export const EMPLOYMENT_STATUS_OPTIONS = [
  { label: '재직자 (직장인)', value: '재직자' },
  { label: '구직자 (실업)', value: '구직자' },
  { label: '학생', value: '학생' },
  { label: '자영업자', value: '자영업' },
  { label: '무직 / 경력단절', value: '무직' },
  { label: '은퇴', value: '은퇴' },
] as const

export const INTEREST_CATEGORY_OPTIONS = [
  { label: '주거 / 임대', value: '주거' },
  { label: '육아 / 출산', value: '육아' },
  { label: '교육 / 장학', value: '교육' },
  { label: '취업 / 창업', value: '취업' },
  { label: '건강 / 의료', value: '건강' },
  { label: '생활 안정', value: '생활' },
  { label: '문화 / 여가', value: '문화' },
] as const

/** 카테고리별 뱃지 색상 매핑 (light + dark safe) */
export const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  "금융": { bg: "bg-emerald-100 dark:bg-emerald-900/40", text: "text-emerald-700 dark:text-emerald-300" },
  "기술": { bg: "bg-blue-100 dark:bg-blue-900/40", text: "text-blue-700 dark:text-blue-300" },
  "인력": { bg: "bg-purple-100 dark:bg-purple-900/40", text: "text-purple-700 dark:text-purple-300" },
  "수출": { bg: "bg-cyan-100 dark:bg-cyan-900/40", text: "text-cyan-700 dark:text-cyan-300" },
  "내수": { bg: "bg-amber-100 dark:bg-amber-900/40", text: "text-amber-700 dark:text-amber-300" },
  "창업": { bg: "bg-orange-100 dark:bg-orange-900/40", text: "text-orange-700 dark:text-orange-300" },
  "경영": { bg: "bg-slate-100 dark:bg-slate-800/40", text: "text-slate-700 dark:text-slate-300" },
  "기타": { bg: "bg-gray-100 dark:bg-gray-800/40", text: "text-gray-700 dark:text-gray-300" },
  "복지": { bg: "bg-rose-100 dark:bg-rose-900/40", text: "text-rose-700 dark:text-rose-300" },
  "주거": { bg: "bg-teal-100 dark:bg-teal-900/40", text: "text-teal-700 dark:text-teal-300" },
  "육아": { bg: "bg-pink-100 dark:bg-pink-900/40", text: "text-pink-700 dark:text-pink-300" },
  "교육": { bg: "bg-indigo-100 dark:bg-indigo-900/40", text: "text-indigo-700 dark:text-indigo-300" },
  "건강": { bg: "bg-red-100 dark:bg-red-900/40", text: "text-red-700 dark:text-red-300" },
  "고용": { bg: "bg-violet-100 dark:bg-violet-900/40", text: "text-violet-700 dark:text-violet-300" },
  "생활": { bg: "bg-lime-100 dark:bg-lime-900/40", text: "text-lime-700 dark:text-lime-300" },
} as const
