import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const env = readFileSync('.env.local', 'utf-8')
for (const l of env.split('\n')) {
  const t = l.trim()
  if (!t || t.startsWith('#')) continue
  const e = t.indexOf('=')
  if (e === -1) continue
  const k = t.slice(0, e).trim()
  let v = t.slice(e + 1).trim()
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
  if (!process.env[k]) process.env[k] = v
}

import { mapSupportRow } from '../src/lib/supabase/mappers'
import { matchSupportsV4 } from '../src/lib/matching-v4/index'
import type { UserInput } from '../src/types'

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function main() {
  // 모든 active supports 로드
  const PAGE_SIZE = 1000
  const allRows: any[] = []
  let from = 0
  while (true) {
    const { data, error } = await sb.from('supports').select('*').eq('is_active', true).range(from, from + PAGE_SIZE - 1)
    if (error) throw error
    if (!data || data.length === 0) break
    allRows.push(...data)
    if (data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  const supports = allRows.map(mapSupportRow)
  console.log(`Loaded ${supports.length} supports`)

  // 인천 30대 1인 중위50이하 유저
  const userInput: UserInput = {
    userType: 'personal',
    region: '인천',
    ageGroup: '30대',
    gender: '남성',
    householdType: '1인가구',
    incomeLevel: '중위50이하',
    employmentStatus: '재직자',
    interestCategories: [],
  }

  const result = matchSupportsV4(supports, userInput)

  console.log(`\n=== 인천 30대 유저 매칭 결과 ===`)
  console.log(`Total: ${result.totalCount} | Tailored: ${result.tailored.length} | Recommended: ${result.recommended.length} | Exploratory: ${result.exploratory.length}`)
  console.log(`Knocked out: ${result.knockedOut} | Filtered by service type: ${result.filteredByServiceType}`)

  // 결과에서 경상북도/경북 관련 supports 찾기
  const wrongRegion = result.all.filter(s => {
    const title = s.support.title || ''
    const org = s.support.organization || ''
    const text = `${title} ${org}`
    const wrongKeywords = ['경상북도', '경북', '경남', '전북', '전남', '충북', '충남', '강원', '대구', '광주', '대전', '울산', '세종', '부산']
    return wrongKeywords.some(kw => text.includes(kw))
  })

  console.log(`\n=== 인천 유저에게 노출되는 타지역 의심 supports ===`)
  console.log(`건수: ${wrongRegion.length}`)
  for (const s of wrongRegion.slice(0, 30)) {
    console.log(`  [${s.tier}|${s.score}|scope:${s.support.regionScope}] ${s.support.title} | org: ${s.support.organization} | regions: ${JSON.stringify(s.support.targetRegions)}`)
  }

  // 강서구 자립수당 확인
  const gangseoChal = result.all.filter(s => (s.support.title || '').includes('강서구'))
  console.log(`\n=== 강서구 관련 supports in results ===`)
  console.log(`건수: ${gangseoChal.length}`)
  for (const s of gangseoChal) {
    console.log(`  [${s.tier}|${s.score}|scope:${s.support.regionScope}] ${s.support.title} | org: ${s.support.organization} | regions: ${JSON.stringify(s.support.targetRegions)}`)
  }

  // region_scope 별 분포
  const scopeDist = { national: 0, regional: 0, unknown: 0 }
  for (const s of result.all) {
    const scope = (s.support.regionScope ?? 'unknown') as keyof typeof scopeDist
    if (scope in scopeDist) scopeDist[scope]++
  }
  console.log(`\n=== 결과 내 region_scope 분포 ===`)
  console.log(`  national: ${scopeDist.national} | regional: ${scopeDist.regional} | unknown: ${scopeDist.unknown}`)

  // tailored/recommended에 unknown이 있는지 확인
  const topResults = [...result.tailored, ...result.recommended]
  const unknownInTop = topResults.filter(s => s.support.regionScope === 'unknown')
  console.log(`\n=== Tailored+Recommended에 unknown scope ===`)
  console.log(`건수: ${unknownInTop.length} / ${topResults.length}`)
  for (const s of unknownInTop.slice(0, 10)) {
    console.log(`  [${s.tier}|${s.score}|scope:unknown] ${s.support.title} | org: ${s.support.organization}`)
  }
}

main().catch(console.error)
