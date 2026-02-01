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

export const FREE_PREVIEW_COUNT = 3

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
} as const
