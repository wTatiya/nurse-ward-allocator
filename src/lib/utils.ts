import type { PreferenceFormData } from '../types/database'

export function validatePreferences(
  data: PreferenceFormData,
): string | null {
  const { choice1, choice2, choice3 } = data

  if (!choice1 || !choice2 || !choice3) {
    return 'All three department choices are required.'
  }

  const choices = [choice1, choice2, choice3]
  const unique = new Set(choices)

  if (unique.size !== 3) {
    return 'Each department choice must be distinct.'
  }

  return null
}

export function formatTier(tier: 1 | 2 | 3): string {
  const labels = { 1: '1st choice', 2: '2nd choice', 3: '3rd choice' }
  return labels[tier]
}

export function formatRoundStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
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
