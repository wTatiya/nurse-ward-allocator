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
      `เลือกตึกแล้วเสร็จสิ้น: เลือกตึกแล้ว ${data.assigned} คน, รายการรอ ${data.waitlisted} คน, จับสลาก ${data.lotteries} ครั้ง`,
    )
    await loadRounds()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">รอบเลือกตึก</h1>
        <p className="mt-1 text-sm text-slate-600">
          สร้างรอบ เปิดรับการเลือกตึกเมื่อพร้อม ปิดรับเมื่อครบ แล้วรันการเลือกตึก
        </p>
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
                <p className="text-sm text-slate-600">
                  สถานะ: {formatRoundStatus(round.status)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {round.status === 'draft' && (
                  <button
                    type="button"
                    onClick={() => void updateStatus(round, 'open')}
                    className="rounded-lg bg-teal-700 px-3 py-2 text-sm text-white"
                  >
                    ตึกที่เปิดรับ
                  </button>
                )}
                {round.status === 'open' && (
                  <button
                    type="button"
                    onClick={() => void updateStatus(round, 'closed')}
                    className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-white"
                  >
                    ปิดรับความประสงค์
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
                      ? 'กำลังเลือกตึกแล้ว...'
                      : 'รันการเลือกตึก'}
                  </button>
                )}
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              ขั้นตอน: {statuses.map(formatRoundStatus).join(' → ')}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
