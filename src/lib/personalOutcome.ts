import type {
  Assignment,
  Department,
  LotteryEvent,
  Preference,
  WaitlistEntry,
} from '../types/database'

export type OutcomeStepResult =
  | 'assigned_direct'
  | 'won_lottery'
  | 'lost_lottery'
  | 'department_full'

export interface OutcomeStep {
  tier: 1 | 2 | 3
  departmentId: string
  departmentLabel: string
  capacity: number
  result: OutcomeStepResult
  lottery?: {
    applicants: number
    slots: number
    seedHash: string
    applicantIds: string[]
    winnerIds: string[]
  }
}

export interface PersonalOutcome {
  status: 'assigned' | 'waitlisted' | 'pending' | 'none'
  assignedDepartmentLabel?: string
  matchedTier?: 1 | 2 | 3
  waitlistPosition?: number
  steps: OutcomeStep[]
}

function departmentLabel(
  departmentId: string,
  departments: Department[],
): string {
  const department = departments.find((item) => item.id === departmentId)
  return department
    ? `${department.code} — ${department.name_th}`
    : 'ไม่ทราบแผนก'
}

function departmentCapacity(
  departmentId: string,
  departments: Department[],
): number {
  return departments.find((item) => item.id === departmentId)?.capacity ?? 0
}

function choiceForTier(preference: Preference, tier: 1 | 2 | 3): string {
  if (tier === 1) return preference.choice_1
  if (tier === 2) return preference.choice_2
  return preference.choice_3
}

function findLottery(
  lotteryEvents: LotteryEvent[],
  tier: 1 | 2 | 3,
  departmentId: string,
): LotteryEvent | undefined {
  return lotteryEvents.find(
    (event) => event.tier === tier && event.department_id === departmentId,
  )
}

function classifyStep(
  tier: 1 | 2 | 3,
  departmentId: string,
  userId: string,
  assignment: Assignment | undefined,
  lotteryEvents: LotteryEvent[],
  departments: Department[],
): OutcomeStep {
  const lottery = findLottery(lotteryEvents, tier, departmentId)
  const lotteryMeta = lottery
    ? {
        applicants: lottery.applicant_ids.length,
        slots: lottery.slots,
        seedHash: lottery.seed_hash,
        applicantIds: lottery.applicant_ids,
        winnerIds: lottery.winner_ids,
      }
    : undefined

  const assignedHere =
    assignment?.matched_tier === tier &&
    assignment.department_id === departmentId

  if (assignedHere) {
    const wonByLottery =
      lottery?.applicant_ids.includes(userId) &&
      lottery.winner_ids.includes(userId)

    return {
      tier,
      departmentId,
      departmentLabel: departmentLabel(departmentId, departments),
      capacity: departmentCapacity(departmentId, departments),
      result: wonByLottery ? 'won_lottery' : 'assigned_direct',
      lottery: wonByLottery ? lotteryMeta : undefined,
    }
  }

  if (lottery?.applicant_ids.includes(userId)) {
    return {
      tier,
      departmentId,
      departmentLabel: departmentLabel(departmentId, departments),
      capacity: departmentCapacity(departmentId, departments),
      result: 'lost_lottery',
      lottery: lotteryMeta,
    }
  }

  return {
    tier,
    departmentId,
    departmentLabel: departmentLabel(departmentId, departments),
    capacity: departmentCapacity(departmentId, departments),
    result: 'department_full',
  }
}

export function buildPersonalOutcome(input: {
  userId: string
  preference?: Preference | null
  assignment?: Assignment | null
  waitlistEntry?: WaitlistEntry | null
  lotteryEvents: LotteryEvent[]
  departments: Department[]
  roundStatus?: string
}): PersonalOutcome {
  const {
    userId,
    preference,
    assignment,
    waitlistEntry,
    lotteryEvents,
    departments,
    roundStatus,
  } = input

  if (!preference) {
    return {
      status: roundStatus === 'completed' ? 'none' : 'pending',
      steps: [],
    }
  }

  if (assignment) {
    const steps: OutcomeStep[] = []
    for (const tier of [1, 2, 3] as const) {
      const departmentId = choiceForTier(preference, tier)
      steps.push(
        classifyStep(
          tier,
          departmentId,
          userId,
          assignment,
          lotteryEvents,
          departments,
        ),
      )
      if (assignment.matched_tier === tier) break
    }

    return {
      status: 'assigned',
      assignedDepartmentLabel: departmentLabel(
        assignment.department_id,
        departments,
      ),
      matchedTier: assignment.matched_tier,
      steps,
    }
  }

  if (waitlistEntry) {
    const steps = ([1, 2, 3] as const).map((tier) =>
      classifyStep(
        tier,
        choiceForTier(preference, tier),
        userId,
        undefined,
        lotteryEvents,
        departments,
      ),
    )

    return {
      status: 'waitlisted',
      waitlistPosition: waitlistEntry.position,
      steps,
    }
  }

  return {
    status: roundStatus === 'completed' ? 'none' : 'pending',
    steps: [],
  }
}

export function outcomeStepMessage(step: OutcomeStep): string {
  const tierLabel =
    step.tier === 1 ? 'อันดับ 1' : step.tier === 2 ? 'อันดับ 2' : 'อันดับ 3'

  switch (step.result) {
    case 'assigned_direct':
      return `คุณได้รับจัดสรรที่แผนกนี้จากความประสงค์${tierLabel} ผู้ที่ต้องการแผนกนี้ในขั้นตอนนี้ได้รับครบทุกคน (ไม่ต้องจับสลาก)`
    case 'won_lottery':
      return `คุณชนะการจับสลากสำหรับความประสงค์${tierLabel} (มีผู้สมัคร ${step.lottery?.applicants ?? 0} คน แข่งขัน ${step.lottery?.slots ?? 0} ตำแหน่ง)`
    case 'lost_lottery':
      return `คุณเข้าร่วมการจับสลากสำหรับความประสงค์${tierLabel} แต่ไม่ได้รับเลือก (มีผู้สมัคร ${step.lottery?.applicants ?? 0} คน แข่งขัน ${step.lottery?.slots ?? 0} ตำแหน่ง)`
    case 'department_full':
      return `ตำแหน่งครบ ${step.capacity} ตำแหน่งแล้วเมื่อระบบประมวลผลความประสงค์${tierLabel} ของคุณ จึงไม่สามารถจัดสรรได้ที่แผนกนี้`
  }
}
