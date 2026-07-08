import type { PreferenceFormData } from '../types/database'
import { formatPersonLabel } from './nurseIdAuth'
import { formatRoundStatus, formatTier } from './locale/th'

export { formatRoundStatus, formatTier, formatPersonLabel }

export function buildPersonLabels(
  profiles: Array<{ id: string; full_name: string; nurse_id: string | null }>,
): Record<string, string> {
  return Object.fromEntries(
    profiles.map((profile) => [
      profile.id,
      formatPersonLabel(profile.full_name, profile.nurse_id),
    ]),
  )
}

export function validatePreferences(
  data: PreferenceFormData,
): string | null {
  const { choice1, choice2, choice3 } = data

  if (!choice1 || !choice2 || !choice3) {
    return 'กรุณาเลือกตึกครบทั้ง 3 อันดับ'
  }

  const choices = [choice1, choice2, choice3]
  const unique = new Set(choices)

  if (unique.size !== 3) {
    return 'แต่ละอันดับต้องเป็นตึกที่ไม่ซ้ำกัน'
  }

  return null
}

export function downloadCsv(filename: string, rows: string[][]): void {
  const csv = rows
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','),
    )
    .join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
