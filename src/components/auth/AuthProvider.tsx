import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { createClient, SupabaseClient, Session, User } from '@supabase/supabase-js'

/**
 * ---------------------------------------------
 * Single Supabase client (browser)
 * ---------------------------------------------
 * Replace VITE_* with your env vars.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// Ensure a single client instance across HMR
let _client: SupabaseClient | null = null
export function getSupabaseClient(): SupabaseClient {
  if (!_client) {
    _client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true, // parses access_token from invite/reset links
      },
    })
  }
  return _client
}

/**
 * ---------------------------------------------
 * Auth Context types
 * ---------------------------------------------
 */
export type AuthContextValue = {
  supabase: SupabaseClient
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
  signOut: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * ---------------------------------------------
 * AuthProvider
 * ---------------------------------------------
 * - Boots Supabase client
 * - Tracks session & user
 * - Subscribes to auth state changes (invite/reset/login/logout)
 * - Exposes helpers to the app
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => getSupabaseClient(), [])
  const mounted = useRef(false)

  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Helper: clean auth tokens from URL after Supabase consumes them
  const cleanAuthParamsFromUrl = () => {
    const url = new URL(window.location.href)
    const hasHashToken = url.hash.includes('access_token') || url.hash.includes('type=')
    const hasQueryToken = url.searchParams.has('token_hash') || url.searchParams.has('code')
    if (hasHashToken || hasQueryToken) {
      // keep pathname & search (without token params), drop hash
      if (hasQueryToken) {
        // Remove known auth params from query
        url.searchParams.delete('token_hash')
        url.searchParams.delete('type')
        url.searchParams.delete('code')
      }
      window.history.replaceState({}, '', url.pathname + (url.search ? `?${url.searchParams.toString()}` : ''))
    }
  }

  // Initial load: get current session (handles invite/reset redirect)
  useEffect(() => {
    let isActive = true
    ;(async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (!isActive) return
        if (error) throw error
        setSession(data.session)
        setUser(data.session?.user ?? null)
      } catch (e: any) {
        setError(e?.message ?? 'Failed to load session')
      } finally {
        setLoading(false)
        mounted.current = true
        // Clean URL after initial processing
        if (typeof window !== 'undefined') cleanAuthParamsFromUrl()
      }
    })()

    // Subscribe to auth changes (SIGNED_IN after invite/reset)
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s)
      setUser(s?.user ?? null)
      if (!mounted.current) {
        // Initial event after URL token parsing
        setLoading(false)
        mounted.current = true
        if (typeof window !== 'undefined') cleanAuthParamsFromUrl()
      }
    })

    return () => {
      isActive = false
      sub.subscription.unsubscribe()
    }
  }, [supabase])

  const signOut = async () => {
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setSession(null)
      setUser(null)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to sign out')
    } finally {
      setLoading(false)
    }
  }

  const refresh = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase.auth.getSession()
      if (error) throw error
      setSession(data.session)
      setUser(data.session?.user ?? null)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to refresh session')
    } finally {
      setLoading(false)
    }
  }

  const value: AuthContextValue = {
    supabase,
    user,
    session,
    loading,
    error,
    signOut,
    refresh,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Hook to consume auth context safely
 */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}

/**
 * Example usage (App root):
 * 
 * <AuthProvider>
 *   <Router />
 * </AuthProvider>
 */
