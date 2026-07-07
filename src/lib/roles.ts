import type { UserRole } from '../types/database'
import { formatRoleLabel as formatRoleLabelTh } from './locale/th'

export const STAFF_VIEWER_ROLES: UserRole[] = [
  'MANAGER',
  'HEAD_NURSE',
  'VICE_HEAD_NURSE',
  'SUPERVISOR_NURSE',
  'HEAD_WARD_NURSE',
]

export function isAdmin(role: UserRole | null | undefined): boolean {
  return role === 'ADMIN'
}

export function isStaffViewer(role: UserRole | null | undefined): boolean {
  return role != null && STAFF_VIEWER_ROLES.includes(role)
}

export function isParticipant(role: UserRole | null | undefined): boolean {
  return role === 'PARTICIPANT'
}

export function defaultRouteForRole(role: UserRole | null | undefined): string {
  if (isAdmin(role)) return '/admin/rounds'
  if (isParticipant(role)) return '/preferences'
  if (isStaffViewer(role)) return '/dashboard'
  return '/login'
}

export function formatRoleLabel(role: UserRole): string {
  return formatRoleLabelTh(role)
}
