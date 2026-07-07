import { useState } from 'react'

export interface DepartmentFillItem {
  departmentId: string
  code: string
  label: string
  assigned: number
  capacity: number
  remaining: number
  isFull: boolean
  assignedNames: string[]
  assignedPeople: { id: string; name: string }[]
}

interface DepartmentFillCardProps {
  item: DepartmentFillItem
  expanded: boolean
  onToggle: () => void
}

function CopyNamesButton({ names }: { names: string[] }) {
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState<string | null>(null)

  const handleCopy = async (event: React.MouseEvent) => {
    event.stopPropagation()
    setCopyError(null)
    try {
      await navigator.clipboard.writeText(names.join('\n'))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopyError('คัดลอกไม่สำเร็จ')
    }
  }

  return (
    <div className="mt-3 border-t border-slate-300/60 pt-3" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={(event) => void handleCopy(event)}
        disabled={names.length === 0}
        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
      >
        {copied ? 'คัดลอกแล้ว' : 'คัดลอกรายชื่อ'}
      </button>
      {copyError && (
        <p className="mt-1 text-xs text-amber-700">{copyError}</p>
      )}
    </div>
  )
}

export function DepartmentFillCard({
  item,
  expanded,
  onToggle,
}: DepartmentFillCardProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-full rounded-xl border p-4 text-left shadow-sm transition-shadow hover:shadow-md ${
        item.isFull
          ? 'border-green-300 bg-green-50'
          : 'border-red-200 bg-red-50'
      } ${expanded ? 'ring-2 ring-teal-400' : ''}`}
    >
      <p
        className={`font-medium ${
          item.isFull ? 'text-green-900' : 'text-red-900'
        }`}
      >
        {item.label}
        {item.isFull && (
          <span className="ml-2 rounded-full bg-green-200 px-2 py-0.5 text-xs font-medium text-green-900">
            เต็ม
          </span>
        )}
      </p>
      <p
        className={`mt-1 text-sm ${
          item.isFull ? 'text-green-800' : 'text-red-800'
        }`}
      >
        เติมแล้ว {item.assigned} / {item.capacity} ตำแหน่ง
        {item.isFull ? ' (ครบแล้ว)' : ` (ว่าง ${item.remaining} ตำแหน่ง)`}
      </p>
      <p className="mt-1 text-xs text-slate-500">
        {expanded ? 'คลิกเพื่อซ่อนรายชื่อ' : 'คลิกเพื่อดูรายชื่อ'}
      </p>
      <div
        className={`mt-2 h-2 overflow-hidden rounded-full ${
          item.isFull ? 'bg-green-100' : 'bg-red-100'
        }`}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            item.isFull ? 'bg-green-600' : 'bg-red-400'
          }`}
          style={{
            width: `${
              item.capacity > 0
                ? Math.round((item.assigned / item.capacity) * 100)
                : 0
            }%`,
          }}
        />
      </div>

      {expanded && (
        <div className="mt-3 text-sm" onClick={(e) => e.stopPropagation()}>
          <p className="font-medium text-slate-800">
            ผู้ได้รับจัดสรร ({item.assignedPeople.length})
          </p>
          {item.assignedPeople.length === 0 ? (
            <p className="mt-2 text-slate-600">ยังไม่มีผู้ได้รับจัดสรร</p>
          ) : (
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-slate-700">
              {item.assignedPeople.map((person) => (
                <li key={person.id}>{person.name}</li>
              ))}
            </ol>
          )}
          <CopyNamesButton names={item.assignedNames} />
        </div>
      )}
    </button>
  )
}
