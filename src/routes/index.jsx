import { Navigate, Route, Routes } from 'react-router-dom'
import AdminLayout from '../components/layout/AdminLayout.jsx'
import MainLayout from '../components/layout/MainLayout.jsx'
import AdminDashboardPage from '../features/admin/pages/AdminDashboardPage.jsx'
import LoginPage from '../features/auth/pages/LoginPage.jsx'
import DashboardPage from '../features/dashboard/pages/DashboardPage.jsx'
import HistoryPage from '../features/history/pages/HistoryPage.jsx'
import AdminPrivateRoute from './AdminPrivateRoute.jsx'
import PrivateRoute from './PrivateRoute.jsx'
import PublicRoute from './PublicRoute.jsx'
import { routePaths } from './routePaths.js'

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path={routePaths.login} element={<LoginPage />} />
      </Route>

      <Route element={<PrivateRoute />}>
        <Route element={<MainLayout />}>
          <Route path={routePaths.dashboard} element={<DashboardPage />} />
          <Route path={routePaths.history} element={<HistoryPage />} />
        </Route>
      </Route>

      <Route element={<AdminPrivateRoute />}>
        <Route element={<AdminLayout />}>
          <Route path={routePaths.admin} element={<AdminDashboardPage />} />
        </Route>
      </Route>

      <Route path={routePaths.home} element={<Navigate to={routePaths.dashboard} replace />} />
      <Route path="*" element={<Navigate to={routePaths.dashboard} replace />} />
    </Routes>
  )
}
