/** Known male nurses who must not be placed on female-only wards. */
export const MALE_NURSE_EMPLOYEE_IDS = [
  '5690562',
  '5690573',
  '5690576',
  '0000001',
] as const

/** Full names for legacy profiles that may not yet have nurse_id linked. */
export const MALE_NURSE_FULL_NAMES = [
  'ณฐภัทร อินค้า',
  'ณัฐปคัลภ์ คงพิทักษ์',
  'ธิติวุฒิ พลเสนา',
  'ต้นตระกูล พึ่งแย้ม',
] as const

/**
 * Female-only / obstetric & newborn wards.
 * Male nurses on these wards create a patient-comfort policy breach.
 */
export const FEMALE_ONLY_DEPARTMENT_CODES = [
  'DR',
  'NICU',
  '18A',
  '18B',
  '19D',
  '22A',
  '22D',
] as const

export type MaleOnFemaleWardViolation = {
  assignmentId: string
  profileId: string
  employeeId: string | null
  fullName: string
  departmentCode: string
  departmentNameTh: string
}

type PolicyProfile = {
  id: string
  full_name: string
  nurse_id: string | null
}

type PolicyDepartment = {
  id: string
  code: string
  name_th: string
}

type PolicyAssignment = {
  id: string
  nurse_id: string
  department_id: string
}

const maleIdSet = new Set<string>(MALE_NURSE_EMPLOYEE_IDS)
const maleNameSet = new Set<string>(MALE_NURSE_FULL_NAMES)
const femaleOnlyCodeSet = new Set<string>(FEMALE_ONLY_DEPARTMENT_CODES)

/** Map known full names → employee IDs for display when profile lacks nurse_id. */
const NAME_TO_EMPLOYEE_ID: Record<string, string> = {
  'ณฐภัทร อินค้า': '5690562',
  'ณัฐปคัลภ์ คงพิทักษ์': '5690576',
  'ธิติวุฒิ พลเสนา': '5690573',
  'ต้นตระกูล พึ่งแย้ม': '0000001',
}

export function isFemaleOnlyDepartmentCode(code: string): boolean {
  return femaleOnlyCodeSet.has(code)
}

export function isMonitoredMaleNurse(profile: PolicyProfile): boolean {
  if (profile.nurse_id && maleIdSet.has(profile.nurse_id)) return true
  return maleNameSet.has(profile.full_name)
}

function resolveEmployeeId(profile: PolicyProfile): string | null {
  if (profile.nurse_id && maleIdSet.has(profile.nurse_id)) {
    return profile.nurse_id
  }
  return NAME_TO_EMPLOYEE_ID[profile.full_name] ?? profile.nurse_id
}

export function findMaleOnFemaleWardViolations(input: {
  profiles: PolicyProfile[]
  departments: PolicyDepartment[]
  assignments: PolicyAssignment[]
}): MaleOnFemaleWardViolation[] {
  const profileById = new Map(input.profiles.map((p) => [p.id, p]))
  const departmentById = new Map(input.departments.map((d) => [d.id, d]))

  const violations: MaleOnFemaleWardViolation[] = []

  for (const assignment of input.assignments) {
    const profile = profileById.get(assignment.nurse_id)
    const department = departmentById.get(assignment.department_id)
    if (!profile || !department) continue
    if (!isMonitoredMaleNurse(profile)) continue
    if (!isFemaleOnlyDepartmentCode(department.code)) continue

    violations.push({
      assignmentId: assignment.id,
      profileId: profile.id,
      employeeId: resolveEmployeeId(profile),
      fullName: profile.full_name,
      departmentCode: department.code,
      departmentNameTh: department.name_th,
    })
  }

  return violations
}
