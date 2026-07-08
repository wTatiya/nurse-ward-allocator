import { describe, expect, it } from 'vitest'
import { visibleWaitlistEntries } from './waitlistDisplay'
import type { Assignment, WaitlistEntry } from '../types/database'

describe('visibleWaitlistEntries', () => {
  it('drops waitlist rows when nurse already has an assignment', () => {
    const waitlist: WaitlistEntry[] = [
      {
        id: 'w1',
        round_id: 'r1',
        nurse_id: 'n1',
        position: 1,
        created_at: '2026-07-08T00:00:00Z',
      },
      {
        id: 'w2',
        round_id: 'r1',
        nurse_id: 'n2',
        position: 2,
        created_at: '2026-07-08T00:00:00Z',
      },
    ]
    const assignments: Assignment[] = [
      {
        id: 'a1',
        round_id: 'r1',
        nurse_id: 'n1',
        department_id: 'd1',
        matched_tier: 3,
        assigned_at: '2026-07-08T00:00:00Z',
      },
    ]

    expect(visibleWaitlistEntries(waitlist, assignments)).toEqual([waitlist[1]])
  })
})
