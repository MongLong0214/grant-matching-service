import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { runAllSyncTasks } from '@/lib/sync-runner'

export const maxDuration = 300

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  const expected = cronSecret ? `Bearer ${cronSecret}` : ''

  if (!cronSecret || !authHeader ||
      Buffer.byteLength(authHeader) !== Buffer.byteLength(expected) ||
      !timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected))) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const startTime = Date.now()
  const { results, errors } = await runAllSyncTasks()
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
