/**
 * 전체 데이터 동기화 스크립트
 * DB 리셋 후 승인된 API에서 새 데이터를 수집
 *
 * 실행: npx tsx scripts/run-sync.ts
 */

import { readFileSync, existsSync } from 'fs'

// .env.local 수동 파싱 (CI 환경에서는 건너뜀)
const envPath = '.env.local'
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf-8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim()
    if (!process.env[key]) process.env[key] = val
  }
}

async function main() {
  console.log('=== 전체 데이터 동기화 시작 ===\n')
  const startTime = Date.now()

  const sources = [
    { name: 'K-Startup', fn: async () => { const { syncKStartup } = await import('../src/lib/fetchers/kstartup'); return syncKStartup() } },
    { name: 'Bokjiro Central', fn: async () => { const { syncBokjiroCentral } = await import('../src/lib/fetchers/bokjiro-central'); return syncBokjiroCentral() } },
    { name: 'Bokjiro Local', fn: async () => { const { syncBokjiroLocal } = await import('../src/lib/fetchers/bokjiro-local'); return syncBokjiroLocal() } },
    { name: 'Subsidy24', fn: async () => { const { syncSubsidy24 } = await import('../src/lib/fetchers/subsidy24'); return syncSubsidy24() } },
    { name: 'MSIT R&D', fn: async () => { const { syncMsitRnd } = await import('../src/lib/fetchers/msit-rnd'); return syncMsitRnd() } },
    { name: 'Small Loan Finance', fn: async () => { const { syncSmallLoanFinance } = await import('../src/lib/fetchers/small-loan-finance'); return syncSmallLoanFinance() } },
    { name: 'Loan Comparison', fn: async () => { const { syncLoanComparison } = await import('../src/lib/fetchers/loan-comparison'); return syncLoanComparison() } },
    { name: 'SME Biz Announcement', fn: async () => { const { syncSmeBizAnnouncement } = await import('../src/lib/fetchers/sme-biz-announcement'); return syncSmeBizAnnouncement() } },
    { name: 'Bizinfo Odcloud', fn: async () => { const { syncBizinfoOdcloud } = await import('../src/lib/fetchers/bizinfo-odcloud'); return syncBizinfoOdcloud() } },
    { name: 'Social Finance', fn: async () => { const { syncSocialFinance } = await import('../src/lib/fetchers/social-finance'); return syncSocialFinance() } },
  ]

  const results: Record<string, unknown> = {}
  const errors: Record<string, string> = {}

  for (const source of sources) {
    try {
      console.log(`[${source.name}] 동기화 중...`)
      const result = await source.fn()
      results[source.name] = result
      console.log(`[${source.name}] 완료:`, JSON.stringify(result, null, 2))
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      errors[source.name] = msg
      console.error(`[${source.name}] 실패: ${msg}`)
    }
    console.log()
  }

  // 중복 제거
  try {
    console.log('[Dedup] 중복 제거 중...')
    const { deduplicateSupports } = await import('../src/lib/dedup')
    const dedupResult = await deduplicateSupports()
    results['dedup'] = dedupResult
    console.log('[Dedup] 완료:', JSON.stringify(dedupResult, null, 2))
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    errors['dedup'] = msg
    console.error(`[Dedup] 실패: ${msg}`)
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`\n=== 동기화 완료 (${duration}초) ===`)
  console.log(`성공: ${Object.keys(results).length}개`)
  console.log(`실패: ${Object.keys(errors).length}개`)
  if (Object.keys(errors).length > 0) {
    console.log('실패 목록:', errors)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
