import type { PreferenceFormData } from '../types/database'
import { formatRoundStatus, formatTier } from './locale/th'

export { formatRoundStatus, formatTier }

export function validatePreferences(
  data: PreferenceFormData,
): string | null {
  const { choice1, choice2, choice3 } = data

  if (!choice1 || !choice2 || !choice3) {
    return 'กรุณาเลือกแผนกครบทั้ง 3 อันดับ'
  }

  const choices = [choice1, choice2, choice3]
  const unique = new Set(choices)

  if (unique.size !== 3) {
    return 'แต่ละอันดับต้องเป็นแผนกที่ไม่ซ้ำกัน'
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
