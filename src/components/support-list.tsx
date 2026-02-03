import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'
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
      <div className="rounded-2xl border bg-card p-12 text-center shadow-sm">
        <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
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
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {supports.map((support) => (
        <SupportCard key={support.id} support={support} />
      ))}
    </div>
  )
}
