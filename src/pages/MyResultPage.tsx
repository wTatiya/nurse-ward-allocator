import { useEffect, useState } from 'react'
import { OutcomeExplanation } from '../components/OutcomeExplanation'
import { supabase } from '../lib/supabase'
import { formatRoundStatus, formatTier } from '../lib/utils'
import {
  useRealtimeAssignments,
  useRealtimeLotteryEvents,
  useRealtimeRound,
  useRealtimeWaitlist,
} from '../hooks/useRealtimeAssignments'
import type {
  Assignment,
  AssignmentRound,
  Department,
  Preference,
  WaitlistEntry,
} from '../types/database'

export function MyResultPage() {
  const [rounds, setRounds] = useState<AssignmentRound[]>([])
  const [selectedRoundId, setSelectedRoundId] = useState('')
  const [departments, setDepartments] = useState<Department[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [preference, setPreference] = useState<Preference | null>(null)
  const [myAssignment, setMyAssignment] = useState<Assignment | null>(null)
  const [waitlistEntry, setWaitlistEntry] = useState<WaitlistEntry | null>(null)
  const [nurseNames, setNurseNames] = useState<Record<string, string>>({})

  const round = useRealtimeRound(selectedRoundId || null)
  const assignments = useRealtimeAssignments(selectedRoundId || null)
  const waitlist = useRealtimeWaitlist(selectedRoundId || null)
  const lotteryEvents = useRealtimeLotteryEvents(selectedRoundId || null)

  useEffect(() => {
    const load = async () => {
      const [{ data: roundData }, { data: departmentData }] = await Promise.all([
        supabase
          .from('assignment_rounds')
          .select('*')
          .in('status', ['closed', 'running', 'completed'])
          .order('created_at', { ascending: false }),
        supabase.from('departments').select('*').order('code'),
      ])

      const nextRounds = (roundData as AssignmentRound[]) ?? []
      setRounds(nextRounds)
      setDepartments((departmentData as Department[]) ?? [])
      if (!selectedRoundId && nextRounds[0]) {
        setSelectedRoundId(nextRounds[0].id)
      }
    }

    void load()
  }, [selectedRoundId])

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
        setMyAssignment(null)
        setWaitlistEntry(null)
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
      setMyAssignment(
        assignments.find((item) => item.nurse_id === user.id) ?? null,
      )
      setWaitlistEntry(
        waitlist.find((item) => item.nurse_id === user.id) ?? null,
      )
    }

    void resolve()
  }, [assignments, waitlist, selectedRoundId])

  const assignedDepartment = myAssignment
    ? departments.find((d) => d.id === myAssignment.department_id)
    : undefined

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">ผลการจัดสรร</h1>
        <p className="mt-1 text-sm text-slate-600">
          ดูผลการจัดสรรและคำอธิบายทีละขั้นตอนว่าการจับสลากทำงานอย่างไรสำหรับความประสงค์ของคุณ
        </p>
      </div>

      {rounds.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
          ยังไม่มีรอบจัดสรรที่เสร็จสิ้นหรือกำลังดำเนินการ
        </p>
      ) : (
        <>
          <label className="block max-w-md">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              รอบจัดสรร
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
                <p className="text-sm text-teal-800">คุณได้รับจัดสรรไปที่</p>
                <p className="text-xl font-semibold text-teal-900">
                  {assignedDepartment
                    ? `${assignedDepartment.code} — ${assignedDepartment.name_th}`
                    : 'ไม่ทราบแผนก'}
                </p>
                <p className="mt-1 text-sm text-teal-700">
                  จัดสรรผ่าน{formatTier(myAssignment.matched_tier)}
                </p>
              </div>
            ) : waitlistEntry ? (
              <div className="mt-4 rounded-lg bg-amber-50 p-4">
                <p className="text-sm text-amber-800">
                  คุณอยู่ในรายการรอ
                </p>
                <p className="text-xl font-semibold text-amber-900">
                  ลำดับที่ #{waitlistEntry.position}
                </p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-600">
                {round?.status === 'completed'
                  ? 'ไม่พบผลการจัดสรรของคุณในรอบนี้'
                  : 'ยังไม่ประกาศผลการจัดสรร'}
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
