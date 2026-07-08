import { describe, expect, it } from 'vitest'
import {
  capacityWarningLabel,
  getCapacityStatus,
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
})
