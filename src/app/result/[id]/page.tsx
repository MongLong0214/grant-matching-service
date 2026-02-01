import Link from 'next/link'
import { getDiagnosis, getSupportsByIds } from '@/lib/data'
import SupportList from '@/components/support-list'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface ResultPageProps {
  params: Promise<{ id: string }>
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
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <div className="mb-4 text-4xl">❌</div>
        <h1 className="mb-2 text-2xl font-bold text-foreground">잘못된 접근입니다</h1>
        <p className="mb-6 text-muted-foreground">유효하지 않은 진단 ID입니다.</p>
        <Button asChild>
          <Link href="/diagnose">진단하기</Link>
        </Button>
      </div>
    )
  }

  const diagnosis = await getDiagnosis(id)

  if (!diagnosis) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-foreground">결과를 찾을 수 없습니다</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          유효하지 않은 진단 ID이거나 결과가 만료되었습니다.
        </p>
        <div className="mt-6">
          <Button asChild>
            <Link href="/diagnose">다시 진단하기</Link>
          </Button>
        </div>
      </div>
    )
  }

  const supports = await getSupportsByIds(diagnosis.matchedSupportIds)

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      {/* Header */}
      <div className="mb-8 text-center">
        {supports.length > 0 ? (
          <>
            <div className="mb-4 text-4xl">🎉</div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
              총 <span className="text-primary">{supports.length}개</span>의 지원금을
              <br />
              받을 수 있어요!
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {diagnosis.businessType} · {diagnosis.region} · 직원 {diagnosis.employeeCount}명 기준
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
              진단 결과
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              조건에 맞는 지원금을 찾지 못했어요
            </p>
          </>
        )}
      </div>

      {/* Category summary */}
      {supports.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {Object.entries(
            supports.reduce<Record<string, number>>((acc, s) => {
              acc[s.category] = (acc[s.category] || 0) + 1
              return acc
            }, {})
          ).map(([category, count]) => (
            <Badge key={category} variant="secondary">
              {category} {count}건
            </Badge>
          ))}
        </div>
      )}

      {/* Support List */}
      <SupportList supports={supports} />

      {/* Bottom Actions */}
      <div className="mt-10 flex flex-col items-center gap-3">
        <Button asChild variant="outline">
          <Link href="/diagnose">다시 진단하기</Link>
        </Button>
        <p className="text-xs text-muted-foreground">
          * 지원금 정보는 참고용이며, 실제 조건은 해당 공고를 확인해주세요.
        </p>
      </div>
    </div>
  )
}
