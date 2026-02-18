/**
 * CHECK 1: CITY_TO_REGION 완성도 vs REGION_DISTRICTS
 */
import { CITY_TO_REGION, AMBIGUOUS_DISTRICTS, REGION_DISTRICTS, REGION_VARIANTS } from './shared'
import type { CheckResult } from './shared'

export function checkCompleteness(): CheckResult {
  const details: string[] = []
  let totalDistricts = 0
  let covered = 0
  let ambiguousExcluded = 0
  const missing: { region: string; district: string }[] = []

  for (const [region, districts] of Object.entries(REGION_DISTRICTS)) {
    for (const district of districts) {
      totalDistricts++
      if (CITY_TO_REGION[district] === region) {
        covered++
      } else if (AMBIGUOUS_DISTRICTS.has(district)) {
        ambiguousExcluded++
        const matchingRegions = Object.entries(REGION_DISTRICTS)
          .filter(([, ds]) => ds.includes(district)).map(([r]) => r)
        if (matchingRegions.length <= 1) {
          details.push(`WARNING: ${district}은 모호 처리되었으나 ${matchingRegions.join(',')}에만 존재`)
          missing.push({ region, district })
        }
      } else {
        missing.push({ region, district })
      }
    }
  }

  // CITY_TO_REGION에 있지만 REGION_DISTRICTS에 없는 항목
  const extraEntries: string[] = []
  for (const [city, region] of Object.entries(CITY_TO_REGION)) {
    if (!city.endsWith('시') && !city.endsWith('구') && !city.endsWith('군')) continue
    const districts = REGION_DISTRICTS[region]
    if (!districts || !districts.includes(city)) extraEntries.push(`${city} -> ${region}`)
  }

  details.push(`REGION_DISTRICTS 총 구/군: ${totalDistricts}`)
  details.push(`CITY_TO_REGION 커버: ${covered}`)
  details.push(`모호 제외: ${ambiguousExcluded}`)
  details.push(`누락: ${missing.length}`)
  if (missing.length > 0) {
    details.push('\n--- 누락 항목 ---')
    for (const m of missing) details.push(`  ${m.region}: ${m.district}`)
  }
  if (extraEntries.length > 0) {
    details.push('\n--- CITY_TO_REGION 초과 항목 ---')
    for (const e of extraEntries) details.push(`  ${e}`)
  }

  const shortForms = Object.keys(CITY_TO_REGION).filter(k => !k.endsWith('시') && !k.endsWith('구') && !k.endsWith('군'))
  details.push(`\n단축형 항목 (예: "수원"→경기): ${shortForms.length}`)

  const allRegionKeys = Object.keys(REGION_DISTRICTS)
  const variantKeys = Object.keys(REGION_VARIANTS)
  const missingVariants = allRegionKeys.filter(k => !variantKeys.includes(k))
  details.push(missingVariants.length > 0
    ? `\nREGION_VARIANTS 누락: ${missingVariants.join(', ')}`
    : `\nREGION_VARIANTS: 전체 ${allRegionKeys.length}개 커버`)

  const coverageRate = (covered + ambiguousExcluded) / totalDistricts
  const score = Math.round(coverageRate * 100)
  const grade = score >= 95 ? 'A' : score >= 85 ? 'B' : score >= 70 ? 'C' : 'D'
  return { grade, score, summary: `${covered}/${totalDistricts} 커버, ${ambiguousExcluded} 모호 제외, ${missing.length} 누락`, details }
}
