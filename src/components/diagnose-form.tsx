'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { RadioGroup } from '@/components/ui/radio-group'
import { BUSINESS_TYPES, REGIONS, EMPLOYEE_OPTIONS, REVENUE_OPTIONS } from '@/constants'
import type { DiagnoseFormData } from '@/types'

interface DiagnoseFormProps {
  onSubmit: (data: DiagnoseFormData) => Promise<void>
  isLoading: boolean
}

/**
 * 사업 진단 폼 컴포넌트
 *
 * 사업 정보 5개 필수 입력 + 이메일(선택)
 * 30초 내 입력 완료를 목표로 모든 필드가 선택형
 */
export default function DiagnoseForm({ onSubmit, isLoading }: DiagnoseFormProps) {
  const [formData, setFormData] = useState({
    businessType: '',
    region: '',
    employeeCount: '',
    annualRevenue: '',
    businessStartDate: '',
    email: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate(): boolean {
    const newErrors: Record<string, string> = {}

    if (!formData.businessType) newErrors.businessType = '업종을 선택해주세요.'
    if (!formData.region) newErrors.region = '지역을 선택해주세요.'
    if (!formData.employeeCount) newErrors.employeeCount = '직원 수를 선택해주세요.'
    if (!formData.annualRevenue) newErrors.annualRevenue = '연 매출을 선택해주세요.'
    if (!formData.businessStartDate) {
      newErrors.businessStartDate = '창업일을 입력해주세요.'
    } else {
      const startDate = new Date(formData.businessStartDate)
      if (startDate > new Date()) {
        newErrors.businessStartDate = '창업일은 미래 날짜일 수 없습니다.'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    await onSubmit({
      businessType: formData.businessType,
      region: formData.region,
      employeeCount: Number(formData.employeeCount),
      annualRevenue: Number(formData.annualRevenue),
      businessStartDate: formData.businessStartDate,
      email: formData.email || undefined,
    })
  }

  // BUSINESS_TYPES options for Select
  const businessTypeOptions = BUSINESS_TYPES.map((type) => ({
    label: type,
    value: type,
  }))

  // REGIONS options for Select
  const regionOptions = REGIONS.map((region) => ({
    label: region,
    value: region,
  }))

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Select
        id="businessType"
        label="업종"
        placeholder="업종을 선택해주세요"
        options={businessTypeOptions}
        value={formData.businessType}
        onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
        error={errors.businessType}
      />

      <Select
        id="region"
        label="지역"
        placeholder="지역을 선택해주세요"
        options={regionOptions}
        value={formData.region}
        onChange={(e) => setFormData({ ...formData, region: e.target.value })}
        error={errors.region}
      />

      <RadioGroup
        label="직원 수"
        name="employeeCount"
        options={EMPLOYEE_OPTIONS.map((opt) => ({ label: opt.label, value: opt.value }))}
        value={formData.employeeCount}
        onChange={(value) => setFormData({ ...formData, employeeCount: value })}
        error={errors.employeeCount}
      />

      <RadioGroup
        label="연 매출"
        name="annualRevenue"
        options={REVENUE_OPTIONS.map((opt) => ({ label: opt.label, value: opt.value }))}
        value={formData.annualRevenue}
        onChange={(value) => setFormData({ ...formData, annualRevenue: value })}
        error={errors.annualRevenue}
      />

      <Input
        id="businessStartDate"
        type="date"
        label="창업일"
        value={formData.businessStartDate}
        onChange={(e) => setFormData({ ...formData, businessStartDate: e.target.value })}
        max={new Date().toISOString().split('T')[0]}
        error={errors.businessStartDate}
      />

      <Input
        id="email"
        type="email"
        label="이메일 (선택)"
        placeholder="결과를 이메일로 받아보세요"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
      />

      <Button type="submit" size="lg" isLoading={isLoading} className="w-full">
        내 지원금 찾기
      </Button>
    </form>
  )
}
