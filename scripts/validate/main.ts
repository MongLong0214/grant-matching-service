/**
 * Region Dictionary 검증 메인 실행기
 * CHECK 1~4 실행 후 종합 리포트
 *
 * 실행: npx tsx scripts/validate/main.ts
 */
import { checkCompleteness } from './check-completeness'
import { checkDBLeaks, checkAccuracy } from './check-db'
import { checkSubRegions } from './check-sub-regions'

async function main() {
  console.log('='.repeat(70))
  console.log('  Region Dictionary 검증 리포트')
  console.log('  ' + new Date().toISOString())
  console.log('='.repeat(70))

  // CHECK 1: 완성도
  console.log('\n' + '='.repeat(70))
  console.log('  CHECK 1: CITY_TO_REGION 완성도 vs REGION_DISTRICTS')
  console.log('='.repeat(70))
  const c1 = checkCompleteness()
  for (const d of c1.details) console.log(d)
  console.log(`\n  등급: ${c1.grade} (${c1.score}%) - ${c1.summary}`)

  // CHECK 2: DB 유출
  console.log('\n' + '='.repeat(70))
  console.log('  CHECK 2: DB 교차검증 — 빈 지역에서 유출된 지역명')
  console.log('='.repeat(70))
  const c2 = await checkDBLeaks()
  for (const d of c2.details) console.log(d)
  console.log(`\n  등급: ${c2.grade} (${c2.score}%) - ${c2.summary}`)

  // CHECK 3: 제목 정확도
  console.log('\n' + '='.repeat(70))
  console.log('  CHECK 3: 제목 지역명 정확도 (샘플 500)')
  console.log('='.repeat(70))
  const c3 = await checkAccuracy()
  for (const d of c3.details) console.log(d)
  console.log(`\n  등급: ${c3.grade} (${c3.score}%) - ${c3.summary}`)

  // CHECK 4: Sub-region
  console.log('\n' + '='.repeat(70))
  console.log('  CHECK 4: Sub-Region 유효성')
  console.log('='.repeat(70))
  const c4 = await checkSubRegions()
  for (const d of c4.details) console.log(d)
  console.log(`\n  등급: ${c4.grade} (${c4.score}%) - ${c4.summary}`)

  // 종합
  console.log('\n' + '='.repeat(70))
  console.log('  종합 요약')
  console.log('='.repeat(70))
  const checks = [
    { name: '완성도', ...c1 },
    { name: 'DB 유출 감지', ...c2 },
    { name: '제목 정확도', ...c3 },
    { name: 'Sub-Region', ...c4 },
  ]
  const avgScore = Math.round(checks.reduce((s, c) => s + c.score, 0) / checks.length)
  const overallGrade = avgScore >= 95 ? 'A' : avgScore >= 85 ? 'B' : avgScore >= 70 ? 'C' : 'D'
  for (const c of checks) console.log(`  ${c.grade} (${c.score}%) | ${c.name}: ${c.summary}`)
  console.log(`\n  종합: ${overallGrade} (${avgScore}%)`)
  console.log('='.repeat(70))
}

main().catch(e => { console.error('Fatal error:', e); process.exit(1) })
