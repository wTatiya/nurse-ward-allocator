import { useState } from 'react'
import { assignFromWaitlist } from '../lib/manualAssignment'
import {
  countAfterWaitlistAssign,
  getCapacityStatus,
  waitlistProjectionBadgeLabel,
} from '../lib/assignmentCapacity'
import { visibleWaitlistEntries } from '../lib/waitlistDisplay'
import type { Assignment, Department, WaitlistEntry } from '../types/database'

interface WaitlistAssignTableProps {
  roundId: string
  waitlist: WaitlistEntry[]
  assignments: Assignment[]
  departments: Department[]
  nurseNames: Record<string, string>
  canEdit?: boolean
  onAssigned?: () => Promise<void>
}

export function WaitlistAssignTable({
  roundId,
  waitlist,
  assignments,
  departments,
  nurseNames,
  canEdit = false,
  onAssigned,
}: WaitlistAssignTableProps) {
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pendingDepartment, setPendingDepartment] = useState<
    Record<string, string>
  >({})

  const activeDepartments = departments
    .filter((department) => department.is_active)
    .sort((a, b) => a.code.localeCompare(b.code, 'th'))

  const displayWaitlist = visibleWaitlistEntries(waitlist, assignments)

  const handleAssign = async (entry: WaitlistEntry) => {
    const departmentId = pendingDepartment[entry.id]
    if (!departmentId) return

    setBusyId(entry.id)
    setError(null)

    const message = await assignFromWaitlist({
      roundId,
      waitlistEntryId: entry.id,
      nurseId: entry.nurse_id,
      departmentId,
    })

    setBusyId(null)
    if (message) {
      setError(message)
      return
    }

    await onAssigned?.()

    setPendingDepartment((current) => {
      const next = { ...current }
      delete next[entry.id]
      return next
    })
  }

  if (displayWaitlist.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
        ไม่มีผู้เข้ารับการเลือกตึกแล้วในรายการรอ
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {canEdit ? (
        <p className="text-sm text-slate-600">
          เลือกตึกจากรายการด้านหลังชื่อเพื่อเลือกตึกแล้วด้วยตนเอง (เหมาะกับการไกล่เกลี่ยแบบออฟไลน์)
          · ป้ายสถานะคำนวณ<strong className="font-medium">รวมพยาบาลคนนี้</strong>แล้ว
        </p>
      ) : (
        <p className="text-sm text-slate-600">
          รายการรอเลือกตึก (ดูอย่างเดียว — แก้ไขได้เฉพาะผู้ดูแลระบบ)
        </p>
      )}
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-600">
                ลำดับ
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">
                พยาบาล
              </th>
              {canEdit && (
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  จัดไปตึก
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayWaitlist.map((entry) => {
              const selectedDepartmentId = pendingDepartment[entry.id] ?? ''
              const selectedDepartment = activeDepartments.find(
                (department) => department.id === selectedDepartmentId,
              )
              const projectedAssigned = selectedDepartmentId
                ? countAfterWaitlistAssign(
                    selectedDepartmentId,
                    entry.nurse_id,
                    assignments,
                  )
                : 0
              const projectedStatus = selectedDepartment
                ? getCapacityStatus(
                    projectedAssigned,
                    selectedDepartment.capacity,
                  )
                : null

              return (
                <tr key={entry.id}>
                  <td className="px-4 py-3">#{entry.position}</td>
                  <td className="px-4 py-3">
                    {nurseNames[entry.nurse_id] ?? entry.nurse_id}
                  </td>
                  {canEdit && (
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={selectedDepartmentId}
                          disabled={busyId === entry.id}
                          onChange={(event) =>
                            setPendingDepartment((current) => ({
                              ...current,
                              [entry.id]: event.target.value,
                            }))
                          }
                          className="min-w-[12rem] rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm"
                        >
                          <option value="">เลือกตึก...</option>
                          {activeDepartments.map((department) => (
                            <option key={department.id} value={department.id}>
                              {department.code} — {department.name_th}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          disabled={!selectedDepartmentId || busyId === entry.id}
                          onClick={() => void handleAssign(entry)}
                          className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-800 disabled:bg-slate-300"
                        >
                          {busyId === entry.id ? 'กำลังบันทึก...' : 'ยืนยัน'}
                        </button>
                        {selectedDepartment && projectedStatus && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              projectedStatus === 'overflow'
                                ? 'bg-red-100 text-red-800'
                                : projectedStatus === 'vacancy'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {waitlistProjectionBadgeLabel(
                              projectedAssigned,
                              selectedDepartment.capacity,
                            )}
                          </span>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
