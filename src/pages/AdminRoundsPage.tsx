import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { formatRoundStatus } from '../lib/utils'
import type { AssignmentRound, RoundStatus } from '../types/database'

const statuses: RoundStatus[] = [
  'draft',
  'open',
  'closed',
  'running',
  'completed',
]

export function AdminRoundsPage() {
  const [rounds, setRounds] = useState<AssignmentRound[]>([])
  const [name, setName] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [runningId, setRunningId] = useState<string | null>(null)

  const loadRounds = async () => {
    const { data } = await supabase
      .from('assignment_rounds')
      .select('*')
      .order('created_at', { ascending: false })
    setRounds((data as AssignmentRound[]) ?? [])
  }

  useEffect(() => {
    void loadRounds()
  }, [])

  const createRound = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setMessage(null)

    const { error: insertError } = await supabase
      .from('assignment_rounds')
      .insert({
        name: name.trim(),
        status: 'draft',
      })

    if (insertError) {
      setError(insertError.message)
      return
    }

    setName('')
    setMessage('Round created.')
    await loadRounds()
  }

  const updateStatus = async (round: AssignmentRound, status: RoundStatus) => {
    setError(null)
    setMessage(null)

    const { error: updateError } = await supabase
      .from('assignment_rounds')
      .update({ status })
      .eq('id', round.id)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setMessage(`Round "${round.name}" set to ${formatRoundStatus(status)}.`)
    await loadRounds()
  }

  const runAssignment = async (round: AssignmentRound) => {
    setError(null)
    setMessage(null)
    setRunningId(round.id)

    const { data, error: invokeError } = await supabase.functions.invoke(
      'run-assignment',
      { body: { roundId: round.id } },
    )

    setRunningId(null)

    if (invokeError) {
      setError(invokeError.message)
      return
    }

    if (data?.error) {
      setError(data.error)
      return
    }

    setMessage(
      `Assignment complete: ${data.assigned} assigned, ${data.waitlisted} waitlisted, ${data.lotteries} lotteries run.`,
    )
    await loadRounds()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Rounds</h1>
        <p className="mt-1 text-sm text-slate-600">
          Create a round, open it when nurses may submit, close it when ready,
          then run assignment.
        </p>
      </div>

      <form
        onSubmit={createRound}
        className="flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <label className="block min-w-[16rem] flex-1">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Round name
          </span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <button
          type="submit"
          className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
        >
          Create round
        </button>
      </form>

      {message && (
        <p className="rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-800">
          {message}
        </p>
      )}
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="space-y-4">
        {rounds.map((round) => (
          <div
            key={round.id}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {round.name}
                </h2>
                <p className="text-sm capitalize text-slate-600">
                  Status: {round.status}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {round.status === 'draft' && (
                  <button
                    type="button"
                    onClick={() => void updateStatus(round, 'open')}
                    className="rounded-lg bg-teal-700 px-3 py-2 text-sm text-white"
                  >
                    Open submissions
                  </button>
                )}
                {round.status === 'open' && (
                  <button
                    type="button"
                    onClick={() => void updateStatus(round, 'closed')}
                    className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-white"
                  >
                    Close submissions
                  </button>
                )}
                {round.status === 'closed' && (
                  <button
                    type="button"
                    disabled={runningId === round.id}
                    onClick={() => void runAssignment(round)}
                    className="rounded-lg bg-amber-600 px-3 py-2 text-sm text-white disabled:bg-slate-300"
                  >
                    {runningId === round.id
                      ? 'Running assignment...'
                      : 'Run assignment'}
                  </button>
                )}
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Lifecycle: {statuses.join(' → ')}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
