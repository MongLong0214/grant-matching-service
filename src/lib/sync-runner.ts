import { syncKStartup } from '@/lib/fetchers/kstartup'
import { syncBokjiroCentral } from '@/lib/fetchers/bokjiro-central'
import { syncBokjiroLocal } from '@/lib/fetchers/bokjiro-local'
import { syncSubsidy24 } from '@/lib/fetchers/subsidy24'
import { syncMsitRnd } from '@/lib/fetchers/msit-rnd'
import { syncSmallLoanFinance } from '@/lib/fetchers/small-loan-finance'
import { syncLoanComparison } from '@/lib/fetchers/loan-comparison'
import { syncSmeBizAnnouncement } from '@/lib/fetchers/sme-biz-announcement'
import { syncBizinfoOdcloud } from '@/lib/fetchers/bizinfo-odcloud'
import { syncSocialFinance } from '@/lib/fetchers/social-finance'
import { deduplicateSupports } from '@/lib/dedup'
import { cleanupExpiredSupports } from '@/lib/cleanup'
import { recordExtractionStats } from '@/lib/extraction-stats'

interface SyncTask {
  key: string
  label: string
  run: () => Promise<unknown>
}

// 동기화 작업 정의 (순차 실행)
const SYNC_TASKS: SyncTask[] = [
  { key: 'kstartup', label: 'K-Startup', run: syncKStartup },
  { key: 'bokjiroCentral', label: 'Bokjiro Central', run: syncBokjiroCentral },
  { key: 'bokjiroLocal', label: 'Bokjiro Local', run: syncBokjiroLocal },
  { key: 'subsidy24', label: 'Subsidy24', run: syncSubsidy24 },
  { key: 'msitRnd', label: 'MSIT R&D', run: syncMsitRnd },
  { key: 'smallLoanFinance', label: 'Small Loan Finance', run: syncSmallLoanFinance },
  { key: 'loanComparison', label: 'Loan Comparison', run: syncLoanComparison },
  { key: 'smeBizAnnouncement', label: 'SME Biz Announcement', run: syncSmeBizAnnouncement },
  { key: 'bizinfoOdcloud', label: 'Bizinfo Odcloud', run: syncBizinfoOdcloud },
  { key: 'socialFinance', label: 'Social Finance', run: syncSocialFinance },
]

// 후처리 작업 (중복 제거, 만료 정리, 통계)
const POST_TASKS: SyncTask[] = [
  { key: 'dedup', label: 'Dedup', run: deduplicateSupports },
  { key: 'cleanup', label: 'Cleanup', run: cleanupExpiredSupports },
  { key: 'extractionStats', label: 'Extraction stats', run: recordExtractionStats },
]

export interface SyncRunResult {
  results: Record<string, unknown>
  errors: Record<string, string>
}

// 전체 동기화 + 후처리 순차 실행
export async function runAllSyncTasks(): Promise<SyncRunResult> {
  const results: Record<string, unknown> = {}
  const errors: Record<string, string> = {}

  for (const task of [...SYNC_TASKS, ...POST_TASKS]) {
    try {
      results[task.key] = await task.run()
    } catch (e) {
      errors[task.key] = e instanceof Error ? e.message : 'Unknown error'
      console.error(`[Cron] ${task.label} failed:`, e)
    }
  }

  return { results, errors }
}
