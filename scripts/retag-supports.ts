/**
 * 기존 supports 레코드에 대해 개인 트랙 차원 재추출 + service_type 태깅
 * 마이그레이션 00010 적용 후 실행
 *
 * 실행: npx tsx scripts/retag-supports.ts
 */

import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

// .env.local 수동 파싱 (run-sync.ts 패턴 재사용)
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

async function main() {
  console.log('=== supports 개인 트랙 재추출 시작 ===\n')
  const startTime = Date.now()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseUrl || !serviceKey) {
    console.error('NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  // 추출기 동적 import
  const { extractAgeRange, extractHouseholdTypes, extractIncomeLevels, extractEmploymentStatus } =
    await import('../src/lib/extraction/audience-patterns')
  const { extractBenefitCategories } = await import('../src/lib/extraction/category-patterns')

  // Step 1: source 기반 service_type 태깅
  console.log('[Step 1] Source 기반 service_type 태깅...')

  const tagRules: { source: string; serviceType: string }[] = [
    { source: 'bokjiro-central', serviceType: 'personal' },
    { source: 'bokjiro-local', serviceType: 'personal' },
    { source: 'msit-rnd', serviceType: 'business' },
    { source: 'kstartup', serviceType: 'business' },
    { source: 'subsidy24', serviceType: 'both' },
    { source: 'sme-venture24', serviceType: 'business' },
    { source: 'youth-policy', serviceType: 'personal' },
    { source: 'kocca', serviceType: 'business' },
  ]

  for (const rule of tagRules) {
    const { error, count } = await supabase
      .from('supports')
      .update({ service_type: rule.serviceType })
      .eq('source', rule.source)
      .select('id', { count: 'exact', head: true })

    if (error) {
      console.error(`  [${rule.source}] 태깅 실패: ${error.message}`)
    } else {
      console.log(`  [${rule.source}] → ${rule.serviceType} (${count ?? 0}건)`)
    }
  }

  // Step 2: 개인 차원 재추출 (복지로/보조금24 레코드)
  console.log('\n[Step 2] 개인 차원 재추출...')

  const BATCH_SIZE = 200
  let offset = 0
  let totalProcessed = 0
  let totalUpdated = 0
  let totalErrors = 0

  while (true) {
    const { data: rows, error } = await supabase
      .from('supports')
      .select('id, title, source, raw_eligibility_text, raw_preference_text')
      .in('source', ['bokjiro-central', 'bokjiro-local', 'subsidy24', 'youth-policy'])
      .range(offset, offset + BATCH_SIZE - 1)

    if (error) {
      console.error(`  배치 조회 실패 (offset ${offset}): ${error.message}`)
      break
    }
    if (!rows || rows.length === 0) break

    for (const row of rows) {
      totalProcessed++

      const texts = [
        row.raw_eligibility_text,
        row.raw_preference_text,
      ].filter(Boolean).join(' ')

      if (!texts.trim()) continue

      const ageRange = extractAgeRange(texts)
      const householdTypes = extractHouseholdTypes(texts)
      const incomeLevels = extractIncomeLevels(texts)
      const empStatus = extractEmploymentStatus(texts)
      const benefitCategories = extractBenefitCategories(row.title || '', texts)

      // 데이터가 하나라도 있으면 업데이트
      const hasData = ageRange.min !== null || ageRange.max !== null
        || householdTypes.length > 0 || incomeLevels.length > 0
        || empStatus.length > 0 || benefitCategories.length > 0

      if (!hasData) continue

      // 복지로 레코드에서 사업자 키워드 확인 → service_type 보정
      let serviceTypeOverride: string | undefined
      if (row.source === 'bokjiro-central' || row.source === 'bokjiro-local') {
        const hasBizKeywords = /기업|사업자|소상공인|법인|자영업/.test(texts)
        if (hasBizKeywords) serviceTypeOverride = 'both'
      }

      const updatePayload: Record<string, unknown> = {
        target_age_min: ageRange.min,
        target_age_max: ageRange.max,
        target_household_types: householdTypes.length > 0 ? householdTypes : null,
        target_income_levels: incomeLevels.length > 0 ? incomeLevels : null,
        target_employment_status: empStatus.length > 0 ? empStatus : null,
        benefit_categories: benefitCategories.length > 0 ? benefitCategories : null,
      }

      if (serviceTypeOverride) {
        updatePayload.service_type = serviceTypeOverride
      }

      const { error: updateError } = await supabase
        .from('supports')
        .update(updatePayload)
        .eq('id', row.id)

      if (updateError) {
        totalErrors++
        if (totalErrors <= 5) {
          console.error(`  [${row.id}] 업데이트 실패: ${updateError.message}`)
        }
      } else {
        totalUpdated++
      }
    }

    offset += BATCH_SIZE

    if (totalProcessed % 1000 === 0) {
      console.log(`  처리 중... ${totalProcessed}건 (업데이트: ${totalUpdated}건)`)
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`\n=== 재추출 완료 (${duration}초) ===`)
  console.log(`처리: ${totalProcessed}건`)
  console.log(`업데이트: ${totalUpdated}건`)
  console.log(`에러: ${totalErrors}건`)
}

main().catch(console.error)
