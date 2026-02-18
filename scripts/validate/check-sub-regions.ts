/**
 * CHECK 4: Sub-region 유효성 검증 (target_sub_regions vs target_regions)
 */
import { supabase, CITY_TO_REGION, REGION_DISTRICTS } from './shared'
import type { CheckResult } from './shared'

export async function checkSubRegions(): Promise<CheckResult> {
  const details: string[] = []
  const BATCH = 1000
  let totalWithSubRegions = 0, validPairs = 0, orphanSubRegions = 0, invalidSubRegions = 0
  const orphanExamples: { id: string; subRegion: string; targetRegions: string[] }[] = []
  const invalidExamples: { id: string; subRegion: string; parentRegion: string }[] = []
  let offset = 0

  while (true) {
    const { data, error } = await supabase.from('supports')
      .select('id, title, target_regions, target_sub_regions')
      .eq('is_active', true).not('target_sub_regions', 'eq', '{}')
      .range(offset, offset + BATCH - 1)
    if (error) { details.push(`DB 에러 offset ${offset}: ${error.message}`); break }
    if (!data?.length) break

    for (const row of data) {
      const subRegions = (row.target_sub_regions || []) as string[]
      const targetRegions = (row.target_regions || []) as string[]
      if (subRegions.length === 0) continue
      totalWithSubRegions++

      for (const sub of subRegions) {
        const expectedParent = CITY_TO_REGION[sub]

        if (!expectedParent) {
          // CITY_TO_REGION에 없는 경우 REGION_DISTRICTS에서 직접 탐색
          let found = false
          for (const [region, districts] of Object.entries(REGION_DISTRICTS)) {
            if (!districts.includes(sub)) continue
            if (targetRegions.includes(region)) validPairs++
            else {
              orphanSubRegions++
              if (orphanExamples.length < 20) orphanExamples.push({ id: row.id, subRegion: sub, targetRegions })
            }
            found = true
            break
          }
          if (!found) {
            invalidSubRegions++
            if (invalidExamples.length < 20) invalidExamples.push({ id: row.id, subRegion: sub, parentRegion: '(알 수 없음)' })
          }
          continue
        }

        if (!targetRegions.includes(expectedParent)) {
          orphanSubRegions++
          if (orphanExamples.length < 20) orphanExamples.push({ id: row.id, subRegion: sub, targetRegions })
          continue
        }

        const validDistricts = REGION_DISTRICTS[expectedParent] || []
        if (validDistricts.includes(sub)) validPairs++
        else if (sub.endsWith('시') || sub.endsWith('구') || sub.endsWith('군')) {
          invalidSubRegions++
          if (invalidExamples.length < 20) invalidExamples.push({ id: row.id, subRegion: sub, parentRegion: expectedParent })
        } else {
          validPairs++ // 단축형 ("수원" 등)
        }
      }
    }
    offset += BATCH
  }

  details.push(`sub-region 보유 supports: ${totalWithSubRegions}`)
  details.push(`유효 쌍: ${validPairs}, 고아: ${orphanSubRegions}, 무효: ${invalidSubRegions}`)
  if (orphanExamples.length > 0) {
    details.push('\n--- 고아 예시 ---')
    for (const ex of orphanExamples) details.push(`  [${ex.id.slice(0, 8)}] ${ex.subRegion} → [${ex.targetRegions.join(',')}]`)
  }
  if (invalidExamples.length > 0) {
    details.push('\n--- 무효 예시 ---')
    for (const ex of invalidExamples) details.push(`  [${ex.id.slice(0, 8)}] ${ex.subRegion} (부모: ${ex.parentRegion})`)
  }

  const total = validPairs + orphanSubRegions + invalidSubRegions
  const validRate = total > 0 ? validPairs / total : 1
  const score = Math.round(validRate * 100)
  const grade = score >= 95 ? 'A' : score >= 85 ? 'B' : score >= 70 ? 'C' : 'D'
  return { grade, score, summary: `${validPairs}/${total} 유효 (${score}%), 고아 ${orphanSubRegions}, 무효 ${invalidSubRegions}`, details }
}
