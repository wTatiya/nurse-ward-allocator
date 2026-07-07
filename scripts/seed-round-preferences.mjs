/**
 * Load round preferences from JSON and sync department active flags.
 *
 * Usage:
 *   node scripts/seed-round-preferences.mjs
 *   node scripts/seed-round-preferences.mjs scripts/data/round-1-preferences.json
 */
import { createClient } from '@supabase/supabase-js'
import ws from 'ws'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function normalizeChoices(rawChoices, activeCodes) {
  const unique = []
  for (const code of rawChoices) {
    const trimmed = code?.trim()
    if (trimmed && !unique.includes(trimmed)) unique.push(trimmed)
  }

  for (const code of activeCodes) {
    if (unique.length >= 3) break
    if (!unique.includes(code)) unique.push(code)
  }

  return unique.slice(0, 3)
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

  const seedPath =
    process.argv[2] ?? join(__dirname, 'data', 'round-1-preferences.json')
  const seed = JSON.parse(readFileSync(seedPath, 'utf8'))

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: { transport: ws },
  })

  const { data: departments, error: deptError } = await supabase
    .from('departments')
    .select('id, code, is_active')

  if (deptError || !departments) {
    console.error('Failed to load departments:', deptError?.message)
    process.exit(1)
  }

  const codeToId = new Map(departments.map((d) => [d.code, d.id]))
  const activeCodes = seed.activeDepartmentCodes ?? []

  for (const code of activeCodes) {
    if (!codeToId.has(code)) {
      console.error(`Unknown active department code in seed: ${code}`)
      process.exit(1)
    }
  }

  let activated = 0
  let deactivated = 0

  for (const department of departments) {
    const shouldBeActive = activeCodes.includes(department.code)
    if (department.is_active === shouldBeActive) continue

    const { error } = await supabase
      .from('departments')
      .update({ is_active: shouldBeActive })
      .eq('id', department.id)

    if (error) {
      console.error(`Failed to update ${department.code}:`, error.message)
      process.exit(1)
    }

    if (shouldBeActive) activated += 1
    else deactivated += 1
  }

  console.log(
    `Departments: ${activeCodes.length} active, ${deactivated} marked inactive.`,
  )

  const capacities = seed.departmentCapacities ?? {}
  let capacitiesUpdated = 0

  for (const [code, capacity] of Object.entries(capacities)) {
    const departmentId = codeToId.get(code)
    if (!departmentId) {
      console.error(`Unknown department code in capacities: ${code}`)
      process.exit(1)
    }

    const parsed = Number(capacity)
    if (!Number.isInteger(parsed) || parsed < 0) {
      console.error(`Invalid capacity for ${code}: ${capacity}`)
      process.exit(1)
    }

    const { error } = await supabase
      .from('departments')
      .update({ capacity: parsed })
      .eq('id', departmentId)

    if (error) {
      console.error(`Failed to set capacity for ${code}:`, error.message)
      process.exit(1)
    }

    capacitiesUpdated += 1
    console.log(`  ${code}: ${parsed} slot(s)`)
  }

  if (capacitiesUpdated > 0) {
    console.log(`Updated capacities for ${capacitiesUpdated} department(s).`)
  }

  const roundName = seed.roundName ?? 'Round 1'
  const { data: existingRound } = await supabase
    .from('assignment_rounds')
    .select('*')
    .eq('name', roundName)
    .maybeSingle()

  let round = existingRound

  if (round) {
    const { data: updated, error: updateError } = await supabase
      .from('assignment_rounds')
      .update({ status: 'open' })
      .eq('id', round.id)
      .select('*')
      .single()

    if (updateError) {
      console.error('Failed to update round:', updateError.message)
      process.exit(1)
    }
    round = updated
    console.log(`Using existing round "${roundName}" (set to open).`)
  } else {
    const { data: created, error: createError } = await supabase
      .from('assignment_rounds')
      .insert({ name: roundName, status: 'open' })
      .select('*')
      .single()

    if (createError) {
      console.error('Failed to create round:', createError.message)
      process.exit(1)
    }
    round = created
    console.log(`Created round "${roundName}" (open).`)
  }

  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'PARTICIPANT')

  if (profileError || !profiles) {
    console.error('Failed to load participants:', profileError?.message)
    process.exit(1)
  }

  const nameToId = new Map(profiles.map((p) => [p.full_name, p.id]))
  let upserted = 0
  const warnings = []

  for (const row of seed.preferences ?? []) {
    const nurseId = nameToId.get(row.name)
    if (!nurseId) {
      warnings.push(`Participant not found: ${row.name}`)
      continue
    }

    const choices = normalizeChoices(row.choices, activeCodes)
    if (choices.length < 3) {
      warnings.push(`${row.name}: could not resolve 3 distinct choices`)
      continue
    }

    const [choice1, choice2, choice3] = choices.map((code) => codeToId.get(code))

    const { error: prefError } = await supabase.from('preferences').upsert(
      {
        round_id: round.id,
        nurse_id: nurseId,
        choice_1: choice1,
        choice_2: choice2,
        choice_3: choice3,
        submitted_at: new Date().toISOString(),
      },
      { onConflict: 'round_id,nurse_id' },
    )

    if (prefError) {
      warnings.push(`${row.name}: ${prefError.message}`)
      continue
    }

    upserted += 1
    console.log(`  ${row.name}: ${choices.join(' → ')}`)
  }

  if (warnings.length) {
    console.log('\nWarnings:')
    for (const warning of warnings) console.log(`  - ${warning}`)
  }

  console.log(`\nDone. Preferences upserted: ${upserted}/${seed.preferences?.length ?? 0}.`)
  console.log(`Round id: ${round.id}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
