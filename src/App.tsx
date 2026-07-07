import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { PreferencesPage } from './pages/PreferencesPage'
import { MyResultPage } from './pages/MyResultPage'
import { AdminWardsPage } from './pages/AdminWardsPage'
import { AdminRoundsPage } from './pages/AdminRoundsPage'
import { AdminResultsPage } from './pages/AdminResultsPage'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route index element={<Navigate to="/preferences" replace />} />
              <Route path="preferences" element={<PreferencesPage />} />
              <Route path="my-result" element={<MyResultPage />} />
              <Route element={<ProtectedRoute roles={['admin']} />}>
                <Route path="admin/wards" element={<AdminWardsPage />} />
                <Route path="admin/rounds" element={<AdminRoundsPage />} />
                <Route path="admin/results" element={<AdminResultsPage />} />
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
