import { Outlet } from 'react-router-dom'
import { usePortalTheme } from '../../features/theme/hooks/usePortalTheme.js'
import { routePaths } from '../../routes/routePaths.js'
import Header from './Header.jsx'
import Sidebar from './Sidebar.jsx'

const navigation = [{ to: routePaths.admin, label: 'Overview' }]

export default function AdminLayout() {
  const theme = usePortalTheme()

  return (
    <div className={`flex h-dvh flex-col overflow-hidden text-slate-900 dark:text-slate-100 ${theme.pageBg}`}>
      <Header title="Admin" />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
        <Sidebar items={navigation} />
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
