export function buildSeedHashParts(input: {
  roundId: string
  departmentId: string
  tier: number
  applicantIds: string[]
}): string[] {
  return [
    input.roundId,
    input.departmentId,
    String(input.tier),
    ...input.applicantIds,
  ]
}

export async function hashSeed(parts: string[]): Promise<string> {
  const data = new TextEncoder().encode(parts.join('|'))
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function buildLotterySeedHash(input: {
  roundId: string
  departmentId: string
  tier: number
  applicantIds: string[]
}): Promise<string> {
  return hashSeed(buildSeedHashParts(input))
}
