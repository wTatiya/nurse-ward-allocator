import { formatTier } from '../lib/utils'
import {
  LOTTERY_METHOD_STEPS,
  formatParticipantName,
} from '../lib/lotteryDisplay'
import type { LotteryEvent } from '../types/database'

interface LotteryDetailCardProps {
  event: LotteryEvent
  departmentLabel: string
  nurseNames: Record<string, string>
  currentUserId: string
}

export function LotteryDetailCard({
  event,
  departmentLabel,
  nurseNames,
  currentUserId,
}: LotteryDetailCardProps) {
  const notSelectedCount =
    event.applicant_ids.length - event.winner_ids.length

  return (
    <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
      <p className="font-medium text-slate-900">
        ผลการจับสลาก: {departmentLabel} — {formatTier(event.tier)}
      </p>
      <p className="mt-1 text-slate-600">
        ตำแหน่งว่าง {event.slots} ตำแหน่ง | ผู้สมัคร {event.applicant_ids.length}{' '}
        คน | ได้รับเลือก {event.winner_ids.length} คน
      </p>

      <div className="mt-3">
        <p className="font-medium text-teal-800">
          ได้รับเลือก ({event.winner_ids.length})
        </p>
        <ul className="mt-1 list-inside list-disc text-slate-700">
          {event.winner_ids.map((id) => (
            <li key={id}>
              {formatParticipantName(id, nurseNames, currentUserId)}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-3">
        <p className="font-medium text-amber-800">
          ไม่ได้รับเลือก ({notSelectedCount})
        </p>
        <ul className="mt-1 list-inside list-disc text-slate-700">
          {event.applicant_ids
            .filter((id) => !event.winner_ids.includes(id))
            .map((id) => (
              <li key={id}>
                {formatParticipantName(id, nurseNames, currentUserId)}
              </li>
            ))}
        </ul>
      </div>

      <p className="mt-3 break-all text-xs text-slate-500">
        รหัสตรวจสอบ (seed hash): {event.seed_hash}
      </p>
    </div>
  )
}

export function LotteryMethodExplanation() {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
      <p className="font-medium text-slate-900">วิธีการจับสลาก (แบบสุ่มอย่างเป็นธรรม)</p>
      <ol className="mt-2 list-decimal space-y-1 pl-5">
        {LOTTERY_METHOD_STEPS.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </div>
  )
}
