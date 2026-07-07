import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { defaultRouteForRole, isAdmin, isParticipant, isStaffViewer } from '../lib/roles'
import type { UserRole } from '../types/database'

type RouteKind = 'admin' | 'staff' | 'participant'

function matchesRouteKind(role: UserRole, kind: RouteKind): boolean {
  switch (kind) {
    case 'admin':
      return isAdmin(role)
    case 'staff':
      return isStaffViewer(role)
    case 'participant':
      return isParticipant(role)
  }
}

export function ProtectedRoute({ kind }: { kind?: RouteKind }) {
  const { user, role, loading, configured } = useAuth()

  if (!configured) {
    return (
      <div className="mx-auto max-w-lg p-8 text-center">
        <h1 className="text-xl font-semibold text-slate-900">
          ยังไม่ได้ตั้งค่า Supabase
        </h1>
        <p className="mt-2 text-slate-600">
          คัดลอก <code className="rounded bg-slate-200 px-1">.env.example</code>{' '}
          เป็น <code className="rounded bg-slate-200 px-1">.env</code>{' '}
          แล้วใส่ข้อมูลโปรเจกต์ Supabase ของคุณ
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-500">
        กำลังโหลด...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (kind && role && !matchesRouteKind(role, kind)) {
    return <Navigate to={defaultRouteForRole(role)} replace />
  }

  return <Outlet />
}
