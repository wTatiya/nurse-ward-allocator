import type { Preference } from '../types/database'
import { formatTier } from './locale/th'

export type PreferenceLike = {
  choice_1?: string
  choice_2?: string
  choice_3?: string
  choice1?: string
  choice2?: string
  choice3?: string
}

function choiceAt(
  preference: PreferenceLike,
  tier: 1 | 2 | 3,
): string | undefined {
  if (tier === 1) return preference.choice_1 ?? preference.choice1
  if (tier === 2) return preference.choice_2 ?? preference.choice2
  return preference.choice_3 ?? preference.choice3
}

export function getMatchedTierForDepartment(
  preference: PreferenceLike,
  departmentId: string,
): 1 | 2 | 3 | null {
  if (choiceAt(preference, 1) === departmentId) return 1
  if (choiceAt(preference, 2) === departmentId) return 2
  if (choiceAt(preference, 3) === departmentId) return 3
  return null
}

export function buildPreferenceByNurseIdMap(
  preferences: Preference[],
): Map<string, Preference> {
  return new Map(preferences.map((preference) => [preference.nurse_id, preference]))
}

export function buildChoiceRankByNurseIdMap(
  preferences: Preference[],
  departmentId: string,
): Map<string, 1 | 2 | 3> {
  const ranks = new Map<string, 1 | 2 | 3>()
  for (const preference of preferences) {
    const rank = getMatchedTierForDepartment(preference, departmentId)
    if (rank) ranks.set(preference.nurse_id, rank)
  }
  return ranks
}

export function buildChoiceRankByNurseIdFromTier(
  applicantIds: string[],
  tier: 1 | 2 | 3,
): Map<string, 1 | 2 | 3> {
  return new Map(applicantIds.map((id) => [id, tier]))
}

export function getChoiceRankForDepartment(
  nurseId: string,
  departmentId: string,
  preferenceByNurseId: Map<string, Preference>,
): 1 | 2 | 3 | null {
  const preference = preferenceByNurseId.get(nurseId)
  if (!preference) return null
  return getMatchedTierForDepartment(preference, departmentId)
}

export function formatParticipantWithChoiceRank(
  nurseId: string,
  names: Record<string, string>,
  choiceRank: 1 | 2 | 3 | null | undefined,
  currentUserId?: string,
): string {
  const name = names[nurseId] ?? nurseId
  const youSuffix = nurseId === currentUserId ? ' (คุณ)' : ''
  const rankSuffix =
    choiceRank != null ? ` — ${formatTier(choiceRank)}` : ''
  return `${name}${youSuffix}${rankSuffix}`
}
