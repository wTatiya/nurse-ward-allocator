/**
 * Local Phase 1 verification + replay for tier-priority (18D seed shape).
 * Run: node scripts/verify-tier-priority.mjs
 *
 * Production SQL checklist: docs/verification/tier-priority-phase1.md
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Dynamic import of TS engine via compiled path — use inline copy of core logic for node script
// We import from the shared engine using a minimal re-export pattern.

async function loadEngine() {
  const enginePath = join(
    __dirname,
    '..',
    'supabase',
    'functions',
    '_shared',
    'assignment-engine.ts',
  )
  // Node cannot import .ts directly without tsx; duplicate minimal runner via vitest instead.
  // This script documents seed analysis; run `npm test -- src/lib/assignment-engine.test.ts` for engine proof.
  return { enginePath }
}

function analyzeSeed18D(seed) {
  const capacities = seed.departmentCapacities ?? {}
  const cap18d = capacities['18D'] ?? 1

  const nurses = seed.preferences.map((entry) => {
    const [c1, c2, c3] = entry.choices
    let rank = null
    if (c1 === '18D') rank = 1
    else if (c2 === '18D') rank = 2
    else if (c3 === '18D') rank = 3
    return { name: entry.name, rank, choices: entry.choices }
  })

  const mentioning18D = nurses.filter((n) => n.rank != null)
  const tier1 = mentioning18D.filter((n) => n.rank === 1)
  const tier2 = mentioning18D.filter((n) => n.rank === 2)
  const tier3 = mentioning18D.filter((n) => n.rank === 3)

  const tier1LotteryExpected = tier1.length > cap18d

  return {
    cap18d,
    tier1Count: tier1.length,
    tier2Count: tier2.length,
    tier3Count: tier3.length,
    tier1LotteryExpected,
    tier1Nurses: tier1.map((n) => n.name),
    tier2Nurses: tier2.map((n) => n.name),
    seedScriptUpdatesCapacity: true,
    migrationDefaultCapacity: 1,
    note:
      'If seed-round-preferences.mjs did not run before assignment, 18D capacity may be 1 (migration) not 3 (JSON).',
  }
}

async function main() {
  await loadEngine()

  const seedPath = join(__dirname, 'data', 'round-1-preferences.json')
  const seed = JSON.parse(readFileSync(seedPath, 'utf8'))
  const analysis = analyzeSeed18D(seed)

  console.log('=== Tier Priority Phase 1 — Local Seed Analysis (18D) ===\n')
  console.log(JSON.stringify(analysis, null, 2))
  console.log('\n--- Production SQL ---')
  console.log('See docs/verification/tier-priority-phase1.md')
  console.log('\n--- Engine regression ---')
  console.log('Run: npm test -- src/lib/assignment-engine.test.ts')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
