// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import {
  WAITLIST_CONTACT_STAFF_ACTION,
  WAITLIST_OUTCOME_REASON,
} from '../lib/personalOutcome'
import { OutcomeExplanation } from './OutcomeExplanation'

const departments = [
  {
    id: 'dept-a',
    code: '18A',
    name_th: 'Dept A',
    capacity: 1,
    is_active: true,
    created_at: '',
  },
]

afterEach(() => {
  cleanup()
})

describe('OutcomeExplanation', () => {
  it('does not render lottery card on department_full when user was not in pool', () => {
    render(
      <OutcomeExplanation
        userId="nurse-1"
        round={{ id: 'r1', name: 'R1', status: 'completed', submission_deadline: null, archived_at: null, created_at: '' }}
        preference={{
          id: 'p1',
          round_id: 'r1',
          nurse_id: 'nurse-1',
          choice_1: 'dept-c',
          choice_2: 'dept-a',
          choice_3: 'dept-b',
          submitted_at: '',
        }}
        assignment={{
          id: 'a1',
          round_id: 'r1',
          nurse_id: 'nurse-1',
          department_id: 'dept-a',
          matched_tier: 2,
          assigned_at: '',
        }}
        lotteryEvents={[
          {
            id: 'lot-1',
            round_id: 'r1',
            department_id: 'dept-a',
            tier: 1,
            applicant_ids: ['nurse-2', 'nurse-3'],
            winner_ids: ['nurse-2'],
            slots: 1,
            seed_hash: 'hash',
            created_at: '',
          },
        ]}
        departments={departments}
        nurseNames={{ 'nurse-1': 'Viewer' }}
      />,
    )

    expect(screen.getByText('ตำแหน่งเต็ม')).toBeInTheDocument()
    expect(screen.queryByText(/ผลการจับสลาก/)).not.toBeInTheDocument()
  })

  it('renders lottery card when user lost lottery', () => {
    render(
      <OutcomeExplanation
        userId="nurse-1"
        round={{ id: 'r1', name: 'R1', status: 'completed', submission_deadline: null, archived_at: null, created_at: '' }}
        preference={{
          id: 'p1',
          round_id: 'r1',
          nurse_id: 'nurse-1',
          choice_1: 'dept-a',
          choice_2: 'dept-b',
          choice_3: 'dept-c',
          submitted_at: '',
        }}
        waitlistEntry={{
          id: 'w1',
          round_id: 'r1',
          nurse_id: 'nurse-1',
          position: 1,
          created_at: '',
        }}
        lotteryEvents={[
          {
            id: 'lot-1',
            round_id: 'r1',
            department_id: 'dept-a',
            tier: 1,
            applicant_ids: ['nurse-1', 'nurse-2'],
            winner_ids: ['nurse-2'],
            slots: 1,
            seed_hash: 'hash',
            created_at: '',
          },
        ]}
        departments={departments}
        nurseNames={{ 'nurse-1': 'Viewer', 'nurse-2': 'Winner' }}
      />,
    )

    expect(screen.getByText(/ผลการจับสลาก/)).toBeInTheDocument()
    expect(screen.getByText('จับสลากไม่ได้')).toBeInTheDocument()
    expect(screen.getByText('Winner — อันดับ 1')).toBeInTheDocument()
    const waitlistSummary = screen.getByText(/ผลสุดท้าย:/, {
      selector: 'p.text-amber-800',
    })
    expect(waitlistSummary).toHaveTextContent(WAITLIST_OUTCOME_REASON)
    expect(waitlistSummary).toHaveTextContent(WAITLIST_CONTACT_STAFF_ACTION)
    expect(screen.queryByText(/ลำดับที่/)).not.toBeInTheDocument()
  })
})
