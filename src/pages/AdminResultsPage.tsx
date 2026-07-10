import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { downloadCsv, formatRoundStatus, buildPersonLabels } from '../lib/utils'
import { useAuth } from '../hooks/useAuth'
import { isAdmin } from '../lib/roles'
import { ResultsTable } from '../components/ResultsTable'
import { ResultsDashboard } from '../components/ResultsDashboard'
import { DepartmentFillCard } from '../components/DepartmentFillCard'
import { WaitlistAssignTable } from '../components/WaitlistAssignTable'
import { SettledAssignmentsTable } from '../components/SettledAssignmentsTable'
import {
  capacityWarningLabel,
  getCapacityStatus,
} from '../lib/manualAssignment'
import { findMaleOnFemaleWardViolations } from '../lib/genderWardPolicy'
import { MaleOnFemaleWardWarning } from '../components/MaleOnFemaleWardWarning'
import {
  useRealtimeAssignments,
  useRealtimeLotteryEvents,
  useRealtimePreferences,
  useRealtimeRound,
  useRealtimeWaitlist,
} from '../hooks/useRealtimeAssignments'
import { LotteryDetailCard } from '../components/LotteryDetailCard'
import { buildChoiceRankByNurseIdFromTier } from '../lib/preferenceTier'
import { isRoundResultsPublished } from '../lib/rounds'
import type {
  AssignmentRound,
  Department,
  LotteryEvent,
  Profile,
} from '../types/database'

export function AdminResultsPage() {
  const { role } = useAuth()
  const canEdit = isAdmin(role)
  const [rounds, setRounds] = useState<AssignmentRound[]>([])
  const [selectedRoundId, setSelectedRoundId] = useState('')
  const [departments, setDepartments] = useState<Department[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [expandedDepartmentId, setExpandedDepartmentId] = useState<string | null>(
    null,
  )

  const { assignments, refetch: refetchAssignments } = useRealtimeAssignments(
    selectedRoundId || null,
  )
  const { waitlist, refetch: refetchWaitlist } = useRealtimeWaitlist(
    selectedRoundId || null,
  )
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
            .is('archived_at', null)
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

  const refreshAfterManualAssign = async () => {
    await Promise.all([refetchAssignments(), refetchWaitlist()])
  }

  const personLabels = useMemo(
    () => buildPersonLabels(profiles),
    [profiles],
  )

  const maleOnFemaleViolations = useMemo(
    () =>
      findMaleOnFemaleWardViolations({
        profiles,
        departments,
        assignments,
      }),
    [profiles, departments, assignments],
  )

  const maleOnFemaleViolationProfileIds = useMemo(
    () => new Set(maleOnFemaleViolations.map((item) => item.profileId)),
    [maleOnFemaleViolations],
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
            name: personLabels[item.nurse_id] ?? item.nurse_id,
          }))
          .sort((a, b) => a.name.localeCompare(b.name, 'th'))
        const assignedNames = assignedPeople.map((person) => person.name)
        return {
          departmentId: department.id,
          code: department.code,
          nameTh: department.name_th,
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
  }, [assignments, departments, personLabels])

  const exportAssignments = () => {
    const rows = [
      ['พยาบาล', 'ตึก', 'วันที่เลือกตึกแล้ว'],
      ...assignments.map((assignment) => [
        personLabels[assignment.nurse_id] ?? assignment.nurse_id,
        departments.find((d) => d.id === assignment.department_id)?.code ?? '',
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
        personLabels[entry.nurse_id] ?? entry.nurse_id,
      ]),
    ]
    downloadCsv('waitlist.csv', rows)
  }

  const resultsReady = isRoundResultsPublished(round)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">ผลลัพธ์</h1>
        </div>
        {resultsReady && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={exportAssignments}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
            >
              ส่งออกผลเลือกตึกแล้ว
            </button>
            <button
              type="button"
              onClick={exportWaitlist}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
            >
              ส่งออกรายการรอ
            </button>
          </div>
        )}
      </div>

      {rounds.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
          <p className="text-lg font-medium text-amber-900">
            ยังไม่มีผลการเลือกตึก
          </p>
          <p className="mt-2 text-sm text-amber-800">
            กรุณารอสักครู่ ระบบกำลังดำเนินการอยู่
            เมื่อผู้ดูแลระบบเปิดรอบและประกาศผลแล้ว หน้านี้จะอัปเดตอัตโนมัติ
          </p>
        </div>
      ) : (
        <>
          <label className="block max-w-md">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              รอบเลือกตึก
            </span>
            <select
              value={selectedRoundId}
              onChange={(event) => setSelectedRoundId(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              {rounds.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({formatRoundStatus(item.status)})
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">สถานะรอบ</p>
            <p className="mt-1 text-lg font-medium text-slate-900">
              {round?.status
                ? formatRoundStatus(round.status)
                : 'กำลังโหลด...'}
            </p>
          </div>

          {!resultsReady ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
              <p className="text-lg font-medium text-amber-900">
                ยังไม่ประกาศผลรอบนี้
              </p>
              <p className="mt-2 text-sm text-amber-800">
                กรุณารอสักครู่ ระบบกำลังดำเนินการอยู่
                {round?.status === 'running'
                  ? ' (กำลังรันการเลือกตึก)'
                  : round?.status === 'closed'
                    ? ' (ปิดรับความประสงค์แล้ว รอประกาศผล)'
                    : ''}
                {' '}
                หน้านี้จะอัปเดตอัตโนมัติเมื่อผลพร้อม
              </p>
            </div>
          ) : (
            <>
      <MaleOnFemaleWardWarning violations={maleOnFemaleViolations} />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">ตำแหน่งที่เติมแล้ว</h2>
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
        <h2 className="text-lg font-semibold text-slate-900">ผลการเลือกตึกแล้ว</h2>
        <ResultsTable
          assignments={assignments}
          departments={departments}
          nurseNames={personLabels}
          warnedNurseIds={maleOnFemaleViolationProfileIds}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">รายการรอ</h2>
        <WaitlistAssignTable
          roundId={selectedRoundId}
          waitlist={waitlist}
          assignments={assignments}
          departments={departments}
          nurseNames={personLabels}
          canEdit={canEdit}
          onAssigned={refreshAfterManualAssign}
        />

        <div className="pt-2">
          <h3 className="text-base font-semibold text-slate-900">
            รายชื่อที่เลือกตึกแล้ว
          </h3>
          <div className="mt-3">
            <SettledAssignmentsTable
              assignments={assignments}
              departments={departments}
              nurseNames={personLabels}
              canEdit={canEdit}
              onReassigned={refetchAssignments}
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
            {lotteryEvents.map((event: LotteryEvent) => {
              const department = departments.find(
                (item) => item.id === event.department_id,
              )
              const departmentLabel = department
                ? `${department.code} — ${department.name_th}`
                : event.department_id

              const choiceRankByNurseId = buildChoiceRankByNurseIdFromTier(
                event.applicant_ids,
                event.tier,
              )

              return (
                <LotteryDetailCard
                  key={event.id}
                  event={event}
                  departmentLabel={departmentLabel}
                  nurseNames={personLabels}
                  currentUserId=""
                  choiceRankByNurseId={choiceRankByNurseId}
                />
              )
            })}
          </div>
        )}
      </section>
            </>
          )}
        </>
      )}
    </div>
  )
}
