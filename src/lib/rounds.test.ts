import { describe, expect, it } from 'vitest'
import type { AssignmentRound } from '../types/database'
import {
  canArchiveRound,
  isRoundArchived,
  splitRoundsByArchive,
} from './rounds'

function round(
  overrides: Partial<AssignmentRound> = {},
): AssignmentRound {
  return {
    id: '1',
    name: 'Test',
    status: 'completed',
    submission_deadline: null,
    archived_at: null,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('rounds helpers', () => {
  it('detects archived rounds', () => {
    expect(isRoundArchived(round())).toBe(false)
    expect(isRoundArchived(round({ archived_at: '2026-01-02T00:00:00Z' }))).toBe(
      true,
    )
  })

  it('allows archiving only completed active rounds', () => {
    expect(canArchiveRound(round())).toBe(true)
    expect(canArchiveRound(round({ status: 'open' }))).toBe(false)
    expect(
      canArchiveRound(round({ archived_at: '2026-01-02T00:00:00Z' })),
    ).toBe(false)
  })

  it('splits active and archived rounds', () => {
    const active = round({ id: 'a' })
    const archived = round({
      id: 'b',
      archived_at: '2026-01-02T00:00:00Z',
    })

    expect(splitRoundsByArchive([active, archived])).toEqual({
      active: [active],
      archived: [archived],
    })
  })
})
