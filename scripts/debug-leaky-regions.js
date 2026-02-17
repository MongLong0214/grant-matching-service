const fs = require('fs')
const { createClient } = require('@supabase/supabase-js')

const env = fs.readFileSync('.env.local', 'utf-8')
for (const l of env.split('\n')) {
  const t = l.trim()
  if (t.length === 0 || t.startsWith('#')) continue
  const e = t.indexOf('=')
  if (e === -1) continue
  const k = t.slice(0, e).trim()
  let v = t.slice(e + 1).trim()
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
  if (process.env[k] === undefined) process.env[k] = v
}

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// 모호한 구/군명 + 누락된 시/군 목록
const AMBIGUOUS = ['중구', '동구', '서구', '남구', '북구', '강서구']
const MISSING_CITIES = {
  // 울산
  '울주군': '울산',
  // 광주
  '광산구': '광주',
  // 대전
  '유성구': '대전', '대덕구': '대전',
  // 세종은 하위 구/군 없음
}

async function main() {
  const PAGE_SIZE = 1000
  const allRows = []
  let from = 0
  while (true) {
    const { data, error } = await sb.from('supports')
      .select('id, title, organization, target_regions, target_sub_regions, source, raw_eligibility_text')
      .eq('is_active', true)
      .range(from, from + PAGE_SIZE - 1)
    if (error) throw error
    if (!data || data.length === 0) break
    allRows.push(...data)
    if (data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  console.log('Total active supports:', allRows.length)

  // target_regions가 비어있는 supports
  const emptyRegion = allRows.filter(r => !r.target_regions || r.target_regions.length === 0)
  console.log('target_regions 빈 supports:', emptyRegion.length)

  // 그 중 제목에 구/군/시 이름이 있는 것들
  const districtPattern = /([가-힣]{1,4})(구|군|시)\s/
  const leaky = emptyRegion.filter(r => districtPattern.test(r.title || ''))
  console.log('제목에 지역명 있지만 target_regions 비어있는 supports:', leaky.length)

  // 카테고리별 분류
  const ambiguousLeaks = []
  const missingCityLeaks = []
  const otherLeaks = []

  for (const r of leaky) {
    const title = r.title || ''
    const match = title.match(/([가-힣]{1,4})(구|군|시)/)
    if (!match) continue
    const name = match[1] + match[2]

    if (AMBIGUOUS.includes(name)) {
      ambiguousLeaks.push({ title, name, org: r.organization, source: r.source })
    } else if (MISSING_CITIES[name]) {
      missingCityLeaks.push({ title, name, shouldBe: MISSING_CITIES[name], org: r.organization })
    } else {
      otherLeaks.push({ title, name, org: r.organization, source: r.source })
    }
  }

  console.log('\n=== 모호한 구명 (강서구, 중구 등) ===')
  console.log('건수:', ambiguousLeaks.length)
  const byName = {}
  for (const l of ambiguousLeaks) {
    byName[l.name] = (byName[l.name] || 0) + 1
  }
  for (const [name, count] of Object.entries(byName).sort((a, b) => b[1] - a[1])) {
    console.log('  ' + name + ':', count + '건')
  }
  console.log('예시:')
  for (const l of ambiguousLeaks.slice(0, 10)) {
    console.log('  -', l.title, '(' + l.org + ',', l.source + ')')
  }

  console.log('\n=== 누락된 시/군 (CITY_TO_REGION에 없음) ===')
  console.log('건수:', missingCityLeaks.length)
  for (const l of missingCityLeaks.slice(0, 10)) {
    console.log('  -', l.title, '→ should be', l.shouldBe)
  }

  console.log('\n=== 기타 (원인 불명) ===')
  console.log('건수:', otherLeaks.length)
  // 무엇이 있는지 패턴 분석
  const otherNames = {}
  for (const l of otherLeaks) {
    otherNames[l.name] = (otherNames[l.name] || 0) + 1
  }
  for (const [name, count] of Object.entries(otherNames).sort((a, b) => b[1] - a[1]).slice(0, 20)) {
    console.log('  ' + name + ':', count + '건')
  }
  console.log('예시:')
  for (const l of otherLeaks.slice(0, 15)) {
    console.log('  -', l.title, '(' + l.org + ',', l.source + ')')
  }

  // 제목에 "서울" "부산" 등 시/도명 + 구명이 함께 있는 경우 (해결 가능)
  console.log('\n=== 제목에 시/도 + 구/군이 함께 있는 supports (해결 가능) ===')
  const resolvable = leaky.filter(r => {
    const title = r.title || ''
    const regions = ['서울', '부산', '대구', '인천', '광주', '대전', '울산', '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주']
    return regions.some(reg => title.includes(reg))
  })
  console.log('건수:', resolvable.length)
  for (const r of resolvable.slice(0, 10)) {
    console.log('  -', r.title)
  }
}

main().catch(console.error)
