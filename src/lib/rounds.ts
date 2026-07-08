import type { AssignmentRound } from '../types/database'

export function isRoundArchived(
  round: Pick<AssignmentRound, 'archived_at'>,
): boolean {
  return round.archived_at != null
}

export function canArchiveRound(round: AssignmentRound): boolean {
  return round.status === 'completed' && !isRoundArchived(round)
}

export function splitRoundsByArchive(rounds: AssignmentRound[]): {
  active: AssignmentRound[]
  archived: AssignmentRound[]
} {
  const active: AssignmentRound[] = []
  const archived: AssignmentRound[] = []

  for (const round of rounds) {
    if (isRoundArchived(round)) {
      archived.push(round)
    } else {
      active.push(round)
    }
  }

  return { active, archived }
}
