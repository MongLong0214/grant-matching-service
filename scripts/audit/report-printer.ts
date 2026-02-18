/**
 * 감사 리포트 출력
 */
import type { Support } from '../../src/types'
import type { TypeMetrics, GlobalCounters } from './scoring-helpers'

interface TypeATotals {
  count: number; found: number; tailored: number; recommended: number
  exploratory: number; missed: number; liftSum: number; liftCount: number
}

function pct(n: number, d: number, decimals = 1): string {
  return d > 0 ? (n / d * 100).toFixed(decimals) : '0'
}

/** 데이터 현황 출력 */
export function printDataOverview(
  allSupports: Support[],
  subRegionSupports: Support[],
  sortedRegions: [string, number][],
  sortedCombos: Array<{ region: string; subRegion: string; count: number }>,
) {
  console.log('\n--- 데이터 현황 ---')
  console.log(`총 supports: ${allSupports.length}`)
  console.log(`sub-region 있는 supports: ${subRegionSupports.length} (${pct(subRegionSupports.length, allSupports.length)}%)`)
  console.log('\n시/도별 sub-region supports 분포:')
  for (const [r, c] of sortedRegions) console.log(`  ${r}: ${c}건`)
  console.log('\nTop 10 구/군:')
  for (const combo of sortedCombos.slice(0, 10)) console.log(`  ${combo.region} ${combo.subRegion}: ${combo.count}건`)
}

/** Type A/B/C 결과 출력 */
export function printTypeResults(metrics: Record<string, TypeMetrics>) {
  const pa = metrics['personal-A'], ba = metrics['business-A']
  const ta: TypeATotals = {
    count: pa.count + ba.count,
    found: pa.subRegionSupportsFound + ba.subRegionSupportsFound,
    tailored: pa.subRegionInTailored + ba.subRegionInTailored,
    recommended: pa.subRegionInRecommended + ba.subRegionInRecommended,
    exploratory: pa.subRegionInExploratory + ba.subRegionInExploratory,
    missed: pa.subRegionMissed + ba.subRegionMissed,
    liftSum: pa.scoreLiftSum + ba.scoreLiftSum,
    liftCount: pa.scoreLiftCount + ba.scoreLiftCount,
  }
  const matched = ta.tailored + ta.recommended + ta.exploratory

  console.log('\n--- Type A: 정밀 매칭 (sub-region 일치) ---')
  console.log(`테스트: ${pa.count} personal + ${ba.count} business = ${ta.count}`)
  console.log(`sub-region supports 발견: ${ta.found}건`)
  if (ta.found > 0) {
    console.log(`포함율: ${pct(matched, ta.found)}%`)
    console.log(`  tailored: ${ta.tailored}건 (${pct(ta.tailored, ta.found)}%)`)
    console.log(`  recommended: ${ta.recommended}건 (${pct(ta.recommended, ta.found)}%)`)
    console.log(`  exploratory: ${ta.exploratory}건 (${pct(ta.exploratory, ta.found)}%)`)
    console.log(`  누락: ${ta.missed}건 (${pct(ta.missed, ta.found)}%)`)
  }
  if (ta.liftCount > 0) console.log(`점수 향상: 평균 ${(ta.liftSum / ta.liftCount).toFixed(4)}`)

  const pb = metrics['personal-B'], bb = metrics['business-B']
  const tbCount = pb.count + bb.count, tbNoImpact = pb.noImpactCount + bb.noImpactCount
  console.log('\n--- Type B: 영향 없음 검증 ---')
  console.log(`테스트: ${pb.count} personal + ${bb.count} business = ${tbCount}`)
  if (tbCount > 0) console.log(`영향 없는 비율: ${pct(tbNoImpact, tbCount)}% (예상: ~100%)`)

  const pc = metrics['personal-C'], bc = metrics['business-C']
  const tcCount = pc.count + bc.count, tcFallback = pc.fallbackAppliedCount + bc.fallbackAppliedCount
  console.log('\n--- Type C: 미선택 fallback ---')
  console.log(`테스트: ${pc.count} personal + ${bc.count} business = ${tcCount}`)
  if (tcCount > 0) console.log(`fallback 적용 비율: ${pct(tcFallback, tcCount)}%`)
}

/** 핵심 지표 + 등급 출력 */
export function printGradeReport(
  metrics: Record<string, TypeMetrics>,
  g: GlobalCounters,
  allSupports: Support[],
  profileCount: number,
) {
  const pa = metrics['personal-A'], ba = metrics['business-A']
  const pb = metrics['personal-B'], bb = metrics['business-B']
  const taFound = pa.subRegionSupportsFound + ba.subRegionSupportsFound
  const taMatched = pa.subRegionInTailored + ba.subRegionInTailored + pa.subRegionInRecommended + ba.subRegionInRecommended + pa.subRegionInExploratory + ba.subRegionInExploratory
  const tbCount = pb.count + bb.count, tbNoImpact = pb.noImpactCount + bb.noImpactCount
  const liftCount = pa.scoreLiftCount + ba.scoreLiftCount
  const avgLift = liftCount > 0 ? (pa.scoreLiftSum + ba.scoreLiftSum) / liftCount : 0
  const precision = g.totalSubRegionExists > 0 ? (g.totalSubRegionInTopTiers / g.totalSubRegionExists * 100) : 0
  const recall = g.totalSubRegionExists > 0 ? (g.totalSubRegionMatched / g.totalSubRegionExists * 100) : 0
  const diffTotal = pa.diffCheckCount + ba.diffCheckCount
  const diffFound = pa.diffFoundCount + ba.diffFoundCount
  const differentiation = diffTotal > 0 ? (diffFound / diffTotal * 100) : 0
  const fpRate = g.regionFpTotal > 0 ? (g.regionFpCount / g.regionFpTotal * 100) : 0
  const ctRate = g.crossTrackChecks > 0 ? (g.crossTrackViolations / g.crossTrackChecks * 100) : 0

  // region_scope 분포
  const nat = allSupports.filter(s => s.regionScope === 'national').length
  const reg = allSupports.filter(s => s.regionScope === 'regional').length
  const unk = allSupports.filter(s => s.regionScope === 'unknown').length
  console.log('\n--- region_scope 분포 ---')
  console.log(`  national: ${nat} (${pct(nat, allSupports.length)}%)`)
  console.log(`  regional: ${reg} (${pct(reg, allSupports.length)}%)`)
  console.log(`  unknown:  ${unk} (${pct(unk, allSupports.length)}%)`)

  console.log(`\n--- 지역 FP ---`)
  console.log(`  검사: ${g.regionFpTotal}건, FP: ${g.regionFpCount}건 (${fpRate.toFixed(4)}%)`)
  console.log(`  → ${g.regionFpCount === 0 ? '✅ PASS' : '❌ FAIL'}`)

  console.log(`\n--- 핵심 지표 ---`)
  console.log(`Precision: ${precision.toFixed(1)}% (${g.totalSubRegionInTopTiers}/${g.totalSubRegionExists})`)
  console.log(`Recall: ${recall.toFixed(1)}% (${g.totalSubRegionMatched}/${g.totalSubRegionExists})`)
  console.log(`Score Lift: ${avgLift >= 0 ? '+' : ''}${avgLift.toFixed(4)}`)
  console.log(`Differentiation: ${differentiation.toFixed(1)}% (${diffFound}/${diffTotal})`)
  console.log(`Cross-Track: ${ctRate.toFixed(4)}% → ${g.crossTrackViolations === 0 ? '✅' : '⚠️'}`)
  console.log(`Zero-Match: ${g.zeroMatchCount}/${profileCount}`)

  // 등급
  let grade = 'F'
  if (fpRate === 0 && ctRate === 0 && precision >= 80 && recall >= 70 && avgLift > 0) grade = 'A'
  else if (fpRate <= 0.1 && precision >= 60 && recall >= 50) grade = 'B'
  else if (fpRate <= 1 && precision >= 40 && recall >= 30) grade = 'C'
  console.log(`\n  종합 등급: ${grade}`)

  // Personal/Business 별도
  console.log('\n--- Personal vs Business ---')
  for (const ut of ['personal', 'business'] as const) {
    const a = metrics[`${ut}-A`], b = metrics[`${ut}-B`], c = metrics[`${ut}-C`]
    const found = a.subRegionSupportsFound
    const matched = a.subRegionInTailored + a.subRegionInRecommended + a.subRegionInExploratory
    const topTier = a.subRegionInTailored + a.subRegionInRecommended
    console.log(`  [${ut.toUpperCase()}] A(${a.count}): found=${found} top=${topTier} missed=${a.subRegionMissed}`)
    if (found > 0) console.log(`    Precision: ${pct(topTier, found)}% Recall: ${pct(matched, found)}%`)
    console.log(`    B(${b.count}): no-impact=${pct(b.noImpactCount, b.count)}% C(${c.count}): fallback=${pct(c.fallbackAppliedCount, c.count)}%`)
  }
}
