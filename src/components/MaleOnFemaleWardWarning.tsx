import type { MaleOnFemaleWardViolation } from '../lib/genderWardPolicy'

interface MaleOnFemaleWardWarningProps {
  violations: MaleOnFemaleWardViolation[]
}

export function MaleOnFemaleWardWarning({
  violations,
}: MaleOnFemaleWardWarningProps) {
  if (violations.length === 0) return null

  return (
    <section
      role="alert"
      aria-live="assertive"
      className="rounded-xl border-4 border-red-600 bg-red-50 p-5 shadow-sm"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-red-600 text-2xl font-black text-white"
          aria-hidden="true"
        >
          !
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <h2 className="text-xl font-bold tracking-tight text-red-900">
            คำเตือน— มีพยาบาลชายถูกจัดไปตึกหญิง
          </h2>

          <ul className="space-y-2">
            {violations.map((item) => (
              <li
                key={item.assignmentId}
                className="rounded-lg border border-red-300 bg-white px-4 py-3 text-sm text-red-950"
              >
                <p className="font-semibold">
                  {item.fullName}
                  {item.employeeId ? ` · รหัส ${item.employeeId}` : ''}
                </p>
                <p className="mt-1">
                  ถูกจัดไป:{' '}
                  <span className="font-medium">
                    {item.departmentCode} — {item.departmentNameTh}
                  </span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
