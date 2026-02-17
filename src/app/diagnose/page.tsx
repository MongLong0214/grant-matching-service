'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import DiagnoseForm from '@/components/diagnose-form'
import { useDiagnose } from '@/hooks/use-diagnose'
import type { UserType } from '@/types'

function DiagnoseSkeleton() {
  return (
    <div className="mx-auto max-w-[640px] px-4 py-12 sm:py-16">
      <div className="mb-10 text-center">
        <div className="mx-auto mb-3 h-9 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="mx-auto h-5 w-64 animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm sm:p-10">
        <div className="space-y-6">
          <div className="h-6 w-40 animate-pulse rounded bg-muted" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-32 animate-pulse rounded-2xl border border-border/40 bg-muted/50" />
            <div className="h-32 animate-pulse rounded-2xl border border-border/40 bg-muted/50" />
          </div>
        </div>
      </div>
    </div>
  )
}

function DiagnoseContent() {
  const searchParams = useSearchParams()
  const typeParam = searchParams.get('type')
  const initialUserType = (typeParam === 'personal' || typeParam === 'business')
    ? typeParam as UserType
    : undefined

  const { submitDiagnosis, isLoading, error } = useDiagnose()

  return (
    <div className="mx-auto max-w-[640px] px-4 py-12 sm:py-16">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
          무료 진단하기
        </h1>
        <p className="mt-3 text-sm text-muted-foreground sm:text-base">
          <span className="font-semibold text-primary">6,000여 개의 정부 지원사업 데이터</span>를 기반으로 분석합니다
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive" role="alert">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm sm:p-10">
        <DiagnoseForm
          onSubmit={submitDiagnosis}
          isLoading={isLoading}
          initialUserType={initialUserType}
        />
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground/70">
        입력하신 정보는 진단 목적으로만 사용되며, 안전하게 보호됩니다
      </p>
    </div>
  )
}

/**
 * 진단 폼 페이지
 *
 * URL ?type=personal 또는 ?type=business 로 트랙 결정
 * 미지정 시 폼 내에서 유형 선택 UI 표시
 */
export default function DiagnosePage() {
  return (
    <Suspense fallback={<DiagnoseSkeleton />}>
      <DiagnoseContent />
    </Suspense>
  )
}
