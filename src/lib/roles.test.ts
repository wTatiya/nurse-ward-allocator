import { describe, expect, it } from 'vitest'
import {
  defaultRouteForRole,
  isAdmin,
  isParticipant,
  isStaffViewer,
} from './roles'

describe('roles', () => {
  it('identifies admin', () => {
    expect(isAdmin('ADMIN')).toBe(true)
    expect(isAdmin('MANAGER')).toBe(false)
  })

  it('identifies staff viewers', () => {
    expect(isStaffViewer('HEAD_WARD_NURSE')).toBe(true)
    expect(isStaffViewer('SUPERVISOR_NURSE')).toBe(true)
    expect(isStaffViewer('ADMIN')).toBe(false)
    expect(isStaffViewer('PARTICIPANT')).toBe(false)
  })

  it('identifies participants', () => {
    expect(isParticipant('PARTICIPANT')).toBe(true)
    expect(isParticipant('ADMIN')).toBe(false)
  })

  it('routes by role', () => {
    expect(defaultRouteForRole('ADMIN')).toBe('/admin/rounds')
    expect(defaultRouteForRole('HEAD_WARD_NURSE')).toBe('/dashboard')
    expect(defaultRouteForRole('SUPERVISOR_NURSE')).toBe('/dashboard')
    expect(defaultRouteForRole('MANAGER')).toBe('/dashboard')
    expect(defaultRouteForRole('PARTICIPANT')).toBe('/preferences')
  })
})
