import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Truck, Route, Fuel, BarChart3 } from 'lucide-react'
import { useAuth, type UserRole } from '@/contexts/AuthContext'

interface MobileNavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  allowedRoles: UserRole[]
}

const MOBILE_NAV: MobileNavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, allowedRoles: ['fleet_manager', 'driver', 'safety_officer', 'financial_analyst'] },
  { label: 'Vehicles', href: '/vehicles', icon: Truck, allowedRoles: ['fleet_manager', 'safety_officer', 'financial_analyst'] },
  { label: 'Trips', href: '/trips', icon: Route, allowedRoles: ['fleet_manager', 'driver', 'safety_officer'] },
  { label: 'Fuel', href: '/fuel-expenses', icon: Fuel, allowedRoles: ['fleet_manager', 'driver', 'financial_analyst'] },
  { label: 'Reports', href: '/reports', icon: BarChart3, allowedRoles: ['fleet_manager', 'financial_analyst'] },
]

export function BottomNav() {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) return null

  const visibleItems = MOBILE_NAV.filter(item => item.allowedRoles.includes(user.role))

  return (
    <nav
      className="md:hidden flex items-center justify-around border-t border-surface-border bg-surface-card pb-safe"
      aria-label="Mobile navigation"
    >
      {visibleItems.map(item => {
        const Icon = item.icon
        const isActive = location.pathname === item.href ||
          (item.href !== '/dashboard' && location.pathname.startsWith(item.href))
        return (
          <NavLink
            key={item.href}
            to={item.href}
            className={`flex flex-col items-center gap-1 py-3 px-4 text-xs font-medium transition-colors duration-150
              ${isActive ? 'text-primary' : 'text-content-secondary'}`}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon className="w-5 h-5" aria-hidden="true" />
            {item.label}
          </NavLink>
        )
      })}
    </nav>
  )
}
