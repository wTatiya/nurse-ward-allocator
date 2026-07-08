import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { formatRoleLabel, isAdmin, isParticipant, isStaffViewer } from '../lib/roles'

const participantLinks = [
  { to: '/preferences', label: 'เลือกตึก' },
  { to: '/my-result', label: 'ผลการเลือกตึกแล้ว' },
]

const staffLinks = [
  { to: '/dashboard', label: 'ภาพรวม' },
  { to: '/results', label: 'ผลลัพธ์' },
]

const adminLinks = [
  { to: '/admin/departments', label: 'แผนก' },
  { to: '/admin/rounds', label: 'รอบเลือกตึก' },
  { to: '/admin/people', label: 'กำลังเลือก' },
  { to: '/admin/results', label: 'ผลลัพธ์' },
]

export function Layout() {
  const { profile, role, signOut } = useAuth()
  const location = useLocation()

  const links = isAdmin(role)
    ? adminLinks
    : isStaffViewer(role)
      ? staffLinks
      : isParticipant(role)
        ? participantLinks
        : []

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-sm font-medium text-teal-700">
              ระบบเลือกตึกหอผู้ป่วย
            </p>
            <p className="text-xs text-slate-500">
              {profile?.nurse_id
                ? `รหัส ${profile.nurse_id} · ${profile.full_name}`
                : (profile?.full_name ?? 'เข้าสู่ระบบแล้ว')}
              {role ? ` · ${formatRoleLabel(role)}` : ''}
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
              ออกจากระบบ
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
