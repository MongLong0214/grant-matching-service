/**
 * validate 공통 타입 + 유틸
 */
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import { REGION_DISTRICTS } from '../../src/constants/index'
import { REGION_VARIANTS, CTPV_TO_REGION } from '../../src/lib/extraction/region-dictionary'

// .env.local 수동 파싱
function loadEnvFile(filePath: string): void {
  if (!fs.existsSync(filePath)) return
  const content = fs.readFileSync(filePath, 'utf-8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    let value = trimmed.slice(eqIdx + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))
      value = value.slice(1, -1)
    if (!process.env[key]) process.env[key] = value
  }
}
loadEnvFile(path.resolve(process.cwd(), '.env.local'))

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE env vars in .env.local')
  process.exit(1)
}
export const supabase = createClient(supabaseUrl, supabaseKey)

// CTPV_TO_REGION에서 REGION_VARIANTS 제외 → CITY_TO_REGION 복원
const variantValues = new Set<string>()
for (const variants of Object.values(REGION_VARIANTS)) {
  for (const v of variants) variantValues.add(v)
}
export const CITY_TO_REGION: Record<string, string> = {}
for (const [key, region] of Object.entries(CTPV_TO_REGION)) {
  if (!variantValues.has(key)) CITY_TO_REGION[key] = region
}

export const AMBIGUOUS_DISTRICTS = new Set(['중구', '동구', '서구', '남구', '북구', '강서구'])
export const REGION_PATTERN = /[가-힣]{1,5}[시구군]/g

export interface CheckResult {
  grade: string
  score: number
  summary: string
  details: string[]
}

export { REGION_DISTRICTS, REGION_VARIANTS }
