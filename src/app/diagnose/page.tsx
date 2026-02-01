'use client'

import DiagnoseForm from '@/components/diagnose-form'
import { useDiagnose } from '@/hooks/use-diagnose'

/**
 * 진단 폼 페이지
 *
 * 사업 정보를 입력받아 지원금 매칭을 실행
 * 30초 내 입력 완료를 목표로 설계
 */
export default function DiagnosePage() {
  const { submitDiagnosis, isLoading, error } = useDiagnose()

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          사업 정보 입력
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          아래 정보를 입력하면 받을 수 있는 지원금을 찾아드려요
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Form */}
      <DiagnoseForm onSubmit={submitDiagnosis} isLoading={isLoading} />
    </div>
  )
}
