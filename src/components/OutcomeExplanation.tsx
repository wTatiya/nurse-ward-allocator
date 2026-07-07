import { buildPersonalOutcome, outcomeStepMessage, type PersonalOutcome } from '../lib/personalOutcome'
import { formatTier } from '../lib/utils'
import {
  LotteryDetailCard,
  LotteryMethodExplanation,
} from './LotteryDetailCard'
import type {
  Assignment,
  AssignmentRound,
  Department,
  LotteryEvent,
  Preference,
  WaitlistEntry,
} from '../types/database'

interface OutcomeExplanationProps {
  userId: string
  round?: AssignmentRound | null
  preference?: Preference | null
  assignment?: Assignment | null
  waitlistEntry?: WaitlistEntry | null
  lotteryEvents: LotteryEvent[]
  departments: Department[]
  nurseNames?: Record<string, string>
}

function stepBadgeClass(result: PersonalOutcome['steps'][number]['result']) {
  switch (result) {
    case 'assigned_direct':
    case 'won_lottery':
      return 'bg-teal-100 text-teal-900'
    case 'lost_lottery':
      return 'bg-amber-100 text-amber-900'
    case 'department_full':
      return 'bg-slate-100 text-slate-700'
  }
}

function stepBadgeLabel(result: PersonalOutcome['steps'][number]['result']) {
  switch (result) {
    case 'assigned_direct':
      return 'ได้รับจัดสรร'
    case 'won_lottery':
      return 'ชนะการจับสลาก'
    case 'lost_lottery':
      return 'จับสลากไม่ได้'
    case 'department_full':
      return 'ตำแหน่งเต็ม'
  }
}

export function OutcomeExplanation({
  userId,
  round,
  preference,
  assignment,
  waitlistEntry,
  lotteryEvents,
  departments,
  nurseNames = {},
}: OutcomeExplanationProps) {
  const outcome = buildPersonalOutcome({
    userId,
    preference,
    assignment,
    waitlistEntry,
    lotteryEvents,
    departments,
    roundStatus: round?.status,
  })

  if (outcome.status === 'pending') {
    return (
      <p className="mt-4 text-sm text-slate-600">
        ยังไม่ประกาศผลการจัดสรร หลังผู้ดูแลระบบรันการจัดสรรแล้ว
        ส่วนนี้จะแสดงคำอธิบายทีละขั้นตอนว่าทำไมคุณได้รับจัดสรรหรืออยู่ในรายการรอ
      </p>
    )
  }

  if (outcome.status === 'none') {
    return (
      <p className="mt-4 text-sm text-slate-600">
        ไม่พบผลการจัดสรรของคุณในรอบนี้
      </p>
    )
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <p className="font-medium text-slate-900">วิธีการจัดสรรในรอบนี้</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>ระบบประมวลผลอันดับ 1 ของทุกคนก่อน</li>
          <li>
            หากมีผู้ต้องการแผนกมากกว่าจำนวนตำแหน่ง ระบบจะจับสลากแบบสุ่มอย่างเป็นธรรม
          </li>
          <li>ผู้ที่ยังไม่ได้รับจัดสรรจะไปที่อันดับ 2 แล้วจึงอันดับ 3</li>
          <li>
            ผู้ที่ยังไม่ได้รับจัดสรรจะเข้ารายการรอ (ผู้ที่ส่งก่อนจะได้ลำดับสูงกว่า)
          </li>
        </ol>
      </div>

      <LotteryMethodExplanation />

      <div>
        <h3 className="text-sm font-semibold text-slate-900">เส้นทางของคุณ</h3>
        <ol className="mt-3 space-y-3">
          {outcome.steps.map((step) => {
            const event = lotteryEvents.find(
              (item) =>
                item.tier === step.tier &&
                item.department_id === step.departmentId,
            )

            return (
              <li
                key={`${step.tier}-${step.departmentId}`}
                className="rounded-lg border border-slate-200 bg-white p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-slate-900">
                    {formatTier(step.tier)}: {step.departmentLabel}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${stepBadgeClass(step.result)}`}
                  >
                    {stepBadgeLabel(step.result)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  {outcomeStepMessage(step)}
                </p>
                {event && (
                  <LotteryDetailCard
                    event={event}
                    departmentLabel={step.departmentLabel}
                    nurseNames={nurseNames}
                    currentUserId={userId}
                  />
                )}
              </li>
            )
          })}
        </ol>
      </div>

      {outcome.status === 'assigned' && outcome.matchedTier && (
        <p className="text-sm text-teal-800">
          ผลสุดท้าย: จัดสรรไปที่ {outcome.assignedDepartmentLabel} ผ่าน
          {formatTier(outcome.matchedTier)}
        </p>
      )}

      {outcome.status === 'waitlisted' && outcome.waitlistPosition && (
        <p className="text-sm text-amber-800">
          ผลสุดท้าย: ทั้ง 3 อันดับไม่มีตำแหน่งว่าง
          คุณอยู่ในรายการรอลำดับที่ #{outcome.waitlistPosition}
        </p>
      )}
    </div>
  )
}
