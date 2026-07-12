import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, LogOut, ChevronDown, MapPin } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const ROLE_LABELS: Record<string, string> = {
  fleet_manager: 'Fleet Manager',
  driver: 'Driver',
  safety_officer: 'Safety Officer',
  financial_analyst: 'Financial Analyst',
}

interface TopBarProps {
  pageTitle?: string
}

export function TopBar({ pageTitle }: TopBarProps) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  if (!user) return null

  const initials = user.email
    .split('@')[0]
    .slice(0, 2)
    .toUpperCase()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <header className="h-16 flex items-center px-6 bg-surface-card border-b border-surface-border flex-shrink-0 gap-4">
      {/* Page title */}
      {pageTitle && (
        <h1 className="text-heading-2 text-content-primary hidden sm:block">
          {pageTitle}
        </h1>
      )}

      <div className="flex-1" />

      {/* Region indicator */}
      {user.region && (
        <div className="hidden sm:flex items-center gap-1.5 text-caption text-content-secondary bg-surface-bg px-3 py-1.5 rounded-lg border border-surface-border">
          <MapPin className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
          <span>{user.region}</span>
        </div>
      )}

      {/* Notification bell */}
      <button className="btn-icon relative" aria-label="Notifications">
        <Bell className="w-4 h-4" />
      </button>

      {/* User menu */}
      <div className="relative">
        <button
          id="user-menu-button"
          className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl
                     hover:bg-surface-bg transition-colors duration-150"
          onClick={() => setMenuOpen(o => !o)}
          aria-expanded={menuOpen}
          aria-haspopup="true"
          aria-controls="user-menu"
        >
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent
                          flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="hidden sm:block text-left min-w-0">
            <p className="text-caption font-medium text-content-primary truncate max-w-28">
              {user.email.split('@')[0]}
            </p>
            <p className="text-xs text-content-secondary">
              {ROLE_LABELS[user.role] ?? user.role}
            </p>
          </div>
          <ChevronDown className="w-4 h-4 text-content-secondary hidden sm:block" aria-hidden="true" />
        </button>

        {/* Dropdown */}
        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setMenuOpen(false)}
              aria-hidden="true"
            />
            <div
              id="user-menu"
              role="menu"
              className="absolute right-0 top-full mt-1 w-48 bg-surface-card rounded-xl
                         border border-surface-border shadow-modal z-20 py-1 animate-fade-in"
            >
              <div className="px-3 py-2 border-b border-surface-border">
                <p className="text-caption font-medium text-content-primary truncate">{user.email}</p>
                <p className="text-xs text-content-secondary">{ROLE_LABELS[user.role]}</p>
              </div>
              <button
                role="menuitem"
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-3 py-2 text-body text-red-600
                           hover:bg-red-50 transition-colors duration-100"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
