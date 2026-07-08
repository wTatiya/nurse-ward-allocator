import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { defaultRouteForRole } from '../lib/roles'

export function LoginPage() {
  const { user, role, signIn } = useAuth()
  const [nurseId, setNurseId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (user) {
    return <Navigate to={defaultRouteForRole(role)} replace />
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setLoading(true)

    const signInError = await signIn(nurseId, password)
    if (signInError) setError(signInError)

    setLoading(false)
  }

  const disabled = loading || nurseId.length !== 7 || password.length < 7

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          ระบบเลือกตึกหอผู้ป่วย
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          กรอกรหัส 7 หลักและรหัสผ่านเพื่อเข้าสู่ระบบ
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              รหัส 7 หลัก
            </span>
            <input
              type="text"
              inputMode="numeric"
              pattern="\d{7}"
              maxLength={7}
              required
              autoComplete="username"
              placeholder="1234567"
              value={nurseId}
              onChange={(event) =>
                setNurseId(event.target.value.replace(/\D/g, '').slice(0, 7))
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm tracking-widest"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              รหัสผ่าน
            </span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={disabled}
            className="w-full rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:bg-slate-300"
          >
            {loading ? 'กรุณารอสักครู่...' : 'เข้าสู่ระบบ'}
          </button>
        </form>
      </div>
    </div>
  )
}
