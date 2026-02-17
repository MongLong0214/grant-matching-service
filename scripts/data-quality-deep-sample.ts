/**
 * 미추출 사례 심층 분석 - 원본 텍스트 vs 추출 결과 비교
 * 추출 파이프라인을 직접 실행하여 왜 놓치는지 분석
 *
 * 실행: npx tsx scripts/data-quality-deep-sample.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

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

async function main() {
  console.log('=== 미추출 사례 심층 분석 ===\n')

  // 1. bokjiro-central에서 "저소득" 텍스트가 있지만 income_levels=null인 케이스
  console.log('=== 1. bokjiro-central: "저소득" 텍스트 O, income_levels NULL ===\n')
  const { data: incomeRows } = await supabase
    .from('supports')
    .select('id, title, raw_eligibility_text, raw_preference_text, target_income_levels')
    .eq('is_active', true)
    .eq('source', 'bokjiro-central')
    .is('target_income_levels', null)
    .limit(500)

  let incomeTextHits = 0
  for (const row of incomeRows || []) {
    const text = `${row.raw_eligibility_text || ''} ${row.raw_preference_text || ''}`
    if (/저소득|기초생활|차상위|중위\s*소득/.test(text)) {
      incomeTextHits++
      if (incomeTextHits <= 5) {
        console.log(`  제목: ${row.title}`)
        console.log(`  eligibility: "${row.raw_eligibility_text}"`)
        console.log(`  preference: "${row.raw_preference_text}"`)
        console.log(`  DB income_levels: ${JSON.stringify(row.target_income_levels)}`)
        console.log()
      }
    }
  }
  console.log(`  총 ${incomeRows?.length}건 중 "저소득" 포함: ${incomeTextHits}건\n`)

  // 2. bokjiro-central에서 연령 키워드가 있지만 age=null인 케이스
  console.log('=== 2. bokjiro-central: 연령 키워드 O, age NULL ===\n')
  const { data: ageRows } = await supabase
    .from('supports')
    .select('id, title, raw_eligibility_text, raw_preference_text, target_age_min, target_age_max')
    .eq('is_active', true)
    .eq('source', 'bokjiro-central')
    .is('target_age_min', null)
    .is('target_age_max', null)
    .limit(500)

  let ageTextHits = 0
  for (const row of ageRows || []) {
    const text = `${row.raw_eligibility_text || ''} ${row.raw_preference_text || ''}`
    if (/\d{1,3}\s*세|청년|청소년|노인|어르신|고령|영유아|아동|중장년/.test(text)) {
      ageTextHits++
      if (ageTextHits <= 10) {
        console.log(`  제목: ${row.title}`)
        console.log(`  eligibility: "${row.raw_eligibility_text}"`)
        console.log(`  preference: "${row.raw_preference_text}"`)
        // 매칭된 부분 표시
        const match = text.match(/(\d{1,3}\s*세|청년|청소년|노인|어르신|고령|영유아|아동|중장년)/)
        if (match) console.log(`  발견 패턴: "${match[0]}"`)
        console.log()
      }
    }
  }
  console.log(`  총 ${ageRows?.length}건 중 연령 관련 텍스트 포함: ${ageTextHits}건\n`)

  // 3. 가장 흥미로운: subsidy24에서 텍스트에 "중소기업" 있지만 business_types=[]인 케이스
  console.log('=== 3. subsidy24: "중소기업" 텍스트 O, business_types=[] ===\n')
  const { data: bizRows } = await supabase
    .from('supports')
    .select('id, title, raw_eligibility_text, raw_preference_text, target_business_types')
    .eq('is_active', true)
    .eq('source', 'subsidy24')
    .limit(1000)

  let bizMiss = 0
  for (const row of bizRows || []) {
    const types = row.target_business_types as string[] | null
    const hasTypes = types && Array.isArray(types) && types.length > 0
    if (hasTypes) continue

    const text = `${row.raw_eligibility_text || ''} ${row.raw_preference_text || ''}`
    if (/중소기업|소상공인|벤처|자영업|중소벤처기업|소기업|중견기업/.test(text)) {
      bizMiss++
      if (bizMiss <= 10) {
        console.log(`  제목: ${row.title}`)
        console.log(`  eligibility: "${row.raw_eligibility_text}"`)
        console.log(`  preference: "${row.raw_preference_text}"`)
        const match = text.match(/(중소기업|소상공인|벤처|자영업|중소벤처기업|소기업|중견기업)/)
        if (match) console.log(`  발견 패턴: "${match[0]}"`)
        console.log(`  DB business_types: ${JSON.stringify(types)}`)
        console.log()
      }
    }
  }
  console.log(`  첫 1000건 중 "중소기업" 포함인데 NULL: ${bizMiss}건\n`)

  // 4. subsidy24에서 "N년 이내" 텍스트 있지만 business_age=null
  console.log('=== 4. subsidy24: 업력 패턴 O, business_age NULL ===\n')
  const { data: baRows } = await supabase
    .from('supports')
    .select('id, title, raw_eligibility_text, raw_preference_text, target_business_age_min, target_business_age_max')
    .eq('is_active', true)
    .eq('source', 'subsidy24')
    .is('target_business_age_min', null)
    .is('target_business_age_max', null)
    .limit(2000)

  let baMiss = 0
  for (const row of baRows || []) {
    const text = `${row.raw_eligibility_text || ''} ${row.raw_preference_text || ''}`
    if (/\d+\s*년\s*(?:이내|이하)|예비\s*창업|창업\s*\d+\s*년|업력/.test(text)) {
      baMiss++
      if (baMiss <= 10) {
        console.log(`  제목: ${row.title}`)
        console.log(`  eligibility: "${row.raw_eligibility_text}"`)
        console.log(`  preference: "${row.raw_preference_text}"`)
        const match = text.match(/(\d+\s*년\s*(?:이내|이하)|예비\s*창업|창업\s*\d+\s*년|업력)/)
        if (match) console.log(`  발견 패턴: "${match[0]}"`)
        console.log()
      }
    }
  }
  console.log(`  첫 2000건 중 업력 패턴인데 NULL: ${baMiss}건\n`)

  // 5. msit-rnd 전체 분석 (364건이므로 전체 가능)
  console.log('=== 5. msit-rnd: 전체 364건 텍스트 분석 ===\n')
  const { data: msitRows } = await supabase
    .from('supports')
    .select('id, title, raw_eligibility_text, raw_preference_text, target_business_types, benefit_categories, target_employment_status')
    .eq('is_active', true)
    .eq('source', 'msit-rnd')
    .limit(400)

  let msitNoBenefitCat = 0
  for (const row of msitRows || []) {
    const cats = row.benefit_categories as string[] | null
    if (cats && cats.length > 0) continue
    msitNoBenefitCat++
    const text = `${row.title} ${row.raw_eligibility_text || ''}`
    if (msitNoBenefitCat <= 5) {
      console.log(`  제목: ${row.title}`)
      console.log(`  eligibility: "${row.raw_eligibility_text}"`)
      console.log(`  benefit_categories: ${JSON.stringify(cats)}`)
      // 카테고리 키워드 매칭 시도
      const catMatches = text.match(/(취업|창업|교육|건강|의료|생활|문화|대출|융자|보증|자금|연구|R&D|기술|혁신|디지털|ICT|정보통신|인공지능|AI|SW|데이터)/)
      if (catMatches) console.log(`  놓친 키워드: "${catMatches[0]}"`)
      console.log()
    }
  }
  console.log(`  msit-rnd ${msitRows?.length}건 중 benefit_categories NULL: ${msitNoBenefitCat}건\n`)

  // 6. 텍스트 길이 분포 분석
  console.log('=== 6. 텍스트 길이 분포 ===\n')
  const { data: allRows } = await supabase
    .from('supports')
    .select('source, raw_eligibility_text, raw_preference_text')
    .eq('is_active', true)

  const lengthBuckets: Record<string, Record<string, number>> = {}
  for (const row of allRows || []) {
    const src = row.source as string
    if (!lengthBuckets[src]) {
      lengthBuckets[src] = { '0': 0, '1-20': 0, '21-50': 0, '51-100': 0, '101-200': 0, '201-500': 0, '500+': 0 }
    }
    const len = ((row.raw_eligibility_text as string) || '').length + ((row.raw_preference_text as string) || '').length
    if (len === 0) lengthBuckets[src]['0']++
    else if (len <= 20) lengthBuckets[src]['1-20']++
    else if (len <= 50) lengthBuckets[src]['21-50']++
    else if (len <= 100) lengthBuckets[src]['51-100']++
    else if (len <= 200) lengthBuckets[src]['101-200']++
    else if (len <= 500) lengthBuckets[src]['201-500']++
    else lengthBuckets[src]['500+']++
  }

  for (const [src, buckets] of Object.entries(lengthBuckets)) {
    console.log(`  [${src}]`)
    for (const [bucket, count] of Object.entries(buckets)) {
      const total = Object.values(buckets).reduce((a, b) => a + b, 0)
      const pct = (count / total * 100).toFixed(1)
      console.log(`    ${bucket.padEnd(10)} ${count.toString().padStart(5)}건 (${pct}%)`)
    }
    console.log()
  }

  // 7. "다문화" 미추출 분석 (가구유형)
  console.log('=== 7. "다문화" 키워드 미추출 분석 ===\n')
  const { data: multiRows } = await supabase
    .from('supports')
    .select('id, title, raw_eligibility_text, raw_preference_text, target_household_types')
    .eq('is_active', true)
    .limit(6400)

  let multiMiss = 0
  for (const row of multiRows || []) {
    const types = row.target_household_types as string[] | null
    const hasTypes = types && Array.isArray(types) && types.length > 0
    if (hasTypes) continue

    const text = `${row.raw_eligibility_text || ''} ${row.raw_preference_text || ''}`
    if (/다문화/.test(text)) {
      multiMiss++
      if (multiMiss <= 5) {
        console.log(`  제목: ${row.title}`)
        console.log(`  raw_pref: "${row.raw_preference_text}"`)
        console.log(`  raw_elig: "${row.raw_eligibility_text}"`)
        const idx = text.indexOf('다문화')
        console.log(`  컨텍스트: "...${text.slice(Math.max(0, idx-20), idx+40)}..."`)
        console.log()
      }
    }
  }
  console.log(`  전체 중 "다문화" 텍스트 O & household_types NULL: ${multiMiss}건\n`)

  console.log('=== 분석 완료 ===')
}

main().catch(console.error)
