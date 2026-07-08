/** Internal email domain — maps 7-digit nurse IDs to Supabase email auth. */
export const NURSE_ID_AUTH_DOMAIN = 'nurse.ward-allocator.local'

const NURSE_ID_PATTERN = /^\d{7}$/

export function isValidNurseId(value: string): boolean {
  return NURSE_ID_PATTERN.test(value.trim())
}

export function nurseIdToAuthEmail(nurseId: string): string {
  return `${nurseId.trim()}@${NURSE_ID_AUTH_DOMAIN}`
}

export function validateNurseIdInput(nurseId: string): string | null {
  const trimmed = nurseId.trim()
  if (!trimmed) {
    return 'กรุณากรอกรหัส 7 หลัก'
  }
  if (!isValidNurseId(trimmed)) {
    return 'รหัสต้องเป็นตัวเลข 7 หลักเท่านั้น'
  }
  return null
}

export function validatePasswordInput(password: string): string | null {
  if (!password) {
    return 'กรุณากรอกรหัสผ่าน'
  }
  if (password.length < 7) {
    return 'รหัสผ่านต้องมีอย่างน้อย 7 ตัวอักษร'
  }
  return null
}

/** Temporary login IDs — not real employee numbers; hide in public name lists. */
export const TEMPORARY_PARTICIPANT_NURSE_IDS = ['0000001', '0000002'] as const

export function isTemporaryParticipantNurseId(
  nurseId: string | null | undefined,
): boolean {
  const id = nurseId?.trim()
  if (!id) return false
  return (TEMPORARY_PARTICIPANT_NURSE_IDS as readonly string[]).includes(id)
}

/** Label for tables: real IDs only; em dash for missing or temporary. */
export function formatNurseIdColumn(nurseId: string | null | undefined): string {
  const id = nurseId?.trim()
  if (!id || isTemporaryParticipantNurseId(id)) return '—'
  return id
}

/** Full name with real 7-digit ID; temporary IDs show name only. */
export function formatPersonLabel(
  fullName: string,
  nurseId: string | null | undefined,
): string {
  const id = nurseId?.trim()
  if (!id || isTemporaryParticipantNurseId(id)) return fullName
  return `${fullName} (${id})`
}

/** Default password for most staff equals nurse ID; admin may use a longer password. */
export function nurseIdToPassword(nurseId: string): string {
  return nurseId.trim()
}
