/**
 * 기업마당(Bizinfo) API 클라이언트
 * data.go.kr 공공데이터포털 연동
 */

import type { SupportCategory } from "@/types"
import type { Database } from "@/lib/supabase/types"

type SupportInsert = Database["public"]["Tables"]["supports"]["Insert"]

/**
 * Bizinfo API 응답 타입
 */
interface BizinfoApiResponse {
  page: number
  perPage: number
  totalCount: number
  currentCount: number
  matchCount: number
  data: BizinfoProgram[]
}

/**
 * Bizinfo API 프로그램 데이터 타입
 */
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

/**
 * 분야 매핑 테이블
 * API 응답의 분야를 SupportCategory로 변환
 */
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

/**
 * API 엔드포인트 정의
 */
const ENDPOINTS = {
  "2025": "https://api.odcloud.kr/api/3034791/v1/uddi:fa09d13d-bce8-474e-b214-8008e79ec08f",
  "2024": "https://api.odcloud.kr/api/3034791/v1/uddi:80a74cfd-55d2-4dd3-81c7-d01567d0b3c4",
}

/**
 * 단일 페이지 데이터 가져오기
 */
async function fetchPage(
  endpoint: string,
  apiKey: string,
  page: number
): Promise<BizinfoApiResponse> {
  const url = `${endpoint}?serviceKey=${encodeURIComponent(apiKey)}&page=${page}&perPage=1000`

  const response = await fetch(url, {
    headers: {
      Authorization: `Infuser ${apiKey}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Bizinfo API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

/**
 * 특정 연도의 모든 페이지 데이터 가져오기
 */
async function fetchYearData(
  year: "2025" | "2024",
  apiKey: string
): Promise<BizinfoProgram[]> {
  const endpoint = ENDPOINTS[year]
  const allPrograms: BizinfoProgram[] = []

  console.log(`[Bizinfo] Fetching ${year} data...`)

  // 첫 페이지로 총 개수 확인
  const firstPage = await fetchPage(endpoint, apiKey, 1)
  allPrograms.push(...firstPage.data)

  const totalPages = Math.ceil(firstPage.totalCount / firstPage.perPage)
  console.log(`[Bizinfo] ${year}: Total ${firstPage.totalCount} programs, ${totalPages} pages`)

  // 나머지 페이지 가져오기
  for (let page = 2; page <= totalPages; page++) {
    const pageData = await fetchPage(endpoint, apiKey, page)
    allPrograms.push(...pageData.data)
    console.log(`[Bizinfo] ${year}: Fetched page ${page}/${totalPages}`)
  }

  console.log(`[Bizinfo] ${year}: Fetched ${allPrograms.length} programs`)
  return allPrograms
}

/**
 * 모든 프로그램 데이터 가져오기 (2025 + 2024)
 * 사업명 + 소관기관 조합으로 중복 제거 (2025 우선)
 */
export async function fetchAllPrograms(apiKey: string): Promise<BizinfoProgram[]> {
  console.log("[Bizinfo] Starting data fetch...")

  // 2025, 2024 데이터 병렬로 가져오기
  const [programs2025, programs2024] = await Promise.all([
    fetchYearData("2025", apiKey),
    fetchYearData("2024", apiKey),
  ])

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
  console.log(
    `[Bizinfo] Deduplicated: ${programs2025.length + programs2024.length} → ${uniquePrograms.length} programs`
  )

  return uniquePrograms
}

/**
 * Bizinfo 프로그램을 Supabase Insert 형식으로 변환
 */
export function mapToSupport(program: BizinfoProgram): SupportInsert {
  // 분야 매핑 (매핑되지 않으면 "기타"로 처리)
  const category = CATEGORY_MAP[program.분야] || "기타"

  // 날짜 처리: 빈 문자열은 null로 변환
  const startDate = program.신청시작일자?.trim() || null
  const endDate = program.신청종료일자?.trim() || null

  return {
    title: program.사업명,
    organization: program.소관기관,
    category,
    start_date: startDate,
    end_date: endDate,
    detail_url: program.상세URL,
    // API에서 제공하지 않는 필드들은 null
    target_regions: null,
    target_business_types: null,
    target_employee_min: null,
    target_employee_max: null,
    target_revenue_min: null,
    target_revenue_max: null,
    target_business_age_min: null,
    target_business_age_max: null,
    amount: null,
    is_active: true,
    source: "bizinfo",
  }
}
