import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Truck,
  Users,
  Route,
  Wrench,
  Fuel,
  BarChart3,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Settings,
  Zap,
} from 'lucide-react'
import { useAuth, type UserRole } from '@/contexts/AuthContext'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  allowedRoles: UserRole[]
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    allowedRoles: ['fleet_manager', 'driver', 'safety_officer', 'financial_analyst'],
  },
  {
    label: 'Vehicles',
    href: '/vehicles',
    icon: Truck,
    allowedRoles: ['fleet_manager', 'safety_officer', 'financial_analyst'],
  },
  {
    label: 'Drivers',
    href: '/drivers',
    icon: Users,
    allowedRoles: ['fleet_manager', 'safety_officer', 'driver'],
  },
  {
    label: 'Trips',
    href: '/trips',
    icon: Route,
    allowedRoles: ['fleet_manager', 'driver', 'safety_officer'],
  },
  {
    label: 'Maintenance',
    href: '/maintenance',
    icon: Wrench,
    allowedRoles: ['fleet_manager'],
  },
  {
    label: 'Fuel & Expenses',
    href: '/fuel-expenses',
    icon: Fuel,
    allowedRoles: ['fleet_manager', 'driver', 'financial_analyst'],
  },
  {
    label: 'Reports',
    href: '/reports',
    icon: BarChart3,
    allowedRoles: ['fleet_manager', 'financial_analyst'],
  },
  {
    label: 'User Management',
    href: '/admin/users',
    icon: Settings,
    allowedRoles: ['fleet_manager'],
  },
]

export function Sidebar() {
  const { user } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  if (!user) return null

  const visibleItems = NAV_ITEMS.filter(item => item.allowedRoles.includes(user.role))

  return (
    <aside
      className={`
        hidden md:flex flex-col
        bg-primary text-white shadow-sidebar
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-16' : 'w-60'}
        flex-shrink-0 relative z-20
      `}
    >
      {/* Logo */}
      <div className={`flex items-center h-16 px-4 border-b border-white/10 flex-shrink-0 ${collapsed ? 'justify-center' : 'gap-3'}`}>
        <div className="flex-shrink-0 p-1.5 rounded-lg bg-white/10">
          <Zap className="w-5 h-5 text-accent" />
        </div>
        {!collapsed && (
          <div>
            <span className="text-sm font-bold tracking-tight leading-none text-white">TransitOps</span>
            <p className="text-xs text-blue-200 leading-none mt-0.5">Fleet Control</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto" aria-label="Main navigation">
        {visibleItems.map(item => {
          const Icon = item.icon
          const isActive = location.pathname === item.href ||
            (item.href !== '/dashboard' && location.pathname.startsWith(item.href))
          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={`nav-item ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''}`}
              title={collapsed ? item.label : undefined}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="nav-item-icon" aria-hidden="true" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          )
        })}
      </nav>

      {/* Role badge at bottom */}
      {!collapsed && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
            <ShieldCheck className="w-4 h-4 text-accent flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-blue-100 truncate">
                {user.email.split('@')[0]}
              </p>
              <p className="text-xs text-blue-300 capitalize truncate">
                {user.role.replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className={`
          absolute -right-3 top-20 z-30
          w-6 h-6 rounded-full bg-white border-2 border-surface-border
          flex items-center justify-center text-primary shadow-card
          hover:shadow-card-hover transition-shadow duration-150
        `}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed
          ? <ChevronRight className="w-3 h-3" />
          : <ChevronLeft className="w-3 h-3" />
        }
      </button>
    </aside>
  )
}
