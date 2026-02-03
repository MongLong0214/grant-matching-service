import Link from 'next/link'
import { getDiagnosis, getSupportsByIds } from '@/lib/data'
import SupportList from '@/components/support-list'
import { Button } from '@/components/ui/button'
import { CheckCircle, Pencil, RotateCcw } from 'lucide-react'

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
      <div className="mx-auto max-w-[960px] px-4 py-12 text-center">
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
      <div className="mx-auto max-w-[960px] px-4 py-20 text-center">
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
    <div className="mx-auto max-w-[960px] px-4 py-10">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">맞춤 지원금 결과</h1>
        {supports.length > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-primary">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-semibold">{supports.length}개 매칭됨</span>
          </div>
        )}
      </div>

      {/* Summary Card */}
      <div className="mb-10 rounded-xl border bg-white p-6 shadow-sm">
        <p className="mb-2 text-sm text-gray-500">현재 적용된 검색 조건</p>
        <div className="flex items-center justify-between">
          <p className="font-bold text-foreground">
            {diagnosis.businessType} · {diagnosis.region} · 직원 {diagnosis.employeeCount}명
          </p>
          <Link
            href="/diagnose"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <Pencil className="h-4 w-4" />
            조건 수정하기
          </Link>
        </div>
      </div>

      {/* Support List */}
      <SupportList supports={supports} />

      {/* Bottom Actions */}
      <div className="mt-10 flex flex-col items-center gap-4">
        <Button
          asChild
          className="rounded-full bg-primary/10 text-primary hover:bg-primary/20"
          variant="secondary"
        >
          <Link href="/diagnose" className="inline-flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            다른 조건으로 다시 진단하기
          </Link>
        </Button>
        <Link href="/" className="text-sm text-muted-foreground hover:underline">
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  )
}
