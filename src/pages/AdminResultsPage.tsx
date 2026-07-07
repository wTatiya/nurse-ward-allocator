import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { downloadCsv, formatRoundStatus, formatTier } from '../lib/utils'
import { ResultsTable } from '../components/ResultsTable'
import {
  useRealtimeAssignments,
  useRealtimeLotteryEvents,
  useRealtimeWaitlist,
} from '../hooks/useRealtimeAssignments'
import type {
  AssignmentRound,
  Department,
  LotteryEvent,
  Profile,
} from '../types/database'

export function AdminResultsPage() {
  const [rounds, setRounds] = useState<AssignmentRound[]>([])
  const [selectedRoundId, setSelectedRoundId] = useState('')
  const [departments, setDepartments] = useState<Department[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])

  const assignments = useRealtimeAssignments(selectedRoundId || null)
  const waitlist = useRealtimeWaitlist(selectedRoundId || null)
  const lotteryEvents = useRealtimeLotteryEvents(selectedRoundId || null)

  useEffect(() => {
    const load = async () => {
      const [{ data: roundData }, { data: departmentData }, { data: profileData }] =
        await Promise.all([
          supabase
            .from('assignment_rounds')
            .select('*')
            .order('created_at', { ascending: false }),
          supabase.from('departments').select('*').order('code'),
          supabase.from('profiles').select('*'),
        ])

      const nextRounds = (roundData as AssignmentRound[]) ?? []
      setRounds(nextRounds)
      setDepartments((departmentData as Department[]) ?? [])
      setProfiles((profileData as Profile[]) ?? [])
      if (!selectedRoundId && nextRounds[0]) {
        setSelectedRoundId(nextRounds[0].id)
      }
    }

    void load()
  }, [selectedRoundId])

  const nurseNames = useMemo(
    () => Object.fromEntries(profiles.map((profile) => [profile.id, profile.full_name])),
    [profiles],
  )

  const departmentFill = useMemo(() => {
    return departments
      .filter((department) => department.is_active)
      .map((department) => {
      const count = assignments.filter(
        (item) => item.department_id === department.id,
      ).length
      return {
        label: `${department.code} — ${department.name_th}`,
        assigned: count,
        capacity: department.capacity,
        remaining: Math.max(department.capacity - count, 0),
      }
    })
  }, [assignments, departments])

  const exportAssignments = () => {
    const rows = [
      ['พยาบาล', 'แผนก', 'อันดับที่จัดสรร', 'วันที่จัดสรร'],
      ...assignments.map((assignment) => [
        nurseNames[assignment.nurse_id] ?? assignment.nurse_id,
        departments.find((d) => d.id === assignment.department_id)?.code ?? '',
        formatTier(assignment.matched_tier),
        assignment.assigned_at,
      ]),
    ]
    downloadCsv('assignments.csv', rows)
  }

  const exportWaitlist = () => {
    const rows = [
      ['ลำดับ', 'พยาบาล'],
      ...waitlist.map((entry) => [
        String(entry.position),
        nurseNames[entry.nurse_id] ?? entry.nurse_id,
      ]),
    ]
    downloadCsv('waitlist.csv', rows)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">ผลลัพธ์</h1>
          <p className="mt-1 text-sm text-slate-600">
            ตารางผลการจัดสรรแบบเรียลไทม์ บันทึกการจับสลาก และส่งออก CSV
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={exportAssignments}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
          >
            ส่งออกผลจัดสรร
          </button>
          <button
            type="button"
            onClick={exportWaitlist}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
          >
            ส่งออกรายการรอ
          </button>
        </div>
      </div>

      <label className="block max-w-md">
        <span className="mb-1 block text-sm font-medium text-slate-700">
          รอบจัดสรร
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

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">ตำแหน่งที่เติมแล้ว</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {departmentFill.map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <p className="font-medium text-slate-900">{item.label}</p>
              <p className="mt-1 text-sm text-slate-600">
                เติมแล้ว {item.assigned} / {item.capacity} ตำแหน่ง (ว่าง{' '}
                {item.remaining} ตำแหน่ง)
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">ผลการจัดสรร</h2>
        <ResultsTable
          assignments={assignments}
          departments={departments}
          nurseNames={nurseNames}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">รายการรอ</h2>
        {waitlist.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
            ไม่มีผู้เข้ารับการจัดสรรในรายการรอ
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
                    พยาบาล
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {waitlist.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-4 py-3">#{entry.position}</td>
                    <td className="px-4 py-3">
                      {nurseNames[entry.nurse_id] ?? entry.nurse_id}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">บันทึกการจับสลาก</h2>
        {lotteryEvents.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
            รอบนี้ไม่ต้องจับสลาก
          </p>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              แต่ละครั้งที่มีผู้สมัครมากกว่าตำแหน่งว่าง ระบบจะจับสลากแบบสุ่มอย่างเป็นธรรม
              และเก็บ seed hash ไว้สำหรับตรวจสอบ
            </p>
            {lotteryEvents.map((event: LotteryEvent) => (
              <div
                key={event.id}
                className="rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm"
              >
                <p className="font-medium text-slate-900">
                  {departments.find((d) => d.id === event.department_id)?.code ??
                    event.department_id}{' '}
                  — {formatTier(event.tier)}
                </p>
                <p className="mt-1 text-slate-600">
                  ตำแหน่ง: {event.slots} | ผู้สมัคร: {event.applicant_ids.length}{' '}
                  | ได้รับเลือก: {event.winner_ids.length}
                </p>
                <p className="mt-2 text-slate-700">
                  ได้รับเลือก:{' '}
                  {event.winner_ids
                    .map((id) => nurseNames[id] ?? id)
                    .join(', ')}
                </p>
                <p className="mt-1 text-slate-700">
                  ไม่ได้รับเลือก:{' '}
                  {event.applicant_ids
                    .filter((id) => !event.winner_ids.includes(id))
                    .map((id) => nurseNames[id] ?? id)
                    .join(', ') || '—'}
                </p>
                <p className="mt-1 break-all text-xs text-slate-500">
                  Seed hash: {event.seed_hash}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
