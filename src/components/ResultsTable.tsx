import type { Assignment, Department } from '../types/database'
import { formatTier } from '../lib/utils'

interface ResultsTableProps {
  assignments: Assignment[]
  departments: Department[]
  nurseNames?: Record<string, string>
}

export function ResultsTable({
  assignments,
  departments,
  nurseNames = {},
}: ResultsTableProps) {
  const departmentMap = Object.fromEntries(
    departments.map((department) => [
      department.id,
      `${department.code} — ${department.name_th}`,
    ]),
  )

  if (assignments.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
        ยังไม่มีผลการเลือกตึกแล้ว
      </p>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-slate-600">
              พยาบาล
            </th>
            <th className="px-4 py-3 text-left font-medium text-slate-600">
              ตึก
            </th>
            <th className="px-4 py-3 text-left font-medium text-slate-600">
              อันดับที่เลือกตึกแล้ว
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
                {departmentMap[assignment.department_id] ??
                  assignment.department_id}
              </td>
              <td className="px-4 py-3">{formatTier(assignment.matched_tier)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
