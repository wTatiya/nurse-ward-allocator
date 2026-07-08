import { describe, expect, it } from 'vitest'
import {
  capacityWarningLabel,
  countAfterWaitlistAssign,
  getCapacityStatus,
  waitlistProjectionBadgeLabel,
} from './assignmentCapacity'

describe('assignmentCapacity', () => {
  it('detects vacancy overflow and exact fill', () => {
    expect(getCapacityStatus(2, 4)).toBe('vacancy')
    expect(getCapacityStatus(4, 4)).toBe('exact')
    expect(getCapacityStatus(5, 4)).toBe('overflow')
  })

  it('builds Thai warning labels', () => {
    expect(capacityWarningLabel(2, 4)).toBe('ว่าง 2 ตำแหน่ง')
    expect(capacityWarningLabel(4, 4)).toBeNull()
    expect(capacityWarningLabel(5, 4)).toBe('เกิน 1 ตำแหน่ง')
  })

  it('counts waitlist nurse once when projecting ward fill', () => {
    const assignments = [
      { department_id: 'd1', nurse_id: 'n1' },
      { department_id: 'd1', nurse_id: 'n2' },
      { department_id: 'd2', nurse_id: 'n3' },
    ]
    expect(countAfterWaitlistAssign('d1', 'n4', assignments)).toBe(3)
    expect(countAfterWaitlistAssign('d1', 'n1', assignments)).toBe(2)
  })

  it('labels waitlist projection including this nurse', () => {
    expect(waitlistProjectionBadgeLabel(4, 4)).toBe('รวมคนนี้ — ครบพอดี')
    expect(waitlistProjectionBadgeLabel(5, 4)).toBe('รวมคนนี้ — เกิน 1 ตำแหน่ง')
  })
})
