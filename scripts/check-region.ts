import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const env = readFileSync('.env.local', 'utf-8')
for (const l of env.split('\n')) {
  const t = l.trim()
  if (!t || t.startsWith('#')) continue
  const e = t.indexOf('=')
  if (e === -1) continue
  const k = t.slice(0, e).trim()
  const v = t.slice(e + 1).trim()
  if (!process.env[k]) process.env[k] = v
}

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function main() {
  // 평택시 검색
  const { data } = await s.from('supports')
    .select('title, target_regions, extraction_confidence, raw_eligibility_text')
    .ilike('title', '%평택%')
    .eq('is_active', true)
    .limit(3)

  console.log('=== 평택시 지원사업 데이터 ===')
  for (const r of data || []) {
    console.log(`title: ${r.title}`)
    console.log(`target_regions: ${JSON.stringify(r.target_regions)}`)
    console.log(`confidence: ${JSON.stringify(r.extraction_confidence)}`)
    console.log(`eligibility: ${r.raw_eligibility_text?.slice(0, 300)}`)
    console.log()
  }

  // 제목에 지역명이 있는데 target_regions=NULL
  const cities = ['서울', '부산', '대구', '인천', '광주', '대전', '울산', '수원', '평택', '안양', '군포', '중랑', '영도', '함안']
  console.log('=== 제목에 지역명 O, target_regions NULL ===')
  for (const city of cities) {
    const { count } = await s.from('supports')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .is('target_regions', null)
      .ilike('title', `%${city}%`)

    if ((count ?? 0) > 0) {
      console.log(`  ${city}: ${count}건`)
    }
  }

  // target_regions 전체 현황
  const { count: withRegions } = await s.from('supports')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
    .not('target_regions', 'is', null)
  const { count: totalActive } = await s.from('supports')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
  console.log(`\ntarget_regions 채움: ${withRegions}/${totalActive} (${((withRegions ?? 0) / (totalActive ?? 1) * 100).toFixed(1)}%)`)
}

main().catch(console.error)
