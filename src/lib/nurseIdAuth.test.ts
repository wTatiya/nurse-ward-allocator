import { describe, expect, it } from 'vitest'
import {
  isValidNurseId,
  nurseIdToAuthEmail,
  nurseIdToPassword,
  validateNurseIdInput,
  validatePasswordInput,
} from './nurseIdAuth'

describe('nurseIdAuth', () => {
  it('accepts exactly 7 digits', () => {
    expect(isValidNurseId('1234567')).toBe(true)
    expect(isValidNurseId('123456')).toBe(false)
    expect(isValidNurseId('12345678')).toBe(false)
    expect(isValidNurseId('123456a')).toBe(false)
  })

  it('maps nurse ID to internal auth email', () => {
    expect(nurseIdToAuthEmail('1234567')).toBe(
      '1234567@nurse.ward-allocator.local',
    )
  })

  it('uses nurse ID as default password', () => {
    expect(nurseIdToPassword(' 1234567 ')).toBe('1234567')
  })

  it('validates nurse ID input', () => {
    expect(validateNurseIdInput('')).toMatch(/7-digit/)
    expect(validateNurseIdInput('123')).toMatch(/exactly 7/)
    expect(validateNurseIdInput('1234567')).toBeNull()
  })

  it('validates password input', () => {
    expect(validatePasswordInput('')).toMatch(/password/)
    expect(validatePasswordInput('123456')).toMatch(/at least 7/)
    expect(validatePasswordInput('1234567')).toBeNull()
    expect(validatePasswordInput('1102002871008')).toBeNull()
  })
})
