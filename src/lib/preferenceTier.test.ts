import { describe, expect, it } from 'vitest'
import {
  buildChoiceRankByNurseIdFromTier,
  buildChoiceRankByNurseIdMap,
  buildPreferenceByNurseIdMap,
  formatParticipantWithChoiceRank,
  getChoiceRankForDepartment,
  getMatchedTierForDepartment,
} from './preferenceTier'
import type { Preference } from '../types/database'

const preference: Preference = {
  id: 'pref-1',
  round_id: 'round-1',
  nurse_id: 'nurse-1',
  choice_1: 'dept-a',
  choice_2: 'dept-b',
  choice_3: 'dept-c',
  submitted_at: '2026-07-07T10:00:00Z',
}

describe('preferenceTier', () => {
  it('resolves matched tier from database-shaped preferences', () => {
    expect(getMatchedTierForDepartment(preference, 'dept-a')).toBe(1)
    expect(getMatchedTierForDepartment(preference, 'dept-b')).toBe(2)
    expect(getMatchedTierForDepartment(preference, 'dept-c')).toBe(3)
    expect(getMatchedTierForDepartment(preference, 'dept-x')).toBeNull()
  })

  it('resolves matched tier from engine-shaped preferences', () => {
    expect(
      getMatchedTierForDepartment(
        { choice1: 'icu', choice2: 'er', choice3: 'peds' },
        'er',
      ),
    ).toBe(2)
  })

  it('builds nurse preference and rank maps', () => {
    const preferences = [preference]
    const byNurse = buildPreferenceByNurseIdMap(preferences)
    expect(getChoiceRankForDepartment('nurse-1', 'dept-b', byNurse)).toBe(2)

    const ranks = buildChoiceRankByNurseIdMap(preferences, 'dept-c')
    expect(ranks.get('nurse-1')).toBe(3)
  })

  it('builds choice ranks from lottery tier for all applicants', () => {
    const ranks = buildChoiceRankByNurseIdFromTier(
      ['nurse-1', 'nurse-2'],
      1,
    )
    expect(ranks.get('nurse-1')).toBe(1)
    expect(ranks.get('nurse-2')).toBe(1)
    expect(ranks.size).toBe(2)
  })

  it('formats participant labels with choice rank', () => {
    expect(
      formatParticipantWithChoiceRank('n1', { n1: 'Nurse One' }, 2, 'n1'),
    ).toBe('Nurse One (คุณ) — อันดับ 2')
  })
})
