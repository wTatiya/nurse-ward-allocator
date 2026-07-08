import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { downloadCsv, formatRoundStatus, formatTier } from '../lib/utils'
import { ResultsTable } from '../components/ResultsTable'
import { ResultsDashboard } from '../components/ResultsDashboard'
import { DepartmentFillCard } from '../components/DepartmentFillCard'
import { WaitlistAssignTable } from '../components/WaitlistAssignTable'
import { SettledAssignmentsTable } from '../components/SettledAssignmentsTable'
import {
  capacityWarningLabel,
  getCapacityStatus,
} from '../lib/manualAssignment'
import {
  useRealtimeAssignments,
  useRealtimeLotteryEvents,
  useRealtimePreferences,
  useRealtimeRound,
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
  const [expandedDepartmentId, setExpandedDepartmentId] = useState<string | null>(
    null,
  )

  const assignments = useRealtimeAssignments(selectedRoundId || null)
  const waitlist = useRealtimeWaitlist(selectedRoundId || null)
  const lotteryEvents = useRealtimeLotteryEvents(selectedRoundId || null)
  const preferences = useRealtimePreferences(selectedRoundId || null)
  const round = useRealtimeRound(selectedRoundId || null)

  const participantTotal = useMemo(
    () => profiles.filter((p) => p.role === 'PARTICIPANT').length,
    [profiles],
  )

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

  useEffect(() => {
    setExpandedDepartmentId(null)
  }, [selectedRoundId])

  const nurseNames = useMemo(
    () => Object.fromEntries(profiles.map((profile) => [profile.id, profile.full_name])),
    [profiles],
  )

  const departmentFill = useMemo(() => {
    const items = departments
      .filter((department) => department.is_active)
      .map((department) => {
        const count = assignments.filter(
          (item) => item.department_id === department.id,
        ).length
        const remaining = department.capacity - count
        const capacityStatus = getCapacityStatus(count, department.capacity)
        const assignedPeople = assignments
          .filter((item) => item.department_id === department.id)
          .map((item) => ({
            id: item.nurse_id,
            name: nurseNames[item.nurse_id] ?? item.nurse_id,
          }))
          .sort((a, b) => a.name.localeCompare(b.name, 'th'))
        const assignedNames = assignedPeople.map((person) => person.name)
        return {
          departmentId: department.id,
          code: department.code,
          label: `${department.code} — ${department.name_th}`,
          assigned: count,
          capacity: department.capacity,
          remaining: Math.max(remaining, 0),
          capacityStatus,
          warningLabel: capacityWarningLabel(count, department.capacity),
          assignedNames,
          assignedPeople,
        }
      })

    const groupOrder = (status: ReturnType<typeof getCapacityStatus>) => {
      if (status === 'overflow') return 0
      if (status === 'vacancy') return 1
      return 2
    }

    const byCode = (a: { code: string }, b: { code: string }) =>
      a.code.localeCompare(b.code, 'th')

    return [...items].sort(
      (a, b) =>
        groupOrder(a.capacityStatus) - groupOrder(b.capacityStatus) ||
        byCode(a, b),
    )
  }, [assignments, departments, nurseNames])

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
        <p className="text-sm text-slate-600">
          แผนกที่เกินหรือยังว่างอยู่ด้านบน · แผนกครบพอดีอยู่ด้านล่าง (เรียง A–Z)
        </p>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {departmentFill.map((item) => (
            <DepartmentFillCard
              key={item.code}
              item={item}
              expanded={expandedDepartmentId === item.departmentId}
              onToggle={() =>
                setExpandedDepartmentId((current) =>
                  current === item.departmentId ? null : item.departmentId,
                )
              }
            />
          ))}
        </div>
      </section>

      <ResultsDashboard
        round={round}
        assignments={assignments}
        waitlist={waitlist}
        departments={departments}
        preferences={preferences}
        participantTotal={participantTotal}
      />

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
        <WaitlistAssignTable
          roundId={selectedRoundId}
          waitlist={waitlist}
          assignments={assignments}
          departments={departments}
          nurseNames={nurseNames}
        />

        <div className="pt-2">
          <h3 className="text-base font-semibold text-slate-900">
            รายชื่อที่จัดสรรแล้ว
          </h3>
          <div className="mt-3">
            <SettledAssignmentsTable
              assignments={assignments}
              departments={departments}
              nurseNames={nurseNames}
            />
          </div>
        </div>
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
                  จับสลากไม่ได้:{' '}
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
