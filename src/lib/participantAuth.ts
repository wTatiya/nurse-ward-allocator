import { NURSE_ID_AUTH_DOMAIN } from './nurseIdAuth'

export interface ParticipantLoginOption {
  login_slug: string
  full_name: string
}

export function participantSlugToAuthEmail(loginSlug: string): string {
  return `${loginSlug.trim()}@${NURSE_ID_AUTH_DOMAIN}`
}

export function validateParticipantSelection(loginSlug: string): string | null {
  if (!loginSlug.trim()) {
    return 'Select your full name from the list.'
  }
  return null
}
