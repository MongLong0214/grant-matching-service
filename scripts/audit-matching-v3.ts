/**
 * v3 매칭 알고리즘 실전 검증
 * 다양한 유저 프로필로 실제 DB 데이터에 대해 매칭 실행 후 결과 분석
 */
import { readFileSync } from "fs"
import { createClient } from "@supabase/supabase-js"

const envContent = readFileSync(".env.local", "utf-8")
for (const line of envContent.split("\n")) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith("#")) continue
  const eqIdx = trimmed.indexOf("=")
  if (eqIdx === -1) continue
  const key = trimmed.slice(0, eqIdx).trim()
  const val = trimmed.slice(eqIdx + 1).trim()
  if (!process.env[key]) process.env[key] = val
}

// We need to set up path aliases manually since this is a script
// Import the matching-v3 module via relative path
const path = require("path")
const tsconfig = JSON.parse(readFileSync("tsconfig.json", "utf-8"))

// Register path aliases
require("tsconfig-paths").register({
  baseUrl: ".",
  paths: tsconfig.compilerOptions.paths,
})

import type { DiagnoseFormData, Support } from "@/types"
import { matchSupportsV3 } from "@/lib/matching-v3"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
)

// 테스트 유저 프로필 (실제 소상공인 시나리오)
const TEST_PROFILES: { name: string; data: DiagnoseFormData }[] = [
  {
    name: "서울 음식점 7명 3억 2년 35세",
    data: { businessType: "음식점업", region: "서울", employeeCount: 7, annualRevenue: 300000000, businessAge: 24, founderAge: 35 },
  },
  {
    name: "부산 제조업 50명 20억 10년 50세",
    data: { businessType: "제조업", region: "부산", employeeCount: 50, annualRevenue: 2000000000, businessAge: 120, founderAge: 50 },
  },
  {
    name: "대전 IT 3명 5천만 예비창업 28세",
    data: { businessType: "정보통신업", region: "대전", employeeCount: 3, annualRevenue: 50000000, businessAge: -1, founderAge: 28 },
  },
  {
    name: "경기 도소매 15명 10억 5년 42세",
    data: { businessType: "도매 및 소매업", region: "경기", employeeCount: 15, annualRevenue: 1000000000, businessAge: 60, founderAge: 42 },
  },
  {
    name: "제주 숙박업 5명 2억 1년 30세",
    data: { businessType: "숙박 및 음식점업", region: "제주", employeeCount: 5, annualRevenue: 200000000, businessAge: 12, founderAge: 30 },
  },
  {
    name: "인천 건설업 30명 15억 8년 55세",
    data: { businessType: "건설업", region: "인천", employeeCount: 30, annualRevenue: 1500000000, businessAge: 96, founderAge: 55 },
  },
  {
    name: "광주 교육서비스 2명 3천만 예비창업 25세 (청년)",
    data: { businessType: "교육 서비스업", region: "광주", employeeCount: 2, annualRevenue: 30000000, businessAge: -1, founderAge: 25 },
  },
  {
    name: "세종 농림어업 10명 5억 3년 45세",
    data: { businessType: "농업, 임업 및 어업", region: "세종", employeeCount: 10, annualRevenue: 500000000, businessAge: 36, founderAge: 45 },
  },
]

function mapRow(row: Record<string, unknown>): Support {
  return {
    id: row.id as string,
    title: row.title as string,
    organization: row.organization as string,
    category: (row.category || "기타") as Support["category"],
    startDate: row.start_date as string | null,
    endDate: row.end_date as string | null,
    detailUrl: row.detail_url as string,
    targetRegions: row.target_regions as string[] | null,
    targetBusinessTypes: row.target_business_types as string[] | null,
    targetEmployeeMin: row.target_employee_min as number | null,
    targetEmployeeMax: row.target_employee_max as number | null,
    targetRevenueMin: row.target_revenue_min as number | null,
    targetRevenueMax: row.target_revenue_max as number | null,
    targetBusinessAgeMin: row.target_business_age_min as number | null,
    targetBusinessAgeMax: row.target_business_age_max as number | null,
    targetFounderAgeMin: row.target_founder_age_min as number | null,
    targetFounderAgeMax: row.target_founder_age_max as number | null,
    amount: row.amount as string | null,
    isActive: row.is_active as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    source: row.source as string | undefined,
    rawEligibilityText: row.raw_eligibility_text as string | null | undefined,
    rawExclusionText: row.raw_exclusion_text as string | null | undefined,
    rawPreferenceText: row.raw_preference_text as string | null | undefined,
    extractionConfidence: row.extraction_confidence as Record<string, number> | null | undefined,
    externalId: row.external_id as string | null | undefined,
  }
}

async function loadAllSupports(): Promise<Support[]> {
  const allRows: Record<string, unknown>[] = []
  let offset = 0
  const batchSize = 1000

  while (true) {
    const { data, error } = await supabase
      .from("supports")
      .select("*")
      .eq("is_active", true)
      .range(offset, offset + batchSize - 1)

    if (error) throw error
    if (!data || data.length === 0) break
    allRows.push(...data)
    if (data.length < batchSize) break
    offset += batchSize
  }

  return allRows.map(mapRow)
}

async function main() {
  console.log("=== v3 매칭 알고리즘 실전 검증 ===\n")

  console.log("Loading all active supports from DB...")
  const supports = await loadAllSupports()
  console.log(`Loaded ${supports.length} active supports\n`)

  // Data quality summary
  let withAnyData = 0
  for (const s of supports) {
    const r = s.targetRegions
    const t = s.targetBusinessTypes
    if ((r && r.length > 0) || (t && t.length > 0) ||
        s.targetEmployeeMin !== null || s.targetEmployeeMax !== null ||
        s.targetRevenueMin !== null || s.targetRevenueMax !== null ||
        s.targetBusinessAgeMin !== null || s.targetBusinessAgeMax !== null ||
        s.targetFounderAgeMin !== null || s.targetFounderAgeMax !== null) {
      withAnyData++
    }
  }
  console.log(`Data quality: ${withAnyData}/${supports.length} (${(withAnyData/supports.length*100).toFixed(1)}%) have any target data\n`)

  console.log("=" .repeat(100))

  for (const profile of TEST_PROFILES) {
    console.log(`\n### 프로필: ${profile.name}`)
    console.log("-".repeat(80))

    const result = matchSupportsV3(supports, profile.data)

    console.log(`  총 분석: ${result.totalAnalyzed}건`)
    console.log(`  Knockout: ${result.knockedOut}건 (${(result.knockedOut/result.totalAnalyzed*100).toFixed(1)}%)`)
    console.log(`  맞춤(tailored): ${result.tailored.length}건`)
    console.log(`  추천(recommended): ${result.recommended.length}건`)
    console.log(`  탐색(exploratory): ${result.exploratory.length}건`)
    console.log(`  총 결과: ${result.totalCount}건`)

    // Show top 5 tailored
    if (result.tailored.length > 0) {
      console.log(`\n  [맞춤 TOP 5]`)
      for (const item of result.tailored.slice(0, 5)) {
        const s = item.support
        const conf = item.scores.confidence
        const cov = item.scores.coverage
        console.log(`    ${(item.score * 100).toFixed(0)}% [cov=${cov.toFixed(2)}] ${s.title.slice(0, 50)}`)
        console.log(`       기관: ${s.organization} | 업종: ${JSON.stringify(s.targetBusinessTypes?.slice(0, 3))} | 지역: ${JSON.stringify(s.targetRegions?.slice(0, 3))}`)
      }
    }

    // Show top 3 recommended
    if (result.recommended.length > 0) {
      console.log(`\n  [추천 TOP 3]`)
      for (const item of result.recommended.slice(0, 3)) {
        const s = item.support
        console.log(`    ${(item.score * 100).toFixed(0)}% [cov=${item.scores.coverage.toFixed(2)}] ${s.title.slice(0, 50)}`)
        console.log(`       기관: ${s.organization} | 업종: ${JSON.stringify(s.targetBusinessTypes?.slice(0, 3))} | 지역: ${JSON.stringify(s.targetRegions?.slice(0, 3))}`)
      }
    }

    // Sanity checks
    const issues: string[] = []

    // Check: 맞춤 결과 중 지역 불일치가 있는지
    for (const item of result.tailored) {
      const regions = item.support.targetRegions
      if (regions && regions.length > 0 && !regions.includes(profile.data.region)) {
        issues.push(`맞춤인데 지역 불일치: "${item.support.title}" (regions: ${JSON.stringify(regions)})`)
      }
    }

    // Check: 맞춤 결과 중 업종 불일치가 있는지
    for (const item of result.tailored) {
      const types = item.support.targetBusinessTypes
      if (types && types.length > 0 && !types.includes(profile.data.businessType)) {
        issues.push(`맞춤인데 업종 불일치: "${item.support.title}" (types: ${JSON.stringify(types)})`)
      }
    }

    // Check: all results have valid scores
    for (const item of result.all) {
      if (item.score < 0 || item.score > 1) {
        issues.push(`점수 범위 초과: ${item.score} for "${item.support.title}"`)
      }
    }

    // Check: tailored > recommended > exploratory score ordering
    if (result.tailored.length > 0 && result.recommended.length > 0) {
      const minTailored = Math.min(...result.tailored.map(t => t.score))
      const maxRecommended = Math.max(...result.recommended.map(t => t.score))
      if (minTailored < maxRecommended) {
        issues.push(`티어 역전: 맞춤 최저(${minTailored}) < 추천 최고(${maxRecommended})`)
      }
    }

    if (issues.length > 0) {
      console.log(`\n  ⚠️ ISSUES:`)
      for (const issue of issues) {
        console.log(`    - ${issue}`)
      }
    } else {
      console.log(`\n  ✅ 논리 검증 통과`)
    }
  }

  // Cross-profile analysis
  console.log("\n\n" + "=".repeat(100))
  console.log("=== CROSS-PROFILE ANALYSIS ===\n")

  const profileResults = TEST_PROFILES.map(p => ({
    name: p.name,
    result: matchSupportsV3(supports, p.data),
  }))

  // Check: different profiles should get different results
  console.log("Profile result diversity:")
  for (const pr of profileResults) {
    const topIds = new Set(pr.result.tailored.slice(0, 5).map(t => t.support.id))
    console.log(`  ${pr.name.slice(0, 30).padEnd(30)}: T=${pr.result.tailored.length} R=${pr.result.recommended.length} E=${pr.result.exploratory.length} Total=${pr.result.totalCount}`)
  }

  // Check overlap between very different profiles
  const seoul = profileResults[0] // 서울 음식점
  const busan = profileResults[1] // 부산 제조업
  const seoulIds = new Set(seoul.result.tailored.map(t => t.support.id))
  const busanIds = new Set(busan.result.tailored.map(t => t.support.id))
  const overlap = [...seoulIds].filter(id => busanIds.has(id))
  console.log(`\n서울음식점 vs 부산제조업 맞춤 겹침: ${overlap.length}/${Math.max(seoulIds.size, busanIds.size)} (${seoulIds.size}건 vs ${busanIds.size}건)`)
  if (overlap.length > 0) {
    console.log("  겹치는 항목:")
    for (const id of overlap.slice(0, 3)) {
      const item = seoul.result.tailored.find(t => t.support.id === id)
      if (item) console.log(`    - ${item.support.title}`)
    }
  }

  // Final verdict
  console.log("\n\n" + "=".repeat(100))
  console.log("=== FINAL VERDICT ===\n")

  const avgTotal = profileResults.reduce((s, p) => s + p.result.totalCount, 0) / profileResults.length
  const avgTailored = profileResults.reduce((s, p) => s + p.result.tailored.length, 0) / profileResults.length
  const allZeroTailored = profileResults.filter(p => p.result.tailored.length === 0).length
  const allOver100 = profileResults.filter(p => p.result.totalCount > 100).length

  console.log(`평균 총 결과: ${avgTotal.toFixed(1)}건`)
  console.log(`평균 맞춤: ${avgTailored.toFixed(1)}건`)
  console.log(`맞춤 0건 프로필: ${allZeroTailored}/${profileResults.length}`)
  console.log(`100건 초과 프로필: ${allOver100}/${profileResults.length}`)
  console.log(`데이터 있는 지원사업: ${withAnyData}/${supports.length}`)

  if (avgTotal > 100) {
    console.log("\n❌ 평균 결과가 100건 초과 — 알고리즘 조정 필요")
  } else if (avgTotal < 5) {
    console.log("\n⚠️ 평균 결과가 5건 미만 — 너무 엄격할 수 있음")
  } else {
    console.log("\n✅ 결과 수 적정 범위")
  }

  if (allZeroTailored > profileResults.length / 2) {
    console.log("⚠️ 절반 이상의 프로필에서 맞춤 결과 0건 — 데이터 품질 또는 임계값 검토 필요")
  }
}

main().catch(console.error)
