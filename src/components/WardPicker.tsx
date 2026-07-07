import type { Department } from '../types/database'

interface DepartmentPickerProps {
  departments: Department[]
  value: string
  onChange: (departmentId: string) => void
  label: string
  disabled?: boolean
  exclude?: string[]
}

export function DepartmentPicker({
  departments,
  value,
  onChange,
  label,
  disabled,
  exclude = [],
}: DepartmentPickerProps) {
  const options = departments.filter(
    (department) =>
      department.is_active && !exclude.includes(department.id),
  )

  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </span>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200 disabled:bg-slate-100"
      >
        <option value="">เลือกแผนก</option>
        {options.map((department) => (
          <option key={department.id} value={department.id}>
            {department.code} — {department.name_th} (จำนวน{' '}
            {department.capacity} ตำแหน่ง)
          </option>
        ))}
      </select>
    </label>
  )
}

/** @deprecated Use DepartmentPicker */
export const WardPicker = DepartmentPicker
