/**
 * Seed participant accounts (name-based login until 7-digit IDs are issued).
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-participants.mjs
 *
 * Optional:
 *   PARTICIPANT_DEFAULT_PASSWORD=allocate2026
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const AUTH_DOMAIN = 'nurse.ward-allocator.local'

function slugToEmail(slug) {
  return `${slug}@${AUTH_DOMAIN}`
}

function participantSlug(index) {
  return `p-${String(index + 1).padStart(4, '0')}`
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
  const password =
    process.env.PARTICIPANT_DEFAULT_PASSWORD ?? seed.defaultPassword

  if (!password || password.length < 7) {
    console.error('Participant password must be at least 7 characters.')
    process.exit(1)
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
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

  for (const [index, fullName] of seed.participants.entries()) {
    const loginSlug = participantSlug(index)
    const email = slugToEmail(loginSlug)
    console.log(`\n${loginSlug} — ${fullName}`)

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
            login_slug: loginSlug,
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
            login_slug: loginSlug,
          },
        },
      )

      if (metaError) {
        console.warn(`  Auth update warning: ${metaError.message}`)
      }
      console.log('  Auth user exists — updated profile')
    }

    const { error: profileError } = await supabase.from('profiles').upsert(
      {
        id: userId,
        full_name: fullName,
        role: 'PARTICIPANT',
        nurse_id: null,
        login_slug: loginSlug,
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
  console.log(`Shared participant password: ${password}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
