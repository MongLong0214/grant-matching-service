/**
 * 기업마당(Bizinfo) API 클라이언트
 * data.go.kr 공공데이터포털 연동
 */

import type { SupportCategory } from "@/types"
import type { Database } from "@/lib/supabase/types"
import { extractEligibility } from "@/lib/extraction"
import { fetchWithRetry } from "@/lib/fetch-with-retry"

type SupportInsert = Database["public"]["Tables"]["supports"]["Insert"]

interface BizinfoApiResponse {
  page: number
  perPage: number
  totalCount: number
  currentCount: number
  matchCount: number
  data: BizinfoProgram[]
}

interface BizinfoProgram {
  번호: number
  분야: string
  사업명: string
  신청시작일자: string
  신청종료일자: string
  소관기관: string
  수행기관: string
  등록일자: string
  상세URL: string
}

const CATEGORY_MAP: Record<string, SupportCategory> = {
  금융: "금융",
  기술: "기술",
  인력: "인력",
  수출: "수출",
  내수: "내수",
  창업: "창업",
  경영: "경영",
  기타: "기타",
}

const ENDPOINTS = {
  "2025": "https://api.odcloud.kr/api/3034791/v1/uddi:fa09d13d-bce8-474e-b214-8008e79ec08f",
  "2024": "https://api.odcloud.kr/api/3034791/v1/uddi:80a74cfd-55d2-4dd3-81c7-d01567d0b3c4",
}

// 429 시 null 반환 → 호출자가 즉시 중단
async function fetchPage(
  endpoint: string,
  apiKey: string,
  page: number
): Promise<BizinfoApiResponse | null> {
  const url = `${endpoint}?serviceKey=${encodeURIComponent(apiKey)}&page=${page}&perPage=1000`

  const response = await fetchWithRetry(url, {
    headers: {
      Authorization: `Infuser ${apiKey}`,
    },
  })

  if (response.status === 429) {
    console.warn(`[Bizinfo] 429 rate limited (${page}페이지), 중단`)
    return null
  }

  if (!response.ok) {
    throw new Error(`Bizinfo API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

async function fetchYearData(
  year: "2025" | "2024",
  apiKey: string
): Promise<BizinfoProgram[]> {
  const endpoint = ENDPOINTS[year]
  const allPrograms: BizinfoProgram[] = []

  console.log(`[Bizinfo] ${year}년 데이터 수집 중...`)

  // 첫 페이지로 총 개수 확인
  const firstPage = await fetchPage(endpoint, apiKey, 1)
  if (!firstPage) return allPrograms
  allPrograms.push(...firstPage.data)

  const totalPages = Math.ceil(firstPage.totalCount / firstPage.perPage)
  console.log(`[Bizinfo] ${year}년: 총 ${firstPage.totalCount}건, ${totalPages}페이지`)

  // 나머지 페이지 가져오기
  for (let page = 2; page <= totalPages; page++) {
    const pageData = await fetchPage(endpoint, apiKey, page)
    if (!pageData) break  // 429 즉시 중단, 수집된 데이터 보존
    allPrograms.push(...pageData.data)
    console.log(`[Bizinfo] ${year}년: ${page}/${totalPages}페이지 수집`)
  }

  console.log(`[Bizinfo] ${year}년: ${allPrograms.length}건 수집 완료`)
  return allPrograms
}

// 2025 데이터 우선, 사업명+소관기관 키 기준 중복 제거
export async function fetchAllPrograms(apiKey: string): Promise<BizinfoProgram[]> {
  console.log("[Bizinfo] 데이터 수집 시작...")

  // 순차 실행 (동일 API 키 rate limit 방지)
  const programs2025 = await fetchYearData("2025", apiKey)
  const programs2024 = await fetchYearData("2024", apiKey)

  // 중복 제거: 사업명 + 소관기관 조합을 키로 사용
  const programMap = new Map<string, BizinfoProgram>()

  // 2024 데이터 먼저 추가
  for (const program of programs2024) {
    const key = `${program.사업명}|${program.소관기관}`
    programMap.set(key, program)
  }

  // 2025 데이터로 덮어쓰기 (우선순위)
  for (const program of programs2025) {
    const key = `${program.사업명}|${program.소관기관}`
    programMap.set(key, program)
  }

  const uniquePrograms = Array.from(programMap.values())
  console.log(`[Bizinfo] 중복 제거: ${programs2025.length + programs2024.length} → ${uniquePrograms.length}건`)

  // 최신순 정렬: 신청종료일자 → 등록일자 → 신청시작일자 (최신 정책 우선 처리)
  uniquePrograms.sort((a, b) => {
    const dateA = a.신청종료일자 || a.등록일자 || a.신청시작일자 || ''
    const dateB = b.신청종료일자 || b.등록일자 || b.신청시작일자 || ''
    return dateB.localeCompare(dateA)
  })

  return uniquePrograms
}

// 사업명/소관기관/분야에서 자격 조건 추출하여 매칭 정확도 향상
export function mapToSupport(program: BizinfoProgram): SupportInsert {
  // 분야 매핑 (매핑되지 않으면 "기타"로 처리)
  const category = CATEGORY_MAP[program.분야] || "기타"

  // 날짜 처리: 빈 문자열은 null로 변환
  const startDate = program.신청시작일자?.trim() || null
  const endDate = program.신청종료일자?.trim() || null

  // 수행기관/분야에서 자격 조건 추출 (사업명/소관기관은 별도 파라미터로 전달)
  const extraction = extractEligibility([
    program.수행기관,
    program.분야,
  ], program.사업명, program.소관기관)

  return {
    title: program.사업명,
    organization: program.소관기관,
    category,
    start_date: startDate,
    end_date: endDate,
    detail_url: program.상세URL,
    target_regions: extraction.regions,
    target_business_types: extraction.businessTypes,
    target_employee_min: extraction.employeeMin,
    target_employee_max: extraction.employeeMax,
    target_revenue_min: extraction.revenueMin,
    target_revenue_max: extraction.revenueMax,
    target_business_age_min: extraction.businessAgeMinMonths,
    target_business_age_max: extraction.businessAgeMaxMonths,
    target_founder_age_min: extraction.founderAgeMin,
    target_founder_age_max: extraction.founderAgeMax,
    amount: null,
    is_active: true,
    source: "bizinfo",
    external_id: `bizinfo-${program.번호}`,
    raw_eligibility_text: [program.수행기관, program.분야].filter(Boolean).join(' ') || null,
    raw_exclusion_text: null,
    raw_preference_text: null,
    extraction_confidence: { ...extraction.confidence },
    service_type: 'business',
    target_age_min: extraction.ageMin,
    target_age_max: extraction.ageMax,
    target_household_types: extraction.householdTypes.length > 0 ? extraction.householdTypes : null,
    target_income_levels: extraction.incomeLevels.length > 0 ? extraction.incomeLevels : null,
    target_employment_status: extraction.employmentStatus.length > 0 ? extraction.employmentStatus : null,
    benefit_categories: extraction.benefitCategories.length > 0 ? extraction.benefitCategories : null,
    region_scope: extraction.regionScope,
  }
}
