import { describe, expect, it } from 'vitest'
import {
  runAssignmentEngine,
  type AssignmentEngineResult,
  type PreferenceInput,
} from '../../supabase/functions/_shared/assignment-engine'

const wards = [
  { id: 'icu', capacity: 2 },
  { id: 'er', capacity: 1 },
  { id: 'peds', capacity: 2 },
]

function getChoiceAtTier(preference: PreferenceInput, tier: 1 | 2 | 3): string {
  if (tier === 1) return preference.choice1
  if (tier === 2) return preference.choice2
  return preference.choice3
}

function assertLotteryTierInvariant(
  preferences: PreferenceInput[],
  result: AssignmentEngineResult,
): void {
  const preferenceByNurseId = new Map(
    preferences.map((preference) => [preference.nurseId, preference]),
  )

  for (const event of result.lotteryEvents) {
    expect(event.winnerIds.every((id) => event.applicantIds.includes(id))).toBe(
      true,
    )

    for (const applicantId of event.applicantIds) {
      const preference = preferenceByNurseId.get(applicantId)
      expect(preference).toBeDefined()
      expect(getChoiceAtTier(preference!, event.tier)).toBe(event.wardId)
    }
  }
}

function assertNoNurseInWardLotteryAtTier(
  result: AssignmentEngineResult,
  wardId: string,
  tier: 1 | 2 | 3,
  nurseId: string,
): void {
  for (const event of result.lotteryEvents) {
    if (event.wardId === wardId && event.tier === tier) {
      expect(event.applicantIds).not.toContain(nurseId)
    }
  }
}

const ward18d = '18D'
const ward18c = '18C'
const ward19d = '19D'
const ward19b = '19B'
const ward20b = '20B'
const ward21d = '21D'
const ward22b = '22B'
const ward22c = '22C'
const ward22d = '22D'
const wardSw = 'SW'

const seed18dPreferences: PreferenceInput[] = [
  { nurseId: 'a1', choice1: ward18d, choice2: ward18c, choice3: ward22d },
  { nurseId: 'a2', choice1: ward18d, choice2: ward22b, choice3: ward22c },
  { nurseId: 'a3', choice1: ward18d, choice2: ward21d, choice3: ward18c },
  { nurseId: 'b1', choice1: ward18c, choice2: ward18d, choice3: ward19b },
  { nurseId: 'b2', choice1: ward19b, choice2: ward18d, choice3: wardSw },
  { nurseId: 'c1', choice1: ward18c, choice2: ward19d, choice3: ward18d },
  { nurseId: 'c2', choice1: ward20b, choice2: ward22b, choice3: ward18d },
]

const seed18dWards = [
  { id: ward18d, capacity: 3 },
  { id: ward18c, capacity: 1 },
  { id: ward19b, capacity: 4 },
  { id: ward19d, capacity: 4 },
  { id: ward20b, capacity: 4 },
  { id: ward21d, capacity: 4 },
  { id: ward22b, capacity: 4 },
  { id: ward22c, capacity: 4 },
  { id: ward22d, capacity: 4 },
  { id: wardSw, capacity: 2 },
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

  it('places unassigned nurses on waitlist without submission-time priority', () => {
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

  it('excludes choice2-only nurses from tier1 pool when capacity sufficient for choice1 applicant', () => {
    const preferences = [
      { nurseId: 'n1', choice1: 'icu', choice2: 'er', choice3: 'peds' },
      { nurseId: 'n2', choice1: 'er', choice2: 'icu', choice3: 'peds' },
    ]

    const result = runAssignmentEngine(
      [
        { id: 'icu', capacity: 1 },
        { id: 'er', capacity: 1 },
      ],
      preferences,
      () => 0,
    )

    expect(result.lotteryEvents).toHaveLength(0)
    expect(result.assignments.find((a) => a.nurseId === 'n1')).toEqual(
      expect.objectContaining({ wardId: 'icu', matchedTier: 1 }),
    )
    expect(result.assignments.find((a) => a.nurseId === 'n2')).toEqual(
      expect.objectContaining({ wardId: 'er', matchedTier: 1 }),
    )
    assertNoNurseInWardLotteryAtTier(result, 'icu', 1, 'n2')
    assertLotteryTierInvariant(preferences, result)
  })

  it('tier1 lottery applicantIds contain only nurses with ward as choice1', () => {
    const preferences = [
      { nurseId: 'n1', choice1: 'icu', choice2: 'er', choice3: 'peds' },
      { nurseId: 'n2', choice1: 'icu', choice2: 'er', choice3: 'peds' },
      { nurseId: 'n3', choice1: 'er', choice2: 'icu', choice3: 'peds' },
    ]

    const result = runAssignmentEngine(
      [
        { id: 'icu', capacity: 1 },
        { id: 'er', capacity: 1 },
      ],
      preferences,
      () => 0.5,
    )

    expect(result.lotteryEvents).toHaveLength(1)
    const icuEvent = result.lotteryEvents.find(
      (event) => event.wardId === 'icu' && event.tier === 1,
    )
    expect(icuEvent?.applicantIds.sort()).toEqual(['n1', 'n2'])
    expect(icuEvent?.applicantIds).not.toContain('n3')
    expect(result.assignments.find((a) => a.nurseId === 'n3')).toEqual(
      expect.objectContaining({ wardId: 'er', matchedTier: 1 }),
    )
    assertLotteryTierInvariant(preferences, result)
  })

  it('assigns choice2 and choice3 at correct tiers when capacity allows', () => {
    const preferences = [
      { nurseId: 'n1', choice1: 'icu', choice2: 'er', choice3: 'peds' },
      { nurseId: 'n2', choice1: 'er', choice2: 'icu', choice3: 'peds' },
      { nurseId: 'n3', choice1: 'er', choice2: 'peds', choice3: 'icu' },
    ]

    const result = runAssignmentEngine(
      [{ id: 'icu', capacity: 3 }],
      preferences,
      () => 0,
    )

    expect(result.lotteryEvents).toHaveLength(0)
    expect(result.assignments.find((a) => a.nurseId === 'n1')?.matchedTier).toBe(1)
    expect(result.assignments.find((a) => a.nurseId === 'n2')?.matchedTier).toBe(2)
    expect(result.assignments.find((a) => a.nurseId === 'n3')?.matchedTier).toBe(3)
    assertLotteryTierInvariant(preferences, result)
  })

  it('never mixes tiers in a single lottery event when capacity is scarce', () => {
    const preferences = [
      { nurseId: 'n1', choice1: 'icu', choice2: 'er', choice3: 'peds' },
      { nurseId: 'n2', choice1: 'er', choice2: 'icu', choice3: 'peds' },
      { nurseId: 'n3', choice1: 'er', choice2: 'peds', choice3: 'icu' },
    ]

    const result = runAssignmentEngine(
      [
        { id: 'icu', capacity: 1 },
        { id: 'er', capacity: 1 },
        { id: 'peds', capacity: 1 },
      ],
      preferences,
      () => 0,
    )

    const icuTier1 = result.lotteryEvents.find(
      (event) => event.wardId === 'icu' && event.tier === 1,
    )
    expect(icuTier1).toBeUndefined()
    expect(result.assignments.find((a) => a.nurseId === 'n1')).toEqual(
      expect.objectContaining({ wardId: 'icu', matchedTier: 1 }),
    )
    assertNoNurseInWardLotteryAtTier(result, 'icu', 1, 'n2')
    assertNoNurseInWardLotteryAtTier(result, 'icu', 1, 'n3')
    assertLotteryTierInvariant(preferences, result)
  })

  it.each([1, 2, 3])(
    '18D seed shape: choice2 and choice3 nurses never in tier1 applicantIds (capacity=%i)',
    (capacity) => {
      const wardsForCapacity = seed18dWards.map((ward) =>
        ward.id === ward18d ? { ...ward, capacity } : ward,
      )

      const result = runAssignmentEngine(
        wardsForCapacity,
        seed18dPreferences,
        () => 0.5,
      )

      const tier1Events = result.lotteryEvents.filter(
        (event) => event.wardId === ward18d && event.tier === 1,
      )

      for (const event of tier1Events) {
        expect(event.applicantIds.sort()).toEqual(['a1', 'a2', 'a3'])
        for (const nurseId of ['b1', 'b2', 'c1', 'c2']) {
          expect(event.applicantIds).not.toContain(nurseId)
        }
      }

      const tier1Assignments = result.assignments.filter(
        (assignment) => assignment.wardId === ward18d && assignment.matchedTier === 1,
      )
      expect(tier1Assignments).toHaveLength(Math.min(capacity, 3))

      if (capacity === 3) {
        expect(tier1Events).toHaveLength(0)
      } else {
        expect(tier1Events).toHaveLength(1)
        expect(tier1Events[0]?.applicantIds).toHaveLength(3)
        expect(tier1Events[0]?.slots).toBe(capacity)
      }

      for (const nurseId of ['b1', 'b2']) {
        assertNoNurseInWardLotteryAtTier(result, ward18d, 1, nurseId)
      }

      assertLotteryTierInvariant(seed18dPreferences, result)
    },
  )
})
