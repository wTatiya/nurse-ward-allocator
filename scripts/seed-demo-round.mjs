/**
 * Create a demo assignment round for testing (open by default).
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-demo-round.mjs
 *
 * Optional:
 *   DEMO_ROUND_NAME="Demo Round (July 2026)"
 *   DEMO_ROUND_STATUS=open|draft|closed
 *   DEMO_SAMPLE_PREFERENCES=8   (0 to skip sample submissions)
 */
import { createClient } from '@supabase/supabase-js'
import ws from 'ws'

const DEFAULT_ROUND_NAME = 'Demo Round (July 2026)'

function rotateChoices(departments, index) {
  const count = departments.length
  const offset = index % count
  return [
    departments[offset].id,
    departments[(offset + 1) % count].id,
    departments[(offset + 2) % count].id,
  ]
}

async function main() {
  const url = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    console.error(
      'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment.',
    )
    process.exit(1)
  }

  const roundName = process.env.DEMO_ROUND_NAME ?? DEFAULT_ROUND_NAME
  const roundStatus = process.env.DEMO_ROUND_STATUS ?? 'open'
  const sampleCount = Number.parseInt(
    process.env.DEMO_SAMPLE_PREFERENCES ?? '8',
    10,
  )

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: { transport: ws },
  })

  const { data: existingRound, error: existingError } = await supabase
    .from('assignment_rounds')
    .select('*')
    .eq('name', roundName)
    .maybeSingle()

  if (existingError) {
    console.error('Failed to look up demo round:', existingError.message)
    process.exit(1)
  }

  let round = existingRound

  if (round) {
    const { data: updated, error: updateError } = await supabase
      .from('assignment_rounds')
      .update({ status: roundStatus })
      .eq('id', round.id)
      .select('*')
      .single()

    if (updateError) {
      console.error('Failed to update demo round:', updateError.message)
      process.exit(1)
    }

    round = updated
    console.log(`Demo round exists — status set to "${roundStatus}".`)
  } else {
    const { data: created, error: createError } = await supabase
      .from('assignment_rounds')
      .insert({ name: roundName, status: roundStatus })
      .select('*')
      .single()

    if (createError) {
      console.error('Failed to create demo round:', createError.message)
      process.exit(1)
    }

    round = created
    console.log(`Created demo round with status "${roundStatus}".`)
  }

  console.log(`Round id: ${round.id}`)
  console.log(`Round name: ${round.name}`)

  if (!Number.isFinite(sampleCount) || sampleCount <= 0) {
    console.log('\nSkipped sample preferences (DEMO_SAMPLE_PREFERENCES=0).')
    return
  }

  const { data: departments, error: deptError } = await supabase
    .from('departments')
    .select('id, code')
    .eq('is_active', true)
    .order('code')
    .limit(3)

  if (deptError || !departments || departments.length < 3) {
    console.error('Need at least 3 active departments for sample preferences.')
    process.exit(1)
  }

  const { data: participants, error: participantError } = await supabase
    .from('profiles')
    .select('id, full_name, nurse_id')
    .eq('role', 'PARTICIPANT')
    .not('nurse_id', 'is', null)
    .order('full_name')
    .limit(sampleCount)

  if (participantError) {
    console.error('Failed to load participants:', participantError.message)
    process.exit(1)
  }

  if (!participants?.length) {
    console.log('\nNo participants found — run scripts/seed-participants.mjs first.')
    return
  }

  let seeded = 0

  for (const [index, participant] of participants.entries()) {
    const [choice1, choice2, choice3] = rotateChoices(departments, index)

    const { error: prefError } = await supabase.from('preferences').upsert(
      {
        round_id: round.id,
        nurse_id: participant.id,
        choice_1: choice1,
        choice_2: choice2,
        choice_3: choice3,
        submitted_at: new Date().toISOString(),
      },
      { onConflict: 'round_id,nurse_id' },
    )

    if (prefError) {
      console.warn(
        `  ${participant.full_name}: preference upsert failed — ${prefError.message}`,
      )
      continue
    }

    seeded += 1
    console.log(`  Sample preference: ${participant.full_name}`)
  }

  console.log(`\nDone. Sample preferences upserted: ${seeded}.`)
  console.log('\nNext steps:')
  console.log('  1. Sign in as a participant → Preferences to try submitting.')
  console.log('  2. Sign in as admin → Rounds → Close submissions → Run assignment.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
