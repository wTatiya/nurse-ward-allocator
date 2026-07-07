import { describe, expect, it } from 'vitest'
import { runAssignmentEngine } from '../../supabase/functions/_shared/assignment-engine'

const wards = [
  { id: 'icu', capacity: 2 },
  { id: 'er', capacity: 1 },
  { id: 'peds', capacity: 2 },
]

describe('runAssignmentEngine', () => {
  it('assigns all applicants when under capacity at tier 1', () => {
    const result = runAssignmentEngine(
      wards,
      [
        { nurseId: 'n1', choice1: 'icu', choice2: 'er', choice3: 'peds' },
        { nurseId: 'n2', choice1: 'icu', choice2: 'er', choice3: 'peds' },
      ],
      () => 0,
    )

    expect(result.assignments).toHaveLength(2)
    expect(result.assignments.every((a) => a.matchedTier === 1)).toBe(true)
    expect(result.waitlist).toHaveLength(0)
    expect(result.lotteryEvents).toHaveLength(0)
  })

  it('runs lottery when tier 1 is over capacity', () => {
    let call = 0
    const random = () => {
      call += 1
      return call === 1 ? 0.99 : 0.01
    }

    const result = runAssignmentEngine(
      [{ id: 'icu', capacity: 1 }],
      [
        { nurseId: 'n1', choice1: 'icu', choice2: 'er', choice3: 'peds' },
        { nurseId: 'n2', choice1: 'icu', choice2: 'er', choice3: 'peds' },
      ],
      random,
    )

    expect(result.assignments).toHaveLength(1)
    expect(result.lotteryEvents).toHaveLength(1)
    expect(result.lotteryEvents[0]?.slots).toBe(1)
    expect(result.lotteryEvents[0]?.applicantIds).toHaveLength(2)
  })

  it('cascades losers to tier 2 before tier 3', () => {
    const result = runAssignmentEngine(
      [
        { id: 'icu', capacity: 1 },
        { id: 'er', capacity: 1 },
      ],
      [
        { nurseId: 'n1', choice1: 'icu', choice2: 'er', choice3: 'peds' },
        { nurseId: 'n2', choice1: 'icu', choice2: 'er', choice3: 'peds' },
      ],
      () => 0.5,
    )

    expect(result.assignments).toHaveLength(2)
    const tiers = result.assignments.map((a) => a.matchedTier).sort()
    expect(tiers).toEqual([1, 2])
  })

  it('places unassigned nurses on waitlist in submission order', () => {
    const result = runAssignmentEngine(
      [{ id: 'icu', capacity: 0 }],
      [
        {
          nurseId: 'n2',
          choice1: 'icu',
          choice2: 'er',
          choice3: 'peds',
          submittedAt: '2026-01-02',
        },
        {
          nurseId: 'n1',
          choice1: 'icu',
          choice2: 'er',
          choice3: 'peds',
          submittedAt: '2026-01-01',
        },
      ],
      () => 0,
    )

    expect(result.assignments).toHaveLength(0)
    expect(result.waitlist).toEqual(['n1', 'n2'])
  })

  it('never assigns more nurses than ward capacity', () => {
    const result = runAssignmentEngine(
      [{ id: 'icu', capacity: 2 }],
      Array.from({ length: 10 }, (_, i) => ({
        nurseId: `n${i}`,
        choice1: 'icu',
        choice2: 'er',
        choice3: 'peds',
      })),
      () => Math.random(),
    )

    const icuCount = result.assignments.filter((a) => a.wardId === 'icu').length
    expect(icuCount).toBeLessThanOrEqual(2)
  })
})
