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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!editingId) return

    setError(null)
    setMessage(null)

    const { error: saveError } = await supabase
      .from('departments')
      .update({
        capacity: Number(capacity),
        is_active: isActive,
      })
      .eq('id', editingId)

    if (saveError) {
      setError(saveError.message)
      return
    }

    setMessage('อัปเดตจำนวนตำแหน่งแล้ว')
    resetForm()
    await loadDepartments()
  }

  const editing = departments.find((d) => d.id === editingId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">แผนก</h1>
        <p className="mt-1 text-sm text-slate-600">
          แก้ไขจำนวนตำแหน่งและสถานะการใช้งานของแผนก รหัสและชื่อภาษาไทยถูกตั้งค่าไว้ล่วงหน้า
        </p>
      </div>

      {editing && (
        <form
          onSubmit={handleSubmit}
          className="grid gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-4"
        >
          <div className="md:col-span-2">
            <p className="text-sm font-medium text-slate-700">แผนก</p>
            <p className="mt-1 font-mono text-sm text-slate-900">
              {editing.code}
            </p>
            <p className="text-sm text-slate-600">{editing.name_th}</p>
          </div>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              จำนวนตำแหน่ง
            </span>
            <input
              type="number"
              min={0}
              value={capacity}
              onChange={(event) => setCapacity(Number(event.target.value))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="flex items-end gap-2 pb-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
            />
            เปิดใช้งาน
          </label>
          <div className="md:col-span-4 flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
            >
              บันทึก
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700"
            >
              ยกเลิก
            </button>
          </div>
          {error && (
            <p className="md:col-span-4 text-sm text-red-600">{error}</p>
          )}
        </form>
      )}

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
            {departments.map((department) => (
              <tr key={department.id}>
                <td className="px-4 py-3 font-mono text-xs">
                  {department.code}
                </td>
                <td className="px-4 py-3">{department.name_th}</td>
                <td className="px-4 py-3">{department.capacity}</td>
                <td className="px-4 py-3">
                  {department.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => startEdit(department)}
                    className="text-teal-700 hover:underline"
                  >
                    แก้ไข
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
