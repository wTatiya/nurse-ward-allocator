import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Ward } from '../types/database'

const emptyWard = { name: '', capacity: 1, is_active: true }

export function AdminWardsPage() {
  const [wards, setWards] = useState<Ward[]>([])
  const [form, setForm] = useState(emptyWard)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadWards = async () => {
    const { data } = await supabase.from('wards').select('*').order('name')
    setWards((data as Ward[]) ?? [])
  }

  useEffect(() => {
    void loadWards()
  }, [])

  const resetForm = () => {
    setForm(emptyWard)
    setEditingId(null)
    setError(null)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!form.name.trim()) {
      setError('Ward name is required.')
      return
    }

    const payload = {
      name: form.name.trim(),
      capacity: Number(form.capacity),
      is_active: form.is_active,
    }

    const { error: saveError } = editingId
      ? await supabase.from('wards').update(payload).eq('id', editingId)
      : await supabase.from('wards').insert(payload)

    if (saveError) {
      setError(saveError.message)
      return
    }

    resetForm()
    await loadWards()
  }

  const startEdit = (ward: Ward) => {
    setEditingId(ward.id)
    setForm({
      name: ward.name,
      capacity: ward.capacity,
      is_active: ward.is_active,
    })
  }

  const deactivate = async (ward: Ward) => {
    await supabase
      .from('wards')
      .update({ is_active: false })
      .eq('id', ward.id)
    await loadWards()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Wards</h1>
        <p className="mt-1 text-sm text-slate-600">
          Manage hospital wards and their assignment capacities.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-4"
      >
        <label className="block md:col-span-2">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Ward name
          </span>
          <input
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Capacity
          </span>
          <input
            type="number"
            min={0}
            value={form.capacity}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                capacity: Number(event.target.value),
              }))
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="flex items-end gap-2 pb-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                is_active: event.target.checked,
              }))
            }
          />
          Active
        </label>
        <div className="md:col-span-4 flex gap-2">
          <button
            type="submit"
            className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
          >
            {editingId ? 'Update ward' : 'Add ward'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700"
            >
              Cancel
            </button>
          )}
        </div>
        {error && <p className="md:col-span-4 text-sm text-red-600">{error}</p>}
      </form>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-600">
                Name
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">
                Capacity
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">
                Status
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {wards.map((ward) => (
              <tr key={ward.id}>
                <td className="px-4 py-3">{ward.name}</td>
                <td className="px-4 py-3">{ward.capacity}</td>
                <td className="px-4 py-3">
                  {ward.is_active ? 'Active' : 'Inactive'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(ward)}
                      className="text-teal-700 hover:underline"
                    >
                      Edit
                    </button>
                    {ward.is_active && (
                      <button
                        type="button"
                        onClick={() => void deactivate(ward)}
                        className="text-red-600 hover:underline"
                      >
                        Deactivate
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
