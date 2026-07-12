import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export type UserRole = 'fleet_manager' | 'driver' | 'safety_officer' | 'financial_analyst'

interface AuthUser {
  id: string
  email: string
  role: UserRole
  region: string | null
}

interface AuthContextValue {
  user: AuthUser | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  /**
   * Fetch role from the server-controlled user_roles table.
   * Role is NEVER read from the JWT claim — only from this table + RLS.
   */
  const fetchUserRole = useCallback(async (authUser: User): Promise<AuthUser | null> => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role, region')
      .eq('user_id', authUser.id)
      .single()

    if (error || !data) {
      // User has no role assigned — treat as unauthenticated
      return null
    }

    return {
      id: authUser.id,
      email: authUser.email ?? '',
      role: data.role,
      region: data.region,
    }
  }, [])

  useEffect(() => {
    let mounted = true

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (!mounted) return
      setSession(s)
      if (s?.user) {
        const authUser = await fetchUserRole(s.user)
        if (mounted) setUser(authUser)
      }
      setLoading(false)
    })

    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, s) => {
        if (!mounted) return
        setSession(s)
        if (s?.user) {
          const authUser = await fetchUserRole(s.user)
          setUser(authUser)
        } else {
          setUser(null)
        }
        setLoading(false)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [fetchUserRole])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      // Return generic message — do not expose internal error details to client
      return { error: 'Invalid credentials. Please check your email and password.' }
    }
    return { error: null }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
