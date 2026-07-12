import { Navigate, useLocation } from 'react-router-dom'
import { useAuth, type UserRole } from '@/contexts/AuthContext'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface ProtectedRouteProps {
  children: React.ReactNode
}

/**
 * Redirects unauthenticated users to /login.
 * Shows a spinner while session is being resolved.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-bg">
        <LoadingSpinner size="lg" label="Authenticating…" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

interface RoleGuardProps {
  allowedRoles: UserRole[]
  children: React.ReactNode
  /** If true, renders null instead of 403 when role is not allowed */
  silent?: boolean
}

/**
 * Renders a 403 page when the user's role is not in allowedRoles.
 * This is a UI convenience only — RLS policies enforce access at the DB level.
 */
export function RoleGuard({ allowedRoles, children, silent = false }: RoleGuardProps) {
  const { user } = useAuth()

  if (!user) return <Navigate to="/login" replace />

  if (!allowedRoles.includes(user.role)) {
    if (silent) return null
    return <Navigate to="/403" replace />
  }

  return <>{children}</>
}
