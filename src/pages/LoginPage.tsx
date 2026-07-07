import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function LoginPage() {
  const { user, role, signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (user) {
    return (
      <Navigate to={role === 'admin' ? '/admin/rounds' : '/preferences'} replace />
    )
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    if (mode === 'signin') {
      const signInError = await signIn(email, password)
      if (signInError) setError(signInError)
    } else {
      const signUpError = await signUp(email, password, fullName)
      if (signUpError) {
        setError(signUpError)
      } else {
        setMessage('Account created. You can sign in now.')
        setMode('signin')
      }
    }

    setLoading(false)
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          Nurse Ward Allocator
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {mode === 'signin'
            ? 'Sign in to submit preferences or manage assignments.'
            : 'Create a nurse account to join an assignment round.'}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {mode === 'signup' && (
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Full name
              </span>
              <input
                type="text"
                required
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
          )}

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </span>
            <input
              type="password"
              required
              minLength={6}
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
          {message && (
            <p className="rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-800">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:bg-slate-300"
          >
            {loading
              ? 'Please wait...'
              : mode === 'signin'
                ? 'Sign in'
                : 'Create account'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-600">
          {mode === 'signin' ? (
            <>
              Need an account?{' '}
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="font-medium text-teal-700 hover:underline"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="font-medium text-teal-700 hover:underline"
              >
                Sign in
              </button>
            </>
          )}
        </p>

        <p className="mt-6 text-center text-xs text-slate-500">
          Admins are promoted manually in Supabase after first sign-up.
        </p>
      </div>
    </div>
  )
}
