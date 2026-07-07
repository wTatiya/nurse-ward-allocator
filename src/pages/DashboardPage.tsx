import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { formatRoundStatus } from '../lib/utils'
import type { AssignmentRound, DepartmentRoundStats } from '../types/database'

export function DashboardPage() {
  const [rounds, setRounds] = useState<AssignmentRound[]>([])
  const [selectedRoundId, setSelectedRoundId] = useState('')
  const [stats, setStats] = useState<DepartmentRoundStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadRounds = async () => {
      const { data, error: roundError } = await supabase
        .from('assignment_rounds')
        .select('*')
        .order('created_at', { ascending: false })

      if (roundError) {
        setError(roundError.message)
        setLoading(false)
        return
      }

      const nextRounds = (data as AssignmentRound[]) ?? []
      setRounds(nextRounds)
      if (!selectedRoundId && nextRounds[0]) {
        setSelectedRoundId(nextRounds[0].id)
      }
      setLoading(false)
    }

    void loadRounds()
  }, [selectedRoundId])

  useEffect(() => {
    if (!selectedRoundId) {
      setStats([])
      return
    }

    const loadStats = async () => {
      setError(null)
      const { data, error: statsError } = await supabase
        .from('department_round_stats')
        .select('*')
        .eq('round_id', selectedRoundId)
        .order('department_code')

      if (statsError) {
        setError(statsError.message)
        setStats([])
        return
      }

      setStats((data as DepartmentRoundStats[]) ?? [])
    }

    void loadStats()
  }, [selectedRoundId])

  const selectedRound = rounds.find((round) => round.id === selectedRoundId)

  const totals = useMemo(() => {
    return stats.reduce(
      (acc, row) => ({
        capacity: acc.capacity + row.capacity,
        assigned: acc.assigned + row.assigned_count,
        preferences: acc.preferences + row.preference_mentions,
        lotteries: acc.lotteries + row.lottery_event_count,
      }),
      { capacity: 0, assigned: 0, preferences: 0, lotteries: 0 },
    )
  }, [stats])

  if (loading) {
    return (
      <div className="text-sm text-slate-500">Loading dashboard...</div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">
          Read-only allocation overview for your visible departments.
        </p>
      </div>

      {rounds.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
          No assignment rounds yet.
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
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">Round status</p>
              <p className="mt-1 text-lg font-medium text-slate-900">
                {formatRoundStatus(selectedRound.status)}
              </p>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-slate-500">Departments visible</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {stats.length}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-slate-500">Slots filled</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {totals.assigned} / {totals.capacity}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-slate-500">Preference mentions</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {totals.preferences}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-slate-500">Lottery events</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {totals.lotteries}
              </p>
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          {stats.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
              No departments in your scope for this round.
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">
                      Code
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">
                      Department
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">
                      Capacity
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">
                      Assigned
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">
                      Preferences
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">
                      Lotteries
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.map((row) => (
                    <tr key={row.department_id}>
                      <td className="px-4 py-3 font-mono text-xs">
                        {row.department_code}
                      </td>
                      <td className="px-4 py-3">{row.department_name}</td>
                      <td className="px-4 py-3">{row.capacity}</td>
                      <td className="px-4 py-3">
                        {row.assigned_count} / {row.capacity}
                      </td>
                      <td className="px-4 py-3">{row.preference_mentions}</td>
                      <td className="px-4 py-3">{row.lottery_event_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
