import type { Assignment, WaitlistEntry } from '../types/database'

/** Hide waitlist rows when the nurse already has an assignment (stale or partial save). */
export function visibleWaitlistEntries(
  waitlist: WaitlistEntry[],
  assignments: Assignment[],
): WaitlistEntry[] {
  const assignedNurseIds = new Set(assignments.map((item) => item.nurse_id))
  return waitlist.filter((entry) => !assignedNurseIds.has(entry.nurse_id))
}
