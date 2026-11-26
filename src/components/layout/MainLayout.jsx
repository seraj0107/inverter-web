import { Outlet } from 'react-router-dom'
import { usePortalTheme } from '../../features/theme/hooks/usePortalTheme.js'
import { routePaths } from '../../routes/routePaths.js'
import Header from './Header.jsx'
import PageTransition from './PageTransition.jsx'
import Sidebar from './Sidebar.jsx'

const navigation = [
  { to: routePaths.dashboard, label: 'Dashboard' },
  { to: routePaths.history, label: 'History' },
]

const pageOrder = [routePaths.dashboard, routePaths.history]

export default function MainLayout() {
  const theme = usePortalTheme()

  return (
    <div className={`flex h-dvh flex-col overflow-hidden text-slate-900 dark:text-slate-100 ${theme.pageBg}`}>
      <Header title="Inverter" />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
        <Sidebar items={navigation} />
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
          <PageTransition order={pageOrder}>
            <Outlet />
          </PageTransition>
        </main>
      </div>
    </div>
  )
}
