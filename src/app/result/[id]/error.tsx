"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function ResultError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-8 text-center">
        <div className="mb-4 text-4xl">⚠️</div>
        <h2 className="mb-2 text-xl font-bold text-foreground">
          결과를 불러올 수 없습니다
        </h2>
        <p className="mb-6 text-sm text-muted-foreground">
          일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
        </p>
        <div className="flex justify-center gap-3">
          <Button onClick={reset}>
            다시 시도
          </Button>
          <Button asChild variant="outline">
            <Link href="/diagnose">다시 진단하기</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
