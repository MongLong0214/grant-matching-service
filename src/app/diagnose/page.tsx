'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import DiagnoseForm from '@/components/diagnose-form'
import { useDiagnose } from '@/hooks/use-diagnose'
import type { UserType } from '@/types'

function DiagnoseContent() {
  const searchParams = useSearchParams()
  const typeParam = searchParams.get('type')
  const initialUserType = (typeParam === 'personal' || typeParam === 'business')
    ? typeParam as UserType
    : undefined

  const { submitDiagnosis, isLoading, error } = useDiagnose()

  return (
    <div className="mx-auto max-w-[640px] px-4 py-12">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
          무료 진단하기
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          <span className="text-primary font-semibold">6,000여 개의 정부 지원사업 데이터</span>를 기반으로 분석합니다
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Form card */}
      <div className="rounded-2xl border border-border bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] sm:p-10">
        <DiagnoseForm
          onSubmit={submitDiagnosis}
          isLoading={isLoading}
          initialUserType={initialUserType}
        />
      </div>

      {/* Disclaimer */}
      <p className="mt-6 text-center text-xs text-muted-foreground">
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
    <Suspense>
      <DiagnoseContent />
    </Suspense>
  )
}
