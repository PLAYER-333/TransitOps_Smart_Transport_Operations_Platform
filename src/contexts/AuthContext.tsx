import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, IS_DEMO_MODE } from '@/lib/supabase'
import { DEMO_USER } from '@/lib/demoData'

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
  isDemo: boolean
  signIn: (email: string, password: string, demoRole?: UserRole) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUserRole = useCallback(async (authUser: { id: string; email?: string | null }): Promise<AuthUser | null> => {
    if (IS_DEMO_MODE) return null
    try {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role, region')
        .eq('user_id', authUser.id)
        .single()

      if (!roleData) return null

      return {
        id: authUser.id,
        email: authUser.email ?? '',
        role: (roleData as any).role,
        region: (roleData as any).region,
      }
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    if (IS_DEMO_MODE) {
      // In demo mode, start logged out (let the Login page handle it)
      setLoading(false)
      return
    }

    let mounted = true

    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (!mounted) return
      setSession(s)
      if (s?.user) {
        const authUser = await fetchUserRole(s.user)
        if (mounted) setUser(authUser)
      }
      setLoading(false)
    })

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

  const signIn = useCallback(async (email: string, _password: string, demoRole?: UserRole) => {
    if (IS_DEMO_MODE) {
      // Demo login — pick role from email or explicit demoRole param
      const roleMap: Record<string, UserRole> = {
        'manager@transitops.demo': 'fleet_manager',
        'driver@transitops.demo': 'driver',
        'safety@transitops.demo': 'safety_officer',
        'finance@transitops.demo': 'financial_analyst',
      }
      const role = demoRole ?? roleMap[email] ?? 'fleet_manager'
      setUser({ ...DEMO_USER, email, role })
      return { error: null }
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password: _password })
    if (error) {
      return { error: 'Invalid credentials. Please check your email and password.' }
    }
    return { error: null }
  }, [])

  const signOut = useCallback(async () => {
    if (!IS_DEMO_MODE) await supabase.auth.signOut()
    setUser(null)
    setSession(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, session, loading, isDemo: IS_DEMO_MODE, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
