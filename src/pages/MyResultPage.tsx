import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { formatTier } from '../lib/utils'
import {
  useRealtimeAssignments,
  useRealtimeRound,
  useRealtimeWaitlist,
} from '../hooks/useRealtimeAssignments'
import type { AssignmentRound, Ward } from '../types/database'

export function MyResultPage() {
  const [rounds, setRounds] = useState<AssignmentRound[]>([])
  const [selectedRoundId, setSelectedRoundId] = useState('')
  const [wards, setWards] = useState<Ward[]>([])
  const [myAssignment, setMyAssignment] = useState<{
    wardName: string
    tier: 1 | 2 | 3
  } | null>(null)
  const [waitlistPosition, setWaitlistPosition] = useState<number | null>(null)

  const round = useRealtimeRound(selectedRoundId || null)
  const assignments = useRealtimeAssignments(selectedRoundId || null)
  const waitlist = useRealtimeWaitlist(selectedRoundId || null)

  useEffect(() => {
    const load = async () => {
      const [{ data: roundData }, { data: wardData }] = await Promise.all([
        supabase
          .from('assignment_rounds')
          .select('*')
          .in('status', ['closed', 'running', 'completed'])
          .order('created_at', { ascending: false }),
        supabase.from('wards').select('*').order('name'),
      ])

      const nextRounds = (roundData as AssignmentRound[]) ?? []
      setRounds(nextRounds)
      setWards((wardData as Ward[]) ?? [])
      if (!selectedRoundId && nextRounds[0]) {
        setSelectedRoundId(nextRounds[0].id)
      }
    }

    void load()
  }, [selectedRoundId])

  useEffect(() => {
    const resolve = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user || !selectedRoundId) {
        setMyAssignment(null)
        setWaitlistPosition(null)
        return
      }

      const assignment = assignments.find((item) => item.nurse_id === user.id)
      if (assignment) {
        const ward = wards.find((w) => w.id === assignment.ward_id)
        setMyAssignment({
          wardName: ward?.name ?? 'Unknown ward',
          tier: assignment.matched_tier,
        })
        setWaitlistPosition(null)
        return
      }

      const entry = waitlist.find((item) => item.nurse_id === user.id)
      setMyAssignment(null)
      setWaitlistPosition(entry?.position ?? null)
    }

    void resolve()
  }, [assignments, waitlist, wards, selectedRoundId])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">My Result</h1>
        <p className="mt-1 text-sm text-slate-600">
          Results update live when an admin runs assignment for a round.
        </p>
      </div>

      {rounds.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
          No completed or in-progress rounds yet.
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
              {rounds.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.status})
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Round status</p>
            <p className="mt-1 text-lg font-medium capitalize text-slate-900">
              {round?.status ?? 'Loading...'}
            </p>

            {myAssignment ? (
              <div className="mt-4 rounded-lg bg-teal-50 p-4">
                <p className="text-sm text-teal-800">You were assigned to</p>
                <p className="text-xl font-semibold text-teal-900">
                  {myAssignment.wardName}
                </p>
                <p className="mt-1 text-sm text-teal-700">
                  Matched via {formatTier(myAssignment.tier)}
                </p>
              </div>
            ) : waitlistPosition ? (
              <div className="mt-4 rounded-lg bg-amber-50 p-4">
                <p className="text-sm text-amber-800">
                  You are on the general waitlist
                </p>
                <p className="text-xl font-semibold text-amber-900">
                  Position #{waitlistPosition}
                </p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-600">
                {round?.status === 'completed'
                  ? 'No assignment recorded for you in this round.'
                  : 'Assignment has not been published yet.'}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
