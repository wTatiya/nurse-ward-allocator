import { useState } from 'react'
import { formatTier } from '../lib/utils'
import {
  LOTTERY_METHOD_INTRO,
  LOTTERY_METHOD_STEPS,
  formatParticipantName,
} from '../lib/lotteryDisplay'
import type { LotteryEvent } from '../types/database'

function SeedHashCopyRow({ seedHash }: { seedHash: string }) {
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState<string | null>(null)

  const handleCopy = async () => {
    setCopyError(null)
    try {
      await navigator.clipboard.writeText(seedHash)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopyError('คัดลอกไม่สำเร็จ กรุณาเลือกรหัสด้านล่างด้วยตนเอง')
    }
  }

  return (
    <div className="mt-3 border-t border-slate-200 pt-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs font-medium text-slate-600">
          รหัสตรวจสอบ (seed hash)
        </p>
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
        >
          {copied ? 'คัดลอกแล้ว' : 'คัดลอกรหัสตรวจสอบ'}
        </button>
      </div>
      <p className="mt-1 break-all font-mono text-xs text-slate-500">{seedHash}</p>
      {copyError && (
        <p className="mt-1 text-xs text-amber-700">{copyError}</p>
      )}
    </div>
  )
}

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
          จับสลากไม่ได้ ({notSelectedCount})
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

      <SeedHashCopyRow seedHash={event.seed_hash} />
    </div>
  )
}

export function LotteryMethodExplanation() {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
      <p className="font-medium text-slate-900">วิธีการจับสลาก</p>
      <p className="mt-2">{LOTTERY_METHOD_INTRO}</p>
      <ol className="mt-2 list-decimal space-y-1 pl-5">
        {LOTTERY_METHOD_STEPS.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </div>
  )
}
