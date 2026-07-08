export type CapacityStatus = 'exact' | 'vacancy' | 'overflow'

export function getCapacityStatus(
  assigned: number,
  capacity: number,
): CapacityStatus {
  if (assigned > capacity) return 'overflow'
  if (assigned < capacity) return 'vacancy'
  return 'exact'
}

export function capacityWarningLabel(
  assigned: number,
  capacity: number,
): string | null {
  const status = getCapacityStatus(assigned, capacity)
  if (status === 'vacancy') {
    return `ว่าง ${capacity - assigned} ตำแหน่ง`
  }
  if (status === 'overflow') {
    return `เกิน ${assigned - capacity} ตำแหน่ง`
  }
  return null
}

export function projectedCapacityStatus(
  departmentId: string,
  assignments: { department_id: string }[],
  departments: { id: string; capacity: number }[],
  extra = 0,
): CapacityStatus {
  const department = departments.find((item) => item.id === departmentId)
  if (!department) return 'vacancy'
  const assigned =
    assignments.filter((item) => item.department_id === departmentId).length +
    extra
  return getCapacityStatus(assigned, department.capacity)
}

/** Count in a ward after placing this waitlisted nurse (includes them once). */
export function countAfterWaitlistAssign(
  departmentId: string,
  nurseId: string,
  assignments: { department_id: string; nurse_id: string }[],
): number {
  const othersInWard = assignments.filter(
    (item) => item.department_id === departmentId && item.nurse_id !== nurseId,
  ).length
  return othersInWard + 1
}

/** Badge text for waitlist row — makes clear the count includes this nurse. */
export function waitlistProjectionBadgeLabel(
  assignedAfter: number,
  capacity: number,
): string {
  const warning = capacityWarningLabel(assignedAfter, capacity)
  return warning ? `รวมคนนี้ — ${warning}` : 'รวมคนนี้ — ครบพอดี'
}
