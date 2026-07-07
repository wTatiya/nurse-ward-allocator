import type { Assignment, Ward } from '../types/database'
import { formatTier } from '../lib/utils'

interface ResultsTableProps {
  assignments: Assignment[]
  wards: Ward[]
  nurseNames?: Record<string, string>
}

export function ResultsTable({
  assignments,
  wards,
  nurseNames = {},
}: ResultsTableProps) {
  const wardMap = Object.fromEntries(wards.map((ward) => [ward.id, ward.name]))

  if (assignments.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
        No assignments yet.
      </p>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-slate-600">
              Nurse
            </th>
            <th className="px-4 py-3 text-left font-medium text-slate-600">
              Ward
            </th>
            <th className="px-4 py-3 text-left font-medium text-slate-600">
              Matched tier
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {assignments.map((assignment) => (
            <tr key={assignment.id}>
              <td className="px-4 py-3">
                {nurseNames[assignment.nurse_id] ?? assignment.nurse_id}
              </td>
              <td className="px-4 py-3">
                {wardMap[assignment.ward_id] ?? assignment.ward_id}
              </td>
              <td className="px-4 py-3">{formatTier(assignment.matched_tier)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
