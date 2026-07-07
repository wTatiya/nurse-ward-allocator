import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { defaultRouteForRole } from '../lib/roles'
import type { ParticipantLoginOption } from '../lib/participantAuth'

type LoginMode = 'staff' | 'participant'

export function LoginPage() {
  const { user, role, signIn, signInParticipant, loadParticipantOptions } =
    useAuth()
  const [mode, setMode] = useState<LoginMode>('participant')
  const [nurseId, setNurseId] = useState('')
  const [password, setPassword] = useState('')
  const [participantSlug, setParticipantSlug] = useState('')
  const [participantOptions, setParticipantOptions] = useState<
    ParticipantLoginOption[]
  >([])
  const [optionsLoading, setOptionsLoading] = useState(false)
  const [optionsError, setOptionsError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (mode !== 'participant') return

    setOptionsLoading(true)
    setOptionsError(null)

    loadParticipantOptions()
      .then((options) => {
        setParticipantOptions(options)
        setParticipantSlug((current) => current || options[0]?.login_slug || '')
      })
      .catch((loadError: Error) => {
        setOptionsError(loadError.message)
        setParticipantOptions([])
      })
      .finally(() => {
        setOptionsLoading(false)
      })
  }, [mode, loadParticipantOptions])

  if (user) {
    return <Navigate to={defaultRouteForRole(role)} replace />
  }

  const handleStaffSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setLoading(true)

    const signInError = await signIn(nurseId, password)
    if (signInError) setError(signInError)

    setLoading(false)
  }

  const handleParticipantSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setLoading(true)

    const signInError = await signInParticipant(participantSlug, password)
    if (signInError) setError(signInError)

    setLoading(false)
  }

  const staffDisabled = loading || nurseId.length !== 7 || password.length < 7
  const participantDisabled =
    loading ||
    optionsLoading ||
    !participantSlug ||
    password.length < 7 ||
    participantOptions.length === 0

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          Nurse Ward Allocator
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {mode === 'staff'
            ? 'Hospital staff: sign in with your 7-digit nurse ID.'
            : 'Participants: choose your full name from the list.'}
        </p>

        <div className="mt-6 flex rounded-lg border border-slate-200 p-1">
          <button
            type="button"
            onClick={() => {
              setMode('participant')
              setError(null)
            }}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${
              mode === 'participant'
                ? 'bg-teal-700 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Participant
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('staff')
              setError(null)
            }}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${
              mode === 'staff'
                ? 'bg-teal-700 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Staff
          </button>
        </div>

        {mode === 'staff' ? (
          <form onSubmit={handleStaffSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Nurse ID
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
                Password
              </span>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <span className="mt-1 block text-xs text-slate-500">
                For most staff, your password is the same as your nurse ID.
              </span>
            </label>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={staffDisabled}
              className="w-full rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:bg-slate-300"
            >
              {loading ? 'Please wait...' : 'Sign in'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleParticipantSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Full name
              </span>
              <select
                required
                value={participantSlug}
                disabled={optionsLoading || participantOptions.length === 0}
                onChange={(event) => setParticipantSlug(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                {optionsLoading ? (
                  <option value="">Loading names...</option>
                ) : participantOptions.length === 0 ? (
                  <option value="">No participant accounts yet</option>
                ) : (
                  participantOptions.map((option) => (
                    <option key={option.login_slug} value={option.login_slug}>
                      {option.full_name}
                    </option>
                  ))
                )}
              </select>
              <span className="mt-1 block text-xs text-slate-500">
                Pick the name that matches yours exactly.
              </span>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Password
              </span>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <span className="mt-1 block text-xs text-slate-500">
                Use the temporary password shared by your coordinator.
              </span>
            </label>

            {optionsError && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Could not load names: {optionsError}
              </p>
            )}
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={participantDisabled}
              className="w-full rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:bg-slate-300"
            >
              {loading ? 'Please wait...' : 'Sign in'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-slate-500">
          {mode === 'participant'
            ? '7-digit nurse IDs are not required for participants yet.'
            : 'Staff accounts are pre-provisioned by hospital administration.'}
        </p>
      </div>
    </div>
  )
}
