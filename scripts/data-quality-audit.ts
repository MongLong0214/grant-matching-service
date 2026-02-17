/**
 * 데이터 품질 심층 분석 스크립트
 * 원본 텍스트 vs 추출 결과 비교, 소스별 품질 점수
 *
 * 실행: npx tsx scripts/data-quality-audit.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'fs'

// .env.local 수동 파싱
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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ----- 차원 정의 -----

interface DimensionCheck {
  name: string
  dbField: string
  // 원본 텍스트에 해당 정보가 있는지 판단하는 패턴들
  textPatterns: RegExp[]
  // DB 값이 NULL/빈 값인지 판단
  isNull: (row: Record<string, unknown>) => boolean
}

const DIMENSIONS: DimensionCheck[] = [
  {
    name: 'target_regions',
    dbField: 'target_regions',
    textPatterns: [
      /서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주/,
      /특별시|광역시|특별자치|도\s/,
    ],
    isNull: (r) => !r.target_regions || (Array.isArray(r.target_regions) && r.target_regions.length === 0),
  },
  {
    name: 'target_age (min/max)',
    dbField: 'target_age_min',
    textPatterns: [
      /\d{1,3}\s*세/,
      /청년|청소년|노인|어르신|고령|영유아|아동|중장년|장년/,
    ],
    isNull: (r) => r.target_age_min === null && r.target_age_max === null,
  },
  {
    name: 'target_household_types',
    dbField: 'target_household_types',
    textPatterns: [
      /1인\s*가구|단독\s*가구|신혼|다자녀|한부모|다문화|장애인\s*가|임산부|임신|조손/,
    ],
    isNull: (r) => !r.target_household_types || (Array.isArray(r.target_household_types) && r.target_household_types.length === 0),
  },
  {
    name: 'target_income_levels',
    dbField: 'target_income_levels',
    textPatterns: [
      /기초생활|차상위|중위\s*소득|저소득/,
    ],
    isNull: (r) => !r.target_income_levels || (Array.isArray(r.target_income_levels) && r.target_income_levels.length === 0),
  },
  {
    name: 'target_employment_status',
    dbField: 'target_employment_status',
    textPatterns: [
      /재직|구직|실업|미취업|학생|대학|자영업|소상공인|경력\s*단절|무직|은퇴|퇴직/,
    ],
    isNull: (r) => !r.target_employment_status || (Array.isArray(r.target_employment_status) && r.target_employment_status.length === 0),
  },
  {
    name: 'benefit_categories',
    dbField: 'benefit_categories',
    textPatterns: [
      /주거|출산|보육|교육|취업|창업|건강|의료|생활\s*안정|문화|여가/,
    ],
    isNull: (r) => !r.benefit_categories || (Array.isArray(r.benefit_categories) && r.benefit_categories.length === 0),
  },
  {
    name: 'target_business_types',
    dbField: 'target_business_types',
    textPatterns: [
      /제조|건설|도매|소매|숙박|음식점|운수|정보통신|전문서비스|교육|보건|예술|기타서비스|벤처|자영업|중소기업|소상공인|소기업|중견|영세/,
    ],
    isNull: (r) => !r.target_business_types || (Array.isArray(r.target_business_types) && r.target_business_types.length === 0),
  },
  {
    name: 'target_employee (min/max)',
    dbField: 'target_employee_min',
    textPatterns: [
      /\d+\s*(?:인|명)\s*(?:이하|이상|미만|초과|까지|~)/,
      /상시\s*(?:근로자|종업원|고용인원|인원)/,
    ],
    isNull: (r) => r.target_employee_min === null && r.target_employee_max === null,
  },
  {
    name: 'target_revenue (min/max)',
    dbField: 'target_revenue_min',
    textPatterns: [
      /매출|매출액|연매출|매출규모|매출\s*실적|매출\s*발생/,
    ],
    isNull: (r) => r.target_revenue_min === null && r.target_revenue_max === null,
  },
  {
    name: 'target_business_age (min/max)',
    dbField: 'target_business_age_min',
    textPatterns: [
      /예비\s*창업|창업\s*\d+\s*년|설립\s*\d+\s*년|업력|\d+\s*년\s*(?:이내|이하)|초기\s*창업|청년\s*창업|개업\s*\d+/,
    ],
    isNull: (r) => r.target_business_age_min === null && r.target_business_age_max === null,
  },
  {
    name: 'founder_age (min/max)',
    dbField: 'target_business_age_min', // checking founderAge separately
    textPatterns: [
      /대표\s*(?:자|이사)?\s*(?:나이|연령)|대표\s*\d+\s*세|대표자\s*만\s*\d+/,
    ],
    isNull: (r) => {
      // We'll override this for founder-specific columns
      return false
    },
  },
]

// ----- 메인 분석 -----

interface SourceStats {
  source: string
  count: number
  dimensionFillRate: Record<string, number>
  avgConfidence: number
  avgEligTextLen: number
  avgPrefTextLen: number
  missedExtractions: Record<string, { hasText: number; dbNull: number; missRate: number; examples: string[] }>
}

async function fetchAllActive() {
  const allRecords: Record<string, unknown>[] = []
  let offset = 0
  const batchSize = 1000

  while (true) {
    const { data, error } = await supabase
      .from('supports')
      .select(`
        id, title, source, raw_eligibility_text, raw_preference_text,
        target_regions, target_age_min, target_age_max, target_household_types,
        target_income_levels, target_employment_status, benefit_categories,
        target_business_types, target_employee_min, target_employee_max,
        target_revenue_min, target_revenue_max, target_business_age_min, target_business_age_max,
        extraction_confidence, service_type
      `)
      .eq('is_active', true)
      .range(offset, offset + batchSize - 1)

    if (error) {
      console.error('Fetch error:', error.message)
      break
    }
    if (!data || data.length === 0) break

    allRecords.push(...data)
    offset += batchSize
    console.log(`Fetched ${allRecords.length} records...`)

    if (data.length < batchSize) break
  }

  return allRecords
}

function combineTexts(row: Record<string, unknown>): string {
  const elig = (row.raw_eligibility_text as string) || ''
  const pref = (row.raw_preference_text as string) || ''
  return `${elig} ${pref}`
}

async function main() {
  console.log('=== 데이터 품질 심층 분석 시작 ===\n')

  // 1. 전체 데이터 가져오기
  const records = await fetchAllActive()
  console.log(`\n총 ${records.length}건 활성 레코드 로드\n`)

  // 소스별 분류
  const bySource = new Map<string, Record<string, unknown>[]>()
  for (const row of records) {
    const src = (row.source as string) || 'unknown'
    if (!bySource.has(src)) bySource.set(src, [])
    bySource.get(src)!.push(row)
  }

  console.log('--- 소스별 레코드 수 ---')
  for (const [src, rows] of Array.from(bySource.entries()).sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  ${src}: ${rows.length}`)
  }
  console.log()

  // 2. 소스별 분석
  const allStats: SourceStats[] = []

  for (const [source, rows] of bySource) {
    const stats: SourceStats = {
      source,
      count: rows.length,
      dimensionFillRate: {},
      avgConfidence: 0,
      avgEligTextLen: 0,
      avgPrefTextLen: 0,
      missedExtractions: {},
    }

    // 텍스트 길이
    let totalElig = 0, totalPref = 0, totalConf = 0, confCount = 0
    for (const row of rows) {
      totalElig += ((row.raw_eligibility_text as string) || '').length
      totalPref += ((row.raw_preference_text as string) || '').length
      if (row.extraction_confidence !== null && row.extraction_confidence !== undefined) {
        totalConf += row.extraction_confidence as number
        confCount++
      }
    }
    stats.avgEligTextLen = Math.round(totalElig / rows.length)
    stats.avgPrefTextLen = Math.round(totalPref / rows.length)
    stats.avgConfidence = confCount > 0 ? +(totalConf / confCount).toFixed(3) : 0

    // 차원별 채움률 + 미추출 분석
    const dimensionsToCheck = [
      { name: 'target_regions', isNull: (r: Record<string, unknown>) => !r.target_regions || (Array.isArray(r.target_regions) && r.target_regions.length === 0), patterns: [/서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주/, /특별시|광역시|특별자치/] },
      { name: 'target_age', isNull: (r: Record<string, unknown>) => r.target_age_min === null && r.target_age_max === null, patterns: [/\d{1,3}\s*세/, /청년|청소년|노인|어르신|고령|영유아|아동|중장년|장년/] },
      { name: 'target_household_types', isNull: (r: Record<string, unknown>) => !r.target_household_types || (Array.isArray(r.target_household_types) && r.target_household_types.length === 0), patterns: [/1인\s*가구|단독\s*가구|신혼|다자녀|한부모|다문화|장애인\s*가|임산부|임신|조손/] },
      { name: 'target_income_levels', isNull: (r: Record<string, unknown>) => !r.target_income_levels || (Array.isArray(r.target_income_levels) && r.target_income_levels.length === 0), patterns: [/기초생활|차상위|중위\s*소득|저소득/] },
      { name: 'target_employment_status', isNull: (r: Record<string, unknown>) => !r.target_employment_status || (Array.isArray(r.target_employment_status) && r.target_employment_status.length === 0), patterns: [/재직|구직|실업|미취업|학생|대학|자영업|소상공인|경력\s*단절|무직|은퇴|퇴직/] },
      { name: 'benefit_categories', isNull: (r: Record<string, unknown>) => !r.benefit_categories || (Array.isArray(r.benefit_categories) && r.benefit_categories.length === 0), patterns: [/주거|출산|보육|교육|취업|창업|건강|의료|생활\s*안정|문화|여가|대출|융자|보증|자금/] },
      { name: 'target_business_types', isNull: (r: Record<string, unknown>) => !r.target_business_types || (Array.isArray(r.target_business_types) && r.target_business_types.length === 0), patterns: [/제조|건설|도매|소매|숙박|음식점|운수|정보통신|전문서비스|교육서비스|보건|예술|기타서비스|벤처|자영업|중소기업|소상공인|소기업|중견|영세/] },
      { name: 'target_employee', isNull: (r: Record<string, unknown>) => r.target_employee_min === null && r.target_employee_max === null, patterns: [/\d+\s*(?:인|명)\s*(?:이하|이상|미만|초과|까지)/, /상시\s*(?:근로자|종업원|고용인원|인원)/] },
      { name: 'target_revenue', isNull: (r: Record<string, unknown>) => r.target_revenue_min === null && r.target_revenue_max === null, patterns: [/매출|매출액|연매출|매출규모|매출\s*실적/] },
      { name: 'target_business_age', isNull: (r: Record<string, unknown>) => r.target_business_age_min === null && r.target_business_age_max === null, patterns: [/예비\s*창업|창업\s*\d+\s*년|설립\s*\d+|업력|\d+\s*년\s*(?:이내|이하)|초기\s*창업|청년\s*창업|개업\s*\d+/] },
    ]

    for (const dim of dimensionsToCheck) {
      let filled = 0
      let hasTextButNull = 0
      let totalWithText = 0
      const missExamples: string[] = []

      for (const row of rows) {
        const dbNull = dim.isNull(row)
        if (!dbNull) filled++

        const text = combineTexts(row)
        const hasText = dim.patterns.some(p => p.test(text))

        if (hasText) {
          totalWithText++
          if (dbNull) {
            hasTextButNull++
            if (missExamples.length < 3) {
              const snippet = text.slice(0, 200).replace(/\n/g, ' ')
              missExamples.push(`[${row.title}] ${snippet}`)
            }
          }
        }
      }

      stats.dimensionFillRate[dim.name] = +(filled / rows.length * 100).toFixed(1)
      stats.missedExtractions[dim.name] = {
        hasText: totalWithText,
        dbNull: hasTextButNull,
        missRate: totalWithText > 0 ? +(hasTextButNull / totalWithText * 100).toFixed(1) : 0,
        examples: missExamples,
      }
    }

    allStats.push(stats)
  }

  // ----- 3. 출력: 소스별 품질 점수 -----
  console.log('\n========================================')
  console.log('      소스별 데이터 품질 리포트')
  console.log('========================================\n')

  // 정렬: 레코드 수 내림차순
  allStats.sort((a, b) => b.count - a.count)

  for (const stats of allStats) {
    console.log(`\n--- [${stats.source}] (${stats.count}건) ---`)
    console.log(`  평균 텍스트 길이: eligibility=${stats.avgEligTextLen}자, preference=${stats.avgPrefTextLen}자`)
    console.log(`  평균 추출 신뢰도: ${stats.avgConfidence}`)
    console.log(`  차원별 채움률:`)
    for (const [dim, rate] of Object.entries(stats.dimensionFillRate)) {
      const miss = stats.missedExtractions[dim]
      const missInfo = miss && miss.hasText > 0
        ? ` | 텍스트O/DB-NULL: ${miss.dbNull}/${miss.hasText} (미추출률 ${miss.missRate}%)`
        : ''
      console.log(`    ${dim.padEnd(28)} ${rate.toString().padStart(6)}%${missInfo}`)
    }
  }

  // ----- 4. 전체 요약 -----
  console.log('\n\n========================================')
  console.log('      전체 차원별 종합 분석')
  console.log('========================================\n')

  const totalCount = records.length
  const globalDims = [
    'target_regions', 'target_age', 'target_household_types', 'target_income_levels',
    'target_employment_status', 'benefit_categories', 'target_business_types',
    'target_employee', 'target_revenue', 'target_business_age',
  ]

  for (const dimName of globalDims) {
    let totalFilled = 0
    let totalHasText = 0
    let totalMissed = 0
    const topExamples: string[] = []

    for (const stats of allStats) {
      const fillRate = stats.dimensionFillRate[dimName] || 0
      totalFilled += Math.round(fillRate / 100 * stats.count)
      const miss = stats.missedExtractions[dimName]
      if (miss) {
        totalHasText += miss.hasText
        totalMissed += miss.dbNull
        topExamples.push(...miss.examples)
      }
    }

    const fillPct = (totalFilled / totalCount * 100).toFixed(1)
    const nullPct = ((totalCount - totalFilled) / totalCount * 100).toFixed(1)
    const globalMissRate = totalHasText > 0 ? (totalMissed / totalHasText * 100).toFixed(1) : 'N/A'

    console.log(`[${dimName}]`)
    console.log(`  채움률: ${fillPct}% (${totalFilled}/${totalCount})`)
    console.log(`  NULL률: ${nullPct}%`)
    console.log(`  텍스트에서 발견됨: ${totalHasText}건 중 DB NULL: ${totalMissed}건 (미추출률: ${globalMissRate}%)`)
    if (topExamples.length > 0) {
      console.log(`  미추출 샘플:`)
      for (const ex of topExamples.slice(0, 5)) {
        console.log(`    - ${ex.slice(0, 150)}`)
      }
    }
    console.log()
  }

  // ----- 5. 구체적 미추출 사례 (상위 20건) -----
  console.log('\n========================================')
  console.log('  구체적 미추출 사례 (원문 포함)')
  console.log('========================================\n')

  // 지역 미추출 샘플
  let regionMissCount = 0
  console.log('--- 지역 정보 미추출 상세 (최대 10건) ---')
  for (const row of records) {
    if (regionMissCount >= 10) break
    const regions = row.target_regions as string[] | null
    const hasRegions = regions && Array.isArray(regions) && regions.length > 0
    if (hasRegions) continue

    const text = combineTexts(row)
    const regionMatch = text.match(/(서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주)/)
    if (regionMatch) {
      regionMissCount++
      console.log(`  [${row.source}] "${row.title}"`)
      console.log(`    DB regions: ${JSON.stringify(regions)}`)
      console.log(`    텍스트 발견: "${regionMatch[0]}"`)
      // 주변 컨텍스트
      const idx = text.indexOf(regionMatch[0])
      const context = text.slice(Math.max(0, idx - 30), idx + 50).replace(/\n/g, ' ')
      console.log(`    컨텍스트: "...${context}..."`)
      console.log()
    }
  }

  // 소득 기준 미추출 샘플
  let incomeMissCount = 0
  console.log('--- 소득 기준 미추출 상세 (최대 10건) ---')
  for (const row of records) {
    if (incomeMissCount >= 10) break
    const levels = row.target_income_levels as string[] | null
    const hasLevels = levels && Array.isArray(levels) && levels.length > 0
    if (hasLevels) continue

    const text = combineTexts(row)
    const incomeMatch = text.match(/(기초생활|차상위|중위\s*소득|저소득)/)
    if (incomeMatch) {
      incomeMissCount++
      console.log(`  [${row.source}] "${row.title}"`)
      console.log(`    DB income_levels: ${JSON.stringify(levels)}`)
      console.log(`    텍스트 발견: "${incomeMatch[0]}"`)
      const idx = text.indexOf(incomeMatch[0])
      const context = text.slice(Math.max(0, idx - 30), idx + 80).replace(/\n/g, ' ')
      console.log(`    컨텍스트: "...${context}..."`)
      console.log()
    }
  }

  // 연령 미추출 샘플
  let ageMissCount = 0
  console.log('--- 연령 정보 미추출 상세 (최대 10건) ---')
  for (const row of records) {
    if (ageMissCount >= 10) break
    if (row.target_age_min !== null || row.target_age_max !== null) continue

    const text = combineTexts(row)
    const ageMatch = text.match(/(\d{1,3}\s*세|청년|청소년|노인|어르신|고령|영유아|아동|중장년)/)
    if (ageMatch) {
      ageMissCount++
      console.log(`  [${row.source}] "${row.title}"`)
      console.log(`    DB age: min=${row.target_age_min}, max=${row.target_age_max}`)
      console.log(`    텍스트 발견: "${ageMatch[0]}"`)
      const idx = text.indexOf(ageMatch[0])
      const context = text.slice(Math.max(0, idx - 30), idx + 80).replace(/\n/g, ' ')
      console.log(`    컨텍스트: "...${context}..."`)
      console.log()
    }
  }

  // 업종 미추출 샘플
  let bizTypeMissCount = 0
  console.log('--- 업종 정보 미추출 상세 (최대 10건) ---')
  for (const row of records) {
    if (bizTypeMissCount >= 10) break
    const types = row.target_business_types as string[] | null
    const hasTypes = types && Array.isArray(types) && types.length > 0
    if (hasTypes) continue

    const text = combineTexts(row)
    const typeMatch = text.match(/(제조|건설|도매|소매|숙박|음식점|운수|정보통신|전문서비스|교육서비스|보건|예술|기타서비스|벤처|중소기업|소상공인|소기업|중견|영세)/)
    if (typeMatch) {
      bizTypeMissCount++
      console.log(`  [${row.source}] "${row.title}"`)
      console.log(`    DB business_types: ${JSON.stringify(types)}`)
      console.log(`    텍스트 발견: "${typeMatch[0]}"`)
      const idx = text.indexOf(typeMatch[0])
      const context = text.slice(Math.max(0, idx - 30), idx + 80).replace(/\n/g, ' ')
      console.log(`    컨텍스트: "...${context}..."`)
      console.log()
    }
  }

  // 사업 업력 미추출
  let bizAgeMissCount = 0
  console.log('--- 사업 업력 미추출 상세 (최대 10건) ---')
  for (const row of records) {
    if (bizAgeMissCount >= 10) break
    if (row.target_business_age_min !== null || row.target_business_age_max !== null) continue

    const text = combineTexts(row)
    const match = text.match(/(예비\s*창업|창업\s*\d+\s*년|설립\s*\d+|업력|\d+\s*년\s*(?:이내|이하)|초기\s*창업|청년\s*창업)/)
    if (match) {
      bizAgeMissCount++
      console.log(`  [${row.source}] "${row.title}"`)
      console.log(`    DB business_age: min=${row.target_business_age_min}, max=${row.target_business_age_max}`)
      console.log(`    텍스트 발견: "${match[0]}"`)
      const idx = text.indexOf(match[0])
      const context = text.slice(Math.max(0, idx - 30), idx + 80).replace(/\n/g, ' ')
      console.log(`    컨텍스트: "...${context}..."`)
      console.log()
    }
  }

  // 매출 미추출
  let revMissCount = 0
  console.log('--- 매출 정보 미추출 상세 (최대 10건) ---')
  for (const row of records) {
    if (revMissCount >= 10) break
    if (row.target_revenue_min !== null || row.target_revenue_max !== null) continue

    const text = combineTexts(row)
    const match = text.match(/(매출|매출액|연매출|매출규모|매출\s*실적)/)
    if (match) {
      revMissCount++
      console.log(`  [${row.source}] "${row.title}"`)
      console.log(`    DB revenue: min=${row.target_revenue_min}, max=${row.target_revenue_max}`)
      console.log(`    텍스트 발견: "${match[0]}"`)
      const idx = text.indexOf(match[0])
      const context = text.slice(Math.max(0, idx - 30), idx + 80).replace(/\n/g, ' ')
      console.log(`    컨텍스트: "...${context}..."`)
      console.log()
    }
  }

  // 종업원 미추출
  let empMissCount = 0
  console.log('--- 종업원 수 미추출 상세 (최대 10건) ---')
  for (const row of records) {
    if (empMissCount >= 10) break
    if (row.target_employee_min !== null || row.target_employee_max !== null) continue

    const text = combineTexts(row)
    const match = text.match(/(\d+\s*(?:인|명)\s*(?:이하|이상|미만|초과)|상시\s*(?:근로자|종업원|고용인원))/)
    if (match) {
      empMissCount++
      console.log(`  [${row.source}] "${row.title}"`)
      console.log(`    DB employee: min=${row.target_employee_min}, max=${row.target_employee_max}`)
      console.log(`    텍스트 발견: "${match[0]}"`)
      const idx = text.indexOf(match[0])
      const context = text.slice(Math.max(0, idx - 30), idx + 80).replace(/\n/g, ' ')
      console.log(`    컨텍스트: "...${context}..."`)
      console.log()
    }
  }

  // ----- 6. 텍스트가 아예 비어있는 레코드 비율 -----
  console.log('\n========================================')
  console.log('  텍스트 비어있는 레코드 분석')
  console.log('========================================\n')

  for (const stats of allStats) {
    const rows = bySource.get(stats.source)!
    let emptyElig = 0, emptyPref = 0, bothEmpty = 0
    for (const row of rows) {
      const e = ((row.raw_eligibility_text as string) || '').trim()
      const p = ((row.raw_preference_text as string) || '').trim()
      if (!e) emptyElig++
      if (!p) emptyPref++
      if (!e && !p) bothEmpty++
    }
    console.log(`[${stats.source}] (${stats.count}건)`)
    console.log(`  eligibility 비어있음: ${emptyElig} (${(emptyElig/stats.count*100).toFixed(1)}%)`)
    console.log(`  preference 비어있음: ${emptyPref} (${(emptyPref/stats.count*100).toFixed(1)}%)`)
    console.log(`  양쪽 모두 비어있음: ${bothEmpty} (${(bothEmpty/stats.count*100).toFixed(1)}%)`)
    console.log()
  }

  // ----- JSON 저장 -----
  const report = {
    timestamp: new Date().toISOString(),
    totalRecords: totalCount,
    sourceStats: allStats.map(s => ({
      source: s.source,
      count: s.count,
      avgEligTextLen: s.avgEligTextLen,
      avgPrefTextLen: s.avgPrefTextLen,
      avgConfidence: s.avgConfidence,
      dimensionFillRate: s.dimensionFillRate,
      missedExtractions: Object.fromEntries(
        Object.entries(s.missedExtractions).map(([k, v]) => [k, { hasText: v.hasText, dbNull: v.dbNull, missRate: v.missRate }])
      ),
    })),
  }

  writeFileSync('data-quality-report.json', JSON.stringify(report, null, 2))
  console.log('\n리포트 JSON 저장: data-quality-report.json')
  console.log('\n=== 분석 완료 ===')
}

main().catch(console.error)
