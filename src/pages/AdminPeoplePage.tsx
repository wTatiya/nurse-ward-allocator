import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { downloadCsv, formatRoundStatus } from '../lib/utils'
import { useRealtimePreferences } from '../hooks/useRealtimeAssignments'
import type { AssignmentRound, Profile } from '../types/database'

export function AdminPeoplePage() {
  const [rounds, setRounds] = useState<AssignmentRound[]>([])
  const [selectedRoundId, setSelectedRoundId] = useState('')
  const [participants, setParticipants] = useState<Profile[]>([])

  const preferences = useRealtimePreferences(selectedRoundId || null)

  useEffect(() => {
    const load = async () => {
      const [{ data: roundData }, { data: profileData }] = await Promise.all([
        supabase
          .from('assignment_rounds')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('profiles')
          .select('*')
          .eq('role', 'PARTICIPANT')
          .order('full_name'),
      ])

      const nextRounds = (roundData as AssignmentRound[]) ?? []
      setRounds(nextRounds)
      setParticipants((profileData as Profile[]) ?? [])

      if (!selectedRoundId && nextRounds[0]) {
        setSelectedRoundId(nextRounds[0].id)
      }
    }

    void load()
  }, [selectedRoundId])

  const submittedIds = useMemo(
    () => new Set(preferences.map((p) => p.nurse_id)),
    [preferences],
  )

  const notSubmitted = useMemo(
    () => participants.filter((p) => !submittedIds.has(p.id)),
    [participants, submittedIds],
  )

  const submitted = useMemo(
    () => participants.filter((p) => submittedIds.has(p.id)),
    [participants, submittedIds],
  )

  const exportNotSubmitted = () => {
    const rows = [
      ['ชื่อ-นามสกุล', 'รหัสเข้าสู่ระบบ'],
      ...notSubmitted.map((p) => [p.full_name, p.login_slug ?? '']),
    ]
    downloadCsv('not-submitted.csv', rows)
  }

  const selectedRound = rounds.find((r) => r.id === selectedRoundId)
  const submitPercent =
    participants.length > 0
      ? Math.round((submitted.length / participants.length) * 100)
      : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            ผู้ที่ยังไม่เลือกตึก
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            รายชื่อผู้เข้ารับการเลือกตึกแล้วที่ยังไม่ส่งความประสงค์ในรอบที่เลือก
            (อัปเดตแบบเรียลไทม์)
          </p>
        </div>
        <button
          type="button"
          onClick={exportNotSubmitted}
          disabled={notSubmitted.length === 0}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 disabled:opacity-50"
        >
          ส่งออกรายชื่อ
        </button>
      </div>

      <label className="block max-w-md">
        <span className="mb-1 block text-sm font-medium text-slate-700">
          รอบเลือกตึก
        </span>
        <select
          value={selectedRoundId}
          onChange={(event) => setSelectedRoundId(event.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          {rounds.map((round) => (
            <option key={round.id} value={round.id}>
              {round.name} ({formatRoundStatus(round.status)})
            </option>
          ))}
        </select>
      </label>

      {selectedRound && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">ผู้เข้ารับการเลือกตึกแล้วทั้งหมด</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {participants.length}
            </p>
          </div>
          <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 shadow-sm">
            <p className="text-xs text-teal-700">ส่งเลือกตึกแล้ว</p>
            <p className="mt-1 text-2xl font-semibold text-teal-900">
              {submitted.length}{' '}
              <span className="text-sm font-normal">({submitPercent}%)</span>
            </p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
            <p className="text-xs text-amber-800">ยังไม่เลือกตึก</p>
            <p className="mt-1 text-2xl font-semibold text-amber-900">
              {notSubmitted.length}
            </p>
          </div>
        </div>
      )}

      {participants.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
          ยังไม่มีบัญชีผู้เข้ารับการเลือกตึกแล้ว
        </p>
      ) : notSubmitted.length === 0 ? (
        <p className="rounded-xl border border-dashed border-teal-300 bg-teal-50 p-6 text-sm text-teal-800">
          ทุกคนส่งเลือกตึกครบแล้วในรอบนี้
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  ลำดับ
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  ชื่อ-นามสกุล
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  รหัสเข้าสู่ระบบ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {notSubmitted.map((person, index) => (
                <tr key={person.id}>
                  <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {person.full_name}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">
                    {person.login_slug ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
