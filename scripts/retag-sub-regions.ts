/**
 * DB의 모든 active support에 대해 subRegion 재추출
 * extractRegionsWithDistricts()를 사용해 target_sub_regions 업데이트
 */
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
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1)
  }
  if (!process.env[k]) process.env[k] = v
}

import { extractRegionsWithDistricts } from '../src/lib/extraction/region-dictionary'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

interface SupportRow {
  id: string
  title: string
  raw_eligibility_text: string | null
  raw_preference_text: string | null
  raw_exclusion_text: string | null
  target_sub_regions: string[] | null
}

function arraysEqual(a: unknown[] | null, b: unknown[]): boolean {
  if (!a && b.length === 0) return true
  if (!a) return false
  if (a.length !== b.length) return false
  const sa = [...a].sort()
  const sb = [...b].sort()
  return sa.every((v, i) => v === sb[i])
}

async function main() {
  console.log('=== Retag Sub-Regions ===')
  console.log('Loading all active supports...')

  const PAGE_SIZE = 1000
  const allRows: SupportRow[] = []
  let from = 0

  while (true) {
    const { data, error } = await supabase
      .from('supports')
      .select('id, title, raw_eligibility_text, raw_preference_text, raw_exclusion_text, target_sub_regions')
      .eq('is_active', true)
      .range(from, from + PAGE_SIZE - 1)

    if (error) throw error
    if (!data || data.length === 0) break
    allRows.push(...(data as SupportRow[]))
    if (data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  console.log(`Loaded ${allRows.length} supports`)

  const updates: { id: string; target_sub_regions: string[] }[] = []
  let withSubRegions = 0

  for (const row of allRows) {
    const combined = [row.title, row.raw_eligibility_text, row.raw_preference_text, row.raw_exclusion_text]
      .filter(Boolean)
      .join(' ')

    const { subRegions } = extractRegionsWithDistricts(combined)

    if (subRegions.length > 0) withSubRegions++

    if (!arraysEqual(row.target_sub_regions, subRegions)) {
      updates.push({ id: row.id, target_sub_regions: subRegions })
    }
  }

  console.log(`\nFound ${updates.length} supports with changed sub-regions out of ${allRows.length} total`)
  console.log(`Supports with at least one subRegion: ${withSubRegions}`)

  // 배치 업데이트 (50건씩)
  const BATCH_SIZE = 50
  let updated = 0

  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const batch = updates.slice(i, i + BATCH_SIZE)
    await Promise.all(
      batch.map(u =>
        supabase.from('supports').update({ target_sub_regions: u.target_sub_regions }).eq('id', u.id)
      )
    )
    updated += batch.length
    if (updated % 200 === 0 || updated === updates.length) {
      console.log(`  Updated ${updated}/${updates.length}`)
    }
  }

  console.log(`\nDone: ${updated} supports updated`)
  console.log('\n=== Summary ===')
  console.log(`  Total supports:            ${allRows.length}`)
  console.log(`  Changed:                   ${updates.length}`)
  console.log(`  With subRegion (after):    ${withSubRegions}`)
}

main().catch(console.error)
