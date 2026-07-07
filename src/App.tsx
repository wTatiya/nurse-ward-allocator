import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { defaultRouteForRole } from './lib/roles'
import { useAuth } from './hooks/useAuth'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { PreferencesPage } from './pages/PreferencesPage'
import { MyResultPage } from './pages/MyResultPage'
import { AdminDepartmentsPage } from './pages/AdminDepartmentsPage'
import { AdminRoundsPage } from './pages/AdminRoundsPage'
import { AdminResultsPage } from './pages/AdminResultsPage'

function HomeRedirect() {
  const { role, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-500">
        Loading...
      </div>
    )
  }
  return <Navigate to={defaultRouteForRole(role)} replace />
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route index element={<HomeRedirect />} />
              <Route element={<ProtectedRoute kind="staff" />}>
                <Route path="dashboard" element={<DashboardPage />} />
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
                <Route
                  path="admin/wards"
                  element={<Navigate to="/admin/departments" replace />}
                />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
