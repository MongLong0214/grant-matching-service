/**
 * CHECK 2: DB 교차검증 — target_regions 비어있는 레코드에서 유출된 지역명 탐지
 * CHECK 3: 제목 지역명 vs target_regions 정확도
 */
import { supabase, CITY_TO_REGION, AMBIGUOUS_DISTRICTS, REGION_DISTRICTS, REGION_PATTERN } from './shared'
import type { CheckResult } from './shared'

/** CHECK 2: 빈 target_regions에서 지역명 유출 감지 */
export async function checkDBLeaks(): Promise<CheckResult> {
  const details: string[] = []
  const BATCH = 1000
  let emptyRegionCount = 0, processedCount = 0, offset = 0
  const leakCounts: Record<string, number> = {}
  const ambiguousLeakCounts: Record<string, number> = {}

  while (true) {
    const { data, error } = await supabase.from('supports')
      .select('id, title, raw_eligibility_text, target_regions')
      .eq('is_active', true).range(offset, offset + BATCH - 1)
    if (error) { details.push(`DB 에러 offset ${offset}: ${error.message}`); break }
    if (!data?.length) break

    for (const row of data) {
      processedCount++
      const regions = row.target_regions as string[] | null
      if (regions && regions.length > 0) continue
      emptyRegionCount++
      const searchText = `${row.title || ''} ${row.raw_eligibility_text || ''}`
      const matches = searchText.match(REGION_PATTERN)
      if (!matches) continue
      for (const m of matches) {
        const isValid = CITY_TO_REGION[m] || Object.values(REGION_DISTRICTS).some(ds => ds.includes(m))
        if (!isValid) continue
        if (AMBIGUOUS_DISTRICTS.has(m)) ambiguousLeakCounts[m] = (ambiguousLeakCounts[m] || 0) + 1
        else leakCounts[m] = (leakCounts[m] || 0) + 1
      }
    }
    offset += BATCH
  }

  const sortedLeaks = Object.entries(leakCounts).sort((a, b) => b[1] - a[1])
  const totalLeaks = sortedLeaks.reduce((sum, [, c]) => sum + c, 0)
  const totalAmbiguous = Object.values(ambiguousLeakCounts).reduce((s, c) => s + c, 0)

  details.push(`처리: ${processedCount}건`)
  details.push(`빈 target_regions: ${emptyRegionCount} (${((emptyRegionCount / processedCount) * 100).toFixed(1)}%)`)
  details.push(`\n비모호 유출 지역: ${totalLeaks}건, 모호 유출: ${totalAmbiguous}건`)
  if (sortedLeaks.length > 0) {
    details.push('\n--- 상위 20 유출 지역 ---')
    for (const [name, count] of sortedLeaks.slice(0, 20)) {
      details.push(`  ${name} (${CITY_TO_REGION[name] || '?'}): ${count}`)
    }
  }

  const leakRate = totalLeaks / Math.max(emptyRegionCount, 1)
  const score = Math.max(0, Math.round((1 - leakRate) * 100))
  const grade = score >= 95 ? 'A' : score >= 85 ? 'B' : score >= 70 ? 'C' : 'D'
  return { grade, score, summary: `빈 ${emptyRegionCount}건, 유출 ${totalLeaks}건`, details }
}

/** CHECK 3: 제목 지역명 vs target_regions 정확도 */
export async function checkAccuracy(): Promise<CheckResult> {
  const details: string[] = []
  const SAMPLE_SIZE = 500
  let checked = 0, matches = 0, mismatches = 0, offset = 0
  const mismatchExamples: { title: string; mentioned: string; expected: string; actual: string[] }[] = []

  while (checked < SAMPLE_SIZE) {
    const batchSize = Math.min(250, SAMPLE_SIZE - checked + 200)
    const { data, error } = await supabase.from('supports')
      .select('id, title, target_regions').eq('is_active', true)
      .not('target_regions', 'eq', '{}').range(offset, offset + batchSize - 1)
    if (error) { details.push(`DB 에러 offset ${offset}: ${error.message}`); break }
    if (!data?.length) break

    for (const row of data) {
      if (checked >= SAMPLE_SIZE) break
      const title = row.title || ''
      const targetRegions = (row.target_regions || []) as string[]
      if (targetRegions.length === 0) continue
      const titleMatches = title.match(REGION_PATTERN)
      if (!titleMatches) continue
      checked++
      for (const mention of titleMatches) {
        const expectedRegion = CITY_TO_REGION[mention]
        if (!expectedRegion) continue
        if (targetRegions.includes(expectedRegion)) matches++
        else {
          mismatches++
          if (mismatchExamples.length < 20)
            mismatchExamples.push({ title, mentioned: mention, expected: expectedRegion, actual: targetRegions })
        }
      }
    }
    offset += batchSize
  }

  const totalChecks = matches + mismatches
  details.push(`샘플: ${checked}건, 체크: ${totalChecks}건`)
  details.push(`일치: ${matches}, 불일치: ${mismatches}`)
  if (mismatchExamples.length > 0) {
    details.push('\n--- 불일치 예시 ---')
    for (const ex of mismatchExamples)
      details.push(`  "${ex.title.slice(0, 60)}" — ${ex.mentioned}→기대 ${ex.expected}, 실제 [${ex.actual.join(',')}]`)
  }

  const accuracy = totalChecks > 0 ? matches / totalChecks : 1
  const score = Math.round(accuracy * 100)
  const grade = score >= 95 ? 'A' : score >= 85 ? 'B' : score >= 70 ? 'C' : 'D'
  return { grade, score, summary: `${matches}/${totalChecks} 정확 (${score}%)`, details }
}
