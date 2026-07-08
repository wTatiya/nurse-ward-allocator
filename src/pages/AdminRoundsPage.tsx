import { useEffect, useMemo, useState } from 'react'
import {
  ensureValidSession,
  getEdgeFunctionErrorMessage,
  supabase,
} from '../lib/supabase'
import { canArchiveRound, splitRoundsByArchive } from '../lib/rounds'
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
  const [editingRoundId, setEditingRoundId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [runningId, setRunningId] = useState<string | null>(null)
  const [archivingId, setArchivingId] = useState<string | null>(null)
  const [showArchived, setShowArchived] = useState(false)

  const { active, archived } = useMemo(
    () => splitRoundsByArchive(rounds),
    [rounds],
  )

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
    setMessage('สร้างรอบเลือกตึกแล้ว')
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

    setMessage(`รอบ "${round.name}" เปลี่ยนเป็น ${formatRoundStatus(status)}`)
    await loadRounds()
  }

  const setArchiveState = async (round: AssignmentRound, archive: boolean) => {
    setError(null)
    setMessage(null)
    setArchivingId(round.id)

    const { error: updateError } = await supabase
      .from('assignment_rounds')
      .update({ archived_at: archive ? new Date().toISOString() : null })
      .eq('id', round.id)

    setArchivingId(null)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setMessage(
      archive
        ? `เก็บรอบ "${round.name}" ถาวรแล้ว — จะไม่แสดงในรายการหลัก`
        : `นำรอบ "${round.name}" กลับมาแสดงแล้ว`,
    )
    await loadRounds()
  }

  const startEditName = (round: AssignmentRound) => {
    setEditingRoundId(round.id)
    setEditName(round.name)
    setError(null)
    setMessage(null)
  }

  const cancelEditName = () => {
    setEditingRoundId(null)
    setEditName('')
  }

  const saveRoundName = async (roundId: string) => {
    const trimmed = editName.trim()
    if (!trimmed) {
      setError('ชื่อรอบต้องไม่ว่าง')
      return
    }

    setSavingName(true)
    setError(null)
    setMessage(null)

    const { error: updateError } = await supabase
      .from('assignment_rounds')
      .update({ name: trimmed })
      .eq('id', roundId)

    setSavingName(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setMessage(`เปลี่ยนชื่อรอบเป็น "${trimmed}" แล้ว`)
    cancelEditName()
    await loadRounds()
  }

  const runAssignment = async (round: AssignmentRound) => {
    setError(null)
    setMessage(null)
    setRunningId(round.id)

    const session = await ensureValidSession()
    if (!session) {
      setRunningId(null)
      setError('เซสชันหมดอายุแล้ว กรุณาออกจากระบบแล้วเข้าสู่ระบบใหม่')
      return
    }

    const { data, error: invokeError } = await supabase.functions.invoke(
      'run-assignment',
      {
        body: { roundId: round.id },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      },
    )

    setRunningId(null)

    if (invokeError) {
      setError(getEdgeFunctionErrorMessage(invokeError))
      return
    }

    if (data?.error) {
      setError(data.error)
      return
    }

    setMessage(
      `เลือกตึกแล้วเสร็จสิ้น: เลือกตึกแล้ว ${data.assigned} คน, รายการรอ ${data.waitlisted} คน, จับสลาก ${data.lotteries} ครั้ง`,
    )
    await loadRounds()
  }

  const renderRoundCard = (round: AssignmentRound, archivedRound = false) => {
    const isEditingName = editingRoundId === round.id
    const isArchiving = archivingId === round.id

    return (
      <div
        key={round.id}
        className={`rounded-xl border bg-white p-5 shadow-sm ${
          archivedRound ? 'border-slate-200 bg-slate-50' : 'border-slate-200'
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {isEditingName ? (
              <div className="space-y-2">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">
                    ชื่อรอบ
                  </span>
                  <input
                    value={editName}
                    onChange={(event) => setEditName(event.target.value)}
                    disabled={savingName}
                    className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    aria-label="แก้ไขชื่อรอบ"
                  />
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={savingName}
                    onClick={() => void saveRoundName(round.id)}
                    className="rounded-lg bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50"
                  >
                    บันทึก
                  </button>
                  <button
                    type="button"
                    disabled={savingName}
                    onClick={cancelEditName}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 disabled:opacity-50"
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-900">
                  {round.name}
                </h2>
                {!archivedRound && (
                  <button
                    type="button"
                    onClick={() => startEditName(round)}
                    className="text-sm text-teal-700 hover:underline"
                  >
                    แก้ไขชื่อ
                  </button>
                )}
              </div>
            )}
            <p className="text-sm text-slate-600">
              สถานะ: {formatRoundStatus(round.status)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!archivedRound && round.status === 'draft' && (
              <button
                type="button"
                onClick={() => void updateStatus(round, 'open')}
                className="rounded-lg bg-teal-700 px-3 py-2 text-sm text-white"
              >
                {formatRoundStatus('open')}
              </button>
            )}
            {!archivedRound && round.status === 'open' && (
              <button
                type="button"
                onClick={() => void updateStatus(round, 'closed')}
                className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-white"
              >
                {formatRoundStatus('closed')}
              </button>
            )}
            {!archivedRound && round.status === 'closed' && (
              <button
                type="button"
                disabled={runningId === round.id}
                onClick={() => void runAssignment(round)}
                className="rounded-lg bg-amber-600 px-3 py-2 text-sm text-white disabled:bg-slate-300"
              >
                {runningId === round.id
                  ? `${formatRoundStatus('running')}...`
                  : 'รันการเลือกตึก'}
              </button>
            )}
            {!archivedRound && canArchiveRound(round) && (
              <button
                type="button"
                disabled={isArchiving}
                onClick={() => void setArchiveState(round, true)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {isArchiving ? 'กำลังเก็บ...' : 'เก็บถาวร'}
              </button>
            )}
            {archivedRound && (
              <button
                type="button"
                disabled={isArchiving}
                onClick={() => void setArchiveState(round, false)}
                className="rounded-lg border border-teal-700 px-3 py-2 text-sm text-teal-700 hover:bg-teal-50 disabled:opacity-50"
              >
                {isArchiving ? 'กำลังนำกลับ...' : 'นำกลับ'}
              </button>
            )}
          </div>
        </div>
        {!archivedRound && (
          <p className="mt-3 text-xs text-slate-500">
            ขั้นตอน: {statuses.map(formatRoundStatus).join(' → ')}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">รอบเลือกตึก</h1>
      </div>

      <form
        onSubmit={createRound}
        className="flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <label className="block min-w-[16rem] flex-1">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            ชื่อรอบ
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
          สร้างรอบ
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
        {active.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
            ยังไม่มีรอบที่ใช้งานอยู่
          </p>
        ) : (
          active.map((round) => renderRoundCard(round))
        )}
      </div>

      {archived.length > 0 && (
        <section className="space-y-3">
          <button
            type="button"
            onClick={() => setShowArchived((value) => !value)}
            className="text-sm font-medium text-slate-700 hover:text-slate-900"
            aria-expanded={showArchived}
          >
            รอบที่เก็บถาวร ({archived.length}){' '}
            {showArchived ? '▲' : '▼'}
          </button>
          {showArchived && (
            <div className="space-y-4">
              {archived.map((round) => renderRoundCard(round, true))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
