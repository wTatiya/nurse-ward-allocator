import { describe, expect, it } from 'vitest'
import { getMatchedTierForDepartment } from './preferenceTier'

describe('manualAssignment tier resolution', () => {
  it('assignFromWaitlist should use choice rank instead of hardcoded tier 3', () => {
    const preference = {
      choice_1: 'dept-a',
      choice_2: 'dept-b',
      choice_3: 'dept-c',
    }

    expect(getMatchedTierForDepartment(preference, 'dept-b')).toBe(2)
    expect(getMatchedTierForDepartment(preference, 'dept-a')).toBe(1)
  })

  it('reassignParticipant should recompute matched_tier for new department', () => {
    const preference = {
      choice_1: 'icu',
      choice_2: '18D',
      choice_3: 'peds',
    }

    expect(getMatchedTierForDepartment(preference, '18D')).toBe(2)
    expect(getMatchedTierForDepartment(preference, 'peds')).toBe(3)
  })

  it('rejects departments outside nurse preferences', () => {
    const preference = {
      choice_1: 'icu',
      choice_2: 'er',
      choice_3: 'peds',
    }

    expect(getMatchedTierForDepartment(preference, '18D')).toBeNull()
  })
})
