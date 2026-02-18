/**
 * 프로필 생성 로직 — sub-region 3000 감사용
 */
import type { UserInput } from '../../src/types'
import { REGIONS, REGION_DISTRICTS } from '../../src/constants/index'

// 개인 트랙 옵션
const AGE_GROUPS = ['10대', '20대', '30대', '40대', '50대', '60대이상'] as const
const GENDERS = ['남성', '여성'] as const
const HOUSEHOLD_TYPES = ['1인', '신혼부부', '영유아', '다자녀', '한부모', '일반'] as const
const INCOME_LEVELS = ['기초생활', '차상위', '중위50이하', '중위100이하', '중위100초과'] as const
const EMPLOYMENT_STATUSES = ['재직자', '구직자', '학생', '자영업', '무직', '은퇴'] as const
const INTEREST_CATEGORIES = ['주거', '육아', '교육', '취업', '건강', '생활', '문화'] as const

// 사업자 트랙 옵션
const BUSINESS_TYPES_LIST = ['음식점업', '소매업', '도매업', '제조업', '건설업', '운수업', '숙박업', '정보통신업', '전문서비스업', '교육서비스업', '보건업', '예술/스포츠', '기타서비스업'] as const
const EMPLOYEE_VALUES = [2, 7, 30, 75, 150] as const
const REVENUE_VALUES = [50_000_000, 300_000_000, 750_000_000, 3_000_000_000, 10_000_000_000] as const
const BUSINESS_AGE_VALUES = [-1, 6, 24, 48, 84, 180] as const
const FOUNDER_AGE_VALUES = [25, 35, 45, 55, 65] as const

export interface TestProfile {
  input: UserInput
  profileType: 'A' | 'B' | 'C'
  targetRegion: string
  targetSubRegion: string | undefined
  userType: 'personal' | 'business'
}

export interface SubRegionStats {
  region: string
  subRegion: string
  count: number
}

export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function pickN<T>(arr: readonly T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n)
}

function makePersonalInput(region: string, subRegion: string | undefined): UserInput {
  return {
    userType: 'personal' as const,
    ageGroup: pick(AGE_GROUPS),
    gender: pick(GENDERS),
    region,
    subRegion,
    householdType: pick(HOUSEHOLD_TYPES),
    incomeLevel: pick(INCOME_LEVELS),
    employmentStatus: pick(EMPLOYMENT_STATUSES),
    interestCategories: pickN(INTEREST_CATEGORIES, 1 + Math.floor(Math.random() * 3)),
  }
}

function makeBusinessInput(region: string, subRegion: string | undefined): UserInput {
  return {
    userType: 'business' as const,
    businessType: pick(BUSINESS_TYPES_LIST),
    region,
    subRegion,
    employeeCount: pick(EMPLOYEE_VALUES),
    annualRevenue: pick(REVENUE_VALUES),
    businessAge: pick(BUSINESS_AGE_VALUES),
    founderAge: pick(FOUNDER_AGE_VALUES),
  }
}

/** Type A/B/C 비율에 따라 프로필 생성 */
export function generateProfiles(
  count: number,
  userType: 'personal' | 'business',
  validCombos: SubRegionStats[],
  noSubRegionCombos: Array<{ region: string; subRegion: string }>,
): TestProfile[] {
  const profiles: TestProfile[] = []
  const typeACount = Math.round(count * 0.5)
  const typeBCount = Math.round(count * 0.3)
  const typeCCount = count - typeACount - typeBCount
  const regionsWithDistricts = [...REGIONS].filter(r => REGION_DISTRICTS[r].length > 0)

  // Type A: sub-region 일치
  for (let i = 0; i < typeACount; i++) {
    const combo = validCombos.length > 0
      ? validCombos[i % validCombos.length]
      : { region: pick(regionsWithDistricts), subRegion: pick(REGION_DISTRICTS[pick(regionsWithDistricts)]) }
    const input = userType === 'personal'
      ? makePersonalInput(combo.region, combo.subRegion)
      : makeBusinessInput(combo.region, combo.subRegion)
    profiles.push({ input, profileType: 'A', targetRegion: combo.region, targetSubRegion: combo.subRegion, userType })
  }

  // Type B: sub-region supports 없는 구/군
  for (let i = 0; i < typeBCount; i++) {
    const combo = noSubRegionCombos.length > 0
      ? noSubRegionCombos[i % noSubRegionCombos.length]
      : { region: pick(regionsWithDistricts), subRegion: pick(REGION_DISTRICTS[pick(regionsWithDistricts)]) }
    const input = userType === 'personal'
      ? makePersonalInput(combo.region, combo.subRegion)
      : makeBusinessInput(combo.region, combo.subRegion)
    profiles.push({ input, profileType: 'B', targetRegion: combo.region, targetSubRegion: combo.subRegion, userType })
  }

  // Type C: sub-region 미선택
  for (let i = 0; i < typeCCount; i++) {
    const region = pick([...REGIONS])
    const input = userType === 'personal'
      ? makePersonalInput(region, undefined)
      : makeBusinessInput(region, undefined)
    profiles.push({ input, profileType: 'C', targetRegion: region, targetSubRegion: undefined, userType })
  }

  return profiles
}
