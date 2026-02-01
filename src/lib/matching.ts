import { DiagnoseFormData, Support } from "@/types"

export function matchSupports(supports: Support[], input: DiagnoseFormData): Support[] {
  const businessAgeMonths = calculateBusinessAge(input.businessStartDate)

  return supports.filter((support) => {
    if (support.targetRegions && support.targetRegions.length > 0) {
      if (!support.targetRegions.includes(input.region)) return false
    }

    if (support.targetBusinessTypes && support.targetBusinessTypes.length > 0) {
      if (!support.targetBusinessTypes.includes(input.businessType)) return false
    }

    if (support.targetEmployeeMax !== null && support.targetEmployeeMax !== undefined) {
      if (input.employeeCount > support.targetEmployeeMax) return false
    }

    if (support.targetEmployeeMin !== null && support.targetEmployeeMin !== undefined) {
      if (input.employeeCount < support.targetEmployeeMin) return false
    }

    if (support.targetRevenueMax !== null && support.targetRevenueMax !== undefined) {
      if (input.annualRevenue > support.targetRevenueMax) return false
    }

    if (support.targetRevenueMin !== null && support.targetRevenueMin !== undefined) {
      if (input.annualRevenue < support.targetRevenueMin) return false
    }

    if (support.targetBusinessAgeMin !== null && support.targetBusinessAgeMin !== undefined) {
      if (businessAgeMonths < support.targetBusinessAgeMin) return false
    }

    if (support.targetBusinessAgeMax !== null && support.targetBusinessAgeMax !== undefined) {
      if (businessAgeMonths > support.targetBusinessAgeMax) return false
    }

    return true
  })
}

function calculateBusinessAge(startDateString: string): number {
  const startDate = new Date(startDateString)
  const now = new Date()

  const months =
    (now.getFullYear() - startDate.getFullYear()) * 12 +
    (now.getMonth() - startDate.getMonth())

  return Math.max(0, months)
}
