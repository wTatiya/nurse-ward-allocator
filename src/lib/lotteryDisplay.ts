import type { LotteryEvent } from '../types/database'

/** Thai explanation of how the fair lottery works (matches server-side engine). */
export const LOTTERY_METHOD_STEPS = [
  'เมื่อผู้สมัครมากกว่าตำแหน่งว่าง ระบบจะจับสลาก',
  'ใช้การสุ่มจาก crypto.getRandomValues() (สุ่มแบบปลอดภัย ไม่ใช่ Math.random)',
  'สุ่มลำดับผู้สมัครด้วย Fisher–Yates shuffle ทุกคนมีโอกาสเท่ากัน',
  'เลือกผู้ชนะตามจำนวนตำแหน่งว่างที่เหลือ',
  'บันทึกรายชื่อผู้สมัคร ผู้ได้รับเลือก และ seed hash (SHA-256) ไว้ตรวจสอบ',
] as const

export function lotteryEventsForUser(
  userId: string,
  events: LotteryEvent[],
): LotteryEvent[] {
  return events.filter(
    (event) =>
      event.applicant_ids.includes(userId) ||
      event.winner_ids.includes(userId),
  )
}

export function formatParticipantName(
  nurseId: string,
  names: Record<string, string>,
  currentUserId?: string,
): string {
  const name = names[nurseId] ?? nurseId
  return nurseId === currentUserId ? `${name} (คุณ)` : name
}

export function partitionLotteryParticipants(
  event: LotteryEvent,
  names: Record<string, string>,
  currentUserId?: string,
): { winners: string[]; notSelected: string[] } {
  const winnerSet = new Set(event.winner_ids)
  return {
    winners: event.winner_ids.map((id) =>
      formatParticipantName(id, names, currentUserId),
    ),
    notSelected: event.applicant_ids
      .filter((id) => !winnerSet.has(id))
      .map((id) => formatParticipantName(id, names, currentUserId)),
  }
}
