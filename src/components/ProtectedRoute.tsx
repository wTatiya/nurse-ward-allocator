import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import type { UserRole } from '../types/database'

export function ProtectedRoute({ roles }: { roles?: UserRole[] }) {
  const { user, role, loading, configured } = useAuth()

  if (!configured) {
    return (
      <div className="mx-auto max-w-lg p-8 text-center">
        <h1 className="text-xl font-semibold text-slate-900">
          Supabase not configured
        </h1>
        <p className="mt-2 text-slate-600">
          Copy <code className="rounded bg-slate-200 px-1">.env.example</code> to{' '}
          <code className="rounded bg-slate-200 px-1">.env</code> and add your
          Supabase project credentials.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-500">
        Loading...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (roles && role && !roles.includes(role)) {
    return <Navigate to={role === 'admin' ? '/admin/rounds' : '/preferences'} replace />
  }

  return <Outlet />
}
