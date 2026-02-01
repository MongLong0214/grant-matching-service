import Link from 'next/link'
import { Button } from '@/components/ui/button'
import SupportCard from '@/components/support-card'
import type { Support } from '@/types'

interface SupportListProps {
  supports: Support[]
}

/**
 * 지원금 리스트 컴포넌트
 *
 * 매칭된 지원금 카드를 그리드로 표시
 */
export default function SupportList({ supports }: SupportListProps) {
  if (supports.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-muted/50 p-10 text-center">
        <div className="mb-4 text-5xl">🔍</div>
        <p className="text-lg font-semibold text-foreground">조건에 맞는 지원금이 없습니다</p>
        <p className="mt-2 text-sm text-muted-foreground">
          입력 조건을 변경하면 더 많은 지원금을 찾을 수 있어요.
        </p>
        <Button asChild className="mt-5">
          <Link href="/diagnose">다시 진단하기</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {supports.map((support) => (
        <SupportCard key={support.id} support={support} />
      ))}
    </div>
  )
}
