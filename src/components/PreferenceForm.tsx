import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { validatePreferences } from '../lib/utils'
import type { AssignmentRound, Department, Preference } from '../types/database'
import { DepartmentPicker } from './WardPicker'

interface PreferenceFormProps {
  round: AssignmentRound
  existing?: Preference | null
  onSaved: () => void
}

export function PreferenceForm({ round, existing, onSaved }: PreferenceFormProps) {
  const [departments, setDepartments] = useState<Department[]>([])
  const [choice1, setChoice1] = useState(existing?.choice_1 ?? '')
  const [choice2, setChoice2] = useState(existing?.choice_2 ?? '')
  const [choice3, setChoice3] = useState(existing?.choice_3 ?? '')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [submittedSuccessfully, setSubmittedSuccessfully] = useState(false)

  const isOpen = round.status === 'open'

  const dismissConfirmModal = () => {
    setShowConfirmModal(false)
  }

  const handleChoiceChange = (
    setter: (value: string) => void,
    value: string,
  ) => {
    setter(value)
    setSubmittedSuccessfully(false)
    setSuccess(null)
    dismissConfirmModal()
  }

  useEffect(() => {
    const loadDepartments = async () => {
      const { data } = await supabase
        .from('departments')
        .select('*')
        .eq('is_active', true)
        .order('code')
      setDepartments((data as Department[]) ?? [])
    }

    void loadDepartments()
  }, [])

  useEffect(() => {
    dismissConfirmModal()
    setSubmittedSuccessfully(false)
    setSuccess(null)
  }, [round.id])

  useEffect(() => {
    if (existing) {
      setChoice1(existing.choice_1)
      setChoice2(existing.choice_2)
      setChoice3(existing.choice_3)
    } else {
      setChoice1('')
      setChoice2('')
      setChoice3('')
      setSubmittedSuccessfully(false)
      setSuccess(null)
      dismissConfirmModal()
    }
  }, [existing])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    const validationError = validatePreferences({ choice1, choice2, choice3 })
    if (validationError) {
      setError(validationError)
      return
    }

    setSaving(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('กรุณาเข้าสู่ระบบก่อนส่งความประสงค์')
      setSaving(false)
      return
    }

    const payload = {
      round_id: round.id,
      nurse_id: user.id,
      choice_1: choice1,
      choice_2: choice2,
      choice_3: choice3,
      submitted_at: new Date().toISOString(),
    }

    const { error: saveError } = existing
      ? await supabase
          .from('preferences')
          .update(payload)
          .eq('id', existing.id)
      : await supabase.from('preferences').insert(payload)

    setSaving(false)

    if (saveError) {
      setError(saveError.message)
      return
    }

    setSuccess(
      existing
        ? 'อัปเดตความประสงค์แล้ว สามารถแก้ไขได้จนกว่ารอบจะปิดรับ'
        : 'ส่งความประสงค์แล้ว สามารถแก้ไขได้จนกว่ารอบจะปิดรับ',
    )
    setSubmittedSuccessfully(true)
    setShowConfirmModal(true)
    onSaved()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{round.name}</h2>
        <p className="mt-1 text-sm text-slate-600">
          กรุณาเลือกตึก 3 อันดับที่ไม่ซ้ำกัน การส่งความประสงค์จะเปิดอยู่จนกว่าผู้ดูแลระบบจะปิดรอบ
        </p>
      </div>

      <DepartmentPicker
        label="อันดับ 1"
        departments={departments}
        value={choice1}
        onChange={(value) => handleChoiceChange(setChoice1, value)}
        disabled={!isOpen}
        exclude={[choice2, choice3]}
      />
      <DepartmentPicker
        label="อันดับ 2"
        departments={departments}
        value={choice2}
        onChange={(value) => handleChoiceChange(setChoice2, value)}
        disabled={!isOpen}
        exclude={[choice1, choice3]}
      />
      <DepartmentPicker
        label="อันดับ 3"
        departments={departments}
        value={choice3}
        onChange={(value) => handleChoiceChange(setChoice3, value)}
        disabled={!isOpen}
        exclude={[choice1, choice2]}
      />

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-800">
          {success}
        </p>
      )}

      <button
        type="submit"
        disabled={!isOpen || saving || submittedSuccessfully}
        className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
      >
        {saving ? 'กำลังบันทึก...' : submittedSuccessfully ? 'ส่งแล้ว' : 'ยืนยัน'}
      </button>

      {!isOpen && (
        <p className="text-sm text-amber-700">
          รอบนี้ยังไม่มีตึกที่เปิดรับ
        </p>
      )}

      {showConfirmModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="preference-confirm-title"
        >
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-teal-700">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-6 w-6"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h3
              id="preference-confirm-title"
              className="text-center text-lg font-semibold text-slate-900"
            >
              ส่งความประสงค์เรียบร้อยแล้ว
            </h3>
            <p className="mt-2 text-center text-sm text-slate-600">
              บันทึกตึก 3 อันดับของคุณแล้ว สามารถแก้ไขได้จนกว่ารอบจะปิดรับ
            </p>
            <button
              type="button"
              onClick={dismissConfirmModal}
              className="mt-6 w-full rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
            >
              ตกลง
            </button>
          </div>
        </div>
      )}
    </form>
  )
}
