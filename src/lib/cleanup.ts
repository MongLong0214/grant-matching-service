import { createClient } from '@supabase/supabase-js'

interface CleanupResult {
  expired: number
  deactivated: number
}

/**
 * Deactivate supports that have passed their end_date.
 * Runs as part of the daily cron job.
 */
export async function cleanupExpiredSupports(): Promise<CleanupResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, serviceKey)

  const now = new Date().toISOString()

  // Find expired active supports
  const { data: expired, error: queryError } = await supabase
    .from('supports')
    .select('id')
    .eq('is_active', true)
    .not('end_date', 'is', null)
    .lt('end_date', now)

  if (queryError) {
    throw new Error(`Failed to query expired supports: ${queryError.message}`)
  }

  if (!expired || expired.length === 0) {
    return { expired: 0, deactivated: 0 }
  }

  // Batch deactivate (100 at a time)
  let deactivated = 0
  const ids = expired.map((s) => s.id)

  for (let i = 0; i < ids.length; i += 100) {
    const batch = ids.slice(i, i + 100)
    const { error } = await supabase
      .from('supports')
      .update({ is_active: false })
      .in('id', batch)

    if (!error) {
      deactivated += batch.length
    } else {
      console.error(`[Cleanup] Batch deactivation error:`, error.message)
    }
  }

  // Log cleanup
  await supabase.from('sync_logs').insert({
    source: 'cleanup',
    status: 'completed',
    completed_at: new Date().toISOString(),
    programs_fetched: expired.length,
    programs_updated: deactivated,
    metadata: {
      expiredFound: expired.length,
      deactivated,
    },
  })

  return { expired: expired.length, deactivated }
}
