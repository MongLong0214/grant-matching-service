'use client'

import { useState } from 'react'
import { UserTypeSelector } from '@/components/user-type-selector'
import { PersonalForm } from '@/components/personal-form'
import { BusinessForm } from '@/components/business-form'
import type { UserType, UserInput } from '@/types'

interface DiagnoseFormProps {
  onSubmit: (data: UserInput) => Promise<void>
  isLoading: boolean
  initialUserType?: UserType
}

/**
 * 듀얼 트랙 진단 폼
 *
 * 개인: 7개 필드 (연령대/성별/지역/가구유형/소득수준/취업상태/관심분야)
 * 사업자: 6개 필드 (업종/지역/직원수/매출/업력/대표자연령)
 */
export default function DiagnoseForm({ onSubmit, isLoading, initialUserType }: DiagnoseFormProps) {
  const [userType, setUserType] = useState<UserType | null>(initialUserType ?? null)

  if (!userType) {
    return <UserTypeSelector onSelect={setUserType} />
  }

  if (userType === 'personal') {
    return (
      <PersonalForm
        onSubmit={onSubmit}
        isLoading={isLoading}
        onBack={() => setUserType(null)}
      />
    )
  }

  return (
    <BusinessForm
      onSubmit={onSubmit}
      isLoading={isLoading}
      onBack={initialUserType ? undefined : () => setUserType(null)}
    />
  )
}
