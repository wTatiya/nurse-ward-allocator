export interface WardInput {
  id: string
  capacity: number
}

export interface PreferenceInput {
  nurseId: string
  choice1: string
  choice2: string
  choice3: string
  submittedAt?: string
}

export interface LotteryEvent {
  wardId: string
  tier: 1 | 2 | 3
  applicantIds: string[]
  winnerIds: string[]
  slots: number
}

export interface AssignmentOutput {
  nurseId: string
  wardId: string
  matchedTier: 1 | 2 | 3
}

export interface AssignmentEngineResult {
  assignments: AssignmentOutput[]
  waitlist: string[]
  lotteryEvents: LotteryEvent[]
}

export type RandomFn = () => number

function fisherYatesShuffle<T>(items: T[], random: RandomFn): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function getChoiceAtTier(preference: PreferenceInput, tier: 1 | 2 | 3): string {
  if (tier === 1) return preference.choice1
  if (tier === 2) return preference.choice2
  return preference.choice3
}

function countAssignmentsForWard(
  assignments: AssignmentOutput[],
  wardId: string,
): number {
  return assignments.filter((a) => a.wardId === wardId).length
}

function selectWinners(
  applicantIds: string[],
  slots: number,
  random: RandomFn,
): { winners: string[]; losers: string[] } {
  if (applicantIds.length <= slots) {
    return { winners: applicantIds, losers: [] }
  }
  const shuffled = fisherYatesShuffle(applicantIds, random)
  return {
    winners: shuffled.slice(0, slots),
    losers: shuffled.slice(slots),
  }
}

export function runAssignmentEngine(
  wards: WardInput[],
  preferences: PreferenceInput[],
  random: RandomFn = Math.random,
): AssignmentEngineResult {
  const assignments: AssignmentOutput[] = []
  const lotteryEvents: LotteryEvent[] = []
  const assigned = new Set<string>()

  for (const tier of [1, 2, 3] as const) {
    for (const ward of wards) {
      const remainingSlots =
        ward.capacity - countAssignmentsForWard(assignments, ward.id)
      if (remainingSlots <= 0) continue

      const applicants = preferences
        .filter((p) => !assigned.has(p.nurseId))
        .filter((p) => getChoiceAtTier(p, tier) === ward.id)
        .map((p) => p.nurseId)

      if (applicants.length === 0) continue

      const { winners, losers } = selectWinners(
        applicants,
        remainingSlots,
        random,
      )

      if (losers.length > 0) {
        lotteryEvents.push({
          wardId: ward.id,
          tier,
          applicantIds: applicants,
          winnerIds: winners,
          slots: remainingSlots,
        })
      }

      for (const nurseId of winners) {
        assignments.push({ nurseId, wardId: ward.id, matchedTier: tier })
        assigned.add(nurseId)
      }
    }
  }

  const waitlist = preferences
    .filter((p) => !assigned.has(p.nurseId))
    .sort((a, b) => a.nurseId.localeCompare(b.nurseId))
    .map((p) => p.nurseId)

  return { assignments, waitlist, lotteryEvents }
}
