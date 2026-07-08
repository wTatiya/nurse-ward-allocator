import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Department } from '../types/database'

export function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [capacity, setCapacity] = useState(1)
  const [isActive, setIsActive] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const loadDepartments = async () => {
    const { data } = await supabase
      .from('departments')
      .select('*')
      .order('code')
    setDepartments((data as Department[]) ?? [])
  }

  useEffect(() => {
    void loadDepartments()
  }, [])

  const resetForm = () => {
    setEditingId(null)
    setCapacity(1)
    setIsActive(true)
    setError(null)
  }

  const startEdit = (department: Department) => {
    setEditingId(department.id)
    setCapacity(department.capacity)
    setIsActive(department.is_active)
    setMessage(null)
    setError(null)
  }

  const handleActiveChange = (checked: boolean) => {
    setIsActive(checked)
    if (!checked) {
      setCapacity(0)
    }
  }

  const handleSave = async () => {
    if (!editingId) return

    setError(null)
    setMessage(null)
    setSaving(true)

    const finalCapacity = isActive ? Number(capacity) : 0

    const { error: saveError } = await supabase
      .from('departments')
      .update({
        capacity: finalCapacity,
        is_active: isActive,
      })
      .eq('id', editingId)

    setSaving(false)

    if (saveError) {
      setError(saveError.message)
      return
    }

    setMessage('อัปเดตจำนวนตำแหน่งแล้ว')
    resetForm()
    await loadDepartments()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">แผนก</h1>
        <p className="mt-1 text-sm text-slate-600">
          แก้ไขจำนวนตำแหน่งและสถานะการใช้งานของแผนก รหัสและชื่อภาษาไทยถูกตั้งค่าไว้ล่วงหน้า
        </p>
      </div>

      {message && (
        <p className="rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-800">
          {message}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-600">
                รหัส
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">
                ชื่อแผนก
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">
                จำนวนตำแหน่ง
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">
                สถานะ
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">
                การดำเนินการ
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {departments.map((department) => {
              const isEditing = editingId === department.id

              return (
                <tr
                  key={department.id}
                  className={isEditing ? 'bg-teal-50' : undefined}
                >
                  <td className="px-4 py-3 font-mono text-xs">
                    {department.code}
                  </td>
                  <td className="px-4 py-3">{department.name_th}</td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <input
                        type="number"
                        min={0}
                        value={capacity}
                        disabled={!isActive}
                        onChange={(event) =>
                          setCapacity(Number(event.target.value))
                        }
                        className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-sm disabled:bg-slate-100 disabled:text-slate-500"
                        aria-label={`จำนวนตำแหน่ง ${department.code}`}
                      />
                    ) : (
                      department.capacity
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <label className="flex items-center gap-2 text-slate-700">
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={(event) =>
                            handleActiveChange(event.target.checked)
                          }
                        />
                        เปิดใช้งาน
                      </label>
                    ) : department.is_active ? (
                      'เปิดใช้งาน'
                    ) : (
                      'ปิดใช้งาน'
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <div className="flex flex-col gap-1">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => void handleSave()}
                            disabled={saving}
                            className="rounded-lg bg-teal-700 px-3 py-1 text-xs font-medium text-white hover:bg-teal-800 disabled:opacity-50"
                          >
                            บันทึก
                          </button>
                          <button
                            type="button"
                            onClick={resetForm}
                            disabled={saving}
                            className="rounded-lg border border-slate-300 px-3 py-1 text-xs text-slate-700 disabled:opacity-50"
                          >
                            ยกเลิก
                          </button>
                        </div>
                        {error && (
                          <p className="text-xs text-red-600">{error}</p>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEdit(department)}
                        className="text-teal-700 hover:underline"
                      >
                        แก้ไข
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
