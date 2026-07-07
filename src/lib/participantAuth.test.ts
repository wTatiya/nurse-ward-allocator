import { describe, expect, it } from 'vitest'
import {
  participantSlugToAuthEmail,
  validateParticipantSelection,
} from './participantAuth'

describe('participantAuth', () => {
  it('maps login slug to internal auth email', () => {
    expect(participantSlugToAuthEmail('p-0001')).toBe(
      'p-0001@nurse.ward-allocator.local',
    )
  })

  it('requires a selected name', () => {
    expect(validateParticipantSelection('')).toMatch(/ชื่อ/)
    expect(validateParticipantSelection('p-0001')).toBeNull()
  })
})
