import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const nurseLinks = [
  { to: '/preferences', label: 'Preferences' },
  { to: '/my-result', label: 'My Result' },
]

const adminLinks = [
  { to: '/admin/wards', label: 'Wards' },
  { to: '/admin/rounds', label: 'Rounds' },
  { to: '/admin/results', label: 'Results' },
]

export function Layout() {
  const { profile, role, signOut } = useAuth()
  const location = useLocation()
  const links = role === 'admin' ? adminLinks : nurseLinks

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-sm font-medium text-teal-700">
              Nurse Ward Allocator
            </p>
            <p className="text-xs text-slate-500">
              {profile?.full_name ?? 'Signed in'}
            </p>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  location.pathname.startsWith(link.to)
                    ? 'bg-teal-100 text-teal-900'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => void signOut()}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Sign out
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
