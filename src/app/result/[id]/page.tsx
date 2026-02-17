import type { Metadata } from 'next'
import Link from 'next/link'
import { getDiagnosis, getSupportsByIds } from '@/lib/data'
import SupportList from '@/components/support-list'
import { Button } from '@/components/ui/button'
import { Pencil, RotateCcw } from 'lucide-react'
import { BUSINESS_AGE_OPTIONS } from '@/constants'
import { normalizeTier } from '@/lib/normalize-tier'
import type { UserType } from '@/types'

function getBusinessAgeLabel(value: number): string {
  const opt = BUSINESS_AGE_OPTIONS.find(o => o.value === value)
  return opt?.label ?? '미상'
}

interface ResultPageProps {
  params: Promise<{ id: string }>
}

// 진단 결과는 개인 정보 보호를 위해 검색 엔진 색인에서 제외
export async function generateMetadata({ params }: ResultPageProps): Promise<Metadata> {
  const { id } = await params

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    return {
      robots: { index: false, follow: false },
    }
  }

  const diagnosis = await getDiagnosis(id)

  if (!diagnosis) {
    return {
      robots: { index: false, follow: false },
    }
  }

  const userType: UserType = diagnosis.userType ?? 'business'
  const count = diagnosis.matchedCount ?? diagnosis.matchedSupportIds.length

  // 진단 조건으로 동적 title 생성 — 공유 시 내용 파악 가능
  const conditionSummary =
    userType === 'personal'
      ? `${diagnosis.region ?? ''} ${diagnosis.ageGroup ?? ''}`.trim()
      : `${diagnosis.region ?? ''} ${diagnosis.businessType ?? ''}`.trim()

  const typeLabel = userType === 'personal' ? '개인 혜택' : '사업자 지원금'
  const title = conditionSummary
    ? `${conditionSummary} 맞춤 ${typeLabel} ${count}건`
    : `맞춤 ${typeLabel} ${count}건`

  return {
    title,
    description: `${conditionSummary ? `${conditionSummary} 조건으로 ` : ''}매칭된 정부 ${typeLabel} ${count}건을 확인하세요. 혜택찾기에서 30초 무료 진단으로 나에게 맞는 혜택을 찾아보세요.`,
    // 개인 진단 결과는 색인하지 않음 (robots.txt에서도 /result/ disallow 적용)
    robots: { index: false, follow: false },
    openGraph: {
      title: `${title} | 혜택찾기`,
      description: `${conditionSummary ? `${conditionSummary} 조건으로 ` : ''}매칭된 정부 ${typeLabel} ${count}건.`,
      url: `https://gogov.co.kr/result/${id}`,
    },
  }
}

/**
 * 진단 결과 페이지
 *
 * 매칭된 지원금 목록을 표시
 * MVP: 모든 결과를 무료로 표시 (결제 없음)
 */
export default async function ResultPage({ params }: ResultPageProps) {
  const { id } = await params

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    return (
      <div className="mx-auto max-w-[480px] px-4 py-20 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <span className="text-2xl" aria-hidden="true">!</span>
        </div>
        <h1 className="mb-2 text-2xl font-bold text-foreground">잘못된 접근입니다</h1>
        <p className="mb-8 text-muted-foreground">유효하지 않은 진단 ID입니다.</p>
        <Button asChild className="rounded-lg">
          <Link href="/diagnose">진단하기</Link>
        </Button>
      </div>
    )
  }

  const diagnosis = await getDiagnosis(id)

  if (!diagnosis) {
    return (
      <div className="mx-auto max-w-[480px] px-4 py-20 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <RotateCcw className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">결과를 찾을 수 없습니다</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          유효하지 않은 진단 ID이거나 결과가 만료되었습니다.
        </p>
        <div className="mt-8">
          <Button asChild className="rounded-lg">
            <Link href="/diagnose">다시 진단하기</Link>
          </Button>
        </div>
      </div>
    )
  }

  const userType: UserType = diagnosis.userType ?? 'business'
  const supports = await getSupportsByIds(diagnosis.matchedSupportIds)

  // 저장된 매칭 점수 사용 (re-matching 제거)
  const scores = diagnosis.matchedScores ?? []
  const scoredSupports = scores.map((s) => {
    const support = supports.find((sup) => sup.id === s.supportId)
    if (!support) return null

    const raw = s.scores ?? s.breakdown
    let breakdown: Record<string, number> | undefined

    if (raw) {
      if (userType === 'personal') {
        breakdown = {
          region: Math.round((raw.region ?? 0) * 100),
          age: Math.round((raw.age ?? 0) * 100),
          householdType: Math.round((raw.householdType ?? 0) * 100),
          incomeLevel: Math.round((raw.incomeLevel ?? 0) * 100),
          employmentStatus: Math.round((raw.employmentStatus ?? 0) * 100),
        }
      } else {
        breakdown = {
          region: Math.round((raw.region ?? 0) * 100),
          businessType: Math.round((raw.businessType ?? 0) * 100),
          employee: Math.round((raw.employee ?? 0) * 100),
          revenue: Math.round((raw.revenue ?? 0) * 100),
          businessAge: Math.round((raw.businessAge ?? 0) * 100),
          founderAge: Math.round((raw.founderAge ?? 0) * 100),
        }
      }
    }

    const confidence = s.scores
      ? Math.round(s.scores.confidence * 100)
      : undefined

    return { support, score: s.score, tier: s.tier, breakdown, confidence }
  }).filter((s): s is NonNullable<typeof s> => s !== null)

  const tailoredCount = scores.filter((s) => normalizeTier(s.tier) === 'tailored').length
  const recommendedCount = scores.filter((s) => normalizeTier(s.tier) === 'recommended').length
  const exploratoryCount = scores.filter((s) => normalizeTier(s.tier) === 'exploratory').length

  return (
    <div className="mx-auto max-w-[960px] px-4 py-10 sm:py-14">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
          {userType === 'personal' ? '맞춤 혜택 결과' : '맞춤 지원금 결과'}
        </h1>
        {supports.length > 0 && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">총 {scores.length}개 발견</span>
            <span className="text-muted-foreground/40">·</span>
            {tailoredCount > 0 && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200">
                맞춤 {tailoredCount}
              </span>
            )}
            {recommendedCount > 0 && (
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                추천 {recommendedCount}
              </span>
            )}
            {exploratoryCount > 0 && (
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                탐색 {exploratoryCount}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="mb-10 rounded-xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">적용된 검색 조건</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-foreground sm:text-base">
            {userType === 'personal'
              ? `${diagnosis.ageGroup ?? ''} · ${diagnosis.region} · ${diagnosis.householdType ?? ''} · ${diagnosis.incomeLevel ?? ''}`
              : `${diagnosis.businessType} · ${diagnosis.region} · 직원 ${diagnosis.employeeCount}명 · 업력 ${getBusinessAgeLabel(diagnosis.businessAge ?? 0)}`
            }
          </p>
          <Link
            href={`/diagnose?type=${userType}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors duration-200 hover:text-primary/80"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            조건 수정
          </Link>
        </div>
      </div>

      <SupportList
        supports={supports}
        scoredSupports={scoredSupports}
        userType={userType}
      />

      <div className="mt-12 flex flex-col items-center gap-4 border-t border-border/50 pt-10">
        <Button
          asChild
          className="rounded-xl bg-primary/10 px-6 text-primary shadow-sm transition-all duration-200 hover:bg-primary/20 hover:shadow-md"
          variant="secondary"
        >
          <Link href="/diagnose" className="inline-flex items-center gap-2">
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            다른 조건으로 다시 진단하기
          </Link>
        </Button>
        <Link href="/" className="text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground">
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  )
}
