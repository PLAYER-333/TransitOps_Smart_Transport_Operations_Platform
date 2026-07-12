import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { BottomNav } from './BottomNav'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

const ROUTE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/vehicles': 'Vehicle Registry',
  '/drivers': 'Driver Management',
  '/trips': 'Trip Management',
  '/maintenance': 'Maintenance',
  '/fuel-expenses': 'Fuel & Expenses',
  '/reports': 'Reports & Analytics',
  '/admin/users': 'User Management',
}

export function AppLayout() {
  const location = useLocation()

  const pageTitle = Object.entries(ROUTE_TITLES).find(([path]) =>
    location.pathname === path || location.pathname.startsWith(path + '/')
  )?.[1] ?? ''

  return (
    <div className="flex h-screen overflow-hidden bg-surface-bg">
      {/* Sidebar — hidden on mobile */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar pageTitle={pageTitle} />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-screen-2xl mx-auto">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>

        {/* Bottom nav — mobile only */}
        <BottomNav />
      </div>
    </div>
  )
}
