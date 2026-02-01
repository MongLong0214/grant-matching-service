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
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
        <p className="text-lg font-medium text-slate-600">
          조건에 맞는 지원금이 없습니다.
        </p>
        <p className="mt-2 text-sm text-slate-500">
          입력 조건을 변경하여 다시 진단해보세요.
        </p>
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
