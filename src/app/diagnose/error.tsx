"use client"

import { Button } from '@/components/ui/button'

export default function DiagnoseError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-8 text-center">
        <div className="mb-4 text-4xl">⚠️</div>
        <h2 className="mb-2 text-xl font-bold text-foreground">
          오류가 발생했습니다
        </h2>
        <p className="mb-6 text-sm text-muted-foreground">
          진단 페이지를 불러오는 중 문제가 발생했습니다.
        </p>
        <Button onClick={reset}>
          다시 시도
        </Button>
      </div>
    </div>
  )
}
