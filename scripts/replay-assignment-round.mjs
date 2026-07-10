/**
 * Offline replay: run assignment engine against seed or exported fixture.
 *
 * Usage:
 *   node scripts/replay-assignment-round.mjs
 *   node scripts/replay-assignment-round.mjs path/to/replay-fixture.json
 *
 * See docs/verification/replay-assignment-round.md for export steps.
 */
import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

function runVitestReplay() {
  const result = spawnSync(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['vitest', 'run', 'src/lib/replay-assignment.test.ts'],
    { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' },
  )
  if (result.status !== 0) process.exit(result.status ?? 1)
}

function loadFixture(path) {
  if (!existsSync(path)) {
    console.error(`Fixture not found: ${path}`)
    process.exit(1)
  }
  return JSON.parse(readFileSync(path, 'utf8'))
}

function summarizeFixture(fixture) {
  const wardCount = fixture.wards?.length ?? 0
  const prefCount = fixture.preferences?.length ?? 0
  const hasExpected = Boolean(fixture.expected)
  console.log('=== Replay fixture ===')
  console.log(`Round: ${fixture.roundId ?? 'unknown'}`)
  console.log(`Wards: ${wardCount}, Preferences: ${prefCount}`)
  console.log(`Expected snapshot: ${hasExpected ? 'yes (diff in vitest)' : 'no'}`)
}

function main() {
  const fixturePath = process.argv[2]
    ? join(process.cwd(), process.argv[2])
    : join(__dirname, 'data', 'round-1-preferences.json')

  if (fixturePath.endsWith('round-1-preferences.json')) {
    console.log('Using round-1-preferences.json seed shape (engine test harness).\n')
  } else {
    summarizeFixture(loadFixture(fixturePath))
    process.env.REPLAY_FIXTURE_PATH = fixturePath
  }

  console.log('Running engine replay via vitest...\n')
  runVitestReplay()
  console.log('\nDone. See docs/verification/replay-assignment-round.md for production export.')
}

main()
