import { supabase } from './supabase'
import type { WaitlistEntry } from '../types/database'

export {
  capacityWarningLabel,
  getCapacityStatus,
  projectedCapacityStatus,
  type CapacityStatus,
} from './assignmentCapacity'

async function recompactWaitlist(roundId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('waitlist')
    .select('*')
    .eq('round_id', roundId)
    .order('position')

  if (error) return error.message

  const entries = (data as WaitlistEntry[]) ?? []
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index]
    const { error: tempError } = await supabase
      .from('waitlist')
      .update({ position: 10000 + index })
      .eq('id', entry.id)
    if (tempError) return tempError.message
  }

  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index]
    const { error: finalError } = await supabase
      .from('waitlist')
      .update({ position: index + 1 })
      .eq('id', entry.id)
    if (finalError) return finalError.message
  }

  return null
}

export async function assignFromWaitlist(input: {
  roundId: string
  waitlistEntryId: string
  nurseId: string
  departmentId: string
}): Promise<string | null> {
  const { roundId, waitlistEntryId, nurseId, departmentId } = input

  const { error: upsertError } = await supabase.from('assignments').upsert(
    {
      round_id: roundId,
      nurse_id: nurseId,
      department_id: departmentId,
      matched_tier: 3,
    },
    { onConflict: 'round_id,nurse_id' },
  )

  if (upsertError) return upsertError.message

  const { error: deleteError } = await supabase
    .from('waitlist')
    .delete()
    .eq('id', waitlistEntryId)

  if (deleteError) return deleteError.message

  return recompactWaitlist(roundId)
}

export async function reassignParticipant(input: {
  assignmentId: string
  departmentId: string
}): Promise<string | null> {
  const { error } = await supabase
    .from('assignments')
    .update({ department_id: input.departmentId })
    .eq('id', input.assignmentId)

  return error?.message ?? null
}
