'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { DiagnoseFormData } from '@/types'

/**
 * 진단 요청 커스텀 훅
 *
 * 폼 제출 → API 호출 → 결과 페이지 리다이렉트 처리
 */
export function useDiagnose() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submitDiagnosis(data: DiagnoseFormData): Promise<void> {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '진단 처리에 실패했습니다.')
      }

      router.push(`/result/${result.data.diagnosisId}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : '오류가 발생했습니다.'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return { submitDiagnosis, isLoading, error }
}
