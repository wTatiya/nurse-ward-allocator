import { describe, expect, it } from 'vitest'
import { statusFilterFromKey } from './useRealtimeAssignments'

describe('statusFilterFromKey', () => {
  it('rebuilds filter from serialized key', () => {
    const key = ['closed', 'running', 'completed'].join('\0')
    expect(statusFilterFromKey(key)).toEqual([
      'closed',
      'running',
      'completed',
    ])
  })

  it('returns empty filter when key is empty', () => {
    expect(statusFilterFromKey('')).toEqual([])
  })
})
