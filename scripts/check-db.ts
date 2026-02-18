import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const env = readFileSync('.env.local', 'utf-8')
for (const l of env.split('\n')) {
  const t = l.trim()
  if (!t || t.startsWith('#')) continue
  const e = t.indexOf('=')
  if (e === -1) continue
  const k = t.slice(0, e).trim()
  const v = t.slice(e + 1).trim()
  if (process.env[k] === undefined) process.env[k] = v
}

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function main() {
  // 컬럼 존재 확인
  const { data: d1, error: e1 } = await s.from('supports').select('service_type').limit(1)
  console.log('service_type:', e1 ? 'MISSING - ' + e1.message : 'EXISTS')

  const { data: d2, error: e2 } = await s.from('supports').select('target_age_min').limit(1)
  console.log('target_age_min:', e2 ? 'MISSING - ' + e2.message : 'EXISTS')

  const { data: d3, error: e3 } = await s.from('supports').select('target_household_types').limit(1)
  console.log('target_household_types:', e3 ? 'MISSING - ' + e3.message : 'EXISTS')

  const { data: d4, error: e4 } = await s.from('supports').select('benefit_categories').limit(1)
  console.log('benefit_categories:', e4 ? 'MISSING - ' + e4.message : 'EXISTS')

  // 소스별 활성 레코드 수
  const { data: all } = await s.from('supports').select('source').eq('is_active', true)
  const counts: Record<string, number> = {}
  for (const r of all || []) {
    counts[r.source] = (counts[r.source] || 0) + 1
  }
  console.log('\nActive records by source:')
  for (const [src, cnt] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${src}: ${cnt}`)
  }

  const { count } = await s.from('supports').select('*', { count: 'exact', head: true }).eq('is_active', true)
  console.log(`\nTotal active: ${count}`)
}

main().catch(console.error)
