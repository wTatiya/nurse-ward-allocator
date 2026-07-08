import { formatRoundStatus } from '../lib/utils'
import type {
  Assignment,
  AssignmentRound,
  Department,
  Preference,
  WaitlistEntry,
} from '../types/database'

interface ResultsDashboardProps {
  round: AssignmentRound | null
  assignments: Assignment[]
  waitlist: WaitlistEntry[]
  departments: Department[]
  preferences: Preference[]
  participantTotal: number
}

function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string
  value: string | number
  hint?: string
  accent?: 'teal' | 'amber' | 'slate'
}) {
  const accentClass =
    accent === 'teal'
      ? 'text-teal-700'
      : accent === 'amber'
        ? 'text-amber-700'
        : 'text-slate-900'

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${accentClass}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  )
}

export function ResultsDashboard({
  round,
  assignments,
  waitlist,
  departments,
  preferences,
  participantTotal,
}: ResultsDashboardProps) {
  const activeDepartments = departments.filter((d) => d.is_active)
  const totalCapacity = activeDepartments.reduce((sum, d) => sum + d.capacity, 0)
  const filledSlots = assignments.length
  const fillPercent =
    totalCapacity > 0 ? Math.round((filledSlots / totalCapacity) * 100) : 0
  const submitPercent =
    participantTotal > 0
      ? Math.round((preferences.length / participantTotal) * 100)
      : 0
  const notSubmitted = Math.max(participantTotal - preferences.length, 0)

  return (
    <section className="space-y-4 rounded-xl border border-teal-200 bg-gradient-to-br from-teal-50/80 to-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            ภาพรวมแบบเรียลไทม์
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            อัปเดตอัตโนมัติเมื่อมีการเลือกตึกแล้ว การส่งเลือกตึก หรือการจับสลาก
          </p>
        </div>
        {round && (
          <div className="rounded-lg bg-white px-3 py-2 text-sm shadow-sm ring-1 ring-slate-200">
            <span className="text-slate-500">สถานะรอบ: </span>
            <span className="font-medium text-slate-900">
              {formatRoundStatus(round.status)}
            </span>
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="ส่งเลือกตึกแล้ว"
          value={`${preferences.length} / ${participantTotal}`}
          hint={`${submitPercent}% · ยังไม่ส่ง ${notSubmitted} คน`}
          accent="teal"
        />
        <StatCard
          label="เลือกตึกแล้ว"
          value={assignments.length}
          hint={`รายการรอ ${waitlist.length} คน`}
        />
        <StatCard
          label="ตำแหน่งที่เติมแล้ว"
          value={`${filledSlots} / ${totalCapacity}`}
          hint={`${fillPercent}% ของตำแหน่งเปิด`}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg bg-white p-4 ring-1 ring-slate-200">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">ความคืบหน้าการส่งเลือกตึก</span>
            <span className="text-slate-600">{submitPercent}%</span>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-teal-600 transition-all duration-500"
              style={{ width: `${submitPercent}%` }}
            />
          </div>
        </div>
        <div className="rounded-lg bg-white p-4 ring-1 ring-slate-200">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">ตำแหน่งที่เติมแล้ว</span>
            <span className="text-slate-600">{fillPercent}%</span>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-amber-500 transition-all duration-500"
              style={{ width: `${fillPercent}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
