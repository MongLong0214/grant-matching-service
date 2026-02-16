import { NextRequest, NextResponse } from 'next/server'
import { syncKStartup } from '@/lib/fetchers/kstartup'
import { syncBokjiroCentral } from '@/lib/fetchers/bokjiro-central'
import { syncBokjiroLocal } from '@/lib/fetchers/bokjiro-local'
import { syncBizinfoRss } from '@/lib/fetchers/bizinfo-rss'
import { syncSubsidy24 } from '@/lib/fetchers/subsidy24'
import { syncSmeVenture24 } from '@/lib/fetchers/sme-venture24'
import { syncMsitRnd } from '@/lib/fetchers/msit-rnd'
import { syncYouthPolicy } from '@/lib/fetchers/youth-policy'
import { syncKocca } from '@/lib/fetchers/kocca'
import { deduplicateSupports } from '@/lib/dedup'
import { cleanupExpiredSupports } from '@/lib/cleanup'
import { recordExtractionStats } from '@/lib/extraction-stats'

export async function GET(request: NextRequest) {
  // Verify Vercel Cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const results: Record<string, unknown> = {}
  const errors: Record<string, string> = {}
  const startTime = Date.now()

  // 1. K-Startup
  try {
    results.kstartup = await syncKStartup()
  } catch (e) {
    errors.kstartup = e instanceof Error ? e.message : 'Unknown error'
    console.error('[Cron] K-Startup sync failed:', e)
  }

  // 2. Bokjiro Central (incremental)
  try {
    results.bokjiroCentral = await syncBokjiroCentral()
  } catch (e) {
    errors.bokjiroCentral = e instanceof Error ? e.message : 'Unknown error'
    console.error('[Cron] Bokjiro Central sync failed:', e)
  }

  // 3. Bokjiro Local
  try {
    results.bokjiroLocal = await syncBokjiroLocal()
  } catch (e) {
    errors.bokjiroLocal = e instanceof Error ? e.message : 'Unknown error'
    console.error('[Cron] Bokjiro Local sync failed:', e)
  }

  // 4. Bizinfo RSS
  try {
    results.bizinfoRss = await syncBizinfoRss()
  } catch (e) {
    errors.bizinfoRss = e instanceof Error ? e.message : 'Unknown error'
    console.error('[Cron] Bizinfo RSS sync failed:', e)
  }

  // 5. Subsidy24 (보조금24)
  try {
    results.subsidy24 = await syncSubsidy24()
  } catch (e) {
    errors.subsidy24 = e instanceof Error ? e.message : 'Unknown error'
    console.error('[Cron] Subsidy24 sync failed:', e)
  }

  // 6. SME Venture24 (중소벤처24)
  try {
    results.smeVenture24 = await syncSmeVenture24()
  } catch (e) {
    errors.smeVenture24 = e instanceof Error ? e.message : 'Unknown error'
    console.error('[Cron] SME Venture24 sync failed:', e)
  }

  // 7. MSIT R&D (과기정통부)
  try {
    results.msitRnd = await syncMsitRnd()
  } catch (e) {
    errors.msitRnd = e instanceof Error ? e.message : 'Unknown error'
    console.error('[Cron] MSIT R&D sync failed:', e)
  }

  // 8. Youth Policy (온통청년)
  try {
    results.youthPolicy = await syncYouthPolicy()
  } catch (e) {
    errors.youthPolicy = e instanceof Error ? e.message : 'Unknown error'
    console.error('[Cron] Youth Policy sync failed:', e)
  }

  // 9. KOCCA (한국콘텐츠진흥원)
  try {
    results.kocca = await syncKocca()
  } catch (e) {
    errors.kocca = e instanceof Error ? e.message : 'Unknown error'
    console.error('[Cron] KOCCA sync failed:', e)
  }

  // 10. Deduplication
  try {
    results.dedup = await deduplicateSupports()
  } catch (e) {
    errors.dedup = e instanceof Error ? e.message : 'Unknown error'
    console.error('[Cron] Dedup failed:', e)
  }

  // 11. Expired data cleanup
  try {
    results.cleanup = await cleanupExpiredSupports()
  } catch (e) {
    errors.cleanup = e instanceof Error ? e.message : 'Unknown error'
    console.error('[Cron] Cleanup failed:', e)
  }

  // 12. Extraction stats
  try {
    results.extractionStats = await recordExtractionStats()
  } catch (e) {
    errors.extractionStats = e instanceof Error ? e.message : 'Unknown error'
    console.error('[Cron] Extraction stats failed:', e)
  }

  const elapsed = Date.now() - startTime
  const hasErrors = Object.keys(errors).length > 0

  return NextResponse.json({
    success: !hasErrors,
    partial: hasErrors && Object.keys(results).length > 0,
    results,
    errors: hasErrors ? errors : undefined,
    elapsedMs: elapsed,
    timestamp: new Date().toISOString(),
  })
}
