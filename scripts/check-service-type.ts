import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

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

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function main() {
  const { count: nullCount } = await s.from('supports').select('*', { count: 'exact', head: true }).eq('is_active', true).is('service_type', null)
  console.log('NULL service_type:', nullCount)

  const { count: pCount } = await s.from('supports').select('*', { count: 'exact', head: true }).eq('is_active', true).eq('service_type', 'personal')
  console.log('personal:', pCount)

  const { count: bCount } = await s.from('supports').select('*', { count: 'exact', head: true }).eq('is_active', true).eq('service_type', 'business')
  console.log('business:', bCount)

  const { count: bothCount } = await s.from('supports').select('*', { count: 'exact', head: true }).eq('is_active', true).eq('service_type', 'both')
  console.log('both:', bothCount)

  const { count: unknownCount } = await s.from('supports').select('*', { count: 'exact', head: true }).eq('is_active', true).eq('service_type', 'unknown')
  console.log('unknown:', unknownCount)

  const { count: totalCount } = await s.from('supports').select('*', { count: 'exact', head: true }).eq('is_active', true)
  console.log('total active:', totalCount)
  console.log('sum:', (nullCount || 0) + (pCount || 0) + (bCount || 0) + (bothCount || 0) + (unknownCount || 0))

  // Check region distribution for personal-type supports
  const { data: personalSample } = await s
    .from('supports')
    .select('id, title, target_regions, target_age_min, target_age_max, target_household_types, target_income_levels, target_employment_status, benefit_categories')
    .eq('is_active', true)
    .eq('service_type', 'personal')
    .not('target_regions', 'is', null)
    .limit(5)
  console.log('\nSample personal with regions:')
  for (const r of personalSample || []) {
    console.log(`  ${r.title?.slice(0, 40)} | regions: ${JSON.stringify(r.target_regions)} | age: ${r.target_age_min}-${r.target_age_max} | hh: ${JSON.stringify(r.target_household_types)} | income: ${JSON.stringify(r.target_income_levels)}`)
  }
}

main()
