import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { catalogMode, supabase, supabaseConfigurationMessage } from '../lib/supabase'

interface AdminAuthState {
  mode: 'demo' | 'supabase'
  configured: boolean
  user: User | null
  isAdmin: boolean
  loading: boolean
  error: string
  signIn: (email: string, password: string) => Promise<boolean>
  signOut: () => Promise<void>
  clearError: () => void
}

const AdminAuthContext = createContext<AdminAuthState | null>(null)
const SESSION_RESTORE_TIMEOUT_MS = 12000

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(catalogMode === 'supabase')
  const [error, setError] = useState('')
  const membershipCheck = useRef(0)
  const userActionStarted = useRef(false)

  const verifyMembership = useCallback(async (nextUser: User | null): Promise<boolean> => {
    const checkId = ++membershipCheck.current
    setUser(nextUser)
    setIsAdmin(false)
    if (!nextUser || !supabase) return false
    try {
      const { data, error: queryError } = await supabase.from('admin_users').select('user_id').eq('user_id', nextUser.id).maybeSingle()
      if (checkId !== membershipCheck.current) return false
      if (queryError) {
        setError('Administrator access could not be verified. Please try again or contact the project owner.')
        return false
      }
      const authorized = Boolean(data)
      setIsAdmin(authorized)
      setError(authorized ? '' : 'This account is signed in but is not authorized to manage the catalog.')
      return authorized
    } catch {
      if (checkId !== membershipCheck.current) return false
      setError('Administrator access could not be verified. Please try again or contact the project owner.')
      return false
    }
  }, [])

  useEffect(() => {
    if (catalogMode !== 'supabase' || !supabase) { setLoading(false); return }
    let active = true
    let restorationComplete = false
    const timeout = window.setTimeout(() => {
      if (!active || restorationComplete || userActionStarted.current) return
      restorationComplete = true
      membershipCheck.current += 1
      setUser(null)
      setIsAdmin(false)
      setError('Session restoration is taking longer than expected. Please sign in again.')
      setLoading(false)
    }, SESSION_RESTORE_TIMEOUT_MS)
    void supabase.auth.getSession().then(async ({ data, error: sessionError }) => {
      if (!active || restorationComplete || userActionStarted.current) return
      if (sessionError) setError('Could not restore your session. Please sign in again.')
      await verifyMembership(data.session?.user ?? null)
    }).catch(() => {
      if (active && !restorationComplete) setError('Could not restore your session. Please sign in again.')
    }).finally(() => {
      if (active && !restorationComplete) {
        restorationComplete = true
        window.clearTimeout(timeout)
        setLoading(false)
      }
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => {
        if (!active) return
        void verifyMembership(session?.user ?? null).finally(() => {
          if (!active) return
          if (!restorationComplete) {
            restorationComplete = true
            window.clearTimeout(timeout)
          }
          setLoading(false)
        })
      }, 0)
    })
    return () => { active = false; window.clearTimeout(timeout); listener.subscription.unsubscribe() }
  }, [verifyMembership])

  const signIn = useCallback(async (email: string, password: string): Promise<boolean> => {
    if (!supabase) { setError(supabaseConfigurationMessage); return false }
    userActionStarted.current = true
    membershipCheck.current += 1
    setLoading(true); setError('')
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError || !data.user) {
        setError('Sign-in failed. Check your email and password, then try again.')
        return false
      }
      return await verifyMembership(data.user)
    } catch { setError('Sign-in failed. Check your email and password, then try again.'); return false }
    finally { setLoading(false) }
  }, [verifyMembership])

  const signOut = useCallback(async () => {
    if (!supabase) return
    userActionStarted.current = true
    membershipCheck.current += 1
    setLoading(true)
    try { const { error: signOutError } = await supabase.auth.signOut(); if (signOutError) throw signOutError; setUser(null); setIsAdmin(false); setError('') }
    catch { setError('Sign out failed. Please try again.') }
    finally { setLoading(false) }
  }, [])

  return <AdminAuthContext.Provider value={{ mode: catalogMode, configured: Boolean(supabase), user, isAdmin, loading, error, signIn, signOut, clearError: () => setError('') }}>{children}</AdminAuthContext.Provider>
}

export function useAdminAuth() {
  const value = useContext(AdminAuthContext)
  if (!value) throw new Error('useAdminAuth must be used inside AdminAuthProvider')
  return value
}
