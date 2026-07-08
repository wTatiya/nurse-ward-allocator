import { describe, expect, it } from 'vitest'
import {
  isValidNurseId,
  nurseIdToAuthEmail,
  nurseIdToPassword,
  validateNurseIdInput,
  validatePasswordInput,
  formatPersonLabel,
  formatNurseIdColumn,
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

  it('hides temporary participant IDs in display labels', () => {
    expect(formatPersonLabel('ต้นตระกูล พึ่งแย้ม', '0000001')).toBe(
      'ต้นตระกูล พึ่งแย้ม',
    )
    expect(formatPersonLabel('กัลยกร จันทร์ผ่อง', '5690589')).toBe(
      'กัลยกร จันทร์ผ่อง (5690589)',
    )
    expect(formatNurseIdColumn('0000002')).toBe('—')
    expect(formatNurseIdColumn('5690590')).toBe('5690590')
  })

  it('validates nurse ID input', () => {
    expect(validateNurseIdInput('')).toMatch(/7/)
    expect(validateNurseIdInput('123')).toMatch(/7/)
    expect(validateNurseIdInput('1234567')).toBeNull()
  })

  it('validates password input', () => {
    expect(validatePasswordInput('')).toMatch(/รหัสผ่าน/)
    expect(validatePasswordInput('123456')).toMatch(/7/)
    expect(validatePasswordInput('1234567')).toBeNull()
    expect(validatePasswordInput('1102002871008')).toBeNull()
  })
})
