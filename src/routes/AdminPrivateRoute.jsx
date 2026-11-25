import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../features/auth/hooks/useAuth.js'
import { routePaths } from './routePaths.js'

export default function AdminPrivateRoute() {
  const { isAuthenticated, isAdmin } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to={routePaths.login} replace />
  }

  if (!isAdmin) {
    return <Navigate to={routePaths.dashboard} replace />
  }

  return <Outlet />
}
