import type { Ward } from '../types/database'

interface WardPickerProps {
  wards: Ward[]
  value: string
  onChange: (wardId: string) => void
  label: string
  disabled?: boolean
  exclude?: string[]
}

export function WardPicker({
  wards,
  value,
  onChange,
  label,
  disabled,
  exclude = [],
}: WardPickerProps) {
  const options = wards.filter(
    (ward) => ward.is_active && !exclude.includes(ward.id),
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
        <option value="">Select a ward</option>
        {options.map((ward) => (
          <option key={ward.id} value={ward.id}>
            {ward.name} (capacity {ward.capacity})
          </option>
        ))}
      </select>
    </label>
  )
}
