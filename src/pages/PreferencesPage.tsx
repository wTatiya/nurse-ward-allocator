import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { PreferenceForm } from '../components/PreferenceForm'
import type { AssignmentRound, Preference } from '../types/database'

export function PreferencesPage() {
  const [rounds, setRounds] = useState<AssignmentRound[]>([])
  const [selectedRoundId, setSelectedRoundId] = useState<string>('')
  const [preference, setPreference] = useState<Preference | null>(null)

  const loadRounds = useCallback(async () => {
    const { data } = await supabase
      .from('assignment_rounds')
      .select('*')
      .in('status', ['open', 'closed', 'completed'])
      .order('created_at', { ascending: false })

    const nextRounds = (data as AssignmentRound[]) ?? []
    setRounds(nextRounds)
    if (!selectedRoundId && nextRounds[0]) {
      setSelectedRoundId(nextRounds[0].id)
    }
  }, [selectedRoundId])

  const loadPreference = useCallback(async () => {
    if (!selectedRoundId) {
      setPreference(null)
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('preferences')
      .select('*')
      .eq('round_id', selectedRoundId)
      .eq('nurse_id', user.id)
      .maybeSingle()

    setPreference((data as Preference) ?? null)
  }, [selectedRoundId])

  useEffect(() => {
    void loadRounds()
  }, [loadRounds])

  useEffect(() => {
    void loadPreference()
  }, [loadPreference])

  const selectedRound = rounds.find((round) => round.id === selectedRoundId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Preferences</h1>
        <p className="mt-1 text-sm text-slate-600">
          Rank your top three ward choices for the active assignment round.
        </p>
      </div>

      {rounds.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
          No open assignment rounds yet. Check back when an admin opens submissions.
        </p>
      ) : (
        <>
          <label className="block max-w-md">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Assignment round
            </span>
            <select
              value={selectedRoundId}
              onChange={(event) => setSelectedRoundId(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              {rounds.map((round) => (
                <option key={round.id} value={round.id}>
                  {round.name} ({round.status})
                </option>
              ))}
            </select>
          </label>

          {selectedRound && (
            <PreferenceForm
              round={selectedRound}
              existing={preference}
              onSaved={loadPreference}
            />
          )}
        </>
      )}
    </div>
  )
}
