import type { RoundStatus, UserRole } from '../../types/database'

export function formatTier(tier: 1 | 2 | 3): string {
  const labels = { 1: 'อันดับ 1', 2: 'อันดับ 2', 3: 'อันดับ 3' }
  return labels[tier]
}

const ROUND_STATUS_LABELS: Record<RoundStatus, string> = {
  draft: 'ร่าง',
  open: 'ตึกที่เปิดรับ',
  closed: 'ปิดรับความประสงค์',
  running: 'กำลังเลือกตึกแล้ว',
  completed: 'เสร็จสิ้น',
}

export function formatRoundStatus(status: string): string {
  return ROUND_STATUS_LABELS[status as RoundStatus] ?? status
}

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'ผู้ดูแลระบบ',
  MANAGER: 'ผู้จัดการ',
  HEAD_NURSE: 'หัวหน้าพยาบาล',
  VICE_HEAD_NURSE: 'รองหัวหน้าพยาบาล',
  SUPERVISOR_NURSE: 'พยาบาลควบคุม',
  HEAD_WARD_NURSE: 'หัวหน้าหอผู้ป่วย',
  PARTICIPANT: 'ผู้เข้ารับการเลือกตึกแล้ว',
}

export function formatRoleLabel(role: UserRole): string {
  return ROLE_LABELS[role]
}

export function tierOrdinal(tier: 1 | 2 | 3): string {
  const labels = { 1: 'อันดับ 1', 2: 'อันดับ 2', 3: 'อันดับ 3' }
  return labels[tier]
}

/** Map common Supabase auth errors to Thai. */
export function translateAuthError(message: string): string {
  if (message.includes('Invalid login credentials')) {
    return 'รหัสผ่านหรือข้อมูลเข้าสู่ระบบไม่ถูกต้อง'
  }
  return message
}
