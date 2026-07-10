import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { Layout } from './components/Layout'
import { StickyGitHubLink } from './components/StickyGitHubLink'
import { ProtectedRoute } from './components/ProtectedRoute'
import { defaultRouteForRole } from './lib/roles'
import { useAuth } from './hooks/useAuth'

const LoginPage = lazy(() =>
  import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })),
)
const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
)
const PreferencesPage = lazy(() =>
  import('./pages/PreferencesPage').then((m) => ({ default: m.PreferencesPage })),
)
const MyResultPage = lazy(() =>
  import('./pages/MyResultPage').then((m) => ({ default: m.MyResultPage })),
)
const AdminDepartmentsPage = lazy(() =>
  import('./pages/AdminDepartmentsPage').then((m) => ({
    default: m.AdminDepartmentsPage,
  })),
)
const AdminRoundsPage = lazy(() =>
  import('./pages/AdminRoundsPage').then((m) => ({ default: m.AdminRoundsPage })),
)
const AdminResultsPage = lazy(() =>
  import('./pages/AdminResultsPage').then((m) => ({ default: m.AdminResultsPage })),
)
const AdminPeoplePage = lazy(() =>
  import('./pages/AdminPeoplePage').then((m) => ({ default: m.AdminPeoplePage })),
)

function RouteLoading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-slate-500">
      กำลังโหลด...
    </div>
  )
}

function HomeRedirect() {
  const { role, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-500">
        กำลังโหลด...
      </div>
    )
  }
  return <Navigate to={defaultRouteForRole(role)} replace />
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <>
          <Suspense fallback={<RouteLoading />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                  <Route index element={<HomeRedirect />} />
                  <Route element={<ProtectedRoute kind="staff" />}>
                    <Route path="dashboard" element={<DashboardPage />} />
                    <Route path="results" element={<AdminResultsPage />} />
                  </Route>
                  <Route element={<ProtectedRoute kind="participant" />}>
                    <Route path="preferences" element={<PreferencesPage />} />
                    <Route path="my-result" element={<MyResultPage />} />
                  </Route>
                  <Route element={<ProtectedRoute kind="admin" />}>
                    <Route
                      path="admin/departments"
                      element={<AdminDepartmentsPage />}
                    />
                    <Route path="admin/rounds" element={<AdminRoundsPage />} />
                    <Route path="admin/results" element={<AdminResultsPage />} />
                    <Route path="admin/people" element={<AdminPeoplePage />} />
                    <Route
                      path="admin/wards"
                      element={<Navigate to="/admin/departments" replace />}
                    />
                  </Route>
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
          <StickyGitHubLink />
        </>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
