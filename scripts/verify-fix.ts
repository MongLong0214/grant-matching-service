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

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function main() {
  // 1. 경북 관련 org를 가진 supports의 target_regions 확인
  const { data: d1 } = await sb.from('supports')
    .select('id, title, organization, target_regions, target_sub_regions')
    .ilike('organization', '%경상북도%')
    .eq('is_active', true)
    .limit(20)
  
  console.log('=== org에 "경상북도" 있는 supports (target_regions 확인) ===')
  let fixed = 0, broken = 0
  for (const r of (d1 || [])) {
    const hasRegion = r.target_regions && r.target_regions.includes('경북')
    if (hasRegion) fixed++; else broken++
    if (!hasRegion) {
      console.log(`  STILL BROKEN: ${r.title} | org: ${r.organization} | regions: ${JSON.stringify(r.target_regions)}`)
    }
  }
  console.log(`${fixed} fixed, ${broken} still broken out of ${(d1 || []).length}`)

  // 2. 전국으로 분류된 supports 중 다른 지역 키워드 가진 것 (재확인)
  const PAGE_SIZE = 1000
  const allRows: any[] = []
  let from = 0
  while (true) {
    const { data, error } = await sb.from('supports')
      .select('id, title, organization, target_regions')
      .eq('is_active', true)
      .range(from, from + PAGE_SIZE - 1)
    if (error) throw error
    if (!data || data.length === 0) break
    allRows.push(...data)
    if (data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  const regionKeywords = ['경상북도', '경북', '경상남도', '경남', '전라북도', '전북', '전라남도', '전남', '충청북도', '충북', '충청남도', '충남', '강원', '서울', '부산', '대구', '광주', '대전', '울산', '세종', '제주', '인천', '경기']
  
  const contaminated = allRows.filter(r => {
    if (r.target_regions && r.target_regions.length > 0) return false
    const text = `${r.title || ''} ${r.organization || ''}`
    return regionKeywords.some(kw => text.includes(kw))
  })

  console.log(`\n=== 전국으로 분류됐지만 제목/기관에 특정 지역명 있는 supports ===`)
  console.log(`Before fix: ~150건, After fix: ${contaminated.length}건`)

  // 지역별 분류
  const byRegion: Record<string, number> = {}
  for (const r of contaminated) {
    const text = `${r.title || ''} ${r.organization || ''}`
    for (const kw of regionKeywords) {
      if (text.includes(kw)) {
        byRegion[kw] = (byRegion[kw] || 0) + 1
        break
      }
    }
  }
  for (const [k, v] of Object.entries(byRegion).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k}: ${v}건`)
  }

  // 3. 강서구 플러스 자립수당 확인
  const { data: d2 } = await sb.from('supports')
    .select('id, title, organization, target_regions, target_sub_regions')
    .ilike('title', '%강서구%자립수당%')
    .limit(5)
  
  console.log('\n=== 강서구 플러스 자립수당 현재 상태 ===')
  for (const r of (d2 || [])) {
    console.log(`  ${r.title} | org: ${r.organization} | regions: ${JSON.stringify(r.target_regions)} | sub: ${JSON.stringify(r.target_sub_regions)}`)
  }

  // 4. 인천 유저가 볼 수 있는 supports 수 비교
  const forIncheon = allRows.filter(r => !r.target_regions || r.target_regions.length === 0 || r.target_regions.includes('인천'))
  const emptyRegion = allRows.filter(r => !r.target_regions || r.target_regions.length === 0)
  console.log(`\n=== 인천 유저 노출 supports ===`)
  console.log(`전국(빈 regions): ${emptyRegion.length} | 인천 전용: ${forIncheon.length - emptyRegion.length} | 총: ${forIncheon.length}`)
}

main().catch(console.error)
