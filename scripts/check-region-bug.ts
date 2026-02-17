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
  // 달서구 결혼축하금
  const { data: d1 } = await s.from('supports')
    .select('id, title, target_regions, extraction_confidence')
    .ilike('title', '%달서구%결혼%').limit(3)
  console.log('=== 달서구 결혼축하금 ===')
  for (const r of d1 || []) {
    console.log('title:', r.title)
    console.log('target_regions:', JSON.stringify(r.target_regions))
    console.log('regions_conf:', (r.extraction_confidence as Record<string, number>)?.regions)
    console.log()
  }

  // 부산 남구 도서구입비
  const { data: d2 } = await s.from('supports')
    .select('id, title, target_regions, extraction_confidence')
    .ilike('title', '%남구%도서구입%').limit(3)
  console.log('=== 부산 남구 도서구입비 ===')
  for (const r of d2 || []) {
    console.log('title:', r.title)
    console.log('target_regions:', JSON.stringify(r.target_regions))
    console.log('regions_conf:', (r.extraction_confidence as Record<string, number>)?.regions)
  }

  // 인천 결과에 나온 기타 의심 레코드
  const suspects = ['온기한끼', '중장년내일센터', '강서구 전세피해']
  for (const keyword of suspects) {
    const { data } = await s.from('supports')
      .select('id, title, target_regions, extraction_confidence')
      .ilike('title', `%${keyword}%`).limit(1)
    for (const r of data || []) {
      console.log(`\n${r.title}: regions=${JSON.stringify(r.target_regions)}, conf=${(r.extraction_confidence as Record<string, number>)?.regions}`)
    }
  }

  // 전체 현황
  const { count: withRegion } = await s.from('supports')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true).not('target_regions', 'is', null)
  const { count: total } = await s.from('supports')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
  console.log(`\n지역 데이터 현황: ${withRegion}/${total} (${((withRegion ?? 0) / (total ?? 1) * 100).toFixed(1)}%)`)
}

main().catch(console.error)
