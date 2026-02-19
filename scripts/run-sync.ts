/**
 * 전체 데이터 동기화 스크립트
 * 승인된 API에서 데이터를 수집하고 중복 제거
 *
 * 실행: npx tsx scripts/run-sync.ts
 * 특정 소스만: SYNC_SOURCE=subsidy24 npx tsx scripts/run-sync.ts
 *
 * Phase 1: bokjiro-central + 비-bokjiro 소스 (concurrency 2)
 * Phase 2: bokjiro-local (central 이후 실행 — 지역 덮어쓰기 순서 보장)
 * Phase 3: 중복 제거
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
    let val = trimmed.slice(eqIdx + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = val
  }
}

const CONCURRENCY = 2

// tsx dynamic import에서 ESM/CJS 호환 처리
// named export가 mod.default 안에 감싸지는 경우 대응
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getExport(mod: any, name: string) {
  return mod[name] ?? mod.default?.[name]
}

interface SyncTask {
  name: string
  fn: () => Promise<Record<string, unknown>>
}

async function runWithConcurrency(
  tasks: SyncTask[],
  limit: number,
): Promise<{ results: Record<string, Record<string, unknown>>; errors: Record<string, string> }> {
  const results: Record<string, Record<string, unknown>> = {}
  const errors: Record<string, string> = {}
  const queue = [...tasks]

  async function worker() {
    while (queue.length > 0) {
      const task = queue.shift()!
      try {
        console.log(`[${task.name}] 동기화 중...`)
        const result = await task.fn()
        results[task.name] = result
        console.log(`[${task.name}] 완료:`, JSON.stringify(result, null, 2))
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Unknown error'
        errors[task.name] = msg
        console.error(`[${task.name}] 실패: ${msg}`)
      }
      console.log()
    }
  }

  const workers = Array.from({ length: Math.min(limit, tasks.length) }, () => worker())
  await Promise.all(workers)

  return { results, errors }
}

interface SourceDef {
  name: string
  label: string
  fn: () => Promise<Record<string, unknown>>
  phase: 1 | 2
}

async function main() {
  const syncSource = process.env.SYNC_SOURCE || 'all'
  console.log(`=== 데이터 동기화 시작 (source: ${syncSource}) ===\n`)
  const startTime = Date.now()

  const allSources: SourceDef[] = [
    { name: 'kstartup', label: 'K-Startup', phase: 1, fn: async () => { const mod = await import('../src/lib/fetchers/kstartup'); return getExport(mod, 'syncKStartup')() } },
    { name: 'bokjiro-central', label: 'Bokjiro Central', phase: 1, fn: async () => { const mod = await import('../src/lib/fetchers/bokjiro-central'); return getExport(mod, 'syncBokjiroCentral')() } },
    { name: 'bokjiro-local', label: 'Bokjiro Local', phase: 2, fn: async () => { const mod = await import('../src/lib/fetchers/bokjiro-local'); return getExport(mod, 'syncBokjiroLocal')() } },
    { name: 'subsidy24', label: 'Subsidy24', phase: 1, fn: async () => { const mod = await import('../src/lib/fetchers/subsidy24'); return getExport(mod, 'syncSubsidy24')() } },
    { name: 'msit-rnd', label: 'MSIT R&D', phase: 1, fn: async () => { const mod = await import('../src/lib/fetchers/msit-rnd'); return getExport(mod, 'syncMsitRnd')() } },
    { name: 'small-loan-finance', label: 'Small Loan Finance', phase: 1, fn: async () => { const mod = await import('../src/lib/fetchers/small-loan-finance'); return getExport(mod, 'syncSmallLoanFinance')() } },
    { name: 'loan-comparison', label: 'Loan Comparison', phase: 1, fn: async () => { const mod = await import('../src/lib/fetchers/loan-comparison'); return getExport(mod, 'syncLoanComparison')() } },
    { name: 'sme-biz-announcement', label: 'SME Biz Announcement', phase: 1, fn: async () => { const mod = await import('../src/lib/fetchers/sme-biz-announcement'); return getExport(mod, 'syncSmeBizAnnouncement')() } },
    { name: 'bizinfo-odcloud', label: 'Bizinfo Odcloud', phase: 1, fn: async () => { const mod = await import('../src/lib/fetchers/bizinfo-odcloud'); return getExport(mod, 'syncBizinfoOdcloud')() } },
    { name: 'social-finance', label: 'Social Finance', phase: 1, fn: async () => { const mod = await import('../src/lib/fetchers/social-finance'); return getExport(mod, 'syncSocialFinance')() } },
  ]

  const sources = syncSource === 'all'
    ? allSources
    : allSources.filter(s => s.name === syncSource)

  if (sources.length === 0) {
    console.error(`Unknown source: ${syncSource}`)
    process.exit(1)
  }

  const allResults: Record<string, Record<string, unknown>> = {}
  const allErrors: Record<string, string> = {}

  // Phase 1: bokjiro-central + 비-bokjiro 소스 (concurrency 2)
  const phase1 = sources.filter(s => s.phase === 1).map(s => ({ name: s.label, fn: s.fn }))
  if (phase1.length > 0) {
    console.log(`--- Phase 1: ${phase1.length}개 소스 (concurrency ${CONCURRENCY}) ---\n`)
    const { results, errors } = await runWithConcurrency(phase1, CONCURRENCY)
    Object.assign(allResults, results)
    Object.assign(allErrors, errors)
  }

  // Phase 2: bokjiro-local (central 완료 후 — ctpvNm 지역 덮어쓰기 순서 보장)
  const phase2 = sources.filter(s => s.phase === 2).map(s => ({ name: s.label, fn: s.fn }))
  if (phase2.length > 0) {
    console.log(`--- Phase 2: ${phase2.length}개 소스 (bokjiro-local) ---\n`)
    const { results, errors } = await runWithConcurrency(phase2, 1)
    Object.assign(allResults, results)
    Object.assign(allErrors, errors)
  }

  // Phase 3: 중복 제거
  try {
    console.log('--- Phase 3: 중복 제거 ---\n')
    console.log('[Dedup] 중복 제거 중...')
    const mod = await import('../src/lib/dedup')
    const deduplicateSupports = getExport(mod, 'deduplicateSupports')
    const dedupResult = await deduplicateSupports()
    console.log('[Dedup] 완료:', JSON.stringify(dedupResult, null, 2))
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    allErrors['dedup'] = msg
    console.error(`[Dedup] 실패: ${msg}`)
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1)
  const successCount = Object.keys(allResults).length
  const errorCount = Object.keys(allErrors).length
  console.log(`\n=== 동기화 완료 (${duration}초) ===`)
  console.log(`성공: ${successCount}개`)
  console.log(`실패: ${errorCount}개`)
  if (errorCount > 0) {
    console.log('실패 목록:', allErrors)
    process.exit(1)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
