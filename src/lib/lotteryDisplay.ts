import type { LotteryEvent } from '../types/database'

/** Thai explanation of how the fair lottery works (matches server-side engine). */
export const LOTTERY_METHOD_INTRO =
  'เมื่อจำนวนผู้สมัครมากกว่าจำนวนตำแหน่งว่าง ระบบจะดำเนินการจับสลากเพื่อคัดเลือกผู้ได้รับสิทธิ์ โดยมีขั้นตอนดังนี้'

export const LOTTERY_METHOD_STEPS = [
  'ใช้ crypto.getRandomValues() ซึ่งเป็นแหล่งกำเนิดเลขสุ่มที่มีความปลอดภัยทางคริปโตกราฟี (Cryptographically Secure Random Number Generator: CSPRNG) แทน Math.random()',
  'สุ่มลำดับผู้สมัครด้วยอัลกอริทึม Fisher–Yates Shuffle ซึ่งทำให้ผู้สมัครทุกคนมีโอกาสได้รับการเลือกอย่างเท่าเทียมกัน',
  'คัดเลือกผู้ได้รับสิทธิ์ตามจำนวนตำแหน่งว่างที่เหลือ',
  'บันทึกรายชื่อผู้สมัคร ลำดับผลการสุ่ม ผู้ได้รับเลือก วันที่และเวลาที่จับสลาก รวมถึงค่า SHA-256 ของข้อมูลการจับสลาก (Audit Hash) เพื่อใช้ตรวจสอบความถูกต้องและความครบถ้วนของข้อมูลภายหลัง',
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
