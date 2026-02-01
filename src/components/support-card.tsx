import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronRight } from 'lucide-react'
import { CATEGORY_COLORS } from '@/constants'
import type { Support } from '@/types'

interface SupportCardProps {
  support: Support
}

/**
 * 지원금 카드 컴포넌트
 *
 * 개별 지원금 정보를 카드 형태로 표시
 * 분야 뱃지, 제목, 기관명, 마감일, 지원 금액 표시
 */
export default function SupportCard({ support }: SupportCardProps) {
  const categoryColor = CATEGORY_COLORS[support.category] || CATEGORY_COLORS['기타']

  /** 마감일을 D-day 형식으로 변환 */
  function formatDeadline(endDate: string | null): string {
    if (!endDate) return '상시'

    const end = new Date(endDate)
    const now = new Date()
    const diffTime = end.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return '마감'
    if (diffDays === 0) return 'D-Day'
    return `D-${diffDays}`
  }

  const deadline = formatDeadline(support.endDate)
  const isUrgent = deadline === 'D-Day' || (deadline !== '상시' && deadline !== '마감' && !isNaN(parseInt(deadline.replace('D-', ''))) && parseInt(deadline.replace('D-', '')) <= 7)

  return (
    <Card className="transition-all duration-200 hover:shadow-md hover:border-primary/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`${categoryColor.bg} ${categoryColor.text} border-0`}>
              {support.category}
            </Badge>
            <span className={`text-xs font-medium ${isUrgent ? 'text-destructive' : 'text-muted-foreground'}`}>
              {deadline}
            </span>
          </div>
        </div>
        <CardTitle className="text-base leading-snug">{support.title}</CardTitle>
        <CardDescription>{support.organization}</CardDescription>
      </CardHeader>
      {support.amount && (
        <CardContent>
          <p className="text-sm font-semibold text-primary">{support.amount}</p>
        </CardContent>
      )}
      {support.detailUrl && (
        <CardFooter>
          <a
            href={support.detailUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${support.title} 자세히 보기`}
            className="inline-flex items-center text-sm font-medium text-primary hover:underline"
          >
            자세히 보기
            <ChevronRight aria-hidden="true" className="ml-1 h-4 w-4" />
          </a>
        </CardFooter>
      )}
    </Card>
  )
}
