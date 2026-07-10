import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { performance } from 'node:perf_hooks'
import {
  runAssignmentEngine,
  type AssignmentEngineResult,
  type PreferenceInput,
} from '../../supabase/functions/_shared/assignment-engine'

const ward18d = '18D'

function getChoiceAtTier(preference: PreferenceInput, tier: 1 | 2 | 3): string {
  if (tier === 1) return preference.choice1
  if (tier === 2) return preference.choice2
  return preference.choice3
}

function assertGlobalLotteryInvariant(
  preferences: PreferenceInput[],
  result: AssignmentEngineResult,
): void {
  const preferenceByNurseId = new Map(
    preferences.map((preference) => [preference.nurseId, preference]),
  )

  for (const event of result.lotteryEvents) {
    expect(event.winnerIds.every((id) => event.applicantIds.includes(id))).toBe(true)
    for (const applicantId of event.applicantIds) {
      const preference = preferenceByNurseId.get(applicantId)
      expect(preference).toBeDefined()
      expect(getChoiceAtTier(preference!, event.tier)).toBe(event.wardId)
    }
  }
}

function loadSeedPreferences(): PreferenceInput[] {
  const __dirname = dirname(fileURLToPath(import.meta.url))
  const seedPath = join(__dirname, '..', '..', 'scripts', 'data', 'round-1-preferences.json')
  const seed = JSON.parse(readFileSync(seedPath, 'utf8'))

  const codeToId = new Map<string, string>()
  for (const code of seed.activeDepartmentCodes ?? []) {
    codeToId.set(code, code)
  }

  return seed.preferences.map((entry: { name: string; choices: string[] }, index: number) => {
    const [c1, c2, c3] = entry.choices
    return {
      nurseId: `seed-${index}`,
      choice1: codeToId.get(c1) ?? c1,
      choice2: codeToId.get(c2) ?? c2,
      choice3: codeToId.get(c3) ?? c3,
    }
  })
}

function loadSeedWards(capacity18d: number) {
  const __dirname = dirname(fileURLToPath(import.meta.url))
  const seedPath = join(__dirname, '..', '..', 'scripts', 'data', 'round-1-preferences.json')
  const seed = JSON.parse(readFileSync(seedPath, 'utf8'))
  const capacities = seed.departmentCapacities ?? {}

  return (seed.activeDepartmentCodes as string[]).map((code) => ({
    id: code,
    capacity: code === ward18d ? capacity18d : (capacities[code] ?? 4),
  }))
}

describe('replayAssignmentRound', () => {
  it('replays round-1 seed and enforces tier-1 pool integrity for 18D', () => {
    const preferences = loadSeedPreferences()
    const wards = loadSeedWards(3)
    const started = performance.now()

    const result = runAssignmentEngine(wards, preferences, () => 0.5)

    const elapsedMs = performance.now() - started
    expect(elapsedMs).toBeLessThan(500)

    const tier1For18d = result.lotteryEvents.filter(
      (event) => event.wardId === ward18d && event.tier === 1,
    )
    expect(tier1For18d).toHaveLength(0)

    const tier1Assignments = result.assignments.filter(
      (assignment) => assignment.wardId === ward18d && assignment.matchedTier === 1,
    )
    expect(tier1Assignments).toHaveLength(3)

    assertGlobalLotteryInvariant(preferences, result)
  })

  it('replays round-1 seed with 18D capacity 1 and expects tier-1 lottery', () => {
    const preferences = loadSeedPreferences()
    const wards = loadSeedWards(1)

    const result = runAssignmentEngine(wards, preferences, () => 0)

    const tier1For18d = result.lotteryEvents.find(
      (event) => event.wardId === ward18d && event.tier === 1,
    )
    expect(tier1For18d).toBeDefined()
    expect(tier1For18d?.applicantIds).toHaveLength(3)
    expect(tier1For18d?.slots).toBe(1)

    for (const event of result.lotteryEvents) {
      if (event.wardId === ward18d && event.tier === 1) {
        for (const applicantId of event.applicantIds) {
          const preference = preferences.find((item) => item.nurseId === applicantId)
          expect(preference?.choice1).toBe(ward18d)
        }
      }
    }

    assertGlobalLotteryInvariant(preferences, result)
  })
})
