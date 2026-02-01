import Link from 'next/link'
import { getDiagnosis, getSupportsByIds } from '@/lib/data'
import SupportList from '@/components/support-list'
import { Button } from '@/components/ui/button'

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

  const diagnosis = await getDiagnosis(id)

  if (!diagnosis) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-slate-900">결과를 찾을 수 없습니다</h1>
        <p className="mt-2 text-sm text-slate-600">
          유효하지 않은 진단 ID이거나 결과가 만료되었습니다.
        </p>
        <div className="mt-6">
          <Link href="/diagnose">
            <Button>다시 진단하기</Button>
          </Link>
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
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              총 <span className="text-blue-600">{supports.length}개</span>의 지원금을
              <br />
              받을 수 있어요!
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {diagnosis.businessType} · {diagnosis.region} · 직원 {diagnosis.employeeCount}명 기준
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              진단 결과
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              조건에 맞는 지원금을 찾지 못했어요
            </p>
          </>
        )}
      </div>

      {/* Support List */}
      <SupportList supports={supports} />

      {/* Bottom Actions */}
      <div className="mt-10 flex flex-col items-center gap-3">
        <Link href="/diagnose">
          <Button variant="outline">다시 진단하기</Button>
        </Link>
        <p className="text-xs text-slate-400">
          * 지원금 정보는 참고용이며, 실제 조건은 해당 공고를 확인해주세요.
        </p>
      </div>
    </div>
  )
}
