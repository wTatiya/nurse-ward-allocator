import { describe, expect, it } from 'vitest'
import {
  buildLotterySeedHash,
  buildSeedHashParts,
  hashSeed,
} from './seedHash'

describe('seedHash', () => {
  it('builds deterministic parts without a runtime timestamp', () => {
    const parts = buildSeedHashParts({
      roundId: 'round-1',
      departmentId: 'dept-a',
      tier: 1,
      applicantIds: ['nurse-1', 'nurse-2'],
    })

    expect(parts).toEqual(['round-1', 'dept-a', '1', 'nurse-1', 'nurse-2'])
    expect(parts.some((part) => part.includes('T'))).toBe(false)
  })

  it('produces the same hash for the same inputs', async () => {
    const input = {
      roundId: 'round-1',
      departmentId: 'dept-a',
      tier: 2,
      applicantIds: ['nurse-1', 'nurse-2'],
    }

    const first = await buildLotterySeedHash(input)
    const second = await buildLotterySeedHash(input)

    expect(first).toBe(second)
    expect(first).toMatch(/^[0-9a-f]{64}$/)
  })

  it('changes hash when applicant order changes', async () => {
    const base = {
      roundId: 'round-1',
      departmentId: 'dept-a',
      tier: 1,
    }

    const first = await buildLotterySeedHash({
      ...base,
      applicantIds: ['nurse-1', 'nurse-2'],
    })
    const second = await buildLotterySeedHash({
      ...base,
      applicantIds: ['nurse-2', 'nurse-1'],
    })

    expect(first).not.toBe(second)
  })

  it('joins parts with pipe delimiter before hashing', async () => {
    const parts = ['round-1', 'dept-a', '1', 'nurse-1']
    const hash = await hashSeed(parts)

    expect(hash).toMatch(/^[0-9a-f]{64}$/)
    expect(parts.join('|')).toBe('round-1|dept-a|1|nurse-1')
  })
})
