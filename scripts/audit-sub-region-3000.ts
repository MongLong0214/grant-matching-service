/**
 * 구/군 단위 매칭 전수조사 (3000 cases)
 * - 1500 personal + 1500 business
 * - Type A (50%): sub-region 일치 검증
 * - Type B (30%): sub-region 영향 없음 검증
 * - Type C (20%): sub-region 미선택 fallback 검증
 */

import { readFileSync } from 'fs'

// --- Env 로딩 ---
const envFile = readFileSync('.env.local', 'utf-8')
for (const l of envFile.split('\n')) {
  const t = l.trim()
  if (!t || t.startsWith('#')) continue
  const e = t.indexOf('=')
  if (e === -1) continue
  const k = t.slice(0, e).trim()
  let v = t.slice(e + 1).trim()
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1)
  }
  if (!process.env[k]) process.env[k] = v
}

import { createClient } from '@supabase/supabase-js'
import { matchSupportsV4 } from '../src/lib/matching-v4/index'
import type { Support, UserInput, SupportCategory, ServiceType } from '../src/types'
import type { MatchResultV4, ScoredSupportV4 } from '../src/lib/matching-v4/index'

// --- Constants (실제 src/constants/index.ts 값 사용) ---
const REGIONS = [
  '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
  '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
] as const

const REGION_DISTRICTS: Record<string, string[]> = {
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

// Personal form option values
const AGE_GROUPS = ['10대', '20대', '30대', '40대', '50대', '60대이상']
const GENDERS = ['남성', '여성']
const HOUSEHOLD_TYPES = ['1인', '신혼부부', '영유아', '다자녀', '한부모', '일반']
const INCOME_LEVELS = ['기초생활', '차상위', '중위50이하', '중위100이하', '중위100초과']
const EMPLOYMENT_STATUSES = ['재직자', '구직자', '학생', '자영업', '무직', '은퇴']
const INTEREST_CATEGORIES = ['주거', '육아', '교육', '취업', '건강', '생활', '문화']

// Business form option values
const BUSINESS_TYPES_LIST = ['음식점업', '소매업', '도매업', '제조업', '건설업', '운수업', '숙박업', '정보통신업', '전문서비스업', '교육서비스업', '보건업', '예술/스포츠', '기타서비스업']
const EMPLOYEE_VALUES = [2, 7, 30, 75, 150]
const REVENUE_VALUES = [50_000_000, 300_000_000, 750_000_000, 3_000_000_000, 10_000_000_000]
const BUSINESS_AGE_VALUES = [-1, 6, 24, 48, 84, 180]
const FOUNDER_AGE_VALUES = [25, 35, 45, 55, 65]

// --- Helpers ---
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function pickN<T>(arr: readonly T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n)
}

function mapSupportRow(row: Record<string, unknown>): Support {
  return {
    id: row.id as string,
    title: row.title as string,
    organization: row.organization as string,
    category: row.category as SupportCategory,
    startDate: row.start_date as string | null,
    endDate: row.end_date as string | null,
    detailUrl: row.detail_url as string,
    targetRegions: row.target_regions as string[] | null,
    targetSubRegions: row.target_sub_regions as string[] | null,
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
    rawEligibilityText: row.raw_eligibility_text as string | null,
    rawExclusionText: row.raw_exclusion_text as string | null,
    rawPreferenceText: row.raw_preference_text as string | null,
    extractionConfidence: row.extraction_confidence as Record<string, number> | null,
    externalId: row.external_id as string | null,
    serviceType: (row.service_type as ServiceType) ?? 'unknown',
    regionScope: (row.region_scope as 'national' | 'regional' | 'unknown') ?? 'unknown',
    targetAgeMin: row.target_age_min as number | null,
    targetAgeMax: row.target_age_max as number | null,
    targetHouseholdTypes: row.target_household_types as string[] | null,
    targetIncomeLevels: row.target_income_levels as string[] | null,
    targetEmploymentStatus: row.target_employment_status as string[] | null,
    benefitCategories: row.benefit_categories as string[] | null,
  }
}

// --- Types ---
interface TestProfile {
  input: UserInput
  profileType: 'A' | 'B' | 'C'
  targetRegion: string
  targetSubRegion: string | undefined
  userType: 'personal' | 'business'
}

interface SubRegionStats {
  region: string
  subRegion: string
  count: number
}

// --- Main ---
async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE env vars')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // --- Load all active supports ---
  console.log('Loading supports...')
  const allSupports: Support[] = []
  const PAGE_SIZE = 1000
  let offset = 0
  while (true) {
    const { data, error } = await supabase
      .from('supports')
      .select('id, title, organization, category, start_date, end_date, detail_url, target_regions, target_sub_regions, target_business_types, target_employee_min, target_employee_max, target_revenue_min, target_revenue_max, target_business_age_min, target_business_age_max, target_founder_age_min, target_founder_age_max, target_age_min, target_age_max, target_household_types, target_income_levels, target_employment_status, benefit_categories, amount, is_active, created_at, updated_at, source, raw_eligibility_text, raw_exclusion_text, raw_preference_text, extraction_confidence, external_id, service_type, region_scope')
      .eq('is_active', true)
      .range(offset, offset + PAGE_SIZE - 1)

    if (error) { console.error('DB error:', error); process.exit(1) }
    if (!data || data.length === 0) break
    for (const row of data) {
      allSupports.push(mapSupportRow(row as Record<string, unknown>))
    }
    offset += PAGE_SIZE
    if (data.length < PAGE_SIZE) break
  }
  console.log(`Loaded ${allSupports.length} active supports`)

  // --- Data Analysis ---
  const subRegionSupports = allSupports.filter(
    s => s.targetSubRegions && s.targetSubRegions.length > 0
  )
  console.log(`\nSub-region supports: ${subRegionSupports.length} (${(subRegionSupports.length / allSupports.length * 100).toFixed(1)}%)`)

  // region+subRegion 조합별 카운트
  const comboMap = new Map<string, SubRegionStats>()
  const regionSubRegionCount = new Map<string, number>()
  for (const s of subRegionSupports) {
    const regions = s.targetRegions ?? []
    const subRegions = s.targetSubRegions ?? []
    for (const region of regions) {
      regionSubRegionCount.set(region, (regionSubRegionCount.get(region) ?? 0) + 1)
      for (const sub of subRegions) {
        const key = `${region}|${sub}`
        const existing = comboMap.get(key)
        if (existing) {
          existing.count++
        } else {
          comboMap.set(key, { region, subRegion: sub, count: 1 })
        }
      }
    }
  }

  // 시/도별 분포
  console.log('\n시/도별 sub-region supports 분포:')
  const sortedRegions = [...regionSubRegionCount.entries()].sort((a, b) => b[1] - a[1])
  for (const [r, c] of sortedRegions) {
    console.log(`  ${r}: ${c}`)
  }

  // Top 10 구/군
  const sortedCombos = [...comboMap.values()].sort((a, b) => b.count - a.count)
  console.log('\nTop 10 구/군 (가장 많은 sub-region supports):')
  for (const combo of sortedCombos.slice(0, 10)) {
    console.log(`  ${combo.region} ${combo.subRegion}: ${combo.count}건`)
  }

  // --- Build sub-region lookup for Type A profile generation ---
  // 지역별로 유효한 구/군 목록 (REGION_DISTRICTS에 존재 + supports에도 있는 것)
  const validCombos = sortedCombos.filter(c => {
    const districts = REGION_DISTRICTS[c.region]
    return districts && districts.includes(c.subRegion)
  })

  // 지역 + 구/군 중 supports가 없는 조합 (Type B용)
  const regionsWithDistricts = REGIONS.filter(r => REGION_DISTRICTS[r].length > 0)
  const noSubRegionCombos: Array<{ region: string; subRegion: string }> = []
  for (const region of regionsWithDistricts) {
    for (const district of REGION_DISTRICTS[region]) {
      const key = `${region}|${district}`
      if (!comboMap.has(key)) {
        noSubRegionCombos.push({ region, subRegion: district })
      }
    }
  }

  // --- Profile generation ---
  const PERSONAL_COUNT = 1500
  const BUSINESS_COUNT = 1500
  const TYPE_A_RATIO = 0.5
  const TYPE_B_RATIO = 0.3
  const TYPE_C_RATIO = 0.2

  function makePersonalInput(region: string, subRegion: string | undefined): UserInput {
    const cats = pickN(INTEREST_CATEGORIES, 1 + Math.floor(Math.random() * 3))
    return {
      userType: 'personal' as const,
      ageGroup: pick(AGE_GROUPS),
      gender: pick(GENDERS),
      region,
      subRegion,
      householdType: pick(HOUSEHOLD_TYPES),
      incomeLevel: pick(INCOME_LEVELS),
      employmentStatus: pick(EMPLOYMENT_STATUSES),
      interestCategories: cats,
    }
  }

  function makeBusinessInput(region: string, subRegion: string | undefined): UserInput {
    return {
      userType: 'business' as const,
      businessType: pick(BUSINESS_TYPES_LIST),
      region,
      subRegion,
      employeeCount: pick(EMPLOYEE_VALUES),
      annualRevenue: pick(REVENUE_VALUES),
      businessAge: pick(BUSINESS_AGE_VALUES),
      founderAge: pick(FOUNDER_AGE_VALUES),
    }
  }

  function generateProfiles(
    count: number,
    userType: 'personal' | 'business',
  ): TestProfile[] {
    const profiles: TestProfile[] = []
    const typeACount = Math.round(count * TYPE_A_RATIO)
    const typeBCount = Math.round(count * TYPE_B_RATIO)
    const typeCCount = count - typeACount - typeBCount

    // Type A: sub-region 일치 (가장 많은 combo 우선 사용)
    for (let i = 0; i < typeACount; i++) {
      const combo = validCombos.length > 0
        ? validCombos[i % validCombos.length]
        : { region: pick(regionsWithDistricts), subRegion: pick(REGION_DISTRICTS[pick(regionsWithDistricts)]) }
      const input = userType === 'personal'
        ? makePersonalInput(combo.region, combo.subRegion)
        : makeBusinessInput(combo.region, combo.subRegion)
      profiles.push({
        input,
        profileType: 'A',
        targetRegion: combo.region,
        targetSubRegion: combo.subRegion,
        userType,
      })
    }

    // Type B: sub-region supports가 없는 구/군 선택
    for (let i = 0; i < typeBCount; i++) {
      const combo = noSubRegionCombos.length > 0
        ? noSubRegionCombos[i % noSubRegionCombos.length]
        : { region: pick(regionsWithDistricts), subRegion: pick(REGION_DISTRICTS[pick(regionsWithDistricts)]) }
      const input = userType === 'personal'
        ? makePersonalInput(combo.region, combo.subRegion)
        : makeBusinessInput(combo.region, combo.subRegion)
      profiles.push({
        input,
        profileType: 'B',
        targetRegion: combo.region,
        targetSubRegion: combo.subRegion,
        userType,
      })
    }

    // Type C: sub-region 미선택
    for (let i = 0; i < typeCCount; i++) {
      const region = pick(REGIONS)
      const input = userType === 'personal'
        ? makePersonalInput(region, undefined)
        : makeBusinessInput(region, undefined)
      profiles.push({
        input,
        profileType: 'C',
        targetRegion: region,
        targetSubRegion: undefined,
        userType,
      })
    }

    return profiles
  }

  console.log('\nGenerating profiles...')
  const personalProfiles = generateProfiles(PERSONAL_COUNT, 'personal')
  const businessProfiles = generateProfiles(BUSINESS_COUNT, 'business')
  const allProfiles = [...personalProfiles, ...businessProfiles]

  console.log(`Generated ${personalProfiles.length} personal + ${businessProfiles.length} business = ${allProfiles.length} profiles`)
  console.log(`  Type A: ${allProfiles.filter(p => p.profileType === 'A').length}`)
  console.log(`  Type B: ${allProfiles.filter(p => p.profileType === 'B').length}`)
  console.log(`  Type C: ${allProfiles.filter(p => p.profileType === 'C').length}`)

  // --- Run matching + analysis ---
  console.log('\nRunning matching...')

  // Per-type metrics accumulators
  interface TypeMetrics {
    count: number
    // Type A specific
    subRegionSupportsFound: number // how many sub-region supports existed for this profile
    subRegionInTailored: number
    subRegionInRecommended: number
    subRegionInExploratory: number
    subRegionMissed: number
    scoreLiftSum: number
    scoreLiftCount: number
    // Type B specific
    noImpactCount: number
    // Type C specific
    fallbackAppliedCount: number
    // Differentiation: same region, different subRegion
    diffCheckCount: number
    diffFoundCount: number
  }

  const metrics: Record<string, TypeMetrics> = {
    'personal-A': { count: 0, subRegionSupportsFound: 0, subRegionInTailored: 0, subRegionInRecommended: 0, subRegionInExploratory: 0, subRegionMissed: 0, scoreLiftSum: 0, scoreLiftCount: 0, noImpactCount: 0, fallbackAppliedCount: 0, diffCheckCount: 0, diffFoundCount: 0 },
    'personal-B': { count: 0, subRegionSupportsFound: 0, subRegionInTailored: 0, subRegionInRecommended: 0, subRegionInExploratory: 0, subRegionMissed: 0, scoreLiftSum: 0, scoreLiftCount: 0, noImpactCount: 0, fallbackAppliedCount: 0, diffCheckCount: 0, diffFoundCount: 0 },
    'personal-C': { count: 0, subRegionSupportsFound: 0, subRegionInTailored: 0, subRegionInRecommended: 0, subRegionInExploratory: 0, subRegionMissed: 0, scoreLiftSum: 0, scoreLiftCount: 0, noImpactCount: 0, fallbackAppliedCount: 0, diffCheckCount: 0, diffFoundCount: 0 },
    'business-A': { count: 0, subRegionSupportsFound: 0, subRegionInTailored: 0, subRegionInRecommended: 0, subRegionInExploratory: 0, subRegionMissed: 0, scoreLiftSum: 0, scoreLiftCount: 0, noImpactCount: 0, fallbackAppliedCount: 0, diffCheckCount: 0, diffFoundCount: 0 },
    'business-B': { count: 0, subRegionSupportsFound: 0, subRegionInTailored: 0, subRegionInRecommended: 0, subRegionInExploratory: 0, subRegionMissed: 0, scoreLiftSum: 0, scoreLiftCount: 0, noImpactCount: 0, fallbackAppliedCount: 0, diffCheckCount: 0, diffFoundCount: 0 },
    'business-C': { count: 0, subRegionSupportsFound: 0, subRegionInTailored: 0, subRegionInRecommended: 0, subRegionInExploratory: 0, subRegionMissed: 0, scoreLiftSum: 0, scoreLiftCount: 0, noImpactCount: 0, fallbackAppliedCount: 0, diffCheckCount: 0, diffFoundCount: 0 },
  }

  // Global precision/recall counters
  let totalSubRegionExists = 0 // total sub-region supports that exist for profiles
  let totalSubRegionMatched = 0 // of those, how many appear in matching results
  let totalSubRegionInTopTiers = 0 // in tailored or recommended

  // 지역 FP 검증: 다른 시/도의 regional 정책이 추천된 건수
  let regionFpTotal = 0   // 검사 대상 (regional scope인 결과)
  let regionFpCount = 0   // 유저 시/도와 다른 시/도의 regional 정책

  // region_scope 분석: tier별 unknown 포함 비율
  let unknownInTopTier = 0
  let topTierTotal = 0
  let unknownInTailored = 0
  let tailoredTotal = 0
  let unknownInRecommended = 0
  let recommendedTotal = 0

  // cross-track 검증: personal 유저가 business-only 받는지, vice versa
  let crossTrackViolations = 0
  let crossTrackChecks = 0

  // 0-match 검사: 아무 결과도 못 받은 프로필 수
  let zeroMatchCount = 0

  let processed = 0
  for (const profile of allProfiles) {
    processed++
    if (processed % 500 === 0) console.log(`  Processed ${processed}/${allProfiles.length}...`)

    const key = `${profile.userType}-${profile.profileType}` as keyof typeof metrics
    const m = metrics[key]
    m.count++

    const result = matchSupportsV4(allSupports, profile.input)

    // sub-region supports 중 이 프로필과 관련된 것 찾기
    const relevantSubRegionSupports = allSupports.filter(s => {
      if (!s.targetSubRegions || s.targetSubRegions.length === 0) return false
      if (!s.targetRegions || !s.targetRegions.includes(profile.targetRegion)) return false
      if (profile.targetSubRegion && s.targetSubRegions.includes(profile.targetSubRegion)) return true
      return false
    })

    if (profile.profileType === 'A') {
      m.subRegionSupportsFound += relevantSubRegionSupports.length
      totalSubRegionExists += relevantSubRegionSupports.length

      // 매칭 결과에서 이 supports가 어디에 있는지 확인
      for (const sr of relevantSubRegionSupports) {
        const inTailored = result.tailored.some(s => s.support.id === sr.id)
        const inRecommended = result.recommended.some(s => s.support.id === sr.id)
        const inExploratory = result.exploratory.some(s => s.support.id === sr.id)
        const inAny = result.all.some(s => s.support.id === sr.id)

        if (inTailored) { m.subRegionInTailored++; totalSubRegionInTopTiers++; totalSubRegionMatched++ }
        else if (inRecommended) { m.subRegionInRecommended++; totalSubRegionInTopTiers++; totalSubRegionMatched++ }
        else if (inExploratory) { m.subRegionInExploratory++; totalSubRegionMatched++ }
        else if (inAny) { totalSubRegionMatched++ } // in all but not in named tiers (unlikely)
        else { m.subRegionMissed++ }
      }

      // 대조 실험: subRegion 없이 매칭
      const inputWithout = { ...profile.input, subRegion: undefined }
      const resultWithout = matchSupportsV4(allSupports, inputWithout)

      // score lift 계산: sub-region supports의 평균 점수 비교
      for (const sr of relevantSubRegionSupports) {
        const withScore = result.all.find(s => s.support.id === sr.id)?.score ?? 0
        const withoutScore = resultWithout.all.find(s => s.support.id === sr.id)?.score ?? 0
        if (withScore > 0 || withoutScore > 0) {
          m.scoreLiftSum += (withScore - withoutScore)
          m.scoreLiftCount++
        }
      }
    }

    if (profile.profileType === 'B') {
      // Type B: sub-region 선택했지만 해당 조합의 supports 없음
      // 결과가 subRegion 없을 때와 같은지 확인
      const inputWithout = { ...profile.input, subRegion: undefined }
      const resultWithout = matchSupportsV4(allSupports, inputWithout)

      // 결과 동일성 검사: all 배열의 id 순서 + score 비교
      const ids1 = result.all.map(s => s.support.id).join(',')
      const ids2 = resultWithout.all.map(s => s.support.id).join(',')
      // sub-region이 있는 supports에 대해 0.5 점수를 받을 수 있으므로 완전 동일하지 않을 수 있음
      // 대신 "영향이 미미한지" 검증 -- 결과 수가 비슷하고 top-10이 같은지
      const topIds1 = result.all.slice(0, 10).map(s => s.support.id)
      const topIds2 = resultWithout.all.slice(0, 10).map(s => s.support.id)
      const topOverlap = topIds1.filter(id => topIds2.includes(id)).length
      // top-10 중 8개 이상 겹치면 "영향 없음"으로 판정
      if (topOverlap >= 8 || ids1 === ids2) {
        m.noImpactCount++
      }
    }

    if (profile.profileType === 'C') {
      // Type C: subRegion 미선택 — sub-region supports에 0.85가 적용되는지 확인
      const subRegionSupportsInRegion = allSupports.filter(s => {
        if (!s.targetSubRegions || s.targetSubRegions.length === 0) return false
        if (!s.targetRegions || !s.targetRegions.includes(profile.targetRegion)) return false
        return s.regionScope === 'regional'
      })

      if (subRegionSupportsInRegion.length > 0) {
        let fallbackApplied = 0
        for (const sr of subRegionSupportsInRegion) {
          const scored = result.all.find(s => s.support.id === sr.id)
          if (scored && scored.breakdown && scored.breakdown['region'] !== undefined) {
            // region raw score가 0.85이면 fallback 적용됨 (userSubRegion=undefined)
            if (Math.abs(scored.breakdown['region'] - 0.85) < 0.01) {
              fallbackApplied++
            }
          }
        }
        if (fallbackApplied > 0) {
          m.fallbackAppliedCount++
        }
      }
    }

    // ── 지역 FP 검증: regional 정책 중 유저 시/도와 다른 것이 추천되면 FP ──
    for (const scored of result.all) {
      const s = scored.support
      if (s.regionScope === 'regional' && s.targetRegions && s.targetRegions.length > 0) {
        regionFpTotal++
        if (!s.targetRegions.includes(profile.targetRegion)) {
          regionFpCount++
          if (regionFpCount <= 5) {
            console.log(`  [FP] "${s.title}" (${s.targetRegions.join(',')}) → ${profile.userType} ${profile.targetRegion} ${profile.targetSubRegion || ''}`)
          }
        }
      }
    }

    // ── unknown-in-tier 검증 ──
    for (const scored of result.tailored) {
      tailoredTotal++
      topTierTotal++
      if (scored.support.regionScope === 'unknown') { unknownInTailored++; unknownInTopTier++ }
    }
    for (const scored of result.recommended) {
      recommendedTotal++
      topTierTotal++
      if (scored.support.regionScope === 'unknown') { unknownInRecommended++; unknownInTopTier++ }
    }

    // ── cross-track 검증 ──
    for (const scored of result.all) {
      crossTrackChecks++
      const st = scored.support.serviceType ?? 'unknown'
      if (profile.userType === 'personal' && st === 'business') crossTrackViolations++
      if (profile.userType === 'business' && st === 'personal') crossTrackViolations++
    }

    // ── 0-match 검사 ──
    if (result.all.length === 0) zeroMatchCount++

    // Differentiation: 같은 시/도 내 다른 구/군 선택 시 결과 차이율 (Type A만, 매 10번째 프로필)
    if (profile.profileType === 'A' && processed % 10 === 0 && profile.targetSubRegion) {
      const districts = REGION_DISTRICTS[profile.targetRegion] ?? []
      const otherDistricts = districts.filter(d => d !== profile.targetSubRegion)
      if (otherDistricts.length > 0) {
        const otherDistrict = pick(otherDistricts)
        const altInput = { ...profile.input, subRegion: otherDistrict }
        const altResult = matchSupportsV4(allSupports, altInput)
        const origIds = new Set(result.all.map(s => s.support.id))
        const altIds = new Set(altResult.all.map(s => s.support.id))
        const union = new Set([...origIds, ...altIds])
        const intersection = [...origIds].filter(id => altIds.has(id))
        const diffRatio = union.size > 0 ? 1 - (intersection.length / union.size) : 0
        m.diffCheckCount++
        if (diffRatio > 0.05) m.diffFoundCount++ // 5% 이상 다르면 차이 있음
      }
    }
  }

  // --- Report ---
  console.log('\n' + '='.repeat(70))
  console.log('=== 구/군 단위 매칭 전수조사 (3000 cases) ===')
  console.log('='.repeat(70))

  console.log('\n--- 데이터 현황 ---')
  console.log(`총 supports: ${allSupports.length}`)
  console.log(`sub-region 있는 supports: ${subRegionSupports.length} (${(subRegionSupports.length / allSupports.length * 100).toFixed(1)}%)`)
  console.log('\n시/도별 sub-region supports 분포:')
  for (const [r, c] of sortedRegions) {
    console.log(`  ${r}: ${c}건`)
  }
  console.log('\nTop 10 구/군:')
  for (const combo of sortedCombos.slice(0, 10)) {
    console.log(`  ${combo.region} ${combo.subRegion}: ${combo.count}건`)
  }

  // Type A
  const typeAPersonal = metrics['personal-A']
  const typeABusiness = metrics['business-A']
  const typeATotal = {
    count: typeAPersonal.count + typeABusiness.count,
    found: typeAPersonal.subRegionSupportsFound + typeABusiness.subRegionSupportsFound,
    tailored: typeAPersonal.subRegionInTailored + typeABusiness.subRegionInTailored,
    recommended: typeAPersonal.subRegionInRecommended + typeABusiness.subRegionInRecommended,
    exploratory: typeAPersonal.subRegionInExploratory + typeABusiness.subRegionInExploratory,
    missed: typeAPersonal.subRegionMissed + typeABusiness.subRegionMissed,
    liftSum: typeAPersonal.scoreLiftSum + typeABusiness.scoreLiftSum,
    liftCount: typeAPersonal.scoreLiftCount + typeABusiness.scoreLiftCount,
  }
  const typeAMatched = typeATotal.tailored + typeATotal.recommended + typeATotal.exploratory

  console.log('\n--- Type A: 정밀 매칭 (sub-region 일치) ---')
  console.log(`테스트 수: ${typeAPersonal.count} personal + ${typeABusiness.count} business = ${typeATotal.count}`)
  console.log(`sub-region supports 총 발견: ${typeATotal.found}건`)
  if (typeATotal.found > 0) {
    console.log(`sub-region supports 매칭 결과 포함율: ${(typeAMatched / typeATotal.found * 100).toFixed(1)}%`)
    console.log(`  - tailored: ${typeATotal.tailored}건 (${(typeATotal.tailored / typeATotal.found * 100).toFixed(1)}%)`)
    console.log(`  - recommended: ${typeATotal.recommended}건 (${(typeATotal.recommended / typeATotal.found * 100).toFixed(1)}%)`)
    console.log(`  - exploratory: ${typeATotal.exploratory}건 (${(typeATotal.exploratory / typeATotal.found * 100).toFixed(1)}%)`)
    console.log(`  - 누락(missed): ${typeATotal.missed}건 (${(typeATotal.missed / typeATotal.found * 100).toFixed(1)}%)`)
  } else {
    console.log('  (sub-region supports 없음 -- Type A 프로필에 해당하는 supports가 DB에 없음)')
  }
  if (typeATotal.liftCount > 0) {
    console.log(`점수 향상 (vs subRegion 미선택): 평균 ${(typeATotal.liftSum / typeATotal.liftCount).toFixed(4)}`)
  }

  // Type B
  const typeBPersonal = metrics['personal-B']
  const typeBBusiness = metrics['business-B']
  const typeBTotal = {
    count: typeBPersonal.count + typeBBusiness.count,
    noImpact: typeBPersonal.noImpactCount + typeBBusiness.noImpactCount,
  }

  console.log('\n--- Type B: 영향 없음 검증 ---')
  console.log(`테스트 수: ${typeBPersonal.count} personal + ${typeBBusiness.count} business = ${typeBTotal.count}`)
  if (typeBTotal.count > 0) {
    console.log(`sub-region 선택이 결과에 영향 없는 비율: ${(typeBTotal.noImpact / typeBTotal.count * 100).toFixed(1)}% (예상: ~100%)`)
  }

  // Type C
  const typeCPersonal = metrics['personal-C']
  const typeCBusiness = metrics['business-C']
  const typeCTotal = {
    count: typeCPersonal.count + typeCBusiness.count,
    fallback: typeCPersonal.fallbackAppliedCount + typeCBusiness.fallbackAppliedCount,
  }

  console.log('\n--- Type C: 미선택 fallback ---')
  console.log(`테스트 수: ${typeCPersonal.count} personal + ${typeCBusiness.count} business = ${typeCTotal.count}`)
  if (typeCTotal.count > 0) {
    console.log(`sub-region supports에 score 0.7 적용 프로필 비율: ${(typeCTotal.fallback / typeCTotal.count * 100).toFixed(1)}%`)
  }

  // region_scope 분포
  const scopeNational = allSupports.filter(s => s.regionScope === 'national').length
  const scopeRegional = allSupports.filter(s => s.regionScope === 'regional').length
  const scopeUnknown = allSupports.filter(s => s.regionScope === 'unknown').length
  console.log('\n--- region_scope 분포 ---')
  console.log(`  national: ${scopeNational} (${(scopeNational / allSupports.length * 100).toFixed(1)}%)`)
  console.log(`  regional: ${scopeRegional} (${(scopeRegional / allSupports.length * 100).toFixed(1)}%)`)
  console.log(`  unknown:  ${scopeUnknown} (${(scopeUnknown / allSupports.length * 100).toFixed(1)}%)`)

  // 지역 FP 검증
  console.log('\n--- 지역 FP 검증 (핵심: 다른 시/도 정책 오추천) ---')
  console.log(`  검사 대상 (regional scope 결과): ${regionFpTotal}건`)
  console.log(`  지역 FP: ${regionFpCount}건 (${regionFpTotal > 0 ? (regionFpCount / regionFpTotal * 100).toFixed(4) : 0}%)`)
  console.log(`  → ${regionFpCount === 0 ? '✅ PASS (0건 FP)' : '❌ FAIL (FP 발견!)'}`)

  // unknown-in-tier 검증
  console.log('\n--- unknown-in-tier 검증 ---')
  console.log(`  [tailored] 총: ${tailoredTotal}건, unknown: ${unknownInTailored}건 (${tailoredTotal > 0 ? (unknownInTailored / tailoredTotal * 100).toFixed(1) : 0}%)`)
  console.log(`  [recommended] 총: ${recommendedTotal}건, unknown: ${unknownInRecommended}건 (${recommendedTotal > 0 ? (unknownInRecommended / recommendedTotal * 100).toFixed(1) : 0}%)`)
  console.log(`  [top-tier 합계] 총: ${topTierTotal}건, unknown: ${unknownInTopTier}건 (${topTierTotal > 0 ? (unknownInTopTier / topTierTotal * 100).toFixed(1) : 0}%)`)

  // cross-track 검증
  console.log('\n--- cross-track 검증 ---')
  console.log(`  검사 대상: ${crossTrackChecks}건`)
  console.log(`  위반 (personal↔business): ${crossTrackViolations}건 (${crossTrackChecks > 0 ? (crossTrackViolations / crossTrackChecks * 100).toFixed(4) : 0}%)`)
  console.log(`  → ${crossTrackViolations === 0 ? '✅ PASS' : '⚠️ 위반 발견'}`)

  // 0-match 검사
  console.log('\n--- 0-match 검사 ---')
  console.log(`  0건 결과 프로필: ${zeroMatchCount} / ${allProfiles.length} (${(zeroMatchCount / allProfiles.length * 100).toFixed(1)}%)`)

  // 핵심 지표
  console.log('\n--- 핵심 지표 ---')

  // Precision: sub-region 일치 supports가 tailored/recommended에 있는 비율
  const precision = totalSubRegionInTopTiers > 0 && totalSubRegionExists > 0
    ? (totalSubRegionInTopTiers / totalSubRegionExists * 100)
    : 0

  // Recall: 존재하는 sub-region supports 중 매칭 결과에 포함된 비율
  const recall = totalSubRegionMatched > 0 && totalSubRegionExists > 0
    ? (totalSubRegionMatched / totalSubRegionExists * 100)
    : 0

  // Score Lift
  const avgLift = typeATotal.liftCount > 0
    ? (typeATotal.liftSum / typeATotal.liftCount)
    : 0

  // Differentiation: 같은 시/도 내 다른 구/군 시 결과 차이율
  const diffTotal = typeAPersonal.diffCheckCount + typeABusiness.diffCheckCount
  const diffFound = typeAPersonal.diffFoundCount + typeABusiness.diffFoundCount
  const differentiation = diffTotal > 0 ? (diffFound / diffTotal * 100) : 0

  console.log(`Precision (tailored+recommended): ${precision.toFixed(1)}%`)
  console.log(`  (${totalSubRegionInTopTiers} / ${totalSubRegionExists})`)
  console.log(`Recall (매칭 결과 포함): ${recall.toFixed(1)}%`)
  console.log(`  (${totalSubRegionMatched} / ${totalSubRegionExists})`)
  console.log(`Score Lift (sub-region 선택 시 vs 미선택): ${avgLift >= 0 ? '+' : ''}${avgLift.toFixed(4)}`)
  console.log(`Differentiation (같은 시/도, 다른 구/군 결과 차이율): ${differentiation.toFixed(1)}%`)
  console.log(`  (${diffFound} / ${diffTotal} 샘플)`)
  console.log(`Type B No-Impact Rate: ${typeBTotal.count > 0 ? (typeBTotal.noImpact / typeBTotal.count * 100).toFixed(1) : 'N/A'}%`)

  const regionFpRate = regionFpTotal > 0 ? (regionFpCount / regionFpTotal * 100) : 0
  const crossTrackRate = crossTrackChecks > 0 ? (crossTrackViolations / crossTrackChecks * 100) : 0

  // 등급
  console.log('\n--- 등급 ---')
  let grade = 'F'
  if (regionFpRate === 0 && crossTrackRate === 0 && precision >= 80 && recall >= 70 && avgLift > 0) grade = 'A'
  else if (regionFpRate <= 0.1 && precision >= 60 && recall >= 50) grade = 'B'
  else if (regionFpRate <= 1 && precision >= 40 && recall >= 30) grade = 'C'

  const gradeDetails = [
    `Region FP Rate ${regionFpRate.toFixed(4)}% ${regionFpRate === 0 ? 'PASS' : regionFpRate <= 0.1 ? 'WARN' : 'FAIL'} (A=0%, B<=0.1%, C<=1%)`,
    `Cross-Track ${crossTrackRate.toFixed(4)}% ${crossTrackRate === 0 ? 'PASS' : 'FAIL'} (A=0%)`,
    `Precision ${precision.toFixed(1)}% ${precision >= 80 ? 'PASS' : precision >= 60 ? 'WARN' : 'FAIL'} (A>=80%, B>=60%, C>=40%)`,
    `Recall ${recall.toFixed(1)}% ${recall >= 70 ? 'PASS' : recall >= 50 ? 'WARN' : 'FAIL'} (A>=70%, B>=50%, C>=30%)`,
    `Lift ${avgLift >= 0 ? '+' : ''}${avgLift.toFixed(4)} ${avgLift > 0 ? 'PASS' : avgLift === 0 ? 'NEUTRAL' : 'FAIL'} (A: > 0)`,
    `Differentiation ${differentiation.toFixed(1)}% ${differentiation >= 50 ? 'HIGH' : differentiation >= 20 ? 'MODERATE' : 'LOW'}`,
    `No-Impact Rate ${typeBTotal.count > 0 ? (typeBTotal.noImpact / typeBTotal.count * 100).toFixed(1) : 'N/A'}% ${typeBTotal.count > 0 && (typeBTotal.noImpact / typeBTotal.count) >= 0.9 ? 'PASS' : 'WARN'}`,
    `Zero-Match ${(zeroMatchCount / allProfiles.length * 100).toFixed(1)}% ${zeroMatchCount === 0 ? 'PASS' : zeroMatchCount <= 30 ? 'WARN' : 'FAIL'}`,
    `Unknown-in-Top ${topTierTotal > 0 ? (unknownInTopTier / topTierTotal * 100).toFixed(1) : 0}% (참고)`,
  ]

  console.log(`\n  종합 등급: ${grade}\n`)
  for (const d of gradeDetails) {
    console.log(`  ${d}`)
  }

  // Personal vs Business 별도 분석
  console.log('\n--- Personal vs Business 상세 ---')
  for (const userType of ['personal', 'business'] as const) {
    const a = metrics[`${userType}-A`]
    const b = metrics[`${userType}-B`]
    const c = metrics[`${userType}-C`]
    const totalFound = a.subRegionSupportsFound
    const totalMatched = a.subRegionInTailored + a.subRegionInRecommended + a.subRegionInExploratory
    const totalTopTier = a.subRegionInTailored + a.subRegionInRecommended
    console.log(`\n  [${userType.toUpperCase()}]`)
    console.log(`    Type A (${a.count}건): found=${totalFound}, matched=${totalMatched}, top-tier=${totalTopTier}, missed=${a.subRegionMissed}`)
    if (totalFound > 0) {
      console.log(`      Precision: ${(totalTopTier / totalFound * 100).toFixed(1)}%, Recall: ${(totalMatched / totalFound * 100).toFixed(1)}%`)
    }
    if (a.scoreLiftCount > 0) {
      console.log(`      Avg Lift: ${(a.scoreLiftSum / a.scoreLiftCount).toFixed(4)}`)
    }
    console.log(`    Type B (${b.count}건): no-impact=${b.noImpactCount} (${b.count > 0 ? (b.noImpactCount / b.count * 100).toFixed(1) : 'N/A'}%)`)
    console.log(`    Type C (${c.count}건): fallback-applied=${c.fallbackAppliedCount} (${c.count > 0 ? (c.fallbackAppliedCount / c.count * 100).toFixed(1) : 'N/A'}%)`)
    if (a.diffCheckCount > 0) {
      console.log(`    Differentiation: ${(a.diffFoundCount / a.diffCheckCount * 100).toFixed(1)}% (${a.diffFoundCount}/${a.diffCheckCount})`)
    }
  }

  // 개선 필요 사항
  console.log('\n--- 개선 필요 사항 ---')
  const issues: string[] = []

  if (precision < 40) issues.push('CRITICAL: Precision이 40% 미만. sub-region 일치 supports가 top tier에 거의 안 올라옴.')
  else if (precision < 60) issues.push('WARNING: Precision이 60% 미만. sub-region 일치 supports가 recommended 이상에 충분히 올라오지 않음.')

  if (recall < 30) issues.push('CRITICAL: Recall이 30% 미만. sub-region 일치 supports가 매칭 결과에 거의 포함되지 않음.')
  else if (recall < 50) issues.push('WARNING: Recall이 50% 미만. 상당수 sub-region supports가 누락됨.')

  if (avgLift <= 0) issues.push('WARNING: Score Lift가 0 이하. sub-region 선택이 점수에 긍정적 영향을 주지 않음.')

  if (typeBTotal.count > 0 && (typeBTotal.noImpact / typeBTotal.count) < 0.9) {
    issues.push('WARNING: Type B no-impact rate가 90% 미만. sub-region 선택이 관련 없는 곳에서도 결과를 변경함.')
  }

  if (differentiation < 20) {
    issues.push('INFO: Differentiation이 20% 미만. 같은 시/도 내 구/군 변경이 결과에 큰 차이를 만들지 않음 (sub-region supports가 적으면 정상).')
  }

  if (subRegionSupports.length < 100) {
    issues.push('INFO: sub-region supports가 100건 미만. 데이터 부족으로 정확한 평가 어려움.')
  }

  if (issues.length === 0) {
    console.log('  모든 지표 정상. 개선 필요 사항 없음.')
  } else {
    for (const issue of issues) {
      console.log(`  - ${issue}`)
    }
  }

  console.log('\n' + '='.repeat(70))
  console.log('감사 완료')
  console.log('='.repeat(70))
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
