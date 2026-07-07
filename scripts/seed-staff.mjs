/**
 * One-time staff seed script (requires service role key).
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-staff.mjs
 */
import { createClient } from '@supabase/supabase-js'
import ws from 'ws'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const AUTH_DOMAIN = 'nurse.ward-allocator.local'

/** LOF ids in staff data map to a department code in that LOF. */
const LOF_TO_DEPARTMENT = {
  ER: 'ERD',
  OPD1: 'OPD_GENP',
  OPD2: 'HD',
  OPD3: 'OPD3',
  OR_LOF: 'OR',
  ICU: 'MICU',
  MED1: '22A',
  MED2: '19A',
  OBGYN: '18A',
  SUR1: '19B',
  SUR2: '18C',
  SPE: '18D',
}

function nurseIdToEmail(nurseId) {
  return `${nurseId}@${AUTH_DOMAIN}`
}

function resolveDepartmentCode(raw, knownCodes) {
  const code = raw.trim()
  if (knownCodes.has(code)) return code
  if (LOF_TO_DEPARTMENT[code]) return LOF_TO_DEPARTMENT[code]
  console.warn(`  Unknown department/LOF "${code}" — skipping link`)
  return null
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

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: { transport: ws },
  })

  const seedPath = join(__dirname, 'data', 'staff-seed.json')
  const { staff } = JSON.parse(readFileSync(seedPath, 'utf8'))

  const { data: departments, error: deptError } = await supabase
    .from('departments')
    .select('id, code')

  if (deptError) {
    console.error('Failed to load departments:', deptError.message)
    process.exit(1)
  }

  const codeToId = new Map(departments.map((d) => [d.code, d.id]))
  const knownCodes = new Set(codeToId.keys())

  const emailToUserId = new Map()
  let page = 1
  while (true) {
    const { data: listData, error: listError } =
      await supabase.auth.admin.listUsers({ page, perPage: 200 })
    if (listError) {
      console.error('Failed to list auth users:', listError.message)
      process.exit(1)
    }
    for (const user of listData.users) {
      if (user.email) emailToUserId.set(user.email, user.id)
    }
    if (listData.users.length < 200) break
    page += 1
  }

  let created = 0
  let skipped = 0
  let updated = 0

  for (const row of staff) {
    const email = nurseIdToEmail(row.username)
    console.log(`\n${row.username} — ${row.displayName} (${row.role})`)

    const existing = emailToUserId.get(email)

    let userId = existing

    if (!userId) {
      const { data: createdUser, error: createError } =
        await supabase.auth.admin.createUser({
          email,
          password: row.password,
          email_confirm: true,
          user_metadata: {
            nurse_id: row.username,
            full_name: row.displayName,
            staff_role: row.role,
          },
        })

      if (createError) {
        console.error(`  Auth create failed: ${createError.message}`)
        continue
      }

      userId = createdUser.user.id
      emailToUserId.set(email, userId)
      created += 1
      console.log('  Created auth user')
    } else {
      skipped += 1
      console.log('  Auth user exists — updating profile')

      const { error: metaError } = await supabase.auth.admin.updateUserById(
        userId,
        {
          password: row.password,
          user_metadata: {
            nurse_id: row.username,
            full_name: row.displayName,
            staff_role: row.role,
          },
        },
      )

      if (metaError) {
        console.warn(`  Auth update warning: ${metaError.message}`)
      }
    }

    const { error: profileError } = await supabase.from('profiles').upsert(
      {
        id: userId,
        nurse_id: row.username,
        full_name: row.displayName,
        role: row.role,
      },
      { onConflict: 'id' },
    )

    if (profileError) {
      console.error(`  Profile upsert failed: ${profileError.message}`)
      continue
    }

    updated += 1

    await supabase
      .from('profile_departments')
      .delete()
      .eq('profile_id', userId)

    const deptCodes = row.departments
      .flatMap((d) => d.split(',').map((s) => s.trim()))
      .map((d) => resolveDepartmentCode(d, knownCodes))
      .filter(Boolean)

    const uniqueIds = [
      ...new Set(deptCodes.map((code) => codeToId.get(code)).filter(Boolean)),
    ]

    if (uniqueIds.length === 0) {
      console.warn('  No department links resolved')
      continue
    }

    const { error: linkError } = await supabase.from('profile_departments').insert(
      uniqueIds.map((department_id) => ({
        profile_id: userId,
        department_id,
      })),
    )

    if (linkError) {
      console.error(`  Department links failed: ${linkError.message}`)
    } else {
      console.log(`  Linked ${uniqueIds.length} department(s)`)
    }
  }

  console.log(
    `\nDone. Auth created: ${created}, existing: ${skipped}, profiles upserted: ${updated}`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
