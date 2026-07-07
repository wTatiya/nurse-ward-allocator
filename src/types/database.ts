export type UserRole =
  | 'ADMIN'
  | 'MANAGER'
  | 'HEAD_NURSE'
  | 'VICE_HEAD_NURSE'
  | 'SUPERVISOR_NURSE'
  | 'HEAD_WARD_NURSE'
  | 'PARTICIPANT'

export type RoundStatus =
  | 'draft'
  | 'open'
  | 'closed'
  | 'running'
  | 'completed'

export interface Profile {
  id: string
  full_name: string
  nurse_id: string | null
  login_slug: string | null
  role: UserRole
  created_at: string
}

export interface Department {
  id: string
  code: string
  name_th: string
  capacity: number
  is_active: boolean
  created_at: string
}

/** @deprecated Use Department — kept for gradual migration in tests */
export type Ward = Department

export interface AssignmentRound {
  id: string
  name: string
  status: RoundStatus
  submission_deadline: string | null
  created_at: string
}

export interface Preference {
  id: string
  round_id: string
  nurse_id: string
  choice_1: string
  choice_2: string
  choice_3: string
  submitted_at: string
}

export interface Assignment {
  id: string
  round_id: string
  nurse_id: string
  department_id: string
  matched_tier: 1 | 2 | 3
  assigned_at: string
}

export interface WaitlistEntry {
  id: string
  round_id: string
  nurse_id: string
  position: number
  created_at: string
}

export interface LotteryEvent {
  id: string
  round_id: string
  department_id: string
  tier: 1 | 2 | 3
  applicant_ids: string[]
  winner_ids: string[]
  slots: number
  seed_hash: string
  created_at: string
}

export interface DepartmentRoundStats {
  round_id: string
  round_name: string
  round_status: RoundStatus
  department_id: string
  department_code: string
  department_name: string
  capacity: number
  assigned_count: number
  preference_mentions: number
  lottery_event_count: number
}

export interface PreferenceFormData {
  choice1: string
  choice2: string
  choice3: string
}
