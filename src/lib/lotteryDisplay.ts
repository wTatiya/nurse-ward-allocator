import type { LotteryEvent } from '../types/database'

/** Thai explanation of how the fair lottery works (matches server-side engine). */
export interface LotteryMethodStep {
  text: string
  code?: string
  sourceFile?: string
}

export const LOTTERY_METHOD_NOTE =
  'การจับสลากทำงานบนเซิร์ฟเวอร์ (Edge Function) — โค้ดด้านล่างมาจากระบบจริง ไม่ใช่ในเบราว์เซอร์ของผู้ใช้'

export const LOTTERY_METHOD_STEPS: LotteryMethodStep[] = [
  {
    text: 'เมื่อผู้สมัครมากกว่าตำแหน่งว่าง ระบบจะจับสลาก',
  },
  {
    text: 'ใช้การสุ่มจาก crypto.getRandomValues() (ไม่ใช่ Math.random)',
    code: `function createSecureRandom(): RandomFn {
  return () => {
    const buffer = new Uint32Array(1);
    crypto.getRandomValues(buffer);
    return buffer[0] / (0xffffffff + 1);
  };
}`,
    sourceFile: 'supabase/functions/run-assignment/index.ts',
  },
  {
    text: 'สุ่มลำดับผู้สมัครด้วย Fisher–Yates shuffle — ทุกคนมีโอกาสเท่ากัน',
    code: `function fisherYatesShuffle<T>(items: T[], random: RandomFn): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}`,
    sourceFile: 'supabase/functions/_shared/assignment-engine.ts',
  },
  {
    text: 'เลือกผู้ชนะตามจำนวนตำแหน่งว่างที่เหลือ',
    code: `function selectWinners(
  applicantIds: string[],
  slots: number,
  random: RandomFn,
): { winners: string[]; losers: string[] } {
  if (applicantIds.length <= slots) {
    return { winners: applicantIds, losers: [] }
  }
  const shuffled = fisherYatesShuffle(applicantIds, random)
  return {
    winners: shuffled.slice(0, slots),
    losers: shuffled.slice(slots),
  }
}`,
    sourceFile: 'supabase/functions/_shared/assignment-engine.ts',
  },
  {
    text: 'บันทึกรายชื่อผู้สมัคร ผู้ได้รับเลือก และ seed hash (SHA-256) ไว้ตรวจสอบ',
    code: `async function hashSeed(parts: string[]): Promise<string> {
  const data = new TextEncoder().encode(parts.join("|"));
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}`,
    sourceFile: 'supabase/functions/run-assignment/index.ts',
  },
]

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
