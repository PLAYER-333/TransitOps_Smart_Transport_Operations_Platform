/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

export const IS_DEMO_MODE = !supabaseUrl || !supabaseAnonKey ||
  supabaseUrl === 'https://your-project-ref.supabase.co'

// Always create the client — even in demo mode (it will just fail on real calls,
// which the demo mocks intercept before reaching the network).
export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: !IS_DEMO_MODE,
      autoRefreshToken: !IS_DEMO_MODE,
      detectSessionInUrl: !IS_DEMO_MODE,
    },
  }
)
