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
    return 'Enter your 7-digit nurse ID.'
  }
  if (!isValidNurseId(trimmed)) {
    return 'Nurse ID must be exactly 7 digits (numbers only).'
  }
  return null
}

export function validatePasswordInput(password: string): string | null {
  if (!password) {
    return 'Enter your password.'
  }
  if (password.length < 7) {
    return 'Password must be at least 7 characters.'
  }
  return null
}

/** Default password for most staff equals nurse ID; admin may use a longer password. */
export function nurseIdToPassword(nurseId: string): string {
  return nurseId.trim()
}
