/**
 * Deep Review: API Communication + Matching Quality
 * 빌드 후 실행: npx tsx scripts/deep-review.ts
 */
import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

// .env.local 수동 파싱 (dotenv 의존성 없이)
const envContent = readFileSync('.env.local', 'utf-8')
for (const line of envContent.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eqIdx = trimmed.indexOf('=')
  if (eqIdx === -1) continue
  const key = trimmed.slice(0, eqIdx).trim()
  const val = trimmed.slice(eqIdx + 1).trim()
  if (!process.env[key]) process.env[key] = val
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// ─── Types (inline to avoid import issues) ───
interface Support {
  id: string; title: string; organization: string; category: string
  start_date: string | null; end_date: string | null; detail_url: string
  target_regions: string[] | null; target_business_types: string[] | null
  target_employee_min: number | null; target_employee_max: number | null
  target_revenue_min: number | null; target_revenue_max: number | null
  target_business_age_min: number | null; target_business_age_max: number | null
  target_founder_age_min: number | null; target_founder_age_max: number | null
  amount: string | null; is_active: boolean; source: string
  service_type: string | null
  target_age_min: number | null; target_age_max: number | null
  target_household_types: string[] | null; target_income_levels: string[] | null
  target_employment_status: string[] | null; benefit_categories: string[] | null
  extraction_confidence: Record<string, number> | null
  raw_eligibility_text: string | null; raw_exclusion_text: string | null
  raw_preference_text: string | null; external_id: string | null
  created_at: string; updated_at: string
}

// ─── 1. Data Quality Check ───
async function checkDataQuality() {
  console.log('\n' + '='.repeat(80))
  console.log('📊 1. DATA QUALITY CHECK')
  console.log('='.repeat(80))

  // Total count
  const { count: totalCount } = await supabase
    .from('supports')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
  console.log(`\n총 활성 지원사업 수: ${totalCount}`)

  // Service type distribution
  const { data: allRows } = await supabase
    .from('supports')
    .select('service_type, source')
    .eq('is_active', true)

  const serviceTypeDist: Record<string, number> = {}
  const sourceDist: Record<string, number> = {}
  for (const row of allRows || []) {
    const st = row.service_type || 'unknown'
    serviceTypeDist[st] = (serviceTypeDist[st] || 0) + 1
    const src = row.source || 'unknown'
    sourceDist[src] = (sourceDist[src] || 0) + 1
  }

  console.log('\n🏷️  Service Type 분포:')
  for (const [k, v] of Object.entries(serviceTypeDist).sort((a, b) => b[1] - a[1])) {
    const pct = ((v / (totalCount || 1)) * 100).toFixed(1)
    console.log(`  ${k.padEnd(12)} ${String(v).padStart(6)} (${pct}%)`)
  }

  console.log('\n📡 Source 분포:')
  for (const [k, v] of Object.entries(sourceDist).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k.padEnd(25)} ${String(v).padStart(6)}`)
  }

  // Extraction coverage
  const PAGE = 1000
  let from = 0
  const allSupports: Support[] = []
  while (true) {
    const { data } = await supabase
      .from('supports')
      .select('*')
      .eq('is_active', true)
      .range(from, from + PAGE - 1)
    if (!data || data.length === 0) break
    allSupports.push(...(data as unknown as Support[]))
    if (data.length < PAGE) break
    from += PAGE
  }

  let hasRegion = 0, hasBusinessType = 0, hasAge = 0, hasHousehold = 0
  let hasIncome = 0, hasEmployment = 0, hasCategories = 0
  let hasEmployee = 0, hasRevenue = 0, hasBizAge = 0, hasFounderAge = 0

  for (const s of allSupports) {
    if (s.target_regions && s.target_regions.length > 0) hasRegion++
    if (s.target_business_types && s.target_business_types.length > 0) hasBusinessType++
    if (s.target_age_min !== null || s.target_age_max !== null) hasAge++
    if (s.target_household_types && s.target_household_types.length > 0) hasHousehold++
    if (s.target_income_levels && s.target_income_levels.length > 0) hasIncome++
    if (s.target_employment_status && s.target_employment_status.length > 0) hasEmployment++
    if (s.benefit_categories && s.benefit_categories.length > 0) hasCategories++
    if (s.target_employee_min !== null || s.target_employee_max !== null) hasEmployee++
    if (s.target_revenue_min !== null || s.target_revenue_max !== null) hasRevenue++
    if (s.target_business_age_min !== null || s.target_business_age_max !== null) hasBizAge++
    if (s.target_founder_age_min !== null || s.target_founder_age_max !== null) hasFounderAge++
  }

  const total = allSupports.length
  const pct = (n: number) => `${n} / ${total} (${((n / total) * 100).toFixed(1)}%)`

  console.log('\n📈 Extraction Coverage:')
  console.log(`  regions              ${pct(hasRegion)}`)
  console.log(`  businessTypes        ${pct(hasBusinessType)}`)
  console.log(`  age (min/max)        ${pct(hasAge)}`)
  console.log(`  householdTypes       ${pct(hasHousehold)}`)
  console.log(`  incomeLevels         ${pct(hasIncome)}`)
  console.log(`  employmentStatus     ${pct(hasEmployment)}`)
  console.log(`  benefitCategories    ${pct(hasCategories)}`)
  console.log(`  employee (min/max)   ${pct(hasEmployee)}`)
  console.log(`  revenue (min/max)    ${pct(hasRevenue)}`)
  console.log(`  businessAge          ${pct(hasBizAge)}`)
  console.log(`  founderAge           ${pct(hasFounderAge)}`)

  // Duplicate check by external_id
  const extIds: Record<string, number> = {}
  for (const s of allSupports) {
    if (s.external_id) {
      extIds[s.external_id] = (extIds[s.external_id] || 0) + 1
    }
  }
  const dupes = Object.entries(extIds).filter(([, c]) => c > 1)
  console.log(`\n🔍 중복 체크 (external_id 기준): ${dupes.length}건 중복`)
  if (dupes.length > 0 && dupes.length <= 10) {
    for (const [id, count] of dupes) {
      console.log(`  ${id}: ${count}건`)
    }
  }

  // Service type tagging coverage
  const tagged = allSupports.filter(s => s.service_type && s.service_type !== 'unknown').length
  console.log(`\n🏷️  Service Type 태깅률: ${pct(tagged)}`)

  return allSupports
}

// ─── 2. Matching Test ───
// We import matching-v4 via dynamic import with tsx path alias
async function runMatchingTests(allSupports: Support[]) {
  console.log('\n' + '='.repeat(80))
  console.log('🎯 2. MATCHING QUALITY TESTS')
  console.log('='.repeat(80))

  // Import matching engine
  const { matchSupportsV4 } = await import('../src/lib/matching-v4/index.js')
  const { mapSupportRow } = await import('../src/lib/supabase/mappers.js')

  // Map DB rows to Support type
  const supports = allSupports.map(row => mapSupportRow(row as never))

  // ─── Personal Profiles ───
  const personalProfiles = [
    {
      name: 'Profile A: 서울/20대/여성/1인가구/구직자/중위50이하/[취업,주거]',
      input: {
        userType: 'personal' as const,
        ageGroup: '20대', gender: '여성', region: '서울',
        householdType: '1인', incomeLevel: '중위50이하',
        employmentStatus: '구직자', interestCategories: ['취업', '주거'],
      },
      expectedKeywords: ['취업', '주거', '청년', '고용', '일자리'],
      unexpectedKeywords: ['사업자', '기업', '노인', '어르신'],
    },
    {
      name: 'Profile B: 경기/40대/남성/다자녀/재직자/중위100이하/[육아,교육]',
      input: {
        userType: 'personal' as const,
        ageGroup: '40대', gender: '남성', region: '경기',
        householdType: '다자녀', incomeLevel: '중위100이하',
        employmentStatus: '재직자', interestCategories: ['육아', '교육'],
      },
      expectedKeywords: ['자녀', '육아', '교육', '다자녀', '양육'],
      unexpectedKeywords: [],
    },
    {
      name: 'Profile C: 부산/60대이상/여성/1인가구/은퇴/기초생활/[건강,생활]',
      input: {
        userType: 'personal' as const,
        ageGroup: '60대이상', gender: '여성', region: '부산',
        householdType: '1인', incomeLevel: '기초생활',
        employmentStatus: '은퇴', interestCategories: ['건강', '생활'],
      },
      expectedKeywords: ['건강', '생활', '복지', '의료', '기초'],
      unexpectedKeywords: ['창업', '청년'],
    },
    {
      name: 'Profile D: 전남/30대/남성/신혼부부/재직자/중위100초과/[주거]',
      input: {
        userType: 'personal' as const,
        ageGroup: '30대', gender: '남성', region: '전남',
        householdType: '신혼부부', incomeLevel: '중위100초과',
        employmentStatus: '재직자', interestCategories: ['주거'],
      },
      expectedKeywords: ['주거', '신혼', '주택'],
      unexpectedKeywords: [],
    },
  ]

  // ─── Business Profiles ───
  const businessProfiles = [
    {
      name: 'Profile E: 서울/음식점/7명/3억/2년/35세',
      input: {
        userType: 'business' as const,
        businessType: '음식점업', region: '서울',
        employeeCount: 7, annualRevenue: 300_000_000,
        businessAge: 24, founderAge: 35,
      },
      expectedKeywords: ['소상공인', '중소', '음식', '외식'],
      unexpectedKeywords: [],
    },
    {
      name: 'Profile F: 경기/정보통신업/3명/1억/1년미만/28세',
      input: {
        userType: 'business' as const,
        businessType: '정보통신업', region: '경기',
        employeeCount: 3, annualRevenue: 100_000_000,
        businessAge: 6, founderAge: 28,
      },
      expectedKeywords: ['창업', '스타트업', '기술', '정보통신', 'IT', 'R&D', '벤처'],
      unexpectedKeywords: [],
    },
  ]

  const allProfiles = [...personalProfiles, ...businessProfiles]

  for (const profile of allProfiles) {
    console.log(`\n${'─'.repeat(70)}`)
    console.log(`🧪 ${profile.name}`)
    console.log('─'.repeat(70))

    const result = matchSupportsV4(supports, profile.input)

    console.log(`\n  📊 요약:`)
    console.log(`    총 분석:      ${result.totalAnalyzed}`)
    console.log(`    서비스타입 필터: ${result.filteredByServiceType}`)
    console.log(`    Knockout:     ${result.knockedOut}`)
    console.log(`    매칭 결과:     ${result.totalCount}`)
    console.log(`    ├─ Tailored:     ${result.tailored.length}`)
    console.log(`    ├─ Recommended:  ${result.recommended.length}`)
    console.log(`    └─ Exploratory:  ${result.exploratory.length}`)

    // Top 5 tailored
    if (result.tailored.length > 0) {
      console.log(`\n  🏆 Top ${Math.min(5, result.tailored.length)} Tailored:`)
      for (const item of result.tailored.slice(0, 5)) {
        const dims = Object.entries(item.breakdown)
          .filter(([k]) => !['confidence', 'weighted', 'coverage'].includes(k))
          .map(([k, v]) => `${k}:${v}`)
          .join(' ')
        console.log(`    [${item.score.toFixed(3)}] ${item.support.title.slice(0, 55).padEnd(55)} | ${item.support.organization.slice(0, 12)} | ${dims}`)
      }
    }

    // Top 3 recommended
    if (result.recommended.length > 0) {
      console.log(`\n  ⭐ Top ${Math.min(3, result.recommended.length)} Recommended:`)
      for (const item of result.recommended.slice(0, 3)) {
        console.log(`    [${item.score.toFixed(3)}] ${item.support.title.slice(0, 55).padEnd(55)} | ${item.support.organization.slice(0, 12)}`)
      }
    }

    // Top 3 exploratory
    if (result.exploratory.length > 0) {
      console.log(`\n  🔍 Top ${Math.min(3, result.exploratory.length)} Exploratory:`)
      for (const item of result.exploratory.slice(0, 3)) {
        console.log(`    [${item.score.toFixed(3)}] ${item.support.title.slice(0, 55).padEnd(55)} | ${item.support.organization.slice(0, 12)}`)
      }
    }

    // Keyword check
    const allTitles = result.all.map(s => s.support.title + ' ' + (s.support.category || '')).join(' ')
    const expectedHits = profile.expectedKeywords.filter(kw => allTitles.includes(kw))
    const unexpectedHits = profile.unexpectedKeywords.filter(kw => {
      // Only check in tailored tier
      const tailoredText = result.tailored.map(s => s.support.title).join(' ')
      return tailoredText.includes(kw)
    })

    console.log(`\n  ✅ 기대 키워드 매칭: ${expectedHits.length}/${profile.expectedKeywords.length} — [${expectedHits.join(', ')}]`)
    if (expectedHits.length < profile.expectedKeywords.length) {
      const missed = profile.expectedKeywords.filter(kw => !expectedHits.includes(kw))
      console.log(`  ⚠️  누락 키워드: [${missed.join(', ')}]`)
    }
    if (unexpectedHits.length > 0) {
      console.log(`  ❌ 비기대 키워드 (tailored에서 발견): [${unexpectedHits.join(', ')}]`)
    }

    // Service type analysis
    const tierServiceTypes: Record<string, Record<string, number>> = {}
    for (const tier of ['tailored', 'recommended', 'exploratory'] as const) {
      const dist: Record<string, number> = {}
      for (const item of result[tier]) {
        const st = item.support.serviceType || 'unknown'
        dist[st] = (dist[st] || 0) + 1
      }
      tierServiceTypes[tier] = dist
    }
    console.log(`\n  📦 결과 서비스 타입 분포:`)
    for (const [tier, dist] of Object.entries(tierServiceTypes)) {
      if (Object.keys(dist).length > 0) {
        const parts = Object.entries(dist).map(([k, v]) => `${k}:${v}`).join(' ')
        console.log(`    ${tier.padEnd(14)} ${parts}`)
      }
    }

    // Category distribution
    const catDist: Record<string, number> = {}
    for (const item of result.all) {
      const cat = item.support.category || 'unknown'
      catDist[cat] = (catDist[cat] || 0) + 1
    }
    console.log(`\n  📂 카테고리 분포:`)
    const catEntries = Object.entries(catDist).sort((a, b) => b[1] - a[1])
    for (const [cat, count] of catEntries.slice(0, 8)) {
      console.log(`    ${cat.padEnd(8)} ${count}`)
    }

    // Source distribution in results
    const srcDist: Record<string, number> = {}
    for (const item of result.all) {
      const src = item.support.source || 'unknown'
      srcDist[src] = (srcDist[src] || 0) + 1
    }
    console.log(`\n  📡 소스 분포:`)
    for (const [src, count] of Object.entries(srcDist).sort((a, b) => b[1] - a[1])) {
      console.log(`    ${src.padEnd(25)} ${count}`)
    }
  }

  // ─── Cross-track differentiation ───
  console.log('\n' + '='.repeat(80))
  console.log('🔀 3. CROSS-TRACK DIFFERENTIATION')
  console.log('='.repeat(80))

  const personalResult = matchSupportsV4(supports, personalProfiles[0].input)
  const businessResult = matchSupportsV4(supports, businessProfiles[0].input)

  const personalIds = new Set(personalResult.all.map(s => s.support.id))
  const businessIds = new Set(businessResult.all.map(s => s.support.id))

  const overlap = [...personalIds].filter(id => businessIds.has(id)).length
  const personalOnly = personalIds.size - overlap
  const businessOnly = businessIds.size - overlap

  console.log(`\n  Profile A (personal) 결과: ${personalIds.size}건`)
  console.log(`  Profile E (business) 결과: ${businessIds.size}건`)
  console.log(`  중복:                      ${overlap}건`)
  console.log(`  Personal 전용:             ${personalOnly}건`)
  console.log(`  Business 전용:             ${businessOnly}건`)
  console.log(`  차별화율:                  ${(((personalOnly + businessOnly) / (personalIds.size + businessIds.size - overlap)) * 100).toFixed(1)}%`)

  if (overlap > 0) {
    console.log(`\n  중복 항목 (최대 5건):`)
    const overlapItems = personalResult.all.filter(s => businessIds.has(s.support.id)).slice(0, 5)
    for (const item of overlapItems) {
      console.log(`    ${item.support.title.slice(0, 60)} | svc_type: ${item.support.serviceType}`)
    }
  }
}

// ─── Main ───
async function main() {
  console.log('🚀 혜택찾기 Deep Review — API & Matching Quality')
  console.log(`   실행 시각: ${new Date().toISOString()}`)
  console.log(`   Supabase: ${supabaseUrl}`)

  try {
    const allSupports = await checkDataQuality()
    await runMatchingTests(allSupports)

    console.log('\n' + '='.repeat(80))
    console.log('✅ DEEP REVIEW 완료')
    console.log('='.repeat(80))
  } catch (err) {
    console.error('\n❌ Error:', err)
    process.exit(1)
  }
}

main()
