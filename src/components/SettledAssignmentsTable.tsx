import { useMemo, useState } from 'react'
import {
  capacityWarningLabel,
  getCapacityStatus,
  reassignParticipant,
} from '../lib/manualAssignment'
import type { Assignment, Department } from '../types/database'

interface SettledAssignmentsTableProps {
  assignments: Assignment[]
  departments: Department[]
  nurseNames: Record<string, string>
  canEdit?: boolean
  onReassigned?: () => Promise<void>
}

export function SettledAssignmentsTable({
  assignments,
  departments,
  nurseNames,
  canEdit = false,
  onReassigned,
}: SettledAssignmentsTableProps) {
  const [busyAssignmentId, setBusyAssignmentId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const activeDepartments = useMemo(
    () =>
      departments
        .filter((department) => department.is_active)
        .sort((a, b) => a.code.localeCompare(b.code, 'th')),
    [departments],
  )

  const groups = useMemo(() => {
    return activeDepartments
      .map((department) => ({
        department,
        people: assignments
          .filter((item) => item.department_id === department.id)
          .map((item) => ({
            assignmentId: item.id,
            nurseId: item.nurse_id,
            name: nurseNames[item.nurse_id] ?? item.nurse_id,
          }))
          .sort((a, b) => a.name.localeCompare(b.name, 'th')),
      }))
      .filter((group) => group.people.length > 0)
  }, [activeDepartments, assignments, nurseNames])

  const handleReassign = async (
    assignment: Assignment,
    nextDepartmentId: string,
  ) => {
    if (assignment.department_id === nextDepartmentId) return

    setBusyAssignmentId(assignment.id)
    setError(null)

    const message = await reassignParticipant({
      assignmentId: assignment.id,
      departmentId: nextDepartmentId,
    })

    setBusyAssignmentId(null)
    if (message) {
      setError(message)
      return
    }

    await onReassigned?.()
  }

  if (groups.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
        ยังไม่มีผู้เลือกตึกแล้วในรอบนี้
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {groups.map((group) => {
        const assignedCount = group.people.length
        const status = getCapacityStatus(
          assignedCount,
          group.department.capacity,
        )
        const warning = capacityWarningLabel(
          assignedCount,
          group.department.capacity,
        )

        return (
          <div
            key={group.department.id}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
              <p className="font-medium text-slate-900">
                {group.department.code} — {group.department.name_th}
              </p>
              <span className="text-sm text-slate-600">
                {assignedCount} / {group.department.capacity} ตำแหน่ง
              </span>
              {warning && (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    status === 'overflow'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {warning}
                </span>
              )}
              {status === 'exact' && (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                  ครบพอดี
                </span>
              )}
            </div>
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-white">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">
                    พยาบาล
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">
                    ตึก
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {group.people.map((person) => {
                  const assignment = assignments.find(
                    (item) => item.id === person.assignmentId,
                  )
                  if (!assignment) return null

                  const statusIfMoved = (departmentId: string) => {
                    const count =
                      assignments.filter(
                        (item) =>
                          item.department_id === departmentId &&
                          item.id !== assignment.id,
                      ).length + 1
                    const department = activeDepartments.find(
                      (item) => item.id === departmentId,
                    )
                    return department
                      ? getCapacityStatus(count, department.capacity)
                      : 'vacancy'
                  }

                  return (
                    <tr key={person.assignmentId}>
                      <td className="px-4 py-3">{person.name}</td>
                      <td className="px-4 py-3">
                        {canEdit ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <select
                              value={assignment.department_id}
                              disabled={busyAssignmentId === assignment.id}
                              onChange={(event) =>
                                void handleReassign(
                                  assignment,
                                  event.target.value,
                                )
                              }
                              className="min-w-[12rem] rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm"
                            >
                              {activeDepartments.map((department) => {
                                const optionStatus = statusIfMoved(department.id)
                                const suffix =
                                  department.id === assignment.department_id
                                    ? ''
                                    : optionStatus === 'overflow'
                                      ? ' ⚠ เกิน'
                                      : optionStatus === 'vacancy'
                                        ? ' · ว่าง'
                                        : ' · ครบ'

                                return (
                                  <option
                                    key={department.id}
                                    value={department.id}
                                  >
                                    {department.code} — {department.name_th}
                                    {department.id !== assignment.department_id
                                      ? suffix
                                      : ''}
                                  </option>
                                )
                              })}
                            </select>
                            {busyAssignmentId === assignment.id && (
                              <span className="text-xs text-slate-500">
                                กำลังบันทึก...
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-700">
                            {group.department.code} — {group.department.name_th}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      })}
    </div>
  )
}
