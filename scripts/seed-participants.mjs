/**
 * Seed participant accounts with 7-digit nurse IDs (username = password = nurse_id).
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-participants.mjs
 */
import { createClient } from '@supabase/supabase-js'
import ws from 'ws'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const AUTH_DOMAIN = 'nurse.ward-allocator.local'

function nurseIdToEmail(nurseId) {
  return `${nurseId}@${AUTH_DOMAIN}`
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

  const seedPath = join(__dirname, 'data', 'participants-seed.json')
  const seed = JSON.parse(readFileSync(seedPath, 'utf8'))
  const participants = seed.participants ?? []

  if (participants.length === 0) {
    console.error('No participants in seed file.')
    process.exit(1)
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: { transport: ws },
  })

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
  let updated = 0

  for (const entry of participants) {
    const nurseId = String(entry.nurse_id).trim()
    const fullName = String(entry.full_name).trim()
    const email = nurseIdToEmail(nurseId)
    const password = nurseId

    if (!/^\d{7}$/.test(nurseId)) {
      console.error(`  Skip invalid nurse_id: ${nurseId}`)
      continue
    }

    console.log(`\n${nurseId} — ${fullName}`)

    let userId = emailToUserId.get(email)

    if (!userId) {
      const { data: createdUser, error: createError } =
        await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: fullName,
            staff_role: 'PARTICIPANT',
            nurse_id: nurseId,
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
      const { error: metaError } = await supabase.auth.admin.updateUserById(
        userId,
        {
          password,
          user_metadata: {
            full_name: fullName,
            staff_role: 'PARTICIPANT',
            nurse_id: nurseId,
          },
        },
      )

      if (metaError) {
        console.warn(`  Auth update warning: ${metaError.message}`)
      }
      console.log('  Auth user exists — updated password and metadata')
    }

    const { error: profileError } = await supabase.from('profiles').upsert(
      {
        id: userId,
        full_name: fullName,
        role: 'PARTICIPANT',
        nurse_id: nurseId,
        login_slug: null,
      },
      { onConflict: 'id' },
    )

    if (profileError) {
      console.error(`  Profile upsert failed: ${profileError.message}`)
      continue
    }

    updated += 1
  }

  console.log(
    `\nDone. Auth created: ${created}, profiles upserted: ${updated}.`,
  )
  console.log('Login: 7-digit ID as both username and password.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
