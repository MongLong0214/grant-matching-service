/**
 * 기존 DB 레코드의 지역 데이터 재추출
 * 제목 + 본문에서 시/군/구 → 시도 매핑 적용
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
  const v = t.slice(e + 1).trim()
  if (!process.env[k]) process.env[k] = v
}

import { extractEligibility } from '../src/lib/extraction/index'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function main() {
  console.log('Loading all active supports...')

  const PAGE_SIZE = 1000
  const allRows: Array<{
    id: string; title: string; raw_eligibility_text: string | null
    raw_preference_text: string | null; raw_exclusion_text: string | null
    target_regions: string[] | null; extraction_confidence: Record<string, number> | null
  }> = []
  let from = 0

  while (true) {
    const { data, error } = await supabase
      .from('supports')
      .select('id, title, raw_eligibility_text, raw_preference_text, raw_exclusion_text, target_regions, extraction_confidence')
      .eq('is_active', true)
      .range(from, from + PAGE_SIZE - 1)

    if (error) throw error
    if (!data || data.length === 0) break
    allRows.push(...data)
    if (data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  console.log(`Loaded ${allRows.length} supports`)

  let updated = 0
  let newRegions = 0
  const BATCH_SIZE = 50
  const updates: Array<{ id: string; target_regions: string[]; extraction_confidence: Record<string, number> }> = []

  for (const row of allRows) {
    const texts = [row.raw_eligibility_text, row.raw_preference_text, row.raw_exclusion_text].filter(Boolean) as string[]
    const result = extractEligibility(texts, row.title)

    const oldRegions = row.target_regions || []
    const newRegionList = result.regions

    // 기존 지역과 다르면 무조건 업데이트 (새 추출이 []이어도 잘못된 기존 데이터 수정)
    const oldSorted = JSON.stringify([...oldRegions].sort())
    const newSorted = JSON.stringify([...newRegionList].sort())
    if (oldSorted !== newSorted) {
      const conf = { ...(row.extraction_confidence || {}), regions: result.confidence.regions }
      updates.push({ id: row.id, target_regions: newRegionList, extraction_confidence: conf })
      newRegions++
    }
  }

  console.log(`\nFound ${newRegions} supports with new region data (was empty/different)`)

  // 배치 업데이트
  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const batch = updates.slice(i, i + BATCH_SIZE)
    await Promise.all(
      batch.map(u =>
        supabase.from('supports').update({
          target_regions: u.target_regions,
          extraction_confidence: u.extraction_confidence,
        }).eq('id', u.id)
      )
    )
    updated += batch.length
    if (updated % 200 === 0 || updated === updates.length) {
      console.log(`  Updated ${updated}/${updates.length}`)
    }
  }

  console.log(`\nDone: ${updated} supports updated with region data`)

  // 지역별 분포 확인
  const regionCounts: Record<string, number> = {}
  for (const u of updates) {
    for (const r of u.target_regions) {
      regionCounts[r] = (regionCounts[r] || 0) + 1
    }
  }
  console.log('\nNew region distribution:')
  for (const [region, count] of Object.entries(regionCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${region}: ${count}`)
  }
}

main().catch(console.error)
