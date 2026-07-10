import { useEffect, useMemo, useState } from 'react'
import { OutcomeExplanation } from '../components/OutcomeExplanation'
import {
  WAITLIST_CONTACT_STAFF_ACTION,
  WAITLIST_OUTCOME_REASON,
} from '../lib/personalOutcome'
import { supabase } from '../lib/supabase'
import { formatRoundStatus, formatTier } from '../lib/utils'
import {
  useRealtimeAssignments,
  useRealtimeLotteryEvents,
  useRealtimeRound,
  useRealtimeRoundsList,
  useRealtimeWaitlist,
} from '../hooks/useRealtimeAssignments'
import type {
  Department,
  Preference,
  RoundStatus,
} from '../types/database'

const RESULT_ROUND_STATUSES: RoundStatus[] = ['closed', 'running', 'completed']

export function MyResultPage() {
  const [selectedRoundId, setSelectedRoundId] = useState('')
  const [departments, setDepartments] = useState<Department[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [preference, setPreference] = useState<Preference | null>(null)
  const [nurseNames, setNurseNames] = useState<Record<string, string>>({})

  const { rounds } = useRealtimeRoundsList(RESULT_ROUND_STATUSES)
  const round = useRealtimeRound(selectedRoundId || null)
  const { assignments, refetch: refetchAssignments } = useRealtimeAssignments(
    selectedRoundId || null,
  )
  const { waitlist, refetch: refetchWaitlist } = useRealtimeWaitlist(
    selectedRoundId || null,
  )
  const lotteryEvents = useRealtimeLotteryEvents(selectedRoundId || null)

  const myAssignment = useMemo(
    () =>
      userId
        ? (assignments.find((item) => item.nurse_id === userId) ?? null)
        : null,
    [assignments, userId],
  )

  const waitlistEntry = useMemo(
    () =>
      userId
        ? (waitlist.find((item) => item.nurse_id === userId) ?? null)
        : null,
    [waitlist, userId],
  )

  useEffect(() => {
    if (!selectedRoundId && rounds[0]) {
      setSelectedRoundId(rounds[0].id)
    }
  }, [rounds, selectedRoundId])

  useEffect(() => {
    const loadDepartments = async () => {
      const { data } = await supabase.from('departments').select('*').order('code')
      setDepartments((data as Department[]) ?? [])
    }

    void loadDepartments()
  }, [])

  useEffect(() => {
    const loadNames = async () => {
      const { data } = await supabase.from('profiles').select('id, full_name')
      const profiles = data ?? []
      setNurseNames(
        Object.fromEntries(profiles.map((p) => [p.id, p.full_name])),
      )
    }

    void loadNames()
  }, [])

  useEffect(() => {
    const resolve = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user || !selectedRoundId) {
        setUserId(null)
        setPreference(null)
        return
      }

      setUserId(user.id)

      const { data: preferenceData } = await supabase
        .from('preferences')
        .select('*')
        .eq('round_id', selectedRoundId)
        .eq('nurse_id', user.id)
        .maybeSingle()

      setPreference((preferenceData as Preference) ?? null)
    }

    void resolve()
  }, [selectedRoundId])

  useEffect(() => {
    if (!selectedRoundId || !round?.status) return

    if (round.status === 'running' || round.status === 'completed') {
      void refetchAssignments()
      void refetchWaitlist()
    }
  }, [round?.status, refetchAssignments, refetchWaitlist, selectedRoundId])

  useEffect(() => {
    if (!selectedRoundId || !round?.status) return
    if (round.status !== 'closed' && round.status !== 'running') return
    if (myAssignment || waitlistEntry) return

    const interval = window.setInterval(() => {
      void refetchAssignments()
      void refetchWaitlist()
    }, 3000)

    return () => {
      window.clearInterval(interval)
    }
  }, [
    myAssignment,
    refetchAssignments,
    refetchWaitlist,
    round?.status,
    selectedRoundId,
    waitlistEntry,
  ])

  const assignedDepartment = myAssignment
    ? departments.find((d) => d.id === myAssignment.department_id)
    : undefined

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">ผลการเลือกตึกแล้ว</h1>
      </div>

      {rounds.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
          ยังไม่มีรอบเลือกตึกที่เสร็จสิ้นหรือกำลังดำเนินการ
        </p>
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

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">สถานะรอบ</p>
            <p className="mt-1 text-lg font-medium text-slate-900">
              {round?.status
                ? formatRoundStatus(round.status)
                : 'กำลังโหลด...'}
            </p>

            {myAssignment ? (
              <div className="mt-4 rounded-lg bg-teal-50 p-4">
                <p className="text-sm text-teal-800">คุณเลือกตึกแล้วที่</p>
                <p className="text-xl font-semibold text-teal-900">
                  {assignedDepartment
                    ? `${assignedDepartment.code} — ${assignedDepartment.name_th}`
                    : 'ไม่ทราบตึก'}
                </p>
                <p className="mt-1 text-sm text-teal-700">
                  เลือกตึกแล้วผ่าน{formatTier(myAssignment.matched_tier)}
                </p>
              </div>
            ) : waitlistEntry ? (
              <div className="mt-4 rounded-lg bg-amber-50 p-4">
                <p className="text-sm text-amber-800">{WAITLIST_OUTCOME_REASON}</p>
                <p className="mt-2 text-xl font-semibold text-amber-900">
                  {WAITLIST_CONTACT_STAFF_ACTION}
                </p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-600">
                {round?.status === 'completed'
                  ? 'ไม่พบผลการเลือกตึกแล้วของคุณในรอบนี้'
                  : 'ยังไม่ประกาศผลการเลือกตึกแล้ว'}
              </p>
            )}

            {userId && (
              <OutcomeExplanation
                userId={userId}
                round={round}
                preference={preference}
                assignment={myAssignment}
                waitlistEntry={waitlistEntry}
                lotteryEvents={lotteryEvents}
                departments={departments}
                nurseNames={nurseNames}
              />
            )}
          </div>
        </>
      )}
    </div>
  )
}
