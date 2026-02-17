'use client'

interface FormProgressProps {
  filledCount: number
  totalCount: number
}

export default function FormProgress({ filledCount, totalCount }: FormProgressProps) {
  const percentage = Math.round((filledCount / totalCount) * 100)
  const isComplete = filledCount === totalCount

  return (
    <div className="mb-8 rounded-xl bg-muted/40 p-4">
      <div className="mb-2.5 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {totalCount}개 중 <span className="font-semibold text-foreground">{filledCount}개</span> 입력 완료
        </span>
        <span className={`font-semibold tabular-nums ${isComplete ? 'text-emerald-600' : 'text-primary'}`}>
          {percentage}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            isComplete
              ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
              : 'bg-gradient-to-r from-primary to-emerald-400'
          }`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`진단 폼 ${percentage}% 완료`}
        />
      </div>
    </div>
  )
}
