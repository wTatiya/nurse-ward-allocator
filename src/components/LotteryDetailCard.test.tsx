// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LotteryDetailCard } from './LotteryDetailCard'
import type { LotteryEvent } from '../types/database'

const event: LotteryEvent = {
  id: 'lot-1',
  round_id: 'round-1',
  department_id: 'dept-a',
  tier: 1,
  applicant_ids: ['n1', 'n2'],
  winner_ids: ['n1'],
  slots: 1,
  seed_hash: 'abc',
  created_at: '',
}

describe('LotteryDetailCard', () => {
  it('shows choice rank labels when rank map is provided', () => {
    const choiceRankByNurseId = new Map<string, 1 | 2 | 3>([
      ['n1', 1],
      ['n2', 1],
    ])

    render(
      <LotteryDetailCard
        event={event}
        departmentLabel="18D — Pediatrics"
        nurseNames={{ n1: 'Nurse One', n2: 'Nurse Two' }}
        currentUserId="n1"
        choiceRankByNurseId={choiceRankByNurseId}
      />,
    )

    expect(screen.getByText(/Nurse One \(คุณ\) — อันดับ 1/)).toBeInTheDocument()
    expect(screen.getByText(/Nurse Two — อันดับ 1/)).toBeInTheDocument()
  })

  it('lists not-selected applicants using winner set', () => {
    render(
      <LotteryDetailCard
        event={event}
        departmentLabel="18D"
        nurseNames={{ n1: 'Nurse One', n2: 'Nurse Two' }}
        currentUserId=""
      />,
    )

    expect(screen.getByText('Nurse Two')).toBeInTheDocument()
    expect(screen.queryByText('Nurse One', { selector: 'li' })).not.toBeNull()
  })
})
