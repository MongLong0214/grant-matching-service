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
