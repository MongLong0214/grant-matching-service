'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
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

  function validateField(fieldName: string) {
    setFormData(prev => {
      setErrors(prevErrors => {
        const newErrors = { ...prevErrors }
        switch (fieldName) {
          case 'businessType':
            if (!prev.businessType) newErrors.businessType = '업종을 선택해주세요.'
            else delete newErrors.businessType
            break
          case 'region':
            if (!prev.region) newErrors.region = '지역을 선택해주세요.'
            else delete newErrors.region
            break
          case 'employeeCount':
            if (!prev.employeeCount) newErrors.employeeCount = '직원 수를 선택해주세요.'
            else delete newErrors.employeeCount
            break
          case 'annualRevenue':
            if (!prev.annualRevenue) newErrors.annualRevenue = '연 매출을 선택해주세요.'
            else delete newErrors.annualRevenue
            break
          case 'businessStartDate':
            if (!prev.businessStartDate) {
              newErrors.businessStartDate = '창업일을 입력해주세요.'
            } else {
              const startDate = new Date(prev.businessStartDate)
              if (startDate > new Date()) {
                newErrors.businessStartDate = '창업일은 미래 날짜일 수 없습니다.'
              } else {
                delete newErrors.businessStartDate
              }
            }
            break
        }
        return newErrors
      })
      return prev
    })
  }

  function validate(): Record<string, string> {
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
    return newErrors
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      const firstErrorField = Object.keys(validationErrors)[0]
      const element = document.getElementById(firstErrorField)
      element?.focus()
      return
    }

    await onSubmit({
      businessType: formData.businessType,
      region: formData.region,
      employeeCount: Number(formData.employeeCount),
      annualRevenue: Number(formData.annualRevenue),
      businessStartDate: formData.businessStartDate,
      email: formData.email || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="businessType">업종</Label>
        <Select
          value={formData.businessType}
          onValueChange={(val) => setFormData(prev => ({ ...prev, businessType: val }))}
        >
          <SelectTrigger
            id="businessType"
            className="w-full"
            aria-invalid={!!errors.businessType}
            aria-describedby={errors.businessType ? 'businessType-error' : undefined}
            onBlur={() => validateField('businessType')}
          >
            <SelectValue placeholder="업종을 선택해주세요" />
          </SelectTrigger>
          <SelectContent>
            {BUSINESS_TYPES.map(type => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.businessType && (
          <p id="businessType-error" className="text-xs text-destructive" role="alert">
            {errors.businessType}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="region">지역</Label>
        <Select
          value={formData.region}
          onValueChange={(val) => setFormData(prev => ({ ...prev, region: val }))}
        >
          <SelectTrigger
            id="region"
            className="w-full"
            aria-invalid={!!errors.region}
            aria-describedby={errors.region ? 'region-error' : undefined}
            onBlur={() => validateField('region')}
          >
            <SelectValue placeholder="지역을 선택해주세요" />
          </SelectTrigger>
          <SelectContent>
            {REGIONS.map(region => (
              <SelectItem key={region} value={region}>{region}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.region && (
          <p id="region-error" className="text-xs text-destructive" role="alert">
            {errors.region}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>직원 수</Label>
        <RadioGroup
          value={formData.employeeCount}
          onValueChange={(val) => setFormData(prev => ({ ...prev, employeeCount: val }))}
          className="grid grid-cols-2 gap-3 sm:grid-cols-3"
        >
          {EMPLOYEE_OPTIONS.map(opt => (
            <label
              key={opt.value}
              className={cn(
                "flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2",
                formData.employeeCount === String(opt.value)
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-input"
              )}
            >
              <RadioGroupItem value={String(opt.value)} className="sr-only" />
              {opt.label}
            </label>
          ))}
        </RadioGroup>
        {errors.employeeCount && (
          <p className="text-xs text-destructive" role="alert">
            {errors.employeeCount}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>연 매출</Label>
        <RadioGroup
          value={formData.annualRevenue}
          onValueChange={(val) => setFormData(prev => ({ ...prev, annualRevenue: val }))}
          className="grid grid-cols-2 gap-3 sm:grid-cols-3"
        >
          {REVENUE_OPTIONS.map(opt => (
            <label
              key={opt.value}
              className={cn(
                "flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2",
                formData.annualRevenue === String(opt.value)
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-input"
              )}
            >
              <RadioGroupItem value={String(opt.value)} className="sr-only" />
              {opt.label}
            </label>
          ))}
        </RadioGroup>
        {errors.annualRevenue && (
          <p className="text-xs text-destructive" role="alert">
            {errors.annualRevenue}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="businessStartDate">창업일</Label>
        <Input
          id="businessStartDate"
          type="date"
          value={formData.businessStartDate}
          onChange={(e) => setFormData(prev => ({ ...prev, businessStartDate: e.target.value }))}
          onBlur={() => validateField('businessStartDate')}
          max={new Date().toISOString().split('T')[0]}
          aria-invalid={!!errors.businessStartDate}
          aria-describedby={errors.businessStartDate ? 'businessStartDate-error' : undefined}
        />
        {errors.businessStartDate && (
          <p id="businessStartDate-error" className="text-xs text-destructive" role="alert">
            {errors.businessStartDate}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">이메일 (선택)</Label>
        <Input
          id="email"
          type="email"
          placeholder="결과를 이메일로 받아보세요"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
        />
      </div>

      <Button type="submit" disabled={isLoading} className="w-full" size="lg">
        {isLoading && <Loader2 className="animate-spin" />}
        {isLoading ? '매칭 중...' : '내 지원금 찾기'}
      </Button>
    </form>
  )
}
