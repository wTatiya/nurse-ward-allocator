import { describe, expect, it } from 'vitest'
import { buildPersonalOutcome } from './personalOutcome'

const departments = [
  {
    id: 'dept-a',
    code: '18A',
    name_th: 'Dept A',
    capacity: 2,
    is_active: true,
    created_at: '',
  },
  {
    id: 'dept-b',
    code: '18B',
    name_th: 'Dept B',
    capacity: 1,
    is_active: true,
    created_at: '',
  },
  {
    id: 'dept-c',
    code: '18C',
    name_th: 'Dept C',
    capacity: 1,
    is_active: true,
    created_at: '',
  },
]

const preference = {
  id: 'pref-1',
  round_id: 'round-1',
  nurse_id: 'nurse-1',
  choice_1: 'dept-a',
  choice_2: 'dept-b',
  choice_3: 'dept-c',
  submitted_at: '2026-07-07T10:00:00Z',
}

describe('buildPersonalOutcome', () => {
  it('explains a direct assignment without lottery', () => {
    const outcome = buildPersonalOutcome({
      userId: 'nurse-1',
      preference,
      assignment: {
        id: 'a-1',
        round_id: 'round-1',
        nurse_id: 'nurse-1',
        department_id: 'dept-a',
        matched_tier: 1,
        assigned_at: '2026-07-07T11:00:00Z',
      },
      lotteryEvents: [],
      departments,
      roundStatus: 'completed',
    })

    expect(outcome.status).toBe('assigned')
    expect(outcome.steps).toHaveLength(1)
    expect(outcome.steps[0]?.result).toBe('assigned_direct')
    expect(outcome.steps[0]?.lottery).toBeUndefined()
  })

  it('explains a lost lottery and waitlist placement', () => {
    const outcome = buildPersonalOutcome({
      userId: 'nurse-1',
      preference,
      waitlistEntry: {
        id: 'w-1',
        round_id: 'round-1',
        nurse_id: 'nurse-1',
        position: 2,
        created_at: '2026-07-07T11:00:00Z',
      },
      lotteryEvents: [
        {
          id: 'lot-1',
          round_id: 'round-1',
          department_id: 'dept-a',
          tier: 1,
          applicant_ids: ['nurse-1', 'nurse-2', 'nurse-3'],
          winner_ids: ['nurse-2'],
          slots: 1,
          seed_hash: 'abc123',
          created_at: '2026-07-07T11:00:00Z',
        },
      ],
      departments,
      roundStatus: 'completed',
    })

    expect(outcome.status).toBe('waitlisted')
    expect(outcome.waitlistPosition).toBe(2)
    expect(outcome.steps[0]?.result).toBe('lost_lottery')
    expect(outcome.steps[0]?.lottery?.applicants).toBe(3)
  })

  it('department_full omits lottery metadata when user was not in the pool', () => {
    const choice2Preference = {
      ...preference,
      choice_1: 'dept-c',
      choice_2: 'dept-a',
      choice_3: 'dept-b',
    }

    const outcome = buildPersonalOutcome({
      userId: 'nurse-1',
      preference: choice2Preference,
      assignment: {
        id: 'a-1',
        round_id: 'round-1',
        nurse_id: 'nurse-1',
        department_id: 'dept-a',
        matched_tier: 2,
        assigned_at: '2026-07-07T11:00:00Z',
      },
      lotteryEvents: [
        {
          id: 'lot-1',
          round_id: 'round-1',
          department_id: 'dept-a',
          tier: 1,
          applicant_ids: ['nurse-2', 'nurse-3'],
          winner_ids: ['nurse-2'],
          slots: 1,
          seed_hash: 'abc123',
          created_at: '2026-07-07T11:00:00Z',
        },
      ],
      departments,
      roundStatus: 'completed',
    })

    const tier1Step = outcome.steps.find((step) => step.tier === 1)
    expect(tier1Step?.result).toBe('department_full')
    expect(tier1Step?.lottery).toBeUndefined()
  })
})
